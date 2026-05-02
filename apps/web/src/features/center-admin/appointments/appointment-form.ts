import type {
  AppointmentStatus,
  TenantAppointment,
  TenantAppointmentPayload,
} from "@/lib/api/tenant-appointments";

export type TenantAppointmentFormState = {
  appointmentDate: string;
  durationMinutes: string;
  internalNotes: string;
  notes: string;
  patientId: string;
  serviceId: string;
  staffUserId: string;
  startTime: string;
  status: AppointmentStatus;
};

export type TenantAppointmentFormErrors = Partial<
  Record<keyof TenantAppointmentFormState | "endTime" | "cancellationReason", string>
>;

export function appointmentToForm(
  appointment?: TenantAppointment,
): TenantAppointmentFormState {
  return {
    appointmentDate: appointment?.appointmentDate.slice(0, 10) ?? "",
    durationMinutes: appointment?.durationMinutes.toString() ?? "",
    internalNotes: appointment?.internalNotes ?? "",
    notes: appointment?.notes ?? "",
    patientId: appointment?.patientId ?? "",
    serviceId: appointment?.serviceId ?? "",
    staffUserId: appointment?.staffUserId ?? "",
    startTime: appointment?.startTime ?? "",
    status: appointment?.status ?? "SCHEDULED",
  };
}

export function formToAppointmentPayload(
  form: TenantAppointmentFormState,
): TenantAppointmentPayload {
  return {
    appointmentDate: form.appointmentDate,
    durationMinutes: form.durationMinutes,
    internalNotes: form.internalNotes.trim() || null,
    notes: form.notes.trim() || null,
    patientId: form.patientId,
    serviceId: form.serviceId,
    staffUserId: form.staffUserId,
    startTime: form.startTime,
    status: form.status,
  };
}
