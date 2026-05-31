import { API_BASE_URL } from "./public-centers";
import type { PublicGalleryImage } from "./public-centers";

export type TenantGalleryImage = PublicGalleryImage & {
  createdAt: string;
};

export type TenantGalleryResponse = {
  success: boolean;
  items: TenantGalleryImage[];
};

export class TenantGalleryRequestError extends Error {
  details: unknown;
  status: number;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.name = "TenantGalleryRequestError";
    this.status = status;
    this.details = details;
  }
}

async function parseErrorBody(res: Response) {
  const raw = await res.text();
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export async function listTenantGallery(): Promise<TenantGalleryResponse> {
  const res = await fetch(`${API_BASE_URL}/tenant/center-gallery`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new TenantGalleryRequestError(
      res.status,
      "Failed to load gallery.",
      await parseErrorBody(res),
    );
  }
  return res.json() as Promise<TenantGalleryResponse>;
}

export async function uploadTenantGalleryImage(
  file: File,
): Promise<TenantGalleryImage> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/tenant/center-gallery/upload`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });
  if (!res.ok) {
    let payload: { message?: string; errors?: Record<string, string> } = {};
    try { payload = (await res.json()) as typeof payload; } catch { /* empty */ }
    throw Object.assign(
      new Error(payload.errors?.file ?? payload.message ?? "Upload failed."),
      { errors: payload.errors },
    );
  }
  const json = (await res.json()) as { success: boolean; item: TenantGalleryImage };
  return json.item;
}

export async function deleteTenantGalleryImage(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/tenant/center-gallery/${encodeURIComponent(id)}`,
    { credentials: "include", method: "DELETE" },
  );
  if (!res.ok) throw new Error("Failed to delete image.");
}

export async function reorderTenantGalleryImages(
  ids: string[],
): Promise<TenantGalleryResponse> {
  const res = await fetch(`${API_BASE_URL}/tenant/center-gallery/reorder`, {
    body: JSON.stringify({ ids }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to reorder gallery.");
  return res.json() as Promise<TenantGalleryResponse>;
}
