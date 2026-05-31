"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatDate, formatNumber } from "@/i18n/formatters";
import {
  getTenantReportsSummary,
  type TenantReportsSummary,
} from "@/lib/api/tenant-billing";
import {
  getTenantDashboardStats,
  type TenantDashboardStats,
} from "@/lib/api/tenant-dashboard";
import { markTenantNotificationRead } from "@/lib/api/tenant-notifications";
import {
  listTenantSubscriptionInvoices,
  submitRenewalRequest,
} from "@/lib/api/tenant-subscription";
import type { SubscriptionInvoice } from "@/lib/api/super-admin-subscriptions";
import type { CenterSession } from "@/lib/api/center-auth";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const tenantSubscriptionBillingText = {
  en: {
    dueDate: "Due date",
    empty: "No subscription invoices yet.",
    invoice: "Invoice",
    status: "Status",
    title: "Subscription invoices",
    total: "Total",
    invoiceStatuses: {
      PAID: "Paid",
      PENDING: "Pending",
      PARTIAL: "Partial",
      OVERDUE: "Overdue",
      CANCELLED: "Cancelled",
    },
  },
  ar: {
    dueDate: "تاريخ الاستحقاق",
    empty: "لا توجد فواتير اشتراك بعد.",
    invoice: "الفاتورة",
    status: "الحالة",
    title: "فواتير الاشتراك",
    total: "الإجمالي",
    invoiceStatuses: {
      PAID: "مدفوعة",
      PENDING: "معلقة",
      PARTIAL: "مدفوعة جزئيًا",
      OVERDUE: "متأخرة",
      CANCELLED: "ملغاة",
    },
  },
  he: {
    dueDate: "תאריך לתשלום",
    empty: "אין עדיין חשבוניות מינוי.",
    invoice: "חשבונית",
    status: "סטטוס",
    title: "חשבוניות מינוי",
    total: "סך הכל",
    invoiceStatuses: {
      PAID: "שולם",
      PENDING: "ממתין",
      PARTIAL: "חלקי",
      OVERDUE: "באיחור",
      CANCELLED: "בוטל",
    },
  },
};

const invoiceStatusColors: Record<string, string> = {
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PARTIAL: "border-indigo-200 bg-indigo-50 text-indigo-700",
  OVERDUE: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
};

function serviceName(
  item: { serviceNameAr: string; serviceNameEn: string; serviceNameHe: string },
  locale: "en" | "ar" | "he",
) {
  if (locale === "ar") return item.serviceNameAr || item.serviceNameEn;
  if (locale === "he") return item.serviceNameHe || item.serviceNameEn;
  return item.serviceNameEn || item.serviceNameAr || item.serviceNameHe;
}

function money(amount: string, currency: string) {
  const value = Number(amount);
  const formatted = Number.isFinite(value) ? value.toFixed(2) : amount;
  return `${formatted} ${currency}`;
}

function SectionTitle({
  subtitle,
  title,
}: {
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-[#0B2D5C]">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-sm leading-6 text-[#66758a]">{subtitle}</p>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <AdminCard className="p-5">
      <p className="text-sm font-medium text-[#66758a]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#0B2D5C]">
        {value === null ? "..." : formatNumber(value)}
      </p>
    </AdminCard>
  );
}

function normalizeWhatsAppPhone(phone: string): string {
  return normalizeForWhatsApp(phone, readWhatsAppDefaultCode());
}

function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!/^\d{7,15}$/.test(normalized)) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

type RenewalStatus = "idle" | "loading" | "success" | "duplicate" | "error";

