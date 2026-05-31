"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { RoyalCareLogo } from "@/components/brand/RoyalCareLogo";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { superAdminShellDictionaries } from "@/i18n/dictionaries/super-admin-shell";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  supportedLocales,
  type SupportedLocale,
} from "@/i18n/locales";
import {
  listSuperAdminNotifications,
  markAllSuperAdminNotificationsRead,
  markSuperAdminNotificationRead,
  notifySuperAdminNotificationsUpdated,
  SUPER_ADMIN_NOTIFICATIONS_UPDATED_EVENT,
  type SuperAdminNotification,
} from "@/lib/api/super-admin-notifications";
import { getSuperAdminMe, logoutSuperAdmin } from "@/lib/api/super-admin-auth";

const navigationItems = [
  { key: "dashboard", href: "/super-admin/dashboard" },
  { key: "centers", href: "/super-admin/centers" },
  { key: "subscriptions", href: "/super-admin/subscriptions" },
  { key: "domains", href: "/super-admin/domains" },
  { key: "plans", href: "/super-admin/plans" },
  { key: "users", href: "/super-admin/users" },
  { key: "notifications", href: "/super-admin/notifications" },
  { key: "auditLogs", href: "/super-admin/audit-logs" },
  { key: "settings", href: "/super-admin/settings" },
] as const;

type NavigationKey = (typeof navigationItems)[number]["key"];

// Marketing nav items are kept separate so existing pages don't need updating.
const marketingNavItems = [
  { key: "platformTracking", href: "/super-admin/marketing/platform-tracking" },
  { key: "leads", href: "/super-admin/leads" },
] as const;

type MarketingNavKey = (typeof marketingNavItems)[number]["key"];

export type AnyNavKey = NavigationKey | MarketingNavKey;

const marketingNavLabels: Record<SupportedLocale, { sectionTitle: string } & Record<MarketingNavKey, string>> = {
  en: { sectionTitle: "Marketing", platformTracking: "Platform Tracking", leads: "Center Leads" },
  ar: { sectionTitle: "التسويق", platformTracking: "تتبع المنصة", leads: "طلبات المراكز" },
  he: { sectionTitle: "שיווק", platformTracking: "מעקב פלטפורמה", leads: "פניות מרכזים" },
};

function getRelativeDateLabel(
  value: string,
  labels: (typeof superAdminShellDictionaries)["en"]["notifications"],
) {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(created);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - day.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays <= 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  return labels.daysAgo(diffDays);
}

function resolveLocalizedText(
  value: Record<string, string> | null | undefined,
  locale: SupportedLocale,
  fallback: string,
) {
  return value?.[locale] ?? value?.en ?? fallback;
}

