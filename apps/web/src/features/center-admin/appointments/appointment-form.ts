import type {
  AppointmentStatus,
  TenantAppointment,
  TenantAppointmentPayload,
} from "@/lib/api/tenant-appointments";

export type TenantAppointmentFormState = {
  appointmentDate: string;
  autoCreateNextReminder: boolean;
  customServiceName: string;
  customServicePrice: string;
  defaultIntervalDays: string;
  durationMinutes: string;
  followUpEnabled: boolean;
  followUpRules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>;
  followUpType: "FIXED_INTERVAL" | "SESSION_PLAN";
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
  totalRecommendedSessions: string;
};

export type TenantAppointmentFormErrors = Partial<
  Record<keyof TenantAppointmentFormState | "endTime" | "cancellationReason", string>
>;

export function appointmentToForm(
  appointment?: TenantAppointment,
): TenantAppointmentFormState {
  return {
    appointmentDate: appointment?.appointmentDate.slice(0, 10) ?? "",
    autoCreateNextReminder: true,
    customServiceName: appointment?.serviceId ? "" : (appointment?.customServiceName ?? ""),
    customServicePrice: appointment?.serviceId ? "" : (appointment?.customServicePrice ?? ""),
    defaultIntervalDays: "",
    durationMinutes:
      appointment?.customServiceDuration?.toString() ??
      appointment?.durationMinutes.toString() ??
      "",
    followUpEnabled: false,
    followUpRules: [
      { fromSessionNumber: "1", toSessionNumber: "4", intervalDays: "30" },
      { fromSessionNumber: "5", toSessionNumber: "8", intervalDays: "40" },
    ],
    followUpType: "FIXED_INTERVAL",
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
    totalRecommendedSessions: "",
  };
}

export function formToAppointmentPayload(
  form: TenantAppointmentFormState,
): TenantAppointmentPayload {
  const base: TenantAppointmentPayload = {
    appointmentDate: form.appointmentDate,
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
  };

  if (!form.saveCustomService) {
    return base;
  }

  return {
    ...base,
    followUpEnabled: form.followUpEnabled,
    followUpType: form.followUpType,
    defaultIntervalDays: form.defaultIntervalDays || null,
    totalRecommendedSessions: form.totalRecommendedSessions || null,
    autoCreateNextReminder: form.autoCreateNextReminder,
    reminderMessageAr: form.reminderMessageAr.trim() || null,
    reminderMessageEn: form.reminderMessageEn.trim() || null,
    reminderMessageHe: form.reminderMessageHe.trim() || null,
    followUpRules:
      form.followUpEnabled && form.followUpType === "SESSION_PLAN"
        ? form.followUpRules.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber,
            toSessionNumber: rule.toSessionNumber,
            intervalDays: rule.intervalDays,
          }))
        : null,
    followUpSessionRules:
      form.followUpEnabled && form.followUpType === "SESSION_PLAN"
        ? form.followUpRules.map((rule) => ({
            fromSessionNumber: rule.fromSessionNumber,
            toSessionNumber: rule.toSessionNumber,
            intervalDays: rule.intervalDays,
          }))
        : null,
  };
}
