import {
  API_BASE_URL,
  ApiRequestError,
} from "./super-admin-centers";

export type ApiSubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

export type ApiSubscriptionBillingInterval = "MONTHLY" | "YEARLY" | "CUSTOM";

export type ApiSupportedLanguage = "AR" | "HE" | "EN";

export type ApiSubscriptionLifecycle =
  | "ACTIVE"
  | "TRIALING"
  | "EXPIRING_SOON"
  | "EXPIRED_GRACE_PERIOD"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED"
  | "UNKNOWN";

export type SuperAdminSubscription = {
  id: string;
  centerId: string;
  planCode: string;
  planName: string;
  status: ApiSubscriptionStatus;
  billingInterval: ApiSubscriptionBillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  nextRenewalDate: string | null;
  billingNotes: string | null;
  centerPhone?: string | null;
  notificationPhone: string | null;
  notificationLanguage: ApiSupportedLanguage | null;
  ownerPhone?: string | null;
  trialEndsAt: string | null;
  expiresAt: string | null;
  cancelAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // lifecycle (computed server-side)
  daysRemaining?: number | null;
  daysUntilExpiry?: number | null;
  remainingDays?: number | null;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  color?: "success" | "warning" | "danger" | "muted" | "neutral";
  label?: string;
  lifecycle: ApiSubscriptionLifecycle;
  normalizedLifecycle?: ApiSubscriptionLifecycle;
  center: {
    id: string;
    name: string;
    slug: string;
    status: string;
    type: string;
    owner: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
    } | null;
  };
};

export type ListSuperAdminSubscriptionsParams = {
  search?: string;
  lifecycle?: ApiSubscriptionLifecycle;
  missingPhone?: boolean;
  page?: number;
  pageSize?: number;
  centerId?: string;
};

export type ManualSubscriptionPlan = "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";

export type UpdateSubscriptionPayload = {
  subscriptionStatus?: "TRIAL" | "ACTIVE" | "EXPIRED" | "OVERDUE" | "SUSPENDED" | "CANCELLED";
  subscriptionPlan?: ManualSubscriptionPlan;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionNotes?: string;
  notificationPhone?: string;
  notificationLanguage?: ApiSupportedLanguage;
  nextRenewalDate?: string;
};

export type SubscriptionLifecycleJobResult = {
  scanned: number;
  updatedExpired: number;
  notificationsCreated: number;
  auditLogsCreated: number;
  skippedSuspended: number;
  duplicateNotificationsSkipped: number;
};

export type SubscriptionLifecycleJobStatus = {
  lastRunAt: string | null;
  lastRunBy: string | null;
  lastRunError?: string | null;
  lastRunSuccess?: boolean | null;
  lastResult: SubscriptionLifecycleJobResult | null;
  nextRunAt: string;
};

export type SubscriptionInvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type SubscriptionInvoice = {
  id: string;
  invoiceNumber: string;
  centerId: string;
  subscriptionId: string;
  amount: string;
  discount: string;
  tax: string;
  total: string;
  currency: string;
  status: SubscriptionInvoiceStatus;
  paymentMethod: string | null;
  notes: string | null;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  center: { id: string; name: string; slug: string };
  subscription: { id: string; planName: string; status: ApiSubscriptionStatus };
};

export type SubscriptionInvoicePdfResponse = {
  contentBase64: string;
  fileName: string;
  mimeType: string;
};

export type CreateSubscriptionInvoicePayload = {
  amount: string;
  centerId: string;
  currency?: string;
  discount?: string;
  dueDate: string;
  invoiceNumber?: string;
  issuedAt?: string;
  notes?: string;
  paidAt?: string;
  paymentMethod?: string;
  status?: SubscriptionInvoiceStatus;
  subscriptionId: string;
  tax?: string;
};

export type SuperAdminSubscriptionTimelineItem = {
  id: string;
  type:
    | "SUBSCRIPTION_CREATED"
    | "SUBSCRIPTION_RENEWED"
    | "SUBSCRIPTION_SUSPENDED"
    | "SUBSCRIPTION_CANCELLED"
    | "SUBSCRIPTION_EXPIRED"
    | "SUBSCRIPTION_UPDATED"
    | "RENEWAL_REQUEST_SUBMITTED"
    | "WHATSAPP_OPENED"
    | "WHATSAPP_COPIED"
    | "PHONE_UPDATED"
    | "PLAN_CHANGED"
    | "TRIAL_STARTED"
    | "TRIAL_ENDED";
  title: string;
  description: string;
  actorName: string | null;
  actorType: "SYSTEM" | "SUPER_ADMIN" | "TENANT" | "UNKNOWN";
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringifyErrorValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyErrorValue).filter(Boolean).join(", ");
  if (isRecord(value)) {
    const localized = value.en ?? value.ar ?? value.he ?? value.message ?? value.error;
    if (typeof localized === "string") return localized;
    return Object.values(value).map(stringifyErrorValue).filter(Boolean).join(", ");
  }
  return "";
}

