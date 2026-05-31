import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Center-admin layout — metadata override for all /tenant/* routes.
 *
 * ROOT CAUSE FIX:
 * Without this file, Next.js App Router walks up to app/layout.tsx and
 * re-applies its generateMetadata() result on EVERY client-side navigation.
 * That sets document.title = "RoyalCare" and writes the platform favicon
 * <link> elements before TenantFaviconManager can correct them — producing
 * the "RoyalCare flash" on every tenant page transition.
 *
 * This layout intercepts the metadata chain for (center-admin) routes and
 * replaces "RoyalCare" with a neutral placeholder at the Next.js level.
 * TenantFaviconManager (useLayoutEffect) then overwrites the placeholder
 * with the actual center name+favicon before the browser paints — so the
 * user never sees either "RoyalCare" or "Center Dashboard".
 */
export const metadata: Metadata = {
  title: {
    // `absolute` bypasses the root layout's title and any template strings.
    // Tenant pages never export their own metadata title; this string is the
    // effective tab title for the brief window between Next.js applying client
    // metadata and TenantFaviconManager running its useLayoutEffect.
    absolute: "Center Dashboard",
  },
  // Do not inherit root layout icons for tenant routes.
  // TenantFaviconManager writes the center logo favicon via DOM manipulation.
  // Setting explicit empty arrays prevents Next.js from re-injecting the
  // RoyalCare platform favicon <link> elements on every client navigation.
  icons: {
    icon: [],
    shortcut: [],
    apple: [],
  },
};

export default function CenterAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
