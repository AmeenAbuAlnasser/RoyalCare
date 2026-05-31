import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type CenterScheduleHour = {
  dayOfWeek: DayOfWeek;
  endTime: string;
  id: string | null;
  isClosed: boolean;
  startTime: string;
};

export type ProviderScheduleHour = {
  dayOfWeek: DayOfWeek;
  endTime: string;
  id: string | null;
  isAvailable: boolean;
  providerId?: string;
  startTime: string;
};

export type ScheduleClosedDay = {
  date: string;
  id: string;
  reason: string | null;
};

export type ScheduleProvider = {
  id: string;
  name: string;
  roleKey: string;
  roleName: string;
};

export type ScheduleProviderLeave = {
  date: string;
  id: string;
  providerId: string;
  providerName: string;
  reason: string | null;
};

export type TenantScheduleResponse = {
  centerHours: CenterScheduleHour[];
  closedDays: ScheduleClosedDay[];
  providerHours: ProviderScheduleHour[];
  providerLeave: ScheduleProviderLeave[];
  providers: ScheduleProvider[];
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
      message: "RoyalCare tenant schedule request failed.",
      rawResponseBody: JSON.stringify(body ?? {}),
      status: response.status,
    });
  }
  return body as T;
}

export function getTenantSchedule() {
  return request<TenantScheduleResponse>("/tenant/schedule");
}

export function updateTenantCenterHours(hours: CenterScheduleHour[]) {
  return request<TenantScheduleResponse>("/tenant/schedule/center-hours", {
    body: JSON.stringify({ hours }),
    method: "PATCH",
  });
}

export function addTenantClosedDay(payload: { date: string; reason?: string }) {
  return request<ScheduleClosedDay>("/tenant/schedule/closed-days", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function deleteTenantClosedDay(id: string) {
  return request<{ deleted: boolean }>(`/tenant/schedule/closed-days/${id}`, {
    method: "DELETE",
  });
}

export function updateTenantProviderHours(
  providerId: string,
  hours: ProviderScheduleHour[],
) {
  return request<TenantScheduleResponse>(
    `/tenant/schedule/providers/${providerId}/hours`,
    {
      body: JSON.stringify({ hours }),
      method: "PATCH",
    },
  );
}

export function addTenantProviderLeave(
  providerId: string,
  payload: { date: string; reason?: string },
) {
  return request<ScheduleProviderLeave>(
    `/tenant/schedule/providers/${providerId}/leave`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export function deleteTenantProviderLeave(id: string) {
  return request<{ deleted: boolean }>(`/tenant/schedule/providers/leave/${id}`, {
    method: "DELETE",
  });
}
