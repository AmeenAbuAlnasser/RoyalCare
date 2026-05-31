import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { GlobalFavicon } from "@/components/brand/GlobalFavicon";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import {
  defaultLocale,
  isSupportedLocale,
  languageCookieName,
  localeDirections,
} from "@/i18n/locales";
import "./globals.css";

const SETTINGS_API_URL =
  (process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_ROYALCARE_API_URL ??
    "http://localhost:3001/api/v1") + "/public/settings";

const FALLBACK_ICON = "/brand/royalcare-mark.png";

function versionedIconUrl(href: string, version?: string | null) {
  const cacheValue = encodeURIComponent(version ?? "default");
  return href.includes("?") ? `${href}&v=${cacheValue}` : `${href}?v=${cacheValue}`;
}

// generateMetadata runs server-side on every request (force-dynamic below).
// It fetches the current public_favicon_url from the settings API so the
// correct <link rel="icon"> is baked into the SSR HTML — no JavaScript
// needed for the favicon to appear on first paint, hard-reload, or navigation.
export async function generateMetadata(): Promise<Metadata> {
  let iconUrl = versionedIconUrl(FALLBACK_ICON, "default");

  try {
    const res = await fetch(SETTINGS_API_URL, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        settings: Array<{
          key: string;
          value: string | null;
          updatedAt?: string | null;
        }>;
      };
      const favicon = data.settings.find((s) => s.key === "public_favicon_url");
      const raw = favicon?.value?.trim();
      if (raw) iconUrl = versionedIconUrl(raw, favicon?.updatedAt);
    }
  } catch {
    // API unreachable — fall through to brand mark fallback
  }

  return {
    title: "RoyalCare",
    description: "RoyalCare multi-tenant SaaS web application.",
    icons: {
      icon: [{ url: iconUrl, type: "image/png" }],
      shortcut: [{ url: iconUrl, type: "image/png" }],
      apple: [{ url: iconUrl, type: "image/png" }],
    },
  };
}

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
        {/* Live-update only — SSR favicon is handled by generateMetadata above */}
        <GlobalFavicon />
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
