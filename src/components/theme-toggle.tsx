"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useT } from "@/hooks/use-t";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useT();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="w-9 h-9 bg-card border border-line rounded-sm flex items-center justify-center"
        aria-label={t("theme.toggle")}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 bg-card border border-line rounded-sm flex items-center justify-center text-ink hover:border-accent hover:text-accent transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-px"
      aria-label={isDark ? t("theme.switchLight") : t("theme.switchDark")}
    >
      {/* Sun icon */}
      <svg
        className={`w-4 h-4 absolute transition-all duration-400 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon icon */}
      <svg
        className={`w-4 h-4 absolute transition-all duration-400 ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
