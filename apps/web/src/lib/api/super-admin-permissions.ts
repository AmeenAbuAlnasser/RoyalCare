import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type PlatformPermission =
  | "view:centers"
  | "create:centers"
  | "edit:centers"
  | "suspend:centers"
  | "manage:subscriptions"
  | "view:internal_notes"
  | "manage:internal_notes"
  | "view:users"
  | "manage:users"
  | "manage:plans"
  | "view:reports";

export type CurrentPermissionsResponse = {
  permissions: PlatformPermission[];
  roles: Array<{
    id: string;
    key: string;
    name: string;
  }>;
  user: {
    email?: string | null;
    fullName: string;
    id: string;
    phone?: string | null;
    status?: string;
  } | null;
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

export async function getCurrentSuperAdminPermissions() {
  const response = await fetch(`${API_BASE_URL}/permissions/me`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare permissions could not be loaded.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as CurrentPermissionsResponse;
}

export function hasPlatformPermission(
  permissions: readonly string[],
  permission: PlatformPermission,
) {
  return permissions.includes(permission);
}
