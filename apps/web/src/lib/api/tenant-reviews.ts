import { API_BASE_URL, type PublicCenterReview } from "./public-centers";

export type TenantCenterReview = PublicCenterReview & {
  createdAt: string;
  isPublished: boolean;
  updatedAt: string;
};

export type TenantReviewPayload = {
  commentAr: string | null;
  commentEn: string | null;
  commentHe: string | null;
  customerName: string;
  isPublished: boolean;
  rating: number;
  sortOrder: number;
};

export async function listTenantReviews(): Promise<{ success: boolean; items: TenantCenterReview[] }> {
  const response = await fetch(`${API_BASE_URL}/tenant/reviews`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to load reviews.");
  return response.json() as Promise<{ success: boolean; items: TenantCenterReview[] }>;
}

export async function createTenantReview(
  payload: TenantReviewPayload,
): Promise<TenantCenterReview> {
  const response = await fetch(`${API_BASE_URL}/tenant/reviews`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to save review.");
  const json = (await response.json()) as { item: TenantCenterReview; success: boolean };
  return json.item;
}

export async function updateTenantReview(
  id: string,
  payload: TenantReviewPayload,
): Promise<TenantCenterReview> {
  const response = await fetch(`${API_BASE_URL}/tenant/reviews/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Failed to save review.");
  const json = (await response.json()) as { item: TenantCenterReview; success: boolean };
  return json.item;
}

export async function deleteTenantReview(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tenant/reviews/${encodeURIComponent(id)}`, {
    credentials: "include",
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete review.");
}
