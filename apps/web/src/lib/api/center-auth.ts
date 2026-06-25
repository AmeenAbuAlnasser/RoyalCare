import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type {
  CenterRoleKey,
  CenterStatusKey,
} from "@/i18n/dictionaries/center-admin";

export type CenterSession = {
  center: {
    logoUrl?: string | null;
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
  permissions: string[];
  subscriptionAccess?: {
    daysRemaining: number | null;
    graceDaysRemaining: number | null;
    isExpired: boolean;
    isExpiringSoon: boolean;
    isInGracePeriod: boolean;
    isSuspended: boolean;
    planName: string | null;
    status:
      | "TRIALING"
      | "ACTIVE"
      | "PAST_DUE"
      | "SUSPENDED"
      | "CANCELLED"
      | "EXPIRED"
      | "EXPIRED_GRACE_PERIOD"
      | "EXPIRING_SOON"
      | null;
  };
};

export type CenterLoginContext = {
  center: CenterSession["center"];
  loginAllowed: boolean;
};

export type CenterAccountProfile = {
  avatarUrl: string | null;
  email: string;
  fullName: string;
  phone: string;
  preferredLanguage: "AR" | "EN" | "HE";
  whatsappPhone: string;
};

export type CenterAccountProfilePayload = {
  avatarUrl?: string | null;
  email: string;
  fullName: string;
  phone: string;
  preferredLanguage: "AR" | "EN" | "HE";
  whatsappPhone: string;
};

const CENTER_SESSION_CACHE_TTL_MS = 60_000;

let centerSessionCache:
  | {
      expiresAt: number;
      promise: Promise<CenterSession>;
    }
  | null = null;

export function clearCenterSessionCache() {
  centerSessionCache = null;
}

export function primeCenterSessionCache(session: CenterSession) {
  centerSessionCache = {
    expiresAt: Date.now() + CENTER_SESSION_CACHE_TTL_MS,
    promise: Promise.resolve(session),
  };
}

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
  clearCenterSessionCache();
  return request<CenterSession>("/auth/center/login", {
    body: JSON.stringify({ centerSlug, email, password }),
    method: "POST",
  }).then((session) => {
    primeCenterSessionCache(session);
    return session;
  });
}

export function getCenterSession(options?: { force?: boolean }) {
  const now = Date.now();
  if (!options?.force && centerSessionCache && centerSessionCache.expiresAt > now) {
    return centerSessionCache.promise;
  }

  const promise = request<CenterSession>("/permissions/me").catch((error) => {
    clearCenterSessionCache();
    throw error;
  });

  centerSessionCache = {
    expiresAt: now + CENTER_SESSION_CACHE_TTL_MS,
    promise,
  };

  return promise;
}

export function logoutCenterUser() {
  clearCenterSessionCache();
  return request<{ loggedOut: boolean }>("/auth/center/logout", {
    method: "POST",
  }).finally(clearCenterSessionCache);
}

export function changeCenterPassword(
  currentPassword: string,
  newPassword: string,
) {
  return request<{ success: boolean }>("/auth/center/change-password", {
    body: JSON.stringify({ currentPassword, newPassword }),
    method: "POST",
  });
}

export function getCenterAccountProfile() {
  return request<CenterAccountProfile>("/auth/center/account-profile");
}

export function updateCenterAccountProfile(payload: CenterAccountProfilePayload) {
  clearCenterSessionCache();
  return request<CenterAccountProfile>("/auth/center/account-profile", {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}
