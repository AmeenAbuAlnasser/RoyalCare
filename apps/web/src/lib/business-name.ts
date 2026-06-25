import type { SupportedLocale } from "@/i18n/locales";

type LocalizedBusinessName = {
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  fullName?: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  fullNameHe?: string | null;
};

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? "";
}

export function getLocalizedBusinessName(
  entity: LocalizedBusinessName | null | undefined,
  _locale: SupportedLocale,
) {
  if (!entity) return "";

  return firstText(
    entity.name,
    entity.fullName,
    entity.nameEn,
    entity.fullNameEn,
    entity.nameAr,
    entity.fullNameAr,
    entity.nameHe,
    entity.fullNameHe,
  );
}
