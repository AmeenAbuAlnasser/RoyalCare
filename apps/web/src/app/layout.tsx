import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import {
  defaultLocale,
  isSupportedLocale,
  languageCookieName,
  localeDirections,
} from "@/i18n/locales";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoyalCare",
  description: "RoyalCare multi-tenant SaaS web application.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(languageCookieName)?.value;
  const initialLocale = isSupportedLocale(savedLocale)
    ? savedLocale
    : defaultLocale;
  const initialDirection = localeDirections[initialLocale];

  return (
    <html
      lang={initialLocale}
      dir={initialDirection}
      className="h-full antialiased"
    >
      <body className="min-h-full bg-background text-foreground">
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
