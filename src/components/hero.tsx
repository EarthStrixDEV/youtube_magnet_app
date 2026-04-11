"use client";

import { useT } from "@/hooks/use-t";

export function Hero() {
  const t = useT();

  return (
    <header className="animate-rise pb-12">
      <h1 className="text-[clamp(2.75rem,8vw,5.25rem)] font-extrabold leading-[0.95] tracking-tight">
        {t("hero.title1")}
        <br />
        <span className="text-accent">{t("hero.title2")}</span>
      </h1>
      <p className="mt-4 text-ink-soft text-lg font-light max-w-xl">
        {t("hero.desc")}
      </p>
    </header>
  );
}
