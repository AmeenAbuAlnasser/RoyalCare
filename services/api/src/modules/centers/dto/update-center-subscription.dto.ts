type ManualSubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
type ManualSubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'OVERDUE'
  | 'CANCELLED';

export class UpdateCenterSubscriptionDto {
  billingNotes?: string;
  nextRenewalDate?: string;
  subscriptionEndDate?: string;
  subscriptionPlan?: ManualSubscriptionPlan;
  subscriptionStartDate?: string;
  subscriptionStatus?: ManualSubscriptionStatus;
}
