"use client";

import { useT } from "@/hooks/use-t";

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto pt-16 pb-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
        {t("footer.text")}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
        Copyright &copy; {year} EarthStrix SoftwareHouse
      </p>
    </footer>
  );
}
