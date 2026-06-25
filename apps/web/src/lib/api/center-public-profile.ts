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
  globalWhatsappPhone?: string | null;
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
  publicBookingMode?: "SIMPLE_REQUEST" | "DIRECT_BOOKING" | null;
};

export type CenterPublicProfileResponse = {
  centerId: string;
  branding: CenterPublicProfileData | null;
};

export type CenterBranch = {
  id: string;
  centerId?: string;
  name: string;
  cityAr: string | null;
  cityEn: string | null;
  cityHe: string | null;
  addressAr: string | null;
  addressEn: string | null;
  addressHe: string | null;
  phone: string | null;
  whatsapp: string | null;
  mapsUrl: string | null;
  workingHoursTextAr: string | null;
  workingHoursTextEn: string | null;
  workingHoursTextHe: string | null;
  isMain: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CenterBranchPayload = Omit<
  CenterBranch,
  "id" | "centerId" | "createdAt" | "updatedAt"
>;

async function readJsonError(res: Response, fallback: string): Promise<Error> {
  let payload: { message?: string; errors?: Record<string, string> } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    /* empty */
  }
  return Object.assign(new Error(payload.message ?? fallback), {
    errors: payload.errors,
  });
}

// ── Super Admin ────────────────────────────────────────────────────────────

export async function getSuperAdminCenterPublicProfile(
  centerId: string,
): Promise<CenterPublicProfileResponse> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile`,
    {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) throw new Error("Failed to load public profile.");
  return res.json() as Promise<CenterPublicProfileResponse>;
}

export async function updateSuperAdminCenterPublicProfile(
  centerId: string,
  data: CenterPublicProfileData,
): Promise<CenterPublicProfileResponse> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile`,
    {
      body: JSON.stringify(data),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  if (!res.ok) {
    let payload: { message?: string; errors?: Record<string, string> } = {};
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      /* empty */
    }
    throw Object.assign(new Error(payload.message ?? "Failed to save."), {
      errors: payload.errors,
    });
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
    res = await fetch(
      `${API_BASE_URL}/admin/centers/${centerId}/public-profile/upload-image`,
      {
        body: formData,
        credentials: "include",
        method: "POST",
      },
    );
  } catch (networkErr) {
    throw new UploadFailedError({
      code: "NETWORK_ERROR",
      details:
        networkErr instanceof Error ? networkErr.message : "Server unreachable",
    });
  }

  if (!res.ok) {
    let payload: UploadError = { code: "HTTP_" + String(res.status) };
    try {
      payload = (await res.json()) as UploadError;
    } catch {
      /* empty */
    }
    throw new UploadFailedError(payload);
  }
  return res.json() as Promise<{ url: string }>;
}

export async function listSuperAdminCenterBranches(
  centerId: string,
): Promise<CenterBranch[]> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile/branches`,
    {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) throw new Error("Failed to load branches.");
  const json = (await res.json()) as { data: CenterBranch[] };
  return json.data;
}

export async function createSuperAdminCenterBranch(
  centerId: string,
  data: CenterBranchPayload,
): Promise<CenterBranch> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile/branches`,
    {
      body: JSON.stringify(data),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to save branch.");
  return res.json() as Promise<CenterBranch>;
}

export async function updateSuperAdminCenterBranch(
  centerId: string,
  branchId: string,
  data: CenterBranchPayload,
): Promise<CenterBranch> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile/branches/${branchId}`,
    {
      body: JSON.stringify(data),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to save branch.");
  return res.json() as Promise<CenterBranch>;
}

export async function deleteSuperAdminCenterBranch(
  centerId: string,
  branchId: string,
): Promise<CenterBranch> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile/branches/${branchId}`,
    {
      credentials: "include",
      method: "DELETE",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to deactivate branch.");
  return res.json() as Promise<CenterBranch>;
}

export async function reorderSuperAdminCenterBranches(
  centerId: string,
  branches: Array<{ id: string; sortOrder: number }>,
): Promise<CenterBranch[]> {
  const res = await fetch(
    `${API_BASE_URL}/admin/centers/${centerId}/public-profile/branches/reorder`,
    {
      body: JSON.stringify({ branches }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to reorder branches.");
  const json = (await res.json()) as { data: CenterBranch[] };
  return json.data;
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
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      /* empty */
    }
    throw Object.assign(new Error(payload.message ?? "Failed to save."), {
      errors: payload.errors,
    });
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
      details:
        networkErr instanceof Error ? networkErr.message : "Server unreachable",
    });
  }

  if (!res.ok) {
    let payload: UploadError = { code: "HTTP_" + String(res.status) };
    try {
      payload = (await res.json()) as UploadError;
    } catch {
      /* empty */
    }
    throw new UploadFailedError(payload);
  }
  return res.json() as Promise<{ url: string }>;
}

export async function listTenantCenterBranches(): Promise<CenterBranch[]> {
  const res = await fetch(`${API_BASE_URL}/tenant/public-profile/branches`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load branches.");
  const json = (await res.json()) as { data: CenterBranch[] };
  return json.data;
}

export async function createTenantCenterBranch(
  data: CenterBranchPayload,
): Promise<CenterBranch> {
  const res = await fetch(`${API_BASE_URL}/tenant/public-profile/branches`, {
    body: JSON.stringify(data),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!res.ok) throw await readJsonError(res, "Failed to save branch.");
  return res.json() as Promise<CenterBranch>;
}

export async function updateTenantCenterBranch(
  branchId: string,
  data: CenterBranchPayload,
): Promise<CenterBranch> {
  const res = await fetch(
    `${API_BASE_URL}/tenant/public-profile/branches/${branchId}`,
    {
      body: JSON.stringify(data),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to save branch.");
  return res.json() as Promise<CenterBranch>;
}

export async function deleteTenantCenterBranch(
  branchId: string,
): Promise<CenterBranch> {
  const res = await fetch(
    `${API_BASE_URL}/tenant/public-profile/branches/${branchId}`,
    {
      credentials: "include",
      method: "DELETE",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to deactivate branch.");
  return res.json() as Promise<CenterBranch>;
}

export async function reorderTenantCenterBranches(
  branches: Array<{ id: string; sortOrder: number }>,
): Promise<CenterBranch[]> {
  const res = await fetch(
    `${API_BASE_URL}/tenant/public-profile/branches/reorder`,
    {
      body: JSON.stringify({ branches }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  if (!res.ok) throw await readJsonError(res, "Failed to reorder branches.");
  const json = (await res.json()) as { data: CenterBranch[] };
  return json.data;
}
