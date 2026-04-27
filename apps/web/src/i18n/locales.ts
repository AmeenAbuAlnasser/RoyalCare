export const supportedLocales = ["en", "ar", "he"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const localeDirections: Record<SupportedLocale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
  he: "rtl",
};

export const defaultLocale: SupportedLocale = "en";

export const languageCookieName = "royalcare_locale";

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}
