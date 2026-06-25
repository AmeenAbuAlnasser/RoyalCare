import { formatTime12h } from "@/i18n/formatters";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  AppointmentProvider,
  AppointmentService,
  TenantAppointment,
} from "@/lib/api/tenant-appointments";

// ─── Session label ────────────────────────────────────────────────────────────

export type AppointmentSessionLabel = {
  /** Localized display string, e.g. "الجلسة 3 من 8" / "Session 3 of 8" */
  label: string;
  /** Badge color variant */
  variant: "blue" | "green" | "gold" | "purple";
  isFinalSession: boolean;
  currentSession: number | null;
  totalSessions: number | null;
};

/**
 * Returns a localized session badge descriptor for a list/card view, or null
 * when the appointment has no follow-up data (no badge should be rendered).
 *
 * Priority for total sessions: treatmentTemplateTotalSessions (snapshot) →
 * service.totalRecommendedSessions → null (show number only).
 *
 * Variant rules:
 *   "gold"   – final session (آخر جلسة)
 *   "purple" – recurring follow-up (جلسة متابعة)
 *   "green"  – completed finite session
 *   "blue"   – active/upcoming finite session
 */
export function getAppointmentSessionLabel(
  appointment: TenantAppointment,
  locale: SupportedLocale,
): AppointmentSessionLabel | null {
  const { followUp, service, status } = appointment;

  if (!followUp) return null;

  const sessionNumber = followUp.sessionNumber;

  // Recurring follow-up row has no sessionNumber
  if (sessionNumber == null) {
    if (service?.followUpMode === "RECURRING_CONTINUOUS") {
      return {
        label:
          locale === "ar"
            ? "جلسة متابعة"
            : locale === "he"
              ? "מפגש מעקב"
              : "Follow-up",
        variant: "purple",
        isFinalSession: false,
        currentSession: null,
        totalSessions: null,
      };
    }
    return null;
  }

  // Finite plan — prefer snapshot total over live service value
  const totalSessions =
    appointment.treatmentTemplateTotalSessions ??
    service?.totalRecommendedSessions ??
    null;

  const isFinalSession =
    totalSessions != null && sessionNumber >= totalSessions;

  if (isFinalSession) {
    return {
      label:
        locale === "ar"
          ? "آخر جلسة"
          : locale === "he"
            ? "מפגש אחרון"
            : "Last Session",
      variant: "gold",
      isFinalSession: true,
      currentSession: sessionNumber,
      totalSessions,
    };
  }

  const label =
    totalSessions != null
      ? locale === "ar"
        ? `الجلسة ${sessionNumber} من ${totalSessions}`
        : locale === "he"
          ? `מפגש ${sessionNumber} מתוך ${totalSessions}`
          : `Session ${sessionNumber} of ${totalSessions}`
      : locale === "ar"
        ? `الجلسة ${sessionNumber}`
        : locale === "he"
          ? `מפגש ${sessionNumber}`
          : `Session ${sessionNumber}`;

  return {
    label,
    variant: status === "COMPLETED" ? "green" : "blue",
    isFinalSession: false,
    currentSession: sessionNumber,
    totalSessions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export function getLocalizedAppointmentServiceName(
  service: AppointmentService | null | undefined,
  locale: SupportedLocale,
  offerTitle?: string | null,
  customServiceName?: string | null,
): string {
  if (service) {
    return service.nameEn || service.nameAr || service.nameHe;
  }
  if (customServiceName) return customServiceName;
  if (offerTitle) return offerTitle;
  return locale === "ar" ? "عرض / باقة" : locale === "he" ? "מבצע / חבילה" : "Offer / Package";
}

export function formatAppointmentTime(appointment: TenantAppointment) {
  return `${formatTime12h(appointment.startTime)} - ${formatTime12h(appointment.endTime)}`;
}

export function getAppointmentProviderName(provider: AppointmentProvider) {
  return provider.fullName?.trim() || provider.email || "";
}

export function getAppointmentDateInputValue(dateValue: string) {
  return dateValue.slice(0, 10);
}

// ─── Branch ─────────────────────────────────────────────────────────────────

// Re-exported from the shared helper so all branch selectors share one format:
// "Name — Address — City" (distinguishable even within the same city).
export {
  formatBranchLabel as getBranchLabel,
  localizedBranchAddress as getLocalizedBranchAddress,
  localizedBranchCity as getLocalizedBranchCity,
} from "@/lib/branch-label";
