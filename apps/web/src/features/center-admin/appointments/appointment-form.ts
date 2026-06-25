import type {
  AppointmentStatus,
  TenantAppointment,
  TenantAppointmentPayload,
} from "@/lib/api/tenant-appointments";

export type TenantAppointmentFormState = {
  appointmentDate: string;
  branchId: string;
  autoCreateNextReminder: boolean;
  customServiceName: string;
  customServicePrice: string;
  defaultIntervalDays: string;
  durationMinutes: string;
  followUpEnabled: boolean;
  followUpMode: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  followUpRules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>;
  recurringIntervalValue: string;
  recurringIntervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  internalNotes: string;
  notes: string;
  patientId: string;
  reminderMessageAr: string;
  reminderMessageEn: string;
  reminderMessageHe: string;
  saveCustomService: boolean;
  serviceId: string;
  staffUserId: string;
  startTime: string;
  status: AppointmentStatus;
  treatmentTemplateId: string;
  totalRecommendedSessions: string;
};

export type TenantAppointmentFormErrors = Partial<
  Record<keyof TenantAppointmentFormState | "endTime" | "cancellationReason", string>
>;

type FollowUpRuleDraft = {
  toSessionNumber: string;
};

export function calculateTotalSessionsFromRules(rules: FollowUpRuleDraft[]) {
  const totals = rules
    .map((rule) => Number(rule.toSessionNumber))
    .filter((value) => Number.isInteger(value) && value > 0);

  return totals.length > 0 ? Math.max(...totals) : null;
}

export function appointmentToForm(
  appointment?: TenantAppointment,
): TenantAppointmentFormState {
  const snapshotRules = Array.isArray(appointment?.treatmentTemplatePhases)
    ? appointment.treatmentTemplatePhases
        .map((rule) => {
          if (!rule || typeof rule !== "object") return null;
          const item = rule as Record<string, unknown>;
          return {
            fromSessionNumber: String(item.fromSessionNumber ?? ""),
            intervalDays: String(item.intervalDays ?? ""),
            toSessionNumber: String(item.toSessionNumber ?? ""),
          };
        })
        .filter(
          (rule): rule is {
            fromSessionNumber: string;
            intervalDays: string;
            toSessionNumber: string;
          } => Boolean(rule),
        )
    : [];
  const snapshotTotal = appointment?.treatmentTemplateTotalSessions?.toString() ?? "";
  const snapshotInterval =
    appointment?.treatmentTemplateDefaultIntervalDays?.toString() ?? "";

  return {
    appointmentDate: appointment?.appointmentDate.slice(0, 10) ?? "",
    branchId: appointment?.branchId ?? "",
    autoCreateNextReminder: true,
    customServiceName: appointment?.serviceId ? "" : (appointment?.customServiceName ?? ""),
    customServicePrice: appointment?.serviceId ? "" : (appointment?.customServicePrice ?? ""),
    defaultIntervalDays: snapshotInterval,
    durationMinutes:
      appointment?.customServiceDuration?.toString() ??
      appointment?.durationMinutes.toString() ??
      "",
    followUpEnabled: Boolean(appointment?.treatmentTemplateId),
    followUpMode: appointment?.treatmentTemplateId ? "SESSION_BASED_PLAN" : "NONE",
    followUpRules:
      snapshotRules.length > 0
        ? snapshotRules
        : [
            {
              fromSessionNumber: "1",
              toSessionNumber: snapshotTotal || "4",
              intervalDays: snapshotInterval || "30",
            },
          ],
    recurringIntervalValue: "3",
    recurringIntervalUnit: "MONTH",
    internalNotes: appointment?.internalNotes ?? "",
    notes: appointment?.notes ?? "",
    patientId: appointment?.patientId ?? "",
    reminderMessageAr: "",
    reminderMessageEn: "",
    reminderMessageHe: "",
    saveCustomService: false,
    serviceId: appointment?.serviceId ?? "",
    staffUserId: appointment?.staffUserId ?? "",
    startTime: appointment?.startTime ?? "",
    status: appointment?.status ?? "SCHEDULED",
    treatmentTemplateId: appointment?.treatmentTemplateId ?? "",
    totalRecommendedSessions: snapshotTotal,
  };
}

export function formToAppointmentPayload(
  form: TenantAppointmentFormState,
): TenantAppointmentPayload {
  const base: TenantAppointmentPayload = {
    appointmentDate: form.appointmentDate,
    branchId: form.branchId || null,
    customServiceCurrency: form.customServiceName.trim() ? "ILS" : null,
    customServiceDuration: form.customServiceName.trim()
      ? form.durationMinutes
      : null,
    customServiceName: form.customServiceName.trim() || null,
    customServicePrice: form.customServicePrice.trim() || null,
    durationMinutes: form.durationMinutes,
    internalNotes: form.internalNotes.trim() || null,
    notes: form.notes.trim() || null,
    patientId: form.patientId,
    saveCustomService: form.saveCustomService,
    serviceId: form.customServiceName.trim() ? null : form.serviceId || null,
    staffUserId: form.staffUserId,
    startTime: form.startTime,
    status: form.status,
    treatmentTemplateId: form.treatmentTemplateId || null,
  };

  const followUpOverride =
    form.treatmentTemplateId && form.followUpMode === "SESSION_BASED_PLAN"
      ? {
          defaultIntervalDays: form.defaultIntervalDays || null,
          followUpEnabled: true,
          followUpMode: form.followUpMode,
          followUpRules: form.followUpRules.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber,
            toSessionNumber: rule.toSessionNumber,
            intervalDays: rule.intervalDays,
          })),
          followUpSessionRules: form.followUpRules.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber,
            toSessionNumber: rule.toSessionNumber,
            intervalDays: rule.intervalDays,
          })),
          totalRecommendedSessions:
            calculateTotalSessionsFromRules(form.followUpRules)?.toString() ?? null,
        }
      : null;

  if (!form.saveCustomService) {
    return followUpOverride ? { ...base, ...followUpOverride } : base;
  }

  return {
    ...base,
    followUpEnabled: form.followUpMode !== "NONE",
    followUpMode: form.followUpMode,
    defaultIntervalDays: form.defaultIntervalDays || null,
    totalRecommendedSessions:
      form.followUpMode === "SESSION_BASED_PLAN"
        ? calculateTotalSessionsFromRules(form.followUpRules)?.toString() ?? null
        : form.totalRecommendedSessions || null,
    recurringIntervalValue:
      form.followUpMode === "RECURRING_CONTINUOUS"
        ? form.recurringIntervalValue || null
        : null,
    recurringIntervalUnit:
      form.followUpMode === "RECURRING_CONTINUOUS"
        ? form.recurringIntervalUnit
        : null,
    autoCreateNextReminder: form.autoCreateNextReminder,
    reminderMessageAr: form.reminderMessageAr.trim() || null,
    reminderMessageEn: form.reminderMessageEn.trim() || null,
    reminderMessageHe: form.reminderMessageHe.trim() || null,
    followUpRules:
      form.followUpMode === "SESSION_BASED_PLAN"
        ? form.followUpRules.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber,
            toSessionNumber: rule.toSessionNumber,
            intervalDays: rule.intervalDays,
          }))
        : null,
    followUpSessionRules:
      form.followUpMode === "SESSION_BASED_PLAN"
        ? form.followUpRules.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber,
            toSessionNumber: rule.toSessionNumber,
            intervalDays: rule.intervalDays,
          }))
        : null,
  };
}
