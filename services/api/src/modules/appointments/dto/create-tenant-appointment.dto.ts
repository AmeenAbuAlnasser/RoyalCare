export class CreateTenantAppointmentDto {
  appointmentDate?: string;
  durationMinutes?: number | string;
  endTime?: string;
  internalNotes?: string | null;
  notes?: string | null;
  patientId?: string;
  serviceId?: string;
  staffUserId?: string;
  startTime?: string;
  status?: string;
}
