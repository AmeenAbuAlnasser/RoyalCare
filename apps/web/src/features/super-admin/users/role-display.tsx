import type { SupportedLocale } from "@/i18n/locales";
import { superAdminUsersDictionaries } from "@/i18n/dictionaries/super-admin-users";

export const platformRoleKeys = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "SUPPORT_ADMIN",
  "FINANCE_ADMIN",
  "READ_ONLY_ADMIN",
] as const;

export const centerRoleKeys = [
  "CENTER_OWNER",
  "CENTER_MANAGER",
  "DOCTOR",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "STAFF",
] as const;

export type PlatformRoleKey = (typeof platformRoleKeys)[number];
export type CenterRoleKey = (typeof centerRoleKeys)[number];
export type CanonicalRoleKey = PlatformRoleKey | CenterRoleKey;

const canonicalRoleKeys = [...platformRoleKeys, ...centerRoleKeys] as const;

function normalizeRoleKey(roleKey: string | null | undefined) {
  if (!roleKey) return null;

  const normalized = roleKey.trim().toUpperCase();
  return canonicalRoleKeys.includes(normalized as CanonicalRoleKey)
    ? (normalized as CanonicalRoleKey)
    : null;
}

function cleanFallbackRoleLabel(roleKey: string | null | undefined) {
  if (!roleKey?.trim()) return "-";

  return roleKey
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getRoleLabel(roleKey: string | null | undefined, locale: SupportedLocale) {
  const normalizedRoleKey = normalizeRoleKey(roleKey);

  if (!normalizedRoleKey) return cleanFallbackRoleLabel(roleKey);

  return (
    superAdminUsersDictionaries[locale].roles[normalizedRoleKey] ??
    cleanFallbackRoleLabel(normalizedRoleKey)
  );
}

export function getRoleBadgeClass(roleKey: string | null | undefined) {
  const normalizedRoleKey = normalizeRoleKey(roleKey);
  const classes: Record<CanonicalRoleKey, string> = {
    ACCOUNTANT: "border-green-200 bg-green-50 text-green-700",
    CENTER_MANAGER: "border-sky-200 bg-sky-50 text-sky-700",
    CENTER_OWNER: "border-amber-200 bg-amber-50 text-amber-700",
    DOCTOR: "border-teal-200 bg-teal-50 text-teal-700",
    FINANCE_ADMIN: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PLATFORM_ADMIN: "border-indigo-200 bg-indigo-50 text-indigo-700",
    READ_ONLY_ADMIN: "border-gray-200 bg-gray-50 text-gray-700",
    RECEPTIONIST: "border-pink-200 bg-pink-50 text-pink-700",
    STAFF: "border-slate-200 bg-slate-50 text-slate-700",
    SUPER_ADMIN: "border-purple-200 bg-purple-50 text-purple-700",
    SUPPORT_ADMIN: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return normalizedRoleKey
    ? classes[normalizedRoleKey]
    : "border-slate-200 bg-slate-50 text-slate-700";
}

export function RoleBadge({
  className = "",
  locale,
  roleKey,
}: {
  className?: string;
  locale: SupportedLocale;
  roleKey: string | null | undefined;
}) {
  return (
    <span
      className={`inline-flex min-h-7 max-w-full items-center rounded-full border px-2.5 text-xs font-semibold leading-5 ${getRoleBadgeClass(roleKey)} ${className}`}
    >
      <span className="truncate">{getRoleLabel(roleKey, locale)}</span>
    </span>
  );
}
