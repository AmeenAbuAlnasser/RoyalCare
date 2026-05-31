import type { SupportedLocale } from "@/i18n/locales";
import type {
  AppointmentProvider,
  AppointmentService,
  TenantAppointment,
} from "@/lib/api/tenant-appointments";

export function getLocalizedAppointmentServiceName(
  service: AppointmentService | null | undefined,
  locale: SupportedLocale,
  offerTitle?: string | null,
  customServiceName?: string | null,
): string {
  if (service) {
    if (locale === "ar") return service.nameAr || service.nameEn || service.nameHe;
    if (locale === "he") return service.nameHe || service.nameEn || service.nameAr;
    return service.nameEn || service.nameAr || service.nameHe;
  }
  if (customServiceName) return customServiceName;
  if (offerTitle) return offerTitle;
  return locale === "ar" ? "عرض / باقة" : locale === "he" ? "מבצע / חבילה" : "Offer / Package";
}

export function formatAppointmentTime(appointment: TenantAppointment) {
  return `${appointment.startTime} - ${appointment.endTime}`;
}

export function getAppointmentProviderName(provider: AppointmentProvider) {
  return provider.fullName?.trim() || provider.email || "";
}

export function getAppointmentDateInputValue(dateValue: string) {
  return dateValue.slice(0, 10);
}
