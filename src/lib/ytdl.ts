import { Innertube, Platform, ClientType } from "youtubei.js";
import { extractVideoId } from "@/lib/constants";
import type { TranscodeTargetFormat } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "").trim();
}

/** Parse numeric height from strings like "1080p", "720p (Full HD)", "2160p (4K)" */
function parseHeight(quality: string): number {
  const match = quality.match(/(\d+)p/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Parse bitrate string like "320 kbps" -> "320k" (ffmpeg format). */
function parseBitrate(quality: string): string | undefined {
  const match = quality.match(/(\d+)\s*kbps/i);
  return match ? `${match[1]}k` : undefined;
}

const AUDIO_QUALITY_STRINGS = ["320 kbps", "256 kbps", "192 kbps", "128 kbps"];

/**
 * Build a proxy URL for a YouTube CDN stream.
 *
 * @param rawUrl  - Deciphered googlevideo.com URL
 * @param fileName - Suggested download filename
 * @param client  - YouTube client that generated the URL: "mweb" for adaptive
 *                  streams (merge/transcode), "web" for combined streams (single),
 *                  "android" for ANDROID client fallback adaptive streams.
 *                  The proxy uses this to set the matching User-Agent so the CDN
 *                  does not reject the request with 403.
 */
function toProxyUrl(rawUrl: string, fileName: string, client: "mweb" | "web" | "android"): string {
  return `/api/proxy?u=${encodeURIComponent(rawUrl)}&fn=${encodeURIComponent(fileName)}&ua=${client}`;
}

// ---------------------------------------------------------------------------
// Platform evaluator — required so youtubei.js can decipher n-parameter URLs.
// ---------------------------------------------------------------------------

let evaluatorPatched = false;

function ensureEvaluator(): void {
  if (evaluatorPatched) return;
  const current = Platform.shim;
  Platform.load({
    ...current,
    eval: async (
      code: { output: string; exported: string[]; exportedRawValues?: Record<string, unknown> },
      env: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      const fn = new Function(...Object.keys(env), code.output) as (...args: unknown[]) => Record<string, unknown>;
      return fn(...Object.values(env));
    },
  });
  evaluatorPatched = true;
}

async function createInnertube(): Promise<Innertube> {
  ensureEvaluator();
  return Innertube.create({ generate_session_locally: true });
}

/**
 * Create an Innertube instance using the MWEB client.
 *
 * YouTube's WEB client uses SABR (Server-side Adaptive Bitrate) for adaptive
 * formats — `adaptive_formats` entries no longer carry individual `url`,
 * `cipher`, or `signature_cipher` values, only a single `server_abr_streaming_url`
 * that speaks a binary protocol. The MWEB client is unaffected and still
 * returns classic per-format direct URLs for both video-only and audio-only
 * adaptive streams. We use this client for any merge / transcode path that
 * needs to decipher individual adaptive format URLs.
 */
async function createInnertubeAdaptive(): Promise<Innertube> {
  ensureEvaluator();
  return Innertube.create({
    generate_session_locally: true,
    client_type: ClientType.MWEB,
  });
}

/**
 * Create an Innertube instance using the ANDROID client.
 *
 * Fallback for when MWEB adaptive_formats are empty or SABR-only (which can
 * happen for data-center IPs on Vercel). The Android app client is less likely
 * to be gated behind SABR treatment and still returns per-format direct URLs.
 */
async function createInnertubeAndroid(): Promise<Innertube> {
  ensureEvaluator();
  return Innertube.create({
    generate_session_locally: true,
    client_type: ClientType.ANDROID,
  });
}

// ---------------------------------------------------------------------------
// getMetadata
// ---------------------------------------------------------------------------

export interface VideoMetadata {
  title: string;
  duration: string;
  thumbnail: string;
  fileSizeMB: number;
}

export async function getMetadata(url: string): Promise<VideoMetadata> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const yt = await createInnertube();
  const info = await yt.getInfo(videoId);
  const basic = info.basic_info;

  const durationSec = basic.duration ?? 0;
  const duration = formatDuration(durationSec);

  const thumbnails = basic.thumbnail ?? [];
  const thumbnail =
    thumbnails.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";

  const formats = info.streaming_data?.formats ?? [];
  const adaptiveFormats = info.streaming_data?.adaptive_formats ?? [];

  const combined = formats
    .filter((f) => f.has_video && f.has_audio && f.content_length)
    .sort((a, b) => (b.content_length ?? 0) - (a.content_length ?? 0))[0];

  let fileSizeBytes = 0;
  if (combined?.content_length) {
    fileSizeBytes = combined.content_length;
  } else {
    const bestVideo = adaptiveFormats
      .filter((f) => f.has_video && !f.has_audio && f.content_length)
      .sort((a, b) => (b.content_length ?? 0) - (a.content_length ?? 0))[0];
    const bestAudio = adaptiveFormats
      .filter((f) => !f.has_video && f.has_audio && f.content_length)
      .sort((a, b) => (b.content_length ?? 0) - (a.content_length ?? 0))[0];
    fileSizeBytes =
      (bestVideo?.content_length ?? 0) + (bestAudio?.content_length ?? 0);
  }

  const fileSizeMB = Math.round((fileSizeBytes / (1024 * 1024)) * 10) / 10;

  return {
    title: basic.title ?? "Unknown Title",
    duration,
    thumbnail,
    fileSizeMB,
  };
}

// ---------------------------------------------------------------------------
// getStreamUrl
// ---------------------------------------------------------------------------

export interface StreamSingle {
  ok: true;
  kind: "single";
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface StreamMerge {
  ok: true;
  kind: "merge";
  videoUrl: string;
  videoMime: string;
  audioUrl: string;
  audioMime: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface StreamTranscode {
  ok: true;
  kind: "transcode";
  audioUrl: string;
  audioMime: string;
  targetFormat: TranscodeTargetFormat;
  targetBitrate?: string;
  targetCodec?: string;
  targetSampleRate?: number;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface StreamError {
  ok: false;
  code: "phase2_required" | "no_stream" | "network_error";
  message: string;
}

export type StreamResult =
  | StreamSingle
  | StreamMerge
  | StreamTranscode
  | StreamError;

// ---------------------------------------------------------------------------
// Phase 2: high-quality path
//   * MP4 ≤ best combined → single (fast path, unchanged)
//   * MP4 > best combined → merge (video-only + audio-only, client ffmpeg mux)
//   * MOV → merge, just rename container to .mov
//   * MP3 / WAV → transcode (audio-only + client ffmpeg encode)
// ---------------------------------------------------------------------------

export async function getStreamUrl(
  url: string,
  format: string,
  quality: string
): Promise<StreamResult> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      ok: false,
      code: "no_stream",
      message: "Invalid YouTube URL — could not extract video ID.",
    };
  }

  const wantsAudioOnly =
    format === "MP3" ||
    format === "WAV" ||
    AUDIO_QUALITY_STRINGS.includes(quality) ||
    quality.toLowerCase().includes("audio");

  // YouTube's WEB client uses SABR (Server-side Adaptive Bitrate) for adaptive
  // formats — adaptive_formats entries no longer carry direct URLs or cipher
  // params. We always fetch an MWEB client in parallel: MWEB still returns
  // classic per-format URLs. WEB remains authoritative for metadata and
  // combined (muxed) streams. The two fetches run in parallel so there is no
  // added sequential latency.
  const [yt, ytAdaptive] = await Promise.all([
    createInnertube(),
    createInnertubeAdaptive(),
  ]);

  const [webInfo, mwebInfo] = await Promise.all([
    yt.getInfo(videoId),
    ytAdaptive.getBasicInfo(videoId),
  ]);

  // --- Production logging: stream availability diagnostic ---
  const mwebAdaptiveRaw = mwebInfo.streaming_data?.adaptive_formats ?? [];
  console.info("[ytdl] stream availability", {
    videoId,
    requestedFormat: format,
    requestedQuality: quality,
    requestedHeight: parseHeight(quality),
    webCombinedCount: webInfo.streaming_data?.formats?.length ?? 0,
    webAdaptiveCount: webInfo.streaming_data?.adaptive_formats?.length ?? 0,
    mwebCombinedCount: mwebInfo.streaming_data?.formats?.length ?? 0,
    mwebAdaptiveCount: mwebAdaptiveRaw.length,
    mwebVideoOnlyCount: mwebAdaptiveRaw.filter(f => f.has_video && !f.has_audio).length,
    mwebAudioOnlyCount: mwebAdaptiveRaw.filter(f => !f.has_video && f.has_audio).length,
    sampleAdaptive: mwebAdaptiveRaw.slice(0, 3).map(f => ({
      itag: f.itag,
      mime: f.mime_type?.substring(0, 30),
      height: f.height,
      hasUrl: !!f.url,
      hasCipher: !!f.cipher,
      hasSigCipher: !!f.signature_cipher,
      hasSabrUrl: !!(f as { server_abr_streaming_url?: unknown }).server_abr_streaming_url,
      audioBitrate: (f as { audio_bitrate?: unknown }).audio_bitrate,
    })),
  });

  const basic = webInfo.basic_info;

  const title = basic.title ?? "Unknown Title";
  const thumbnails = basic.thumbnail ?? [];
  const thumbnail =
    thumbnails.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";
  const durationSec = basic.duration ?? 0;
  const duration = formatDuration(durationSec);
  const safeTitle = sanitizeFileName(title);

  // combinedAll — from WEB client (combined streams still have direct URLs)
  // adaptiveAll — starts as MWEB; may be replaced by ANDROID if MWEB is empty/SABR-only
  const combinedAll = webInfo.streaming_data?.formats ?? [];

  // --- ANDROID fallback: if MWEB has no video-only adaptive streams, try ANDROID ---
  const mwebHasVideoOnly = mwebAdaptiveRaw.some(f => f.has_video && !f.has_audio);

  let adaptiveAll = mwebAdaptiveRaw;
  let adaptivePlayer = ytAdaptive.session.player;
  let adaptiveSource: "mweb" | "android" = "mweb";

  if (!mwebHasVideoOnly && !wantsAudioOnly) {
    console.warn("[ytdl] MWEB has no video-only streams; falling back to ANDROID client");
    try {
      const ytAndroid = await createInnertubeAndroid();
      const androidInfo = await ytAndroid.getBasicInfo(videoId);
      const androidAdaptive = androidInfo.streaming_data?.adaptive_formats ?? [];
      const androidHasVideoOnly = androidAdaptive.some(f => f.has_video && !f.has_audio);

      console.info("[ytdl] ANDROID adaptive availability", {
        videoId,
        androidAdaptiveCount: androidAdaptive.length,
        androidVideoOnlyCount: androidAdaptive.filter(f => f.has_video && !f.has_audio).length,
        androidAudioOnlyCount: androidAdaptive.filter(f => !f.has_video && f.has_audio).length,
      });

      if (androidHasVideoOnly) {
        adaptiveAll = androidAdaptive;
        adaptivePlayer = ytAndroid.session.player;
        adaptiveSource = "android";
        console.info("[ytdl] ANDROID fallback active — using ANDROID adaptive streams");
      } else {
        console.warn("[ytdl] ANDROID also has no video-only streams — both clients exhausted");
        // Keep MWEB adaptive so the error path below can report real heights.
      }
    } catch (androidErr) {
      const androidErrMsg = androidErr instanceof Error ? androidErr.message : String(androidErr);
      console.error("[ytdl] ANDROID client creation/fetch failed", { error: androidErrMsg });
      // Non-fatal — fall through with empty MWEB adaptive; error path will handle it.
    }
  }

  if (mwebAdaptiveRaw.length > 0 && !mwebAdaptiveRaw[0].url && !mwebAdaptiveRaw[0].signature_cipher) {
    console.error(
      "[ytdl] WARNING: MWEB adaptive_formats still have no URL — YouTube may have extended SABR to MWEB.",
      { itag: mwebAdaptiveRaw[0].itag, has_url: false }
    );
  }

  // -------------------------------------------------------------------------
  // AUDIO-ONLY PATHS (MP3 / WAV → transcode)
  // -------------------------------------------------------------------------
  if (wantsAudioOnly) {
    try {
      // Use MWEB adaptive formats for audio-only; WEB's adaptive_formats lack URLs (SABR).
      const audioFormat =
        mwebAdaptiveRaw
          .filter((f) => !f.has_video && f.has_audio)
          .sort((a, b) => {
            const aM4a = (a.mime_type ?? "").includes("mp4") ? 1 : 0;
            const bM4a = (b.mime_type ?? "").includes("mp4") ? 1 : 0;
            if (aM4a !== bM4a) return bM4a - aM4a;
            return (b.bitrate ?? 0) - (a.bitrate ?? 0);
          })[0] ?? null;

      if (!audioFormat) {
        return { ok: false, code: "no_stream", message: "No audio stream found." };
      }

      console.info("[ytdl] audio-only decipher:", {
        itag: audioFormat.itag,
        mime: audioFormat.mime_type,
        has_url: !!audioFormat.url,
        has_sig_cipher: !!audioFormat.signature_cipher,
      });

      const audioRawUrl = await audioFormat.decipher(ytAdaptive.session.player);
      if (!audioRawUrl) {
        console.error("[ytdl] audio-only decipher returned empty", {
          itag: audioFormat.itag,
          mime: audioFormat.mime_type,
        });
        return { ok: false, code: "no_stream", message: "No audio stream found. Could not decipher URL." };
      }
      const audioMime = audioFormat.mime_type ?? "audio/mp4";
      const audioProxyFileName = `${safeTitle}.m4a`;
      // Audio-only always comes from the MWEB adaptive client.
      const audioProxyUrl = toProxyUrl(audioRawUrl, audioProxyFileName, "mweb");

      // MP3/WAV → transcode kind
      if (format === "MP3") {
        const targetBitrate = parseBitrate(quality) ?? "192k";
        const fileName = `${safeTitle} [${targetBitrate}].mp3`;
        return {
          ok: true,
          kind: "transcode",
          audioUrl: audioProxyUrl,
          audioMime,
          targetFormat: "mp3",
          targetBitrate,
          fileName,
          mimeType: "audio/mpeg",
          fileSizeBytes: audioFormat.content_length ?? 0,
          title,
          thumbnail,
          duration,
        };
      }

      if (format === "WAV") {
        const is24Bit = /24-?bit/i.test(quality);
        const targetCodec = is24Bit ? "pcm_s24le" : "pcm_s16le";
        const targetSampleRate = is24Bit ? undefined : 44100;
        const label = is24Bit ? "24-bit" : "16-bit";
        const fileName = `${safeTitle} [${label}].wav`;
        return {
          ok: true,
          kind: "transcode",
          audioUrl: audioProxyUrl,
          audioMime,
          targetFormat: "wav",
          targetCodec,
          targetSampleRate,
          fileName,
          mimeType: "audio/wav",
          fileSizeBytes: audioFormat.content_length ?? 0,
          title,
          thumbnail,
          duration,
        };
      }

      // Shouldn't reach here, but fall back to single m4a.
      return {
        ok: true,
        kind: "single",
        downloadUrl: audioProxyUrl,
        fileName: audioProxyFileName,
        mimeType: audioMime,
        fileSizeBytes: audioFormat.content_length ?? 0,
        title,
        thumbnail,
        duration,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, code: "no_stream", message: `No audio stream: ${msg}` };
    }
  }

  // -------------------------------------------------------------------------
  // VIDEO PATHS (MP4 / MOV)
  //   Try combined first (fast path). If no combined available at or below
  //   requested height, fall back to merge (video-only + audio-only).
  // -------------------------------------------------------------------------
  const requestedHeight = parseHeight(quality);
  const wantMov = format === "MOV";
  const ext = wantMov ? "mov" : "mp4";

  // Candidate combined streams at ≤ requested height.
  const combinedCandidates = combinedAll
    .filter(
      (f) =>
        f.has_video &&
        f.has_audio &&
        (requestedHeight === 0 || (f.height ?? 0) <= requestedHeight)
    )
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  const bestCombinedHeight = combinedCandidates[0]?.height ?? 0;

  // If the user asked for a quality combined can satisfy, and combined matches
  // the requested height exactly (or is the best combined available and the
  // user asked for ≤360p), serve combined as single.
  const combinedCanSatisfy =
    combinedCandidates.length > 0 &&
    (requestedHeight === 0 ||
      bestCombinedHeight >= requestedHeight ||
      // If caller asks 360p and combined maxes at 360p, that's fine.
      requestedHeight <= bestCombinedHeight);

  // Prefer combined only for MP4 AND when it satisfies the requested height.
  // For MOV, always merge (we still want the ≥720p path + .mov container).
  if (!wantMov && combinedCanSatisfy) {
    try {
      const chosen = combinedCandidates[0];
      const downloadUrl = await chosen.decipher(yt.session.player);
      if (!downloadUrl) {
        return {
          ok: false,
          code: "no_stream",
          message: "Could not decipher combined stream URL.",
        };
      }
      const actualHeight = chosen.height ?? 0;
      const heightLabel = actualHeight > 0 ? ` [${actualHeight}p]` : "";
      const fileName = `${safeTitle}${heightLabel}.${ext}`;
      return {
        ok: true,
        kind: "single",
        // Combined stream comes from the WEB client — use matching desktop UA.
        downloadUrl: toProxyUrl(downloadUrl, fileName, "web"),
        fileName,
        mimeType: "video/mp4",
        fileSizeBytes: chosen.content_length ?? 0,
        title,
        thumbnail,
        duration,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        code: "no_stream",
        message: `Could not decipher combined stream: ${msg}`,
      };
    }
  }

  // ---- Merge path (video-only + audio-only) ----
  try {
    // Pick best video-only at ≤ requested height (prefer mp4 container).
    const videoCandidates = adaptiveAll
      .filter((f) => f.has_video && !f.has_audio)
      .filter(
        (f) =>
          requestedHeight === 0 || (f.height ?? 0) <= requestedHeight
      )
      // Prefer mp4/h264 over webm so stream-copy into MP4 container works.
      .sort((a, b) => {
        const aMp4 = (a.mime_type ?? "").includes("mp4") ? 1 : 0;
        const bMp4 = (b.mime_type ?? "").includes("mp4") ? 1 : 0;
        if (aMp4 !== bMp4) return bMp4 - aMp4;
        return (b.height ?? 0) - (a.height ?? 0);
      });

    const chosenVideo = videoCandidates[0];
    if (!chosenVideo) {
      // Compute the max height actually available across all video-only streams
      // (regardless of the requested height filter) so the error is actionable.
      const allVideoOnlyHeights = adaptiveAll
        .filter(f => f.has_video && !f.has_audio)
        .map(f => f.height)
        .filter((h): h is number => typeof h === "number" && h > 0)
        .sort((a, b) => b - a);

      console.warn("[ytdl] merge candidates none", {
        videoId,
        requestedHeight,
        adaptiveSource,
        allVideoOnlyHeights,
      });

      const maxAvailable = allVideoOnlyHeights[0];
      const message = maxAvailable
        ? `This video's max video-only quality is ${maxAvailable}p. Try selecting ${maxAvailable}p or lower.`
        : `No video-only stream available for merge (client: ${adaptiveSource}). The video may not have adaptive streams.`;

      return { ok: false, code: "no_stream", message };
    }

    // Pick best audio-only (prefer m4a/mp4 for stream-copy compatibility).
    const audioCandidates = adaptiveAll
      .filter((f) => !f.has_video && f.has_audio)
      .sort((a, b) => {
        const aM4a = (a.mime_type ?? "").includes("mp4") ? 1 : 0;
        const bM4a = (b.mime_type ?? "").includes("mp4") ? 1 : 0;
        if (aM4a !== bM4a) return bM4a - aM4a;
        return (b.bitrate ?? 0) - (a.bitrate ?? 0);
      });

    const chosenAudio = audioCandidates[0];
    if (!chosenAudio) {
      return {
        ok: false,
        code: "no_stream",
        message: "No audio-only stream available for merge.",
      };
    }

    console.info("[ytdl] merge decipher:", {
      adaptiveSource,
      video: { itag: chosenVideo.itag, height: chosenVideo.height, mime: chosenVideo.mime_type, has_url: !!chosenVideo.url, has_sig: !!chosenVideo.signature_cipher },
      audio: { itag: chosenAudio.itag, mime: chosenAudio.mime_type, has_url: !!chosenAudio.url, has_sig: !!chosenAudio.signature_cipher },
    });

    const videoRaw = await chosenVideo.decipher(adaptivePlayer);
    if (!videoRaw) {
      console.error("[ytdl] video-only decipher returned empty", {
        itag: chosenVideo.itag, height: chosenVideo.height, mime: chosenVideo.mime_type, adaptiveSource,
      });
      return {
        ok: false,
        code: "no_stream",
        message: `Could not decipher video-only stream (itag ${chosenVideo.itag}, ${chosenVideo.height}p, client: ${adaptiveSource}).`,
      };
    }

    const audioRaw = await chosenAudio.decipher(adaptivePlayer);
    if (!audioRaw) {
      console.error("[ytdl] audio-only decipher returned empty", {
        itag: chosenAudio.itag, mime: chosenAudio.mime_type, adaptiveSource,
      });
      return {
        ok: false,
        code: "no_stream",
        message: `Could not decipher audio-only stream (itag ${chosenAudio.itag}, client: ${adaptiveSource}).`,
      };
    }

    const actualHeight = chosenVideo.height ?? 0;
    const heightLabel = actualHeight > 0 ? ` [${actualHeight}p]` : "";
    const fileName = `${safeTitle}${heightLabel}.${ext}`;
    const videoProxyFn = `${safeTitle}.video.mp4`;
    const audioProxyFn = `${safeTitle}.audio.m4a`;

    const videoMime = chosenVideo.mime_type ?? "video/mp4";
    const audioMime = chosenAudio.mime_type ?? "audio/mp4";
    const totalBytes =
      (chosenVideo.content_length ?? 0) + (chosenAudio.content_length ?? 0);

    return {
      ok: true,
      kind: "merge",
      // Proxy UA must match the client that signed the URLs (mweb or android).
      videoUrl: toProxyUrl(videoRaw, videoProxyFn, adaptiveSource),
      videoMime,
      audioUrl: toProxyUrl(audioRaw, audioProxyFn, adaptiveSource),
      audioMime,
      fileName,
      mimeType: wantMov ? "video/quicktime" : "video/mp4",
      fileSizeBytes: totalBytes,
      title,
      thumbnail,
      duration,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      code: "no_stream",
      message: `Could not prepare merge streams: ${msg}`,
    };
  }
}
