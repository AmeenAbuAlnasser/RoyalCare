"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  getTenantAnalyticsDashboard,
  type AnalyticsDashboard,
  type DailyPoint,
  type TopPageRow,
  type TopServiceRow,
  type TrafficSourceRow,
} from "@/lib/api/tenant-analytics";
import { CenterAdminShell } from "@/features/center-admin/layout/CenterAdminShell";

// ─── Translations ─────────────────────────────────────────────────────────────

const copy = {
  en: {
    title: "Website Analytics",
    subtitle: "Center website performance over the last 30 days",
    period: "Last 30 days",
    refresh: "Refresh",
    noData: "No data yet",
    noDataBody: "Start sharing your center website link and analytics will appear here automatically.",
    errorTitle: "Could not load analytics",
    cards: {
      visitors: "Website Visitors",
      bookingPageViews: "Booking Page Views",
      bookNowClicks: "Book Now Clicks",
      whatsappClicks: "WhatsApp Clicks",
      phoneClicks: "Phone Clicks",
      contactPageViews: "Contact Page Views",
      galleryViews: "Gallery Views",
      reviewsViews: "Reviews Views",
      beforeAfterViews: "Before/After Views",
      completedBookings: "Completed Bookings",
      conversionRate: "Conversion Rate",
    },
    charts: {
      dailyVisitors: "Daily Visitors",
      bookingAttempts: "Booking Page Views / Day",
      topPages: "Top Viewed Pages",
      topServices: "Top Selected Services",
      trafficSources: "Traffic Sources",
    },
    sources: {
      FACEBOOK: "Facebook",
      INSTAGRAM: "Instagram",
      TIKTOK: "TikTok",
      GOOGLE: "Google",
      DIRECT: "Direct",
      UNKNOWN: "Unknown",
    },
    pageLabels: {
      "/": "Home",
      "/gallery": "Gallery",
      "/reviews": "Reviews",
      "/before-after": "Before / After",
      "/offers": "Offers",
      "/contact": "Contact",
      "/services": "Services",
      "/book": "Booking",
      "/about": "About",
    } as Record<string, string>,
    noTopPages: "No page views recorded yet.",
    noTopServices: "No services selected yet.",
    noSources: "No traffic source data yet.",
  },
  ar: {
    title: "تحليلات الموقع",
    subtitle: "أداء موقع المركز خلال آخر 30 يومًا",
    period: "آخر 30 يومًا",
    refresh: "تحديث",
    noData: "لا توجد بيانات بعد",
    noDataBody: "ابدأ بمشاركة رابط موقع مركزك وستظهر التحليلات هنا تلقائيًا.",
    errorTitle: "تعذّر تحميل التحليلات",
    cards: {
      visitors: "زوّار الموقع",
      bookingPageViews: "مشاهدات صفحة الحجز",
      bookNowClicks: "نقرات احجز الآن",
      whatsappClicks: "نقرات واتساب",
      phoneClicks: "نقرات الاتصال",
      contactPageViews: "مشاهدات صفحة التواصل",
      galleryViews: "مشاهدات المعرض",
      reviewsViews: "مشاهدات التقييمات",
      beforeAfterViews: "مشاهدات قبل وبعد",
      completedBookings: "الحجوزات المكتملة",
      conversionRate: "معدل التحويل",
    },
    charts: {
      dailyVisitors: "الزوّار اليومي",
      bookingAttempts: "مشاهدات الحجز / يوم",
      topPages: "أكثر الصفحات مشاهدةً",
      topServices: "الخدمات الأكثر اختيارًا",
      trafficSources: "مصادر الزيارات",
    },
    sources: {
      FACEBOOK: "فيسبوك",
      INSTAGRAM: "إنستغرام",
      TIKTOK: "تيك توك",
      GOOGLE: "جوجل",
      DIRECT: "مباشر",
      UNKNOWN: "غير معروف",
    },
    pageLabels: {
      "/": "الرئيسية",
      "/gallery": "المعرض",
      "/reviews": "التقييمات",
      "/before-after": "قبل وبعد",
      "/offers": "العروض",
      "/contact": "التواصل",
      "/services": "الخدمات",
      "/book": "الحجز",
      "/about": "عن المركز",
    } as Record<string, string>,
    noTopPages: "لم يتم تسجيل مشاهدات للصفحات بعد.",
    noTopServices: "لم يتم اختيار أي خدمات بعد.",
    noSources: "لا توجد بيانات مصدر الزيارات بعد.",
  },
  he: {
    title: "אנליטיקת האתר",
    subtitle: "ביצועי אתר המרכז ב-30 הימים האחרונים",
    period: "30 ימים אחרונים",
    refresh: "רענן",
    noData: "אין נתונים עדיין",
    noDataBody: "שתפו את קישור האתר של המרכז והנתונים יופיעו כאן אוטומטית.",
    errorTitle: "לא ניתן לטעון נתונים",
    cards: {
      visitors: "מבקרי האתר",
      bookingPageViews: "צפיות בדף ההזמנה",
      bookNowClicks: "לחיצות קבע תור",
      whatsappClicks: "לחיצות וואטסאפ",
      phoneClicks: "לחיצות טלפון",
      contactPageViews: "צפיות ביצירת קשר",
      galleryViews: "צפיות בגלריה",
      reviewsViews: "צפיות בביקורות",
      beforeAfterViews: "צפיות לפני/אחרי",
      completedBookings: "הזמנות שהושלמו",
      conversionRate: "שיעור המרה",
    },
    charts: {
      dailyVisitors: "מבקרים יומיים",
      bookingAttempts: "צפיות הזמנה / יום",
      topPages: "הדפים הנצפים ביותר",
      topServices: "השירותים הנבחרים ביותר",
      trafficSources: "מקורות תנועה",
    },
    sources: {
      FACEBOOK: "פייסבוק",
      INSTAGRAM: "אינסטגרם",
      TIKTOK: "טיקטוק",
      GOOGLE: "גוגל",
      DIRECT: "ישיר",
      UNKNOWN: "לא ידוע",
    },
    pageLabels: {
      "/": "בית",
      "/gallery": "גלריה",
      "/reviews": "ביקורות",
      "/before-after": "לפני/אחרי",
      "/offers": "מבצעים",
      "/contact": "יצירת קשר",
      "/services": "שירותים",
      "/book": "הזמנה",
      "/about": "אודות",
    } as Record<string, string>,
    noTopPages: "עדיין אין צפיות בדפים.",
    noTopServices: "עדיין לא נבחרו שירותים.",
    noSources: "עדיין אין נתוני מקורות תנועה.",
  },
} as const;

