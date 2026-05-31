import { API_BASE_URL } from "./super-admin-centers";

export class AdminCentersApiError extends Error {
  public readonly errorCode?: string;

  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AdminCentersApiError";
    this.errorCode =
      details && typeof details === "object" && "errorCode" in details
        ? String((details as { errorCode?: unknown }).errorCode)
        : undefined;
  }
}

export type AdminCenterStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "ARCHIVED";

export type AdminCenterSummary = {
  id: string;
  name: string;
  slug: string;
  status: AdminCenterStatus;
  createdAt: string;
  usersCount: number;
};

export type AdminCenterUser = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  roleName?: string;
  status: string;
  assignmentStatus?: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdminCenterDetails = AdminCenterSummary & {
  users: AdminCenterUser[];
};

export type AdminCenterLoginAsResult = {
  token: string;
  redirectUrl: string;
  center: {
    id: string;
    name: string;
    slug: string;
    status: AdminCenterStatus;
  };
  role: {
    id: string;
    key: string;
    name: string;
  };
  user: {
    id: string;
    email?: string | null;
    fullName: string;
    status: string;
  };
};

export type CreateAdminCenterManagerPayload = {
  email: string;
  fullName: string;
  phone?: string;
  temporaryPassword: string;
};

type ApiCollection<T> = {
  data: T[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await response.text();
  const data = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new AdminCentersApiError(
      data?.message ?? "Request failed",
      response.status,
      data,
    );
  }

  return data as T;
}

export function listAdminCenters() {
  return request<ApiCollection<AdminCenterSummary>>("/admin/centers");
}

export function getAdminCenter(centerId: string) {
  return request<AdminCenterDetails>(
    `/admin/centers/${encodeURIComponent(centerId)}`,
  );
}

export function updateAdminCenterStatus(
  centerId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  return request<AdminCenterDetails>(
    `/admin/centers/${encodeURIComponent(centerId)}/status`,
    {
      body: JSON.stringify({
        status,
        ...(status === "SUSPENDED"
          ? { reason: "Super Admin status toggle" }
          : {}),
      }),
      method: "PATCH",
    },
  );
}

export function loginAsAdminCenter(centerId: string) {
  return request<AdminCenterLoginAsResult>(
    `/admin/centers/${encodeURIComponent(centerId)}/login-as`,
    {
      method: "POST",
    },
  );
}

export function createAdminCenterManager(
  centerId: string,
  payload: CreateAdminCenterManagerPayload,
) {
  return request<AdminCenterUser>(
    `/admin/centers/${encodeURIComponent(centerId)}/manager`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}
