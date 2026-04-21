"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// ---------------------------------------------------------------------------
// ffmpeg.wasm singleton loader (multithreaded build, ~30MB wasm).
//
// The `-mt` build uses SharedArrayBuffer + Web Workers, giving ~2-3x encode
// speed over the single-threaded build. It requires COOP/COEP to be set on
// the hosting document (see next.config.ts).
//
// We lazy-load on first use and cache the fetched core/wasm blobs in the
// browser's blob URL cache, so subsequent calls within the same session
// don't re-download. The instance is kept in module scope — idempotent.
// ---------------------------------------------------------------------------

// core-mt 0.12.10 is compatible with @ffmpeg/ffmpeg 0.12.15.
const CORE_VERSION = "0.12.10";
const CORE_CDN = `https://unpkg.com/@ffmpeg/core-mt@${CORE_VERSION}/dist/esm`;

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export type LoadProgressHandler = (percent: number) => void;

/**
 * Returns a loaded, ready-to-use FFmpeg instance. Safe to call concurrently:
 * all callers share the same load promise. Subsequent calls after successful
 * load resolve instantly with the cached instance.
 */
export async function getFfmpeg(
  onProgress?: LoadProgressHandler
): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    // Fetch core JS + wasm + worker as blob URLs so the browser doesn't trip
    // on cross-origin worker loading under COEP.
    const report = (p: number) => {
      onProgress?.(Math.max(0, Math.min(100, Math.round(p))));
    };

    report(5);
    const coreURL = await toBlobURL(
      `${CORE_CDN}/ffmpeg-core.js`,
      "text/javascript"
    );
    report(30);
    const wasmURL = await toBlobURL(
      `${CORE_CDN}/ffmpeg-core.wasm`,
      "application/wasm"
    );
    report(75);
    const workerURL = await toBlobURL(
      `${CORE_CDN}/ffmpeg-core.worker.js`,
      "text/javascript"
    );
    report(90);

    await ffmpeg.load({ coreURL, wasmURL, workerURL });
    report(100);

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    // Reset so the next call can retry from scratch.
    loadPromise = null;
    ffmpegInstance = null;
    throw err;
  }
}

/** True once the wasm module is fully loaded and ready to exec commands. */
export function isFfmpegLoaded(): boolean {
  return ffmpegInstance !== null;
}

/** Low-level: run an ffmpeg command. Assumes getFfmpeg() already resolved. */
export async function execFfmpeg(
  ffmpeg: FFmpeg,
  args: string[],
  onProgress?: LoadProgressHandler
): Promise<void> {
  const handler = ({ progress }: { progress: number; time: number }) => {
    onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))));
  };
  if (onProgress) ffmpeg.on("progress", handler);
  try {
    await ffmpeg.exec(args);
  } finally {
    if (onProgress) ffmpeg.off("progress", handler);
  }
}
