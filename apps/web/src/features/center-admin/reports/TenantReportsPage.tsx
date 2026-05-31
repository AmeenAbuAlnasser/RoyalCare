"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTenantFinancialReports,
  type ReportPeriod,
  type TenantFinancialReportsResponse,
  type TopPatientEntry,
} from "@/lib/api/tenant-billing";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatNumber } from "@/i18n/formatters";
import type { SupportedLocale } from "@/i18n/locales";
import { AdminState } from "@/components/ui/admin-surfaces";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type VisibleReportPeriod = Exclude<ReportPeriod, "week">;
type CardColor = "emerald" | "blue" | "amber" | "indigo" | "red" | "slate";

const cardColorMap: Record<
  CardColor,
  { card: string; label: string; value: string }
> = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    label: "text-emerald-700",
    value: "text-emerald-950",
  },
  blue: {
    card: "border-blue-200 bg-blue-50",
    label: "text-blue-700",
    value: "text-blue-950",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    label: "text-amber-700",
    value: "text-amber-950",
  },
  indigo: {
    card: "border-indigo-200 bg-indigo-50",
    label: "text-indigo-700",
    value: "text-indigo-950",
  },
  red: {
    card: "border-red-200 bg-red-50",
    label: "text-red-700",
    value: "text-red-950",
  },
  slate: {
    card: "border-slate-200 bg-slate-50",
    label: "text-slate-600",
    value: "text-slate-950",
  },
};

