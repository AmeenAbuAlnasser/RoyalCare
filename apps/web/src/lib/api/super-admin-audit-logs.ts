import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type AuditLogEntry = {
  id: string;
  action: string;
  actorUserId: string | null;
  targetUserId: string | null;
  centerId: string | null;
  metadata: Record<string, unknown> | null;
  actionLabel?: string | null;
  actorDisplayName?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  centerDisplayName?: string | null;
  centerName?: string | null;
  createdAt: string;
  readableActionAr?: string | null;
  targetEmail?: string | null;
  targetDisplayEmail?: string | null;
  targetDisplayName?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  actor: { id: string; fullName: string; email: string | null } | null;
  target: { id: string; fullName: string; email: string | null } | null;
  center: { id: string; name: string; slug: string | null } | null;
};

export type ListAuditLogsParams = {
  actorUserId?: string;
  actorSearch?: string;
  targetUserId?: string;
  targetSearch?: string;
  centerId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    const details = safelyParseJson(rawResponseBody);
    const message =
      details &&
      typeof details === "object" &&
      "message" in details &&
      typeof (details as { message?: unknown }).message === "string"
        ? (details as { message: string }).message
        : "RoyalCare audit logs request failed.";

    throw new ApiRequestError({
      details,
      message,
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

function toQuery(params: ListAuditLogsParams = {}) {
  const query = new URLSearchParams();
  if (params.actorUserId) query.set("actorUserId", params.actorUserId);
  else if (params.actorSearch) query.set("actorSearch", params.actorSearch);
  if (params.targetUserId) query.set("targetUserId", params.targetUserId);
  else if (params.targetSearch) query.set("targetSearch", params.targetSearch);
  if (params.centerId) query.set("centerId", params.centerId);
  if (params.action) query.set("action", params.action);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return query.toString();
}

export function listAuditLogs(params?: ListAuditLogsParams) {
  return request<{
    data: AuditLogEntry[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>(`/super-admin/audit-logs?${toQuery(params)}`);
}
