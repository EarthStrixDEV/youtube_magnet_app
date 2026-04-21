"use client";

import { useCallback, useRef, useState } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import {
  execFfmpeg,
  getFfmpeg,
  isFfmpegLoaded,
} from "@/lib/ffmpeg-client";

// ---------------------------------------------------------------------------
// useFfmpeg — React hook exposing a lazy-loaded, singleton ffmpeg.wasm.
//
// `load()` is idempotent: concurrent callers share the same load promise.
// Once loaded, the instance persists for the lifetime of the page.
// ---------------------------------------------------------------------------

export interface UseFfmpegApi {
  load: () => Promise<FFmpeg>;
  isLoaded: boolean;
  loadingProgress: number;
  error: string | null;
  /**
   * Merge a video-only and an audio-only track with stream-copy (fast; no
   * re-encode). Returns the output file bytes.
   */
  merge: (args: {
    video: Uint8Array;
    audio: Uint8Array;
    onProgress?: (pct: number) => void;
  }) => Promise<Uint8Array>;
  /**
   * Transcode an audio-only file. For MP3, pass `targetBitrate` like "320k".
   * For WAV, pass `targetCodec` ("pcm_s16le"/"pcm_s24le") and optionally
   * `targetSampleRate` (e.g. 44100 for 16-bit CD quality).
   */
  transcode: (args: {
    input: Uint8Array;
    targetFormat: "mp3" | "wav";
    targetBitrate?: string;
    targetCodec?: string;
    targetSampleRate?: number;
    onProgress?: (pct: number) => void;
  }) => Promise<Uint8Array>;
}

export function useFfmpeg(): UseFfmpegApi {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => isFfmpegLoaded());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = useCallback(async (): Promise<FFmpeg> => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setError(null);
    try {
      const inst = await getFfmpeg((p) => setLoadingProgress(p));
      ffmpegRef.current = inst;
      setIsLoaded(true);
      return inst;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  }, []);

  const merge = useCallback(
    async ({
      video,
      audio,
      onProgress,
    }: {
      video: Uint8Array;
      audio: Uint8Array;
      onProgress?: (pct: number) => void;
    }): Promise<Uint8Array> => {
      const ffmpeg = await load();
      await ffmpeg.writeFile("v.mp4", video);
      await ffmpeg.writeFile("a.m4a", audio);
      try {
        // Stream copy: no re-encode. Works because YouTube's h264/aac streams
        // are already compatible with the MP4 container.
        await execFfmpeg(
          ffmpeg,
          [
            "-i", "v.mp4",
            "-i", "a.m4a",
            "-c", "copy",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "out.mp4",
          ],
          onProgress
        );
        const data = (await ffmpeg.readFile("out.mp4")) as Uint8Array;
        return data;
      } finally {
        // Best-effort cleanup so the virtual FS doesn't balloon on repeat use.
        try { await ffmpeg.deleteFile("v.mp4"); } catch { /* ignore */ }
        try { await ffmpeg.deleteFile("a.m4a"); } catch { /* ignore */ }
        try { await ffmpeg.deleteFile("out.mp4"); } catch { /* ignore */ }
      }
    },
    [load]
  );

  const transcode = useCallback(
    async ({
      input,
      targetFormat,
      targetBitrate,
      targetCodec,
      targetSampleRate,
      onProgress,
    }: {
      input: Uint8Array;
      targetFormat: "mp3" | "wav";
      targetBitrate?: string;
      targetCodec?: string;
      targetSampleRate?: number;
      onProgress?: (pct: number) => void;
    }): Promise<Uint8Array> => {
      const ffmpeg = await load();
      const inName = "in.m4a";
      const outName = targetFormat === "mp3" ? "out.mp3" : "out.wav";
      await ffmpeg.writeFile(inName, input);
      try {
        const args: string[] = ["-i", inName, "-vn"];
        if (targetFormat === "mp3") {
          args.push("-c:a", "libmp3lame");
          if (targetBitrate) args.push("-b:a", targetBitrate);
        } else {
          args.push("-c:a", targetCodec ?? "pcm_s16le");
          if (targetSampleRate) args.push("-ar", String(targetSampleRate));
        }
        args.push(outName);
        await execFfmpeg(ffmpeg, args, onProgress);
        const data = (await ffmpeg.readFile(outName)) as Uint8Array;
        return data;
      } finally {
        try { await ffmpeg.deleteFile(inName); } catch { /* ignore */ }
        try { await ffmpeg.deleteFile(outName); } catch { /* ignore */ }
      }
    },
    [load]
  );

  return { load, isLoaded, loadingProgress, error, merge, transcode };
}
