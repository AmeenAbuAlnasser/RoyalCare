export class UpdateTenantServiceDto {
  bufferMinutes?: number | string | null;
  currency?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionHe?: string | null;
  durationMinutes?: number | string | null;
  autoCreateNextReminder?: boolean;
  defaultIntervalDays?: number | string | null;
  followUpMode?: 'NONE' | 'SESSION_BASED_PLAN' | 'RECURRING_CONTINUOUS';
  followUpEnabled?: boolean;
  followUpRules?: Array<{
    fromSessionNumber?: number | string;
    intervalDays?: number | string;
    toSessionNumber?: number | string;
  }> | null;
  treatmentTemplates?: Array<{
    id?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
    nameHe?: string | null;
    totalSessions?: number | string | null;
    defaultIntervalDays?: number | string | null;
    phases?: Array<{
      fromSessionNumber?: number | string;
      intervalDays?: number | string;
      toSessionNumber?: number | string;
    }> | null;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number | string | null;
  }> | null;
  recurringIntervalValue?: number | string | null;
  recurringIntervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null;
  autoWhatsappReminderEnabled?: boolean;
  autoReminderDaysBefore?: number | string | null;
  coverImageUrl?: string | null;
  coverImageBlurhash?: string | null;
  coverImageAlt?: string | null;
  isActive?: boolean;
  nameAr?: string;
  nameEn?: string;
  nameHe?: string;
  price?: number | string | null;
  reminderMessageAr?: string | null;
  reminderMessageEn?: string | null;
  reminderMessageHe?: string | null;
  totalRecommendedSessions?: number | string | null;
}
