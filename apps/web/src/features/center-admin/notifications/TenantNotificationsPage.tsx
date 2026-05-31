"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { CenterAdminShell } from "@/features/center-admin/layout/CenterAdminShell";
import { formatDate } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  listTenantNotifications,
  markTenantNotificationRead,
  type TenantNotification,
} from "@/lib/api/tenant-notifications";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";

type FilterMode = "all" | "unread";

// Detect Latin-1 misread of UTF-8 Arabic (Ø=U+00D8, Ù=U+00D9) or Hebrew (×=U+00D7) bytes.
// These characters cannot appear legitimately in Arabic or Hebrew notification text.
function isMojibake(text: string): boolean {
  return /[×ØÙ]/.test(text);
}

function resolveText(
  json: Record<string, string> | null | undefined,
  locale: string,
  fallback = "",
): string {
  if (!json || typeof json !== "object" || Array.isArray(json)) return fallback;
  const text = json[locale] ?? json["en"] ?? Object.values(json)[0] ?? "";
  if (isMojibake(text)) return fallback;
  return text;
}

function typeTone(
  type: string | null,
): "amber" | "danger" | "emerald" | "neutral" {
  if (type === "SUBSCRIPTION_EXPIRED") return "danger";
  if (type === "SUBSCRIPTION_EXPIRING") return "amber";
  if (type === "BOOKING_REQUEST_CREATED") return "emerald";
  return "neutral";
}

function typeLabel(
  type: string | null,
  d: CenterAdminDictionary["notifications"],
): string {
  if (type === "SUBSCRIPTION_EXPIRED") return d.typeExpired;
  if (type === "SUBSCRIPTION_EXPIRING") return d.typeExpiring;
  if (type === "BOOKING_REQUEST_CREATED") return d.typeBookingRequest;
  return type ?? "—";
}

function statusLabel(
  status: string,
  d: CenterAdminDictionary["notifications"],
): string {
  if (status === "PENDING") return d.statusPending;
  if (status === "SENT") return d.statusSent;
  if (status === "FAILED") return d.statusFailed;
  return status;
}

