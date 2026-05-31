import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";

export type TenantStaffStatus = "ACTIVE" | "INACTIVE";

export type TenantStaff = {
  assignmentStatus: string;
  createdAt: string;
  email: string | null;
  fullName: string;
  id: string;
  phone: string | null;
  role: CenterRoleKey;
  roleName: string;
  status: TenantStaffStatus;
  updatedAt: string;
};

export type TenantStaffPayload = {
  email: string;
  fullName: string;
  password?: string;
  role: CenterRoleKey;
  status: TenantStaffStatus;
};

export type TenantStaffListResponse = {
  items: TenantStaff[];
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
      message: "RoyalCare tenant staff request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listTenantStaff(filters?: {
  role?: string;
  search?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters?.role && filters.role !== "ALL") {
    params.set("role", filters.role);
  }

  if (filters?.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  const queryString = params.toString();

  return request<TenantStaffListResponse>(
    `/tenant/staff${queryString ? `?${queryString}` : ""}`,
  );
}

export function createTenantStaff(payload: TenantStaffPayload) {
  return request<TenantStaff>("/tenant/staff", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getTenantStaff(staffId: string) {
  return request<TenantStaff>(`/tenant/staff/${staffId}`);
}

export function updateTenantStaff(
  staffId: string,
  payload: Partial<TenantStaffPayload>,
) {
  return request<TenantStaff>(`/tenant/staff/${staffId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateTenantStaffStatus(
  staffId: string,
  status: TenantStaffStatus,
) {
  return request<TenantStaff>(`/tenant/staff/${staffId}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}
