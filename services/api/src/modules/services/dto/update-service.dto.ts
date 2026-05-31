export class UpdateTenantServiceDto {
  bufferMinutes?: number | string | null;
  currency?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionHe?: string | null;
  durationMinutes?: number | string | null;
  autoCreateNextReminder?: boolean;
  defaultIntervalDays?: number | string | null;
  followUpEnabled?: boolean;
  followUpRules?: Array<{
    fromSessionNumber?: number | string;
    intervalDays?: number | string;
    toSessionNumber?: number | string;
  }> | null;
  followUpType?: 'FIXED_INTERVAL' | 'SESSION_PLAN';
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
