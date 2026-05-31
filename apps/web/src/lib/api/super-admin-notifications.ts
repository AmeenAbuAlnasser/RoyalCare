import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export const SUPER_ADMIN_NOTIFICATIONS_UPDATED_EVENT =
  "super-admin-notifications-updated";

export function notifySuperAdminNotificationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SUPER_ADMIN_NOTIFICATIONS_UPDATED_EVENT));
}


export type NotificationType =
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_RENEWAL_REQUEST"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_RENEWED"
  | "TRIAL_ENDING_SOON"
  | "MISSING_WHATSAPP_PHONE";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";

export type NotificationLog = {
  id: string;
  channel: NotificationChannel;
  success: boolean;
  errorMessage: string | null;
  sentAt: string;
};

export type SuperAdminNotification = {
  id: string;
  centerId: string;
  type: NotificationType | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  targetAudience?: "SUPER_ADMIN" | "CENTER_ADMIN";
  eventKey: string;
  title: Record<string, string> | null;
  body: Record<string, string> | null;
  scheduledAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  readAt?: string | null;
  readByUserId?: string | null;
  actionUrl?: string;
  centerName?: string;
  metadata?: Record<string, unknown> | null;
  center: {
    id: string;
    name: string;
    slug: string;
    subscriptions?: Array<{ notificationPhone: string | null }>;
    owner?: { phone: string | null } | null;
  };
  logs: NotificationLog[];
  manualAttempts?: number;
  manualWhatsApp?: {
    attemptsCount: number;
    lastAction: "OPENED_WHATSAPP" | "COPIED_MESSAGE" | null;
    lastPhone: string | null;
    lastAt: string | null;
  };
};

export type SuperAdminNotificationsResponse = {
  data: SuperAdminNotification[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  stats: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    sentToday: number;
    unread: number;
  };
};

function safelyParseJson(rawBody: string): unknown {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
          },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare notifications could not be loaded.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export type ListNotificationsQuery = {
  category?: string;
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  centerId?: string;
  unreadOnly?: boolean;
};

export async function updateSuperAdminNotificationStatus(
  id: string,
  status: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/notifications/${id}/status`,
    {
      body: JSON.stringify({ status }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
              },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "Could not update notification status.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as { success: boolean };
}

export async function markSuperAdminNotificationRead(
  id: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/notifications/${id}/read`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
              },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "Could not mark notification as read.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as { success: boolean };
}

export async function markAllSuperAdminNotificationsRead(): Promise<{
  success: boolean;
  count: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/notifications/read-all`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
              },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "Could not mark notifications as read.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as { success: boolean; count: number };
}

export async function logManualWhatsAppAction(
  notificationId: string,
  payload: {
    phone: string;
    message: string;
    action: "OPENED_WHATSAPP" | "COPIED_MESSAGE";
  },
): Promise<{ logged: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/notifications/${notificationId}/manual-whatsapp-log`,
    {
      body: JSON.stringify(payload),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
              },
      method: "POST",
    },
  );

  if (!response.ok) {
    const rawResponseBody = await response.text();

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "Could not log WhatsApp action.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as { logged: boolean };
}

export function listSuperAdminNotifications(
  query: ListNotificationsQuery = {},
): Promise<SuperAdminNotificationsResponse> {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.category) params.set("category", query.category);
  if (query.pageSize !== undefined)
    params.set("pageSize", String(query.pageSize));
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.centerId) params.set("centerId", query.centerId);
  if (query.unreadOnly !== undefined)
    params.set("unreadOnly", String(query.unreadOnly));

  const qs = params.toString();
  const path = `/super-admin/notifications${qs ? `?${qs}` : ""}`;

  return request<SuperAdminNotificationsResponse>(path);
}
