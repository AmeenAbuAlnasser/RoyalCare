export type SubscriptionInvoiceStatusInput =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export class CreateSubscriptionInvoiceDto {
  amount?: string;
  centerId?: string;
  currency?: string;
  discount?: string;
  dueDate?: string;
  invoiceNumber?: string;
  issuedAt?: string;
  notes?: string;
  paidAt?: string;
  paymentMethod?: string;
  status?: SubscriptionInvoiceStatusInput;
  subscriptionId?: string;
  tax?: string;
}
