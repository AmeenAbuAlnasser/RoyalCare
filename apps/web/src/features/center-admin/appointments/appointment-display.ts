import type { SupportedLocale } from "@/i18n/locales";
import type {
  AppointmentProvider,
  AppointmentService,
  TenantAppointment,
} from "@/lib/api/tenant-appointments";

export function getLocalizedAppointmentServiceName(
  service: AppointmentService,
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

export function formatAppointmentTime(appointment: TenantAppointment) {
  return `${appointment.startTime} - ${appointment.endTime}`;
}

export function getAppointmentProviderName(provider: AppointmentProvider) {
  return provider.fullName?.trim() || provider.email || "";
}

export function getAppointmentDateInputValue(dateValue: string) {
  return dateValue.slice(0, 10);
}
