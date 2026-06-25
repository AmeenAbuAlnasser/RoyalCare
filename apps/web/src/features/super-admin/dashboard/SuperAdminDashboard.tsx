"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  formatCompactCurrency,
  formatDate,
  formatNumber,
  formatSignedNumber,
  formatSignedPercent,
} from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminDashboardDictionaries } from "@/i18n/dictionaries/super-admin-dashboard";
import { superAdminAuditLogsDictionaries } from "@/i18n/dictionaries/super-admin-audit-logs";
import type { SupportedLocale } from "@/i18n/locales";
import {
  getSuperAdminAnalyticsDashboard,
  type SuperAdminAnalyticsDashboard,
  type SuperAdminAnalyticsCharts,
  type SuperAdminAnalyticsInsight,
} from "@/lib/api/super-admin-analytics";

type Dictionary = (typeof superAdminDashboardDictionaries)["en"];
type BillingKey = keyof Dictionary["billing"];
type OverviewKey = keyof Dictionary["overview"];
type StatusKey = keyof Dictionary["statuses"];
type StatKey = keyof Dictionary["stats"];

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: StatusKey;
}) {
  const styles: Record<StatusKey, string> = {
    active: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    archived: "border-slate-200 bg-slate-50 text-slate-700",
    cancelled: "border-rose-200 bg-rose-50 text-rose-700",
    trial: "border-[#C8A45D]/30 bg-[#C8A45D]/12 text-[#7A5C20]",
    pastDue: "border-[#C8A45D]/35 bg-[#C8A45D]/14 text-[#7A5C20]",
    pending: "border-[#C8A45D]/35 bg-[#C8A45D]/14 text-[#7A5C20]",
    partial: "border-indigo-200 bg-indigo-50 text-indigo-700",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    suspended: "border-rose-200 bg-rose-50 text-rose-700",
    verified: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    failed: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function SectionShell({
  title,
  action,
  actionHref,
  children,
}: {
  title: string;
  action?: string;
  actionHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 max-w-full rounded-lg border border-[#E5E7EB] bg-white">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="min-w-0 text-sm font-semibold text-[#0B2D5C]">
          {title}
        </h2>
        {action && actionHref ? (
          <Link
            className={buttonClassName("ghost", "sm", "shrink-0")}
            href={actionHref}
          >
            {action}
          </Link>
        ) : action ? (
          <span className="shrink-0 text-xs font-medium text-[#66758a]">
            {action}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function getInsightMessage(
  insight: SuperAdminAnalyticsInsight,
  locale: "ar" | "en" | "he",
) {
  if (locale === "ar") return insight.messageAr;
  if (locale === "he") return insight.messageHe;

  return insight.messageEn;
}

function getInsightActionHref(
  type: string,
  relatedCenterId?: string,
): string | null {
  switch (type) {
    case "CENTER_NO_RECENT_APPOINTMENTS":
    case "MONITOR_INACTIVE_CENTERS":
      return relatedCenterId
        ? `/super-admin/centers?centerId=${relatedCenterId}`
        : "/super-admin/centers?filter=no-appointments";
    case "REVIEW_INACTIVE_CENTERS":
    case "NO_ACTIVE_CENTERS":
      return "/super-admin/centers?status=inactive";
    case "CENTERS_WITHOUT_ACTIVE_SUBSCRIPTION":
      return "/super-admin/centers?lifecycle=NEEDS_SUBSCRIPTION_REVIEW";
    // /super-admin/billing does not exist — disable these
    case "HIGH_INVOICE_CANCELLATIONS":
    case "REVIEW_CANCELLATION_RATE":
    case "REVENUE_DROP":
      return null;
    case "HIGH_SENSITIVE_ACTIONS":
      return "/super-admin/audit-logs";
    case "REVIEW_INACTIVE_USERS":
      return "/super-admin/users?status=inactive";
    case "TOP_CENTER_BY_REVENUE":
    case "TOP_CENTER_BY_APPOINTMENTS":
    case "MOST_ACTIVE_ADMIN":
      return relatedCenterId ? `/super-admin/centers?centerId=${relatedCenterId}` : null;
    default:
      return null;
  }
}

// Maps chart/list drill-down actions to existing Super Admin routes.
// Returns null for routes that do not exist, preventing 404 navigation.
function getDrillDownUrl(
  type: "revenue-trend-bar" | "appointments-trend-bar" | "audit-trend-bar" | "center-detail",
  payload?: { date?: string; centerId?: string },
): string | null {
  switch (type) {
    // /super-admin/billing does not exist
    case "revenue-trend-bar":
      return null;
    // /super-admin/appointments does not exist
    case "appointments-trend-bar":
      return null;
    // /super-admin/audit-logs exists
    case "audit-trend-bar":
      return payload?.date
        ? `/super-admin/audit-logs?date=${payload.date}`
        : "/super-admin/audit-logs";
    // /super-admin/centers/[id] exists; use ?centerId= to highlight in list
    case "center-detail":
      return payload?.centerId
        ? `/super-admin/centers?centerId=${payload.centerId}`
        : null;
    default:
      return null;
  }
}

function InsightList({
  items,
  loading,
  title,
  tone,
  dictionary,
  locale,
  getActionHref,
}: {
  items: SuperAdminAnalyticsInsight[];
  loading: boolean;
  title: string;
  tone: "alert" | "highlight" | "neutral";
  dictionary: Dictionary;
  locale: "ar" | "en" | "he";
  getActionHref?: (item: SuperAdminAnalyticsInsight) => string | null;
}) {
  const styles = {
    alert: {
      container: "border-rose-200 bg-rose-50",
      heading: "text-rose-800",
      item: "border-rose-100 bg-white text-rose-800",
    },
    highlight: {
      container: "border-emerald-200 bg-emerald-50",
      heading: "text-emerald-800",
      item: "border-emerald-100 bg-white text-emerald-800",
    },
    neutral: {
      container: "border-[#E5E7EB] bg-[#F8FAFC]",
      heading: "text-[#0B2D5C]",
      item: "border-[#E5E7EB] bg-white text-[#526176]",
    },
  }[tone];

  return (
    <div className={`min-w-0 rounded-lg border p-4 ${styles.container}`}>
      <h3 className={`text-sm font-semibold ${styles.heading}`}>{title}</h3>
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-sm text-[#66758a]">{dictionary.labels.loading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#66758a]">{dictionary.labels.noData}</p>
        ) : (
          items.slice(0, 3).map((item, index) => {
            const href = getActionHref?.(item) ?? null;
            return (
              <div
                className={`rounded-md border px-3 py-2 text-sm leading-6 ${styles.item}`}
                key={`${item.type}-${item.relatedCenterId ?? "platform"}-${index}`}
              >
                <p>{getInsightMessage(item, locale)}</p>
                {href ? (
                  <Link
                    className="mt-1.5 inline-flex text-xs font-semibold opacity-60 hover:opacity-100"
                    href={href}
                  >
                    {dictionary.actions.view}
                  </Link>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatChartDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

const CHART_BAR_AREA_PX = 72;
const CHART_MIN_BAR_PX = 8;

function TrendChart<T extends { date: string }>({
  data,
  getValue,
  formatValue,
  noDataLabel,
  onBarClick,
}: {
  data: T[];
  getValue: (point: T) => number;
  formatValue: (v: number) => string;
  noDataLabel: string;
  onBarClick?: (date: string) => void;
}) {
  const values = data.map(getValue);
  const max = Math.max(...values, 0);
  const hasData = values.some((v) => v > 0);

  if (!hasData) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[#66758a]">
        {noDataLabel}
      </div>
    );
  }

  const first = data[0];
  const mid = data[Math.floor(data.length / 2)];
  const last = data[data.length - 1];

  return (
    <div className="px-5 pb-4 pt-3">
      {/* max-value label — always right-aligned so it labels the top of the tallest bar */}
      <div className="mb-1 text-right text-[10px] text-[#66758a]">
        {formatValue(max)}
      </div>

      {/* bar area — always dir=ltr so oldest→newest reads left→right in every locale */}
      <div
        className="relative"
        dir="ltr"
        style={{ height: `${CHART_BAR_AREA_PX}px` }}
      >
        {/* baseline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#E5E7EB]" />

        {/* bars */}
        <div className="flex h-full items-end gap-px">
          {data.map((point, i) => {
            const v = values[i] ?? 0;
            const barPx =
              v > 0
                ? Math.max(
                    Math.round((v / max) * CHART_BAR_AREA_PX),
                    CHART_MIN_BAR_PX,
                  )
                : 0;
            return (
              <div
                className={`group relative flex-1 ${onBarClick ? "cursor-pointer" : "cursor-default"}`}
                key={point.date}
                onClick={onBarClick ? () => onBarClick(point.date) : undefined}
                title={`${point.date}: ${formatValue(v)}`}
              >
                {barPx > 0 && (
                  <div
                    className="w-full rounded-t-[2px] bg-[#0B2D5C]/25 transition-colors group-hover:bg-[#C8A45D]/65"
                    style={{ height: `${barPx}px` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* date labels — always dir=ltr so first date is on the left, last on the right */}
      <div
        className="mt-2 flex justify-between text-[10px] text-[#66758a]"
        dir="ltr"
      >
        {first && <span>{formatChartDate(first.date)}</span>}
        {mid && data.length > 2 && <span>{formatChartDate(mid.date)}</span>}
        {last && <span>{formatChartDate(last.date)}</span>}
      </div>
    </div>
  );
}

function CenterBarList<T>({
  items,
  getLabel,
  getValue,
  formatValue,
  noDataLabel,
  onItemClick,
}: {
  items: T[];
  getLabel: (item: T) => string;
  getValue: (item: T) => number;
  formatValue: (v: number) => string;
  noDataLabel: string;
  onItemClick?: (item: T) => void;
}) {
  const visibleItems = items.slice(0, 5);
  const maxValue = Math.max(...visibleItems.map(getValue), 1);

  if (visibleItems.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[#66758a]">
        {noDataLabel}
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E5E7EB]">
      {visibleItems.map((item, i) => {
        const value = getValue(item);
        const widthPct = (value / maxValue) * 100;
        return (
          <div className="px-5 py-3" key={i}>
            <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3">
              {onItemClick ? (
                <button
                  className="min-w-0 truncate text-start text-sm font-medium text-[#0B2D5C] hover:underline"
                  onClick={() => onItemClick(item)}
                  type="button"
                >
                  {getLabel(item)}
                </button>
              ) : (
                <p className="min-w-0 truncate text-sm font-medium text-[#0B2D5C]">
                  {getLabel(item)}
                </p>
              )}
              <p className="shrink-0 text-sm text-[#526176]">
                {formatValue(value)}
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-1.5 rounded-full bg-[#0B2D5C]/35"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 1 : 0;
  }

  return (current - previous) / previous;
}

function mapStatus(status: string | null | undefined): StatusKey {
  const normalized = (status ?? "").toUpperCase();

  if (normalized === "ACTIVE") return "active";
  if (normalized === "ARCHIVED") return "archived";
  if (normalized === "CANCELLED") return "cancelled";
  if (normalized === "PAID") return "paid";
  if (normalized === "PARTIAL") return "partial";
  if (normalized === "PAST_DUE" || normalized === "OVERDUE") return "pastDue";
  if (normalized === "PENDING" || normalized === "TRIALING") return "pending";
  if (normalized === "SUSPENDED") return "suspended";
  if (normalized === "TRIAL") return "trial";
  if (normalized === "VERIFIED") return "verified";
  if (normalized === "FAILED") return "failed";

  return "pending";
}

function getOverviewCardHref(key: OverviewKey) {
  if (key === "totalCenters" || key === "activeCenters") {
    return "/super-admin/centers";
  }

  if (key === "centersNeedingFollowUp") {
    return "/super-admin/centers?lifecycle=NEEDS_SUBSCRIPTION_REVIEW";
  }

  if (key === "totalUsers") {
    return "/super-admin/users";
  }

  if (key === "monthlyRevenue") {
    return "/super-admin/dashboard#analytics";
  }

  return "/super-admin/dashboard";
}

const subscriptionCardHrefs = {
  activeSubscriptions: "/super-admin/subscriptions?lifecycle=ACTIVE",
  cancelled: "/super-admin/subscriptions?lifecycle=CANCELLED",
  expiringSoon: "/super-admin/subscriptions?lifecycle=EXPIRING_SOON",
  expired: "/super-admin/subscriptions?lifecycle=EXPIRED",
  gracePeriod: "/super-admin/subscriptions?lifecycle=EXPIRED_GRACE_PERIOD",
  suspended: "/super-admin/subscriptions?lifecycle=SUSPENDED",
  total: "/super-admin/subscriptions",
  trialing: "/super-admin/subscriptions?lifecycle=TRIALING",
  unknown: "/super-admin/subscriptions?lifecycle=UNKNOWN",
} as const;

function resolveAuditActionLabel(
  entry: { action: string; actionLabel?: string | null; readableActionAr?: string | null },
  locale: string,
): string {
  if (locale === "ar" && entry.readableActionAr) return entry.readableActionAr;
  const auditD =
    superAdminAuditLogsDictionaries[locale as SupportedLocale] ??
    superAdminAuditLogsDictionaries.en;
  const fromDict =
    auditD.actionLabels[entry.action as keyof typeof auditD.actionLabels];
  if (fromDict) return fromDict;
  const fromEn =
    superAdminAuditLogsDictionaries.en.actionLabels[
      entry.action as keyof typeof superAdminAuditLogsDictionaries.en.actionLabels
    ];
  if (fromEn) return fromEn;
  if (entry.actionLabel) return entry.actionLabel;
  return entry.action
    .replace(/[._]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function SuperAdminDashboard() {
  const router = useRouter();
  const { locale } = useLanguage();
  const dictionary = superAdminDashboardDictionaries[locale];
  const [dashboard, setDashboard] =
    useState<SuperAdminAnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getSuperAdminAnalyticsDashboard();

        if (!cancelled) {
          setDashboard(response);
        }
      } catch {
        if (!cancelled) {
          setError(dictionary.labels.loadError);
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [dictionary.labels.loadError]);

  const dashboardData = useMemo(() => {
    const revenueThisMonth = toNumber(dashboard?.billing.revenueThisMonth);
    const revenuePreviousMonth = toNumber(
      dashboard?.billing.revenuePreviousMonth,
    );

    return {
      auditRows: dashboard?.audit.latestAuditLogs ?? [],
      billingRows: [
        {
          amount: dashboard?.billing.totalPaidAmount ?? "0.00",
          count: dashboard?.billing.paidInvoices ?? 0,
          key: "paidInvoices" as BillingKey,
          status: "paid" as StatusKey,
        },
        {
          amount: dashboard?.billing.totalOutstandingAmount ?? "0.00",
          count: dashboard?.billing.pendingInvoices ?? 0,
          key: "pendingInvoices" as BillingKey,
          status: "pending" as StatusKey,
        },
        {
          amount: dashboard?.billing.totalPatientCredit ?? "0.00",
          count: dashboard?.billing.partialInvoices ?? 0,
          key: "partialInvoices" as BillingKey,
          status: "partial" as StatusKey,
        },
      ],
      overviewCards: [
        {
          change: dashboard?.centers.recentlyCreatedCenters ?? 0,
          changeType: "number",
          key: "totalCenters" as OverviewKey,
          value: dashboard?.centers.totalCenters ?? 0,
          valueType: "number",
        },
        {
          change:
            (dashboard?.centers.activeCenters ?? 0) -
            (dashboard?.centers.inactiveCenters ?? 0),
          changeType: "number",
          key: "activeCenters" as OverviewKey,
          value: dashboard?.centers.activeCenters ?? 0,
          valueType: "number",
        },
        {
          change: calculatePercentChange(
            revenueThisMonth,
            revenuePreviousMonth,
          ),
          changeType: "percent",
          key: "monthlyRevenue" as OverviewKey,
          value: revenueThisMonth,
          valueType: "currency",
        },
        {
          change: dashboard?.users.activeUsers ?? 0,
          changeType: "number",
          key: "totalUsers" as OverviewKey,
          value: dashboard?.users.totalUsers ?? 0,
          valueType: "number",
        },
        {
          change: 0,
          changeType: "none" as const,
          key: "centersNeedingFollowUp" as OverviewKey,
          value: dashboard?.subscriptions?.centersAtRisk?.total ?? 0,
          valueType: "number",
        },
      ],
      quickStats: [
        {
          key: "newCenters" as StatKey,
          value: dashboard?.centers.recentlyCreatedCenters ?? 0,
        },
        {
          key: "appointmentsToday" as StatKey,
          value: dashboard?.appointments.todayAppointments ?? 0,
        },
        {
          key: "completedAppointments" as StatKey,
          value: dashboard?.appointments.completedAppointments ?? 0,
        },
        {
          key: "sensitiveActions" as StatKey,
          value: dashboard?.audit.sensitiveActionsCount ?? 0,
        },
      ],
      insights: {
        alerts: dashboard?.insights.alerts ?? [],
        highlights: dashboard?.insights.highlights ?? [],
        recommendations: dashboard?.insights.recommendations ?? [],
      },
      recentCenters: dashboard?.centers.latestCenters ?? [],
      revenueRows: dashboard?.billing.revenueByCenter ?? [],
      subscriptionFinancialCards: [
        {
          key: "totalRevenue" as const,
          value: dashboard?.subscriptionBilling?.totalSubscriptionRevenue ?? "0.00",
          valueType: "currency" as const,
        },
        {
          key: "paidInvoices" as const,
          value: dashboard?.subscriptionBilling?.paidInvoices ?? 0,
          valueType: "number" as const,
        },
        {
          key: "pendingInvoices" as const,
          value: dashboard?.subscriptionBilling?.pendingInvoices ?? 0,
          valueType: "number" as const,
        },
        {
          key: "overdueInvoices" as const,
          value: dashboard?.subscriptionBilling?.overdueInvoices ?? 0,
          valueType: "number" as const,
        },
        {
          key: "mrr" as const,
          value: dashboard?.subscriptionBilling?.mrr ?? "0.00",
          valueType: "currency" as const,
        },
      ],
      subscriptionRevenueByPlan: dashboard?.subscriptionBilling?.revenueByPlan ?? [],
      charts: {
        revenueTrend: dashboard?.charts?.revenueTrend ?? [],
        appointmentsTrend: dashboard?.charts?.appointmentsTrend ?? [],
        topCentersByRevenue: dashboard?.charts?.topCentersByRevenue ?? [],
        topCentersByAppointments: dashboard?.charts?.topCentersByAppointments ?? [],
        auditActivityTrend: dashboard?.charts?.auditActivityTrend ?? [],
      } satisfies SuperAdminAnalyticsCharts,
    };
  }, [dashboard]);

  return (
    <SuperAdminLayout
      activeNav="dashboard"
      dictionary={dictionary}
    >
            {error ? (
              <AdminState className="mb-5 min-h-24" title={error} tone="error" />
            ) : null}

            <SectionShell title={dictionary.sections.smartInsights}>
              <div className="grid min-w-0 grid-cols-1 gap-4 p-5 lg:grid-cols-3">
                <InsightList
                  dictionary={dictionary}
                  getActionHref={(item) =>
                    getInsightActionHref(item.type, item.relatedCenterId ?? undefined)
                  }
                  items={dashboardData.insights.alerts}
                  loading={isLoading}
                  locale={locale}
                  title={dictionary.insights.alerts}
                  tone="alert"
                />
                <InsightList
                  dictionary={dictionary}
                  getActionHref={(item) =>
                    getInsightActionHref(item.type, item.relatedCenterId ?? undefined)
                  }
                  items={dashboardData.insights.highlights}
                  loading={isLoading}
                  locale={locale}
                  title={dictionary.insights.highlights}
                  tone="highlight"
                />
                <InsightList
                  dictionary={dictionary}
                  getActionHref={(item) =>
                    getInsightActionHref(item.type, item.relatedCenterId ?? undefined)
                  }
                  items={dashboardData.insights.recommendations}
                  loading={isLoading}
                  locale={locale}
                  title={dictionary.insights.recommendations}
                  tone="neutral"
                />
              </div>
            </SectionShell>

            <section className="mt-6 grid min-w-0 max-w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardData.overviewCards.map((card) => {
                const value =
                  card.valueType === "currency"
                    ? formatCompactCurrency(card.value, locale)
                    : formatNumber(card.value);
                const change =
                  card.changeType === "percent"
                    ? formatSignedPercent(card.change)
                    : formatSignedNumber(card.change);

                const helperKey = card.key as keyof typeof dictionary.overviewHelper;
                const helperText = dictionary.overviewHelper[helperKey] ?? null;
                const isFollowUpCard = card.key === "centersNeedingFollowUp";
                const cardBorder = isFollowUpCard && !isLoading && card.value > 0
                  ? "border-amber-200 hover:border-amber-300"
                  : "border-[#E5E7EB] hover:border-[#0B2D5C]/30";

                return (
                  <Link
                    className={`block min-w-0 max-w-full cursor-pointer rounded-lg border bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(11,45,92,0.08)] focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/15 ${cardBorder}`}
                    href={getOverviewCardHref(card.key)}
                    key={card.key}
                  >
                    <p className="text-sm font-medium text-[#66758a]">
                      {dictionary.overview[card.key]}
                    </p>
                    {helperText ? (
                      <p className="mt-0.5 text-xs text-[#66758a]/70">
                        {helperText}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                      <p className="min-w-0 text-2xl font-semibold text-[#0B2D5C] sm:text-3xl">
                        {isLoading ? dictionary.labels.loading : value}
                      </p>
                      {card.changeType !== "none" ? (
                        <span className="rounded-md bg-[#C8A45D]/12 px-2 py-1 text-xs font-semibold text-[#7A5C20]">
                          {isLoading ? dictionary.labels.loading : change}
                        </span>
                      ) : null}
                    </div>
                    {isFollowUpCard && !isLoading && dashboard?.subscriptions?.centersAtRisk ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {[
                          { count: dashboard.subscriptions.centersAtRisk.noSubscription, label: dictionary.centersAtRiskBreakdown.noSubscription, cls: "bg-slate-100 text-slate-600" },
                          { count: dashboard.subscriptions.centersAtRisk.expired, label: dictionary.centersAtRiskBreakdown.expired, cls: "bg-rose-50 text-rose-700" },
                          { count: dashboard.subscriptions.centersAtRisk.suspended, label: dictionary.centersAtRiskBreakdown.suspended, cls: "bg-slate-50 text-slate-500" },
                          { count: dashboard.subscriptions.centersAtRisk.gracePeriod, label: dictionary.centersAtRiskBreakdown.gracePeriod, cls: "bg-amber-50 text-amber-700" },
                        ]
                          .filter((p) => p.count > 0)
                          .map((p) => (
                            <span key={p.label} className={`rounded px-1.5 py-0.5 text-xs font-medium ${p.cls}`}>
                              {p.count} {p.label}
                            </span>
                          ))}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </section>

            {/* Platform Usage Metrics */}
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.platformUsage.sectionTitle}
              </h2>
              <div className="grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
                {(
                  [
                    { key: "totalPatients", value: dashboard?.platformUsage?.totalPatients ?? 0, cls: "border-[#0B2D5C]/15 bg-[#0B2D5C]/5 text-[#0B2D5C]" },
                    { key: "totalAppointments", value: dashboard?.platformUsage?.totalAppointments ?? 0, cls: "border-slate-200 bg-white text-[#0B2D5C]" },
                    { key: "appointmentsLast30Days", value: dashboard?.platformUsage?.appointmentsLast30Days ?? 0, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
                    { key: "totalInvoices", value: dashboard?.platformUsage?.totalInvoices ?? 0, cls: "border-slate-200 bg-white text-[#0B2D5C]" },
                  ] as const
                ).map((card) => (
                  <div
                    className={`min-w-0 rounded-lg border px-4 py-3 ${card.cls}`}
                    key={card.key}
                  >
                    <p className="min-w-0 truncate text-xs font-semibold opacity-70">
                      {dictionary.platformUsage[card.key]}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {isLoading ? "—" : formatNumber(card.value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Subscription KPIs */}
            <section className="mt-6">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#0B2D5C]">
                  {dictionary.subscriptions.sectionTitle}
                </h2>
                <Link
                  className="text-xs font-medium text-[#0B2D5C] underline underline-offset-2 transition hover:opacity-70"
                  href="/super-admin/subscriptions"
                >
                  {dictionary.subscriptions.viewAll}
                </Link>
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
                {(
                  [
                    {
                      key: "total" as const,
                      cls: "border-slate-200 bg-white text-[#0B2D5C]",
                    },
                    {
                      key: "activeSubscriptions" as const,
                      cls: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
                    },
                    {
                      key: "trialing" as const,
                      cls: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
                    },
                    {
                      key: "expiringSoon" as const,
                      cls: "border-amber-200 bg-amber-50 text-amber-800",
                    },
                    {
                      key: "gracePeriod" as const,
                      cls: "border-amber-300 bg-amber-50 text-amber-800",
                    },
                    {
                      key: "expired" as const,
                      cls: "border-rose-200 bg-rose-50 text-rose-700",
                    },
                    {
                      key: "suspended" as const,
                      cls: "border-slate-200 bg-slate-50 text-slate-700",
                    },
                    {
                      key: "cancelled" as const,
                      cls: "border-rose-200 bg-rose-50 text-rose-700",
                    },
                    {
                      key: "unknown" as const,
                      cls: "border-slate-300 bg-slate-100 text-slate-700",
                    },
                  ] as const
                )
                  .filter(
                    ({ key }) =>
                      key !== "unknown" ||
                      (dashboard?.subscriptions?.unknownSubscriptions ?? 0) > 0,
                  )
                  .map(({ key, cls }) => {
                  const valueMap: Record<typeof key, number | undefined> = {
                    activeSubscriptions: dashboard?.subscriptions?.activeSubscriptions,
                    cancelled: dashboard?.subscriptions?.cancelledSubscriptions,
                    expiringSoon: dashboard?.subscriptions?.expiringSoonSubscriptions,
                    expired: dashboard?.subscriptions?.expiredSubscriptions,
                    gracePeriod: dashboard?.subscriptions?.gracePeriodSubscriptions,
                    suspended: dashboard?.subscriptions?.suspendedSubscriptions,
                    total: dashboard?.subscriptions?.totalSubscriptions,
                    trialing: dashboard?.subscriptions?.trialingSubscriptions,
                    unknown: dashboard?.subscriptions?.unknownSubscriptions,
                  };
                  return (
                    <Link
                      className={`block min-w-0 cursor-pointer rounded-lg border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(11,45,92,0.08)] focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/15 ${cls}`}
                      href={subscriptionCardHrefs[key]}
                      key={key}
                    >
                      <p className="text-xs font-medium opacity-75">
                        {dictionary.subscriptions[key]}
                      </p>
                      {key === "activeSubscriptions" ? (
                        <p className="mt-0.5 text-[10px] opacity-55">
                          {dictionary.subscriptionHelper.activeSubscriptions}
                        </p>
                      ) : null}
                      <p className="mt-3 text-2xl font-semibold">
                        {isLoading ? "—" : formatNumber(valueMap[key] ?? 0)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#0B2D5C]">
                  {dictionary.sections.subscriptionFinancials}
                </h2>
                <Link
                  className="text-xs font-medium text-[#0B2D5C] underline underline-offset-2 transition hover:opacity-70"
                  href="/super-admin/subscriptions"
                >
                  {dictionary.actions.manage}
                </Link>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {dashboardData.subscriptionFinancialCards.map((card) => (
                  <Link
                    className="block min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#0B2D5C]/30 hover:shadow-[0_16px_36px_rgba(11,45,92,0.08)] focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/15"
                    href="/super-admin/subscriptions"
                    key={card.key}
                  >
                    <p className="text-xs font-medium text-[#66758a]">
                      {dictionary.subscriptionBilling[card.key]}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                      {isLoading
                        ? dictionary.labels.loading
                        : card.valueType === "currency"
                          ? formatCompactCurrency(toNumber(card.value), locale)
                          : formatNumber(card.value)}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h3 className="text-sm font-semibold text-[#0B2D5C]">
                    {dictionary.subscriptionBilling.revenueByPlan}
                  </h3>
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {dashboardData.subscriptionRevenueByPlan.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-[#66758a]">
                      {isLoading ? dictionary.labels.loading : dictionary.labels.noData}
                    </p>
                  ) : (
                    dashboardData.subscriptionRevenueByPlan.map((item) => (
                      <div
                        className="flex min-w-0 flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        key={item.planCode}
                      >
                        <p className="min-w-0 font-medium text-[#0B2D5C]">
                          {item.planName}
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-[#24364f]">
                          {formatCompactCurrency(toNumber(item.amount), locale)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <div
              className="mt-6 grid min-w-0 max-w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]"
              id="analytics"
            >
              <div className="min-w-0 max-w-full space-y-6">
                <SectionShell title={dictionary.sections.quickStats}>
                  <div className="grid min-w-0 grid-cols-1 gap-0 sm:grid-cols-2">
                    {dashboardData.quickStats.map((stat) => (
                      <div
                        className="min-w-0 border-b border-[#E5E7EB] px-5 py-4 odd:sm:border-e"
                        key={stat.key}
                      >
                        <p className="text-sm text-[#66758a]">
                          {dictionary.stats[stat.key]}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[#0B2D5C]">
                          {isLoading
                            ? dictionary.labels.loading
                            : formatNumber(stat.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell
                  action={dictionary.actions.viewAll}
                  actionHref="/super-admin/centers"
                  title={dictionary.sections.recentCenters}
                >
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-sm">
                      <thead className="bg-[#F8FAFC] text-[#66758a]">
                        <tr>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.nav.centers}
                          </th>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.labels.owner}
                          </th>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.labels.plan}
                          </th>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.labels.status}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentCenters.length === 0 ? (
                          <tr className="border-t border-[#E5E7EB]">
                            <td
                              className="px-5 py-6 text-center text-[#66758a]"
                              colSpan={4}
                            >
                              {isLoading
                                ? dictionary.labels.loading
                                : dictionary.labels.noData}
                            </td>
                          </tr>
                        ) : (
                          dashboardData.recentCenters.map((center) => (
                          <tr
                            className="border-t border-[#E5E7EB] transition-colors duration-100 hover:bg-[#F8FAFC]"
                            key={center.id}
                          >
                            <td className="px-5 py-4 font-medium text-[#0B2D5C]">
                              {center.name}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-[#526176]">
                              {center.ownerName ??
                                center.ownerEmail ??
                                dictionary.labels.notAvailable}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-[#526176]">
                              {center.plan ?? dictionary.labels.notAvailable}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge
                                label={dictionary.statuses[mapStatus(center.status)]}
                                status={mapStatus(center.status)}
                              />
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionShell>

                <SectionShell
                  action={dictionary.actions.manage}
                  actionHref="/super-admin/subscriptions"
                  title={dictionary.sections.billingOverview}
                >
                  <div className="divide-y divide-[#E5E7EB]">
                    {dashboardData.billingRows.map((item) => (
                      <div
                        className="grid min-w-0 grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                        key={item.key}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#0B2D5C]">
                            {dictionary.billing[item.key]}
                          </p>
                          <p className="mt-1 text-sm text-[#66758a]">
                            {isLoading
                              ? dictionary.labels.loading
                              : formatNumber(item.count)}{" "}
                            {dictionary.labels.invoices}
                          </p>
                        </div>
                        <p className="text-sm text-[#526176] sm:whitespace-nowrap">
                          {formatCompactCurrency(toNumber(item.amount), locale)}
                        </p>
                        <StatusBadge
                          label={dictionary.statuses[item.status]}
                          status={item.status}
                        />
                      </div>
                    ))}
                  </div>
                </SectionShell>
              </div>

              <div className="min-w-0 max-w-full space-y-6">
                <SectionShell
                  action={dictionary.actions.review}
                  actionHref="/super-admin/centers"
                  title={dictionary.sections.revenueByCenter}
                >
                  <div className="divide-y divide-[#E5E7EB]">
                    {dashboardData.revenueRows.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-[#66758a]">
                        {isLoading
                          ? dictionary.labels.loading
                          : dictionary.labels.noData}
                      </div>
                    ) : (
                      dashboardData.revenueRows.map((item) => (
                      <div className="px-5 py-4" key={item.centerId}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-all font-medium text-[#0B2D5C]">
                              {item.centerName}
                            </p>
                            <p className="mt-1 text-sm text-[#66758a]">
                              {formatCompactCurrency(toNumber(item.amount), locale)}
                            </p>
                          </div>
                          <StatusBadge
                            label={dictionary.statuses.active}
                            status="active"
                          />
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </SectionShell>

                <SectionShell
                  action={dictionary.actions.viewAll}
                  actionHref="/super-admin/audit-logs"
                  title={dictionary.sections.auditActivity}
                >
                  <div className="divide-y divide-[#E5E7EB]">
                    {dashboardData.auditRows.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-[#66758a]">
                        {isLoading
                          ? dictionary.labels.loading
                          : dictionary.labels.noData}
                      </div>
                    ) : (
                      dashboardData.auditRows.slice(0, 5).map((item) => (
                      <div className="px-5 py-4" key={item.id}>
                        <p className="font-medium text-[#0B2D5C]">
                          {resolveAuditActionLabel(item, locale)}
                        </p>
                        <p className="mt-1 text-sm text-[#66758a]">
                          {item.actorName ?? dictionary.labels.notAvailable}
                          {" · "}
                          {formatDate(item.createdAt, locale)}
                        </p>
                      </div>
                      ))
                    )}
                  </div>
                </SectionShell>
              </div>
            </div>

            {/* Charts & Trends */}
            <div className="mt-6 grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionShell title={dictionary.sections.revenueTrend}>
                {isLoading ? (
                  <div className="px-5 py-8 text-center text-sm text-[#66758a]">
                    {dictionary.labels.loading}
                  </div>
                ) : (
                  <TrendChart
                    data={dashboardData.charts.revenueTrend}
                    formatValue={(v) => formatCompactCurrency(v, locale)}
                    getValue={(p) => toNumber(p.amount)}
                    noDataLabel={dictionary.charts.noData}
                  />
                )}
              </SectionShell>

              <SectionShell title={dictionary.sections.appointmentsTrend}>
                {isLoading ? (
                  <div className="px-5 py-8 text-center text-sm text-[#66758a]">
                    {dictionary.labels.loading}
                  </div>
                ) : (
                  <TrendChart
                    data={dashboardData.charts.appointmentsTrend}
                    formatValue={(v) => formatNumber(v)}
                    getValue={(p) => p.count}
                    noDataLabel={dictionary.charts.noData}
                  />
                )}
              </SectionShell>

              <SectionShell title={dictionary.sections.topCentersByRevenue}>
                {isLoading ? (
                  <div className="px-5 py-8 text-center text-sm text-[#66758a]">
                    {dictionary.labels.loading}
                  </div>
                ) : (
                  <CenterBarList
                    formatValue={(v) => formatCompactCurrency(v, locale)}
                    getLabel={(item) => item.centerName}
                    getValue={(item) => toNumber(item.amount)}
                    items={dashboardData.charts.topCentersByRevenue}
                    noDataLabel={dictionary.charts.noData}
                    onItemClick={(item) => {
                      const url = getDrillDownUrl("center-detail", { centerId: item.centerId });
                      if (url) router.push(url);
                    }}
                  />
                )}
              </SectionShell>

              <SectionShell title={dictionary.sections.topCentersByAppointments}>
                {isLoading ? (
                  <div className="px-5 py-8 text-center text-sm text-[#66758a]">
                    {dictionary.labels.loading}
                  </div>
                ) : (
                  <CenterBarList
                    formatValue={(v) => formatNumber(v)}
                    getLabel={(item) => item.centerName}
                    getValue={(item) => item.count}
                    items={dashboardData.charts.topCentersByAppointments}
                    noDataLabel={dictionary.charts.noData}
                    onItemClick={(item) => {
                      const url = getDrillDownUrl("center-detail", { centerId: item.centerId });
                      if (url) router.push(url);
                    }}
                  />
                )}
              </SectionShell>

              <div className="lg:col-span-2">
                <SectionShell title={dictionary.sections.auditActivityTrend}>
                  {isLoading ? (
                    <div className="px-5 py-8 text-center text-sm text-[#66758a]">
                      {dictionary.labels.loading}
                    </div>
                  ) : (
                    <TrendChart
                      data={dashboardData.charts.auditActivityTrend}
                      formatValue={(v) => formatNumber(v)}
                      getValue={(p) => p.count}
                      noDataLabel={dictionary.charts.noData}
                      onBarClick={(date) => {
                        const url = getDrillDownUrl("audit-trend-bar", { date });
                        if (url) router.push(url);
                      }}
                    />
                  )}
                </SectionShell>
              </div>
            </div>
    </SuperAdminLayout>
  );
}
