import { create } from "zustand";
import type { Locale } from "@/lib/i18n";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("ytmagnet-locale");
  if (saved === "en" || saved === "th" || saved === "zh") return saved;
  return "en";
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ytmagnet-locale", locale);
    }
    set({ locale });
  },
}));
