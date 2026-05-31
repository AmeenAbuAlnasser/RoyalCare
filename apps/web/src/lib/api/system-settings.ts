import { API_BASE_URL } from "./super-admin-centers";

export type SystemSetting = {
  key: string;
  value: string | null;
  updatedAt?: string | null;
};

export async function getSystemSettings(): Promise<{ settings: SystemSetting[] }> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    credentials: "include",
    headers: { "Content-Type": "application/json",  },
  });
  if (!res.ok) throw new Error("Failed to load system settings.");
  return res.json() as Promise<{ settings: SystemSetting[] }>;
}

export async function updateSystemSettings(
  settings: SystemSetting[],
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    body: JSON.stringify({ settings }),
    credentials: "include",
    headers: { "Content-Type": "application/json",  },
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to save system settings.");
  return res.json() as Promise<{ success: boolean }>;
}

export type UploadError = {
  code: string;
  details?: string;
  message?: string;
};

export class UploadFailedError extends Error {
  code: string;
  details?: string;
  constructor(payload: UploadError) {
    super(payload.message ?? "Upload failed");
    this.code = payload.code;
    this.details = payload.details;
  }
}

export async function uploadPublicImage(
  file: File,
  type?: string,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (type) formData.append("type", type);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/admin/uploads/public-image`, {
      body: formData,
      credentials: "include",
      method: "POST",
    });
  } catch (networkErr) {
    // Connection refused, CORS preflight blocked, or server unreachable.
    throw new UploadFailedError({
      code: "NETWORK_ERROR",
      details:
        networkErr instanceof Error
          ? networkErr.message
          : "Server unreachable — is the API running?",
    });
  }

  if (!res.ok) {
    let payload: UploadError = { code: "HTTP_" + String(res.status) };
    try {
      payload = (await res.json()) as UploadError;
    } catch {
      // body wasn't JSON — leave default
    }
    throw new UploadFailedError(payload);
  }

  return res.json() as Promise<{ url: string }>;
}

export async function getPublicSystemSettings(): Promise<{
  settings: SystemSetting[];
}> {
  // cache: 'no-store' ensures the browser never serves a stale cached response
  // after an admin uploads new branding. next.revalidate only works in server
  // components; this function runs in a client useEffect.
  const res = await fetch(`${API_BASE_URL}/public/settings`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load public settings.");
  return res.json() as Promise<{ settings: SystemSetting[] }>;
}
