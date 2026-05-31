export class CreateTenantAppointmentDto {
  appointmentDate?: string;
  autoCreateNextReminder?: boolean;
  customServiceCurrency?: string | null;
  customServiceDuration?: number | string | null;
  customServiceName?: string | null;
  customServicePrice?: number | string | null;
  defaultIntervalDays?: number | string | null;
  durationMinutes?: number | string;
  endTime?: string;
  followUpEnabled?: boolean;
  followUpRules?: Array<{
    fromSessionNumber?: number | string;
    toSessionNumber?: number | string;
    intervalDays?: number | string;
  }> | null;
  followUpSessionRules?: Array<{
    fromSessionNumber?: number | string;
    toSessionNumber?: number | string;
    intervalDays?: number | string;
  }> | null;
  followUpType?: 'FIXED_INTERVAL' | 'SESSION_PLAN';
  internalNotes?: string | null;
  notes?: string | null;
  patientId?: string;
  reminderMessageAr?: string | null;
  reminderMessageEn?: string | null;
  reminderMessageHe?: string | null;
  saveCustomService?: boolean;
  serviceId?: string;
  staffUserId?: string;
  startTime?: string;
  status?: string;
  totalRecommendedSessions?: number | string | null;
}