function getErrorMessage(details: unknown) {
  if (!isRecord(details)) return "RoyalCare API request failed.";

  // Prefer field-level errors over the generic top-level message when available.
  if ("errors" in details && details.errors && typeof details.errors === "object") {
    const errorMessage = stringifyErrorValue(details.errors);
    if (errorMessage) return errorMessage;
  }

  if ("message" in details) {
    const message = details.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
    if (message && typeof message === "object") {
      const nestedMessage = (message as { message?: unknown }).message;
      const errors = (message as { errors?: unknown }).errors;
      if (typeof nestedMessage === "string") {
        const errorMessage = stringifyErrorValue(errors);
        return errorMessage ? `${nestedMessage}: ${errorMessage}` : nestedMessage;
      }
    }
  }

  return "RoyalCare API request failed.";
}

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  let response: Response;

  try {
    response = await fetch(url, { ...init, credentials: "include", headers });
  } catch (error) {
    throw error;
  }

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    const parsedJsonBody = safelyParseJson(rawBody);
    const message =
      getErrorMessage(parsedJsonBody) ||
      rawBody ||
      `RoyalCare API request failed with status ${response.status}.`;

    throw new ApiRequestError({
      details: parsedJsonBody,
      message,
      rawResponseBody: rawBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listSuperAdminSubscriptions(
  params: ListSuperAdminSubscriptionsParams = {},
) {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.lifecycle) qs.set("lifecycle", params.lifecycle);
  if (params.missingPhone) qs.set("missingPhone", "true");
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.centerId) qs.set("centerId", params.centerId);

  const query = qs.toString();
  return request<{
    data: SuperAdminSubscription[];
    pagination: { page: number; pageSize: number; total: number };
  }>(`/super-admin/subscriptions${query ? `?${query}` : ""}`);
}

export function getSubscriptionLifecycleJobStatus() {
  return request<SubscriptionLifecycleJobStatus>(
    "/super-admin/subscriptions/lifecycle-job/status",
  );
}

export function runSubscriptionLifecycleJob() {
  return request<SubscriptionLifecycleJobResult>(
    "/super-admin/subscriptions/run-lifecycle-job",
    { method: "POST" },
  );
}

export function listSubscriptionInvoices(params: {
  centerId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SubscriptionInvoiceStatus | "ALL";
  subscriptionId?: string;
} = {}) {
  const qs = new URLSearchParams();
  if (params.centerId) qs.set("centerId", params.centerId);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "ALL") qs.set("status", params.status);
  if (params.subscriptionId) qs.set("subscriptionId", params.subscriptionId);

  const query = qs.toString();
  return request<{
    data: SubscriptionInvoice[];
    pagination: { page: number; pageSize: number; total: number };
  }>(`/super-admin/subscriptions/invoices${query ? `?${query}` : ""}`);
}

export function createSubscriptionInvoice(payload: CreateSubscriptionInvoicePayload) {
  return request<SubscriptionInvoice>("/super-admin/subscriptions/invoices", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function markSubscriptionInvoicePaid(
  invoiceId: string,
  payload: { paidAt?: string; paymentMethod?: string; notes?: string } = {},
) {
  return request<SubscriptionInvoice>(
    `/super-admin/subscriptions/invoices/${invoiceId}/mark-paid`,
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    },
  );
}

export function cancelSubscriptionInvoice(
  invoiceId: string,
  payload: { notes?: string } = {},
) {
  return request<SubscriptionInvoice>(
    `/super-admin/subscriptions/invoices/${invoiceId}/cancel`,
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    },
  );
}

export function downloadSubscriptionInvoicePdf(invoiceId: string, locale: string) {
  const qs = new URLSearchParams();
  qs.set("locale", locale);
  return request<SubscriptionInvoicePdfResponse>(
    `/super-admin/subscriptions/invoices/${invoiceId}/pdf?${qs.toString()}`,
  );
}

export function getSuperAdminSubscriptionById(
  id: string,
): Promise<SuperAdminSubscription> {
  return request<SuperAdminSubscription>(`/super-admin/subscriptions/${id}`).catch(
    (error) => {
      if (error instanceof ApiRequestError && error.status === 404) {
        return request<SuperAdminSubscription>(
          `/super-admin/centers/${id}/subscription`,
        );
      }

      throw error;
    },
  );
}

export function getSuperAdminSubscriptionTimeline(id: string) {
  return request<{
    centerId: string;
    data: SuperAdminSubscriptionTimelineItem[];
    subscriptionId: string;
  }>(`/super-admin/subscriptions/${id}/timeline`);
}

export function logSubscriptionManualWhatsAppAction(
  subscriptionId: string,
  payload: {
    action: "OPENED_WHATSAPP" | "COPIED_MESSAGE";
    message: string;
    phone: string;
  },
) {
  return request<{ logged: boolean }>(
    `/super-admin/subscriptions/${subscriptionId}/manual-whatsapp-log`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export function updateCenterSubscription(
  centerId: string,
  payload: UpdateSubscriptionPayload,
) {
  return request<{ success: boolean }>(`/centers/${centerId}/subscription`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}
