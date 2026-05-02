import type { SupportedLocale } from "@/i18n/locales";
import type { TenantService } from "@/lib/api/tenant-services";

export function getLocalizedServiceName(
  service: TenantService,
  locale: SupportedLocale,
) {
  if (locale === "ar") {
    return service.nameAr || service.nameEn || service.nameHe;
  }

  if (locale === "he") {
    return service.nameHe || service.nameEn || service.nameAr;
  }

  return service.nameEn || service.nameAr || service.nameHe;
}

export function getLocalizedServiceDescription(
  service: TenantService,
  locale: SupportedLocale,
) {
  if (locale === "ar") {
    return service.descriptionAr || service.descriptionEn || service.descriptionHe;
  }

  if (locale === "he") {
    return service.descriptionHe || service.descriptionEn || service.descriptionAr;
  }

  return service.descriptionEn || service.descriptionAr || service.descriptionHe;
}

export function formatServicePrice(service: TenantService) {
  if (service.price === null || service.price === undefined) {
    return "";
  }

  return `${service.currency} ${service.price}`;
}
