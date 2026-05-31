import { API_BASE_URL } from "./public-centers";
import { UploadFailedError, type UploadError } from "./system-settings";

export type CenterPublicProfileData = {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  publicDescriptionAr?: string | null;
  publicDescriptionEn?: string | null;
  publicDescriptionHe?: string | null;
  fullDescriptionAr?: string | null;
  fullDescriptionEn?: string | null;
  fullDescriptionHe?: string | null;
  sloganAr?: string | null;
  sloganEn?: string | null;
  sloganHe?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  cityHe?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  addressHe?: string | null;
  whatsappPhone?: string | null;
  phone?: string | null;
  email?: string | null;
  googleMapsUrl?: string | null;
  workingHoursAr?: string | null;
  workingHoursEn?: string | null;
  workingHoursHe?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteSectionOrder?: string[] | null;
  websiteSectionVisibility?: Record<string, boolean> | null;
};

export type CenterPublicProfileResponse = {
  centerId: string;
  branding: CenterPublicProfileData | null;
};

// ── Super Admin ────────────────────────────────────────────────────────────

export async function getSuperAdminCenterPublicProfile(
  centerId: string,
): Promise<CenterPublicProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/admin/centers/${centerId}/public-profile`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load public profile.");
  return res.json() as Promise<CenterPublicProfileResponse>;
}

export async function updateSuperAdminCenterPublicProfile(
  centerId: string,
  data: CenterPublicProfileData,
): Promise<CenterPublicProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/admin/centers/${centerId}/public-profile`, {
    body: JSON.stringify(data),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!res.ok) {
    let payload: { message?: string; errors?: Record<string, string> } = {};
    try { payload = (await res.json()) as typeof payload; } catch { /* empty */ }
    throw Object.assign(new Error(payload.message ?? "Failed to save."), { errors: payload.errors });
  }
  return res.json() as Promise<CenterPublicProfileResponse>;
}

export async function uploadSuperAdminCenterPublicImage(
  centerId: string,
  file: File,
  type?: string,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (type) formData.append("type", type);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/admin/centers/${centerId}/public-profile/upload-image`, {
      body: formData,
      credentials: "include",
      method: "POST",
    });
  } catch (networkErr) {
    throw new UploadFailedError({
      code: "NETWORK_ERROR",
      details: networkErr instanceof Error ? networkErr.message : "Server unreachable",
    });
  }

  if (!res.ok) {
    let payload: UploadError = { code: "HTTP_" + String(res.status) };
    try { payload = (await res.json()) as UploadError; } catch { /* empty */ }
    throw new UploadFailedError(payload);
  }
  return res.json() as Promise<{ url: string }>;
}

// ── Tenant ─────────────────────────────────────────────────────────────────

export async function getTenantCenterPublicProfile(): Promise<CenterPublicProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/tenant/public-profile`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load public profile.");
  return res.json() as Promise<CenterPublicProfileResponse>;
}

export async function updateTenantCenterPublicProfile(
  data: CenterPublicProfileData,
): Promise<CenterPublicProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/tenant/public-profile`, {
    body: JSON.stringify(data),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!res.ok) {
    let payload: { message?: string; errors?: Record<string, string> } = {};
    try { payload = (await res.json()) as typeof payload; } catch { /* empty */ }
    throw Object.assign(new Error(payload.message ?? "Failed to save."), { errors: payload.errors });
  }
  return res.json() as Promise<CenterPublicProfileResponse>;
}

export async function uploadTenantCenterPublicImage(
  file: File,
  type?: string,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (type) formData.append("type", type);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/tenant/public-profile/upload-image`, {
      body: formData,
      credentials: "include",
      method: "POST",
    });
  } catch (networkErr) {
    throw new UploadFailedError({
      code: "NETWORK_ERROR",
      details: networkErr instanceof Error ? networkErr.message : "Server unreachable",
    });
  }

  if (!res.ok) {
    let payload: UploadError = { code: "HTTP_" + String(res.status) };
    try { payload = (await res.json()) as UploadError; } catch { /* empty */ }
    throw new UploadFailedError(payload);
  }
  return res.json() as Promise<{ url: string }>;
}
