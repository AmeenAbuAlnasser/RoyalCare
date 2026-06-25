import type {
  TenantService,
  TenantServicePayload,
} from "@/lib/api/tenant-services";

export type TenantServiceFormState = {
  currency: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionHe: string;
  bufferMinutes: string;
  durationMinutes: string;
  durationUnit: "HOURS" | "MINUTES";
  followUpEnabled: boolean;
  followUpMode: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  defaultIntervalDays: string;
  totalRecommendedSessions: string;
  recurringIntervalValue: string;
  recurringIntervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  autoWhatsappReminderEnabled: boolean;
  autoReminderDaysBefore: string;
  autoCreateNextReminder: boolean;
  reminderMessageAr: string;
  reminderMessageEn: string;
  reminderMessageHe: string;
  followUpRules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>;
  treatmentTemplates: Array<{
    id?: string | null;
    nameAr: string;
    nameEn: string;
    nameHe: string;
    totalSessions: string;
    defaultIntervalDays: string;
    phases: Array<{
      fromSessionNumber: string;
      toSessionNumber: string;
      intervalDays: string;
    }>;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: string;
  }>;
  coverImageUrl: string | null;
  coverImageAlt: string;
  isActive: boolean;
  nameAr: string;
  nameEn: string;
  nameHe: string;
  price: string;
};

export type TenantServiceFormErrors = Partial<
  Record<keyof TenantServiceFormState, string>
>;

type FollowUpRuleDraft = {
  toSessionNumber: string;
};

/**
 * Converts form-state follow-up rule strings to numbers for the API payload.
 * Input values have already been validated by validateForm; we just coerce them.
 */
export function normalizeFollowUpRules(
  rules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>,
): Array<{
  fromSessionNumber: number;
  toSessionNumber: number;
  intervalDays: number;
}> {
  return rules.map((rule) => ({
    fromSessionNumber: Number(rule.fromSessionNumber),
    toSessionNumber: Number(rule.toSessionNumber),
    intervalDays: Number(rule.intervalDays),
  }));
}

export function calculateTotalSessionsFromRules(rules: FollowUpRuleDraft[]) {
  const totals = rules
    .map((rule) => Number(rule.toSessionNumber))
    .filter((value) => Number.isInteger(value) && value > 0);

  return totals.length > 0 ? Math.max(...totals) : null;
}

export function serviceToForm(service?: TenantService): TenantServiceFormState {
  return {
    currency: service?.currency ?? "ILS",
    descriptionAr: service?.descriptionAr ?? "",
    descriptionEn: service?.descriptionEn ?? "",
    descriptionHe: service?.descriptionHe ?? "",
    bufferMinutes: service?.bufferMinutes?.toString() ?? "0",
    durationMinutes: service?.durationMinutes?.toString() ?? "",
    durationUnit: "MINUTES",
    followUpEnabled: service?.followUpEnabled ?? false,
    followUpMode:
      service?.followUpMode ??
      ((service?.followUpEnabled ?? false) ? "SESSION_BASED_PLAN" : "NONE"),
    defaultIntervalDays: service?.defaultIntervalDays?.toString() ?? "",
    totalRecommendedSessions:
      service?.totalRecommendedSessions?.toString() ?? "",
    recurringIntervalValue: service?.recurringIntervalValue?.toString() ?? "3",
    recurringIntervalUnit: service?.recurringIntervalUnit ?? "MONTH",
    autoWhatsappReminderEnabled:
      service?.autoWhatsappReminderEnabled ?? false,
    autoReminderDaysBefore:
      service?.autoReminderDaysBefore?.toString() ?? "3",
    autoCreateNextReminder: service?.autoCreateNextReminder ?? true,
    reminderMessageAr: service?.reminderMessageAr ?? "",
    reminderMessageEn: service?.reminderMessageEn ?? "",
    reminderMessageHe: service?.reminderMessageHe ?? "",
    followUpRules:
      service?.followUpRules?.map((rule) => ({
        fromSessionNumber: rule.fromSessionNumber.toString(),
        toSessionNumber: rule.toSessionNumber.toString(),
        intervalDays: rule.intervalDays.toString(),
      })) ??
      (service?.followUpMode === "SESSION_BASED_PLAN" &&
      service.totalRecommendedSessions
        ? [
            {
              fromSessionNumber: "1",
              toSessionNumber: service.totalRecommendedSessions.toString(),
              intervalDays: service.defaultIntervalDays?.toString() ?? "30",
            },
          ]
        : [
            { fromSessionNumber: "1", toSessionNumber: "4", intervalDays: "30" },
            { fromSessionNumber: "5", toSessionNumber: "8", intervalDays: "40" },
          ]),
    treatmentTemplates:
      service?.treatmentTemplates?.map((template, index) => ({
        id: template.id,
        nameAr: template.nameAr,
        nameEn: template.nameEn,
        nameHe: template.nameHe,
        totalSessions: template.totalSessions.toString(),
        defaultIntervalDays: template.defaultIntervalDays?.toString() ?? "",
        phases:
          template.phases?.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber.toString(),
            toSessionNumber: rule.toSessionNumber.toString(),
            intervalDays: rule.intervalDays.toString(),
          })) ?? [],
        isDefault: template.isDefault,
        isActive: template.isActive,
        sortOrder: template.sortOrder?.toString() ?? index.toString(),
      })) ?? [],
    coverImageUrl: service?.coverImageUrl ?? null,
    coverImageAlt: service?.coverImageAlt ?? "",
    isActive: service?.isActive ?? true,
    nameAr: service?.nameAr ?? "",
    nameEn: service?.nameEn ?? "",
    nameHe: service?.nameHe ?? "",
    price: service?.price?.toString() ?? "",
  };
}

