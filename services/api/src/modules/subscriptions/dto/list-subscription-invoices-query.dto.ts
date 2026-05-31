export type SubscriptionInvoiceStatusFilter =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'ALL';

export class ListSubscriptionInvoicesQueryDto {
  centerId?: string;
  page?: string;
  pageSize?: string;
  search?: string;
  status?: SubscriptionInvoiceStatusFilter;
  subscriptionId?: string;
}
