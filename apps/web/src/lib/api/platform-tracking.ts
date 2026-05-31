import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type PlatformTrackingConfig = {
  ga4Id: string | null;
  gtmId: string | null;
  hasMetaConversionApiToken: boolean;
  metaConversionApiToken: null;
  metaPixelId: string | null;
  snapPixelId: string | null;
  testMode: boolean;
  tiktokPixelId: string | null;
  updatedAt: string | null;
};

export type PlatformTrackingConfigDto = {
  ga4Id?: string | null;
  gtmId?: string | null;
  metaConversionApiToken?: string | null;
  metaPixelId?: string | null;
  snapPixelId?: string | null;
  testMode?: boolean | null;
  tiktokPixelId?: string | null;
};

export type PlatformTrackingLog = {
  createdAt: string;
  eventId: string | null;
  eventName: string;
  id: string;
  message: string | null;
  provider: string;
  status: string;
};

export type PublicPlatformConfig = {
  ga4Id: string | null;
  gtmId: string | null;
  metaPixelId: string | null;
  snapPixelId: string | null;
  tiktokPixelId: string | null;
} | null;

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try { return JSON.parse(rawBody) as unknown; } catch { return null; }
}

async function request<T>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    method: options?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    ...(options?.body != null ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "Platform tracking request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function getPlatformTrackingConfig() {
  return request<{ config: PlatformTrackingConfig }>("/super-admin/platform-tracking");
}

export function updatePlatformTrackingConfig(dto: PlatformTrackingConfigDto) {
  return request<{ config: PlatformTrackingConfig }>("/super-admin/platform-tracking", {
    method: "PATCH",
    body: dto,
  });
}

export function getPlatformTrackingLogs(limit?: number) {
  const query = limit != null ? `?limit=${limit}` : "";
  return request<{ logs: PlatformTrackingLog[]; unavailable?: boolean }>(
    `/super-admin/platform-tracking/logs${query}`,
  );
}

export function testPlatformMetaCapi() {
  return request<{ message: string; success: boolean }>(
    "/super-admin/platform-tracking/test-meta-capi",
    { method: "POST" },
  );
}

// Public endpoint — no auth required
export async function getPublicPlatformTrackingConfig(): Promise<{
  config: PublicPlatformConfig;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/public/platform-tracking`,
      { credentials: "omit" },
    );
    if (!response.ok) return { config: null };
    return (await response.json()) as { config: PublicPlatformConfig };
  } catch {
    return { config: null };
  }
}