export function formToPayload(
  form: TenantServiceFormState,
): TenantServicePayload {
  const durationValue = Number(form.durationMinutes);
  const durationMinutes =
    form.durationMinutes && Number.isFinite(durationValue)
      ? form.durationUnit === "HOURS"
        ? durationValue * 60
        : durationValue
      : null;

  return {
    bufferMinutes: form.bufferMinutes || 0,
    currency: form.currency,
    descriptionAr: form.descriptionAr || null,
    descriptionEn: form.descriptionEn || null,
    descriptionHe: form.descriptionHe || null,
    durationMinutes,
    followUpEnabled: form.followUpMode !== "NONE",
    followUpMode: form.followUpMode,
    defaultIntervalDays: form.defaultIntervalDays || null,
    // Derive total from phase rules when the explicit count is blank,
    // so plan generation always knows how many sessions to create.
    totalRecommendedSessions:
      form.followUpMode === "SESSION_BASED_PLAN"
        ? calculateTotalSessionsFromRules(form.followUpRules) ?? null
        : form.totalRecommendedSessions
          ? Number(form.totalRecommendedSessions)
          : null,
    recurringIntervalValue:
      form.followUpMode === "RECURRING_CONTINUOUS"
        ? form.recurringIntervalValue || null
        : null,
    recurringIntervalUnit:
      form.followUpMode === "RECURRING_CONTINUOUS"
        ? form.recurringIntervalUnit
        : null,
    autoWhatsappReminderEnabled:
      form.followUpMode === "RECURRING_CONTINUOUS"
        ? form.autoWhatsappReminderEnabled
        : false,
    autoReminderDaysBefore:
      form.followUpMode === "RECURRING_CONTINUOUS"
        ? form.autoReminderDaysBefore || null
        : null,
    autoCreateNextReminder: form.autoCreateNextReminder,
    reminderMessageAr: form.reminderMessageAr || null,
    reminderMessageEn: form.reminderMessageEn || null,
    reminderMessageHe: form.reminderMessageHe || null,
    followUpRules: form.followUpMode === "SESSION_BASED_PLAN"
      ? normalizeFollowUpRules(form.followUpRules)
      : null,
    treatmentTemplates:
      form.followUpMode === "SESSION_BASED_PLAN"
        ? form.treatmentTemplates.map((template, index) => {
            const derivedTemplateTotal = calculateTotalSessionsFromRules(template.phases);
            return {
              id: template.id ?? null,
              nameAr: template.nameAr,
              nameEn: template.nameEn,
              nameHe: template.nameHe,
              totalSessions: derivedTemplateTotal ?? Number(template.totalSessions),
              defaultIntervalDays: template.defaultIntervalDays
                ? Number(template.defaultIntervalDays)
                : null,
              phases: template.phases.length > 0
                ? normalizeFollowUpRules(template.phases)
                : null,
              isDefault: template.isDefault,
              isActive: template.isActive,
              sortOrder: template.sortOrder ? Number(template.sortOrder) : index,
            };
          })
        : [],
    coverImageUrl: form.coverImageUrl,
    coverImageAlt: form.coverImageAlt.trim() || null,
    isActive: form.isActive,
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    nameHe: form.nameHe,
    price: form.price || null,
  };
}
