import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type InvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "OTHER";

export type TenantPayment = {
  id: string;
  centerId: string;
  invoiceId: string;
  patientId: string;
  createdByUserId: string;
  amount: string;
  currency: string;
  method: PaymentMethod;
  notes: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string; email: string | null };
};

export type CreditTransactionType = "CREDIT_ADD" | "CREDIT_USE";
export type CreditTransactionSource = "OVERPAYMENT" | "MANUAL" | "ADJUSTMENT";

export type TenantCreditTransaction = {
  id: string;
  centerId: string;
  patientId: string;
  createdByUserId: string;
  amount: string;
  type: CreditTransactionType;
  source: CreditTransactionSource;
  relatedInvoiceId: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string; email: string | null };
};

export type PaymentSummary = {
  payments: TenantPayment[];
  creditUsages: TenantCreditTransaction[];
  invoiceTotal: string;
  paidAmount: string;
  balanceDue: string;
  currency: string;
  patientCreditBalance: string;
};

export type CreatePaymentResult = {
  payment: TenantPayment;
  invoiceStatus: InvoiceStatus;
  paidAmount: string;
  balanceDue: string;
  creditAdded: string | null;
  patientCreditBalance: string | null;
};

export type CreatePaymentPayload = {
  amount: string;
  method: PaymentMethod;
  currency?: string;
  notes?: string | null;
  paidAt?: string;
};

export type UseCreditPayload = {
  amount: string;
  notes?: string | null;
};

export type UseCreditResult = {
  invoiceStatus: InvoiceStatus;
  creditApplied: string;
  paidAmount: string;
  balanceDue: string;
  patientCreditBalance: string;
};

export type InvoicePatient = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
};

export type InvoiceService = {
  id: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  price: string | null;
  currency: string;
  isActive: boolean;
};

export type InvoiceProvider = {
  id: string;
  fullName: string;
  email: string | null;
};

export type TenantInvoice = {
  id: string;
  centerId: string;
  patientId: string;
  serviceId: string;
  staffUserId: string | null;
  amount: string;
  currency: string;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: InvoicePatient;
  service: InvoiceService;
  staffUser: InvoiceProvider | null;
};

export type TenantInvoiceListResponse = {
  items: TenantInvoice[];
  total: number;
};

export type TenantBillingOptions = {
  patients: Array<{ id: string; fullName: string; phone: string; status: string }>;
  services: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    nameHe: string;
    price: string | null;
    currency: string;
    isActive: boolean;
  }>;
  providers: Array<{
    id: string;
    fullName: string;
    email: string | null;
    role: { key: string; name: string };
  }>;
};

export type CreateInvoicePayload = {
  patientId: string;
  serviceId: string;
  staffUserId?: string | null;
  amount: string;
  currency: string;
  notes?: string | null;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare tenant billing request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listTenantInvoices(filters?: {
  search?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters?.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  const queryString = params.toString();

  return request<TenantInvoiceListResponse>(
    `/tenant/billing${queryString ? `?${queryString}` : ""}`,
  );
}

export function getTenantBillingOptions() {
  return request<TenantBillingOptions>("/tenant/billing/options");
}

export function createTenantInvoice(payload: CreateInvoicePayload) {
  return request<TenantInvoice>("/tenant/billing", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getTenantInvoice(invoiceId: string) {
  return request<TenantInvoice>(`/tenant/billing/${invoiceId}`);
}

export function updateTenantInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
) {
  return request<TenantInvoice>(`/tenant/billing/${invoiceId}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export function listTenantPayments(invoiceId: string) {
  return request<PaymentSummary>(`/tenant/billing/${invoiceId}/payments`);
}

export function createTenantPayment(
  invoiceId: string,
  payload: CreatePaymentPayload,
) {
  return request<CreatePaymentResult>(
    `/tenant/billing/${invoiceId}/payments`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export function useTenantCredit(invoiceId: string, payload: UseCreditPayload) {
  return request<UseCreditResult>(`/tenant/billing/${invoiceId}/use-credit`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
