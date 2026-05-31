import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type PlatformSessionUser = {
  id: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  status: string;
};

export type PlatformSessionRole = {
  id: string;
  key: string;
  name: string;
};

export type PlatformSession = {
  user: PlatformSessionUser;
  roles: PlatformSessionRole[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(init?.headers)),
    },
  });

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    let details: unknown = null;
    try {
      details = rawBody ? (JSON.parse(rawBody) as unknown) : null;
    } catch {}
    const message =
      (details &&
        typeof details === "object" &&
        "message" in details &&
        typeof (details as { message: unknown }).message === "string"
        ? (details as { message: string }).message
        : null) ||
      rawBody ||
      `RoyalCare API request failed with status ${response.status}.`;
    throw new ApiRequestError({ details, message, rawResponseBody: rawBody, status: response.status });
  }

  return (await response.json()) as T;
}

export function loginSuperAdmin(email: string, password: string) {
  return request<PlatformSession>("/auth/super-admin/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });
}

export function logoutSuperAdmin() {
  return request<{ loggedOut: boolean }>("/auth/super-admin/logout", {
    method: "POST",
  });
}

export function getSuperAdminMe() {
  return request<PlatformSession>("/auth/super-admin/me");
}
