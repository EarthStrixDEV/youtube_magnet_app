"use client";

import { useQueueStore } from "@/stores/queue-store";
import { useDownload } from "@/hooks/use-download";
import { formatFileSize } from "@/lib/constants";
import { useT } from "@/hooks/use-t";

export function ActionBar() {
  const items = useQueueStore((s) => s.items);
  const parallelWorkers = useQueueStore((s) => s.parallelWorkers);
  const setParallelWorkers = useQueueStore((s) => s.setParallelWorkers);
  const isDownloading = useQueueStore((s) => s.isDownloading);
  const clearQueue = useQueueStore((s) => s.clearQueue);
  const selectAllItems = useQueueStore((s) => s.selectAllItems);
  const deselectAllItems = useQueueStore((s) => s.deselectAllItems);
  const t = useT();

  const { startAll } = useDownload();

  const totalItems = items.length;
  const totalMB = items.reduce((sum, i) => sum + i.fileSizeMB, 0);

  // Selected queued items — the ones that "Start" will act on
  const selectedQueuedCount = items.filter(
    (i) => i.status === "queued" && i.selected
  ).length;
  const totalQueuedCount = items.filter((i) => i.status === "queued").length;
  const allSelected = items.length > 0 && items.every((i) => i.selected);

  // Dynamic start-button label
  const startLabel = (() => {
    if (isDownloading) return t("action.downloading");
    if (selectedQueuedCount === totalQueuedCount) return t("action.downloadAll");
    if (selectedQueuedCount > 0)
      return t("queue.startSelected").replace("{count}", String(selectedQueuedCount));
    return t("action.downloadAll");
  })();

  if (totalItems === 0) return null;

  return (
    <div className="animate-rise [animation-delay:200ms] mt-6 rounded-sm overflow-hidden">
      {/* Gradient bar — stays dark in both themes */}
      <div className="bg-gradient-to-r from-black to-prussian px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Summary + secondary controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-white/70 font-mono text-[11px] tracking-wide">
            <span className="text-white font-semibold">{totalItems} {t("action.items")}</span>
            <span className="mx-2">·</span>
            <span>{formatFileSize(totalMB)} {t("action.total")}</span>
          </div>

          {/* Select All / Deselect All toggle */}
          <button
            onClick={allSelected ? deselectAllItems : selectAllItems}
            className="font-mono text-[10px] text-white/50 hover:text-white/80 transition-colors cursor-pointer underline underline-offset-2"
          >
            {allSelected ? t("queue.deselectAll") : t("queue.selectAll")}
          </button>

          {/* Clear Queue — outline, placed after select toggle to stay out of primary click path */}
          <button
            onClick={clearQueue}
            disabled={totalItems === 0}
            className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 hover:text-state-danger border border-white/15 hover:border-state-danger rounded-sm px-2.5 py-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={t("queue.clearAll")}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
            {t("queue.clearAll")}
          </button>
        </div>

        {/* Worker controls + Start button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/50 font-mono text-[10px] uppercase tracking-[0.12em]">
              {t("action.parallel")}
            </span>
            <button
              onClick={() => setParallelWorkers(parallelWorkers - 1)}
              disabled={parallelWorkers <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-sm border border-white/20 text-white/70 hover:border-accent hover:text-accent transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t("action.decreaseWorkers")}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className="text-white font-mono text-sm font-bold w-6 text-center">
              {parallelWorkers}
            </span>
            <button
              onClick={() => setParallelWorkers(parallelWorkers + 1)}
              disabled={parallelWorkers >= 8}
              className="w-7 h-7 flex items-center justify-center rounded-sm border border-white/20 text-white/70 hover:border-accent hover:text-accent transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t("action.increaseWorkers")}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* Dynamic Start button */}
          <button
            onClick={startAll}
            disabled={selectedQueuedCount === 0 || isDownloading}
            className="bg-accent hover:bg-accent-hover text-black font-bold text-sm px-8 py-2.5 rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
