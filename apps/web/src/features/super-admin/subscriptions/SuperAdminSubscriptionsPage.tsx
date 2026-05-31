"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import {
  SuperAdminActionMenu,
  type SuperAdminActionMenuItem,
} from "@/features/super-admin/components/SuperAdminActionMenu";
import { WhatsAppModal } from "@/features/super-admin/components/WhatsAppModal";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import { formatDate } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminSubscriptionsDictionaries } from "@/i18n/dictionaries/super-admin-subscriptions";
import {
  listSuperAdminSubscriptions,
  logSubscriptionManualWhatsAppAction,
  getSubscriptionLifecycleJobStatus,
  cancelSubscriptionInvoice,
  createSubscriptionInvoice,
  downloadSubscriptionInvoicePdf,
  listSubscriptionInvoices,
  runSubscriptionLifecycleJob,
  markSubscriptionInvoicePaid,
  updateCenterSubscription,
  type ApiSubscriptionLifecycle,
  type ApiSubscriptionStatus,
  type ApiSupportedLanguage,
  type ManualSubscriptionPlan,
  type SubscriptionInvoice,
  type SubscriptionInvoiceStatus,
  type SubscriptionLifecycleJobStatus,
  type SuperAdminSubscription,
} from "@/lib/api/super-admin-subscriptions";
import { getCentersAtRisk, type CentersAtRisk } from "@/lib/api/super-admin-analytics";
import { notifySuperAdminNotificationsUpdated } from "@/lib/api/super-admin-notifications";
import {
  getSubscriptionActionAvailability,
  type SubscriptionLifecycleResult,
} from "@/lib/subscription-status";
import { resolveWhatsAppPhone } from "@/lib/whatsapp";

type Dictionary = (typeof superAdminSubscriptionsDictionaries)["en"];
type StatusFilter =
  | ApiSubscriptionLifecycle
  | "ALL"
  | "MISSING_PHONE";

type SubscriptionInvoiceFormState = {
  amount: string;
  currency: string;
  discount: string;
  dueDate: string;
  notes: string;
  paymentMethod: string;
  status: SubscriptionInvoiceStatus;
  subscriptionId: string;
  tax: string;
};

const subscriptionBillingText = {
  en: {
    amount: "Amount",
    cancel: "Cancel",
    cancelled: "Cancelled",
    center: "Center",
    create: "Create invoice",
    currency: "Currency",
    discount: "Discount",
    downloadPdf: "Download PDF",
    dueDate: "Due date",
    empty: "No subscription invoices found.",
    invoiceNumber: "Invoice",
    markPaid: "Mark paid",
    notes: "Notes",
    paid: "Paid",
    paymentMethod: "Payment method",
    search: "Search invoices or centers",
    status: "Status",
    subscription: "Subscription",
    tax: "Tax",
    title: "Subscription Billing",
    total: "Total",
    saveSuccess: "Subscription invoice saved.",
    actionSuccess: "Subscription invoice updated.",
    downloadSuccess: "Subscription invoice PDF downloaded.",
  },
  ar: {
    amount: "المبلغ",
    cancel: "إلغاء",
    cancelled: "ملغى",
    center: "المركز",
    create: "إنشاء فاتورة",
    currency: "العملة",
    discount: "الخصم",
    dueDate: "تاريخ الاستحقاق",
    empty: "لا توجد فواتير اشتراك.",
    invoiceNumber: "الفاتورة",
    markPaid: "تحديد كمدفوعة",
    notes: "ملاحظات",
    paid: "مدفوعة",
    paymentMethod: "طريقة الدفع",
    search: "ابحث في الفواتير أو المراكز",
    status: "الحالة",
    subscription: "الاشتراك",
    tax: "الضريبة",
    title: "فوترة الاشتراكات",
    total: "الإجمالي",
    saveSuccess: "تم حفظ فاتورة الاشتراك.",
    actionSuccess: "تم تحديث فاتورة الاشتراك.",
  },
  he: {
    amount: "סכום",
    cancel: "ביטול",
    cancelled: "בוטל",
    center: "מרכז",
    create: "צור חשבונית",
    currency: "מטבע",
    discount: "הנחה",
    dueDate: "תאריך לתשלום",
    empty: "לא נמצאו חשבוניות מינוי.",
    invoiceNumber: "חשבונית",
    markPaid: "סמן כשולם",
    notes: "הערות",
    paid: "שולם",
    paymentMethod: "אמצעי תשלום",
    search: "חיפוש חשבוניות או מרכזים",
    status: "סטטוס",
    subscription: "מינוי",
    tax: "מס",
    title: "חיוב מינויים",
    total: "סהכ",
    saveSuccess: "חשבונית המינוי נשמרה.",
    actionSuccess: "חשבונית המינוי עודכנה.",
  },
} satisfies Record<SupportedLocale, Record<string, string>>;

const invoicePdfText = {
  en: {
    download: "Download PDF",
    success: "Subscription invoice PDF downloaded.",
  },
  ar: {
    download: "تحميل PDF",
    success: "تم تحميل ملف PDF للفاتورة.",
  },
  he: {
    download: "הורד PDF",
    success: "קובץ PDF של החשבונית הורד.",
  },
} satisfies Record<SupportedLocale, { download: string; success: string }>;

const subscriptionInvoiceStatuses: Array<SubscriptionInvoiceStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "PENDING",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

