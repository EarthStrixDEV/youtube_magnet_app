"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueueStore } from "@/stores/queue-store";
import { useToastStore } from "@/stores/toast-store";
import { useLocaleStore } from "@/stores/locale-store";
import { getT } from "@/hooks/use-t";

function parseSSE(text: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = text.split("\n\n");
  for (const block of blocks) {
    if (!block.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (data) events.push({ event, data });
  }
  return events;
}

export function useDownload() {
  const activeWorkers = useRef<Map<string, AbortController>>(new Map());
  const fillWorkerSlotsRef = useRef<() => void>(() => {});

  const downloadItem = useCallback((itemId: string) => {
    const store = useQueueStore.getState();
    const item = store.items.find((i) => i.id === itemId);
    if (!item || item.status !== "queued") return;

    const downloadDir = store.downloadDir;
    const isServer = store.deploymentMode === "server";

    if (!isServer && !downloadDir) {
      const t = getT(useLocaleStore.getState().locale);
      store.markItemError(itemId, t("download.setDirFirst"));
      return;
    }

    const abortController = new AbortController();
    activeWorkers.current.set(itemId, abortController);
    store.markItemStatus(itemId, "downloading");

    const params = new URLSearchParams({
      url: item.url,
      format: item.format,
      quality: item.quality,
      ...(downloadDir && { outputDir: downloadDir }),
    });

    fetch(`/api/download?${params}`, { signal: abortController.signal })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by double newlines)
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.trim()) continue;

            const events = parseSSE(part + "\n\n");
            for (const { event, data } of events) {
              try {
                const parsed = JSON.parse(data);
                const s = useQueueStore.getState();

                switch (event) {
                  case "progress":
                    s.updateItemProgress(itemId, parsed.percent);
                    s.updateItem(itemId, {
                      speed: parsed.speed || undefined,
                      eta: parsed.eta || undefined,
                    });
                    break;

                  case "complete": {
                    s.markItemStatus(itemId, "complete");
                    s.updateItem(itemId, {
                      ...(parsed.outputPath && { outputPath: parsed.outputPath }),
                      ...(parsed.downloadToken && { downloadToken: parsed.downloadToken }),
                    });
                    const t = getT(useLocaleStore.getState().locale);
                    const doneItem = s.items.find((x) => x.id === itemId);
                    useToastStore.getState().addToast({
                      title: t("toast.downloadComplete"),
                      message: doneItem?.title || t("toast.downloadSuccess"),
                      type: "success",
                    });
                    activeWorkers.current.delete(itemId);
                    fillWorkerSlotsRef.current();
                    break;
                  }

                  case "error": {
                    s.markItemError(itemId, parsed.message || "Download failed");
                    const tErr = getT(useLocaleStore.getState().locale);
                    const errItem = s.items.find((x) => x.id === itemId);
                    useToastStore.getState().addToast({
                      title: tErr("toast.downloadFailed"),
                      message: errItem?.title || tErr("toast.downloadError"),
                      type: "error",
                    });
                    activeWorkers.current.delete(itemId);
                    fillWorkerSlotsRef.current();
                    break;
                  }
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        const s = useQueueStore.getState();
        s.markItemError(itemId, err.message || "Download failed");
        activeWorkers.current.delete(itemId);
        fillWorkerSlotsRef.current();
      });
  }, []);

  const fillWorkerSlots = useCallback(() => {
    const store = useQueueStore.getState();
    const { parallelWorkers } = store;
    const currentActive = activeWorkers.current.size;
    const slotsAvailable = parallelWorkers - currentActive;

    if (slotsAvailable <= 0) return;

    const queued = store.items.filter(
      (i) => i.status === "queued" && !activeWorkers.current.has(i.id)
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
    const hasQueued = store.items.some((i) => i.status === "queued");
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
