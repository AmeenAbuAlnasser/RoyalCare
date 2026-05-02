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
  durationMinutes: number | null;
  price: string | number | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantServicePayload = {
  currency?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionHe?: string | null;
  durationMinutes?: number | string | null;
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
      message: "RoyalCare tenant service request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
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
