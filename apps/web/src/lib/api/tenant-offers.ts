import { API_BASE_URL, type PublicOffer } from "./public-centers";

export type TenantOffer = PublicOffer & {
  createdAt: string;
  isPublished: boolean;
  updatedAt: string;
};

export type TenantOfferPayload = {
  badgeAr: string | null;
  badgeEn: string | null;
  badgeHe: string | null;
  currency: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionHe: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  newPrice: string | null;
  oldPrice: string | null;
  sortOrder: number;
  startsAt: string | null;
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

export async function listTenantOffers(): Promise<{
  items: TenantOffer[];
  success: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/tenant/offers`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to load offers."));
  return response.json() as Promise<{ items: TenantOffer[]; success: boolean }>;
}

export async function uploadTenantOfferImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/tenant/offers/upload`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to upload image."));
  return response.json() as Promise<{ url: string }>;
}

export async function createTenantOffer(payload: TenantOfferPayload): Promise<TenantOffer> {
  const response = await fetch(`${API_BASE_URL}/tenant/offers`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save offer."));
  const json = (await response.json()) as { item: TenantOffer; success: boolean };
  return json.item;
}

export async function updateTenantOffer(
  id: string,
  payload: TenantOfferPayload,
): Promise<TenantOffer> {
  const response = await fetch(`${API_BASE_URL}/tenant/offers/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save offer."));
  const json = (await response.json()) as { item: TenantOffer; success: boolean };
  return json.item;
}

export async function deleteTenantOffer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tenant/offers/${encodeURIComponent(id)}`, {
    credentials: "include",
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to delete offer."));
}
