import { API_BASE_URL } from "./public-centers";

export type TenantSeoSettings = {
  id: string;
  centerId: string;
  seoTitleAr: string | null;
  seoTitleEn: string | null;
  seoTitleHe: string | null;
  seoDescriptionAr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionHe: string | null;
  keywordsAr: string | null;
  keywordsEn: string | null;
  keywordsHe: string | null;
  ogTitleAr: string | null;
  ogTitleEn: string | null;
  ogTitleHe: string | null;
  ogDescriptionAr: string | null;
  ogDescriptionEn: string | null;
  ogDescriptionHe: string | null;
  ogImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantSeoPayload = {
  seoTitleAr: string | null;
  seoTitleEn: string | null;
  seoTitleHe: string | null;
  seoDescriptionAr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionHe: string | null;
  keywordsAr: string | null;
  keywordsEn: string | null;
  keywordsHe: string | null;
  ogTitleAr: string | null;
  ogTitleEn: string | null;
  ogTitleHe: string | null;
  ogDescriptionAr: string | null;
  ogDescriptionEn: string | null;
  ogDescriptionHe: string | null;
  ogImageUrl: string | null;
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

export async function getTenantSeo(): Promise<{
  item: TenantSeoSettings | null;
  success: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/tenant/seo`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to load SEO settings."));
  return response.json() as Promise<{ item: TenantSeoSettings | null; success: boolean }>;
}

export async function uploadTenantOgImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/tenant/seo/upload`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to upload image."));
  return response.json() as Promise<{ url: string }>;
}

export async function upsertTenantSeo(payload: TenantSeoPayload): Promise<TenantSeoSettings> {
  const response = await fetch(`${API_BASE_URL}/tenant/seo`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to save SEO settings."));
  const json = (await response.json()) as { item: TenantSeoSettings; success: boolean };
  return json.item;
}
