import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type { SubscriptionInvoice } from "./super-admin-subscriptions";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let details: unknown = null;
    try {
      details = JSON.parse(rawBody);
    } catch {
      // ignore
    }
    throw new ApiRequestError({
      details,
      message: "Tenant subscription request failed.",
      rawResponseBody: rawBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function submitRenewalRequest(params?: {
  note?: string;
}): Promise<{ success: boolean; notificationId: string }> {
  return request<{ success: boolean; notificationId: string }>(
    "/tenant/subscription/renewal-request",
    {
      method: "POST",
      body: JSON.stringify({ note: params?.note ?? undefined }),
    },
  );
}

export function listTenantSubscriptionInvoices(params: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.status) qs.set("status", params.status);
  const query = qs.toString();

  return request<{
    data: SubscriptionInvoice[];
    pagination: { page: number; pageSize: number; total: number };
  }>(`/tenant/subscription/invoices${query ? `?${query}` : ""}`);
}
