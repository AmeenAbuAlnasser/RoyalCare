type BillingInterval = 'MONTHLY' | 'YEARLY' | 'CUSTOM';
type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export class CreateSubscriptionDto {
  billingInterval?: BillingInterval;
  centerId!: string;
  currentPeriodEnd!: string;
  currentPeriodStart!: string;
  expiresAt?: string;
  externalProvider?: string;
  externalSubscriptionId?: string;
  planCode!: string;
  planName!: string;
  status?: SubscriptionStatus;
  trialEndsAt?: string;
}
