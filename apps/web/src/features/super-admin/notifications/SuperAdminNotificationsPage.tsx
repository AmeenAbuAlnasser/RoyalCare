"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import {
  SuperAdminActionMenu,
  type SuperAdminActionMenuItem,
} from "@/features/super-admin/components/SuperAdminActionMenu";
import { WhatsAppModal } from "@/features/super-admin/components/WhatsAppModal";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminNotificationsDictionaries } from "@/i18n/dictionaries/super-admin-notifications";
import { formatDate, formatNumber } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  listSuperAdminNotifications,
  logManualWhatsAppAction,
  markAllSuperAdminNotificationsRead,
  markSuperAdminNotificationRead,
  notifySuperAdminNotificationsUpdated,
  updateSuperAdminNotificationStatus,
  type NotificationStatus,
  type NotificationType,
  type SuperAdminNotification,
} from "@/lib/api/super-admin-notifications";
import { resolveWhatsAppPhone } from "@/lib/whatsapp";

type Dictionary = (typeof superAdminNotificationsDictionaries)["en"];

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
  tone: "amber" | "danger" | "emerald" | "indigo" | "navy" | "neutral" | "slate";
}) {
  const styles: Record<typeof tone, string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    slate: "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function statusTone(
  status: NotificationStatus,
): "amber" | "emerald" | "danger" | "slate" {
  if (status === "PENDING") return "amber";
  if (status === "SENT") return "emerald";
  if (status === "FAILED") return "danger";
  return "slate";
}

function typeTone(
  type: NotificationType | null,
): "danger" | "amber" | "indigo" | "neutral" {
  if (type === "SUBSCRIPTION_EXPIRED") return "danger";
  if (type === "SUBSCRIPTION_SUSPENDED") return "danger";
  if (type === "SUBSCRIPTION_EXPIRING") return "amber";
  if (type === "TRIAL_ENDING_SOON") return "amber";
  if (type === "SUBSCRIPTION_RENEWAL_REQUEST") return "indigo";
  if (type === "SUBSCRIPTION_RENEWED") return "neutral";
  if (type === "MISSING_WHATSAPP_PHONE") return "amber";
  return "neutral";
}

function resolveTitle(
  notification: SuperAdminNotification,
  locale: string,
  dictionary: Dictionary,
): string {
  if (notification.title) {
    const t = notification.title as Record<string, string>;
    return t[locale] ?? t["en"] ?? notification.type ?? notification.eventKey;
  }
  if (notification.type) {
    return dictionary.types[notification.type] ?? notification.type;
  }
  return notification.eventKey;
}

function resolveBody(
  notification: SuperAdminNotification,
  locale: string,
): string {
  if (notification.body) {
    const b = notification.body as Record<string, string>;
    return b[locale] ?? b["en"] ?? "";
  }
  return "";
}

// ─── Shared: build action menu items based on notification type ──────────────

function buildActionItems(
  notification: SuperAdminNotification,
  dictionary: Dictionary,
  handlers: {
    onMarkAsHandled: () => void;
    onOpenSubscription: () => void;
    onWhatsApp: () => void;
  },
): SuperAdminActionMenuItem[] {
  const openAction = {
    icon: "renew" as const,
    label: dictionary.actions.openSubscription,
    onSelect: handlers.onOpenSubscription,
  };

  if (notification.type === "SUBSCRIPTION_RENEWAL_REQUEST") {
    return [
      openAction,
      {
        icon: "activate",
        label: dictionary.actions.markAsRead,
        onSelect: handlers.onMarkAsHandled,
        tone: "success",
      },
      {
        icon: "whatsapp",
        label: dictionary.actions.sendWhatsApp,
        onSelect: handlers.onWhatsApp,
        tone: "success",
      },
    ];
  }
  return [
    openAction,
    {
      icon: "activate",
      label: dictionary.actions.markAsRead,
      onSelect: handlers.onMarkAsHandled,
      tone: "success",
    },
    {
      icon: "whatsapp",
      label: dictionary.actions.sendWhatsApp,
      onSelect: handlers.onWhatsApp,
      tone: "success",
    },
  ];
}

// ─── Desktop table row ───────────────────────────────────────────────────────

