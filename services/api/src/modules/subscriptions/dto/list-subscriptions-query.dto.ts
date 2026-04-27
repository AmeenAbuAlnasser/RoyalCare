type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export class ListSubscriptionsQueryDto {
  centerId?: string;
  page?: string;
  pageSize?: string;
  search?: string;
  status?: SubscriptionStatus;
}
