import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type { AuditLogEntry } from "./super-admin-audit-logs";

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare analytics could not be loaded.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export type SuperAdminAnalyticsDashboard = {
  centers: {
    totalCenters: number;
    activeCenters: number;
    inactiveCenters: number;
    recentlyCreatedCenters: number;
    centersWithoutRecentAppointments?: Array<{
      id: string;
      name: string;
    }>;
    latestCenters?: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      createdAt: string;
      ownerName: string | null;
      ownerEmail: string | null;
      plan: string | null;
    }>;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    superAdminsCount: number;
    centerAdminsCount: number;
  };
  appointments: {
    totalAppointments: number;
    todayAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    pendingAppointments: number;
    appointmentsThisMonth: number;
    appointmentsPreviousMonth: number;
    appointmentsByCenter: Array<{
      centerId: string;
      centerName: string;
      count: number;
    }>;
  };
  billing: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    partialInvoices: number;
    cancelledInvoices: number;
    totalPaidAmount: string;
    totalOutstandingAmount: string;
    totalPatientCredit: string;
    revenueThisMonth: string;
    revenuePreviousMonth: string;
    revenueByCenter: Array<{
      centerId: string;
      centerName: string;
      amount: string;
    }>;
  };
  subscriptionBilling?: {
    totalSubscriptionRevenue: string;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    mrr: string;
    revenueByPlan: Array<{
      planCode: string;
      planName: string;
      amount: string;
    }>;
  };
  audit: {
    latestAuditLogs: AuditLogEntry[];
    sensitiveActionsCount: number;
    sensitiveActionsTodayCount?: number;
    mostActiveAdmins: Array<{
      actorUserId: string;
      actorName: string;
      actorEmail: string | null;
      count: number;
    }>;
    recentLoginAsCenterActions: AuditLogEntry[];
  };
  insights: {
    alerts: SuperAdminAnalyticsInsight[];
    highlights: SuperAdminAnalyticsInsight[];
    recommendations: SuperAdminAnalyticsInsight[];
  };
  charts: SuperAdminAnalyticsCharts;
  platformUsage?: {
    totalPatients: number;
    totalAppointments: number;
    appointmentsLast30Days: number;
    totalInvoices: number;
    totalUsers: number;
    activeCenters: number;
  };
  subscriptions?: {
    activeCentersWithActiveSub?: number;
    activeSubscriptions: number;
    cancelledSubscriptions?: number;
    centersAtRisk?: CentersAtRisk;
    expiringSoonSubscriptions: number;
    expiredSubscriptions: number;
    gracePeriodSubscriptions?: number;
    suspendedSubscriptions: number;
    totalSubscriptions?: number;
    trialingSubscriptions?: number;
    unknownSubscriptions?: number;
  };
};

export type CentersAtRisk = {
  total: number;
  noSubscription: number;
  expired: number;
  suspended: number;
  gracePeriod: number;
  centerIdsByReason: {
    NO_SUBSCRIPTION: string[];
    SUBSCRIPTION_EXPIRED: string[];
    SUBSCRIPTION_SUSPENDED: string[];
    SUBSCRIPTION_GRACE_PERIOD: string[];
  };
};

export type SuperAdminAnalyticsCharts = {
  revenueTrend: Array<{ date: string; amount: string }>;
  appointmentsTrend: Array<{ date: string; count: number }>;
  topCentersByRevenue: Array<{ centerId: string; centerName: string; amount: string }>;
  topCentersByAppointments: Array<{ centerId: string; centerName: string; count: number }>;
  auditActivityTrend: Array<{ date: string; count: number }>;
};

export type SuperAdminAnalyticsInsight = {
  type: string;
  severity: "low" | "medium" | "high";
  messageEn: string;
  messageAr: string;
  messageHe: string;
  relatedCenterId?: string;
  relatedCenterName?: string;
};

export function getSuperAdminAnalyticsDashboard() {
  return request<SuperAdminAnalyticsDashboard>(
    "/super-admin/analytics/dashboard",
  );
}

export function getCentersAtRisk() {
  return request<CentersAtRisk>("/super-admin/analytics/centers-at-risk");
}
