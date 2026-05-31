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
  locale: SupportedLocale,
) {
  if (!entity) return "";

  if (locale === "he") {
    return firstText(
      entity.nameHe,
      entity.fullNameHe,
      entity.nameEn,
      entity.fullNameEn,
      entity.nameAr,
      entity.fullNameAr,
      entity.name,
      entity.fullName,
    );
  }

  if (locale === "ar") {
    return firstText(
      entity.nameAr,
      entity.fullNameAr,
      entity.nameEn,
      entity.fullNameEn,
      entity.nameHe,
      entity.fullNameHe,
      entity.name,
      entity.fullName,
    );
  }

  return firstText(
    entity.nameEn,
    entity.fullNameEn,
    entity.nameHe,
    entity.fullNameHe,
    entity.nameAr,
    entity.fullNameAr,
    entity.name,
    entity.fullName,
  );
}