function resolveActionUrl(notification: TenantNotification) {
  const actionUrl = notification.metadata?.actionUrl;
  return typeof actionUrl === "string" && actionUrl.startsWith("/")
    ? actionUrl
    : null;
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "danger" | "emerald" | "neutral" | "slate";
}) {
  const styles: Record<typeof tone, string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
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

function NotificationCard({
  dictionary,
  locale,
  notification,
  onOpen,
  onRead,
}: {
  dictionary: CenterAdminDictionary["notifications"];
  locale: SupportedLocale;
  notification: TenantNotification;
  onOpen: (notification: TenantNotification) => void;
  onRead: (id: string) => Promise<void>;
}) {
  const [readStatus, setReadStatus] = useState<"idle" | "loading" | "done">(
    notification.readAt ? "done" : "idle",
  );
  const isRead = readStatus === "done" || notification.readAt !== null;

  const title = resolveText(notification.title, locale, dictionary.corruptedFallback) || notification.eventKey;
  const body = resolveText(notification.body, locale, "");
  const tone = typeTone(notification.type);
  const actionUrl = resolveActionUrl(notification);

  async function handleMarkRead() {
    setReadStatus("loading");
    try {
      await onRead(notification.id);
      setReadStatus("done");
    } catch {
      setReadStatus("idle");
    }
  }

  return (
    <article
      className={`relative min-w-0 rounded-lg border bg-white p-4 shadow-[0_2px_8px_rgba(11,45,92,0.05)] transition-[box-shadow,border-color] duration-150 hover:shadow-[0_8px_24px_rgba(11,45,92,0.09)] ${
        actionUrl ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C8A45D]" : ""
      } ${
        isRead
          ? "border-[#E5E7EB] opacity-70"
          : tone === "danger"
            ? "border-rose-300"
            : tone === "amber"
              ? "border-amber-300"
              : "border-[#C8A45D]/50"
      }`}
      onClick={actionUrl ? () => onOpen(notification) : undefined}
      onKeyDown={
        actionUrl
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(notification);
              }
            }
          : undefined
      }
      role={actionUrl ? "button" : undefined}
      tabIndex={actionUrl ? 0 : undefined}
    >
      {/* Unread dot */}
      {!isRead && (
        <span
          aria-label="Unread"
          className={`absolute end-4 top-4 h-2.5 w-2.5 rounded-full ${
            tone === "danger"
              ? "bg-rose-500"
              : tone === "amber"
                ? "bg-amber-500"
                : "bg-[#0B2D5C]"
          }`}
        />
      )}

      <div className="pe-6">
        <p
          className={`break-words font-semibold leading-5 ${
            isRead ? "text-[#66758a]" : "text-[#0B2D5C]"
          }`}
        >
          {title}
        </p>

        {body && (
          <p className="mt-1.5 break-words text-sm leading-5 text-[#526176]">
            {body}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge label={typeLabel(notification.type, dictionary)} tone={tone} />
          <Badge
            label={statusLabel(notification.status, dictionary)}
            tone={
              notification.status === "SENT"
                ? "emerald"
                : notification.status === "FAILED"
                  ? "danger"
                  : "slate"
            }
          />
          {isRead && (
            <Badge label={dictionary.markedRead} tone="emerald" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#66758a]">
            {formatDate(notification.createdAt, locale)}
          </p>
          {!isRead && (
            <button
              className={buttonClassName("secondary", "sm")}
              disabled={readStatus === "loading"}
              onClick={(event) => {
                event.stopPropagation();
                void handleMarkRead();
              }}
              type="button"
            >
              {readStatus === "loading"
                ? dictionary.markingRead
                : dictionary.markAsRead}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4"
          key={i}
        >
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsContent({
  dictionary,
  locale,
}: {
  dictionary: CenterAdminDictionary;
  locale: SupportedLocale;
}) {
  const router = useRouter();
  const d = dictionary.notifications;
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      listTenantNotifications({ unreadOnly: filter === "unread", pageSize: 50 })
        .then((res) => {
          if (cancelled) return;
          setNotifications(res.data);
          setUnreadCount(res.unreadCount);
          setTotal(res.pagination.total);
        })
        .catch(() => {
          if (!cancelled) setError(d.loadError);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filter, d.loadError, refreshTick]);

  useEffect(() => {
    const handler = () => setRefreshTick((tick) => tick + 1);
    window.addEventListener("tenant-notifications-updated", handler);
    return () =>
      window.removeEventListener("tenant-notifications-updated", handler);
  }, []);

  async function handleRead(id: string) {
    await markTenantNotificationRead(id);
    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    window.dispatchEvent(new Event("tenant-notifications-updated"));
  }

  function handleOpen(notification: TenantNotification) {
    const actionUrl = resolveActionUrl(notification);
    if (!actionUrl) return;
    if (!notification.readAt) {
      void handleRead(notification.id);
    }
    router.push(actionUrl);
  }

  return (
    <div className="mt-5 min-w-0 space-y-5">
      {/* Stats bar */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              {d.unreadCount(unreadCount)}
            </span>
          )}
          {!isLoading && (
            <span className="text-sm text-[#66758a]">
              {total} total
            </span>
          )}
        </div>
        {/* Filter segment control */}
        <div className="flex gap-1 rounded-lg bg-[#F1F5F9] p-1">
          {(["all", "unread"] as FilterMode[]).map((f) => (
            <button
              className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${
                filter === f
                  ? "bg-white text-[#0B2D5C] shadow-sm"
                  : "text-[#66758a] hover:bg-white/60 hover:text-[#0B2D5C]"
              }`}
              key={f}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "all" ? d.filterAll : d.filterUnread}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonCards />
      ) : error ? (
        <AdminState title={error} tone="error" />
      ) : notifications.length === 0 ? (
        <AdminState
          body={filter === "unread" ? d.emptyUnreadBody : d.emptyBody}
          className="border-dashed"
          title={filter === "unread" ? d.emptyUnreadTitle : d.emptyTitle}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <NotificationCard
              dictionary={d}
              key={n.id}
              locale={locale}
              notification={n}
              onOpen={handleOpen}
              onRead={handleRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TenantNotificationsPage() {
  const { locale: rawLocale } = useLanguage();
  const locale = rawLocale as SupportedLocale;

  return (
    <CenterAdminShell
      activeNav="notifications"
      subtitle={(d) => d.notifications.subtitle}
      title={(d) => d.notifications.title}
    >
      {({ dictionary }) => (
        <NotificationsContent dictionary={dictionary} locale={locale} />
      )}
    </CenterAdminShell>
  );
}