function RenewalRequestModal({
  dictionary,
  onClose,
}: {
  dictionary: CenterAdminDictionary;
  onClose: () => void;
}) {
  const d = dictionary.subscriptionRenewal;
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<RenewalStatus>("idle");

  async function handleSubmit() {
    setStatus("loading");
    try {
      await submitRenewalRequest({ note: note.trim() || undefined });
      setStatus("success");
    } catch (err) {
      if ((err as { status?: number }).status === 409) {
        setStatus("duplicate");
      } else {
        setStatus("error");
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
        {status === "success" ? (
          <>
            <h2 className="text-base font-semibold text-emerald-700">{d.successTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[#526176]">{d.successBody}</p>
            <div className="mt-5 flex justify-end">
              <button className={buttonClassName("primary", "sm")} onClick={onClose} type="button">
                {dictionary.common.close}
              </button>
            </div>
          </>
        ) : status === "duplicate" ? (
          <>
            <h2 className="text-base font-semibold text-amber-700">{d.duplicateTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[#526176]">{d.duplicateBody}</p>
            <div className="mt-5 flex justify-end">
              <button className={buttonClassName("secondary", "sm")} onClick={onClose} type="button">
                {dictionary.common.close}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-[#0B2D5C]">{d.title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-[#66758a]">{d.subtitle}</p>

            {status === "error" && (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-rose-700">{d.errorTitle}</p>
                <p className="mt-1 text-xs text-rose-600">{d.errorBody}</p>
              </div>
            )}

            <textarea
              className="mt-4 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#24364f] placeholder-[#9BABBF] outline-none focus:border-[#0B2D5C] focus:ring-1 focus:ring-[#0B2D5C]"
              disabled={status === "loading"}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder={d.notePlaceholder}
              rows={3}
              value={note}
            />

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className={buttonClassName("secondary", "sm")}
                disabled={status === "loading"}
                onClick={onClose}
                type="button"
              >
                {d.cancelButton}
              </button>
              <button
                className={buttonClassName("primary", "sm")}
                disabled={status === "loading"}
                onClick={() => void handleSubmit()}
                type="button"
              >
                {status === "loading" ? d.submittingButton : d.submitButton}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SubscriptionBannerActions({
  dictionary,
  isSuspended,
  whatsappUrl,
}: {
  dictionary: CenterAdminDictionary;
  isSuspended: boolean;
  whatsappUrl: string | null;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const d = dictionary.subscriptionBanner;
  const whatsappHref = whatsappUrl ?? "/tenant/notifications";

  return (
    <>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {!isSuspended && (
          <button
            className={buttonClassName("primary", "sm")}
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            {d.renewButton}
          </button>
        )}
        <Link
          className={buttonClassName("success", "sm")}
          href={whatsappHref}
          rel={whatsappUrl ? "noopener noreferrer" : undefined}
          target={whatsappUrl ? "_blank" : undefined}
        >
          {d.contactAdminButton}
        </Link>
      </div>
      {isModalOpen && (
        <RenewalRequestModal
          dictionary={dictionary}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

function SubscriptionBanner({
  dictionary,
  session,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  session: CenterSession;
  stats: TenantDashboardStats | null;
}) {
  const sub = stats?.subscription;
  if (!sub) return null;

  const d = dictionary.subscriptionBanner;
  const days = sub.daysRemaining;
  const accessState = session.subscriptionAccess;
  const isInGracePeriod = accessState?.isInGracePeriod ?? false;
  const graceDaysRemaining = accessState?.graceDaysRemaining ?? null;

  const isSuspended = sub.status === "SUSPENDED";
  const isExpired =
    !isInGracePeriod && (sub.status === "EXPIRED" || (days !== null && days < 0));
  const isToday = !isSuspended && !isExpired && !isInGracePeriod && days === 0;
  const isExpiringSoon =
    !isSuspended && !isExpired && !isInGracePeriod && !isToday && days !== null && days > 0 && days <= 7;

  if (!isSuspended && !isExpired && !isInGracePeriod && !isToday && !isExpiringSoon) return null;

  const isRed = isSuspended || isExpired;
  const bannerText = isSuspended
    ? d.suspendedTitle
    : isInGracePeriod
      ? d.gracePeriodTitle(graceDaysRemaining ?? 0)
      : isExpired
        ? d.expiredTitle
        : isToday
          ? d.expiresTodayTitle
          : d.expiringTitle(days!);

  const centerName = session.center.name;
  const whatsappMessage = isSuspended
    ? d.whatsappSuspendedMessage(centerName)
    : isInGracePeriod
      ? d.whatsappGracePeriodMessage(centerName, graceDaysRemaining ?? 0)
      : isExpired
        ? d.whatsappExpiredMessage(centerName)
        : isToday
          ? d.whatsappExpiringTodayMessage(centerName)
          : d.whatsappExpiringMessage(centerName, days!);

  const supportPhone =
    process.env.NEXT_PUBLIC_ROYALCARE_SUPPORT_WHATSAPP ?? "";
  const whatsappUrl = supportPhone
    ? buildWhatsAppUrl(supportPhone, whatsappMessage)
    : null;

  const bannerColor = isRed
    ? { border: "border-red-200 bg-red-50", icon: "text-red-500", text: "text-red-700", iconChar: "✕" }
    : { border: "border-amber-200 bg-amber-50", icon: "text-amber-500", text: "text-amber-700", iconChar: "⚠" };

  return (
    <section className={`mt-5 min-w-0 rounded-xl border p-4 ${bannerColor.border}`}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-0.5 shrink-0 text-base leading-none ${bannerColor.icon}`}
          >
            {bannerColor.iconChar}
          </span>
          <p className={`min-w-0 break-words text-sm font-semibold leading-5 ${bannerColor.text}`}>
            {bannerText}
          </p>
        </div>
        <SubscriptionBannerActions
          dictionary={dictionary}
          isSuspended={isSuspended}
          whatsappUrl={whatsappUrl}
        />
      </div>
    </section>
  );
}

function DashboardStatsCards({
  dictionary,
  locale,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  locale: Parameters<typeof formatDate>[1];
  stats: TenantDashboardStats | null;
}) {
  return (
    <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {(["patients", "appointments", "services", "staff"] as const).map(
        (key) => (
          <StatCard
            key={key}
            label={dictionary.cards[key]}
            value={stats ? stats[key] : null}
          />
        ),
      )}
      <SubscriptionSummaryCard
        dictionary={dictionary}
        locale={locale}
        stats={stats}
      />
    </section>
  );
}

function getSubscriptionTone(sub: TenantDashboardStats["subscription"]) {
  if (!sub) return "neutral";
  if (sub.status === "SUSPENDED" || sub.status === "CANCELLED") return "red";
  const days = sub.daysRemaining;
  if (sub.status === "EXPIRED" || (days !== null && days < 0)) return "red";
  if (days !== null && days >= 0 && days <= 7) return "amber";
  return "green";
}

function getSubscriptionRemainingText(
  sub: TenantDashboardStats["subscription"],
  dictionary: CenterAdminDictionary,
) {
  const d = dictionary.dashboard.subscription;
  if (!sub) return d.noSubscription;
  if (sub.status === "SUSPENDED") return d.suspended;
  const days = sub.daysRemaining;
  if (days === null) return d.noSubscription;
  if (days > 1) return d.remainingDays(days);
  if (days === 1) return d.oneDayRemaining;
  if (days === 0) return d.expiresToday;
  return d.expiredSince(Math.abs(days));
}

function SubscriptionSummaryCard({
  dictionary,
  locale,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  locale: Parameters<typeof formatDate>[1];
  stats: TenantDashboardStats | null;
}) {
  const sub = stats?.subscription ?? null;
  const d = dictionary.dashboard.subscription;
  const tone = getSubscriptionTone(sub);
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral: "border-[#E5E7EB] bg-white text-[#0B2D5C]",
    red: "border-red-200 bg-red-50 text-red-900",
  };
  const badgeStyles = {
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    neutral: "bg-[#EAF1FA] text-[#0B2D5C]",
    red: "bg-red-100 text-red-800",
  };

  return (
    <article className={`rounded-lg border p-5 ${styles[tone]}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{d.title}</p>
          <p className="mt-3 break-words text-xl font-bold">
            {getSubscriptionRemainingText(sub, dictionary)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[tone]}`}
        >
          {sub?.status ?? d.noSubscription}
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex min-w-0 justify-between gap-3">
          <dt className="text-current/70">{d.plan}</dt>
          <dd className="min-w-0 truncate font-semibold">
            {sub?.planName ?? dictionary.common.notAvailable}
          </dd>
        </div>
        <div className="flex min-w-0 justify-between gap-3">
          <dt className="text-current/70">{d.endDate}</dt>
          <dd className="font-semibold" dir="ltr">
            {sub?.endDate ? formatDate(sub.endDate, locale) : dictionary.common.notAvailable}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function TodayActivity({
  dictionary,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  stats: TenantDashboardStats | null;
}) {
  return (
    <section className="mt-5">
      <SectionTitle title={dictionary.dashboard.todayActivity} />
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={dictionary.dashboard.appointmentsToday}
          value={stats?.todayActivity.appointmentsToday ?? null}
        />
        <StatCard
          label={dictionary.dashboard.upcomingNextTwoHours}
          value={stats?.todayActivity.upcomingNextTwoHours ?? null}
        />
        <StatCard
          label={dictionary.dashboard.noShowToday}
          value={stats?.todayActivity.noShow ?? null}
        />
      </div>
    </section>
  );
}

function RevenueSnapshot({
  dictionary,
  summary,
}: {
  dictionary: CenterAdminDictionary;
  summary: TenantReportsSummary | null;
}) {
  return (
    <section className="mt-5">
      <SectionTitle title={dictionary.dashboard.revenueSnapshot} />
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            {dictionary.reports.todayRevenue}
          </p>
          <p className="mt-3 text-2xl font-bold text-emerald-900" dir="ltr">
            {summary ? money(summary.todayRevenue, summary.currency) : "..."}
          </p>
        </article>
        <article className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-700">
            {dictionary.reports.outstanding}
          </p>
          <p className="mt-3 text-2xl font-bold text-amber-900" dir="ltr">
            {summary ? money(summary.outstanding, summary.currency) : "..."}
          </p>
        </article>
        <article className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-sm font-semibold text-indigo-700">
            {dictionary.reports.patientCredit}
          </p>
          <p className="mt-3 text-2xl font-bold text-indigo-900" dir="ltr">
            {summary ? money(summary.patientCredit, summary.currency) : "..."}
          </p>
        </article>
      </div>
    </section>
  );
}

function QuickActions({
  dictionary,
  session,
}: {
  dictionary: CenterAdminDictionary;
  session: CenterSession;
}) {
  const actions = [
    {
      href: "/tenant/patients",
      label: dictionary.patients.addPatient,
      permission: "patients:create",
    },
    {
      href: "/tenant/appointments/new",
      label: dictionary.appointments.addAppointment,
      permission: "appointments:create",
    },
    {
      href: "/tenant/billing/new",
      label: dictionary.billing.addInvoice,
      permission: "billing:create",
    },
  ].filter((item) => session.permissions.includes(item.permission));

  if (actions.length === 0) return null;

  return (
    <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <SectionTitle title={dictionary.dashboard.quickActions} />
      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        {actions.map((action) => (
          <Link
            className={buttonClassName("primary", "md", "justify-center")}
            href={action.href}
            key={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function SubscriptionInvoicesPanel({
  invoices,
  locale,
}: {
  invoices: SubscriptionInvoice[] | null;
  locale: "en" | "ar" | "he";
}) {
  const text = tenantSubscriptionBillingText[locale];

  return (
    <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <h2 className="text-base font-semibold text-[#0B2D5C]">{text.title}</h2>
      {!invoices ? (
        <p className="mt-4 text-sm font-semibold text-[#66758a]">...</p>
      ) : invoices.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-[#C8A45D] px-4 py-5 text-center text-sm font-semibold text-[#66758a]">
          {text.empty}
        </p>
      ) : (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
          {invoices.map((invoice) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4"
              key={invoice.id}
            >
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#66758a]">
                    {text.invoice}
                  </p>
                  <p className="mt-1 break-words text-sm font-bold text-[#0B2D5C]">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${invoiceStatusColors[invoice.status] ?? "border-[#E5E7EB] bg-white text-[#24364f]"}`}
                >
                  {text.invoiceStatuses[invoice.status as keyof typeof text.invoiceStatuses] ?? invoice.status}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {text.total}
                  </dt>
                  <dd className="mt-1 font-semibold text-[#24364f]" dir="ltr">
                    {invoice.total} {invoice.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {text.dueDate}
                  </dt>
                  <dd className="mt-1 font-semibold text-[#24364f]">
                    {formatDate(invoice.dueDate, locale)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Alerts({
  dictionary,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  stats: TenantDashboardStats | null;
}) {
  const alerts = stats
    ? [
        {
          label: dictionary.dashboard.upcomingAppointmentSoon,
          value: stats.alerts.upcomingSoon,
        },
        {
          label: dictionary.dashboard.patientsWithCredit,
          value: stats.alerts.patientsWithCredit,
        },
        {
          label: dictionary.dashboard.pendingInvoices,
          value: stats.alerts.pendingInvoices,
        },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <SectionTitle title={dictionary.dashboard.alerts} />
      {!stats ? (
        <p className="mt-3 text-sm font-semibold text-[#66758a]">...</p>
      ) : alerts.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {dictionary.dashboard.noAlerts}
        </p>
      ) : (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          {alerts.map((alert) => (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
              key={alert.label}
            >
              <p className="text-sm font-semibold text-amber-900">
                {alert.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-800">
                {formatNumber(alert.value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentActivity({
  dictionary,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  stats: TenantDashboardStats | null;
}) {
  const { locale } = useLanguage();

  return (
    <section className="mt-5 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
        <SectionTitle title={dictionary.dashboard.recentAppointments} />
        <div className="mt-4 space-y-3">
          {!stats ? (
            <p className="text-sm font-semibold text-[#66758a]">...</p>
          ) : stats.recentAppointments.length === 0 ? (
            <p className="text-sm text-[#66758a]">
              {dictionary.appointments.emptyTitle}
            </p>
          ) : (
            stats.recentAppointments.map((item) => (
              <Link
                className="block rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 transition hover:border-[#C8A45D]"
                href={`/tenant/appointments/${item.id}`}
                key={item.id}
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#24364f]">
                      {item.patientName}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#66758a]">
                      {serviceName(item, locale)} · {item.providerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-start sm:text-end">
                    <p className="text-xs font-semibold text-[#0B2D5C]" dir="ltr">
                      {formatDate(item.appointmentDate, locale)} {item.startTime}
                    </p>
                    <p className="mt-1 text-xs text-[#66758a]">
                      {
                        dictionary.appointmentStatuses[
                          item.status as keyof typeof dictionary.appointmentStatuses
                        ]
                      }
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
        <SectionTitle title={dictionary.dashboard.recentInvoices} />
        <div className="mt-4 space-y-3">
          {!stats ? (
            <p className="text-sm font-semibold text-[#66758a]">...</p>
          ) : stats.recentInvoices.length === 0 ? (
            <p className="text-sm text-[#66758a]">
              {dictionary.billing.emptyTitle}
            </p>
          ) : (
            stats.recentInvoices.map((item) => (
              <Link
                className="block rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 transition hover:border-[#C8A45D]"
                href={`/tenant/billing/${item.id}`}
                key={item.id}
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#24364f]">
                      {item.patientName}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#66758a]">
                      {serviceName(item, locale)}
                    </p>
                  </div>
                  <div className="shrink-0 text-start sm:text-end">
                    <p className="text-xs font-semibold text-[#0B2D5C]" dir="ltr">
                      {money(item.amount, item.currency)}
                    </p>
                    <p className="mt-1 text-xs text-[#66758a]">
                      {
                        dictionary.billingStatuses[
                          item.status as keyof typeof dictionary.billingStatuses
                        ]
                      }
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function resolveNotifText(
  json: Record<string, string> | null | undefined,
  locale: string,
): string {
  if (!json) return "";
  return json[locale] ?? json["en"] ?? Object.values(json)[0] ?? "";
}

function NotificationsWidget({
  dictionary,
  stats,
}: {
  dictionary: CenterAdminDictionary;
  stats: TenantDashboardStats | null;
}) {
  const { locale } = useLanguage();
  const d = dictionary.notifications;
  const [localStats, setLocalStats] = useState(stats);

  useEffect(() => {
    const timer = window.setTimeout(() => setLocalStats(stats), 0);
    return () => window.clearTimeout(timer);
  }, [stats]);

  if (!localStats) return null;

  const { unreadCount, latest } = localStats.notifications;
  const unreadItems = latest.filter((n) => !n.isRead);

  if (unreadCount === 0 && unreadItems.length === 0) return null;

  async function handleRead(id: string) {
    try {
      await markTenantNotificationRead(id);
      setLocalStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: {
            unreadCount: Math.max(0, prev.notifications.unreadCount - 1),
            latest: prev.notifications.latest.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          },
        };
      });
    } catch {
      // silent — user can retry from notifications page
    }
  }

  return (
    <section className="mt-5 min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="text-base font-semibold text-[#0B2D5C]">
            {d.widgetTitle}
          </h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {d.unreadCount(unreadCount)}
            </span>
          )}
        </div>
        <Link
          className="text-xs font-semibold text-[#0B2D5C] underline-offset-2 hover:underline"
          href="/tenant/notifications"
        >
          {d.viewAll}
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {unreadItems.length === 0 ? (
          <p className="text-sm text-[#66758a]">{d.widgetNoUnread}</p>
        ) : (
          unreadItems.slice(0, 3).map((n) => {
            const isExpired = n.type === "SUBSCRIPTION_EXPIRED";
            const isExpiring = n.type === "SUBSCRIPTION_EXPIRING";
            const title =
              resolveNotifText(n.title, locale) ||
              (isExpired
                ? d.typeExpired
                : isExpiring
                  ? d.typeExpiring
                  : n.type ?? "Notification");
            const body = resolveNotifText(n.body, locale);

            return (
              <div
                className={`flex min-w-0 flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-start sm:justify-between ${
                  isExpired
                    ? "border-rose-200 bg-rose-50"
                    : isExpiring
                      ? "border-amber-200 bg-amber-50"
                      : "border-[#E5E7EB] bg-[#F8FAFC]"
                }`}
                key={n.id}
              >
                <div className="min-w-0">
                  <p
                    className={`break-words text-sm font-semibold ${isExpired ? "text-rose-800" : isExpiring ? "text-amber-800" : "text-[#0B2D5C]"}`}
                  >
                    {title}
                  </p>
                  {body && (
                    <p
                      className={`mt-1 break-words text-xs leading-5 ${isExpired ? "text-rose-700" : isExpiring ? "text-amber-700" : "text-[#526176]"}`}
                    >
                      {body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-[#66758a]">
                    {formatDate(n.createdAt, locale)}
                  </p>
                </div>
                <button
                  className={buttonClassName("secondary", "sm", "shrink-0")}
                  onClick={() => void handleRead(n.id)}
                  type="button"
                >
                  {d.markAsRead}
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function DashboardData({
  dictionary,
  session,
}: {
  dictionary: CenterAdminDictionary;
  session: CenterSession;
}) {
  const { locale } = useLanguage();
  const [stats, setStats] = useState<TenantDashboardStats | null>(null);
  const [subscriptionInvoices, setSubscriptionInvoices] = useState<
    SubscriptionInvoice[] | null
  >(null);
  const [summary, setSummary] = useState<TenantReportsSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [summaryStatus, setSummaryStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    let isMounted = true;

    getTenantDashboardStats()
      .then((response) => {
        if (!isMounted) return;
        setStats(response);
        setStatus("success");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    getTenantReportsSummary({ period: "today" })
      .then((response) => {
        if (!isMounted) return;
        setSummary(response);
        setSummaryStatus("success");
      })
      .catch(() => {
        if (!isMounted) return;
        setSummaryStatus("error");
      });

    listTenantSubscriptionInvoices({ pageSize: 6 })
      .then((response) => {
        if (!isMounted) return;
        setSubscriptionInvoices(response.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setSubscriptionInvoices([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "error") {
    return (
      <AdminState
        className="mt-5"
        title={dictionary.dashboard.loadError}
        tone="error"
      />
    );
  }

  return (
    <>
      <SubscriptionBanner dictionary={dictionary} session={session} stats={stats} />
      <NotificationsWidget dictionary={dictionary} stats={stats} />
      <DashboardStatsCards dictionary={dictionary} locale={locale} stats={stats} />
      <TodayActivity dictionary={dictionary} stats={stats} />
      <QuickActions dictionary={dictionary} session={session} />
      {summaryStatus === "error" ? (
        <AdminState
          className="mt-5"
          title={dictionary.reports.loadError}
          tone="error"
        />
      ) : (
        <RevenueSnapshot dictionary={dictionary} summary={summary} />
      )}
      <SubscriptionInvoicesPanel
        invoices={subscriptionInvoices}
        locale={locale}
      />
      <Alerts dictionary={dictionary} stats={stats} />
      <RecentActivity dictionary={dictionary} stats={stats} />
    </>
  );
}

export function CenterDashboardPage() {
  return (
    <CenterAdminShell
      activeNav="dashboard"
      subtitle={(dictionary) => dictionary.dashboard.subtitle}
      title={(dictionary) => dictionary.dashboard.title}
    >
      {({ dictionary, session }) => (
        <>
          <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-medium text-[#66758a]">
                {dictionary.dashboard.currentUser}
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-[#24364f]">
                {session.user.fullName}
              </p>
            </article>
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-medium text-[#66758a]">
                {dictionary.dashboard.role}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#24364f]">
                {dictionary.roles[session.role.key]}
              </p>
            </article>
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-medium text-[#66758a]">
                {dictionary.dashboard.centerStatus}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#24364f]">
                {dictionary.statuses[session.center.status]}
              </p>
            </article>
          </section>

          <DashboardData dictionary={dictionary} session={session} />
        </>
      )}
    </CenterAdminShell>
  );
}
