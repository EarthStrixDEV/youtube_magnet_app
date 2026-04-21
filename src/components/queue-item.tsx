"use client";

import Image from "next/image";
import { useQueueStore } from "@/stores/queue-store";
import { useDownload } from "@/hooks/use-download";
import { useT } from "@/hooks/use-t";
import { FORMAT_OPTIONS, QUALITY_MAP } from "@/lib/constants";
import { ProgressBar } from "./progress-bar";
import type { Format, Quality, QueueItem as QueueItemType } from "@/lib/types";

interface QueueItemProps {
  item: QueueItemType;
}

export function QueueItem({ item }: QueueItemProps) {
  const removeItem = useQueueStore((s) => s.removeItem);
  const updateItemFormat = useQueueStore((s) => s.updateItemFormat);
  const updateItemQuality = useQueueStore((s) => s.updateItemQuality);
  const toggleItemSelected = useQueueStore((s) => s.toggleItemSelected);
  const { startSingle } = useDownload();
  const markItemStatus = useQueueStore((s) => s.markItemStatus);
  const t = useT();

  const qualities = QUALITY_MAP[item.format];
  const isActive = item.status === "downloading";
  const isProcessing = item.status === "processing";
  const isDone = item.status === "complete";
  const isError = item.status === "error";

  const statusClasses = isDone
    ? "bg-state-done-bg"
    : isError
      ? "bg-state-danger-bg"
      : "bg-card";

  return (
    <div
      className={`relative border border-line rounded-sm overflow-hidden animate-slide-in theme-transition ${statusClasses}`}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Selection checkbox */}
        <div className="flex items-center shrink-0 pt-[26px]">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => toggleItemSelected(item.id)}
            aria-label={t("queueItem.selectCheckbox")}
            className="w-4 h-4 rounded-sm border border-line bg-background-warm accent-accent cursor-pointer"
          />
        </div>

        {/* Thumbnail */}
        <div className="relative shrink-0 w-[120px] h-[68px] rounded-sm overflow-hidden bg-background-warm">
          {item.thumbnail && (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              sizes="120px"
              className="object-cover"
              loading="lazy"
            />
          )}
          {/* Index badge */}
          <span className="absolute top-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-sm">
            #{item.index}
          </span>
          {/* Duration */}
          <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-sm">
            {item.duration}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug truncate">
            {item.title}
          </h3>
          <p className="text-ink-faint font-mono text-[10px] mt-1 truncate">
            {item.url}
          </p>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Format select */}
            <select
              value={item.format}
              onChange={(e) =>
                updateItemFormat(item.id, e.target.value as Format)
              }
              disabled={item.status !== "queued"}
              className="bg-background-warm border border-line rounded-sm font-mono text-[11px] px-2 py-1 text-ink outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Quality select */}
            <select
              value={item.quality}
              onChange={(e) =>
                updateItemQuality(item.id, e.target.value as Quality)
              }
              disabled={item.status !== "queued"}
              className="bg-background-warm border border-line rounded-sm font-mono text-[11px] px-2 py-1 text-ink outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {qualities.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            {/* File size */}
            <span className="font-mono text-[11px] text-ink-faint">
              {item.fileSize}
            </span>

            {/* Speed & ETA (during download) */}
            {isActive && item.speed && (
              <span className="font-mono text-[10px] text-accent">
                {item.speed} {item.eta && `· ETA ${item.eta}`}
              </span>
            )}

            {/* Status chip */}
            <span
              className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                isDone
                  ? "bg-state-done-chip-bg text-ink-soft"
                  : isError
                    ? "bg-state-danger-bg text-state-danger"
                    : isActive || isProcessing
                      ? "bg-state-downloading-bg text-accent"
                      : "bg-background-warm text-ink-faint"
              }`}
            >
              {isProcessing ? t("status.processing") : item.status}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {item.status === "queued" && (
            <button
              onClick={() => startSingle(item.id)}
              className="w-8 h-8 flex items-center justify-center border border-line rounded-sm text-ink-faint hover:text-accent hover:border-accent transition-all cursor-pointer"
              aria-label={t("queueItem.startDownload")}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          {isError && (
            <button
              onClick={() => {
                markItemStatus(item.id, "queued");
              }}
              className="w-8 h-8 flex items-center justify-center border border-line rounded-sm text-ink-faint hover:text-accent hover:border-accent transition-all cursor-pointer"
              aria-label={t("queueItem.retryDownload")}
              title={t("queueItem.retry")}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
            </button>
          )}
          <button
            onClick={() => removeItem(item.id)}
            className="w-8 h-8 flex items-center justify-center border border-line rounded-sm text-ink-faint hover:text-state-danger hover:border-state-danger hover:bg-state-danger-bg transition-all cursor-pointer"
            aria-label={t("queueItem.removeFromQueue")}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error message */}
      {isError && item.error && (
        <div className="px-4 pb-3 -mt-1">
          <p className="font-mono text-[10px] text-state-danger truncate" title={item.error}>
            {item.error}
          </p>
        </div>
      )}

      {/* Processing label (e.g. "Merging...", "Transcoding to MP3...") */}
      {isProcessing && item.processingLabel && (
        <div className="px-4 pb-3 -mt-1">
          <p className="font-mono text-[10px] text-accent truncate" title={item.processingLabel}>
            {item.processingLabel}
          </p>
        </div>
      )}

      <ProgressBar progress={item.progress} status={item.status} />
    </div>
  );
}
