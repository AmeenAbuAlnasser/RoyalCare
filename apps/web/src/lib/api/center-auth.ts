import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type {
  CenterRoleKey,
  CenterStatusKey,
} from "@/i18n/dictionaries/center-admin";

export type CenterSession = {
  center: {
    branding?: {
      logoUrl?: string | null;
    } | null;
    id: string;
    name: string;
    slug: string;
    status: CenterStatusKey;
    type: string;
    primaryLanguage: string;
    timezone: string;
  };
  role: {
    id: string;
    key: CenterRoleKey;
    name: string;
  };
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    fullName: string;
    status: string;
    createdAt: string;
  };
};

export type CenterLoginContext = {
  center: CenterSession["center"];
  loginAllowed: boolean;
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
      message: "RoyalCare center auth request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function resolveCenterLogin(centerSlug: string) {
  return request<CenterLoginContext>(
    `/auth/center/resolve/${encodeURIComponent(centerSlug)}`,
  );
}

export function loginCenterUser(
  email: string,
  password: string,
  centerSlug?: string,
) {
  return request<CenterSession>("/auth/center/login", {
    body: JSON.stringify({ centerSlug, email, password }),
    method: "POST",
  });
}

export function getCenterSession() {
  return request<CenterSession>("/auth/center/me");
}

export function logoutCenterUser() {
  return request<{ loggedOut: boolean }>("/auth/center/logout", {
    method: "POST",
  });
}