function SuperAdminNotificationBell({
  locale,
}: {
  locale: SupportedLocale;
}) {
  const labels = superAdminShellDictionaries[locale].notifications;
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SuperAdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listSuperAdminNotifications({
        pageSize: 5,
        unreadOnly: true,
      });
      setNotifications(result.data);
      setUnreadCount(result.stats.unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function refreshFromEvent() {
      void fetchUnreadNotifications();
    }

    const initialLoad = window.setTimeout(
      () => void fetchUnreadNotifications(),
      0,
    );
    const interval = window.setInterval(
      () => void fetchUnreadNotifications(),
      30_000,
    );
    window.addEventListener(
      SUPER_ADMIN_NOTIFICATIONS_UPDATED_EVENT,
      refreshFromEvent,
    );

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener(
        SUPER_ADMIN_NOTIFICATIONS_UPDATED_EVENT,
        refreshFromEvent,
      );
    };
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function openNotification(notification: SuperAdminNotification) {
    try {
      await markSuperAdminNotificationRead(notification.id);
      setUnreadCount((count) => Math.max(0, count - 1));
      notifySuperAdminNotificationsUpdated();
    } catch {
      // Navigation still proceeds; read state can be retried from the page.
    }

    router.push(
      notification.actionUrl ??
        `/super-admin/subscriptions?centerId=${notification.centerId}`,
    );
  }

  async function markAllRead() {
    try {
      await markAllSuperAdminNotificationsRead();
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
      notifySuperAdminNotificationsUpdated();
    } catch {
      // Keep the dropdown open so the user can retry.
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-label={labels.bell}
        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#0B2D5C] transition hover:border-[#0B2D5C]/30 hover:bg-[#F8FAFC]"
        onClick={() => {
          setIsOpen((current) => !current);
          void fetchUnreadNotifications();
        }}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 end-[-6px] flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_22px_60px_rgba(11,45,92,0.18)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#0B2D5C]">
                {labels.bell}
              </p>
              <p className="text-xs text-[#66758a]">
                {unreadCount} {labels.unread}
              </p>
            </div>
            <button
              className="text-xs font-semibold text-[#0B2D5C] hover:text-[#C8A45D]"
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
              type="button"
            >
              {labels.markAllRead}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading ? (
              <AdminState
                className="m-2 min-h-28"
                loading
                title={labels.bell}
              />
            ) : notifications.length === 0 ? (
              <AdminState className="m-2 min-h-28" title={labels.empty} />
            ) : (
              notifications.map((notification) => (
                <button
                  className="block w-full rounded-md px-3 py-3 text-start transition hover:bg-[#F8FAFC]"
                  key={notification.id}
                  onClick={() => void openNotification(notification)}
                  type="button"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-[#0B2D5C]">
                    {resolveLocalizedText(
                      notification.title,
                      locale,
                      notification.type ?? notification.eventKey,
                    )}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#66758a]">
                    {resolveLocalizedText(notification.body, locale, "")}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#C8A45D]">
                    {notification.centerName ?? notification.center.name} ·{" "}
                    {getRelativeDateLabel(notification.createdAt, labels)}
                  </p>
                </button>
              ))
            )}
          </div>

          <a
            className="block border-t border-[#E5E7EB] px-4 py-3 text-center text-sm font-semibold text-[#0B2D5C] hover:bg-[#F8FAFC]"
            href="/super-admin/notifications"
          >
            {labels.viewAll}
          </a>
        </div>
      )}
    </div>
  );
}

type SuperAdminLayoutDictionary = {
  brand: {
    name: string;
    console: string;
  };
  languages: Record<SupportedLocale, string>;
  shell: {
    menu: string;
    close: string;
  };
  nav: Record<NavigationKey, string>;
  header: {
    eyebrow: string;
    title: string;
    subtitle: string;
    language: string;
    account: string;
  };
};

function NavItem({
  isActive,
  href,
  label,
  onNavigate,
}: {
  isActive: boolean;
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <a
        className={`flex min-h-12 items-center rounded-md border-y border-e border-s-4 px-4 py-2.5 text-[15px] transition ${
          isActive
            ? "border-y-white/10 border-e-white/10 border-s-[#C8A45D] bg-[#123B72] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(200,164,93,0.12)]"
            : "border-y-transparent border-e-transparent border-s-transparent font-medium text-white/84 hover:border-y-white/10 hover:border-e-white/10 hover:border-s-[#C8A45D]/45 hover:bg-[#123B72]/55 hover:text-white"
        }`}
        href={href}
        onClick={onNavigate}
      >
        {label}
      </a>
    </li>
  );
}

