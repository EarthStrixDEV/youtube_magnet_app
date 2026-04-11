"use client";

import { useState, useRef, useCallback } from "react";
import { useQueueStore } from "@/stores/queue-store";
import { useT } from "@/hooks/use-t";

export function LinkInput() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addUrls = useQueueStore((s) => s.addUrls);
  const t = useT();

  const handleSubmit = useCallback(() => {
    if (!value.trim()) return;
    const count = addUrls(value);
    if (count > 0) {
      setValue("");
    }
    textareaRef.current?.focus();
  }, [value, addUrls]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="animate-rise [animation-delay:50ms]">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint mb-4 font-medium">
        {t("linkInput.heading")}
      </h2>
      <div className="bg-card border border-line rounded-sm p-6 shadow-[var(--shadow-small)] theme-transition">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("linkInput.placeholder")}
          className="w-full h-32 bg-transparent text-ink placeholder:text-ink-faint font-mono text-sm resize-none outline-none"
          spellCheck={false}
        />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
          <div className="flex items-center gap-3">
            <kbd className="font-mono text-[10px] bg-background-warm text-ink-faint px-2 py-1 rounded-sm border border-line">
              {t("linkInput.enter")}
            </kbd>
            <span className="text-ink-faint text-xs">{t("linkInput.addToQueue")}</span>
            <kbd className="font-mono text-[10px] bg-background-warm text-ink-faint px-2 py-1 rounded-sm border border-line ml-2">
              {t("linkInput.shiftEnter")}
            </kbd>
            <span className="text-ink-faint text-xs">{t("linkInput.newLine")}</span>
          </div>
          <button
            onClick={handleSubmit}
            className="bg-black dark:bg-white text-white dark:text-black font-semibold text-sm px-6 py-2.5 rounded-sm hover:opacity-80 transition-opacity cursor-pointer"
          >
            {t("linkInput.addButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
