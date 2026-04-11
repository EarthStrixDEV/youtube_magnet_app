"use client";

import { useQueueStore } from "@/stores/queue-store";
import { useLocaleStore } from "@/stores/locale-store";
import { useT } from "@/hooks/use-t";
import { LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

const LOCALES: Locale[] = ["en", "th", "zh"];

export function Navbar() {
  const items = useQueueStore((s) => s.items);
  const activeCount = items.filter((i) => i.status === "downloading").length;
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useT();

  return (
    <nav className="flex items-center justify-between pb-14">
      {/* Brand */}
      <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
        <div className="w-7 h-7 bg-orange rounded-[4px] flex items-center justify-center -rotate-[8deg] shadow-[0_4px_12px_rgba(252,163,17,0.35)]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2C8 2 4 6 4 10v2h4v-2c0-2 2-4 4-4s4 2 4 4v2h4v-2c0-4-4-8-8-8z" />
            <rect x="2" y="12" width="8" height="6" rx="1" fill="white" stroke="none" />
            <rect x="14" y="12" width="8" height="6" rx="1" fill="white" stroke="none" />
          </svg>
        </div>
        <span>
          YouTube Magnet<em className="font-light text-ink-faint">.app</em>
        </span>
      </div>

      {/* Meta */}
      <div className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
        <span className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeCount > 0
                ? "bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse-glow"
                : "bg-ink-faint"
            }`}
          />
          {t("nav.activeWorkers")}{activeCount}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-faint" />
          {t("nav.version")}
        </span>

        {/* Language Switcher */}
        <div className="flex items-center gap-1">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-2 py-1 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${
                locale === loc
                  ? "bg-accent text-black"
                  : "text-ink-faint hover:text-accent"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>

        <ThemeToggle />
      </div>

      {/* Mobile: lang switcher + theme toggle */}
      <div className="md:hidden flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-1.5 py-1 rounded-sm font-mono text-[9px] font-bold transition-all cursor-pointer ${
                locale === loc
                  ? "bg-accent text-black"
                  : "text-ink-faint hover:text-accent"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
