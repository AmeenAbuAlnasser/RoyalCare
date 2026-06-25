type ManualSubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
type ManualSubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'OVERDUE'
  | 'SUSPENDED'
  | 'CANCELLED';

export class UpdateCenterSubscriptionDto {
  billingNotes?: string;
  nextRenewalDate?: string;
  notificationLanguage?: string;
  notificationPhone?: string;
  // v2: Plan FK — when provided, planCode/planName are denormalized from the Plan record.
  planId?: string;
  subscriptionEndDate?: string;
  subscriptionNotes?: string;
  subscriptionPlan?: ManualSubscriptionPlan;
  subscriptionStartDate?: string;
  subscriptionStatus?: ManualSubscriptionStatus;
}
