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
  const t = useT();

  const { startAll } = useDownload();

  const totalItems = items.length;
  const totalMB = items.reduce((sum, i) => sum + i.fileSizeMB, 0);
  const queuedCount = items.filter((i) => i.status === "queued").length;

  if (totalItems === 0) return null;

  return (
    <div className="animate-rise [animation-delay:200ms] mt-6 rounded-sm overflow-hidden">
      {/* Gradient bar — stays dark in both themes */}
      <div className="bg-gradient-to-r from-black to-prussian px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Summary */}
        <div className="text-white/70 font-mono text-[11px] tracking-wide">
          <span className="text-white font-semibold">{totalItems} {t("action.items")}</span>
          <span className="mx-2">·</span>
          <span>{formatFileSize(totalMB)} {t("action.total")}</span>
        </div>

        {/* Worker controls */}
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

          {/* Download All button */}
          <button
            onClick={startAll}
            disabled={queuedCount === 0 || isDownloading}
            className="bg-accent hover:bg-accent-hover text-black font-bold text-sm px-8 py-2.5 rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? t("action.downloading") : t("action.downloadAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
