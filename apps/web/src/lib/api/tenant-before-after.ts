import {
  API_BASE_URL,
  type PublicBeforeAfterCategory,
  type PublicCenterBeforeAfter,
} from "./public-centers";

export type TenantBeforeAfterItem = PublicCenterBeforeAfter & {
  createdAt: string;
  isPublished: boolean;
  updatedAt: string;
};

export type TenantBeforeAfterPayload = {
  afterImageUrl: string | null;
  beforeImageUrl: string | null;
  category: PublicBeforeAfterCategory;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionHe: string | null;
  isPublished: boolean;
  sortOrder: number;
  titleAr: string | null;
  titleEn: string | null;
  titleHe: string | null;
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

export async function listTenantBeforeAfter(): Promise<{
  items: TenantBeforeAfterItem[];
  success: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/tenant/before-after`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to load before/after items."));
  return response.json() as Promise<{ items: TenantBeforeAfterItem[]; success: boolean }>;
}

export async function uploadTenantBeforeAfterImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/tenant/before-after/upload`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to upload image."));
  return response.json() as Promise<{ url: string }>;
}

export async function createTenantBeforeAfter(
  payload: TenantBeforeAfterPayload,
): Promise<TenantBeforeAfterItem> {
  const response = await fetch(`${API_BASE_URL}/tenant/before-after`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save before/after item."));
  const json = (await response.json()) as { item: TenantBeforeAfterItem; success: boolean };
  return json.item;
}

export async function updateTenantBeforeAfter(
  id: string,
  payload: TenantBeforeAfterPayload,
): Promise<TenantBeforeAfterItem> {
  const response = await fetch(`${API_BASE_URL}/tenant/before-after/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save before/after item."));
  const json = (await response.json()) as { item: TenantBeforeAfterItem; success: boolean };
  return json.item;
}

export async function deleteTenantBeforeAfter(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tenant/before-after/${encodeURIComponent(id)}`, {
    credentials: "include",
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to delete before/after item."));
}
