import { useCallback } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import { translations } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

export function useT() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  return t;
}

// Non-hook version for use outside React components (stores, utils)
export function getT(locale: "en" | "th" | "zh") {
  return (key: TranslationKey): string => {
    return translations[locale][key] ?? translations.en[key] ?? key;
  };
}
