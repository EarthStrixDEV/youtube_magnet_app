export { en } from "./en";
export { th } from "./th";
export { zh } from "./zh";
export type { TranslationKey, Translations, Locale } from "./types";

import { en } from "./en";
import { th } from "./th";
import { zh } from "./zh";
import type { Locale, Translations } from "./types";

export const translations: Record<Locale, Translations> = { en, th, zh };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  th: "TH",
  zh: "ZH",
};
