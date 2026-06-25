import type { SupportedLocale } from "@/i18n/locales";
import type { TenantService } from "@/lib/api/tenant-services";

export function getLocalizedServiceName(
  service: TenantService,
  _locale: SupportedLocale,
) {
  return service.nameEn || service.nameAr || service.nameHe;
}

export function getLocalizedServiceDescription(
  service: TenantService,
  _locale: SupportedLocale,
) {
  return service.descriptionEn || service.descriptionAr || service.descriptionHe;
}

export function formatServicePrice(service: TenantService) {
  if (service.price === null || service.price === undefined) {
    return "";
  }

  return `${service.currency} ${service.price}`;
}