function formatMoney(amount: string, currency: string) {
  const value = Number(amount || 0);
  return `${currency} ${value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getServiceName(
  row: TenantFinancialReportsResponse["charts"]["revenueByService"][number],
  locale: SupportedLocale,
) {
  if (locale === "ar") return row.serviceNameAr || row.serviceNameEn;
  if (locale === "he") return row.serviceNameHe || row.serviceNameEn;
  return row.serviceNameEn || row.serviceNameAr || row.serviceNameHe;
}

function ReportCard({
  color,
  label,
  value,
}: {
  color: CardColor;
  label: string;
  value: string;
}) {
  const cls = cardColorMap[color];
  return (
    <div className={`min-w-0 rounded-lg border p-4 shadow-sm ${cls.card}`}>
      <p className={`text-xs font-bold uppercase ${cls.label}`}>{label}</p>
      <p className={`mt-3 break-words text-2xl font-bold ${cls.value}`} dir="ltr">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[116px] animate-pulse rounded-lg border border-[#E5E7EB] bg-white p-4"
          >
            <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
            <div className="mt-4 h-7 w-32 rounded bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-lg border border-[#E5E7EB] bg-white p-4"
          >
            <div className="h-4 w-40 rounded bg-[#E5E7EB]" />
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-8 rounded bg-[#F3F4F6]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ChartPanel({
  emptyLabel,
  rows,
  title,
}: {
  emptyLabel: string;
  rows: Array<{ key: string; label: string; value: number; valueLabel: string }>;
  title: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 0);

  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-[#0B2D5C]">{title}</h2>
      {rows.length === 0 || max <= 0 ? (
        <p className="mt-4 rounded-lg bg-[#F9FAFB] px-4 py-5 text-sm text-[#6B7280]">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="min-w-0">
              <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-[#374151]">
                  {row.label}
                </span>
                <span className="shrink-0 font-bold text-[#111827]" dir="ltr">
                  {row.valueLabel}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F7]">
                <div
                  className="h-full rounded-full bg-[#0B2D5C]"
                  style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TopPatientsPanel({
  currency,
  emptyLabel,
  patients,
  title,
  totalPaidLabel,
  visitsLabel,
}: {
  currency: string;
  emptyLabel: string;
  patients: TopPatientEntry[];
  title: string;
  totalPaidLabel: string;
  visitsLabel: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-[#0B2D5C]">{title}</h2>
      {patients.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#F9FAFB] px-4 py-5 text-sm text-[#6B7280]">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-4 divide-y divide-[#EEF2F7]">
          {patients.map((patient) => (
            <div
              key={patient.patientId}
              className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex h-8 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF] text-xs font-bold text-[#0B2D5C]">
                #{patient.rank}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {patient.name}
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  {formatNumber(patient.totalVisits)} {visitsLabel}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-sm font-bold text-[#111827]" dir="ltr">
                  {formatMoney(patient.totalPaid, currency)}
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">{totalPaidLabel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function TenantReportsPage() {
  const { locale } = useLanguage();
  const [period, setPeriod] = useState<VisibleReportPeriod>("today");
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");
  const [activePeriod, setActivePeriod] = useState<VisibleReportPeriod>("today");
  const [activeFrom, setActiveFrom] = useState<string | undefined>();
  const [activeTo, setActiveTo] = useState<string | undefined>();
  const [report, setReport] = useState<TenantFinancialReportsResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getTenantFinancialReports({
      period: activePeriod,
      from: activeFrom,
      to: activeTo,
    })
      .then((data) => {
        if (isMounted) setReport(data);
      })
      .catch(() => {
        if (isMounted) {
          setReport(null);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePeriod, activeFrom, activeTo]);

  const canApplyCustom =
    Boolean(pendingFrom) && Boolean(pendingTo) && pendingFrom <= pendingTo;

  const activeRangeLabel = useMemo(() => {
    if (!report) return "";
    if (report.periodStart === report.periodEnd) {
      return formatDate(report.periodStart, locale);
    }
    return `${formatDate(report.periodStart, locale)} - ${formatDate(
      report.periodEnd,
      locale,
    )}`;
  }, [locale, report]);

  function handlePeriodClick(nextPeriod: VisibleReportPeriod) {
    setPeriod(nextPeriod);
    if (nextPeriod === "custom") {
      const defaultDate = todayInputValue();
      const nextFrom = pendingFrom || defaultDate;
      const nextTo = pendingTo || nextFrom;

      setPendingFrom(nextFrom);
      setPendingTo(nextTo);

      if (
        activePeriod === "custom" &&
        activeFrom === nextFrom &&
        activeTo === nextTo
      ) {
        return;
      }

      setIsLoading(true);
      setLoadError(false);
      setActivePeriod("custom");
      setActiveFrom(nextFrom);
      setActiveTo(nextTo);
      return;
    }

    if (
      activePeriod === nextPeriod &&
      activeFrom === undefined &&
      activeTo === undefined
    ) {
      return;
    }
    setIsLoading(true);
    setLoadError(false);
    setActivePeriod(nextPeriod);
    setActiveFrom(undefined);
    setActiveTo(undefined);
  }

  function handleApplyCustom() {
    if (!canApplyCustom) return;
    if (
      activePeriod === "custom" &&
      activeFrom === pendingFrom &&
      activeTo === pendingTo
    ) {
      return;
    }
    setIsLoading(true);
    setLoadError(false);
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
        const statusLabels: Record<string, string> = {
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
        const periodRevenueLabel =
          activePeriod === "today"
            ? d.todayRevenue
            : activePeriod === "month"
              ? d.revenueThisMonth
              : d.revenue;

        const dayRows =
          report?.charts.revenueByDay.map((row) => ({
            key: row.date,
            label: formatDate(row.date, locale),
            value: Number(row.amount),
            valueLabel: formatMoney(row.amount, report.currency),
          })) ?? [];
        const statusRows =
          report?.charts.revenueByPaymentStatus.map((row) => ({
            key: row.status,
            label: statusLabels[row.status] ?? row.status,
            value: Number(row.amount),
            valueLabel: formatMoney(row.amount, report.currency),
          })) ?? [];
        const serviceRows =
          report?.charts.revenueByService.map((row) => ({
            key: row.serviceId,
            label: getServiceName(row, locale),
            value: Number(row.amount),
            valueLabel: formatMoney(row.amount, report.currency),
          })) ?? [];

        return (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["today", "last7days", "month", "custom"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePeriodClick(item)}
                    className={
                      period === item
                        ? "rounded-lg bg-[#0B2D5C] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        : "rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:border-[#0B2D5C] hover:text-[#0B2D5C]"
                    }
                  >
                    {periodLabels[item]}
                  </button>
                ),
              )}
            </div>

            {period === "custom" && (
              <div className="mt-3 grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <label className="min-w-0 text-xs font-semibold text-[#374151]">
                  {d.filterFrom}
                  <input
                    type="date"
                    value={pendingFrom}
                    onChange={(event) => setPendingFrom(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#0B2D5C] focus:outline-none focus:ring-1 focus:ring-[#0B2D5C]"
                    dir="ltr"
                  />
                </label>
                <label className="min-w-0 text-xs font-semibold text-[#374151]">
                  {d.filterTo}
                  <input
                    type="date"
                    value={pendingTo}
                    min={pendingFrom || undefined}
                    onChange={(event) => setPendingTo(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#0B2D5C] focus:outline-none focus:ring-1 focus:ring-[#0B2D5C]"
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

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8] ring-1 ring-[#DBEAFE]">
                {periodLabels[activePeriod]}
              </span>
              {activeRangeLabel && !isLoading && (
                <span className="text-xs text-[#6B7280]" dir="ltr">
                  {activeRangeLabel}
                </span>
              )}
            </div>

            {isLoading && <LoadingState />}

            {!isLoading && loadError && (
              <AdminState className="mt-5" title={d.loadError} tone="error" />
            )}

            {!isLoading && !loadError && report && (
              <>
                <section className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ReportCard
                    color="emerald"
                    label={periodRevenueLabel}
                    value={formatMoney(
                      report.cards.periodRevenue,
                      report.currency,
                    )}
                  />
                  <ReportCard
                    color="indigo"
                    label={d.paidInvoices}
                    value={formatNumber(report.cards.paidInvoices)}
                  />
                  <ReportCard
                    color="amber"
                    label={d.pendingInvoices}
                    value={formatNumber(report.cards.pendingInvoices)}
                  />
                  <ReportCard
                    color="red"
                    label={d.overdueInvoices}
                    value={formatNumber(report.cards.overdueInvoices)}
                  />
                  <ReportCard
                    color="slate"
                    label={d.patientCredit}
                    value={formatMoney(
                      report.cards.totalPatientCredit,
                      report.currency,
                    )}
                  />
                  <ReportCard
                    color="blue"
                    label={d.averageInvoiceValue}
                    value={formatMoney(
                      report.cards.averageInvoiceValue,
                      report.currency,
                    )}
                  />
                </section>

                <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
                  <ChartPanel
                    emptyLabel={d.noChartData}
                    rows={dayRows}
                    title={d.revenueByDay}
                  />
                  <ChartPanel
                    emptyLabel={d.noChartData}
                    rows={statusRows}
                    title={d.revenueByPaymentStatus}
                  />
                  <ChartPanel
                    emptyLabel={d.noChartData}
                    rows={serviceRows}
                    title={d.revenueByService}
                  />
                  <TopPatientsPanel
                    currency={report.currency}
                    emptyLabel={d.topPatientsEmpty}
                    patients={report.charts.topPatientsBySpending}
                    title={d.topPatientsTitle}
                    totalPaidLabel={d.topPatientsTotalPaid}
                    visitsLabel={d.topPatientsVisits}
                  />
                </div>
              </>
            )}
          </>
        );
      }}
    </CenterAdminShell>
  );
}
