import { NextRequest, NextResponse } from "next/server";
import { getStreamUrl } from "@/lib/ytdl";
import type { Format, GetStreamsSuccess, Quality } from "@/lib/types";

const VALID_FORMATS: Format[] = ["MP4", "MOV", "MP3", "WAV"];

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "unknown", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { url, format, quality } = body as {
    url?: unknown;
    format?: unknown;
    quality?: unknown;
  };

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      { ok: false, code: "invalid_url", message: "url is required and must be a string." },
      { status: 400 }
    );
  }

  if (!ytdlValidUrl(url)) {
    return NextResponse.json(
      { ok: false, code: "invalid_url", message: "url must be a valid YouTube URL." },
      { status: 400 }
    );
  }

  if (typeof format !== "string" || !VALID_FORMATS.includes(format as Format)) {
    return NextResponse.json(
      { ok: false, code: "unknown", message: `format must be one of: ${VALID_FORMATS.join(", ")}.` },
      { status: 400 }
    );
  }

  if (typeof quality !== "string" || !quality.trim()) {
    return NextResponse.json(
      { ok: false, code: "unknown", message: "quality is required." },
      { status: 400 }
    );
  }

  try {
    const result = await getStreamUrl(url.trim(), format as Format, quality as Quality);

    if (!result.ok) {
      const httpStatus =
        result.code === "phase2_required" ? 422 :
        result.code === "no_stream" ? 404 : 500;

      return NextResponse.json(
        { ok: false, code: result.code === "phase2_required" ? "phase2_only" : result.code, message: result.message },
        { status: httpStatus, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Shape the success response for the client. All three kinds share common
    // metadata fields (title/thumbnail/duration/fileName/mimeType/fileSizeBytes).
    let payload: GetStreamsSuccess;
    if (result.kind === "single") {
      payload = {
        ok: true,
        kind: "single",
        title: result.title,
        fileName: result.fileName,
        mimeType: result.mimeType,
        downloadUrl: result.downloadUrl,
        fileSizeBytes: result.fileSizeBytes,
        thumbnail: result.thumbnail,
        duration: result.duration,
      };
    } else if (result.kind === "merge") {
      payload = {
        ok: true,
        kind: "merge",
        title: result.title,
        fileName: result.fileName,
        mimeType: result.mimeType,
        videoUrl: result.videoUrl,
        videoMime: result.videoMime,
        audioUrl: result.audioUrl,
        audioMime: result.audioMime,
        fileSizeBytes: result.fileSizeBytes,
        thumbnail: result.thumbnail,
        duration: result.duration,
      };
    } else {
      payload = {
        ok: true,
        kind: "transcode",
        title: result.title,
        fileName: result.fileName,
        mimeType: result.mimeType,
        audioUrl: result.audioUrl,
        audioMime: result.audioMime,
        targetFormat: result.targetFormat,
        targetBitrate: result.targetBitrate,
        targetCodec: result.targetCodec,
        targetSampleRate: result.targetSampleRate,
        fileSizeBytes: result.fileSizeBytes,
        thumbnail: result.thumbnail,
        duration: result.duration,
      };
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isNetworkErr =
      message.includes("ENOTFOUND") ||
      message.includes("ECONNREFUSED") ||
      message.includes("fetch");

    return NextResponse.json(
      {
        ok: false,
        code: isNetworkErr ? "network_error" : "unknown",
        message: isNetworkErr
          ? "Could not reach YouTube. Check network connectivity."
          : message,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function ytdlValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    );
  } catch {
    return false;
  }
}
