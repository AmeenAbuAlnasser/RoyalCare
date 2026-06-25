import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type TenantBranchOption = {
  id: string;
  name: string;
  cityAr: string | null;
  cityEn: string | null;
  cityHe: string | null;
  addressAr: string | null;
  addressEn: string | null;
  addressHe: string | null;
  isMain: boolean;
};

export type TenantBranchesResponse = {
  branches: TenantBranchOption[];
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

/** Active branches for the current center — shared by every BranchFilter. */
export async function listTenantBranches(): Promise<TenantBranchesResponse> {
  const response = await fetch(`${API_BASE_URL}/tenant/branches`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare tenant branches request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as TenantBranchesResponse;
}
