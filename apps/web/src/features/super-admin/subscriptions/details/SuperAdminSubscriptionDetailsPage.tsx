"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminSubscriptionDetailsDictionaries } from "@/i18n/dictionaries/super-admin-subscription-details";
import {
  getSuperAdminSubscriptionById,
  getSuperAdminSubscriptionTimeline,
  updateCenterSubscription,
  type SuperAdminSubscriptionTimelineItem,
  type SuperAdminSubscription,
} from "@/lib/api/super-admin-subscriptions";
import { notifySuperAdminNotificationsUpdated } from "@/lib/api/super-admin-notifications";
import {
  normalizeSubscriptionLifecycle,
  type SubscriptionLifecycleResult,
} from "@/lib/subscription-status";

type Dictionary = (typeof superAdminSubscriptionDetailsDictionaries)["en"];

// ─── UI helpers ───────────────────────────────────────────────────────────────

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

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "gold" | "navy" | "success" | "neutral";
}) {
  const styles = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function DetailList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3"
          key={label}
        >
          <dt className="text-xs font-medium text-[#66758a]">{label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function statusTone(
  lifecycle: SubscriptionLifecycleResult,
): "danger" | "gold" | "navy" | "success" | "neutral" {
  if (lifecycle.lifecycle === "EXPIRED" || lifecycle.lifecycle === "CANCELLED") {
    return "danger";
  }
  if (lifecycle.lifecycle === "EXPIRING_SOON") return "gold";
  if (lifecycle.lifecycle === "TRIALING") return "gold";
  if (lifecycle.lifecycle === "ACTIVE") return "navy";
  return "neutral";
}

function getStatusLabel(
  lifecycle: SubscriptionLifecycleResult,
  d: Dictionary,
): string {
  const map: Record<string, string> = {
    ACTIVE: d.statuses.active,
    CANCELLED: d.statuses.cancelled,
    EXPIRED: d.statuses.expired,
    EXPIRING_SOON: d.statuses.expiringSoon,
    SUSPENDED: d.statuses.suspended,
    TRIALING: d.statuses.trialing,
    UNKNOWN: lifecycle.label,
  };
  return map[lifecycle.lifecycle] ?? lifecycle.label;
}

function formatSubscriptionDate(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDate(value, locale as Parameters<typeof formatDate>[1]);
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeDefaultEndDate(sub: SuperAdminSubscription): string {
  void sub;
  return toDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
}

function formatExactDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = formatDate(value, locale as Parameters<typeof formatDate>[1]);
  const time = `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return `${day} ${time}`;
}

function getRelativeTime(
  value: string,
  dictionary: Dictionary,
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return dictionary.timeline.today;
  if (diffDays === 1) return dictionary.timeline.yesterday;
  if (diffDays > 1) return dictionary.timeline.daysAgo(diffDays);
  return "";
}

function timelineTone(type: SuperAdminSubscriptionTimelineItem["type"]) {
  if (type === "SUBSCRIPTION_RENEWED") return "success";
  if (type === "SUBSCRIPTION_SUSPENDED") return "warning";
  if (type === "SUBSCRIPTION_CANCELLED" || type === "SUBSCRIPTION_EXPIRED") return "danger";
  if (type === "WHATSAPP_OPENED" || type === "WHATSAPP_COPIED") return "whatsapp";
  if (type === "RENEWAL_REQUEST_SUBMITTED") return "indigo";
  if (type === "PLAN_CHANGED" || type === "PHONE_UPDATED") return "blue";
  return "neutral";
}

function TimelineSection({
  dictionary,
  items,
  locale,
}: {
  dictionary: Dictionary;
  items: SuperAdminSubscriptionTimelineItem[];
  locale: string;
}) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    whatsapp: "border-[#25D366]/30 bg-[#25D366]/10 text-[#128C45]",
  };

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[#66758a]">
        {dictionary.timeline.empty}
      </p>
    );
  }

  return (
    <ol className="relative min-w-0 space-y-4 md:before:absolute md:before:bottom-2 md:before:start-4 md:before:top-2 md:before:w-px md:before:bg-[#E5E7EB]">
      {items.map((item) => {
        const tone = timelineTone(item.type);
        return (
          <li
            className="relative min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_24px_rgba(11,45,92,0.04)] md:ms-10"
            key={item.id}
          >
            <span
              className={`mb-3 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border text-xs font-bold md:absolute md:-start-14 md:top-4 ${toneClasses[tone]}`}
              aria-hidden="true"
            >
              {dictionary.timeline.icons[item.type] ?? "•"}
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-semibold text-[#0B2D5C]">
                    {dictionary.timeline.types[item.type] ?? item.title}
                  </h4>
                  <p className="mt-1 break-words text-sm leading-5 text-[#526176]">
                    {item.description}
                  </p>
                </div>
                <div className="shrink-0 text-start sm:text-end">
                  <p className="text-xs font-semibold text-[#24364f]">
                    {getRelativeTime(item.createdAt, dictionary)}
                  </p>
                  <p className="mt-1 text-xs text-[#66758a]">
                    {formatExactDateTime(item.createdAt, locale)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#66758a]">
                <span className="rounded-full bg-[#F8FAFC] px-2 py-1">
                  {dictionary.timeline.actor}: {item.actorName ?? dictionary.timeline.system}
                </span>
                <span className="rounded-full bg-[#F8FAFC] px-2 py-1">
                  {dictionary.timeline.actorType}: {dictionary.timeline.actorTypes[item.actorType] ?? item.actorType}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Renew modal ──────────────────────────────────────────────────────────────

function RenewModal({
  dictionary,
  isRtl,
  onClose,
  onConfirm,
  saving,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  dictionary: Dictionary;
  isRtl: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const qd = dictionary.quickActions;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const inputCls =
    "mt-1.5 h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/12";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      ref={overlayRef}
    >
      <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#0B2D5C]">
            {qd.renewModalTitle}
          </h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#66758a] transition hover:bg-[#F1F5F9] hover:text-[#0B2D5C]"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-5 text-[#66758a]">
            {qd.renewDescription}
          </p>
          <div>
            <label className="block text-sm font-medium text-[#24364f]">
              {qd.startDateLabel}
            </label>
            <input
              className={inputCls}
              onChange={(e) => onStartDateChange(e.target.value)}
              type="date"
              value={startDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#24364f]">
              {qd.endDateLabel}
            </label>
            <input
              className={inputCls}
              onChange={(e) => onEndDateChange(e.target.value)}
              type="date"
              value={endDate}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
          <button
            className="h-10 rounded-md border border-[#E5E7EB] px-5 text-sm font-medium text-[#526176] transition hover:bg-[#F1F5F9] disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            {qd.cancelButton}
          </button>
          <button
            className={buttonClassName("primary", "md")}
            disabled={saving}
            onClick={onConfirm}
            type="button"
          >
            {saving && <Spinner />}
            {saving ? "…" : qd.confirmButton}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm modal (suspend / cancel) ─────────────────────────────────────────

function ConfirmModal({
  action,
  dictionary,
  isRtl,
  onClose,
  onConfirm,
  saving,
}: {
  action: "suspend" | "cancel";
  dictionary: Dictionary;
  isRtl: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  const qd = dictionary.quickActions;
  const title =
    action === "suspend" ? qd.suspendModalTitle : qd.cancelModalTitle;
  const description =
    action === "suspend" ? qd.suspendDescription : qd.cancelDescription;
  const tone: "warning" | "danger" = action === "suspend" ? "warning" : "danger";

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      ref={overlayRef}
    >
      <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2
            className={`text-base font-semibold ${action === "cancel" ? "text-rose-700" : "text-amber-700"}`}
          >
            {title}
          </h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#66758a] transition hover:bg-[#F1F5F9]"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-5 text-[#526176]">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
          <button
            className="h-10 rounded-md border border-[#E5E7EB] px-5 text-sm font-medium text-[#526176] transition hover:bg-[#F1F5F9] disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            {qd.cancelButton}
          </button>
          <button
            className={buttonClassName(tone, "md")}
            disabled={saving}
            onClick={onConfirm}
            type="button"
          >
            {saving && <Spinner />}
            {saving ? "…" : qd.confirmButton}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick actions panel ──────────────────────────────────────────────────────

function QuickActionsPanel({
  actionLoading,
  dictionary,
  onCancel,
  onRenew,
  onSuspend,
  subscription,
}: {
  actionLoading: string | null;
  dictionary: Dictionary;
  onCancel: () => void;
  onRenew: () => void;
  onSuspend: () => void;
  subscription: SuperAdminSubscription;
}) {
  const isLoading = actionLoading !== null;
  const { status } = subscription;
  const isAlreadyCancelledOrExpired =
    status === "CANCELLED" || status === "EXPIRED";
  const isAlreadySuspended = status === "SUSPENDED";
  const cs = dictionary.quickActions.comingSoon;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      {/* Renew — always actionable */}
      <button
        className={buttonClassName("primary", "md")}
        disabled={isLoading}
        onClick={onRenew}
        type="button"
      >
        {actionLoading === "renew" ? (
          <>
            <Spinner />
            <span className="ms-2">{dictionary.detailActions.renewSubscription}</span>
          </>
        ) : (
          dictionary.detailActions.renewSubscription
        )}
      </button>

      {/* Upgrade Plan — coming soon */}
      <button
        className={buttonClassName("secondary", "md")}
        disabled
        title={cs}
        type="button"
      >
        {dictionary.detailActions.upgradePlan}
        <span className="ms-2 text-xs font-normal opacity-60">({cs})</span>
      </button>

      {/* Downgrade Plan — coming soon */}
      <button
        className={buttonClassName("secondary", "md")}
        disabled
        title={cs}
        type="button"
      >
        {dictionary.detailActions.downgradePlan}
        <span className="ms-2 text-xs font-normal opacity-60">({cs})</span>
      </button>

      {/* Suspend Subscription */}
      <button
        className={buttonClassName("warning", "md")}
        disabled={isLoading || isAlreadyCancelledOrExpired || isAlreadySuspended}
        onClick={onSuspend}
        type="button"
      >
        {actionLoading === "suspend" ? (
          <>
            <Spinner />
            <span className="ms-2">
              {dictionary.detailActions.suspendSubscription}
            </span>
          </>
        ) : (
          dictionary.detailActions.suspendSubscription
        )}
      </button>

      {/* Generate Invoice — coming soon */}
      <button
        className={buttonClassName("secondary", "md")}
        disabled
        title={cs}
        type="button"
      >
        {dictionary.detailActions.generateInvoice}
        <span className="ms-2 text-xs font-normal opacity-60">({cs})</span>
      </button>

      {/* View Invoice History — coming soon */}
      <button
        className={buttonClassName("secondary", "md")}
        disabled
        title={cs}
        type="button"
      >
        {dictionary.detailActions.viewInvoiceHistory}
        <span className="ms-2 text-xs font-normal opacity-60">({cs})</span>
      </button>

      {/* Cancel Subscription */}
      <button
        className={buttonClassName("danger", "md")}
        disabled={isLoading || isAlreadyCancelledOrExpired}
        onClick={onCancel}
        type="button"
      >
        {actionLoading === "cancel" ? (
          <>
            <Spinner />
            <span className="ms-2">
              {dictionary.detailActions.cancelSubscription}
            </span>
          </>
        ) : (
          dictionary.detailActions.cancelSubscription
        )}
      </button>

      <p className="text-xs leading-5 text-[#66758a]">
        {dictionary.values.actionsHint}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SuperAdminSubscriptionDetailsPage({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const { direction, locale } = useLanguage();
  const isRtl = direction === "rtl";
  const dictionary = superAdminSubscriptionDetailsDictionaries[locale];

  const [subscription, setSubscription] =
    useState<SuperAdminSubscription | null>(null);
  const [timelineItems, setTimelineItems] = useState<
    SuperAdminSubscriptionTimelineItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Modal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "suspend" | "cancel" | null
  >(null);

  // Renew modal form state
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewEndDate, setRenewEndDate] = useState("");

  // Auto-clear feedback after 4 seconds
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (actionFeedback) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setActionFeedback(null), 4000);
    }
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, [actionFeedback]);

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [data, timeline] = await Promise.all([
        getSuperAdminSubscriptionById(subscriptionId),
        getSuperAdminSubscriptionTimeline(subscriptionId).catch(() => ({
          centerId: "",
          data: [],
          subscriptionId,
        })),
      ]);
      setSubscription(data);
      setTimelineItems(timeline.data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load subscription.",
      );
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubscription();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSubscription]);

  // ── Action handlers ─────────────────────────────────────────────────────────

  function openRenewModal() {
    if (!subscription) return;
    setRenewStartDate(toDateString(new Date()));
    setRenewEndDate(computeDefaultEndDate(subscription));
    setShowRenewModal(true);
  }

  async function handleRenew() {
    if (!subscription) return;
    setActionLoading("renew");
    try {
      await updateCenterSubscription(subscription.centerId, {
        subscriptionStatus: "ACTIVE",
        subscriptionStartDate: renewStartDate || toDateString(new Date()),
        subscriptionEndDate:
          renewEndDate || computeDefaultEndDate(subscription),
      });
      notifySuperAdminNotificationsUpdated();
      setShowRenewModal(false);
      setActionFeedback({
        ok: true,
        msg: dictionary.quickActions.renewSuccess,
      });
      await loadSubscription();
    } catch {
      setActionFeedback({
        ok: false,
        msg: dictionary.quickActions.actionError,
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSuspend() {
    if (!subscription) return;
    setActionLoading("suspend");
    try {
      await updateCenterSubscription(subscription.centerId, {
        subscriptionStatus: "SUSPENDED",
      });
      notifySuperAdminNotificationsUpdated();
      setConfirmAction(null);
      setActionFeedback({
        ok: true,
        msg: dictionary.quickActions.suspendSuccess,
      });
      await loadSubscription();
    } catch {
      setActionFeedback({
        ok: false,
        msg: dictionary.quickActions.actionError,
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    if (!subscription) return;
    setActionLoading("cancel");
    try {
      await updateCenterSubscription(subscription.centerId, {
        subscriptionStatus: "CANCELLED",
      });
      notifySuperAdminNotificationsUpdated();
      setConfirmAction(null);
      setActionFeedback({
        ok: true,
        msg: dictionary.quickActions.cancelSuccess,
      });
      await loadSubscription();
    } catch {
      setActionFeedback({
        ok: false,
        msg: dictionary.quickActions.actionError,
      });
    } finally {
      setActionLoading(null);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0B2D5C] border-t-transparent" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (loadError || !subscription) {
    return (
      <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.header.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B2D5C]">
            {dictionary.values.notFoundTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {loadError ?? dictionary.values.notFoundDescription}
          </p>
          <Link
            className={buttonClassName("secondary", "md", "mt-5 w-full sm:w-auto")}
            href="/super-admin/subscriptions"
          >
            {dictionary.detailActions.backToSubscriptions}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const lifecycle = normalizeSubscriptionLifecycle(subscription);
  const billingCycleLabel =
    subscription.billingInterval === "MONTHLY"
      ? dictionary.billingCycles.monthly
      : subscription.billingInterval === "YEARLY"
        ? dictionary.billingCycles.yearly
        : dictionary.billingCycles.custom;

  return (
    <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        {/* Header */}
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#0B2D5C] text-xl font-semibold text-[#C8A45D]">
              {subscription.center.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.header.eyebrow}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold text-[#0B2D5C]">
                {subscription.center.name}
              </h2>
              <p className="mt-1 break-words text-sm text-[#66758a]">
                {subscription.center.slug}
              </p>
            </div>
          </div>
          <Link
            className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
            href="/super-admin/subscriptions"
          >
            {dictionary.detailActions.backToSubscriptions}
          </Link>
        </section>

        {/* Inline action feedback */}
        {actionFeedback && (
          <div
            className={`min-w-0 rounded-lg border px-4 py-3 text-sm font-medium ${
              actionFeedback.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {actionFeedback.msg}
          </div>
        )}

        {/* Overview + Quick Actions */}
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [dictionary.table.centerName, subscription.center.name],
                [
                  dictionary.table.owner,
                  subscription.center.owner?.fullName ?? "—",
                ],
                [dictionary.table.subscriptionPlan, subscription.planName],
                [dictionary.table.billingCycle, billingCycleLabel],
                [
                  dictionary.table.startDate,
                  formatSubscriptionDate(
                    subscription.currentPeriodStart,
                    locale,
                  ),
                ],
                [
                  dictionary.table.expiryDate,
                  formatSubscriptionDate(
                    subscription.currentPeriodEnd,
                    locale,
                  ),
                ],
                [
                  dictionary.fields.nextRenewalDate,
                  formatSubscriptionDate(
                    subscription.nextRenewalDate,
                    locale,
                  ),
                ],
                [
                  dictionary.table.status,
                  <Badge
                    key="status"
                    label={getStatusLabel(lifecycle, dictionary)}
                    tone={statusTone(lifecycle)}
                  />,
                ],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.quickActions}>
            <QuickActionsPanel
              actionLoading={actionLoading}
              dictionary={dictionary}
              onCancel={() => setConfirmAction("cancel")}
              onRenew={openRenewModal}
              onSuspend={() => setConfirmAction("suspend")}
              subscription={subscription}
            />
          </Section>
        </div>

        {/* Payment History */}
        <Section title={dictionary.sections.paymentHistory}>
          <p className="py-6 text-center text-sm text-[#66758a]">
            {dictionary.loadingState.noResults}
          </p>
        </Section>

        <Section title={dictionary.sections.subscriptionTimeline}>
          <TimelineSection
            dictionary={dictionary}
            items={timelineItems}
            locale={locale}
          />
        </Section>

        {/* Renewal History + Billing Information */}
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.renewalHistory}>
            <p className="py-4 text-sm text-[#66758a]">
              {dictionary.loadingState.noResults}
            </p>
          </Section>

          <Section title={dictionary.sections.billingInformation}>
            <DetailList
              items={[
                [
                  dictionary.fields.billingContact,
                  subscription.center.owner?.fullName ?? "—",
                ],
                [
                  dictionary.fields.billingEmail,
                  subscription.center.owner?.email ?? "—",
                ],
                [
                  dictionary.editModal.notesLabel,
                  subscription.billingNotes ?? "—",
                ],
                [
                  dictionary.editModal.notificationPhoneLabel,
                  subscription.notificationPhone ?? "—",
                ],
              ]}
            />
          </Section>
        </div>

        {/* Internal Notes */}
        <Section title={dictionary.sections.internalNotes}>
          <label className="block min-w-0">
            <span className="text-sm font-medium text-[#24364f]">
              {dictionary.notes.label}
            </span>
            <textarea
              className="mt-2 min-h-36 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
              placeholder={dictionary.notes.placeholder}
            />
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#66758a]">{dictionary.notes.helper}</p>
            <button
              className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
              type="button"
            >
              {dictionary.detailActions.saveNotes}
            </button>
          </div>
        </Section>
      </div>

      {/* Renew modal */}
      {showRenewModal && (
        <RenewModal
          dictionary={dictionary}
          endDate={renewEndDate}
          isRtl={isRtl}
          onClose={() => {
            if (!actionLoading) setShowRenewModal(false);
          }}
          onConfirm={() => void handleRenew()}
          onEndDateChange={setRenewEndDate}
          onStartDateChange={setRenewStartDate}
          saving={actionLoading === "renew"}
          startDate={renewStartDate}
        />
      )}

      {/* Suspend / Cancel confirm modal */}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          dictionary={dictionary}
          isRtl={isRtl}
          onClose={() => {
            if (!actionLoading) setConfirmAction(null);
          }}
          onConfirm={() =>
            void (confirmAction === "suspend"
              ? handleSuspend()
              : handleCancel())
          }
          saving={
            actionLoading === "suspend" || actionLoading === "cancel"
          }
        />
      )}
    </SuperAdminLayout>
  );
}
