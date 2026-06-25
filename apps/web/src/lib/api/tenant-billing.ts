import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type InvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
export type InvoiceSource =
  | "MANUAL"
  | "AUTO_APPOINTMENT"
  | "AUTO_FOLLOW_UP"
  | "AUTO_RECALCULATION";

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
  serviceId: string | null;
  customServiceName: string | null;
  staffUserId: string | null;
  appointmentId: string | null;
  amount: string;
  currency: string;
  status: InvoiceStatus;
  source: InvoiceSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: InvoicePatient;
  service: InvoiceService | null;
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
  appointmentId?: string;
  branchId?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters?.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters?.appointmentId) {
    params.set("appointmentId", filters.appointmentId);
  }

  if (filters?.branchId) {
    params.set("branchId", filters.branchId);
  }

  const queryString = params.toString();

  return request<TenantInvoiceListResponse>(
    `/tenant/billing${queryString ? `?${queryString}` : ""}`,
  );
}

export function createTenantInvoiceFromAppointment(
  appointmentId: string,
  notes?: string | null,
) {
  return request<TenantInvoice>("/tenant/billing", {
    body: JSON.stringify({ appointmentId, notes: notes ?? null }),
    method: "POST",
  });
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

export function getTenantInvoiceForAppointment(appointmentId: string) {
  return request<TenantInvoice | null>(
    `/tenant/billing/for-appointment/${appointmentId}`,
  );
}

export function getTenantPatientCredit(invoiceId: string) {
  return request<{ patientCreditBalance: string }>(
    `/tenant/billing/${invoiceId}/patient-credit`,
  );
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

export function applyTenantCredit(invoiceId: string, payload: UseCreditPayload) {
  return request<UseCreditResult>(`/tenant/billing/${invoiceId}/use-credit`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export type ReportPeriod = "today" | "last7days" | "week" | "month" | "custom";

export type ReportFilters = {
  period?: ReportPeriod;
  from?: string;
  openOnly?: boolean;
  overdueOnly?: boolean;
  to?: string;
  allUnbilled?: boolean;
};

export type ReceivablePaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";

export type ReceivableDetail = {
  invoiceId: string;
  invoiceNumber: string | null;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: ReceivablePaymentStatus;
  lastPaymentDate: string | null;
  dueDate: string;
};

export type TopDebtPatientEntry = {
  rank: number;
  patientId: string;
  patientName: string;
  patientPhone: string;
  remainingAmount: string;
};

export type TenantReportsSummary = {
  todayRevenue: string;
  totalPaid: string;
  outstanding: string;
  patientCredit: string;
  cancelledInvoicesCount: number;
  appointmentsTodayCount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
};

export type TenantFinancialReportsResponse = {
  cards: {
    periodRevenue: string;
    revenueToday: string;
    revenueThisMonth: string;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalPatientCredit: string;
    averageInvoiceValue: string;
    totalReceivables: string;
    patientsWithDebt: number;
    unpaidInvoices: number;
    partiallyPaidInvoices: number;
    highestDebt: string;
    totalExpenses?: string;
    netProfit?: string;
    revenueAfterExpenses?: string;
    profitMargin?: number;
  };
  summary?: {
    revenue: string;
    expenses?: string;
    netProfit?: string;
    revenueAfterExpenses?: string;
    profitMargin?: number;
    totalReceivables: string;
    overdueInvoicesCount: number;
    unpaidInvoicesCount: number;
    partiallyPaidInvoicesCount: number;
    paidInvoicesCount: number;
    invoiceCountIncluded: number;
    patientsWithBalanceCount: number;
    highestDebt: string;
  };
  charts: {
    revenueByDay: Array<{ date: string; amount: string }>;
    revenueByPaymentStatus: Array<{ status: string; amount: string }>;
    revenueByService: Array<{
      serviceId: string;
      serviceNameAr: string;
      serviceNameEn: string;
      serviceNameHe: string;
      amount: string;
    }>;
    topPatientsBySpending: TopPatientEntry[];
    receivablesByPaymentStatus?: Array<{ status: ReceivablePaymentStatus; amount: string }>;
    topPatientsByDebt?: TopDebtPatientEntry[];
    topDebtors?: TopDebtPatientEntry[];
    revenueVsReceivables?: Array<{ key: "REVENUE" | "RECEIVABLES"; amount: string }>;
    expensesByCategory?: Array<{ categoryId: string; name: string; color: string; amount: string }>;
    expensesByBranch?: Array<{ branchId: string | null; name: string; amount: string }>;
    revenueVsExpenses?: Array<{ key: "REVENUE" | "EXPENSES" | "NET_PROFIT"; amount: string }>;
  };
  expenses?: {
    total: string;
    pending: string;
    count: number;
    netProfit: string;
    profitMargin: number;
  };
  receivables?: {
    details: ReceivableDetail[];
  };
  reportMeta?: {
    rangeType: string;
    startDate: string;
    endDate: string;
    invoiceCountIncluded: number;
    paymentCountIncluded: number;
  };
  currency: string;
  periodStart: string;
  periodEnd: string;
  operational?: {
    appointmentsTodayTotal: number;
    appointmentsTodayCompleted: number;
    appointmentsTodayUpcoming: number;
    appointmentsTodayCancelled: number;
    delayedFollowUps: number;
    newPatientsThisMonth: number;
    activeTreatmentPlans: number;
    completedWithoutInvoiceCount?: number;
    completedWithoutInvoice?: Array<{
      id: string;
      appointmentDate: string;
      startTime: string;
      endTime: string;
      patientId: string;
      patientName: string;
      patientPhone: string;
      serviceId: string | null;
      serviceNameAr: string | null;
      serviceNameEn: string | null;
      serviceNameHe: string | null;
      providerName: string | null;
    }>;
  };
  appointmentAnalytics?: {
    totalInPeriod: number;
    completedInPeriod: number;
    cancelledInPeriod: number;
    noShowInPeriod: number;
    cancellationRatePct: number;
    noShowRatePct: number;
    topProviders: Array<{ userId: string; name: string; count: number }>;
  };
};

export function getTenantFinancialReports(filters?: ReportFilters) {
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.openOnly) params.set("openOnly", "true");
  if (filters?.overdueOnly) params.set("overdueOnly", "true");
  if (filters?.to) params.set("to", filters.to);
  if (filters?.allUnbilled) params.set("allUnbilled", "true");
  const qs = params.toString();
  return request<TenantFinancialReportsResponse>(
    `/tenant/reports/financial${qs ? `?${qs}` : ""}`,
  );
}

export function getTenantReportsSummary(filters?: ReportFilters) {
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  const qs = params.toString();
  return request<TenantReportsSummary>(
    `/tenant/billing/summary${qs ? `?${qs}` : ""}`,
  );
}

export type TopPatientEntry = {
  rank: number;
  patientId: string;
  name: string;
  totalPaid: string;
  totalVisits: number;
  currentCredit: string;
};

export type TopPatientsResponse = {
  patients: TopPatientEntry[];
  currency: string;
  periodStart: string;
  periodEnd: string;
};

export function getTenantTopPatients(filters?: ReportFilters) {
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  const qs = params.toString();
  return request<TopPatientsResponse>(
    `/tenant/reports/top-patients${qs ? `?${qs}` : ""}`,
  );
}
