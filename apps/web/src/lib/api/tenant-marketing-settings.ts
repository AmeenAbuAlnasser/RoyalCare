import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type TenantMarketingSettings = {
  customBodyScript: string | null;
  customHeadScript: string | null;
  ga4Id: string | null;
  gtmId: string | null;
  hasMetaConversionApiToken: boolean;
  metaConversionApiToken: string | null;
  metaPixelId: string | null;
  snapPixelId: string | null;
  tiktokPixelId: string | null;
  updatedAt: string | null;
};

export type TenantMarketingSettingsPayload = Omit<
  TenantMarketingSettings,
  "hasMetaConversionApiToken" | "metaConversionApiToken" | "updatedAt"
> & {
  metaConversionApiToken?: string | null;
};

export type MarketingTrackingLog = {
  bookingRequestId: string | null;
  createdAt: string;
  eventId: string | null;
  eventName: string;
  id: string;
  message: string | null;
  provider: "GA4" | "META_CAPI" | "META_PIXEL" | "SNAP" | "TIKTOK";
  status: "FAILED" | "SKIPPED" | "SUCCESS";
};

async function safelyParseJson(response: Response) {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await safelyParseJson(response);
  if (!response.ok) {
    throw new ApiRequestError({
      details: body,
      message: "RoyalCare tenant marketing settings request failed.",
      rawResponseBody: JSON.stringify(body ?? {}),
      status: response.status,
    });
  }
  return body as T;
}

export function getTenantMarketingSettings() {
  return request<{ settings: TenantMarketingSettings }>(
    "/tenant/settings/marketing",
  );
}

export function updateTenantMarketingSettings(
  payload: TenantMarketingSettingsPayload,
) {
  return request<{ settings: TenantMarketingSettings }>(
    "/tenant/settings/marketing",
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    },
  );
}

export function testTenantMetaCapi() {
  return request<{ message: string; success: true }>(
    "/tenant/settings/marketing/test-meta-capi",
    { method: "POST" },
  );
}

export function listTenantMarketingLogs(limit = 20) {
  return request<{ logs: MarketingTrackingLog[] }>(
    `/tenant/settings/marketing/logs?limit=${encodeURIComponent(String(limit))}`,
  );
}
