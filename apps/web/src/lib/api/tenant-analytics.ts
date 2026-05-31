import { API_BASE_URL } from "./super-admin-centers";

export type TrafficSourceRow = {
  source: string;
  count: number;
  percent: number;
};

export type DailyPoint = {
  date: string;
  count: number;
};

export type TopPageRow = {
  page: string;
  count: number;
};

export type TopServiceRow = {
  name: string;
  count: number;
};

export type AnalyticsDashboard = {
  period: string;
  cards: {
    visitors: number;
    bookingPageViews: number;
    bookNowClicks: number;
    whatsappClicks: number;
    phoneClicks: number;
    contactPageViews: number;
    galleryViews: number;
    reviewsViews: number;
    beforeAfterViews: number;
    completedBookings: number;
    conversionRate: string;
  };
  trafficSources: TrafficSourceRow[];
  charts: {
    dailyVisitors: DailyPoint[];
    bookingAttempts: DailyPoint[];
    topPages: TopPageRow[];
    topServices: TopServiceRow[];
  };
};

export async function getTenantAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const res = await fetch(`${API_BASE_URL}/tenant/marketing/analytics`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Analytics error ${res.status}`);
  }
  return res.json() as Promise<AnalyticsDashboard>;
}
