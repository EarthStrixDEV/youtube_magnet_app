"use client";

import { useQueueStore } from "@/stores/queue-store";
import { FORMAT_OPTIONS, QUALITY_MAP } from "@/lib/constants";
import { useT } from "@/hooks/use-t";
import type { Quality } from "@/lib/types";

export function GlobalDefaults() {
  const globalFormat = useQueueStore((s) => s.globalFormat);
  const globalQuality = useQueueStore((s) => s.globalQuality);
  const setGlobalFormat = useQueueStore((s) => s.setGlobalFormat);
  const setGlobalQuality = useQueueStore((s) => s.setGlobalQuality);
  const t = useT();

  const qualities = QUALITY_MAP[globalFormat];

  return (
    <div className="animate-rise [animation-delay:100ms] mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
          {t("defaults.format")}
        </span>
        <div className="flex gap-1.5">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setGlobalFormat(fmt)}
              className={`font-mono text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-all duration-250 cursor-pointer ${
                globalFormat === fmt
                  ? "bg-accent text-black border-accent"
                  : "bg-card text-ink-soft border-line hover:border-ink-faint"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium ml-4">
          {t("defaults.quality")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => setGlobalQuality(q as Quality)}
              className={`font-mono text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-all duration-250 cursor-pointer ${
                globalQuality === q
                  ? "bg-accent text-black border-accent"
                  : "bg-card text-ink-soft border-line hover:border-ink-faint"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
