import { API_BASE_URL, type PublicTeamMember } from "./public-centers";

export type TenantTeamMember = PublicTeamMember & {
  createdAt: string;
  isPublished: boolean;
  updatedAt: string;
};

export type TenantTeamPayload = {
  bioAr: string | null;
  bioEn: string | null;
  bioHe: string | null;
  isPublished: boolean;
  nameAr: string | null;
  nameEn: string | null;
  nameHe: string | null;
  photoUrl: string | null;
  sortOrder: number;
  specialtyAr: string | null;
  specialtyEn: string | null;
  specialtyHe: string | null;
  titleAr: string | null;
  titleEn: string | null;
  titleHe: string | null;
  yearsExperience: number | null;
};

async function readError(response: Response, fallback: string) {
  try {
    const json = (await response.json()) as {
      errors?: Record<string, string>;
      message?: string;
    };
    return Object.values(json.errors ?? {})[0] ?? json.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function listTenantTeam(): Promise<{
  items: TenantTeamMember[];
  success: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/tenant/team`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to load team members."));
  return response.json() as Promise<{ items: TenantTeamMember[]; success: boolean }>;
}

export async function uploadTenantTeamPhoto(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/tenant/team/upload`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to upload photo."));
  return response.json() as Promise<{ url: string }>;
}

export async function createTenantTeamMember(
  payload: TenantTeamPayload,
): Promise<TenantTeamMember> {
  const response = await fetch(`${API_BASE_URL}/tenant/team`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save team member."));
  const json = (await response.json()) as { item: TenantTeamMember; success: boolean };
  return json.item;
}

export async function updateTenantTeamMember(
  id: string,
  payload: TenantTeamPayload,
): Promise<TenantTeamMember> {
  const response = await fetch(`${API_BASE_URL}/tenant/team/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save team member."));
  const json = (await response.json()) as { item: TenantTeamMember; success: boolean };
  return json.item;
}

export async function deleteTenantTeamMember(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tenant/team/${encodeURIComponent(id)}`, {
    credentials: "include",
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to delete team member."));
}
