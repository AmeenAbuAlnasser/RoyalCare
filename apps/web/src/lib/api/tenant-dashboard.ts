import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type TenantDashboardStats = {
  alerts: {
    patientsWithCredit: number;
    pendingInvoices: number;
    upcomingSoon: number;
  };
  appointments: number;
  patients: number;
  recentAppointments: Array<{
    appointmentDate: string;
    id: string;
    patientName: string;
    providerName: string;
    serviceNameAr: string;
    serviceNameEn: string;
    serviceNameHe: string;
    startTime: string;
    status: string;
  }>;
  recentInvoices: Array<{
    amount: string;
    createdAt: string;
    currency: string;
    id: string;
    patientName: string;
    serviceNameAr: string;
    serviceNameEn: string;
    serviceNameHe: string;
    status: string;
  }>;
  services: number;
  staff: number;
  todayActivity: {
    appointmentsToday: number;
    completedToday: number;
    noShow: number;
    upcomingNextTwoHours: number;
  };
  subscription: {
    daysRemaining: number | null;
    endDate?: string | null;
    isExpired: boolean;
    isExpiringSoon: boolean;
    planName: string;
    status:
      | "TRIALING"
      | "ACTIVE"
      | "PAST_DUE"
      | "SUSPENDED"
      | "CANCELLED"
      | "EXPIRED";
  } | null;
  notifications: {
    unreadCount: number;
    latest: Array<{
      id: string;
      type: string | null;
      title: Record<string, string> | null;
      body: Record<string, string> | null;
      status: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string) {
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
      message: "RoyalCare tenant dashboard request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function getTenantDashboardStats(branchId?: string) {
  const now = new Date();
  const params = new URLSearchParams({
    clientNow: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    clientDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  });
  if (branchId) params.set("branchId", branchId);
  return request<TenantDashboardStats>(`/tenant/dashboard/stats?${params.toString()}`);
}
