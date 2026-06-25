import type { SupportedLocale } from "@/i18n/locales";

/**
 * Minimal shape every branch selector shares. Address fields are optional so
 * callers whose API doesn't (yet) return them degrade gracefully.
 */
export type BranchLabelFields = {
  name: string;
  cityAr?: string | null;
  cityEn?: string | null;
  cityHe?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  addressHe?: string | null;
};

export function localizedBranchCity(
  branch: BranchLabelFields,
  locale: SupportedLocale,
): string {
  if (locale === "ar") return branch.cityAr || branch.cityEn || branch.cityHe || "";
  if (locale === "he") return branch.cityHe || branch.cityEn || branch.cityAr || "";
  return branch.cityEn || branch.cityAr || branch.cityHe || "";
}

export function localizedBranchAddress(
  branch: BranchLabelFields,
  locale: SupportedLocale,
): string {
  if (locale === "ar")
    return branch.addressAr || branch.addressEn || branch.addressHe || "";
  if (locale === "he")
    return branch.addressHe || branch.addressEn || branch.addressAr || "";
  return branch.addressEn || branch.addressAr || branch.addressHe || "";
}

/**
 * Single source of truth for branch dropdown/select labels across RoyalCare.
 *
 * Format: "Name — Address — City" so multiple branches in the same city are
 * always distinguishable. Address and city are dropped only when missing; city
 * is never used alone for distinction (the name always leads, the address
 * carries the distinction).
 */
export function formatBranchLabel(
  branch: BranchLabelFields,
  locale: SupportedLocale,
): string {
  const address = localizedBranchAddress(branch, locale);
  const city = localizedBranchCity(branch, locale);
  return [branch.name, address || null, city || null]
    .filter(Boolean)
    .join(" — ");
}
