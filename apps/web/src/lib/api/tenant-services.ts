import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type TenantService = {
  id: string;
  centerId: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  descriptionHe: string | null;
  bufferMinutes: number;
  durationMinutes: number | null;
  followUpEnabled: boolean;
  followUpMode: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  defaultIntervalDays: number | null;
  totalRecommendedSessions: number | null;
  recurringIntervalValue: number | null;
  recurringIntervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  autoWhatsappReminderEnabled: boolean;
  autoReminderDaysBefore: number | null;
  autoCreateNextReminder: boolean;
  reminderMessageAr: string | null;
  reminderMessageEn: string | null;
  reminderMessageHe: string | null;
  followUpRules: Array<{
    fromSessionNumber: number;
    toSessionNumber: number;
    intervalDays: number;
  }> | null;
  treatmentTemplates: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    nameHe: string;
    totalSessions: number;
    defaultIntervalDays: number | null;
    phases: Array<{
      fromSessionNumber: number;
      toSessionNumber: number;
      intervalDays: number;
    }> | null;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
  }>;
  price: string | number | null;
  currency: string;
  coverImageUrl: string | null;
  coverImageBlurhash: string | null;
  coverImageAlt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  safeDeleteAllowed: boolean;
};

export type TenantServicePayload = {
  bufferMinutes?: number | string | null;
  currency?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionHe?: string | null;
  durationMinutes?: number | string | null;
  followUpEnabled?: boolean;
  followUpMode?: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  defaultIntervalDays?: number | string | null;
  totalRecommendedSessions?: number | string | null;
  recurringIntervalValue?: number | string | null;
  recurringIntervalUnit?: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  autoWhatsappReminderEnabled?: boolean;
  autoReminderDaysBefore?: number | string | null;
  autoCreateNextReminder?: boolean;
  reminderMessageAr?: string | null;
  reminderMessageEn?: string | null;
  reminderMessageHe?: string | null;
  followUpRules?: Array<{
    fromSessionNumber: number | string;
    toSessionNumber: number | string;
    intervalDays: number | string;
  }> | null;
  treatmentTemplates?: Array<{
    id?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
    nameHe?: string | null;
    totalSessions?: number | string | null;
    defaultIntervalDays?: number | string | null;
    phases?: Array<{
      fromSessionNumber: number | string;
      toSessionNumber: number | string;
      intervalDays: number | string;
    }> | null;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number | string | null;
  }> | null;
  coverImageUrl?: string | null;
  coverImageBlurhash?: string | null;
  coverImageAlt?: string | null;
  isActive?: boolean;
  nameAr: string;
  nameEn: string;
  nameHe: string;
  price?: number | string | null;
};

export type TenantServicesListResponse = {
  items: TenantService[];
  total: number;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const t0 = performance.now();
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? "GET";
  console.debug("[api:request]", method, url);

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    console.debug("[api:error]", method, url, response.status, `${(performance.now() - t0).toFixed(0)}ms`);

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare tenant service request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  const data = (await response.json()) as T;
  console.debug("[api:response]", method, url, response.status, `${(performance.now() - t0).toFixed(0)}ms`);
  return data;
}

export function listTenantServices() {
  return request<TenantServicesListResponse>("/tenant/services");
}

export function createTenantService(payload: TenantServicePayload) {
  return request<TenantService>("/tenant/services", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getTenantService(serviceId: string) {
  return request<TenantService>(`/tenant/services/${serviceId}`);
}

export function updateTenantService(
  serviceId: string,
  payload: TenantServicePayload,
) {
  return request<TenantService>(`/tenant/services/${serviceId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateTenantServiceStatus(
  serviceId: string,
  isActive: boolean,
) {
  return request<TenantService>(`/tenant/services/${serviceId}/status`, {
    body: JSON.stringify({ isActive }),
    method: "PATCH",
  });
}

export function deleteTenantService(serviceId: string) {
  return request<{ deleted: boolean }>(`/tenant/services/${serviceId}`, {
    method: "DELETE",
  });
}
