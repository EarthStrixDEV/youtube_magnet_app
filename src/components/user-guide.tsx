"use client";

import { useState } from "react";
import { useQueueStore } from "@/stores/queue-store";
import { useT } from "@/hooks/use-t";
import type { TranslationKey } from "@/lib/i18n";

interface Step {
  number: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const LOCAL_STEPS: Step[] = [
  { number: "01", titleKey: "guide.local.step1Title", descKey: "guide.local.step1Desc" },
  { number: "02", titleKey: "guide.local.step2Title", descKey: "guide.local.step2Desc" },
  { number: "03", titleKey: "guide.local.step3Title", descKey: "guide.local.step3Desc" },
  { number: "04", titleKey: "guide.local.step4Title", descKey: "guide.local.step4Desc" },
];

const SERVER_STEPS: Step[] = [
  { number: "01", titleKey: "guide.local.step1Title", descKey: "guide.local.step1Desc" },
  { number: "02", titleKey: "guide.local.step2Title", descKey: "guide.local.step2Desc" },
  { number: "03", titleKey: "guide.server.step3Title", descKey: "guide.server.step3Desc" },
  { number: "04", titleKey: "guide.server.step4Title", descKey: "guide.server.step4Desc" },
];

export function UserGuide() {
  const [open, setOpen] = useState(false);
  const deploymentMode = useQueueStore((s) => s.deploymentMode);
  const t = useT();
  const steps = deploymentMode === "server" ? SERVER_STEPS : LOCAL_STEPS;

  return (
    <div className="animate-rise [animation-delay:25ms] mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint hover:text-accent transition-colors cursor-pointer"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
        {t("guide.howToUse")}
      </button>

      {open && (
        <div className="mt-4 bg-card border border-line rounded-sm p-5 shadow-[var(--shadow-small)] theme-transition animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-3">
                <span className="shrink-0 font-mono text-[11px] text-accent font-bold mt-0.5">
                  {step.number}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t(step.titleKey)}</p>
                  <p className="text-xs text-ink-faint mt-1 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