function NavigationList({
  activeNav,
  dictionary,
  locale,
  onNavigate,
}: {
  activeNav: AnyNavKey;
  dictionary: SuperAdminLayoutDictionary;
  locale: SupportedLocale;
  onNavigate?: () => void;
}) {
  const mktLabels = marketingNavLabels[locale];

  return (
    <nav className="px-4 py-6">
      <ul className="space-y-2">
        {navigationItems.map((item) => (
          <NavItem
            key={item.key}
            href={item.href}
            isActive={item.key === activeNav}
            label={dictionary.nav[item.key]}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      <div className="mt-6">
        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
          {mktLabels.sectionTitle}
        </p>
        <ul className="space-y-2">
          {marketingNavItems.map((item) => (
            <NavItem
              key={item.key}
              href={item.href}
              isActive={item.key === activeNav}
              label={mktLabels[item.key]}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function SuperAdminLayout({
  activeNav,
  children,
  dictionary,
}: {
  activeNav: AnyNavKey;
  children: ReactNode;
  dictionary: SuperAdminLayoutDictionary;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { direction, locale, setLocale } = useLanguage();
  const isRtl = direction === "rtl";
  const router = useRouter();
  const shellDict = superAdminShellDictionaries[locale];

  useEffect(() => {
    getSuperAdminMe().catch(() => {
      router.replace("/super-admin/login");
    });
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutSuperAdmin();
    } catch {
      // proceed regardless
    }
    router.replace("/super-admin/login");
  }

  return (
    <div
      className="min-h-screen w-full max-w-full bg-[#F8FAFC] text-[#132238]"
      dir={direction}
      lang={locale}
    >
      <div
        className={`flex min-h-screen w-full max-w-full ${
          isRtl ? "lg:flex-row-reverse" : ""
        }`}
      >
        <aside className="hidden w-72 shrink-0 border-e border-[#E5E7EB] bg-[#0B2D5C] text-white shadow-[12px_0_30px_rgba(11,45,92,0.08)] lg:block">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <RoyalCareLogo
              className="h-11 w-11 rounded-md border border-white/15 bg-white"
              priority
              variant="mark"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                {dictionary.brand.name}
              </p>
              <p className="truncate text-xs text-white/65">
                {dictionary.brand.console}
              </p>
            </div>
          </div>

          <NavigationList activeNav={activeNav} dictionary={dictionary} locale={locale} />
        </aside>

        {isMenuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label={dictionary.shell.close}
              className="absolute inset-0 bg-[#0B2D5C]/45"
              onClick={() => setIsMenuOpen(false)}
              type="button"
            />
            <aside
              className={`absolute top-0 h-full w-72 max-w-[86vw] overflow-y-auto bg-[#0B2D5C] text-white shadow-2xl ${
                isRtl ? "right-0" : "left-0"
              }`}
            >
              <div className="flex min-h-20 items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <RoyalCareLogo
                    className="h-11 w-11 shrink-0 rounded-md border border-white/15 bg-white"
                    priority
                    variant="mark"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {dictionary.brand.name}
                    </p>
                    <p className="truncate text-xs text-white/65">
                      {dictionary.brand.console}
                    </p>
                  </div>
                </div>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/8 text-sm font-semibold leading-none text-white transition hover:bg-white/14 focus:outline-none focus:ring-3 focus:ring-[#C8A45D]/25"
                  onClick={() => setIsMenuOpen(false)}
                  type="button"
                >
                  <span aria-hidden="true">X</span>
                  <span className="sr-only">{dictionary.shell.close}</span>
                </button>
              </div>
              <NavigationList
                activeNav={activeNav}
                dictionary={dictionary}
                locale={locale}
                onNavigate={() => setIsMenuOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 max-w-full flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
            <div className="flex min-h-20 min-w-0 max-w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex min-w-0 max-w-full items-start gap-3">
                <button
                  aria-label={dictionary.shell.menu}
                  className={buttonClassName(
                    "secondary",
                    "icon",
                    "mt-1 shrink-0 shadow-sm lg:hidden",
                  )}
                  onClick={() => setIsMenuOpen(true)}
                  type="button"
                >
                  <span aria-hidden="true" className="space-y-1">
                    <span className="block h-0.5 w-4 rounded-full bg-[#0B2D5C]" />
                    <span className="block h-0.5 w-4 rounded-full bg-[#0B2D5C]" />
                    <span className="block h-0.5 w-4 rounded-full bg-[#0B2D5C]" />
                  </span>
                  <span className="sr-only">{dictionary.shell.menu}</span>
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                    {dictionary.header.eyebrow}
                  </p>
                  <h1 className="mt-1 text-xl font-semibold leading-snug text-[#0B2D5C] sm:text-2xl">
                    {dictionary.header.title}
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66758a]">
                    {dictionary.header.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-3 sm:w-auto">
                <SuperAdminNotificationBell locale={locale} />

                <label className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#40516a]">
                  <span className="shrink-0">{dictionary.header.language}</span>
                  <select
                    className="min-w-0 max-w-full bg-transparent text-sm font-medium text-[#0B2D5C] outline-none"
                    onChange={(event) =>
                      setLocale(event.target.value as SupportedLocale)
                    }
                    value={locale}
                  >
                    {supportedLocales.map((item) => (
                      <option key={item} value={item}>
                        {dictionary.languages[item]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-sm font-medium text-[#24364f]">
                  <RoyalCareLogo
                    className="h-7 w-7 shrink-0 rounded-full border border-[#E5E7EB] bg-white"
                    variant="mark"
                  />
                  <span className="truncate">{dictionary.header.account}</span>
                </div>

                <button
                  className={buttonClassName("secondary", "md", "shrink-0")}
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  type="button"
                >
                  {isLoggingOut ? "…" : shellDict.logout}
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 max-w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