function NotificationRow({
  dictionary,
  isActionOpen,
  locale,
  notification,
  onCloseAction,
  onMarkAsHandled,
  onOpenSubscription,
  onToggleAction,
  onWhatsApp,
}: {
  dictionary: Dictionary;
  isActionOpen: boolean;
  locale: SupportedLocale;
  notification: SuperAdminNotification;
  onCloseAction: () => void;
  onMarkAsHandled: () => void;
  onOpenSubscription: () => void;
  onToggleAction: () => void;
  onWhatsApp: () => void;
}) {
  const title = resolveTitle(notification, locale, dictionary);
  const body = resolveBody(notification, locale);
  const typeLabel = notification.type
    ? (dictionary.types[notification.type] ?? notification.type)
    : "—";
  const statusLabel =
    notification.readAt ? dictionary.statuses.read : dictionary.statuses.unread;
  const channelLabel =
    dictionary.channels[notification.channel] ?? notification.channel;

  const items = buildActionItems(notification, dictionary, {
    onMarkAsHandled,
    onOpenSubscription,
    onWhatsApp,
  });

  return (
    <tr className="border-t border-[#E5E7EB] transition-colors duration-100 hover:bg-[#F8FAFC]">
      <td className="max-w-[340px] px-4 py-4">
        <div className="min-w-0">
          <p className="break-words font-semibold text-[#0B2D5C]">{title}</p>
          {body && (
            <p className="mt-1 break-words text-sm leading-5 text-[#66758a]">
              {body}
            </p>
          )}
          {(notification.manualAttempts ?? 0) > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                WhatsApp ×{notification.manualAttempts}
              </span>
              {notification.manualWhatsApp?.lastAction && (
                <span className="text-xs text-[#66758a]" dir="ltr">
                  {notification.manualWhatsApp.lastAction === "OPENED_WHATSAPP"
                    ? `${dictionary.whatsappAttempts.lastAttempt}: ${dictionary.whatsappAttempts.opened} +${notification.manualWhatsApp.lastPhone ?? ""}`
                    : `${dictionary.whatsappAttempts.lastAttempt}: ${dictionary.whatsappAttempts.copied}`}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <Badge label={typeLabel} tone={typeTone(notification.type)} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#526176]">
        {channelLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#526176]">
        {notification.center.name}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#526176]">
        {formatDate(notification.createdAt, locale)}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <Badge label={statusLabel} tone={statusTone(notification.status)} />
      </td>
      <td className="px-4 py-4 align-top">
        <SuperAdminActionMenu
          isOpen={isActionOpen}
          items={items}
          onClose={onCloseAction}
          onToggle={onToggleAction}
          triggerLabel={`${dictionary.table.actions} ${notification.id}`}
        />
      </td>
    </tr>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function NotificationMobileCard({
  dictionary,
  isActionOpen,
  locale,
  notification,
  onCloseAction,
  onMarkAsHandled,
  onOpenSubscription,
  onToggleAction,
  onWhatsApp,
}: {
  dictionary: Dictionary;
  isActionOpen: boolean;
  locale: SupportedLocale;
  notification: SuperAdminNotification;
  onCloseAction: () => void;
  onMarkAsHandled: () => void;
  onOpenSubscription: () => void;
  onToggleAction: () => void;
  onWhatsApp: () => void;
}) {
  const title = resolveTitle(notification, locale, dictionary);
  const body = resolveBody(notification, locale);
  const typeLabel = notification.type
    ? (dictionary.types[notification.type] ?? notification.type)
    : "—";
  const statusLabel =
    notification.readAt ? dictionary.statuses.read : dictionary.statuses.unread;
  const channelLabel =
    dictionary.channels[notification.channel] ?? notification.channel;

  const items = buildActionItems(notification, dictionary, {
    onMarkAsHandled,
    onOpenSubscription,
    onWhatsApp,
  });

  return (
    <article className="relative min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(11,45,92,0.05)]">
      {/* Action button — absolute at top-end (RTL-safe via logical `end`) */}
      <div className="absolute end-3 top-3">
        <SuperAdminActionMenu
          isOpen={isActionOpen}
          items={items}
          onClose={onCloseAction}
          onToggle={onToggleAction}
          triggerLabel={`${dictionary.table.actions} ${notification.id}`}
        />
      </div>

      {/* Title — right-pad to avoid overlapping the action button */}
      <p className="pe-10 break-words font-semibold leading-5 text-[#0B2D5C]">
        {title}
      </p>

      {/* Status + type badges */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge label={statusLabel} tone={statusTone(notification.status)} />
        <Badge label={typeLabel} tone={typeTone(notification.type)} />
      </div>

      {/* Body text */}
      {body && (
        <p className="mt-2 break-words text-sm leading-5 text-[#66758a]">
          {body}
        </p>
      )}

      {/* Meta row: center · date · channel */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526176]">
        <span className="font-medium text-[#24364f]">
          {notification.center.name}
        </span>
        <span className="select-none text-[#CBD5E1]">·</span>
        <span>{formatDate(notification.createdAt, locale)}</span>
        <span className="select-none text-[#CBD5E1]">·</span>
        <span>{channelLabel}</span>
      </div>

      {/* WhatsApp attempts */}
      {(notification.manualAttempts ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            WhatsApp ×{notification.manualAttempts}
          </span>
          {notification.manualWhatsApp?.lastAction && (
            <span className="text-xs text-[#66758a]" dir="ltr">
              {notification.manualWhatsApp.lastAction === "OPENED_WHATSAPP"
                ? `${dictionary.whatsappAttempts.lastAttempt}: ${dictionary.whatsappAttempts.opened} +${notification.manualWhatsApp.lastPhone ?? ""}`
                : `${dictionary.whatsappAttempts.lastAttempt}: ${dictionary.whatsappAttempts.copied}`}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Mobile skeleton ─────────────────────────────────────────────────────────

function MobileSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {[0, 1, 2].map((i) => (
        <div
          className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4"
          key={i}
        >
          {/* Title */}
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
          {/* Badges */}
          <div className="mt-2.5 flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
          </div>
          {/* Body lines */}
          <div className="mt-3 space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="h-3 w-28 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-14 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type NotificationFilter =
  | "all"
  | "unread"
  | "subscriptions"
  | "renewal_requests"
  | "system_alerts";

export function SuperAdminNotificationsPage() {
  const router = useRouter();
  const { direction, locale: rawLocale } = useLanguage();
  const locale = rawLocale as SupportedLocale;
  const dictionary = superAdminNotificationsDictionaries[locale];
  const [openDesktopActions, setOpenDesktopActions] = useState<string | null>(null);
  const [openMobileActions, setOpenMobileActions] = useState<string | null>(null);
  const [whatsAppTarget, setWhatsAppTarget] =
    useState<SuperAdminNotification | null>(null);
  const [whatsAppOverrideMessage, setWhatsAppOverrideMessage] = useState<string | null>(null);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [notificationFilter, setNotificationFilter] =
    useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState<SuperAdminNotification[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
            sentToday: 0,
            unread: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkAsHandled(notificationId: string) {
    if (handlingId === notificationId) return;
    setHandlingId(notificationId);
    try {
      await updateSuperAdminNotificationStatus(notificationId, "SENT");
      await markSuperAdminNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                readAt: new Date().toISOString(),
                status: "SENT" as NotificationStatus,
              }
            : n,
        ),
      );
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
      notifySuperAdminNotificationsUpdated();
    } catch {
      // fail silently — user can retry from the action menu
    } finally {
      setHandlingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listSuperAdminNotifications({
          pageSize: 50,
          category:
            notificationFilter === "all" || notificationFilter === "unread"
              ? undefined
              : notificationFilter,
          unreadOnly: notificationFilter === "unread",
        });

        if (!cancelled) {
          setNotifications(result.data);
          setStats(result.stats);
        }
      } catch {
        if (!cancelled) {
          setError("Notifications could not be loaded. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [notificationFilter]);

  const filtered = search.trim()
    ? notifications.filter((n) =>
        n.center.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : notifications;

  const statCards = [
    { key: "totalNotifications", value: stats.total },
    { key: "pending", value: stats.unread },
    { key: "sent", value: stats.sent },
    { key: "sentToday", value: stats.sentToday },
  ] as const;

  async function handleMarkAllRead() {
    try {
      await markAllSuperAdminNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? now })),
      );
      setStats((prev) => ({ ...prev, unread: 0 }));
      notifySuperAdminNotificationsUpdated();
    } catch {
      setError(dictionary.empty.markAllReadFailed);
    }
  }

  async function handleOpenNotification(notification: SuperAdminNotification) {
    if (!notification.readAt) {
      try {
        await markSuperAdminNotificationRead(notification.id);
        notifySuperAdminNotificationsUpdated();
      } catch {
        // The target page is still useful even if read state fails.
      }
    }
    router.push(
      notification.actionUrl ??
        `/super-admin/subscriptions?centerId=${notification.centerId}`,
    );
  }

  return (
    <SuperAdminLayout activeNav="notifications" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">

        {/* KPI cards */}
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
              key={stat.key}
            >
              <p className="text-sm font-medium text-[#66758a]">
                {dictionary.stats[stat.key]}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {isLoading ? "—" : formatNumber(stat.value)}
              </p>
            </article>
          ))}
        </section>

        {/* Search + Filters */}
        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.searchLabel}
              </span>
              <input
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
                value={search}
              />
            </label>
            <div className="flex min-w-0 flex-wrap gap-2">
              {(
                [
                  ["all", dictionary.filters.all],
                  ["unread", dictionary.filters.unread],
                  ["subscriptions", dictionary.filters.subscription],
                  ["renewal_requests", dictionary.filters.renewalRequests],
                  ["system_alerts", dictionary.filters.systemAlerts],
                ] as [NotificationFilter, string][]
              ).map(([value, label]) => (
                <button
                  className={buttonClassName(
                    notificationFilter === value ? "primary" : "secondary",
                    "sm",
                  )}
                  key={value}
                  onClick={() => setNotificationFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
              <button
                className={buttonClassName("secondary", "sm")}
                onClick={() => void handleMarkAllRead()}
                type="button"
              >
                {dictionary.actions.markAllAsRead}
              </button>
            </div>
          </div>
        </Section>

        {/* Notifications list */}
        <Section title={dictionary.sections.notificationsList}>
          {isLoading ? (
            <>
              {/* Desktop loading text */}
              <p className="hidden py-8 text-center text-sm text-[#66758a] md:block">
                {dictionary.loading}
              </p>
              {/* Mobile skeleton cards */}
              <MobileSkeleton />
            </>
          ) : error ? (
            <AdminState className="my-4" title={error} tone="error" />
          ) : filtered.length === 0 ? (
            <AdminState
              body={dictionary.empty.noNotificationsHint}
              className="my-4 border-dashed"
              title={dictionary.empty.noNotifications}
            />
          ) : (
            <>
              {/* ── Desktop table (hidden on mobile) ─────────────────────── */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead className="bg-[#F8FAFC] text-[#66758a]">
                    <tr>
                      {[
                        dictionary.table.notification,
                        dictionary.table.type,
                        dictionary.channels.IN_APP,
                        dictionary.table.relatedCenter,
                        dictionary.table.createdDate,
                        dictionary.table.status,
                        dictionary.table.actions,
                      ].map((label, i) => (
                        <th
                          className="px-4 py-3 text-start text-xs font-medium"
                          key={i}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((notification) => (
                      <NotificationRow
                        dictionary={dictionary}
                        isActionOpen={openDesktopActions === notification.id}
                        key={notification.id}
                        locale={locale}
                        notification={notification}
                        onCloseAction={() => setOpenDesktopActions(null)}
                        onMarkAsHandled={() => {
                          setOpenDesktopActions(null);
                          void handleMarkAsHandled(notification.id);
                        }}
                        onOpenSubscription={() => {
                          setOpenDesktopActions(null);
                          void handleOpenNotification(notification);
                        }}
                        onToggleAction={() =>
                          setOpenDesktopActions((c) =>
                            c === notification.id ? null : notification.id,
                          )
                        }
                        onWhatsApp={() => {
                          setOpenDesktopActions(null);
                          setOpenMobileActions(null);
                          if (notification.type === "SUBSCRIPTION_RENEWAL_REQUEST") {
                            setWhatsAppOverrideMessage(
                              dictionary.whatsapp.renewalRequestMessage(notification.center.name),
                            );
                          } else {
                            setWhatsAppOverrideMessage(null);
                          }
                          setWhatsAppTarget(notification);
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards (hidden on desktop) ─────────────────────── */}
              <div className="flex flex-col gap-3 md:hidden">
                {filtered.map((notification) => (
                  <NotificationMobileCard
                    dictionary={dictionary}
                    isActionOpen={openMobileActions === notification.id}
                    key={notification.id}
                    locale={locale}
                    notification={notification}
                    onCloseAction={() => setOpenMobileActions(null)}
                    onMarkAsHandled={() => {
                      setOpenMobileActions(null);
                      void handleMarkAsHandled(notification.id);
                    }}
                    onOpenSubscription={() => {
                      setOpenMobileActions(null);
                      void handleOpenNotification(notification);
                    }}
                    onToggleAction={() =>
                      setOpenMobileActions((c) =>
                        c === notification.id ? null : notification.id,
                      )
                    }
                    onWhatsApp={() => {
                      setOpenDesktopActions(null);
                      setOpenMobileActions(null);
                      if (notification.type === "SUBSCRIPTION_RENEWAL_REQUEST") {
                        setWhatsAppOverrideMessage(
                          dictionary.whatsapp.renewalRequestMessage(notification.center.name),
                        );
                      } else {
                        setWhatsAppOverrideMessage(null);
                      }
                      setWhatsAppTarget(notification);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </Section>

        {/* Templates preview */}
        <Section title={dictionary.sections.templatesPreview}>
          <p className="mb-4 text-sm leading-6 text-[#66758a]">
            {dictionary.values.templatesHint}
          </p>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                {
                  key: "SUBSCRIPTION_EXPIRING",
                  label: dictionary.types.SUBSCRIPTION_EXPIRING,
                  hint: dictionary.notifications.subscriptionExpiringMessage,
                },
                {
                  key: "SUBSCRIPTION_EXPIRED",
                  label: dictionary.types.SUBSCRIPTION_EXPIRED,
                  hint: dictionary.notifications.subscriptionExpiringMessage.replace(
                    "expires within",
                    "has expired",
                  ),
                },
              ] as const
            ).map((template) => (
              <article
                className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-4"
                key={template.key}
              >
                <p className="break-words text-sm font-semibold text-[#0B2D5C]">
                  {template.label}
                </p>
                <p className="mt-1 break-words text-xs text-[#66758a]">
                  {template.hint}
                </p>
              </article>
            ))}
          </div>
        </Section>
      </div>

      {whatsAppTarget && (
        <WhatsAppModal
          centerName={whatsAppTarget.center.name}
          defaultMessage={
            whatsAppOverrideMessage ??
            (resolveBody(whatsAppTarget, "ar") ||
              resolveBody(whatsAppTarget, "en") ||
              "")
          }
          direction={direction}
          labels={dictionary.whatsapp}
          onClose={() => {
            setWhatsAppTarget(null);
            setWhatsAppOverrideMessage(null);
          }}
          onLog={async (action, phone, message) => {
            await logManualWhatsAppAction(whatsAppTarget.id, {
              action,
              message,
              phone,
            });
            const now = new Date().toISOString();
            setNotifications((prev) =>
              prev.map((n) => {
                if (n.id !== whatsAppTarget.id) return n;
                const prevCount = n.manualAttempts ?? 0;
                const nextCount = prevCount + 1;
                return {
                  ...n,
                  manualAttempts: nextCount,
                  manualWhatsApp: {
                    attemptsCount: nextCount,
                    lastAction: action,
                    lastPhone:
                      action === "OPENED_WHATSAPP"
                        ? phone
                        : (n.manualWhatsApp?.lastPhone ?? null),
                    lastAt: now,
                  },
                };
              }),
            );
          }}
          phone={resolveWhatsAppPhone({
            notificationPhone: whatsAppTarget.center.subscriptions?.[0]?.notificationPhone,
            centerPhone: whatsAppTarget.center.owner?.phone,
            metadataPhone:
              typeof whatsAppTarget.metadata?.notificationPhone === "string"
                ? whatsAppTarget.metadata.notificationPhone
                : typeof whatsAppTarget.metadata?.phone === "string"
                  ? whatsAppTarget.metadata.phone
                  : undefined,
          })}
        />
      )}
    </SuperAdminLayout>
  );
}