function defaultSubscriptionInvoiceForm(): SubscriptionInvoiceFormState {
  return {
    amount: "",
    currency: "ILS",
    discount: "0",
    dueDate: "",
    notes: "",
    paymentMethod: "",
    status: "PENDING",
    subscriptionId: "",
    tax: "0",
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getLifecycle(sub: SuperAdminSubscription) {
  return {
    color: sub.color ?? "neutral",
    daysRemaining: sub.daysRemaining ?? null,
    graceDaysRemaining: null,
    isExpired: sub.lifecycle === "EXPIRED",
    isExpiringSoon: sub.lifecycle === "EXPIRING_SOON",
    isInGracePeriod: sub.lifecycle === "EXPIRED_GRACE_PERIOD",
    label: sub.label ?? sub.lifecycle,
    lifecycle: sub.lifecycle,
    normalizedLifecycle: sub.normalizedLifecycle ?? sub.lifecycle,
  } satisfies SubscriptionLifecycleResult;
}

function getLifecycleBadgeClass(lifecycle: SubscriptionLifecycleResult): string {
  if (lifecycle.color === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (lifecycle.color === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (lifecycle.color === "muted" || lifecycle.color === "neutral") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getLifecycleStatusLabel(
  lifecycle: SubscriptionLifecycleResult,
  d: Dictionary,
): string {
  const labels: Record<string, string> = {
    ACTIVE: d.statuses.active,
    CANCELLED: d.statuses.cancelled,
    EXPIRED: d.statuses.expired,
    EXPIRING_SOON: d.statuses.expiringSoon,
    SUSPENDED: d.statuses.suspended,
    TRIALING: d.statuses.trialing,
    UNKNOWN: lifecycle.label,
  };

  return labels[lifecycle.lifecycle] ?? lifecycle.label;
}

function getLifecycleDaysLabel(
  lifecycle: SubscriptionLifecycleResult,
  d: Dictionary,
): string {
  if (lifecycle.lifecycle === "SUSPENDED" || lifecycle.lifecycle === "CANCELLED") {
    return getLifecycleStatusLabel(lifecycle, d);
  }

  if (lifecycle.daysRemaining === null) {
    return "-";
  }

  if (lifecycle.lifecycle === "EXPIRED") {
    if (lifecycle.daysRemaining === 0) return d.lifecycle.expiredToday;
    return d.lifecycle.expiredDaysAgo(Math.abs(lifecycle.daysRemaining));
  }

  if (lifecycle.daysRemaining === 0) return d.lifecycle.expiresToday;
  return d.lifecycle.expiresIn(lifecycle.daysRemaining);
}

function getRowHighlight(sub: SuperAdminSubscription): string {
  const lifecycle = getLifecycle(sub);

  if (
    lifecycle.lifecycle === "EXPIRED" ||
    lifecycle.lifecycle === "SUSPENDED" ||
    lifecycle.lifecycle === "CANCELLED"
  ) {
    return "bg-rose-50/40";
  }
  if (lifecycle.lifecycle === "EXPIRING_SOON") return "bg-amber-50/40";
  return "";
}

function getIsExpired(sub: SuperAdminSubscription) {
  return getLifecycle(sub).isExpired;
}

function getIsExpiringSoon(sub: SuperAdminSubscription) {
  return getLifecycle(sub).isExpiringSoon;
}

function hasTextValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getSubscriptionWhatsAppPhone(sub: SuperAdminSubscription): string | null {
  return resolveWhatsAppPhone({
    notificationPhone: sub.notificationPhone,
    centerPhone:
      sub.centerPhone ??
      sub.ownerPhone ??
      sub.center.owner?.phone ??
      null,
  });
}

function isSubscriptionMissingWhatsAppPhone(sub: SuperAdminSubscription): boolean {
  return ![
    sub.notificationPhone,
    sub.centerPhone,
    sub.ownerPhone,
    sub.center.owner?.phone,
  ].some(hasTextValue);
}

function matchesSubscriptionFilterValue(
  sub: SuperAdminSubscription,
  filter: StatusFilter,
): boolean {
  if (filter === "ALL") return true;
  if (filter === "MISSING_PHONE") return isSubscriptionMissingWhatsAppPhone(sub);
  return sub.lifecycle === filter;
}

function getStatusFilterFromUrl(): StatusFilter {
  const params = new URLSearchParams(window.location.search);
  const lifecycle = params.get("lifecycle")?.trim().toUpperCase();

  if (
    lifecycle === "ACTIVE" ||
    lifecycle === "TRIALING" ||
    lifecycle === "EXPIRING_SOON" ||
    lifecycle === "EXPIRED" ||
    lifecycle === "SUSPENDED" ||
    lifecycle === "CANCELLED" ||
    lifecycle === "UNKNOWN"
  ) {
    return lifecycle;
  }

  return "ALL";
}

function getDaysLabel(sub: SuperAdminSubscription, d: Dictionary): string {
  return getLifecycleDaysLabel(getLifecycle(sub), d);
}

function formatSubscriptionDate(value: string | null, locale: SupportedLocale) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return formatDate(value, locale);
}

function formatJobDate(value: string | null | undefined, locale: SupportedLocale) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return `${formatDate(value, locale)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return value.slice(0, 10);
}

// Maps DB subscription statuses to manual API statuses accepted by the backend.
function toManualStatus(dbStatus: ApiSubscriptionStatus): string {
  if (dbStatus === "TRIALING") return "TRIAL";
  if (dbStatus === "PAST_DUE") return "OVERDUE";
  return dbStatus;
}

// Returns a YYYY-MM-DD string for the API, or undefined if the value is empty/invalid.
function normalizeDateForApi(value: string): string | undefined {
  if (!value || !value.trim()) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

function toApiDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getRenewalWindow() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  return {
    endDate: toApiDate(end),
    startDate: toApiDate(start),
  };
}

const ALLOWED_MANUAL_PLANS: ManualSubscriptionPlan[] = [
  "BASIC",
  "STANDARD",
  "PREMIUM",
  "ENTERPRISE",
];

// Maps any planCode from the backend to a valid ManualSubscriptionPlan.
// Unknown/legacy codes (e.g. "TRIAL", "starter") default to "BASIC".
function toManualPlan(planCode: string): ManualSubscriptionPlan {
  const upper = planCode.trim().toUpperCase() as ManualSubscriptionPlan;
  return ALLOWED_MANUAL_PLANS.includes(upper) ? upper : "BASIC";
}

// ── sub-components ───────────────────────────────────────────────────────────

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function DetailPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-[#0B2D5C]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
    </svg>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

type EditModalProps = {
  dictionary: Dictionary;
  isRtl: boolean;
  onClose: () => void;
  onSaved: () => void;
  subscription: SuperAdminSubscription;
};

function EditSubscriptionModal({ dictionary, isRtl, onClose, onSaved, subscription }: EditModalProps) {
  const d = dictionary.editModal;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(toManualStatus(subscription.status));
  const [plan, setPlan] = useState<ManualSubscriptionPlan>(toManualPlan(subscription.planCode));
  const [startDate, setStartDate] = useState(toDateInputValue(subscription.currentPeriodStart));
  const [endDate, setEndDate] = useState(toDateInputValue(subscription.currentPeriodEnd));
  const [notes, setNotes] = useState(subscription.billingNotes ?? "");
  const [notifPhone, setNotifPhone] = useState(subscription.notificationPhone ?? "");
  const [notifLang, setNotifLang] = useState<ApiSupportedLanguage | "">(
    subscription.notificationLanguage ?? "",
  );

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    setError(null);

    const normalizedStartDate = normalizeDateForApi(startDate);
    const normalizedEndDate = normalizeDateForApi(endDate);

    if (normalizedStartDate && normalizedEndDate && normalizedEndDate < normalizedStartDate) {
      setError(d.dateOrderError);
      return;
    }

    setSaving(true);
    try {
      await updateCenterSubscription(subscription.centerId, {
        subscriptionStatus: status as "TRIAL" | "ACTIVE" | "EXPIRED" | "OVERDUE" | "SUSPENDED" | "CANCELLED",
        subscriptionPlan: plan,
        subscriptionStartDate: normalizedStartDate,
        subscriptionEndDate: normalizedEndDate,
        subscriptionNotes: notes || undefined,
        notificationPhone: notifPhone.trim() || undefined,
        notificationLanguage: notifLang || undefined,
      });
      notifySuperAdminNotificationsUpdated();
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.errorMessage);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "mt-1.5 h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/12";
  const labelCls = "block text-sm font-medium text-[#24364f]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      ref={overlayRef}
    >
      <div className="w-full max-w-xl rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#0B2D5C]">{d.title}</h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#66758a] transition hover:bg-[#F1F5F9] hover:text-[#0B2D5C]"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <p className={labelCls}>{d.centerLabel}</p>
            <p className="mt-1.5 text-sm font-semibold text-[#0B2D5C]">{subscription.center.name}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{d.statusLabel}</label>
              <select className={inputCls} onChange={(e) => setStatus(e.target.value)} value={status}>
                <option value="TRIAL">{dictionary.statuses.trial}</option>
                <option value="ACTIVE">{dictionary.statuses.active}</option>
                <option value="SUSPENDED">{dictionary.statuses.suspended}</option>
                <option value="EXPIRED">{dictionary.statuses.expired}</option>
                <option value="CANCELLED">{dictionary.statuses.cancelled}</option>
                <option value="OVERDUE">{dictionary.statuses.overdue}</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>{d.planLabel}</label>
              <select
                className={inputCls}
                onChange={(e) => setPlan(e.target.value as ManualSubscriptionPlan)}
                value={plan}
              >
                {ALLOWED_MANUAL_PLANS.map((p) => (
                  <option key={p} value={p}>
                    {dictionary.plans[p.toLowerCase() as keyof typeof dictionary.plans]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>{d.startDateLabel}</label>
              <input
                className={inputCls}
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                value={startDate}
              />
            </div>

            <div>
              <label className={labelCls}>{d.endDateLabel}</label>
              <input
                className={inputCls}
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                value={endDate}
              />
            </div>

            <div>
              <label className={labelCls}>{d.notificationPhoneLabel}</label>
              <input
                className={inputCls}
                onChange={(e) => setNotifPhone(e.target.value)}
                placeholder={d.notificationPhonePlaceholder}
                type="tel"
                value={notifPhone}
              />
            </div>

            <div>
              <label className={labelCls}>{d.notificationLanguageLabel}</label>
              <select
                className={inputCls}
                onChange={(e) => setNotifLang(e.target.value as ApiSupportedLanguage | "")}
                value={notifLang}
              >
                <option value="">—</option>
                <option value="AR">{dictionary.languages.ar}</option>
                <option value="EN">{dictionary.languages.en}</option>
                <option value="HE">{dictionary.languages.he}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{d.notesLabel}</label>
            <textarea
              className="mt-1.5 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/12"
              onChange={(e) => setNotes(e.target.value)}
              placeholder={d.notesPlaceholder}
              rows={3}
              value={notes}
            />
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
          <button
            className="h-10 rounded-md border border-[#E5E7EB] px-5 text-sm font-medium text-[#526176] transition hover:bg-[#F1F5F9]"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            {d.cancel}
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-[#0B2D5C] px-5 text-sm font-semibold text-white transition hover:bg-[#0a2550] disabled:opacity-60"
            disabled={saving}
            onClick={handleSave}
            type="button"
          >
            {saving && <Spinner />}
            {saving ? d.saving : d.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SuperAdminSubscriptionsPage() {
  const { locale, direction } = useLanguage();
  const isRtl = direction === "rtl";
  const dictionary = superAdminSubscriptionsDictionaries[locale];
  const automationDictionary =
    dictionary.automation ?? superAdminSubscriptionsDictionaries.en.automation!;

  const [subscriptions, setSubscriptions] = useState<SuperAdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [jobStatus, setJobStatus] = useState<SubscriptionLifecycleJobStatus | null>(null);
  const [jobStatusError, setJobStatusError] = useState<string | null>(null);
  const [expiringWithin7Count, setExpiringWithin7Count] = useState(0);
  const [jobRunning, setJobRunning] = useState(false);
  const [subscriptionInvoices, setSubscriptionInvoices] = useState<SubscriptionInvoice[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<SubscriptionInvoiceStatus | "ALL">("ALL");
  const [invoiceForm, setInvoiceForm] = useState<SubscriptionInvoiceFormState>(
    defaultSubscriptionInvoiceForm,
  );
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceActionId, setInvoiceActionId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [centerIdFilter, setCenterIdFilter] = useState<string>("");

  const [centersAtRisk, setCentersAtRisk] = useState<CentersAtRisk | null>(null);

  const [editTarget, setEditTarget] = useState<SuperAdminSubscription | null>(null);
  const [whatsAppSub, setWhatsAppSub] = useState<SuperAdminSubscription | null>(null);
  const [openDesktopActions, setOpenDesktopActions] = useState<string | null>(null);
  const [openMobileActions, setOpenMobileActions] = useState<string | null>(null);
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadJobStatus = useCallback(async () => {
    try {
      const [status, expiring] = await Promise.all([
        getSubscriptionLifecycleJobStatus(),
        listSuperAdminSubscriptions({
          lifecycle: "EXPIRING_SOON",
          pageSize: 1,
        }),
      ]);
      setJobStatus(status);
      setExpiringWithin7Count(expiring.pagination.total);
      setJobStatusError(null);
    } catch (err) {
      setJobStatusError(
        err instanceof Error ? err.message : automationDictionary.loadError,
      );
    }
  }, [automationDictionary.loadError]);

  const loadSubscriptions = useCallback(
    async (searchTerm: string, filter: StatusFilter) => {
      setLoading(true);
      setLoadError(null);
      try {
        const params: Parameters<typeof listSuperAdminSubscriptions>[0] = {
          pageSize: 100,
        };
        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (centerIdFilter.trim()) params.centerId = centerIdFilter.trim();
        if (filter === "MISSING_PHONE") {
          params.missingPhone = true;
        } else if (filter !== "ALL") {
          params.lifecycle = filter;
        }
        const result = await listSuperAdminSubscriptions(params);
        const rows = result.data.filter((sub) =>
          matchesSubscriptionFilterValue(sub, filter),
        );
        setSubscriptions(rows);
        setTotal(filter === "ALL" ? result.pagination.total : rows.length);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : dictionary.loadingState.error);
      } finally {
        setLoading(false);
      }
    },
    [dictionary.loadingState.error, centerIdFilter],
  );

  const loadInvoices = useCallback(async () => {
    setInvoiceLoading(true);
    try {
      const result = await listSubscriptionInvoices({
        pageSize: 50,
        search: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter,
      });
      setSubscriptionInvoices(result.data);
    } finally {
      setInvoiceLoading(false);
    }
  }, [invoiceSearch, invoiceStatusFilter]);

  // Read URL filters on mount (client-only, no Suspense needed)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("centerId") ?? "";
      if (cid) setCenterIdFilter(cid);
      setStatusFilter(getStatusFilterFromUrl());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubscriptions(search, statusFilter);
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, centerIdFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobStatus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadJobStatus]);

  useEffect(() => {
    void getCentersAtRisk().then(setCentersAtRisk).catch(() => null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvoices();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadInvoices]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadSubscriptions(value, statusFilter);
    }, 400);
  }

  function buildWhatsAppMessage(sub: SuperAdminSubscription): string {
    if (getIsExpired(sub)) {
      return dictionary.whatsapp.expiredMessage(sub.center.name);
    }
    const days = Math.max(0, getLifecycle(sub).daysRemaining ?? 0);
    return dictionary.whatsapp.expiringMessage(sub.center.name, days);
  }

  function getWhatsAppPhone(sub: SuperAdminSubscription): string | null {
    return getSubscriptionWhatsAppPhone(sub);
  }

  async function handleRenewSubscription(sub: SuperAdminSubscription) {
    const actionId = `${sub.id}:renew`;
    const { endDate, startDate } = getRenewalWindow();
    setRowActionLoading(actionId);
    setActionMessage(null);

    try {
      await updateCenterSubscription(sub.centerId, {
        subscriptionEndDate: endDate,
        subscriptionStartDate: startDate,
        subscriptionStatus: "ACTIVE",
      });
      notifySuperAdminNotificationsUpdated();
      setActionMessage({ tone: "success", text: dictionary.values.renewSuccess });
      await loadSubscriptions(search, statusFilter);
    } catch (err) {
      setActionMessage({
        tone: "error",
        text: err instanceof Error ? err.message : dictionary.values.actionError,
      });
    } finally {
      setRowActionLoading(null);
    }
  }

  async function handleSuspendSubscription(sub: SuperAdminSubscription) {
    const actionId = `${sub.id}:suspend`;
    setRowActionLoading(actionId);
    setActionMessage(null);

    try {
      await updateCenterSubscription(sub.centerId, {
        subscriptionStatus: "SUSPENDED",
      });
      notifySuperAdminNotificationsUpdated();
      setActionMessage({ tone: "success", text: dictionary.values.suspendSuccess });
      await loadSubscriptions(search, statusFilter);
    } catch (err) {
      setActionMessage({
        tone: "error",
        text: err instanceof Error ? err.message : dictionary.values.actionError,
      });
    } finally {
      setRowActionLoading(null);
    }
  }

  async function handleRunLifecycleJob() {
    if (jobRunning) return;
    setJobRunning(true);
    setActionMessage(null);

    try {
      await runSubscriptionLifecycleJob();
      setActionMessage({
        tone: "success",
        text: automationDictionary.runSuccess,
      });
      await Promise.all([loadJobStatus(), loadSubscriptions(search, statusFilter)]);
    } catch (err) {
      setActionMessage({
        tone: "error",
        text:
          err instanceof Error ? err.message : automationDictionary.runError,
      });
    } finally {
      setJobRunning(false);
    }
  }

  async function handleCreateInvoice() {
    if (!invoiceForm.subscriptionId || !invoiceForm.amount || !invoiceForm.dueDate) {
      return;
    }
    const subscription = subscriptions.find(
      (item) => item.id === invoiceForm.subscriptionId,
    );
    if (!subscription) return;

    setInvoiceSaving(true);
    setActionMessage(null);
    try {
      await createSubscriptionInvoice({
        amount: invoiceForm.amount,
        centerId: subscription.centerId,
        currency: invoiceForm.currency,
        discount: invoiceForm.discount,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes || undefined,
        paymentMethod: invoiceForm.paymentMethod || undefined,
        status: invoiceForm.status,
        subscriptionId: subscription.id,
        tax: invoiceForm.tax,
      });
      setInvoiceForm(defaultSubscriptionInvoiceForm());
      setActionMessage({
        tone: "success",
        text: subscriptionBillingText[locale].saveSuccess,
      });
      await loadInvoices();
    } catch (err) {
      setActionMessage({
        tone: "error",
        text: err instanceof Error ? err.message : dictionary.values.actionError,
      });
    } finally {
      setInvoiceSaving(false);
    }
  }

  async function handleInvoiceAction(
    invoice: SubscriptionInvoice,
    action: "paid" | "cancel",
  ) {
    setInvoiceActionId(`${invoice.id}:${action}`);
    setActionMessage(null);
    try {
      if (action === "paid") {
        await markSubscriptionInvoicePaid(invoice.id, {
          paymentMethod: invoice.paymentMethod ?? "MANUAL",
        });
      } else {
        await cancelSubscriptionInvoice(invoice.id);
      }
      setActionMessage({
        tone: "success",
        text: subscriptionBillingText[locale].actionSuccess,
      });
      await loadInvoices();
    } catch (err) {
      setActionMessage({
        tone: "error",
        text: err instanceof Error ? err.message : dictionary.values.actionError,
      });
    } finally {
      setInvoiceActionId("");
    }
  }

  async function handleDownloadInvoicePdf(invoice: SubscriptionInvoice) {
    setInvoiceActionId(`${invoice.id}:pdf`);
    setActionMessage(null);
    try {
      const response = await downloadSubscriptionInvoicePdf(invoice.id, locale);
      const bytes = Uint8Array.from(atob(response.contentBase64), (char) =>
        char.charCodeAt(0),
      );
      const blob = new Blob([bytes], { type: response.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionMessage({
        tone: "success",
        text: invoicePdfText[locale].success,
      });
    } catch (err) {
      setActionMessage({
        tone: "error",
        text: err instanceof Error ? err.message : dictionary.values.actionError,
      });
    } finally {
      setInvoiceActionId("");
    }
  }

  function getSubscriptionActions(
    sub: SuperAdminSubscription,
    closeMenu: () => void,
  ): SuperAdminActionMenuItem[] {
    const lifecycle = getLifecycle(sub).lifecycle;
    const availability = getSubscriptionActionAvailability(lifecycle);
    const actions: SuperAdminActionMenuItem[] = [];

    if (availability.canView) {
      actions.push({
        href: `/super-admin/subscriptions/${sub.id}`,
        icon: "view",
        label: dictionary.actions.view,
      });
    }

    if (availability.canRenew) {
      actions.push({
        icon: "renew",
        label:
          rowActionLoading === `${sub.id}:renew`
            ? dictionary.values.renewing
            : dictionary.actions.renew,
        onSelect: () => {
          closeMenu();
          void handleRenewSubscription(sub);
        },
        tone: "success",
      });
    }

    if (availability.canSuspend) {
      actions.push({
        icon: "suspend",
        label:
          rowActionLoading === `${sub.id}:suspend`
            ? dictionary.values.suspending
            : dictionary.actions.suspend,
        onSelect: () => {
          closeMenu();
          void handleSuspendSubscription(sub);
        },
        tone: "warning",
      });
    }

    if (availability.canSendWhatsApp) {
      if (getWhatsAppPhone(sub)) {
        actions.push({
          icon: "whatsapp",
          label: dictionary.actions.sendWhatsApp,
          onSelect: () => {
            setWhatsAppSub(sub);
            closeMenu();
          },
          tone: "success",
        });
      } else {
        actions.push({
          icon: "edit",
          label: dictionary.actions.addPhone,
          onSelect: () => {
            setEditTarget(sub);
            closeMenu();
          },
        });
      }
    }

    return actions;
  }

  const expiringSoon = subscriptions.filter(getIsExpiringSoon);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: dictionary.filters.all },
    { value: "ACTIVE", label: dictionary.statuses.active },
    { value: "TRIALING", label: dictionary.statuses.trialing },
    { value: "EXPIRING_SOON", label: dictionary.statuses.expiringSoon },
    { value: "EXPIRED", label: dictionary.statuses.expired },
    { value: "SUSPENDED", label: dictionary.statuses.suspended },
    { value: "CANCELLED", label: dictionary.statuses.cancelled },
    { value: "MISSING_PHONE", label: dictionary.filters.missingWhatsAppPhone },
  ];

  const quickFilters: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: dictionary.filters.all },
    { value: "ACTIVE", label: dictionary.statuses.active },
    { value: "TRIALING", label: dictionary.statuses.trialing },
    { value: "EXPIRING_SOON", label: dictionary.statuses.expiringSoon },
    { value: "EXPIRED", label: dictionary.statuses.expired },
    { value: "SUSPENDED", label: dictionary.statuses.suspended },
    { value: "CANCELLED", label: dictionary.statuses.cancelled },
    { value: "MISSING_PHONE", label: dictionary.filters.missingWhatsAppPhone },
  ];

  const statsItems = [
    {
      key: "activeSubscriptions" as const,
      value: subscriptions.filter((s) => getLifecycle(s).lifecycle === "ACTIVE").length,
    },
    {
      key: "trialSubscriptions" as const,
      value: subscriptions.filter((s) => getLifecycle(s).lifecycle === "TRIALING").length,
    },
    {
      key: "expiringSoon" as const,
      value: subscriptions.filter(getIsExpiringSoon).length,
    },
    {
      key: "expiredSubscriptions" as const,
      value: subscriptions.filter(getIsExpired).length,
    },
    {
      key: "suspendedSubscriptions" as const,
      value: subscriptions.filter((s) => {
        return getLifecycle(s).lifecycle === "SUSPENDED";
      }).length,
    },
  ];
  const checkedCount = jobStatus?.lastResult?.scanned ?? 0;
  const expiredUpdatedCount = jobStatus?.lastResult?.updatedExpired ?? 0;
  const notificationsCreatedCount = jobStatus?.lastResult?.notificationsCreated ?? 0;
  const suspendedSkippedCount = jobStatus?.lastResult?.skippedSuspended ?? 0;
  const duplicateNotificationsSkippedCount =
    jobStatus?.lastResult?.duplicateNotificationsSkipped ?? 0;
  const attentionCount = expiringWithin7Count + expiredUpdatedCount;
  const hasAutomationWarning =
    expiredUpdatedCount > 0 || notificationsCreatedCount > 0;
  const statusTone =
    jobStatus?.lastRunSuccess === false
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : hasAutomationWarning
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const automationBusinessSummaries = [
    automationDictionary.checkedSummary(checkedCount),
    expiredUpdatedCount > 0
      ? automationDictionary.updatedExpiredSummary(expiredUpdatedCount)
      : null,
    suspendedSkippedCount > 0
      ? automationDictionary.skippedSuspendedSummary(suspendedSkippedCount)
      : null,
    attentionCount === 0 && notificationsCreatedCount === 0
      ? automationDictionary.noActionSummary
      : null,
  ].filter((summary): summary is string => Boolean(summary));
  const automationSummaryItems = [
    {
      label: automationDictionary.status,
      tone: statusTone,
      value:
        jobStatus?.lastRunSuccess == null
          ? automationDictionary.neverRun
          : jobStatus.lastRunSuccess
            ? automationDictionary.success
            : automationDictionary.failed,
    },
    {
      label: automationDictionary.lastRun,
      tone: "border-slate-200 bg-slate-50 text-slate-700",
      value: jobStatus?.lastRunAt
        ? formatJobDate(jobStatus.lastRunAt, locale)
        : automationDictionary.neverRun,
    },
    {
      label: automationDictionary.scanned,
      tone: "border-slate-200 bg-slate-50 text-slate-700",
      value: checkedCount,
    },
    {
      label: automationDictionary.updatedExpired,
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      value: expiredUpdatedCount,
    },
    {
      label: automationDictionary.notificationsCreated,
      tone: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
      value: notificationsCreatedCount,
    },
    {
      label: automationDictionary.skippedSuspended,
      tone: "border-slate-200 bg-slate-50 text-slate-700",
      value: suspendedSkippedCount,
    },
    {
      label: automationDictionary.duplicateNotificationsSkipped,
      tone: "border-slate-200 bg-slate-50 text-slate-700",
      value: duplicateNotificationsSkippedCount,
    },
  ];
  const billingText = subscriptionBillingText[locale];
  const invoiceStatusLabel = (status: SubscriptionInvoiceStatus | "ALL") => {
    if (status === "ALL") return dictionary.filters.all;
    const labels: Record<SubscriptionInvoiceStatus, string> = {
      CANCELLED: billingText.cancelled,
      DRAFT: "DRAFT",
      OVERDUE: dictionary.statuses.overdue,
      PAID: billingText.paid,
      PENDING: dictionary.paymentStatuses.pending,
    };
    return labels[status];
  };
  const selectedInvoiceSubscription = subscriptions.find(
    (item) => item.id === invoiceForm.subscriptionId,
  );
  const invoiceTotal =
    Math.max(
      0,
      Number(invoiceForm.amount || 0) -
        Number(invoiceForm.discount || 0) +
        Number(invoiceForm.tax || 0),
    ) || 0;

  return (
    <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        {/* Stats */}
        <section className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {statsItems.map((stat) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
              key={stat.key}
            >
              <p className="text-sm font-medium text-[#66758a]">{dictionary.stats[stat.key]}</p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {loading ? "—" : stat.value}
              </p>
            </article>
          ))}
        </section>

        {/* Centers At Risk */}
        {centersAtRisk && centersAtRisk.total > 0 && (
          <section className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {dictionary.centersAtRisk.sectionTitle}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-amber-800">
                  {centersAtRisk.total}
                </p>
              </div>
              <a
                className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                href={`/super-admin/centers?lifecycle=NEEDS_SUBSCRIPTION_REVIEW`}
              >
                {dictionary.centersAtRisk.viewCenters}
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { count: centersAtRisk.noSubscription, label: dictionary.centersAtRisk.noSubscription, cls: "bg-slate-100 text-slate-700 border-slate-200" },
                { count: centersAtRisk.expired, label: dictionary.centersAtRisk.expired, cls: "bg-rose-100 text-rose-800 border-rose-200" },
                { count: centersAtRisk.suspended, label: dictionary.centersAtRisk.suspended, cls: "bg-slate-200 text-slate-700 border-slate-300" },
                { count: centersAtRisk.gracePeriod, label: dictionary.centersAtRisk.gracePeriod, cls: "bg-amber-100 text-amber-800 border-amber-300" },
              ]
                .filter((p) => p.count > 0)
                .map((p) => (
                  <span key={p.label} className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${p.cls}`}>
                    {p.count} {p.label}
                  </span>
                ))}
            </div>
          </section>
        )}

        <Section title={automationDictionary.title}>
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm leading-6 text-[#66758a]">
                    {automationDictionary.subtitle}
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-base font-semibold text-[#0B2D5C]">
                      {automationDictionary.requireAttention(attentionCount)}
                    </p>
                    {automationBusinessSummaries.map((summary) => (
                      <p
                        className="text-sm font-medium text-[#66758a]"
                        key={summary}
                      >
                        {summary}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm text-[#526176]">
                  <span className="font-medium text-[#24364f]">
                    {automationDictionary.nextRun}:
                  </span>{" "}
                  {formatJobDate(jobStatus?.nextRunAt, locale)}
                </div>
              </div>
              {jobStatusError && (
                <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {jobStatusError}
                </p>
              )}
              <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {automationSummaryItems.map((item) => (
                  <div
                    className={`min-w-0 rounded-lg border px-4 py-3 ${item.tone}`}
                    key={item.label}
                  >
                    <p className="min-w-0 truncate text-xs font-semibold opacity-75">
                      {item.label}
                    </p>
                    <p className="mt-2 break-words text-xl font-semibold">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              {jobStatus?.lastRunError && (
                <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {jobStatus.lastRunError}
                </p>
              )}
            </div>
            <div className="flex items-start xl:justify-end">
              <button
                className="min-h-11 rounded-lg bg-[#0B2D5C] px-5 text-sm font-semibold text-white transition hover:bg-[#09264f] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={jobRunning}
                onClick={() => void handleRunLifecycleJob()}
                type="button"
              >
                {jobRunning ? automationDictionary.running : automationDictionary.runNow}
              </button>
            </div>
          </div>
        </Section>

        <Section title={billingText.title}>
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
            <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block min-w-0 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.subscription}
                  </span>
                  <select
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        subscriptionId: event.target.value,
                      }))
                    }
                    value={invoiceForm.subscriptionId}
                  >
                    <option value="">{billingText.subscription}</option>
                    {subscriptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.center.name} - {sub.planName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.amount}
                  </span>
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    dir="ltr"
                    inputMode="decimal"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    value={invoiceForm.amount}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.currency}
                  </span>
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    dir="ltr"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        currency: event.target.value.toUpperCase(),
                      }))
                    }
                    value={invoiceForm.currency}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.discount}
                  </span>
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    dir="ltr"
                    inputMode="decimal"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        discount: event.target.value,
                      }))
                    }
                    value={invoiceForm.discount}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.tax}
                  </span>
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    dir="ltr"
                    inputMode="decimal"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        tax: event.target.value,
                      }))
                    }
                    value={invoiceForm.tax}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.dueDate}
                  </span>
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    type="date"
                    value={invoiceForm.dueDate}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.status}
                  </span>
                  <select
                    className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        status: event.target.value as SubscriptionInvoiceStatus,
                      }))
                    }
                    value={invoiceForm.status}
                  >
                    {subscriptionInvoiceStatuses
                      .filter((status) => status !== "ALL")
                      .map((status) => (
                        <option key={status} value={status}>
                          {invoiceStatusLabel(status)}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block min-w-0 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#24364f]">
                    {billingText.notes}
                  </span>
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-md border border-[#D8DEE8] bg-white px-3 py-2 text-sm text-[#132238]"
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    value={invoiceForm.notes}
                  />
                </label>
              </div>
              <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#0B2D5C]">
                  {billingText.total}: {invoiceTotal.toFixed(2)}{" "}
                  {invoiceForm.currency || "ILS"}
                  {selectedInvoiceSubscription ? (
                    <span className="ms-2 font-medium text-[#66758a]">
                      {selectedInvoiceSubscription.center.name}
                    </span>
                  ) : null}
                </p>
                <button
                  className="min-h-11 rounded-lg bg-[#0B2D5C] px-5 text-sm font-semibold text-white transition hover:bg-[#09264f] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={invoiceSaving || !invoiceForm.subscriptionId}
                  onClick={() => void handleCreateInvoice()}
                  type="button"
                >
                  {invoiceSaving ? "..." : billingText.create}
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
                <input
                  className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(event) => setInvoiceSearch(event.target.value)}
                  placeholder={billingText.search}
                  value={invoiceSearch}
                />
                <select
                  className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(event) =>
                    setInvoiceStatusFilter(
                      event.target.value as SubscriptionInvoiceStatus | "ALL",
                    )
                  }
                  value={invoiceStatusFilter}
                >
                  {subscriptionInvoiceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {invoiceStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              {invoiceLoading ? (
                <AdminState
                  className="min-h-0 py-5"
                  loading
                  title={dictionary.loadingState.loading}
                />
              ) : subscriptionInvoices.length === 0 ? (
                <AdminState
                  className="min-h-0 border-dashed py-8"
                  title={billingText.empty}
                />
              ) : (
                <div className="min-w-0 overflow-x-auto rounded-lg border border-[#E5E7EB]">
                  <table className="w-full min-w-[760px] border-collapse bg-white text-sm">
                    <thead className="bg-[#F8FAFC] text-xs font-semibold text-[#66758a]">
                      <tr>
                        <th className="px-4 py-3 text-start">{billingText.invoiceNumber}</th>
                        <th className="px-4 py-3 text-start">{billingText.center}</th>
                        <th className="px-4 py-3 text-start">{billingText.total}</th>
                        <th className="px-4 py-3 text-start">{billingText.status}</th>
                        <th className="px-4 py-3 text-start">{billingText.dueDate}</th>
                        <th className="px-4 py-3 text-start">{dictionary.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionInvoices.map((invoice) => (
                        <tr className="border-t border-[#E5E7EB] transition-colors duration-100 hover:bg-[#F8FAFC]" key={invoice.id}>
                          <td className="px-4 py-3 font-semibold text-[#0B2D5C]">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 text-[#24364f]">
                            {invoice.center.name}
                          </td>
                          <td className="px-4 py-3 text-[#24364f]" dir="ltr">
                            {invoice.total} {invoice.currency}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#24364f]">
                              {invoiceStatusLabel(invoice.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#66758a]">
                            {formatSubscriptionDate(invoice.dueDate, locale)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className={buttonClassName("ghost", "sm")}
                                disabled={invoiceActionId === `${invoice.id}:pdf`}
                                onClick={() => void handleDownloadInvoicePdf(invoice)}
                                type="button"
                              >
                                {invoicePdfText[locale].download}
                              </button>
                              {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
                                <button
                                  className={buttonClassName("success", "sm")}
                                  disabled={invoiceActionId === `${invoice.id}:paid`}
                                  onClick={() => void handleInvoiceAction(invoice, "paid")}
                                  type="button"
                                >
                                  {billingText.markPaid}
                                </button>
                              ) : null}
                              {invoice.status !== "CANCELLED" && invoice.status !== "PAID" ? (
                                <button
                                  className={buttonClassName("warning", "sm")}
                                  disabled={invoiceActionId === `${invoice.id}:cancel`}
                                  onClick={() => void handleInvoiceAction(invoice, "cancel")}
                                  type="button"
                                >
                                  {billingText.cancel}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Filters */}
        <Section title={dictionary.sections.searchFilters}>
          <div className="mb-5 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {quickFilters.map((filter) => {
              const isActive = statusFilter === filter.value;
              return (
                <button
                  className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#0B2D5C] bg-[#0B2D5C] text-white shadow-[0_10px_20px_rgba(11,45,92,0.14)]"
                      : "border-[#E5E7EB] bg-white text-[#24364f] hover:border-[#0B2D5C]/30 hover:bg-[#F8FAFC]"
                  }`}
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.searchLabel}
              </span>
              <input
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
                value={search}
              />
            </label>

            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">{dictionary.filters.status}</span>
              <select
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                value={statusFilter}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {actionMessage && (
            <div
              className={`mt-4 rounded-md border px-4 py-3 text-sm font-medium ${
                actionMessage.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {actionMessage.text}
            </div>
          )}
        </Section>

        {/* Expiring Soon */}
        {!loading && expiringSoon.length > 0 && (
          <Section title={dictionary.sections.expiringSoon}>
            <p className="mb-4 text-sm leading-6 text-[#66758a]">
              {dictionary.values.expiringHint}
            </p>
            <div className="grid min-w-0 grid-cols-1 gap-3">
              {expiringSoon.map((sub) => (
                <div
                  className="grid min-w-0 grid-cols-1 gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  key={sub.id}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B2D5C]">{sub.center.name}</p>
                    <p className="mt-1 text-sm text-[#66758a]">
                      {dictionary.table.expiryDate}: {formatSubscriptionDate(sub.currentPeriodEnd, locale)}
                      {" · "}
                      <span className="font-medium text-amber-700">
                        {getDaysLabel(sub, dictionary)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge
                      className={getLifecycleBadgeClass(getLifecycle(sub))}
                      label={getLifecycleStatusLabel(getLifecycle(sub), dictionary)}
                    />
                    <button
                      className="flex h-8 items-center gap-1.5 rounded-md bg-[#25D366] px-3 text-xs font-semibold text-white transition hover:bg-[#1aab54]"
                      onClick={() => {
                        if (getWhatsAppPhone(sub)) {
                          setWhatsAppSub(sub);
                        } else {
                          setEditTarget(sub);
                        }
                      }}
                      type="button"
                    >
                      {getWhatsAppPhone(sub)
                        ? dictionary.actions.sendWhatsApp
                        : dictionary.actions.addPhone}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Table */}
        <Section title={`${dictionary.sections.table}${!loading ? ` (${total})` : ""}`}>
          {/* Loading */}
          {loading && (
            <AdminState
              className="min-h-0 border-0 bg-transparent py-12 shadow-none"
              loading
              title={dictionary.loadingState.loading}
            />
          )}

          {/* Error */}
          {!loading && loadError && (
            <AdminState
              action={
              <button
                className={buttonClassName("primary", "sm")}
                onClick={() => void loadSubscriptions(search, statusFilter)}
                type="button"
              >
                {dictionary.loadingState.retry}
              </button>
              }
              className="min-h-0 border-0 bg-transparent py-12 shadow-none"
              title={loadError}
              tone="error"
            />
          )}

          {/* Empty */}
          {!loading && !loadError && subscriptions.length === 0 && (
            <AdminState
              className="min-h-0 border-0 bg-transparent py-12 shadow-none"
              title={search || statusFilter !== "ALL"
                ? dictionary.loadingState.noResults
                : dictionary.loadingState.empty}
            />
          )}

          {/* Desktop table */}
          {!loading && !loadError && subscriptions.length > 0 && (
            <>
              <div className="hidden max-w-full overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] border-collapse text-sm">
                  <thead className="bg-[#F8FAFC] text-[#66758a]">
                    <tr>
                      {(
                        [
                          "centerName",
                          "owner",
                          "subscriptionPlan",
                          "billingCycle",
                          "startDate",
                          "expiryDate",
                          "daysRemaining",
                          "status",
                          "actions",
                        ] as const
                      ).map((col) => (
                        <th className="px-4 py-3 text-start font-medium" key={col}>
                          {dictionary.table[col]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr
                        className={`border-t border-[#E5E7EB] ${getRowHighlight(sub)}`}
                        key={sub.id}
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-[#0B2D5C]">{sub.center.name}</p>
                          <p className="mt-0.5 text-xs text-[#66758a]">{sub.center.slug}</p>
                          {!getWhatsAppPhone(sub) && (
                            <span className="mt-2 inline-flex min-h-6 items-center rounded-full border border-amber-200 bg-amber-50 px-2 text-[11px] font-semibold text-amber-700">
                              <span aria-hidden="true" className="me-1">!</span>
                              {dictionary.values.missingWhatsAppPhone}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                          {sub.center.owner?.fullName ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                          {sub.planName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                          {sub.billingInterval === "MONTHLY"
                            ? dictionary.billingCycles.monthly
                            : sub.billingInterval === "YEARLY"
                              ? dictionary.billingCycles.yearly
                              : dictionary.billingCycles.custom}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                          {formatSubscriptionDate(sub.currentPeriodStart, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                          {formatSubscriptionDate(sub.currentPeriodEnd, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${getLifecycleBadgeClass(getLifecycle(sub))}`}
                          >
                            {getDaysLabel(sub, dictionary)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            className={getLifecycleBadgeClass(getLifecycle(sub))}
                            label={getLifecycleStatusLabel(getLifecycle(sub), dictionary)}
                          />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <SuperAdminActionMenu
                            isOpen={openDesktopActions === sub.id}
                            items={getSubscriptionActions(sub, () => setOpenDesktopActions(null))}
                            onClose={() => setOpenDesktopActions(null)}
                            onToggle={() =>
                              setOpenDesktopActions((c) => (c === sub.id ? null : sub.id))
                            }
                            triggerLabel={dictionary.table.actions}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid min-w-0 grid-cols-1 gap-4 md:hidden">
                <p className="text-sm leading-6 text-[#66758a]">{dictionary.values.mobileHint}</p>
                {subscriptions.map((sub) => (
                  <article
                    className={`min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] ${getRowHighlight(sub)}`}
                    key={sub.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="break-words text-base font-semibold text-[#0B2D5C]">
                          {sub.center.name}
                        </h4>
                        <p className="mt-1 break-words text-sm text-[#66758a]">
                          {sub.center.owner?.fullName ?? "—"}
                        </p>
                      </div>
                      <StatusBadge
                        className={getLifecycleBadgeClass(getLifecycle(sub))}
                        label={getLifecycleStatusLabel(getLifecycle(sub), dictionary)}
                      />
                    </div>
                    {!getWhatsAppPhone(sub) && (
                      <span className="mt-3 inline-flex min-h-7 w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-xs font-semibold text-amber-700">
                        <span aria-hidden="true" className="me-1">!</span>
                        {dictionary.values.missingWhatsAppPhone}
                      </span>
                    )}

                    <div className="mt-4 grid min-w-0 grid-cols-1 gap-3">
                      <DetailPair
                        label={dictionary.table.subscriptionPlan}
                        value={sub.planName}
                      />
                      <DetailPair
                        label={dictionary.table.billingCycle}
                        value={
                          sub.billingInterval === "MONTHLY"
                            ? dictionary.billingCycles.monthly
                            : sub.billingInterval === "YEARLY"
                              ? dictionary.billingCycles.yearly
                              : dictionary.billingCycles.custom
                        }
                      />
                      <DetailPair
                        label={dictionary.table.expiryDate}
                        value={formatSubscriptionDate(sub.currentPeriodEnd, locale)}
                      />
                      <DetailPair
                        label={dictionary.table.daysRemaining}
                        value={
                          <span
                            className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${getLifecycleBadgeClass(getLifecycle(sub))}`}
                          >
                            {getDaysLabel(sub, dictionary)}
                          </span>
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <SuperAdminActionMenu
                        isOpen={openMobileActions === sub.id}
                        items={getSubscriptionActions(sub, () => setOpenMobileActions(null))}
                        onClose={() => setOpenMobileActions(null)}
                        onToggle={() =>
                          setOpenMobileActions((c) => (c === sub.id ? null : sub.id))
                        }
                        triggerLabel={dictionary.table.actions}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {editTarget && (
        <EditSubscriptionModal
          dictionary={dictionary}
          isRtl={isRtl}
          onClose={() => setEditTarget(null)}
          onSaved={() => void loadSubscriptions(search, statusFilter)}
          subscription={editTarget}
        />
      )}

      {whatsAppSub && (
        <WhatsAppModal
          centerName={whatsAppSub.center.name}
          defaultMessage={buildWhatsAppMessage(whatsAppSub)}
          direction={direction}
          labels={dictionary.whatsapp}
          onClose={() => setWhatsAppSub(null)}
          onLog={async (action, phone, message) => {
            await logSubscriptionManualWhatsAppAction(whatsAppSub.id, {
              action,
              message,
              phone,
            });
          }}
          phone={getWhatsAppPhone(whatsAppSub)}
        />
      )}
    </SuperAdminLayout>
  );
}
