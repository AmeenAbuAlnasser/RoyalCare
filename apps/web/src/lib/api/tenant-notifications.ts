import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type TenantNotification = {
  id: string;
  type: string | null;
  channel: string;
  status: string;
  eventKey: string;
  title: Record<string, string> | null;
  body: Record<string, string> | null;
  scheduledAt: string | null;
  sentAt: string | null;
  readAt: string | null;
  readByUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type TenantNotificationsList = {
  data: TenantNotification[];
  pagination: { page: number; pageSize: number; total: number };
  unreadCount: number;
};

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let details: unknown = null;
    try {
      details = JSON.parse(rawBody);
    } catch {
      // ignore
    }
    throw new ApiRequestError({
      details,
      message: "Tenant notifications request failed.",
      rawResponseBody: rawBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listTenantNotifications(params?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}): Promise<TenantNotificationsList> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  const qs = query.toString();
  return request<TenantNotificationsList>(
    `/tenant/notifications${qs ? `?${qs}` : ""}`,
  );
}

export function markTenantNotificationRead(
  notificationId: string,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    `/tenant/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
}

export function getTenantNotificationsStreamUrl() {
  return `${API_BASE_URL}/tenant/notifications/stream`;
}
