type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

type SubscriptionLifecycle =
  | 'ACTIVE'
  | 'TRIALING'
  | 'EXPIRING_SOON'
  | 'EXPIRED_GRACE_PERIOD'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'UNKNOWN';

export class ListSubscriptionsQueryDto {
  centerId?: string;
  expired?: string;
  expiringSoon?: string;
  lifecycle?: SubscriptionLifecycle;
  missingPhone?: string;
  page?: string;
  pageSize?: string;
  search?: string;
  status?: SubscriptionStatus;
}
