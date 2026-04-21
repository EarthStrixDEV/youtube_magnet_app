"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueueStore } from "@/stores/queue-store";
import { useToastStore } from "@/stores/toast-store";
import { useLocaleStore } from "@/stores/locale-store";
import { getT } from "@/hooks/use-t";
import { useFfmpeg } from "@/hooks/use-ffmpeg";
import type { GetStreamsResponse, GetStreamsSuccess } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the given URL and return its bytes, reporting progress (0..100) as
 * bytes arrive. Respects the abort signal. `fallbackBytes` is used for the
 * progress denominator if the response lacks Content-Length.
 */
async function fetchWithProgress(
  url: string,
  signal: AbortSignal,
  onProgress: (pct: number) => void,
  fallbackBytes = 0
): Promise<Uint8Array> {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

  const contentLength =
    Number(response.headers.get("Content-Length")) || fallbackBytes || 0;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (contentLength > 0) {
      onProgress(Math.min(99, Math.round((received / contentLength) * 100)));
    }
  }

  // Concat chunks into a single Uint8Array.
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function triggerBrowserSave(bytes: Uint8Array, mimeType: string, fileName: string): void {
  // Cast to ArrayBuffer — Uint8Array backed by a SharedArrayBuffer would not
  // be accepted by the Blob constructor; ffmpeg outputs on a regular ArrayBuffer.
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDownload() {
  const activeWorkers = useRef<Map<string, AbortController>>(new Map());
  const fillWorkerSlotsRef = useRef<() => void>(() => {});
  const ffmpeg = useFfmpeg();
  const ffmpegRef = useRef(ffmpeg);
  useEffect(() => {
    ffmpegRef.current = ffmpeg;
  }, [ffmpeg]);

  const downloadItem = useCallback((itemId: string) => {
    const store = useQueueStore.getState();
    const item = store.items.find((i) => i.id === itemId);
    if (!item || item.status !== "queued") return;

    const abortController = new AbortController();
    activeWorkers.current.set(itemId, abortController);
    store.markItemStatus(itemId, "downloading");

    const finish = () => {
      activeWorkers.current.delete(itemId);
      fillWorkerSlotsRef.current();
    };

    (async () => {
      const t = getT(useLocaleStore.getState().locale);

      // ---- Step 1: resolve stream URL(s) from backend ----
      let streamsRes: GetStreamsResponse;
      try {
        const res = await fetch("/api/get-streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, format: item.format, quality: item.quality }),
          signal: abortController.signal,
        });
        streamsRes = (await res.json()) as GetStreamsResponse;
      } catch (err) {
        if ((err as Error).name === "AbortError") { finish(); return; }
        useQueueStore.getState().markItemError(itemId, (err as Error).message || "Network error");
        useToastStore.getState().addToast({
          title: t("toast.downloadFailed"),
          message: (err as Error).message || t("toast.downloadError"),
          type: "error",
        });
        finish();
        return;
      }

      if (!streamsRes.ok) {
        const userMsg =
          streamsRes.code === "phase2_only"
            ? "This format requires merging (Phase 2). Try MP4 720p or MP3."
            : streamsRes.message;
        useQueueStore.getState().markItemError(itemId, userMsg);
        useToastStore.getState().addToast({
          title: t("toast.downloadFailed"),
          message: userMsg,
          type: "error",
        });
        finish();
        return;
      }

      // ---- Step 2: branch on kind ----
      try {
        if (streamsRes.kind === "single") {
          await runSingle(itemId, streamsRes, abortController.signal);
        } else if (streamsRes.kind === "merge") {
          await runMerge(itemId, streamsRes, abortController.signal, ffmpegRef.current);
        } else {
          await runTranscode(itemId, streamsRes, abortController.signal, ffmpegRef.current);
        }

        useQueueStore.getState().markItemStatus(itemId, "complete");
        const doneItem = useQueueStore.getState().items.find((x) => x.id === itemId);
        useToastStore.getState().addToast({
          title: t("toast.downloadComplete"),
          message: doneItem?.title || t("toast.downloadSuccess"),
          type: "success",
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") { finish(); return; }
        const msg = (err as Error).message || "Download error";
        useQueueStore.getState().markItemError(itemId, msg);
        useToastStore.getState().addToast({
          title: t("toast.downloadFailed"),
          message: msg,
          type: "error",
        });
      } finally {
        finish();
      }
    })();
  }, []);

  const fillWorkerSlots = useCallback(() => {
    const store = useQueueStore.getState();
    const { parallelWorkers } = store;
    const currentActive = activeWorkers.current.size;
    const slotsAvailable = parallelWorkers - currentActive;

    if (slotsAvailable <= 0) return;

    const queued = store.items.filter(
      (i) => i.status === "queued" && i.selected && !activeWorkers.current.has(i.id)
    );
    const toStart = queued.slice(0, slotsAvailable);

    if (toStart.length === 0 && currentActive === 0) {
      store.setIsDownloading(false);
      return;
    }

    toStart.forEach((item) => downloadItem(item.id));
  }, [downloadItem]);

  useEffect(() => {
    fillWorkerSlotsRef.current = fillWorkerSlots;
  }, [fillWorkerSlots]);

  const startAll = useCallback(() => {
    const store = useQueueStore.getState();
    const hasQueued = store.items.some((i) => i.status === "queued" && i.selected);
    if (!hasQueued) return;

    store.setIsDownloading(true);
    fillWorkerSlots();
  }, [fillWorkerSlots]);

  const startSingle = useCallback(
    (itemId: string) => {
      const store = useQueueStore.getState();
      store.setIsDownloading(true);
      downloadItem(itemId);
    },
    [downloadItem]
  );

  const cancelItem = useCallback((itemId: string) => {
    const controller = activeWorkers.current.get(itemId);
    if (controller) {
      controller.abort();
      activeWorkers.current.delete(itemId);
    }
  }, []);

  return { startAll, startSingle, cancelItem };
}

// ---------------------------------------------------------------------------
// Per-kind runners
// ---------------------------------------------------------------------------

type UseFfmpegApi = ReturnType<typeof useFfmpeg>;

async function runSingle(
  itemId: string,
  r: Extract<GetStreamsSuccess, { kind: "single" }>,
  signal: AbortSignal
): Promise<void> {
  const bytes = await fetchWithProgress(
    r.downloadUrl,
    signal,
    (pct) => useQueueStore.getState().updateItemProgress(itemId, pct),
    r.fileSizeBytes
  );
  triggerBrowserSave(bytes, r.mimeType, r.fileName);
}

async function runMerge(
  itemId: string,
  r: Extract<GetStreamsSuccess, { kind: "merge" }>,
  signal: AbortSignal,
  ffmpeg: UseFfmpegApi
): Promise<void> {
  const t = getT(useLocaleStore.getState().locale);
  const store = useQueueStore.getState();

  // Download stage: 2 parts, each 50% of the 0-99 range.
  const videoBytes = await fetchWithProgress(
    r.videoUrl,
    signal,
    (pct) => store.updateItemProgress(itemId, Math.round(pct * 0.5)),
    Math.round(r.fileSizeBytes * 0.75) // rough: video is usually ~75% of total
  );
  const audioBytes = await fetchWithProgress(
    r.audioUrl,
    signal,
    (pct) => store.updateItemProgress(itemId, 50 + Math.round(pct * 0.5)),
    Math.round(r.fileSizeBytes * 0.25)
  );

  // Processing stage: load ffmpeg (may show "Preparing encoder..." to user)
  // and mux the two tracks. Stream-copy keeps this fast (seconds, not minutes).
  if (!ffmpeg.isLoaded) {
    store.setItemProcessingLabel(itemId, t("status.preparingEncoder"));
  } else {
    store.setItemProcessingLabel(itemId, t("status.merging"));
  }
  useQueueStore.getState().markItemStatus(itemId, "processing");
  store.setItemProcessingLabel(itemId, ffmpeg.isLoaded ? t("status.merging") : t("status.preparingEncoder"));

  await ffmpeg.load();
  useQueueStore.getState().setItemProcessingLabel(itemId, t("status.merging"));

  const out = await ffmpeg.merge({
    video: videoBytes,
    audio: audioBytes,
    onProgress: (pct) => useQueueStore.getState().updateItemProgress(itemId, Math.min(99, pct)),
  });

  triggerBrowserSave(out, r.mimeType, r.fileName);
}

async function runTranscode(
  itemId: string,
  r: Extract<GetStreamsSuccess, { kind: "transcode" }>,
  signal: AbortSignal,
  ffmpeg: UseFfmpegApi
): Promise<void> {
  const t = getT(useLocaleStore.getState().locale);
  const store = useQueueStore.getState();

  const audioBytes = await fetchWithProgress(
    r.audioUrl,
    signal,
    (pct) => store.updateItemProgress(itemId, pct),
    r.fileSizeBytes
  );

  // Transition into processing.
  useQueueStore.getState().markItemStatus(itemId, "processing");
  useQueueStore.getState().setItemProcessingLabel(
    itemId,
    ffmpeg.isLoaded
      ? r.targetFormat === "mp3"
        ? t("status.transcodingMp3")
        : t("status.transcodingWav")
      : t("status.preparingEncoder")
  );

  await ffmpeg.load();
  useQueueStore.getState().setItemProcessingLabel(
    itemId,
    r.targetFormat === "mp3" ? t("status.transcodingMp3") : t("status.transcodingWav")
  );

  const out = await ffmpeg.transcode({
    input: audioBytes,
    targetFormat: r.targetFormat,
    targetBitrate: r.targetBitrate,
    targetCodec: r.targetCodec,
    targetSampleRate: r.targetSampleRate,
    onProgress: (pct) => useQueueStore.getState().updateItemProgress(itemId, Math.min(99, pct)),
  });

  triggerBrowserSave(out, r.mimeType, r.fileName);
}
