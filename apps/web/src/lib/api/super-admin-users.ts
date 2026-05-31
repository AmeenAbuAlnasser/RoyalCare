import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type SuperAdminUserStatus =
  | "INVITED"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "DELETED";

export type SuperAdminRole = {
  id: string;
  key: string;
  name: string;
  scope?: "PLATFORM" | "CENTER" | "CUSTOMER";
};

export type SuperAdminUserRoleAssignment = {
  id: string;
  center?: { id: string; name: string; slug?: string } | null;
  role: SuperAdminRole;
  status: string;
  assignedAt: string;
};

export type SuperAdminUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName: string;
  status: SuperAdminUserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  roles?: SuperAdminUserRoleAssignment[];
  ownedCenters?: Array<{ id: string; name: string; slug?: string }>;
};

export type ListSuperAdminUsersParams = {
  pageSize?: number;
  role?: string;
  search?: string;
  status?: string;
};

export type CreateSuperAdminUserPayload = {
  centerId?: string;
  centerRoleKey?: string;
  email: string;
  fullName: string;
  phone?: string;
  platformRoleKey?: string;
  status?: SuperAdminUserStatus;
  temporaryPassword: string;
};

export type UpdateSuperAdminUserPayload = {
  email?: string;
  fullName?: string;
  phone?: string;
  status?: SuperAdminUserStatus;
};

export type PlatformRoleOption = {
  id: string;
  key: string;
  name: string;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    const details = safelyParseJson(rawResponseBody);
    const message =
      details &&
      typeof details === "object" &&
      "message" in details &&
      typeof (details as { message?: unknown }).message === "string"
        ? (details as { message: string }).message
        : "RoyalCare users request failed.";

    throw new ApiRequestError({
      details,
      message,
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

function toQuery(params: ListSuperAdminUsersParams = {}) {
  const query = new URLSearchParams();
  query.set("pageSize", String(params.pageSize ?? 100));

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.role && params.role !== "ALL") query.set("role", params.role);

  return query.toString();
}

export function listSuperAdminUsers(params?: ListSuperAdminUsersParams) {
  return request<{
    data: SuperAdminUser[];
    pagination: { page: number; pageSize: number; total: number };
    stats?: {
      activeUsers: number;
      pendingUsers: number;
      suspendedUsers: number;
      totalUsers: number;
    };
  }>(`/super-admin/users?${toQuery(params)}`);
}

export function getSuperAdminUser(userId: string) {
  return request<SuperAdminUser>(`/super-admin/users/${userId}`);
}

export function createSuperAdminUser(payload: CreateSuperAdminUserPayload) {
  return request<SuperAdminUser>("/super-admin/users", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateSuperAdminUser(
  userId: string,
  payload: UpdateSuperAdminUserPayload,
) {
  return request<SuperAdminUser>(`/super-admin/users/${userId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateSuperAdminUserStatus(
  userId: string,
  status: Exclude<SuperAdminUserStatus, "DELETED">,
) {
  return request<SuperAdminUser>(`/super-admin/users/${userId}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export function resetSuperAdminUserPassword(
  userId: string,
  temporaryPassword?: string,
) {
  return request<{
    resetComplete: boolean;
    temporaryPassword: string;
    user: SuperAdminUser;
  }>(`/super-admin/users/${userId}/reset-password`, {
    body: JSON.stringify(temporaryPassword ? { temporaryPassword } : {}),
    method: "POST",
  });
}

export function assignSuperAdminUserCenterRole(
  userId: string,
  payload: { centerId: string; roleKey: string },
) {
  return request(`/super-admin/users/${userId}/center-roles`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function listPlatformRoles() {
  return request<{ data: PlatformRoleOption[] }>("/permissions/platform-roles");
}
