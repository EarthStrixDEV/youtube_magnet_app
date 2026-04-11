"use client";

import { useQueueStore } from "@/stores/queue-store";
import { useT } from "@/hooks/use-t";
import { QueueStats } from "./queue-stats";
import { QueueItem } from "./queue-item";
import { QueueEmpty } from "./queue-empty";

export function QueueSection() {
  const items = useQueueStore((s) => s.items);
  const t = useT();

  return (
    <section className="animate-rise [animation-delay:150ms] mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint font-medium">
          {t("queue.heading")}
        </h2>
        <QueueStats />
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <QueueEmpty />
        ) : (
          items.map((item) => <QueueItem key={item.id} item={item} />)
        )}
      </div>
    </section>
  );
}
