export class CreateTenantAppointmentDto {
  appointmentDate?: string;
  branchId?: string | null;
  autoCreateNextReminder?: boolean;
  customServiceCurrency?: string | null;
  customServiceDuration?: number | string | null;
  customServiceName?: string | null;
  customServicePrice?: number | string | null;
  defaultIntervalDays?: number | string | null;
  durationMinutes?: number | string;
  endTime?: string;
  followUpEnabled?: boolean;
  followUpId?: string | null;
  treatmentTemplateId?: string | null;
  followUpMode?: 'NONE' | 'SESSION_BASED_PLAN' | 'RECURRING_CONTINUOUS';
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
  recurringIntervalValue?: number | string | null;
  recurringIntervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null;
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