type Copy = {
  title: string;
  subtitle: string;
  period: string;
  refresh: string;
  noData: string;
  noDataBody: string;
  errorTitle: string;
  cards: Record<string, string>;
  charts: Record<string, string>;
  sources: Record<string, string>;
  pageLabels: Record<string, string>;
  noTopPages: string;
  noTopServices: string;
  noSources: string;
};

// ─── Sparkline chart ──────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: DailyPoint[]; color: string }) {
  const counts = data.map((d) => d.count);
  const max = Math.max(...counts, 1);
  const W = 320;
  const H = 56;
  const pad = 4;

  const points = counts.map((c, i) => {
    const x = pad + (i / Math.max(counts.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((c / max) * (H - pad * 2));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  if (points.length < 2) {
    return (
      <div className="flex h-14 items-center justify-center text-xs text-[#B0BAC9]">—</div>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="w-full"
      height={H}
      preserveAspectRatio="none"
      viewBox={`0 0 ${W} ${H}`}
    >
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-2xl border p-4 shadow-[0_2px_8px_rgba(11,45,92,0.06)] transition sm:p-5 ${
        highlight
          ? "border-[#C8A45D]/40 bg-[#C8A45D]/6"
          : "border-[#E5E7EB] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#66758a]">{label}</span>
        <span className="shrink-0 text-[#C8A45D]">{icon}</span>
      </div>
      <p className={`text-2xl font-bold leading-none ${highlight ? "text-[#7A5C20]" : "text-[#0B2D5C]"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#9AA5B4]">{sub}</p>}
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function HorizontalBar({ label, count, max, color }: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max((count / max) * 100, 2) : 2;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate font-medium text-[#0B2D5C]">{label}</span>
        <span className="shrink-0 font-bold text-[#66758a]">{count.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Source color map ─────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E1306C",
  TIKTOK: "#010101",
  GOOGLE: "#4285F4",
  DIRECT: "#0B2D5C",
  UNKNOWN: "#9AA5B4",
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  FACEBOOK: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.418c0-3.016 1.79-4.682 4.533-4.682 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.955.925-1.955 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.093 24 18.1 24 12.073z" />
    </svg>
  ),
  INSTAGRAM: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  TIKTOK: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  GOOGLE: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  ),
  DIRECT: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  UNKNOWN: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminCard className="p-4 sm:p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-[#66758a]">{title}</h3>
      {children}
    </AdminCard>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_VISITORS = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICON_CALENDAR = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);
const ICON_CLICK = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M15 15l6 6M9.5 17a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" strokeLinecap="round" />
  </svg>
);
const ICON_WA = (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
  </svg>
);
const ICON_PHONE = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICON_STAR = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ICON_PERCENT = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <line x1="19" x2="5" y1="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

// ─── Main page ────────────────────────────────────────────────────────────────

function AnalyticsDashboardContent({
  data,
  t,
}: {
  data: AnalyticsDashboard;
  t: Copy;
}) {
  const hasAnyData = data.cards.visitors > 0 || data.cards.bookingPageViews > 0;
  const maxDaily = Math.max(...data.charts.dailyVisitors.map((d) => d.count), 1);
  const maxBooking = Math.max(...data.charts.bookingAttempts.map((d) => d.count), 1);
  const maxPage = data.charts.topPages[0]?.count ?? 1;
  const maxService = data.charts.topServices[0]?.count ?? 1;
  const maxSource = data.trafficSources[0]?.count ?? 1;

  if (!hasAnyData) {
    return (
      <AdminState
        body={t.noDataBody}
        className="mt-6"
        title={t.noData}
        tone="neutral"
      />
    );
  }

  const metricCards = [
    { key: "visitors", icon: ICON_VISITORS, value: data.cards.visitors },
    { key: "bookingPageViews", icon: ICON_CALENDAR, value: data.cards.bookingPageViews },
    { key: "bookNowClicks", icon: ICON_CLICK, value: data.cards.bookNowClicks },
    { key: "whatsappClicks", icon: ICON_WA, value: data.cards.whatsappClicks },
    { key: "phoneClicks", icon: ICON_PHONE, value: data.cards.phoneClicks },
    { key: "contactPageViews", icon: ICON_CLICK, value: data.cards.contactPageViews },
    { key: "galleryViews", icon: ICON_CLICK, value: data.cards.galleryViews },
    { key: "reviewsViews", icon: ICON_STAR, value: data.cards.reviewsViews },
    { key: "beforeAfterViews", icon: ICON_CLICK, value: data.cards.beforeAfterViews },
    { key: "completedBookings", icon: ICON_CALENDAR, value: data.cards.completedBookings },
    { key: "conversionRate", icon: ICON_PERCENT, value: `${data.cards.conversionRate}%`, highlight: true },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Period badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#526176]">
          {t.period}
        </span>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {metricCards.map(({ key, icon, value, ...rest }) => (
          <MetricCard
            icon={icon}
            key={key}
            label={t.cards[key as keyof typeof t.cards]}
            value={value}
            highlight={"highlight" in rest ? (rest as { highlight: boolean }).highlight : false}
          />
        ))}
      </div>

      {/* Sparkline charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ChartCard title={t.charts.dailyVisitors}>
          <div className="mb-2 flex items-end justify-between text-xs text-[#9AA5B4]">
            <span>{maxDaily.toLocaleString()}</span>
            <span>0</span>
          </div>
          <Sparkline color="#0B2D5C" data={data.charts.dailyVisitors} />
          <div className="mt-1 flex justify-between text-[10px] text-[#B0BAC9]">
            <span>{data.charts.dailyVisitors[0]?.date ?? ""}</span>
            <span>{data.charts.dailyVisitors[data.charts.dailyVisitors.length - 1]?.date ?? ""}</span>
          </div>
        </ChartCard>

        <ChartCard title={t.charts.bookingAttempts}>
          <div className="mb-2 flex items-end justify-between text-xs text-[#9AA5B4]">
            <span>{maxBooking.toLocaleString()}</span>
            <span>0</span>
          </div>
          <Sparkline color="#C8A45D" data={data.charts.bookingAttempts} />
          <div className="mt-1 flex justify-between text-[10px] text-[#B0BAC9]">
            <span>{data.charts.bookingAttempts[0]?.date ?? ""}</span>
            <span>{data.charts.bookingAttempts[data.charts.bookingAttempts.length - 1]?.date ?? ""}</span>
          </div>
        </ChartCard>
      </div>

      {/* Traffic sources + Top pages */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Traffic sources */}
        <ChartCard title={t.charts.trafficSources}>
          {data.trafficSources.length === 0 ? (
            <p className="text-sm text-[#9AA5B4]">{t.noSources}</p>
          ) : (
            <div className="space-y-3">
              {data.trafficSources.map((row) => (
                <div key={row.source} className="flex items-center gap-2.5">
                  <span style={{ color: SOURCE_COLORS[row.source] ?? "#9AA5B4" }}>
                    {SOURCE_ICONS[row.source]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#0B2D5C]">
                        {t.sources[row.source as keyof typeof t.sources] ?? row.source}
                      </span>
                      <span className="font-bold text-[#66758a]">{row.percent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((row.count / maxSource) * 100, 2)}%`,
                          backgroundColor: SOURCE_COLORS[row.source] ?? "#9AA5B4",
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-[#0B2D5C]">
                    {row.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Top pages */}
        <ChartCard title={t.charts.topPages}>
          {data.charts.topPages.length === 0 ? (
            <p className="text-sm text-[#9AA5B4]">{t.noTopPages}</p>
          ) : (
            <div className="space-y-3">
              {data.charts.topPages.map((row) => (
                <HorizontalBar
                  color="#0B2D5C"
                  count={row.count}
                  key={row.page}
                  label={t.pageLabels[row.page] ?? row.page}
                  max={maxPage}
                />
              ))}
            </div>
          )}
        </ChartCard>

        {/* Top services */}
        <ChartCard title={t.charts.topServices}>
          {data.charts.topServices.length === 0 ? (
            <p className="text-sm text-[#9AA5B4]">{t.noTopServices}</p>
          ) : (
            <div className="space-y-3">
              {data.charts.topServices.map((row) => (
                <HorizontalBar
                  color="#C8A45D"
                  count={row.count}
                  key={row.name}
                  label={row.name}
                  max={maxService}
                />
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Shell-wrapped export ─────────────────────────────────────────────────────

export function TenantMarketingAnalyticsPage() {
  const { locale } = useLanguage();
  const t = copy[locale as keyof typeof copy] ?? copy.en;
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    setStatus("loading");
    try {
      const result = await getTenantAnalyticsDashboard();
      setData(result);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  return (
    <CenterAdminShell
      activeNav="websiteAnalytics"
      requiredPermission="reports:view"
      subtitle={(d) => d.nav.websiteAnalytics}
      title={(d) => d.nav.websiteAnalytics}
    >
      {() => (
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#0B2D5C] sm:text-2xl">{t.title}</h1>
              <p className="mt-1 text-sm text-[#66758a]">{t.subtitle}</p>
            </div>
            <button
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#0B2D5C] shadow-sm transition hover:bg-[#F8FAFC] disabled:opacity-60"
              disabled={status === "loading"}
              onClick={() => void load()}
              type="button"
            >
              <svg aria-hidden="true" className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.refresh}
            </button>
          </div>

          {status === "loading" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div className="h-24 animate-pulse rounded-2xl bg-[#E5E7EB]" key={i} />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div className="h-36 animate-pulse rounded-2xl bg-[#E5E7EB]" key={i} />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div className="h-48 animate-pulse rounded-2xl bg-[#E5E7EB]" key={i} />
                ))}
              </div>
            </div>
          )}

          {status === "error" && (
            <AdminState className="mt-4" title={t.errorTitle} tone="error" />
          )}

          {status === "ready" && data && (
            <AnalyticsDashboardContent data={data} t={t} />
          )}
        </div>
      )}
    </CenterAdminShell>
  );
}
