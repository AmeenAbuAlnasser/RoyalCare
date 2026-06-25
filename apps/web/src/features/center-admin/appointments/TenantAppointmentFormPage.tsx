"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatTime12h } from "@/i18n/formatters";
import {
  createTenantAppointment,
  getTenantAppointment,
  getTenantAppointmentOptions,
  getTenantAvailability,
  updateTenantAppointment,
  type AppointmentService,
  type AppointmentConflictDetails,
  type AppointmentStatus,
  type TenantAppointment,
  type TenantAppointmentOptions,
  type TenantAvailabilitySlot,
} from "@/lib/api/tenant-appointments";
import {
  getTenantFollowUp,
  updateTenantFollowUpStatus,
  type TenantPatientFollowUp,
} from "@/lib/api/tenant-follow-ups";
import { linkBookingRequestAppointment } from "@/lib/api/tenant-booking-requests";
import { AppointmentConflictAlert } from "./AppointmentConflictAlert";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type SlotState =
  | { status: "prompt" }
  | { status: "needs_duration" }
  | { status: "loading" }
  | { status: "ready"; slots: TenantAvailabilitySlot[] }
  | { status: "error" };
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
import {
  getAppointmentProviderName,
  getBranchLabel,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";
import {
  appointmentToForm,
  calculateTotalSessionsFromRules,
  formToAppointmentPayload,
  type TenantAppointmentFormErrors,
  type TenantAppointmentFormState,
} from "./appointment-form";

const appointmentStatuses: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const treatmentTemplateSelectCopy = {
  en: {
    label: "Choose treatment plan",
    helper:
      "The selected template fills the plan, and you can still customize it for this patient.",
  },
  ar: {
    label: "اختر خطة العلاج",
    helper:
      "القالب يملأ الخطة تلقائيًا ويمكنك تعديلها لهذا المريض فقط.",
  },
  he: {
    label: "בחירת תוכנית טיפול",
    helper:
      "התבנית ממלאת את התוכנית ואפשר עדיין להתאים אותה למטופל הזה.",
  },
} as const;

function validateForm(
  form: TenantAppointmentFormState,
  dictionary: CenterAdminDictionary,
  isOfferAppointment: boolean,
  isCustomService: boolean,
  isEditWithUnchangedScheduling: boolean,
  branchRequired: boolean,
) {
  const errors: TenantAppointmentFormErrors = {};

  if (!form.patientId) {
    errors.patientId = dictionary.appointments.fieldRequired;
  }

  if (branchRequired && !form.branchId) {
    errors.branchId = dictionary.appointments.fieldRequired;
  }

  if (!form.serviceId && !isCustomService && !isOfferAppointment) {
    errors.serviceId = dictionary.appointments.fieldRequired;
  }

  if (isCustomService && !form.customServiceName.trim()) {
    errors.customServiceName = dictionary.appointments.fieldRequired;
  }

  if (!form.staffUserId) {
    errors.staffUserId = dictionary.appointments.fieldRequired;
  }

  if (!form.appointmentDate) {
    errors.appointmentDate = dictionary.appointments.invalidDate;
  }

  // In edit mode with unchanged scheduling the startTime is already booked;
  // skip the empty-check so notes-only edits are never blocked.
  if (!form.startTime && !isEditWithUnchangedScheduling) {
    errors.startTime = dictionary.appointments.invalidTime;
  }

  if (!form.durationMinutes || Number(form.durationMinutes) <= 0) {
    errors.durationMinutes = dictionary.appointments.invalidDuration;
  }

  if (isCustomService && form.saveCustomService) {
    if (form.followUpMode === "SESSION_BASED_PLAN") {
        const hasInvalidRule = form.followUpRules.some((rule) => {
          const from = Number(rule.fromSessionNumber);
          const to = Number(rule.toSessionNumber);
          const interval = Number(rule.intervalDays);
          return (
            !Number.isInteger(from) ||
            !Number.isInteger(to) ||
            !Number.isInteger(interval) ||
            from <= 0 ||
            to < from ||
            interval <= 0
          );
        });

        if (form.followUpRules.length === 0 || hasInvalidRule) {
          errors.followUpRules = dictionary.services.invalidDuration;
        }
    }

    if (form.followUpMode === "RECURRING_CONTINUOUS") {
      const recurringValue = Number(form.recurringIntervalValue);
      if (
        !form.recurringIntervalValue ||
        !Number.isInteger(recurringValue) ||
        recurringValue <= 0
      ) {
        errors.recurringIntervalValue = dictionary.services.invalidDuration;
      }
    }
  }

  if (form.startTime && form.durationMinutes && Number(form.durationMinutes) > 0) {
    const computed = calculateEndTime(form.startTime, form.durationMinutes);
    if (!computed) {
      errors.endTime = dictionary.appointments.endOfDayError;
    }
  }

  return errors;
}

function extractErrors(error: unknown, dictionary: CenterAdminDictionary) {
  if (!isApiRequestError(error)) {
    return {};
  }

  const details = (error as ApiRequestError).details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const source = (details as { errors?: Record<string, unknown> }).errors;

  if (!source) {
    return {};
  }

  return Object.fromEntries(
    Object.keys(source).map((key) => {
      const fallback =
        key === "appointmentDate"
          ? dictionary.appointments.invalidDate
          : key === "endTime"
            ? dictionary.appointments.endOfDayError
            : key === "startTime"
              ? dictionary.appointments.invalidTime
              : key === "durationMinutes"
              ? dictionary.appointments.invalidDuration
              : key === "patientId" || key === "staffUserId"
                ? dictionary.appointments.overlap
                : dictionary.appointments.fieldRequired;

      return [key, fallback];
    }),
  ) as TenantAppointmentFormErrors;
}

function isApiRequestError(
  error: unknown,
): error is ApiRequestError {
  if (error instanceof ApiRequestError) return true;
  // HMR fallback: class identity breaks on hot reload, check by name + shape.
  return (
    error instanceof Error &&
    error.name === "ApiRequestError" &&
    "details" in error
  );
}

function tryParseJson(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractConflictDetails(
  error: unknown,
): AppointmentConflictDetails | null {
  if (!error || typeof error !== "object") return null;
  const err = error as Record<string, unknown>;

  // Resolve the parsed response body — prefer error.details (set by our API
  // client), fall back to re-parsing rawResponseBody if details is null.
  const body: Record<string, unknown> | null =
    (err.details && typeof err.details === "object" && !Array.isArray(err.details)
      ? (err.details as Record<string, unknown>)
      : null) ?? tryParseJson(err.rawResponseBody);

  if (!body) return null;

  const cd = body.conflictDetails;
  if (!cd || typeof cd !== "object" || Array.isArray(cd)) return null;

  return cd as AppointmentConflictDetails;
}

function calculateEndTime(startTime: string, durationMinutes: string) {
  if (!startTime || !durationMinutes) {
    return "";
  }

  const [hours, minutes] = startTime.split(":").map(Number);
  const duration = Number(durationMinutes);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || duration <= 0) {
    return "";
  }

  const total = hours * 60 + minutes + duration;

  if (total > 24 * 60) {
    return "";
  }

  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function isCurrentAppointmentSlot(
  mode: "create" | "edit",
  loadedAppointment: TenantAppointment | null,
  form: TenantAppointmentFormState,
  time: string,
) {
  if (mode !== "edit" || !loadedAppointment) return false;

  return (
    loadedAppointment.startTime === time &&
    loadedAppointment.endTime ===
      calculateEndTime(form.startTime, form.durationMinutes) &&
    loadedAppointment.appointmentDate.slice(0, 10) === form.appointmentDate &&
    loadedAppointment.staffUserId === form.staffUserId &&
    (loadedAppointment.serviceId ?? "") === form.serviceId
  );
}

function withCurrentAppointmentSlot(
  slots: TenantAvailabilitySlot[],
  mode: "create" | "edit",
  loadedAppointment: TenantAppointment | null,
  form: TenantAppointmentFormState,
) {
  if (!loadedAppointment || mode !== "edit") return slots;

  const currentSlotMatchesForm = isCurrentAppointmentSlot(
    mode,
    loadedAppointment,
    form,
    loadedAppointment.startTime,
  );

  if (!currentSlotMatchesForm) return slots;

  const existingSlot = slots.find((slot) => slot.time === loadedAppointment.startTime);

  if (existingSlot) {
    return slots.map((slot) =>
      slot.time === loadedAppointment.startTime
        ? { ...slot, available: true, reason: "CURRENT_APPOINTMENT" }
        : slot,
    );
  }

  return [
    ...slots,
    {
      available: true,
      reason: "CURRENT_APPOINTMENT",
      time: loadedAppointment.startTime,
    },
  ].sort((a, b) => a.time.localeCompare(b.time));
}

type FollowUpFormSlice = {
  followUpEnabled: boolean;
  followUpMode: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  defaultIntervalDays: string;
  totalRecommendedSessions: string;
  recurringIntervalValue: string;
  recurringIntervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  followUpRules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>;
};

type FollowUpRuleField = "fromSessionNumber" | "toSessionNumber" | "intervalDays";

function parseFollowUpRuleValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getFollowUpRuleWarnings(
  form: FollowUpFormSlice,
  dictionary: { services: { invalidRangeOrder: string; invalidIntervals: string; overlappingRanges: string; firstPhaseMustStartAtOne: string; noGapsAllowed: string } },
): string[] {
  if (form.followUpMode !== "SESSION_BASED_PLAN") {
    return [];
  }
  const warnings: string[] = [];
  const normalized = form.followUpRules
    .map((rule) => ({
      from: parseFollowUpRuleValue(rule.fromSessionNumber),
      to: parseFollowUpRuleValue(rule.toSessionNumber),
      interval: parseFollowUpRuleValue(rule.intervalDays),
    }))
    .filter(
      (rule): rule is { from: number; to: number; interval: number } =>
        rule.from !== null && rule.to !== null && rule.interval !== null,
    )
    .sort((a, b) => a.from - b.from);

  if (normalized.some((rule) => rule.from <= 0 || rule.to <= 0 || rule.from > rule.to)) {
    warnings.push(dictionary.services.invalidRangeOrder);
  }
  if (normalized.some((rule) => rule.interval <= 0)) {
    warnings.push(dictionary.services.invalidIntervals);
  }
  if (normalized.some((rule, index) => {
    const next = normalized[index + 1];
    return Boolean(next && rule.to >= next.from);
  })) {
    warnings.push(dictionary.services.overlappingRanges);
  }
  if (normalized.length > 0 && normalized[0].from !== 1) {
    warnings.push(dictionary.services.firstPhaseMustStartAtOne);
  }
  if (normalized.some((rule, index) => {
    const next = normalized[index + 1];
    return Boolean(next && next.from !== rule.to + 1);
  })) {
    warnings.push(dictionary.services.noGapsAllowed);
  }
  return warnings;
}

function getFollowUpPlanPreview(form: FollowUpFormSlice) {
  if (form.followUpMode !== "SESSION_BASED_PLAN") {
    return [];
  }

  const totalSessions = calculateTotalSessionsFromRules(form.followUpRules) ?? 8;
  const sessions = Array.from(
    { length: Math.min(totalSessions, 12) },
    (_, index) => index + 1,
  );
  return sessions
    .map((session) => {
      const match = form.followUpRules.find((rule) => {
        const from = parseFollowUpRuleValue(rule.fromSessionNumber);
        const to = parseFollowUpRuleValue(rule.toSessionNumber);
        return from !== null && to !== null && session >= from && session <= to;
      });
      const interval = match
        ? parseFollowUpRuleValue(match.intervalDays)
        : parseFollowUpRuleValue(form.defaultIntervalDays);
      return interval && interval > 0 ? { session, interval } : null;
    })
    .filter((item): item is { session: number; interval: number } => Boolean(item));
}

function followUpRuleLabel(
  dictionary: { services: { sessionsFrom: string; sessionsTo: string; intervalDays: string } },
  field: FollowUpRuleField,
) {
  if (field === "fromSessionNumber") return dictionary.services.sessionsFrom;
  if (field === "toSessionNumber") return dictionary.services.sessionsTo;
  return dictionary.services.intervalDays;
}

const followUpContextCopy = {
  en: {
    title: "Previous session context",
    previousNotes: "Treatment notes",
    internalNotes: "Internal staff notes",
    provider: "Previous provider",
    duration: "Previous duration",
    treatmentDetails: "Treatment details",
    timeline: "Treatment timeline",
    bookingFromFollowUp: "This appointment is being created from a follow-up plan",
    alreadyBooked: "This follow-up session already has an appointment.",
    linkedAppointment: "Linked appointment",
    viewAppointment: "View appointment",
    editAppointment: "Edit appointment",
    completed: "Completed",
    followUp: "Upcoming follow-up",
    session: "Session",
    empty: "No previous clinical notes were recorded.",
  },
  ar: {
    title: "معلومات من الجلسة السابقة",
    previousNotes: "ملاحظات علاجية",
    internalNotes: "ملاحظات داخلية للطاقم",
    provider: "المعالج / المقدم السابق",
    duration: "مدة الجلسة السابقة",
    treatmentDetails: "تفاصيل العلاج",
    timeline: "سجل العلاج",
    bookingFromFollowUp: "يتم إنشاء هذا الموعد من خطة متابعة",
    alreadyBooked: "هذه الجلسة لديها موعد محجوز بالفعل.",
    linkedAppointment: "موعد مرتبط",
    viewAppointment: "عرض الموعد",
    editAppointment: "تعديل الموعد",
    completed: "مكتملة",
    followUp: "متابعة قادمة",
    session: "الجلسة",
    empty: "لا توجد ملاحظات علاجية مسجلة للجلسة السابقة.",
  },
  he: {
    title: "מידע מהטיפול הקודם",
    previousNotes: "הערות טיפול",
    internalNotes: "הערות פנימיות לצוות",
    provider: "מטפל קודם",
    duration: "משך טיפול קודם",
    treatmentDetails: "פרטי טיפול",
    timeline: "ציר טיפולים",
    bookingFromFollowUp: "התור הזה נוצר מתוך תוכנית מעקב",
    alreadyBooked: "למפגש המעקב הזה כבר יש תור.",
    linkedAppointment: "תור מקושר",
    viewAppointment: "הצג תור",
    editAppointment: "עריכת תור",
    completed: "הושלם",
    followUp: "מעקב קרוב",
    session: "טיפול",
    empty: "לא נרשמו הערות קליניות לטיפול הקודם.",
  },
} as const;

const followUpModeCopy = {
  en: {
    repeatEvery: "Repeat every",
    helper: "A new follow-up will be created automatically after each completed session.",
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
  },
  ar: {
    repeatEvery: "تتكرر كل",
    helper: "سيتم إنشاء متابعة جديدة تلقائيًا بعد كل جلسة مكتملة.",
    day: "يوم",
    week: "أسبوع",
    month: "شهر",
    year: "سنة",
  },
  he: {
    repeatEvery: "חוזר כל",
    helper: "מעקב חדש ייווצר אוטומטית לאחר כל טיפול שהושלם.",
    day: "יום",
    week: "שבוע",
    month: "חודש",
    year: "שנה",
  },
} as const;

const followUpScheduleChangeCopy = {
  en: {
    banner: "Changing this appointment date may affect the follow-up plan.",
    confirm:
      "This appointment is linked to a follow-up plan. Recalculate upcoming session dates?",
    keep: "Keep dates unchanged",
    recalculate: "Recalculate dates",
  },
  ar: {
    banner: "تغيير تاريخ هذا الموعد قد يؤثر على خطة المتابعة.",
    confirm:
      "هذا الموعد مرتبط بخطة متابعة. هل تريد إعادة حساب تواريخ الجلسات القادمة؟",
    keep: "إبقاء التواريخ كما هي",
    recalculate: "إعادة حساب التواريخ",
  },
  he: {
    banner: "שינוי תאריך התור הזה עשוי להשפיע על תוכנית המעקב.",
    confirm:
      "התור הזה מקושר לתוכנית מעקב. לחשב מחדש את תאריכי המפגשים הבאים?",
    keep: "השארת התאריכים כפי שהם",
    recalculate: "חשב מחדש תאריכים",
  },
} as const;

function formatDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function resolveFollowUpProviderId(
  followUp: TenantPatientFollowUp,
  options: TenantAppointmentOptions,
) {
  const preferredIds = [
    followUp.lastTreatment?.provider?.id,
    ...followUp.treatmentTimeline
      .slice()
      .reverse()
      .map((item) => item.provider?.id),
  ].filter((value): value is string => Boolean(value));

  return preferredIds.find((id) =>
    options.providers.some((provider) => provider.id === id),
  ) ?? "";
}

function getFollowUpServiceName(
  followUp: TenantPatientFollowUp,
  _locale: "en" | "ar" | "he",
) {
  if (!followUp.service) return "";
  return followUp.service.nameEn || followUp.service.nameAr || followUp.service.nameHe;
}

type TreatmentTemplateOption = NonNullable<AppointmentService["treatmentTemplates"]>[number];

function getActiveTreatmentTemplates(service?: AppointmentService | null) {
  return (service?.treatmentTemplates ?? [])
    .filter((template) => template.isActive)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
}

function getTreatmentTemplateName(
  template: TreatmentTemplateOption,
  _locale: "en" | "ar" | "he",
) {
  const name = template.nameAr || template.nameEn || template.nameHe;
  return name || `${getTreatmentTemplateSessionCount(template) ?? ""}`;
}

function getTreatmentTemplateSessionCount(
  template: TreatmentTemplateOption,
  service?: AppointmentService | null,
) {
  if (typeof template.totalSessions === "number" && template.totalSessions > 0) {
    return template.totalSessions;
  }

  const phaseTotals = (template.phases ?? [])
    .map((rule) => rule.toSessionNumber)
    .filter((value) => Number.isInteger(value) && value > 0);

  if (phaseTotals.length > 0) {
    return Math.max(...phaseTotals);
  }

  if (
    typeof service?.totalRecommendedSessions === "number" &&
    service.totalRecommendedSessions > 0
  ) {
    return service.totalRecommendedSessions;
  }

  const servicePhaseTotals = Array.isArray(service?.followUpRules)
    ? service.followUpRules
        .map((rule) => rule.toSessionNumber)
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];

  return servicePhaseTotals.length > 0 ? Math.max(...servicePhaseTotals) : null;
}

function planFieldsFromTreatmentTemplate(
  template: TreatmentTemplateOption | null | undefined,
  service?: AppointmentService | null,
) {
  if (!template) {
    return {
      treatmentTemplateId: "",
    };
  }

  const sessionCount = getTreatmentTemplateSessionCount(template, service);
  const phases =
    template.phases && template.phases.length > 0
      ? template.phases.map((rule) => ({
          fromSessionNumber: rule.fromSessionNumber.toString(),
          toSessionNumber: rule.toSessionNumber.toString(),
          intervalDays: rule.intervalDays.toString(),
        }))
      : [
          {
            fromSessionNumber: "1",
            toSessionNumber: (sessionCount ?? "").toString(),
            intervalDays: (template.defaultIntervalDays ?? 30).toString(),
          },
        ];

  return {
    defaultIntervalDays: template.defaultIntervalDays?.toString() ?? "",
    followUpEnabled: true,
    followUpMode: "SESSION_BASED_PLAN" as const,
    followUpRules: phases,
    treatmentTemplateId: template.id,
    totalRecommendedSessions: (sessionCount ?? "").toString(),
  };
}

export function TenantAppointmentFormPage({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const appointmentId = params.id;
  const prefillPatientId = searchParams.get("patientId");
  const prefillServiceId = searchParams.get("serviceId");
  const sourceFollowUpId = searchParams.get("followUpId");
  const sourceBookingRequestId = searchParams.get("bookingRequestId");
  const prefillNotes = searchParams.get("notes");
  const prefillBranchId = searchParams.get("branchId");
  const [form, setForm] = useState<TenantAppointmentFormState>(() =>
    appointmentToForm(),
  );
  const [loadedAppointment, setLoadedAppointment] = useState<TenantAppointment | null>(null);
  const [options, setOptions] = useState<TenantAppointmentOptions | null>(null);
  const [errors, setErrors] = useState<TenantAppointmentFormErrors>({});
  const [conflictDetails, setConflictDetails] =
    useState<AppointmentConflictDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFollowUpScheduleDialog, setShowFollowUpScheduleDialog] =
    useState(false);
  const [slotState, setSlotState] = useState<SlotState>({ status: "prompt" });
  const [customServiceMode, setCustomServiceMode] = useState(false);
  const [sourceFollowUp, setSourceFollowUp] =
    useState<TenantPatientFollowUp | null>(null);
  const followUpHydratedRef = useRef(false);
  const urlPrefillHydratedRef = useRef(false);
  const [originalScheduling, setOriginalScheduling] = useState<{
    appointmentDate: string;
    durationMinutes: string;
    endTime: string;
    serviceId: string;
    staffUserId: string;
    startTime: string;
  } | null>(null);

  const isOfferAppointment =
    mode === "edit" &&
    Boolean(loadedAppointment?.offerTitle && !loadedAppointment?.serviceId);
  const usesCustomService = customServiceMode && !isOfferAppointment;

  useEffect(() => {
    let isMounted = true;

    if (isOfferAppointment) {
      queueMicrotask(() => {
        if (isMounted) setSlotState({ status: "prompt" });
      });
      return () => { isMounted = false; };
    }

    if (usesCustomService) {
      const duration = Number(form.durationMinutes);
      if (!form.durationMinutes || !Number.isFinite(duration) || duration <= 0) {
        queueMicrotask(() => {
          if (isMounted) setSlotState({ status: "needs_duration" });
        });
        return () => { isMounted = false; };
      }

      if (!form.appointmentDate) {
        queueMicrotask(() => {
          if (isMounted) setSlotState({ status: "prompt" });
        });
        return () => { isMounted = false; };
      }

      queueMicrotask(() => {
        if (isMounted) setSlotState({ status: "loading" });
      });
      getTenantAvailability(
        null,
        form.appointmentDate,
        form.staffUserId || undefined,
        mode === "edit" && appointmentId ? appointmentId : undefined,
        duration,
        true,
      )
        .then((res) => { if (isMounted) setSlotState({ status: "ready", slots: res.slots }); })
        .catch(() => { if (isMounted) setSlotState({ status: "error" }); });
      return () => { isMounted = false; };
    }

    const duration = Number(form.durationMinutes);
    if (
      !form.serviceId ||
      !form.staffUserId ||
      !form.appointmentDate ||
      !form.durationMinutes ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      queueMicrotask(() => {
        if (isMounted) setSlotState({ status: "prompt" });
      });
      return () => { isMounted = false; };
    }

    queueMicrotask(() => {
      if (isMounted) setSlotState({ status: "loading" });
    });
    getTenantAvailability(
      form.serviceId,
      form.appointmentDate,
      form.staffUserId || undefined,
      mode === "edit" && appointmentId ? appointmentId : undefined,
      duration,
    )
      .then((res) => { if (isMounted) setSlotState({ status: "ready", slots: res.slots }); })
      .catch(() => { if (isMounted) setSlotState({ status: "error" }); });
    return () => { isMounted = false; };
  }, [form.serviceId, form.durationMinutes, form.appointmentDate, form.staffUserId, mode, appointmentId, isOfferAppointment, usesCustomService]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getTenantAppointmentOptions(),
      mode === "edit" && appointmentId
        ? getTenantAppointment(appointmentId)
        : Promise.resolve(null),
    ])
      .then(([optionsResponse, appointment]) => {
        if (isMounted) {
          setOptions(optionsResponse);

          if (appointment) {
            setForm(appointmentToForm(appointment));
            setLoadedAppointment(appointment);
            setCustomServiceMode(
              Boolean(appointment.customServiceName && !appointment.serviceId),
            );
            setOriginalScheduling({
              appointmentDate: appointment.appointmentDate.slice(0, 10),
              durationMinutes: (
                appointment.customServiceDuration ?? appointment.durationMinutes
              ).toString(),
              endTime: appointment.endTime,
              serviceId: appointment.serviceId ?? "",
              staffUserId: appointment.staffUserId,
              startTime: appointment.startTime,
            });
          } else if (
            mode === "create" &&
            !sourceFollowUpId &&
            !urlPrefillHydratedRef.current &&
            (prefillPatientId || prefillServiceId || prefillBranchId)
          ) {
            setForm((current) => {
              const selectedService = optionsResponse.services.find(
                (service) => service.id === prefillServiceId,
              );
              const defaultTemplate = getActiveTreatmentTemplates(selectedService)[0];
              urlPrefillHydratedRef.current = true;
              return {
                ...current,
                ...planFieldsFromTreatmentTemplate(defaultTemplate, selectedService),
                patientId: prefillPatientId || current.patientId,
                serviceId: prefillServiceId || current.serviceId,
                branchId: prefillBranchId || current.branchId,
                notes: prefillNotes || current.notes,
                durationMinutes:
                  selectedService?.durationMinutes?.toString() ||
                  current.durationMinutes,
              };
            });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    appointmentId,
    mode,
    prefillPatientId,
    prefillServiceId,
    prefillBranchId,
    prefillNotes,
    sourceFollowUpId,
  ]);

  useEffect(() => {
    let isMounted = true;

    if (mode !== "create" || !sourceFollowUpId) {
      Promise.resolve().then(() => {
        if (isMounted) setSourceFollowUp(null);
      });
      return () => {
        isMounted = false;
      };
    }

    getTenantFollowUp(sourceFollowUpId)
      .then((followUp) => {
        if (isMounted) setSourceFollowUp(followUp);
      })
      .catch(() => {
        if (isMounted) setSourceFollowUp(null);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, sourceFollowUpId]);

  useEffect(() => {
    if (
      mode !== "create" ||
      !sourceFollowUpId ||
      !sourceFollowUp ||
      !options ||
      followUpHydratedRef.current
    ) {
      return;
    }

    const serviceId = sourceFollowUp.serviceId || prefillServiceId || "";
    const selectedService = options.services.find((service) => service.id === serviceId);
    const providerId = resolveFollowUpProviderId(sourceFollowUp, options);
    const defaultTemplate = getActiveTreatmentTemplates(selectedService)[0];

    followUpHydratedRef.current = true;
    setCustomServiceMode(false);
    setErrors({});
    setConflictDetails(null);
    setSaveError(null);
    setForm((current) => ({
      ...current,
      ...planFieldsFromTreatmentTemplate(defaultTemplate, selectedService),
      appointmentDate: sourceFollowUp.dueDate.slice(0, 10),
      durationMinutes:
        selectedService?.durationMinutes?.toString() ||
        sourceFollowUp.lastTreatment?.durationMinutes?.toString() ||
        current.durationMinutes,
      notes: current.notes.trim() || "موعد من خطة متابعة",
      patientId: sourceFollowUp.patientId || prefillPatientId || current.patientId,
      serviceId,
      staffUserId: providerId || current.staffUserId,
      startTime: "",
      status: "SCHEDULED",
    }));
  }, [
    mode,
    options,
    prefillPatientId,
    prefillServiceId,
    sourceFollowUp,
    sourceFollowUpId,
  ]);

  useEffect(() => {
    if (!options || !form.serviceId || usesCustomService || isOfferAppointment) {
      return;
    }

    const selectedService = options.services.find(
      (service) => service.id === form.serviceId,
    );
    const templates = getActiveTreatmentTemplates(selectedService);
    if (templates.length === 0) {
      if (form.treatmentTemplateId) {
        setForm((current) => ({
          ...current,
          treatmentTemplateId: "",
        }));
      }
      return;
    }

    const selectedTemplate = templates.find(
      (template) => template.id === form.treatmentTemplateId,
    );

    if (!selectedTemplate) {
      const defaultTemplate =
        templates.find((template) => template.isDefault) ?? templates[0];
      setForm((current) => ({
        ...current,
        ...planFieldsFromTreatmentTemplate(defaultTemplate, selectedService),
      }));
    }
  }, [
    form.serviceId,
    form.treatmentTemplateId,
    isOfferAppointment,
    options,
    usesCustomService,
  ]);

  return (
    <CenterAdminShell
      activeNav="appointments"
      requiredPermission={
        mode === "create" ? "appointments:create" : "appointments:update"
      }
      subtitle={(dictionary) => dictionary.appointments.subtitle}
      title={(dictionary) =>
        mode === "create"
          ? dictionary.appointments.addAppointment
          : dictionary.appointments.editAppointment
      }
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const followUpText = followUpContextCopy[locale];
        const visibleSlots =
          slotState.status === "ready"
            ? withCurrentAppointmentSlot(
                slotState.slots,
                mode,
                loadedAppointment,
                form,
              )
            : [];
        const linkedFollowUpAppointment = sourceFollowUp?.nextAppointment ?? null;
        const isDuplicateFollowUpBooking =
          mode === "create" && Boolean(linkedFollowUpAppointment);
        const followUpScheduleText = followUpScheduleChangeCopy[locale];
        const appointmentDateChangedOnLinkedFollowUp =
          mode === "edit" &&
          Boolean(loadedAppointment?.followUp) &&
          Boolean(originalScheduling) &&
          form.appointmentDate !== originalScheduling?.appointmentDate;

        const submit = async (recalculateFollowUpScheduleChoice?: boolean) => {
          if (isWriteBlocked) {
            return;
          }

          if (isDuplicateFollowUpBooking) {
            setSaveError(followUpText.alreadyBooked);
            return;
          }

          // Compare every scheduling field against the snapshot captured on
          // load. A notes-only or status-only edit must never re-validate the
          // slot because the original slot may now be PAST_TIME or off-grid.
          const changedSchedulingFields =
            mode !== "edit" ||
            !originalScheduling ||
            form.appointmentDate !== originalScheduling.appointmentDate ||
            form.startTime !== originalScheduling.startTime ||
            form.staffUserId !== originalScheduling.staffUserId ||
            form.serviceId !== originalScheduling.serviceId ||
            form.durationMinutes !== originalScheduling.durationMinutes;

          const isCurrentAppointmentSlotSelected =
            !changedSchedulingFields &&
            form.startTime === (originalScheduling?.startTime ?? "");

          const selectedSlotIsValid =
            isCurrentAppointmentSlotSelected || Boolean(form.startTime);

          const nextErrors = validateForm(
            form,
            dictionary,
            isOfferAppointment,
            usesCustomService,
            !changedSchedulingFields,
            (options?.branches.length ?? 0) > 1,
          );

          setErrors(nextErrors);
          setConflictDetails(null);
          setSaveError(null);

          if (Object.keys(nextErrors).length > 0) {
            return;
          }

          if (
            appointmentDateChangedOnLinkedFollowUp &&
            recalculateFollowUpScheduleChoice === undefined
          ) {
            setShowFollowUpScheduleDialog(true);
            return;
          }

          setIsSaving(true);

          try {
            const recalculateFollowUpSchedule =
              appointmentDateChangedOnLinkedFollowUp &&
              recalculateFollowUpScheduleChoice === true;
            const saved =
              mode === "edit" && appointmentId
                ? await updateTenantAppointment(
                    appointmentId,
                    {
                      ...formToAppointmentPayload(form),
                      recalculateFollowUpSchedule,
                    },
                  )
                : await createTenantAppointment({
                    ...formToAppointmentPayload(form),
                    followUpId: sourceFollowUpId ?? null,
                  });

            if (mode === "create" && sourceFollowUpId) {
              await updateTenantFollowUpStatus(
                sourceFollowUpId,
                "BOOKED",
                saved.id,
              ).catch(() => undefined);
            }

            if (mode === "create" && sourceBookingRequestId) {
              await linkBookingRequestAppointment(
                sourceBookingRequestId,
                saved.id,
              ).catch(() => undefined);
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new Event("tenant-booking-requests-updated"),
                );
              }
            }

            router.push(`/tenant/appointments/${saved.id}`);
          } catch (error) {
            const extracted = extractConflictDetails(error);
            const fieldErrors = extractErrors(error, dictionary);
            setErrors(fieldErrors);
            setConflictDetails(extracted);
            if (Object.keys(fieldErrors).length === 0 && !extracted) {
              const apiMessage =
                isApiRequestError(error) &&
                error.details &&
                typeof error.details === "object" &&
                "message" in error.details &&
                typeof (error.details as { message?: unknown }).message === "string"
                  ? (error.details as { message: string }).message
                  : null;
              setSaveError(apiMessage || dictionary.appointments.saveError);
            }
          } finally {
            setIsSaving(false);
          }
        };

        const followUpRuleWarnings = getFollowUpRuleWarnings(form, dictionary);
        const followUpPlanPreview = getFollowUpPlanPreview(form);
        const derivedTotalSessions =
          form.totalRecommendedSessions && Number(form.totalRecommendedSessions) > 0
            ? Number(form.totalRecommendedSessions)
            : calculateTotalSessionsFromRules(form.followUpRules);
        const modeText = followUpModeCopy[locale];
        const treatmentTemplateText = treatmentTemplateSelectCopy[locale];
        const selectedSavedService = options?.services.find(
          (service) => service.id === form.serviceId,
        );
        const treatmentTemplates = getActiveTreatmentTemplates(selectedSavedService);
        const applyFollowUpPreset = (preset: "LASER" | "HIJAMA" | "SKINCARE") => {
          if (preset === "LASER") {
            setForm({
              ...form,
              followUpEnabled: true,
              followUpMode: "SESSION_BASED_PLAN",
              defaultIntervalDays: "30",
              totalRecommendedSessions: "8",
              followUpRules: [
                { fromSessionNumber: "1", toSessionNumber: "4", intervalDays: "30" },
                { fromSessionNumber: "5", toSessionNumber: "8", intervalDays: "40" },
              ],
            });
            return;
          }
          setForm({
            ...form,
            followUpEnabled: true,
            followUpMode: "SESSION_BASED_PLAN",
            defaultIntervalDays: preset === "HIJAMA" ? "90" : "30",
            totalRecommendedSessions: "",
          });
        };

        return (
          <>
            <div className="mt-5">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/appointments"
              >
                {dictionary.nav.appointments}
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.appointments.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.appointments.loadError}
              </p>
            ) : null}

            {!isLoading && !loadError ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                {sourceFollowUp ? (
                  <section className="mb-5 rounded-lg border border-[#D8DEE8] bg-[#F8FAFC] p-4">
                    <div className="mb-4 rounded-lg border border-[#C8A45D]/40 bg-[#FFFCF4] px-4 py-3">
                      <p className="text-sm font-bold text-[#0B2D5C]">
                        {followUpText.bookingFromFollowUp}
                      </p>
                      <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-md bg-white/75 px-3 py-2">
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A98AA]">
                            {dictionary.appointments.patient}
                          </dt>
                          <dd className="mt-1 break-words text-xs font-bold text-[#24364f]">
                            {sourceFollowUp.patient.fullName}
                          </dd>
                        </div>
                        <div className="rounded-md bg-white/75 px-3 py-2">
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A98AA]">
                            {dictionary.appointments.service}
                          </dt>
                          <dd className="mt-1 break-words text-xs font-bold text-[#24364f]">
                            {getFollowUpServiceName(sourceFollowUp, locale) ||
                              dictionary.common.notAvailable}
                          </dd>
                        </div>
                        <div className="rounded-md bg-white/75 px-3 py-2">
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A98AA]">
                            {followUpText.session}
                          </dt>
                          <dd className="mt-1 break-words text-xs font-bold text-[#24364f]">
                            {sourceFollowUp.sessionNumber
                              ? `${followUpText.session} ${sourceFollowUp.sessionNumber}`
                              : followUpText.followUp}
                          </dd>
                        </div>
                        <div className="rounded-md bg-white/75 px-3 py-2">
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A98AA]">
                            {dictionary.appointments.appointmentDate}
                          </dt>
                          <dd className="mt-1 break-words text-xs font-bold text-[#24364f]">
                            {formatDateOnly(sourceFollowUp.dueDate)}
                          </dd>
                        </div>
                      </dl>
                      {linkedFollowUpAppointment ? (
                        <div className="mt-3 rounded-lg border border-blue-200 bg-white px-3 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-blue-800">
                                {followUpText.alreadyBooked}
                              </p>
                              <p className="mt-1 break-words text-xs font-bold text-[#24364f]">
                                {followUpText.linkedAppointment}:{" "}
                                {formatDateOnly(linkedFollowUpAppointment.appointmentDate)} ·{" "}
                                {formatTime12h(linkedFollowUpAppointment.startTime)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                className={buttonClassName("secondary", "sm")}
                                href={`/tenant/appointments/${linkedFollowUpAppointment.id}`}
                              >
                                {followUpText.viewAppointment}
                              </Link>
                              <Link
                                className={buttonClassName("primary", "sm")}
                                href={`/tenant/appointments/${linkedFollowUpAppointment.id}/edit`}
                              >
                                {followUpText.editAppointment}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <h2 className="text-base font-bold text-[#0B2D5C]">
                      {followUpText.title}
                    </h2>
                    {sourceFollowUp.lastTreatment ? (
                      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
                        <ContextDetail
                          label={followUpText.provider}
                          value={
                            sourceFollowUp.lastTreatment.provider?.fullName ||
                            dictionary.common.notAvailable
                          }
                        />
                        <ContextDetail
                          label={followUpText.duration}
                          value={`${sourceFollowUp.lastTreatment.durationMinutes} ${dictionary.services.durationUnitMinutes}`}
                        />
                        <ContextDetail
                          label={followUpText.treatmentDetails}
                          value={formatDateOnly(
                            sourceFollowUp.lastTreatment.appointmentDate,
                          )}
                        />
                        <ContextNote
                          label={followUpText.previousNotes}
                          value={sourceFollowUp.lastTreatment.notes}
                        />
                        <ContextNote
                          label={followUpText.internalNotes}
                          value={sourceFollowUp.lastTreatment.internalNotes}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#66758a]">
                        {followUpText.empty}
                      </p>
                    )}
                    {sourceFollowUp.treatmentTimeline.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-sm font-bold text-[#24364f]">
                          {followUpText.timeline}
                        </h3>
                        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {sourceFollowUp.treatmentTimeline.map((item) => (
                            <div
                              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#24364f]"
                              key={`${item.type}-${item.id}`}
                            >
                              {followUpText.session} {item.sessionNumber} —{" "}
                              {item.type === "COMPLETED"
                                ? followUpText.completed
                                : followUpText.followUp}
                              {item.provider?.fullName ? (
                                <span className="mt-1 block text-xs text-[#66758a]">
                                  {followUpText.provider}:{" "}
                                  {item.provider.fullName}
                                </span>
                              ) : null}
                              <span className="mt-1 block text-xs text-[#66758a]">
                                {formatDateOnly(item.date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    error={errors.patientId}
                    label={dictionary.appointments.patient}
                  >
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, patientId: event.target.value })
                      }
                      value={form.patientId}
                    >
                      <option value="">{dictionary.appointments.patient}</option>
                      {options?.patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.fullName} · {patient.phone}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {isOfferAppointment ? (
                    <Field label={dictionary.appointments.service}>
                      <div className="flex min-h-11 items-center gap-2 rounded-md border border-[#D8DEE8] bg-[#F8FAFC] px-3 text-sm text-[#132238]">
                        <span>🎁</span>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold truncate">
                            {loadedAppointment?.offerTitle ?? dictionary.appointments.service}
                          </p>
                          {loadedAppointment?.offerPrice ? (
                            <p className="text-xs text-[#66758a]">
                              {loadedAppointment.offerPrice}{" "}
                              {loadedAppointment.offerCurrency}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Field>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="mb-3 flex w-fit items-center gap-2 text-sm font-bold text-[#24364f]">
                        <input
                          checked={customServiceMode}
                          onChange={(event) => {
                            const enabled = event.target.checked;
                            setCustomServiceMode(enabled);
                            setForm({
                              ...form,
                              customServiceName: enabled
                                ? form.customServiceName
                                : "",
                              customServicePrice: enabled
                                ? form.customServicePrice
                                : "",
                              saveCustomService: enabled
                                ? form.saveCustomService
                                : false,
                              serviceId: enabled ? "" : form.serviceId,
                              startTime: "",
                            });
                          }}
                          type="checkbox"
                        />
                        {dictionary.appointments.customService}
                      </label>

                      {usesCustomService ? (
                        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                          <Field
                            error={errors.customServiceName}
                            label={dictionary.appointments.customServiceName}
                          >
                            <input
                              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  customServiceName: event.target.value,
                                })
                              }
                              value={form.customServiceName}
                            />
                          </Field>
                          <Field
                            error={errors.durationMinutes}
                            helper={dictionary.appointments.customServiceDurationHelper}
                            label={
                              dictionary.appointments.customServiceDuration
                            }
                          >
                            <div className="relative flex items-center">
                              <input
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 pe-20 text-sm text-[#132238]"
                                min="1"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    durationMinutes: event.target.value,
                                  })
                                }
                                placeholder={dictionary.appointments.customServiceDurationPlaceholder}
                                type="number"
                                value={form.durationMinutes}
                              />
                              <span className="pointer-events-none absolute end-3 select-none text-sm text-[#66758a]">
                                {dictionary.services.durationUnitMinutes}
                              </span>
                            </div>
                          </Field>
                          <Field
                            error={errors.customServicePrice}
                            helper={dictionary.appointments.customServicePriceHelper}
                            label={dictionary.appointments.customServicePrice}
                          >
                            <div className="relative flex items-center">
                              <input
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 pe-10 text-sm text-[#132238]"
                                min="0"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    customServicePrice: event.target.value,
                                  })
                                }
                                placeholder={dictionary.appointments.customServicePricePlaceholder}
                                step="0.01"
                                type="number"
                                value={form.customServicePrice}
                              />
                              <span className="pointer-events-none absolute end-3 select-none text-sm text-[#66758a]">₪</span>
                            </div>
                          </Field>
                          <label className="flex items-center gap-2 text-sm font-bold text-[#24364f] md:col-span-3">
                            <input
                              checked={form.saveCustomService}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  saveCustomService: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            {dictionary.appointments.saveCustomService}
                          </label>
                          {form.saveCustomService ? (
                            <div className="md:col-span-3">
                              <section className="mt-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h2 className="text-base font-bold text-[#0B2D5C]">
                                      {dictionary.services.followUpSettings}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#66758a]">
                                      {dictionary.services.followUpDescription}
                                    </p>
                                    <p className="mt-2 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                                      {
                                        dictionary.appointments
                                          .followUpCreatedAfterCompletionHelper
                                      }
                                    </p>
                                  </div>
                                  <div className="grid min-w-0 grid-cols-1 gap-2 sm:min-w-[360px]">
                                    {([
                                      ["NONE", dictionary.services.followUp.none, ""],
                                      ["SESSION_BASED_PLAN", dictionary.services.followUp.sessionBasedPlan, dictionary.services.followUp.sessionBasedHelper],
                                      ["RECURRING_CONTINUOUS", dictionary.services.followUp.recurring, dictionary.services.followUp.recurringHelper],
                                    ] as const).map(([modeValue, label, helper]) => (
                                      <label
                                        className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] bg-white px-3 text-sm font-semibold text-[#24364f]"
                                        key={modeValue}
                                      >
                                        <input
                                          checked={form.followUpMode === modeValue}
                                          onChange={() =>
                                            setForm({
                                              ...form,
                                              followUpEnabled: modeValue !== "NONE",
                                              followUpMode: modeValue,
                                            })
                                          }
                                          type="radio"
                                        />
                                        <span className="min-w-0">
                                          <span className="block">{label}</span>
                                          {helper ? <span className="mt-0.5 block text-xs font-normal text-[#66758a]">{helper}</span> : null}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                {form.followUpMode !== "NONE" ? (
                                  <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                                    {form.followUpMode === "SESSION_BASED_PLAN" ? (
                                      <div className="md:col-span-2 space-y-4">
                                        <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
                                          {dictionary.services.followUp.sessionBasedHelper}
                                        </p>
                                        <SessionTotalSummary count={derivedTotalSessions ?? 0} dictionary={dictionary} locale={locale} />
                                        <label className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] bg-white px-3 text-sm font-semibold text-[#24364f]">
                                          <input
                                            checked={form.autoCreateNextReminder}
                                            onChange={(event) => setForm({ ...form, autoCreateNextReminder: event.target.checked })}
                                            type="checkbox"
                                          />
                                          {dictionary.services.createNextReminderAutomatically}
                                        </label>
                                      </div>
                                    ) : null}

                                    {form.followUpMode === "RECURRING_CONTINUOUS" ? (
                                      <>
                                        <p className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 md:col-span-2">
                                          {dictionary.services.followUp.recurringHelper}
                                        </p>
                                        <Field
                                          error={errors.recurringIntervalValue}
                                          label={modeText.repeatEvery}
                                        >
                                          <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,0.8fr)] gap-2">
                                            <input
                                              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                              min="1"
                                              onChange={(event) =>
                                                setForm({
                                                  ...form,
                                                  recurringIntervalValue: event.target.value,
                                                })
                                              }
                                              step="1"
                                              type="number"
                                              value={form.recurringIntervalValue}
                                            />
                                            <select
                                              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                                              onChange={(event) =>
                                                setForm({
                                                  ...form,
                                                  recurringIntervalUnit: event.target.value as TenantAppointmentFormState["recurringIntervalUnit"],
                                                })
                                              }
                                              value={form.recurringIntervalUnit}
                                            >
                                              <option value="DAY">{modeText.day}</option>
                                              <option value="WEEK">{modeText.week}</option>
                                              <option value="MONTH">{modeText.month}</option>
                                              <option value="YEAR">{modeText.year}</option>
                                            </select>
                                          </div>
                                        </Field>
                                      </>
                                    ) : null}

                                    {form.followUpMode === "SESSION_BASED_PLAN" ? (
                                    <div className="md:col-span-2">
                                      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                                        {(
                                          [
                                            { key: "LASER" as const, label: dictionary.services.laserPreset },
                                            { key: "HIJAMA" as const, label: dictionary.services.hijamaPreset },
                                            { key: "SKINCARE" as const, label: dictionary.services.skincarePreset },
                                          ] as const
                                        ).map((preset) => (
                                          <button
                                            className={buttonClassName("secondary", "sm", "justify-between bg-white")}
                                            key={preset.key}
                                            onClick={() => applyFollowUpPreset(preset.key)}
                                            type="button"
                                          >
                                            <span>{preset.label}</span>
                                            <span className="text-[#C8A45D]">
                                              {dictionary.services.applyPreset}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    ) : null}
                                    {form.followUpMode === "SESSION_BASED_PLAN" ? (
                                      <div className="md:col-span-2">
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <h3 className="text-sm font-bold text-[#24364f]">
                                              {dictionary.services.treatmentPhases}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-[#66758a]">
                                              {dictionary.services.followUpRuleHelper}
                                            </p>
                                          </div>
                                          <button
                                            className={buttonClassName("primary", "sm", "shrink-0")}
                                            onClick={() =>
                                              setForm({
                                                ...form,
                                                followUpRules: [
                                                  ...form.followUpRules,
                                                  { fromSessionNumber: "", toSessionNumber: "", intervalDays: "" },
                                                ],
                                              })
                                            }
                                            type="button"
                                          >
                                            + {dictionary.services.addRule}
                                          </button>
                                        </div>
                                        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
                                          {form.followUpRules.map((rule, index) => (
                                            <div
                                              className="rounded-lg border border-[#D8DEE8] bg-white p-4 shadow-[0_10px_24px_rgba(11,45,92,0.04)]"
                                              key={`custom-follow-up-rule-${index}`}
                                            >
                                              <div className="flex items-start justify-between gap-3">
                                                <div>
                                                  <h4 className="text-sm font-bold text-[#0B2D5C]">
                                                    {dictionary.services.phaseTitle(index + 1)}
                                                  </h4>
                                                  <p className="mt-1 text-xs font-semibold text-[#66758a]">
                                                    {dictionary.services.sessionsFrom}{" "}
                                                    {rule.fromSessionNumber || "-"}{" "}
                                                    {dictionary.services.sessionsTo}{" "}
                                                    {rule.toSessionNumber || "-"}
                                                  </p>
                                                  {parseFollowUpRuleValue(rule.intervalDays) ? (
                                                    <p className="mt-2 text-sm font-bold text-[#0B2D5C]">
                                                      <span aria-hidden="true">⏰ </span>
                                                      {dictionary.services.reminderAfterDays(
                                                        Number(rule.intervalDays),
                                                      )}
                                                    </p>
                                                  ) : null}
                                                </div>
                                              </div>
                                              <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                                                {(
                                                  [
                                                    "fromSessionNumber",
                                                    "toSessionNumber",
                                                    "intervalDays",
                                                  ] as FollowUpRuleField[]
                                                ).map((field) => (
                                                  <label className="block min-w-0" key={field}>
                                                    <span className="text-xs font-bold text-[#24364f]">
                                                      {followUpRuleLabel(dictionary, field)}
                                                    </span>
                                                    <input
                                                      className="mt-1 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                                      min="1"
                                                      onChange={(event) => {
                                                        const nextRules = [
                                                          ...form.followUpRules,
                                                        ];
                                                        nextRules[index] = {
                                                          ...nextRules[index],
                                                          [field]: event.target.value,
                                                        };
                                                        setForm({
                                                          ...form,
                                                          followUpRules: nextRules,
                                                        });
                                                      }}
                                                      type="number"
                                                      value={rule[field]}
                                                    />
                                                  </label>
                                                ))}
                                              </div>
                                              <div className="mt-4 flex justify-end">
                                                <button
                                                  className={buttonClassName("danger", "sm")}
                                                  onClick={() =>
                                                    setForm({
                                                      ...form,
                                                      followUpRules: form.followUpRules.filter(
                                                        (_, ruleIndex) => ruleIndex !== index,
                                                      ),
                                                    })
                                                  }
                                                  type="button"
                                                >
                                                  {dictionary.services.deletePhase}
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        {followUpRuleWarnings.length > 0 ? (
                                          <div className="mt-3 space-y-2 rounded-lg border border-[#F7DFA8] bg-[#FFF8E7] p-3">
                                            {followUpRuleWarnings.map((warning) => (
                                              <p
                                                className="text-sm font-semibold text-[#8A5A00]"
                                                key={warning}
                                              >
                                                {warning}
                                              </p>
                                            ))}
                                          </div>
                                        ) : null}
                                        <div className="mt-4 rounded-lg border border-[#D8DEE8] bg-white p-4">
                                          <h3 className="text-sm font-bold text-[#0B2D5C]">
                                            {dictionary.services.planPreview}
                                          </h3>
                                          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                            {followUpPlanPreview.map((item) => (
                                              <div
                                                className="rounded-md bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#24364f]"
                                                key={`custom-follow-up-preview-${item.session}`}
                                              >
                                                {dictionary.services.previewSessionLine(
                                                  item.session,
                                                  item.interval,
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : null}
                                    {form.followUpMode === "SESSION_BASED_PLAN" ? (
                                    <>
                                    <Field
                                      className="md:col-span-2"
                                      label={dictionary.services.whatsappMessageArabic}
                                    >
                                      <textarea
                                        className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                        dir="rtl"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            reminderMessageAr: event.target.value,
                                          })
                                        }
                                        value={form.reminderMessageAr}
                                      />
                                    </Field>
                                    <Field label={dictionary.services.whatsappMessageEnglish}>
                                      <textarea
                                        className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            reminderMessageEn: event.target.value,
                                          })
                                        }
                                        value={form.reminderMessageEn}
                                      />
                                    </Field>
                                    <Field label={dictionary.services.whatsappMessageHebrew}>
                                      <textarea
                                        className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                        dir="rtl"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            reminderMessageHe: event.target.value,
                                          })
                                        }
                                        value={form.reminderMessageHe}
                                      />
                                    </Field>
                                    </>
                                    ) : null}
                                  </div>
                                ) : null}
                              </section>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-[#66758a] md:col-span-3">
                              {dictionary.appointments.followUpPlanLockedHelper}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <Field
                            error={errors.serviceId}
                            label={dictionary.appointments.service}
                          >
                            <select
                              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                              onChange={(event) => {
                                const service = options?.services.find(
                                  (item) => item.id === event.target.value,
                                );
                                const defaultTemplate = getActiveTreatmentTemplates(service)[0];
                                setForm({
                                  ...form,
                                  ...planFieldsFromTreatmentTemplate(defaultTemplate, service),
                                  durationMinutes:
                                    service?.durationMinutes?.toString() ||
                                    form.durationMinutes,
                                  serviceId: event.target.value,
                                  startTime: "",
                                });
                              }}
                              value={form.serviceId}
                            >
                              <option value="">
                                {dictionary.appointments.service}
                              </option>
                              {options?.services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {getLocalizedAppointmentServiceName(
                                    service,
                                    locale,
                                  )}
                                </option>
                              ))}
                            </select>
                          </Field>
                          {treatmentTemplates.length > 0 ? (
                            <>
                            <Field
                              className="md:col-span-2"
                              helper={treatmentTemplateText.helper}
                              label={treatmentTemplateText.label}
                            >
                              <select
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                onChange={(event) => {
                                  const template =
                                    treatmentTemplates.find(
                                      (item) => item.id === event.target.value,
                                    ) ?? null;
                                  setForm({
                                    ...form,
                                    ...planFieldsFromTreatmentTemplate(
                                      template,
                                      selectedSavedService,
                                    ),
                                    startTime: "",
                                  });
                                }}
                                value={form.treatmentTemplateId}
                              >
                                {treatmentTemplates.map((template) => {
                                  const templateSessionCount =
                                    getTreatmentTemplateSessionCount(
                                      template,
                                      selectedSavedService,
                                    );
                                  return (
                                    <option key={template.id} value={template.id}>
                                      {getTreatmentTemplateName(template, locale)} —{" "}
                                      {templateSessionCount
                                        ? dictionary.services.totalSessionsSummary(
                                            templateSessionCount,
                                          )
                                        : dictionary.common.notAvailable}
                                    </option>
                                  );
                                })}
                              </select>
                            </Field>
                            </>
                          ) : null}
                          {form.treatmentTemplateId ? (
                            <div className="md:col-span-2 rounded-lg border border-sky-100 bg-sky-50 p-4">
                              <p className="text-xs font-bold text-sky-800">
                                {treatmentTemplateText.helper}
                              </p>
                              <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label={dictionary.services.totalRecommendedSessions}>
                                  <input
                                    className="min-h-10 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                                    min="1"
                                    onChange={(event) => {
                                      const total = event.target.value;
                                      setForm({
                                        ...form,
                                        followUpRules: [
                                          {
                                            fromSessionNumber: "1",
                                            intervalDays:
                                              form.defaultIntervalDays ||
                                              form.followUpRules[0]?.intervalDays ||
                                              "30",
                                            toSessionNumber: total,
                                          },
                                        ],
                                        totalRecommendedSessions: total,
                                      });
                                    }}
                                    type="number"
                                    value={form.totalRecommendedSessions}
                                  />
                                </Field>
                                <Field label={dictionary.services.defaultIntervalDays}>
                                  <input
                                    className="min-h-10 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                                    min="1"
                                    onChange={(event) => {
                                      const interval = event.target.value;
                                      setForm({
                                        ...form,
                                        defaultIntervalDays: interval,
                                        followUpRules: form.followUpRules.map((rule) => ({
                                          ...rule,
                                          intervalDays: interval || rule.intervalDays,
                                        })),
                                      });
                                    }}
                                    type="number"
                                    value={form.defaultIntervalDays}
                                  />
                                </Field>
                              </div>
                            </div>
                          ) : null}
                          {mode === "edit" && loadedAppointment?.customServiceSaved && form.serviceId ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {dictionary.appointments.savedServiceBadge}
                              </span>
                            </div>
                          ) : null}
                          {mode === "edit" && loadedAppointment?.service?.followUpEnabled === true && form.serviceId ? (
                            <div className="mt-2 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                              <span>{dictionary.appointments.followUpActiveInService}</span>
                              {" "}
                              <Link
                                className="underline hover:text-sky-900"
                                href={`/tenant/services/${form.serviceId}`}
                              >
                                {dictionary.appointments.editServiceFollowUp}
                              </Link>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}
                  <Field
                    error={errors.staffUserId}
                    label={dictionary.appointments.provider}
                  >
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, staffUserId: event.target.value })
                      }
                      value={form.staffUserId}
                    >
                      <option value="">{dictionary.appointments.provider}</option>
                      {options?.providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {getAppointmentProviderName(provider) ||
                            dictionary.common.notAvailable}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {options && options.branches.length > 1 ? (
                    <Field
                      error={errors.branchId}
                      label={dictionary.appointments.branch}
                    >
                      <select
                        className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                        onChange={(event) =>
                          setForm({ ...form, branchId: event.target.value })
                        }
                        value={form.branchId}
                      >
                        <option value="">
                          {dictionary.appointments.chooseBranch}
                        </option>
                        {options.branches.map((branch) => (
                          <option
                            key={branch.id}
                            value={branch.id}
                            title={getBranchLabel(branch, locale)}
                          >
                            {getBranchLabel(branch, locale)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                  <Field
                    error={errors.appointmentDate}
                    label={dictionary.appointments.appointmentDate}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          appointmentDate: event.target.value,
                          startTime: "",
                        })
                      }
                      type="date"
                      value={form.appointmentDate}
                    />
                  </Field>
                  {appointmentDateChangedOnLinkedFollowUp ? (
                    <p className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                      {followUpScheduleText.banner}
                    </p>
                  ) : null}
                  <div className="min-w-0 md:col-span-2">
                    <span className="text-sm font-semibold text-[#24364f]">
                      {dictionary.appointments.startTime}
                    </span>
                    <div className="mt-2">
                      {isOfferAppointment ? (
                        <input
                          className="min-h-11 w-full max-w-xs rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                          onChange={(e) =>
                            setForm({ ...form, startTime: e.target.value })
                          }
                          type="time"
                          value={form.startTime}
                        />
                      ) : slotState.status === "needs_duration" ? (
                        <p className="text-sm text-[#66758a]">
                          {dictionary.appointments.enterDurationToSeeSlots}
                        </p>
                      ) : slotState.status === "prompt" ? (
                        <p className="text-sm text-[#66758a]">
                          {dictionary.appointments.selectServiceAndDate}
                        </p>
                      ) : slotState.status === "loading" ? (
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-9 w-16 animate-pulse rounded-md bg-[#E5E7EB]"
                            />
                          ))}
                        </div>
                      ) : slotState.status === "error" ? (
                        <p className="text-sm text-[#B42318]">
                          {dictionary.appointments.loadError}
                        </p>
                      ) : visibleSlots.length === 0 ? (
                        <p className="text-sm text-[#66758a]">
                          {dictionary.appointments.noSlots}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {visibleSlots.map(({ time, available, reason }) => {
                            const isSelected = form.startTime === time;
                            const isCurrentSlot = reason === "CURRENT_APPOINTMENT";
                            const isSelectable = available || isCurrentSlot;
                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={!isSelectable}
                                onClick={() =>
                                  setForm({ ...form, startTime: time })
                                }
                                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                                  isSelected
                                    ? "border-[#0B2D5C] bg-[#0B2D5C] text-white"
                                    : isCurrentSlot
                                      ? "border-[#C8A45D] bg-[#FFFCF4] text-[#0B2D5C] hover:border-[#0B2D5C]"
                                    : isSelectable
                                      ? "border-[#D8DEE8] bg-white text-[#24364f] hover:border-[#0B2D5C] hover:bg-[#F0F4FA]"
                                      : "cursor-not-allowed border-[#E5E7EB] bg-[#F8FAFC] text-[#A0AEC0] line-through"
                                }`}
                              >
                                {time}
                                {isCurrentSlot ? (
                                  <span className="ms-1 text-[10px] font-bold">
                                    · {dictionary.appointments.currentAppointmentSlot}
                                  </span>
                                ) : null}
                                {!isSelectable && (
                                  <span className="ms-1 text-[10px] font-normal">
                                    · {dictionary.appointments.slotBooked}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {errors.startTime ? (
                      <span className="mt-1 block text-xs font-semibold text-[#B42318]">
                        {errors.startTime}
                      </span>
                    ) : null}
                  </div>
                  {!usesCustomService ? (
                    <Field
                      error={errors.durationMinutes}
                      helper={dictionary.appointments.durationMinutesHelper}
                      label={dictionary.appointments.durationMinutes}
                    >
                      <div className="relative flex items-center">
                        <input
                          className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 pe-20 text-sm text-[#132238]"
                          min="1"
                          onChange={(event) =>
                            setForm({
                              ...form,
                              durationMinutes: event.target.value,
                            })
                          }
                          placeholder={dictionary.appointments.durationMinutesPlaceholder}
                          type="number"
                          value={form.durationMinutes}
                        />
                        <span className="pointer-events-none absolute end-3 select-none text-sm text-[#66758a]">
                          {dictionary.services.durationUnitMinutes}
                        </span>
                      </div>
                    </Field>
                  ) : null}
                  <Field label={dictionary.appointments.status}>
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as AppointmentStatus,
                        })
                      }
                      value={form.status}
                    >
                      {appointmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {dictionary.appointmentStatuses[status]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    error={errors.endTime}
                    label={dictionary.appointments.endTime}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] bg-[#F8FAFC] px-3 text-sm text-[#66758a]"
                      readOnly
                      value={calculateEndTime(
                        form.startTime,
                        form.durationMinutes,
                      )}
                    />
                  </Field>
                  <Field
                    className="md:col-span-2"
                    helper={dictionary.appointments.notesHelper}
                    label={dictionary.appointments.notes}
                  >
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, notes: event.target.value })
                      }
                      value={form.notes}
                    />
                  </Field>
                  <Field
                    className="md:col-span-2"
                    helper={dictionary.appointments.internalNotesHelper}
                    label={dictionary.appointments.internalNotes}
                  >
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, internalNotes: event.target.value })
                      }
                      value={form.internalNotes}
                    />
                  </Field>
                </div>

                {conflictDetails ? (
                  <AppointmentConflictAlert
                    details={conflictDetails}
                    dictionary={dictionary}
                    locale={locale}
                  />
                ) : null}

                {saveError ? (
                  <p className="mt-4 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
                    {saveError}
                  </p>
                ) : null}

                {isWriteBlocked ? (
                  <p className="mt-4 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
                    {restrictionMessage}
                  </p>
                ) : null}

                {showFollowUpScheduleDialog ? (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
                      <p className="text-base font-bold text-[#132238]">
                        {followUpScheduleText.confirm}
                      </p>
                      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          className={buttonClassName("secondary", "md")}
                          onClick={() => {
                            setShowFollowUpScheduleDialog(false);
                            void submit(false);
                          }}
                          type="button"
                        >
                          {followUpScheduleText.keep}
                        </button>
                        <button
                          className={buttonClassName("primary", "md")}
                          onClick={() => {
                            setShowFollowUpScheduleDialog(false);
                            void submit(true);
                          }}
                          type="button"
                        >
                          {followUpScheduleText.recalculate}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    className={buttonClassName("secondary", "md")}
                    href="/tenant/appointments"
                  >
                    {dictionary.common.cancel}
                  </Link>
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={isSaving || isWriteBlocked || isDuplicateFollowUpBooking}
                    onClick={() => {
                      void submit();
                    }}
                    title={
                      isDuplicateFollowUpBooking
                        ? followUpText.alreadyBooked
                        : restrictionMessage || undefined
                    }
                    type="button"
                  >
                    {isSaving
                      ? dictionary.common.saving
                      : mode === "create"
                        ? dictionary.appointments.submit
                        : dictionary.appointments.update}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function getTotalSessionsSummary(
  dictionary: CenterAdminDictionary,
  _locale: "en" | "ar" | "he",
  count: number,
) {
  return dictionary.services.totalSessionsSummary(count);
}

function getTotalSessionsCalculated(
  dictionary: CenterAdminDictionary,
  _locale: "en" | "ar" | "he",
) {
  return dictionary.services.totalSessionsCalculated;
}

function SessionTotalSummary({
  count,
  dictionary,
  locale,
}: {
  count: number;
  dictionary: CenterAdminDictionary;
  locale: "en" | "ar" | "he";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
      <p className="text-sm font-bold text-[#0B2D5C]">
        {getTotalSessionsSummary(dictionary, locale, count)}
      </p>
      <p className="mt-1 text-xs font-medium leading-5 text-[#66758a]">
        {getTotalSessionsCalculated(dictionary, locale)}
      </p>
    </div>
  );
}

function Field({
  children,
  className = "",
  error,
  helper,
  label,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  helper?: string;
  label: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-sm font-semibold text-[#24364f]">{label}</span>
      <span className="mt-2 block">{children}</span>
      {helper ? (
        <span className="mt-1 block text-xs text-[#66758a]">{helper}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ContextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <span className="block text-xs font-bold text-[#66758a]">{label}</span>
      <span className="mt-1 block break-words text-sm font-bold text-[#132238]">
        {value}
      </span>
    </div>
  );
}

function ContextNote({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;

  return (
    <div className="rounded-md bg-white p-3 md:col-span-3">
      <span className="block text-xs font-bold text-[#66758a]">{label}</span>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#132238]">
        {value}
      </p>
    </div>
  );
}
