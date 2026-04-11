"use client";

import { useT } from "@/hooks/use-t";

export function QueueEmpty() {
  const t = useT();

  return (
    <div className="bg-card border border-line rounded-sm p-12 text-center theme-transition">
      <div className="text-4xl mb-4 opacity-20">&#x1F9F2;</div>
      <p className="text-ink-faint text-sm">
        {t("queue.empty")}
      </p>
    </div>
  );
}
