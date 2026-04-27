"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import {
  languageCookieName,
  localeDirections,
  type SupportedLocale,
} from "./locales";

type LanguageContextValue = {
  direction: "ltr" | "rtl";
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const direction = localeDirections[locale];

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    setLocaleState((currentLocale) =>
      currentLocale === nextLocale ? currentLocale : nextLocale,
    );
  }, []);

  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }

    if (document.documentElement.dir !== direction) {
      document.documentElement.dir = direction;
    }

    if (window.localStorage.getItem("royalcare.locale") !== locale) {
      window.localStorage.setItem("royalcare.locale", locale);
    }

    if (!document.cookie.includes(`${languageCookieName}=${locale}`)) {
      document.cookie = `${languageCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [direction, locale]);

  const value = useMemo(
    () => ({
      direction,
      locale,
      setLocale,
    }),
    [direction, locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
