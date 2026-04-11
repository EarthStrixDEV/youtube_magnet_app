"use client";

import { useQueueStore } from "@/stores/queue-store";
import { useT } from "@/hooks/use-t";

export function QueueStats() {
  const items = useQueueStore((s) => s.items);
  const t = useT();

  const total = items.length;
  const active = items.filter((i) => i.status === "downloading").length;
  const done = items.filter((i) => i.status === "complete").length;

  return (
    <div className="flex items-center gap-6">
      <div>
        <span className="text-[22px] font-bold">{total}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint ml-2">
          {t("queue.total")}
        </span>
      </div>
      <div>
        <span className="text-[22px] font-bold text-accent">{active}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint ml-2">
          {t("queue.active")}
        </span>
      </div>
      <div>
        <span className="text-[22px] font-bold">{done}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint ml-2">
          {t("queue.done")}
        </span>
      </div>
    </div>
  );
}
