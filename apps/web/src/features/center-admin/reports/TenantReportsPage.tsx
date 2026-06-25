"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createTenantInvoiceFromAppointment,
  getTenantFinancialReports,
  type ReceivableDetail,
  type ReceivablePaymentStatus,
  type ReportPeriod,
  type TenantFinancialReportsResponse,
} from "@/lib/api/tenant-billing";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatNumber, formatTime12h } from "@/i18n/formatters";
import type { SupportedLocale } from "@/i18n/locales";
import { AdminState } from "@/components/ui/admin-surfaces";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type VisibleReportPeriod = Exclude<ReportPeriod, "week">;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(amount: string | number, currency: string) {
  const value = Number(amount || 0);
  return `${currency} ${value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(value: string, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function getServiceName(
  row: TenantFinancialReportsResponse["charts"]["revenueByService"][number],
  locale: SupportedLocale,
) {
  if (locale === "ar") return row.serviceNameAr || row.serviceNameEn || row.serviceNameHe;
  if (locale === "he") return row.serviceNameHe || row.serviceNameEn || row.serviceNameAr;
  return row.serviceNameEn || row.serviceNameAr || row.serviceNameHe;
}

function receivableStatusClass(status: ReceivablePaymentStatus) {
  if (status === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "PARTIAL") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "OVERDUE") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

// ─── Reusable UI components ───────────────────────────────────────────────────

type KpiTone = "blue" | "emerald" | "sky" | "red" | "amber" | "violet" | "slate";

const kpiColors: Record<KpiTone, { card: string; icon: string; label: string; value: string }> = {
  blue:    { card: "bg-[#F0F7FF] border-blue-200",    icon: "text-blue-500",   label: "text-blue-700",   value: "text-blue-950" },
  emerald: { card: "bg-[#F0FDF4] border-emerald-200", icon: "text-emerald-500",label: "text-emerald-700",value: "text-emerald-950" },
  sky:     { card: "bg-[#F0F9FF] border-sky-200",     icon: "text-sky-500",    label: "text-sky-700",    value: "text-sky-950" },
  red:     { card: "bg-[#FEF2F2] border-red-200",     icon: "text-red-500",    label: "text-red-700",    value: "text-red-950" },
  amber:   { card: "bg-[#FFFBEB] border-amber-200",   icon: "text-amber-500",  label: "text-amber-700",  value: "text-amber-950" },
  violet:  { card: "bg-[#F5F3FF] border-violet-200",  icon: "text-violet-500", label: "text-violet-700", value: "text-violet-950" },
  slate:   { card: "bg-[#F8FAFC] border-slate-200",   icon: "text-slate-500",  label: "text-slate-600",  value: "text-slate-950" },
};

function KpiCard({
  label,
  value,
  tone,
  icon,
  sub,
  emphasis = "normal",
}: {
  label: string;
  value: string | number;
  tone: KpiTone;
  icon: React.ReactNode;
  sub?: string;
  emphasis?: "normal" | "primary";
}) {
  const c = kpiColors[tone];
  return (
    <div className={`min-w-0 rounded-xl border ${emphasis === "primary" ? "p-5 shadow-sm" : "p-4"} ${c.card}`}>
      <div className={`mb-3 flex ${emphasis === "primary" ? "h-10 w-10" : "h-8 w-8"} items-center justify-center rounded-lg bg-white/70 ${c.icon}`}>
        {icon}
      </div>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${c.label}`}>{label}</p>
      <p className={`mt-1 break-words ${emphasis === "primary" ? "text-3xl" : "text-2xl"} font-black leading-tight ${c.value}`} dir="ltr">
        {value}
      </p>
      {sub ? <p className={`mt-1 text-xs ${c.label} opacity-70`}>{sub}</p> : null}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="mb-4 flex min-w-0 items-center gap-3">
      <h2 className="text-base font-black text-[#0B2D5C]">{title}</h2>
      {badge ? (
        <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-semibold text-[#1D4ED8] ring-1 ring-[#DBEAFE]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function MetricStrip({
  items,
  columns = "default",
}: {
  items: Array<{ label: string; value: string | number; tone?: KpiTone }>;
  columns?: "default" | "five";
}) {
  return (
    <div className={`grid min-w-0 grid-cols-2 gap-3 ${columns === "five" ? "md:grid-cols-3 xl:grid-cols-5" : "sm:grid-cols-4"}`}>
      {items.map((item) => {
        const tone = item.tone ?? "slate";
        const c = kpiColors[tone];
        return (
          <div key={item.label} className={`min-w-0 rounded-lg border p-3 ${c.card}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wide ${c.label}`}>{item.label}</p>
            <p className={`mt-1 break-words text-lg font-black ${c.value}`} dir="ltr">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function EmptyChip({ label }: { label: string }) {
  return (
    <p className="rounded-lg bg-[#F9FAFB] px-4 py-6 text-center text-sm font-medium text-[#6B7280]">{label}</p>
  );
}

function AnalysisCard({
  action,
  children,
  subtitle,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[#EEF2F7] px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[#0B2D5C]">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs leading-5 text-[#6B7280]">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function HorizontalBars({
  emptyLabel,
  rows,
  tone = "emerald",
}: {
  emptyLabel: string;
  rows: Array<{ key: string; label: string; value: number; valueLabel: string }>;
  tone?: "emerald" | "blue" | "amber" | "red";
}) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  const barClass = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
  }[tone];

  if (rows.length === 0 || max <= 0) return <EmptyChip label={emptyLabel} />;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="min-w-0">
          <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-[#374151]">{row.label}</span>
            <span className="shrink-0 font-bold text-[#111827]" dir="ltr">{row.valueLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F7]">
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReceivablesTable({
  currency,
  emptyLabel,
  rows,
  statusLabels,
  text,
  locale,
}: {
  currency: string;
  emptyLabel: string;
  rows: ReceivableDetail[];
  statusLabels: Record<ReceivablePaymentStatus, string>;
  text: Record<string, string>;
  locale: SupportedLocale;
}) {
  return (
    <div className="mt-3 min-w-0 overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      {rows.length === 0 ? (
        <p className="m-4 rounded-lg bg-[#F9FAFB] px-4 py-5 text-sm text-[#6B7280]">{emptyLabel}</p>
      ) : (
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[#F8FAFC] text-xs font-bold uppercase text-[#64748B]">
            <tr>
              <th className="px-4 py-3 text-start">{text.patient}</th>
              <th className="px-4 py-3 text-start">{text.phone}</th>
              <th className="px-4 py-3 text-start">{text.service}</th>
              <th className="px-4 py-3 text-end">{text.invoiceTotal}</th>
              <th className="px-4 py-3 text-end">{text.paidAmount}</th>
              <th className="px-4 py-3 text-end">{text.remainingAmount}</th>
              <th className="px-4 py-3 text-start">{text.paymentStatus}</th>
              <th className="px-4 py-3 text-start">{text.lastPayment}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {rows.map((row) => (
              <tr key={row.invoiceId} className="align-top hover:bg-[#F8FBFF]">
                <td className="px-4 py-3 font-semibold text-[#111827]">{row.patientName}</td>
                <td className="px-4 py-3 text-[#4B5563]" dir="ltr">{row.patientPhone}</td>
                <td className="max-w-[200px] px-4 py-3 text-[#374151]">
                  <span className="line-clamp-2">{row.serviceName || text.notRecorded}</span>
                </td>
                <td className="px-4 py-3 text-end font-semibold text-[#111827]" dir="ltr">
                  {formatMoney(row.totalAmount, currency)}
                </td>
                <td className="px-4 py-3 text-end text-[#047857]" dir="ltr">
                  {formatMoney(row.paidAmount, currency)}
                </td>
                <td className="px-4 py-3 text-end font-bold text-[#B42318]" dir="ltr">
                  {formatMoney(row.remainingAmount, currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${receivableStatusClass(row.paymentStatus)}`}>
                    {statusLabels[row.paymentStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#4B5563]">
                  {row.lastPaymentDate ? formatDate(row.lastPaymentDate, locale) : text.notRecorded}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="mt-5 space-y-6">
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]" />
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
        ))}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS = {
  calendar:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  check:     "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  clock:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  alert:     "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  money:     "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  debt:      "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  patient:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  plan:      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  chart:     "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  receipt:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TenantReportsPage() {
  const { locale } = useLanguage();
  const [period, setPeriod] = useState<VisibleReportPeriod>("today");
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");
  const [activePeriod, setActivePeriod] = useState<VisibleReportPeriod>("today");
  const [activeFrom, setActiveFrom] = useState<string | undefined>();
  const [activeTo, setActiveTo] = useState<string | undefined>();
  const [showFullReceivables, setShowFullReceivables] = useState(false);
  const [showUnbilledDetails, setShowUnbilledDetails] = useState(false);
  const [allUnbilledMode, setAllUnbilledMode] = useState(false);
  const [creatingUnbilledInvoiceId, setCreatingUnbilledInvoiceId] = useState<string | null>(null);
  const [report, setReport] = useState<TenantFinancialReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(false);
    getTenantFinancialReports({
      period: activePeriod,
      from: activeFrom,
      to: activeTo,
      allUnbilled: allUnbilledMode || undefined,
    })
      .then((data) => { if (isMounted) setReport(data); })
      .catch(() => { if (isMounted) { setReport(null); setLoadError(true); } })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [activePeriod, activeFrom, activeTo, allUnbilledMode]);

  const canApplyCustom =
    Boolean(pendingFrom) && Boolean(pendingTo) && pendingFrom <= pendingTo;

  const activeRangeLabel = useMemo(() => {
    if (!report) return "";
    const startDate = report.reportMeta?.startDate ?? report.periodStart;
    const endDate = report.reportMeta?.endDate ?? report.periodEnd;
    if (startDate === endDate) return formatDate(startDate, locale);
    return `${formatShortDate(startDate, locale)} → ${formatShortDate(endDate, locale)}`;
  }, [locale, report]);

  function handlePeriodClick(nextPeriod: VisibleReportPeriod) {
    setPeriod(nextPeriod);
    if (nextPeriod === "custom") {
      const defaultDate = todayInputValue();
      const nextFrom = pendingFrom || defaultDate;
      const nextTo = pendingTo || nextFrom;
      setPendingFrom(nextFrom);
      setPendingTo(nextTo);
      if (activePeriod === "custom" && activeFrom === nextFrom && activeTo === nextTo) return;
      setActivePeriod("custom");
      setActiveFrom(nextFrom);
      setActiveTo(nextTo);
      return;
    }
    if (activePeriod === nextPeriod && activeFrom === undefined && activeTo === undefined) return;
    setActivePeriod(nextPeriod);
    setActiveFrom(undefined);
    setActiveTo(undefined);
  }

  function handleApplyCustom() {
    if (!canApplyCustom) return;
    if (activePeriod === "custom" && activeFrom === pendingFrom && activeTo === pendingTo) return;
    setActivePeriod("custom");
    setActiveFrom(pendingFrom);
    setActiveTo(pendingTo);
  }

  return (
    <CenterAdminShell
      activeNav="reports"
      requiredPermission="reports:view"
      subtitle={(dictionary) => dictionary.reports.subtitle}
      title={(dictionary) => dictionary.reports.title}
    >
      {({ dictionary }) => {
        const d = dictionary.reports;
        const statusLabels: Record<ReceivablePaymentStatus, string> = {
          PAID: d.statusPaid,
          PENDING: d.statusPending,
          PARTIAL: d.statusPartial,
          OVERDUE: d.statusOverdue,
        };
        const periodLabels: Record<VisibleReportPeriod, string> = {
          today: d.periodToday,
          last7days: d.periodLast7Days,
          month: d.periodMonth,
          custom: d.periodCustom,
        };

        const reportCurrency = report?.currency ?? "ILS";
        const ops = report?.operational;
        const apptAnalytics = report?.appointmentAnalytics;
        const summary = report?.summary;

        const periodRevenue = summary?.revenue ?? report?.cards.periodRevenue ?? "0.00";
        const totalReceivables = summary?.totalReceivables ?? report?.cards.totalReceivables ?? "0.00";
        const patientsWithDebt = summary?.patientsWithBalanceCount ?? report?.cards.patientsWithDebt ?? 0;
        const overdueCount = summary?.overdueInvoicesCount ?? report?.cards.overdueInvoices ?? 0;
        const highestDebt = summary?.highestDebt ?? report?.cards.highestDebt ?? "0.00";
        const unpaidInvoices = summary?.unpaidInvoicesCount ?? report?.cards.unpaidInvoices ?? 0;
        const partialInvoices = summary?.partiallyPaidInvoicesCount ?? report?.cards.partiallyPaidInvoices ?? 0;
        const paidInvoices = summary?.paidInvoicesCount ?? report?.cards.paidInvoices ?? 0;

        const serviceRows = (report?.charts.revenueByService ?? [])
          .filter((row) => Number(row.amount) > 0)
          .slice(0, 10);
        const allDebtRows = report?.receivables?.details ?? [];
        const top5Debtors = allDebtRows.slice(0, 5);

        const unbilledRows = ops?.completedWithoutInvoice ?? [];
        const unbilledCount = ops?.completedWithoutInvoiceCount ?? 0;

        function getUnbilledServiceName(row: (typeof unbilledRows)[number]) {
          if (locale === "ar") return row.serviceNameAr || row.serviceNameEn || row.serviceNameHe || "—";
          if (locale === "he") return row.serviceNameHe || row.serviceNameEn || row.serviceNameAr || "—";
          return row.serviceNameEn || row.serviceNameAr || row.serviceNameHe || "—";
        }

        async function handleCreateInvoiceFromReport(appointmentId: string) {
          setCreatingUnbilledInvoiceId(appointmentId);
          try {
            await createTenantInvoiceFromAppointment(appointmentId);
            const updated = await getTenantFinancialReports({ period: activePeriod, from: activeFrom, to: activeTo });
            setReport(updated);
          } catch {
            // invoice creation errors are surfaced in the appointments page;
            // here we just stop the spinner so the user can retry
          } finally {
            setCreatingUnbilledInvoiceId(null);
          }
        }

        const revenueByStatus = report?.charts.revenueByPaymentStatus ?? [];
        const revenueStatusMap = Object.fromEntries(
          revenueByStatus.map((row) => [row.status, row.amount]),
        );

        const periodRevenueLabel =
          activePeriod === "today" ? d.todayRevenue
          : activePeriod === "month" ? d.revenueThisMonth
          : d.revenue;

        return (
          <>
            {/* ── Period filter ── */}
            <div className="mt-5 rounded-xl border border-[#DDE7F3] bg-white/95 p-3 shadow-sm">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(["today", "last7days", "month", "custom"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePeriodClick(item)}
                      className={
                        period === item
                          ? "rounded-lg bg-[#0B2D5C] px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
                          : "rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2 text-sm font-medium text-[#374151] transition-colors hover:border-[#0B2D5C] hover:text-[#0B2D5C]"
                      }
                    >
                      {periodLabels[item]}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#64748B]">{d.selectedDateRange}</span>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8] ring-1 ring-[#DBEAFE]">
                    {periodLabels[activePeriod]}
                  </span>
                  {activeRangeLabel && !isLoading ? (
                    <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#475569] ring-1 ring-[#E2E8F0]" dir="ltr">
                      {activeRangeLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              {period === "custom" && (
                <div className="mt-3 grid gap-3 border-t border-[#EEF2F7] pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                  <label className="min-w-0 text-xs font-semibold text-[#374151]">
                    {d.filterFrom}
                    <input
                      type="date"
                      value={pendingFrom}
                      onChange={(e) => setPendingFrom(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#0B2D5C] focus:outline-none"
                      dir="ltr"
                    />
                  </label>
                  <label className="min-w-0 text-xs font-semibold text-[#374151]">
                    {d.filterTo}
                    <input
                      type="date"
                      value={pendingTo}
                      min={pendingFrom || undefined}
                      onChange={(e) => setPendingTo(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#0B2D5C] focus:outline-none"
                      dir="ltr"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!canApplyCustom}
                    onClick={handleApplyCustom}
                    className={
                      canApplyCustom
                        ? "rounded-lg bg-[#0B2D5C] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0d3570]"
                        : "cursor-not-allowed rounded-lg bg-[#E5E7EB] px-5 py-2 text-sm font-semibold text-[#9CA3AF]"
                    }
                  >
                    {d.applyFilter}
                  </button>
                </div>
              )}
            </div>

            {isLoading && <LoadingDashboard />}

            {!isLoading && loadError && (
              <AdminState className="mt-5" title={d.loadError} tone="error" />
            )}

            {!isLoading && !loadError && report && (
              <>
                {/* ══ Executive overview ═══════════════════════════════════════ */}
                <section className="mt-6">
                  <SectionHeader title={d.todayOverviewTitle} />
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                      tone="emerald"
                      label={periodRevenueLabel}
                      value={formatMoney(periodRevenue, reportCurrency)}
                      icon={<Icon path={ICONS.money} />}
                      emphasis="primary"
                    />
                    <KpiCard
                      tone="blue"
                      label={d.totalInPeriod}
                      value={formatNumber(apptAnalytics?.totalInPeriod ?? ops?.appointmentsTodayTotal ?? 0)}
                      icon={<Icon path={ICONS.calendar} />}
                      emphasis="primary"
                    />
                    <KpiCard
                      tone={ops?.delayedFollowUps ? "red" : "slate"}
                      label={d.delayedFollowUps}
                      value={formatNumber(ops?.delayedFollowUps ?? 0)}
                      icon={<Icon path={ICONS.alert} />}
                      emphasis="primary"
                    />
                    <KpiCard
                      tone={Number(totalReceivables) > 0 ? "red" : "slate"}
                      label={d.totalReceivables}
                      value={formatMoney(totalReceivables, reportCurrency)}
                      icon={<Icon path={ICONS.debt} />}
                      emphasis="primary"
                    />
                  </div>

                  <div className="mt-3">
                    <MetricStrip
                      columns="five"
                      items={[
                        { label: d.appointmentsTodayCompleted, value: formatNumber(ops?.appointmentsTodayCompleted ?? 0), tone: "emerald" },
                        { label: d.appointmentsTodayUpcoming, value: formatNumber(ops?.appointmentsTodayUpcoming ?? 0), tone: "blue" },
                        { label: d.newPatientsThisMonth, value: formatNumber(ops?.newPatientsThisMonth ?? 0), tone: "blue" },
                        { label: d.completedWithoutInvoiceTitle, value: formatNumber(unbilledCount), tone: unbilledCount > 0 ? "amber" : "slate" },
                        { label: d.activeTreatmentPlans, value: formatNumber(ops?.activeTreatmentPlans ?? 0), tone: "violet" },
                      ]}
                    />
                  </div>

                  {/* Alert banner + controls for unbilled completed sessions */}
                  {unbilledCount > 0 && (
                    <div className="mt-4 min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.alert} />
                          </svg>
                          <p className="min-w-0 text-sm font-semibold text-amber-800">
                            {d.completedWithoutInvoiceAlert(unbilledCount)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowUnbilledDetails((v) => !v)}
                            className="rounded-lg bg-[#0B2D5C] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#103A72]"
                          >
                            {showUnbilledDetails ? d.hideFullReceivables : d.viewSessions}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAllUnbilledMode((v) => !v); setShowUnbilledDetails(true); }}
                            className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                          >
                            {allUnbilledMode ? d.showPeriodUnbilled : d.showAllUnbilled}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unbilled detail table */}
                  {showUnbilledDetails && (
                    <div className="mt-3 min-w-0 overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-sm">
                      {unbilledRows.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-[#6B7280]">{d.completedWithoutInvoiceEmpty}</p>
                      ) : (
                        <table className="w-full min-w-[640px] text-sm">
                          <thead>
                            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-[#6B7280]">{dictionary.appointments.patient}</th>
                              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-[#6B7280]">{dictionary.appointments.service}</th>
                              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-[#6B7280]">{dictionary.appointments.provider}</th>
                              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-[#6B7280]">{dictionary.appointments.appointmentDate}</th>
                              <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-[#6B7280]">{dictionary.common.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F3F4F6]">
                            {unbilledRows.map((row) => (
                              <tr key={row.id} className="transition-colors hover:bg-[#FAFAFA]">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-[#111827]">{row.patientName}</p>
                                  <p className="text-xs text-[#6B7280]">{row.patientPhone}</p>
                                </td>
                                <td className="px-4 py-3 text-[#374151]">{getUnbilledServiceName(row)}</td>
                                <td className="px-4 py-3 text-[#374151]">{row.providerName ?? "—"}</td>
                                <td className="px-4 py-3 text-[#374151]" dir="ltr">
                                  {formatDate(row.appointmentDate, locale)}
                                  {row.startTime ? ` - ${formatTime12h(row.startTime)}` : ""}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      disabled={creatingUnbilledInvoiceId === row.id}
                                      onClick={() => handleCreateInvoiceFromReport(row.id)}
                                      className="rounded-lg bg-[#0B2D5C] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a3f7a] disabled:opacity-50"
                                    >
                                      {creatingUnbilledInvoiceId === row.id ? "..." : dictionary.appointments.createInvoice}
                                    </button>
                                    <Link
                                      href={`/tenant/appointments/${row.id}`}
                                      className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] transition-colors hover:border-[#0B2D5C] hover:text-[#0B2D5C]"
                                    >
                                      {dictionary.common.view}
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </section>

                {/* ══ Analysis cards ═══════════════════════════════════════════ */}
                <div className="mt-8 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
                  <AnalysisCard
                    subtitle={periodLabels[activePeriod]}
                    title={d.revenueInsightsTitle}
                  >
                    <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
                        {d.revenueByPaymentStatus}
                      </h3>
                      <span className="text-xs text-[#6B7280]">
                        {d.invoiceCountIncluded}:{" "}
                        <span className="font-bold text-[#0B2D5C]">
                          {formatNumber(report.reportMeta?.invoiceCountIncluded ?? summary?.invoiceCountIncluded ?? 0)}
                        </span>
                      </span>
                    </div>
                    <HorizontalBars
                      emptyLabel={d.noChartData}
                      rows={[
                        { key: "paid", label: d.statusPaid, value: Number(revenueStatusMap.PAID ?? 0), valueLabel: formatMoney(revenueStatusMap.PAID ?? "0", reportCurrency) },
                        { key: "partial", label: d.statusPartial, value: Number(revenueStatusMap.PARTIAL ?? 0), valueLabel: formatMoney(revenueStatusMap.PARTIAL ?? "0", reportCurrency) },
                        { key: "pending", label: d.statusPending, value: Number(revenueStatusMap.PENDING ?? 0), valueLabel: formatMoney(revenueStatusMap.PENDING ?? "0", reportCurrency) },
                        { key: "overdue", label: d.statusOverdue, value: Number(revenueStatusMap.OVERDUE ?? 0), valueLabel: formatMoney(revenueStatusMap.OVERDUE ?? "0", reportCurrency) },
                      ]}
                    />
                  </AnalysisCard>

                  <AnalysisCard
                    action={(
                      <Link
                        href="/tenant/billing"
                        className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#0B2D5C] hover:text-[#0B2D5C]"
                      >
                        {dictionary.nav.billing}
                      </Link>
                    )}
                    subtitle={d.receivablesSectionHelper}
                    title={d.receivablesSectionTitle}
                  >
                    <MetricStrip
                      items={[
                        { label: d.totalReceivables, value: formatMoney(totalReceivables, reportCurrency), tone: Number(totalReceivables) > 0 ? "red" : "slate" },
                        { label: d.patientsWithDebt, value: formatNumber(patientsWithDebt), tone: patientsWithDebt > 0 ? "amber" : "slate" },
                        { label: d.unpaidInvoices, value: formatNumber(unpaidInvoices), tone: unpaidInvoices > 0 ? "amber" : "slate" },
                        { label: d.highestDebt, value: formatMoney(highestDebt, reportCurrency), tone: Number(highestDebt) > 0 ? "red" : "slate" },
                      ]}
                    />

                    {top5Debtors.length > 0 ? (
                      <div className="mt-4 divide-y divide-[#EEF2F7] rounded-lg border border-[#EEF2F7]">
                        {top5Debtors.map((row, i) => (
                          <div key={row.invoiceId} className="flex min-w-0 items-center gap-3 px-3 py-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-black text-red-700">
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#111827]">{row.patientName}</p>
                              <p className="text-xs text-[#6B7280]" dir="ltr">{row.patientPhone}</p>
                            </div>
                            <div className="shrink-0 text-end">
                              <p className="text-sm font-bold text-[#B42318]" dir="ltr">
                                {formatMoney(row.remainingAmount, reportCurrency)}
                              </p>
                              <span className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${receivableStatusClass(row.paymentStatus)}`}>
                                {statusLabels[row.paymentStatus]}
                              </span>
                            </div>
                          </div>
                        ))}
                        {allDebtRows.length > 5 ? (
                          <div className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setShowFullReceivables((v) => !v)}
                              className="text-sm font-semibold text-[#0B2D5C] hover:underline"
                            >
                              {showFullReceivables
                                ? d.hideFullReceivables
                                : `${d.viewFullReceivables} (${allDebtRows.length})`}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <EmptyChip label={d.noChartData} />
                      </div>
                    )}
                  </AnalysisCard>

                  <AnalysisCard
                    subtitle={periodLabels[activePeriod]}
                    title={d.appointmentAnalyticsTitle}
                  >
                    <MetricStrip
                      items={[
                        { label: d.totalInPeriod, value: formatNumber(apptAnalytics?.totalInPeriod ?? 0), tone: "blue" },
                        { label: dictionary.appointmentStatuses.COMPLETED, value: formatNumber(apptAnalytics?.completedInPeriod ?? 0), tone: "emerald" },
                        { label: dictionary.appointmentStatuses.CANCELLED, value: formatNumber(apptAnalytics?.cancelledInPeriod ?? 0), tone: apptAnalytics?.cancelledInPeriod ? "red" : "slate" },
                        { label: d.noShowCount, value: formatNumber(apptAnalytics?.noShowInPeriod ?? 0), tone: apptAnalytics?.noShowInPeriod ? "red" : "slate" },
                      ]}
                    />
                    <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
                      {[
                        { label: d.cancellationRate, value: `${apptAnalytics?.cancellationRatePct ?? 0}%`, tone: (apptAnalytics?.cancellationRatePct ?? 0) > 20 ? "red" : "slate" as KpiTone },
                        { label: d.noShowRate, value: `${apptAnalytics?.noShowRatePct ?? 0}%`, tone: (apptAnalytics?.noShowRatePct ?? 0) > 15 ? "amber" : "slate" as KpiTone },
                      ].map((item) => {
                        const c = kpiColors[item.tone];
                        return (
                          <div key={item.label} className={`min-w-0 rounded-lg border p-3 ${c.card}`}>
                            <p className={`text-[11px] font-bold uppercase tracking-wide ${c.label}`}>{item.label}</p>
                            <p className={`mt-1 text-2xl font-black ${c.value}`} dir="ltr">{item.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </AnalysisCard>

                  <AnalysisCard title={d.revenueByService}>
                    <HorizontalBars
                      emptyLabel={d.noChartData}
                      rows={serviceRows.map((row) => ({
                        key: row.serviceId,
                        label: getServiceName(row, locale),
                        value: Number(row.amount),
                        valueLabel: formatMoney(row.amount, reportCurrency),
                      }))}
                    />
                  </AnalysisCard>

                  <AnalysisCard title={d.topProvidersTitle}>
                    {apptAnalytics?.topProviders && apptAnalytics.topProviders.length > 0 ? (
                      <HorizontalBars
                        emptyLabel={d.noChartData}
                        rows={apptAnalytics.topProviders.map((provider) => ({
                          key: provider.userId,
                          label: provider.name,
                          value: provider.count,
                          valueLabel: formatNumber(provider.count),
                        }))}
                        tone="blue"
                      />
                    ) : (
                      <EmptyChip label={d.noChartData} />
                    )}
                  </AnalysisCard>

                  <AnalysisCard title={dictionary.nav.billing}>
                    <MetricStrip
                      items={[
                        { label: d.paidInvoices, value: formatNumber(paidInvoices), tone: "emerald" },
                        { label: d.partiallyPaidInvoices, value: formatNumber(partialInvoices), tone: partialInvoices > 0 ? "amber" : "slate" },
                        { label: d.pendingInvoices, value: formatNumber(unpaidInvoices), tone: unpaidInvoices > 0 ? "amber" : "slate" },
                        { label: d.overdueInvoices, value: formatNumber(overdueCount), tone: overdueCount > 0 ? "red" : "slate" },
                      ]}
                    />
                    <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { label: d.averageInvoiceValue, value: formatMoney(report.cards.averageInvoiceValue, reportCurrency), tone: "blue" as KpiTone },
                        { label: d.patientCredit, value: formatMoney(report.cards.totalPatientCredit, reportCurrency), tone: "blue" as KpiTone },
                      ].map((item) => {
                        const c = kpiColors[item.tone];
                        return (
                          <div key={item.label} className={`min-w-0 rounded-lg border p-3 ${c.card}`}>
                            <p className={`text-[11px] font-bold uppercase tracking-wide ${c.label}`}>{item.label}</p>
                            <p className={`mt-1 break-words text-lg font-black ${c.value}`} dir="ltr">{item.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </AnalysisCard>
                </div>

                {showFullReceivables && allDebtRows.length > 5 ? (
                  <ReceivablesTable
                    currency={reportCurrency}
                    emptyLabel={d.noChartData}
                    locale={locale}
                    rows={allDebtRows}
                    statusLabels={statusLabels}
                    text={d as unknown as Record<string, string>}
                  />
                ) : null}
              </>
            )}
          </>
        );
      }}
    </CenterAdminShell>
  );
}
