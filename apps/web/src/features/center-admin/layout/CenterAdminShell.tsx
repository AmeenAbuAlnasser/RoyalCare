"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TenantFaviconManager } from "@/components/brand/TenantFaviconManager";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  centerAdminDictionaries,
  type CenterAdminDictionary,
} from "@/i18n/dictionaries/center-admin";
import { supportedLocales, type SupportedLocale } from "@/i18n/locales";
import {
  getCenterSession,
  logoutCenterUser,
  type CenterSession,
} from "@/lib/api/center-auth";
import { getPublicSystemSettings } from "@/lib/api/system-settings";
import { listTenantBookingRequests } from "@/lib/api/tenant-booking-requests";
import {
  getTenantNotificationsStreamUrl,
  listTenantNotifications,
} from "@/lib/api/tenant-notifications";
import {
  getTenantLocaleSessionKey,
  markTenantDefaultLocaleApplied,
} from "../login/CenterLoginPage";
import { getTenantSubscriptionRestrictionMessage } from "../subscription-access";

type NavKey =
  | "dashboard"
  | "patients"
  | "appointments"
  | "bookingRequests"
  | "followUps"
  | "services"
  | "staff"
  | "billing"
  | "expenses"
  | "reports"
  | "notifications"
  | "schedule"
  | "settings"
  | "permissions"
  | "gallery"
  | "reviews"
  | "beforeAfter"
  | "team"
  | "offers"
  | "seo"
  | "domain"
  | "website"
  | "marketing"
  | "websiteAnalytics";

type CenterAdminShellProps = {
  activeNav: NavKey;
  children: (context: {
    centerLogoUrl: string | null;
    dictionary: CenterAdminDictionary;
    session: CenterSession;
  }) => ReactNode;
  requiredPermission?: string | null;
  subtitle: (dictionary: CenterAdminDictionary) => string;
  title: (dictionary: CenterAdminDictionary) => string;
};

type GroupKey = "dailyOps" | "admin" | "marketing" | "content";

const NAV_GROUPS_STORAGE_KEY = "royalcare.tenant-nav-groups";

const defaultGroupOpen: Record<GroupKey, boolean> = {
  dailyOps: true,
  admin: true,
  marketing: false,
  content: false,
};

function loadGroupOpen(): Record<GroupKey, boolean> {
  try {
    const raw = window.localStorage.getItem(NAV_GROUPS_STORAGE_KEY);
    if (!raw) return { ...defaultGroupOpen };
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      dailyOps:
        typeof p.dailyOps === "boolean"
          ? p.dailyOps
          : defaultGroupOpen.dailyOps,
      admin: typeof p.admin === "boolean" ? p.admin : defaultGroupOpen.admin,
      marketing:
        typeof p.marketing === "boolean"
          ? p.marketing
          : defaultGroupOpen.marketing,
      content:
        typeof p.content === "boolean" ? p.content : defaultGroupOpen.content,
    };
  } catch {
    return { ...defaultGroupOpen };
  }
}

function saveGroupOpen(state: Record<GroupKey, boolean>) {
  try {
    window.localStorage.setItem(NAV_GROUPS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function getActiveGroupKey(activeNav: NavKey): GroupKey | null {
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => item.key === activeNav)) {
      return group.key;
    }
  }

  return null;
}

function loadGroupOpenForActiveNav(
  activeNav: NavKey,
): Record<GroupKey, boolean> {
  const saved = loadGroupOpen();
  const activeGroupKey = getActiveGroupKey(activeNav);

  if (activeGroupKey) {
    saved[activeGroupKey] = true;
  }

  return saved;
}

type NavGroupDef = {
  key: GroupKey;
  emoji: string;
  label: (d: CenterAdminDictionary) => string;
  items: Array<{ key: NavKey; href: string; requiredPermission?: string }>;
};

const legacyTenantPermissionKeyMap: Record<string, string> = {
  "patients.view": "patients:view",
  "patients.create": "patients:create",
  "patients.update": "patients:update",
  "patients.delete": "patients:status",
  "patients.status": "patients:status",
  "appointments.view": "appointments:view",
  "appointments.create": "appointments:create",
  "appointments.update": "appointments:update",
  "appointments.cancel": "appointments:cancel",
  "appointments.status.update": "appointments:status",
  "appointments.status": "appointments:status",
  "services.view": "services:view",
  "services.create": "services:create",
  "services.update": "services:update",
  "services.archive": "services:archive",
  "services.activate": "services:status",
  "services.delete": "services:delete",
  "services.status": "services:status",
  "billing.view": "billing:view",
  "billing.create": "billing:create",
  "billing.update": "billing:update",
  "billing.mark_paid": "billing:update",
  "billing.mark-paid": "billing:update",
  "billing.cancel": "billing:cancel",
  "payments.view": "payments:view",
  "payments.create": "payments:create",
  "expenses.view": "expenses:view",
  "expenses.create": "expenses:create",
  "expenses.edit": "expenses:edit",
  "expenses.update": "expenses:edit",
  "expenses.delete": "expenses:delete",
  "expenses.reports": "expenses:reports",
  "reports.view": "reports:view",
  "settings.view": "settings:view",
  "permissions.view": "permissions:view",
  "permissions.update": "permissions:update",
  "staff.view": "staff:view",
  "staff.create": "staff:create",
  "staff.update": "staff:update",
  "staff.delete": "staff:status",
  "staff.activate": "staff:status",
  "staff.status": "staff:status",
};

// Roles that are always granted the full tenant permission set on the backend
// (see CenterAuthService.getEffectivePermissions). We mirror that here so the
// sidebar never depends on a freshly-rebuilt API or a brand-new session to show
// modules — e.g. Expenses — for owners/managers.
const FULL_ACCESS_ROLE_KEYS = ["CENTER_OWNER", "CENTER_MANAGER"];

// Module permissions that may be missing from older stored sessions. These are
// backfilled at runtime for full-access roles so no logout/login is required.
const RUNTIME_BACKFILL_PERMISSIONS = [
  "expenses:view",
  "expenses:create",
  "expenses:edit",
  "expenses:delete",
  "expenses:reports",
];

function normalizeTenantPermissions(permissions: readonly string[]) {
  return Array.from(
    new Set(
      permissions.map(
        (permission) => legacyTenantPermissionKeyMap[permission] ?? permission,
      ),
    ),
  );
}

function resolveSessionPermissions(session: CenterSession | null): string[] {
  if (!session) return [];
  const isFullAccess = FULL_ACCESS_ROLE_KEYS.includes(session.role.key);
  const base = isFullAccess
    ? [...session.permissions, ...RUNTIME_BACKFILL_PERMISSIONS]
    : session.permissions;
  return normalizeTenantPermissions(base);
}

const expenseSubnavLabels = {
  en: {
    overview: "Overview",
    list: "All expenses",
    new: "Add expense",
    categories: "Categories",
  },
  ar: {
    overview: "نظرة عامة",
    list: "جميع المصاريف",
    new: "إضافة مصروف",
    categories: "التصنيفات",
  },
  he: {
    overview: "סקירה",
    list: "כל ההוצאות",
    new: "הוספת הוצאה",
    categories: "קטגוריות",
  },
} as const;

const expenseSubnavItems = [
  { key: "overview", href: "/tenant/expenses" },
  { key: "list", href: "/tenant/expenses/list" },
  { key: "new", href: "/tenant/expenses/new" },
  { key: "categories", href: "/tenant/expenses/categories" },
] as const;

const NAV_GROUPS: NavGroupDef[] = [
  {
    key: "dailyOps",
    emoji: "📋",
    label: (d) => d.shell.navGroups.dailyOps,
    items: [
      {
        key: "patients",
        href: "/tenant/patients",
        requiredPermission: "patients:view",
      },
      {
        key: "appointments",
        href: "/tenant/appointments",
        requiredPermission: "appointments:view",
      },
      {
        key: "bookingRequests",
        href: "/tenant/booking-requests",
        requiredPermission: "appointments:view",
      },
      {
        key: "followUps",
        href: "/tenant/follow-ups",
        requiredPermission: "appointments:view",
      },
      {
        key: "billing",
        href: "/tenant/billing",
        requiredPermission: "billing:view",
      },
      { key: "staff", href: "/tenant/staff", requiredPermission: "staff:view" },
    ],
  },
  {
    key: "admin",
    emoji: "⚙️",
    label: (d) => d.shell.navGroups.admin,
    items: [
      {
        key: "services",
        href: "/tenant/services",
        requiredPermission: "services:view",
      },
      {
        key: "schedule",
        href: "/tenant/schedule",
        requiredPermission: "settings:view",
      },
      {
        key: "settings",
        href: "/tenant/settings",
        requiredPermission: "settings:view",
      },
      {
        key: "permissions",
        href: "/tenant/settings/permissions",
        requiredPermission: "permissions:view",
      },
      {
        key: "expenses",
        href: "/tenant/expenses",
        requiredPermission: "expenses:view",
      },
      {
        key: "reports",
        href: "/tenant/reports",
        requiredPermission: "reports:view",
      },
    ],
  },
  {
    key: "marketing",
    emoji: "📢",
    label: (d) => d.shell.navGroups.marketing,
    items: [
      {
        key: "website",
        href: "/tenant/settings/website",
        requiredPermission: "settings:view",
      },
      {
        key: "seo",
        href: "/tenant/settings/seo",
        requiredPermission: "settings:view",
      },
      {
        key: "domain",
        href: "/tenant/settings/domain",
        requiredPermission: "settings:view",
      },
      {
        key: "offers",
        href: "/tenant/settings/offers",
        requiredPermission: "settings:view",
      },
      {
        key: "reviews",
        href: "/tenant/settings/reviews",
        requiredPermission: "settings:view",
      },
      {
        key: "beforeAfter",
        href: "/tenant/settings/before-after",
        requiredPermission: "settings:view",
      },
      {
        key: "gallery",
        href: "/tenant/settings/gallery",
        requiredPermission: "settings:view",
      },
      {
        key: "websiteAnalytics",
        href: "/tenant/marketing",
        requiredPermission: "reports:view",
      },
      {
        key: "marketing",
        href: "/tenant/settings/marketing",
        requiredPermission: "settings:view",
      },
    ],
  },
  {
    key: "content",
    emoji: "👥",
    label: (d) => d.shell.navGroups.content,
    items: [
      {
        key: "team",
        href: "/tenant/settings/team",
        requiredPermission: "settings:view",
      },
      { key: "notifications", href: "/tenant/notifications" },
    ],
  },
];

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function mapApiLanguage(value?: string): SupportedLocale {
  if (value === "AR") {
    return "ar";
  }

  if (value === "HE") {
    return "he";
  }

  return "en";
}

function shouldApplyTenantDefaultLocale(session: CenterSession) {
  if (typeof window === "undefined") {
    return false;
  }

  return !window.sessionStorage.getItem(getTenantLocaleSessionKey(session));
}

function TenantShellSkeleton({
  dictionary,
  isRtl,
}: {
  dictionary: CenterAdminDictionary;
  isRtl: boolean;
}) {
  const sidebarBlocks = Array.from({ length: 12 }, (_, index) => index);
  const contentBlocks = Array.from({ length: 6 }, (_, index) => index);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#132238]">
      <div
        className={`min-h-screen min-w-0 lg:flex ${
          isRtl ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        <aside className="hidden h-screen w-[280px] shrink-0 bg-[#0B2D5C] p-4 lg:flex lg:flex-col">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-white/25" />
              <div className="h-2 w-20 rounded bg-white/15" />
            </div>
          </div>
          <div className="space-y-2">
            {sidebarBlocks.map((item) => (
              <div key={item} className="h-10 rounded-md bg-white/10" />
            ))}
          </div>
        </aside>
        <section className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_14px_34px_rgba(11,45,92,0.055)]">
              <div className="h-3 w-32 rounded bg-[#C8A45D]/30" />
              <div className="mt-3 h-7 w-64 max-w-full rounded bg-[#0B2D5C]/15" />
              <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-200" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {contentBlocks.map((item) => (
                <div
                  className="min-h-36 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.045)]"
                  key={item}
                >
                  <div className="h-4 w-28 rounded bg-[#0B2D5C]/15" />
                  <div className="mt-5 h-8 w-40 rounded bg-slate-200" />
                  <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
            <p className="sr-only">{dictionary.dashboard.loading}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function CenterAdminShell({
  activeNav,
  children,
  requiredPermission,
  subtitle,
  title,
}: CenterAdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { direction, locale, setLocale } = useLanguage();
  const dictionary = centerAdminDictionaries[locale];
  const isRtl = direction === "rtl";
  const [session, setSession] = useState<CenterSession | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [failedCenterLogoUrl, setFailedCenterLogoUrl] = useState<string | null>(
    null,
  );
  const [publicLogoUrl, setPublicLogoUrl] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState<"idle" | "loading">("idle");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingBookingRequests, setPendingBookingRequests] = useState(0);
  const [bookingToast, setBookingToast] = useState("");
  const bookingNotificationWatchInitializedRef = useRef(false);
  const latestBookingNotificationIdRef = useRef<string | null>(null);
  const [groupState, setGroupState] = useState<Record<GroupKey, boolean>>(() =>
    loadGroupOpenForActiveNav(activeNav),
  );

  const prefetchTenantRoute = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router],
  );

  useEffect(() => {
    let isMounted = true;

    getCenterSession()
      .then((response) => {
        if (isMounted) {
          if (shouldApplyTenantDefaultLocale(response)) {
            setLocale(mapApiLanguage(response.center.primaryLanguage));
            markTenantDefaultLocaleApplied(response);
          }

          setSession(response);
          setStatus("success");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("error");
          router.replace("/tenant/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router, setLocale]);

  useEffect(() => {
    let isMounted = true;

    void getPublicSystemSettings()
      .then((response) => {
        if (!isMounted) return;
        const fallbackLogoUrl =
          response.settings
            .find((setting) => setting.key === "public_logo_url")
            ?.value?.trim() || null;
        setPublicLogoUrl(fallbackLogoUrl);
      })
      .catch(() => {
        if (isMounted) setPublicLogoUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPendingBookingRequests = useCallback(() => {
    if (!session?.permissions.includes("appointments:view")) {
      setPendingBookingRequests(0);
      return;
    }

    listTenantBookingRequests("PENDING")
      .then((response) => setPendingBookingRequests(response.total))
      .catch(() => undefined);
  }, [session?.permissions]);

  const fetchLatestBookingNotification = useCallback(
    (showToast: boolean) => {
      listTenantNotifications({ pageSize: 5, unreadOnly: true })
        .then((response) => {
          setUnreadNotifications(response.unreadCount);
          const latestBookingNotification = response.data.find(
            (notification) =>
              notification.type === "BOOKING_REQUEST_CREATED" &&
              notification.readAt === null,
          );

          if (!latestBookingNotification) {
            bookingNotificationWatchInitializedRef.current = true;
            return;
          }

          if (!bookingNotificationWatchInitializedRef.current) {
            bookingNotificationWatchInitializedRef.current = true;
            latestBookingNotificationIdRef.current =
              latestBookingNotification.id;
            return;
          }

          if (
            latestBookingNotification.id !==
            latestBookingNotificationIdRef.current
          ) {
            latestBookingNotificationIdRef.current =
              latestBookingNotification.id;
            window.dispatchEvent(new Event("tenant-booking-requests-updated"));
            if (showToast) {
              setBookingToast(dictionary.notifications.newBookingToast);
            }
          }
        })
        .catch(() => undefined);
    },
    [dictionary.notifications.newBookingToast],
  );

  useEffect(() => {
    if (status !== "success") return;
    console.debug("[fetch:start] CenterAdminShell — initial shell data");
    void Promise.resolve().then(() => {
      fetchPendingBookingRequests();
      fetchLatestBookingNotification(false);
    });
  }, [status, fetchPendingBookingRequests, fetchLatestBookingNotification]);

  useEffect(() => {
    if (status !== "success") return;
    const intervalId = window.setInterval(() => {
      fetchLatestBookingNotification(true);
    }, 7000);
    return () => window.clearInterval(intervalId);
  }, [status, fetchLatestBookingNotification]);

  useEffect(() => {
    if (status !== "success") return;
    const eventSource = new EventSource(getTenantNotificationsStreamUrl(), {
      withCredentials: true,
    });

    eventSource.onmessage = () => {
      fetchLatestBookingNotification(true);
    };

    eventSource.onerror = () => {
      // Keep the existing polling fallback active when the stream reconnects.
    };

    return () => eventSource.close();
  }, [status, fetchLatestBookingNotification]);

  useEffect(() => {
    if (!bookingToast) return;
    const timeoutId = window.setTimeout(() => setBookingToast(""), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [bookingToast]);

  useEffect(() => {
    const handler = () => fetchPendingBookingRequests();
    window.addEventListener("tenant-booking-requests-updated", handler);
    return () =>
      window.removeEventListener("tenant-booking-requests-updated", handler);
  }, [fetchPendingBookingRequests]);

  useEffect(() => {
    const handler = () => {
      fetchLatestBookingNotification(true);
      fetchPendingBookingRequests();
    };
    const storageHandler = (event: StorageEvent) => {
      if (event.key === "royalcare.tenant-booking-request-created") {
        handler();
      }
    };

    window.addEventListener("tenant-booking-request-created", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("tenant-booking-request-created", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [fetchLatestBookingNotification, fetchPendingBookingRequests]);

  const toggleGroup = (key: GroupKey) => {
    setGroupState((prev) => {
      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 1024;
      const next: Record<GroupKey, boolean> = isMobile
        ? {
            dailyOps: false,
            admin: false,
            marketing: false,
            content: false,
            [key]: !prev[key],
          }
        : { ...prev, [key]: !prev[key] };
      saveGroupOpen(next);
      return next;
    });
  };

  const logout = async () => {
    setLogoutStatus("loading");
    await logoutCenterUser().catch(() => null);
    if (typeof window !== "undefined" && session) {
      window.sessionStorage.removeItem(getTenantLocaleSessionKey(session));
    }
    router.replace("/tenant/login");
  };

  const navClassName = (key: NavKey) =>
    `flex min-h-10 items-center rounded-md px-3 text-start text-sm font-semibold transition ${
      key === activeNav
        ? "bg-[#C8A45D] text-[#0B2D5C]"
        : "text-white/82 hover:bg-white/10"
    }`;
  const badgeText = (count: number) => (count > 99 ? "99+" : String(count));
  const activeNavPermission = (() => {
    if (requiredPermission !== undefined) return requiredPermission;
    for (const group of NAV_GROUPS) {
      const found = group.items.find((item) => item.key === activeNav);
      if (found) return found.requiredPermission;
    }
    return undefined;
  })();
  const sessionPermissions = useMemo(
    () => resolveSessionPermissions(session),
    [session],
  );

  useEffect(() => {
    if (!session) return;
    console.debug("[CenterAdminShell] normalized permissions reaching shell", {
      role: session.role.key,
      rawCount: session.permissions.length,
      raw: session.permissions,
      normalized: sessionPermissions,
      expenses: {
        view: sessionPermissions.includes("expenses:view"),
        create: sessionPermissions.includes("expenses:create"),
        edit: sessionPermissions.includes("expenses:edit"),
        delete: sessionPermissions.includes("expenses:delete"),
        reports: sessionPermissions.includes("expenses:reports"),
      },
    });
  }, [session, sessionPermissions]);

  const effectiveSession = session
    ? { ...session, permissions: sessionPermissions }
    : null;
  const hasTenantPermission = (permission?: string) =>
    !permission || sessionPermissions.includes(permission);
  const hasPageAccess =
    !activeNavPermission || hasTenantPermission(activeNavPermission);
  const subscriptionRestrictionMessage = effectiveSession
    ? getTenantSubscriptionRestrictionMessage(effectiveSession, dictionary)
    : "";
  const subscriptionWarning = (() => {
    if (subscriptionRestrictionMessage) return "";
    const access = effectiveSession?.subscriptionAccess;
    if (!access) return "";
    if (access.isInGracePeriod) {
      return dictionary.subscriptionBanner.gracePeriodTitle(
        access.graceDaysRemaining ?? 0,
      );
    }
    if (access.isExpiringSoon) {
      return access.daysRemaining === 0
        ? dictionary.subscriptionBanner.expiresTodayTitle
        : dictionary.subscriptionBanner.expiringTitle(
            access.daysRemaining ?? 0,
          );
    }
    return "";
  })();
  const centerBrandLogoUrl =
    effectiveSession?.center.logoUrl?.trim() ||
    effectiveSession?.center.branding?.logoUrl?.trim() ||
    null;
  const centerLogoUrl =
    [centerBrandLogoUrl, publicLogoUrl].find(
      (logoUrl) => logoUrl && logoUrl !== failedCenterLogoUrl,
    ) ?? null;

  const sidebar = effectiveSession ? (
    <aside className="flex h-full min-w-0 flex-col bg-[#0B2D5C] p-4 text-white">
      <div className="mb-6 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {centerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={effectiveSession.center.name}
              className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-1 shadow-[0_10px_22px_rgba(2,8,23,0.18)]"
              onError={() => setFailedCenterLogoUrl(centerLogoUrl)}
              src={centerLogoUrl}
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-base font-black text-[#0B2D5C] shadow-[0_10px_22px_rgba(2,8,23,0.18)]">
              {getInitials(effectiveSession.center.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {effectiveSession.center.name}
            </p>
            <p className="truncate text-xs text-white/65">
              {dictionary.brand.console}
            </p>
          </div>
        </div>
        <button
          className={buttonClassName("secondary", "sm", "lg:hidden")}
          onClick={() => setIsDrawerOpen(false)}
          type="button"
        >
          {dictionary.shell.close}
        </button>
      </div>
      <nav className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Dashboard — standalone at the top */}
        <Link
          className={navClassName("dashboard")}
          href="/tenant/dashboard"
          onClick={() => setIsDrawerOpen(false)}
          onMouseEnter={() => prefetchTenantRoute("/tenant/dashboard")}
          prefetch
        >
          {dictionary.nav.dashboard}
        </Link>

        {/* Collapsible groups */}
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            hasTenantPermission(item.requiredPermission),
          );
          if (visibleItems.length === 0) return null;

          const isOpen =
            groupState[group.key] || getActiveGroupKey(activeNav) === group.key;

          return (
            <div key={group.key} className="mt-2">
              <div className="mb-1 border-t border-white/10" />
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[11px] font-bold uppercase tracking-wider text-white/50 transition hover:bg-white/10 hover:text-white/80"
                onClick={() => toggleGroup(group.key)}
                type="button"
              >
                <span className="shrink-0">{group.emoji}</span>
                <span className="min-w-0 flex-1 truncate">
                  {group.label(dictionary)}
                </span>
                <svg
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-90" : isRtl ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    d="M1 1l4 4-4 4"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-[860px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex flex-col gap-0.5 pt-0.5">
                  {visibleItems.map((item) => (
                    <div key={item.key}>
                      <Link
                        className={navClassName(item.key)}
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        onMouseEnter={() => prefetchTenantRoute(item.href)}
                        prefetch
                      >
                        {item.key === "notifications" ||
                        item.key === "bookingRequests" ? (
                          <span className="flex w-full min-w-0 items-center gap-2">
                            <span className="min-w-0 truncate">
                              {dictionary.nav[item.key]}
                            </span>
                            {item.key === "notifications" &&
                            unreadNotifications > 0 ? (
                              <span className="ms-auto shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                                {badgeText(unreadNotifications)}
                              </span>
                            ) : null}
                            {item.key === "bookingRequests" &&
                            pendingBookingRequests > 0 ? (
                              <span className="ms-auto shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold leading-5 text-white shadow-sm">
                                {badgeText(pendingBookingRequests)}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          dictionary.nav[item.key]
                        )}
                      </Link>
                      {item.key === "expenses" ? (
                        <div className="ms-3 mt-1 flex flex-col gap-0.5 border-s border-white/15 ps-3">
                          {expenseSubnavItems.map((subItem) => (
                            <Link
                              className={`rounded-md px-3 py-1.5 text-start text-xs font-semibold transition ${
                                pathname === subItem.href
                                  ? "bg-white/14 text-white"
                                  : "text-white/65 hover:bg-white/10 hover:text-white"
                              }`}
                              href={subItem.href}
                              key={subItem.key}
                              onClick={() => setIsDrawerOpen(false)}
                              onMouseEnter={() =>
                                prefetchTenantRoute(subItem.href)
                              }
                              prefetch
                            >
                              {expenseSubnavLabels[locale][subItem.key]}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      {/* User profile link */}
      <Link
        className="mt-4 flex min-w-0 items-center gap-3 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-start transition hover:bg-white/10"
        href="/tenant/profile"
        onClick={() => setIsDrawerOpen(false)}
        onMouseEnter={() => prefetchTenantRoute("/tenant/profile")}
        prefetch
      >
        {centerLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={effectiveSession.center.name}
            className="h-8 w-8 shrink-0 rounded-full bg-white object-cover shadow-sm"
            onError={() => setFailedCenterLogoUrl(centerLogoUrl)}
            src={centerLogoUrl}
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C8A45D] text-xs font-bold text-[#0B2D5C]">
            {getInitials(effectiveSession.center.name) ||
              getInitials(
                effectiveSession.user.fullName ||
                  effectiveSession.user.email ||
                  "?",
              ) ||
              "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {effectiveSession.user.fullName ||
              effectiveSession.user.email ||
              dictionary.common.notAvailable}
          </p>
          <p className="truncate text-[11px] text-white/60">
            {dictionary.roles[effectiveSession.role.key]}
          </p>
        </div>
      </Link>
      <button
        className={buttonClassName("secondary", "md", "mt-2 w-full")}
        disabled={logoutStatus === "loading"}
        onClick={logout}
        type="button"
      >
        {logoutStatus === "loading"
          ? dictionary.shell.loggingOut
          : dictionary.shell.logout}
      </button>
    </aside>
  ) : null;

  if (status === "loading" || !effectiveSession) {
    return (
      <>
        {/* Render TenantFaviconManager even while loading so it can re-apply the
            last known center title/favicon from module-level tenantBrandState.
            This eliminates the "RoyalCare" flash that would otherwise appear
            during the session re-fetch on every tenant→tenant navigation. */}
        <TenantFaviconManager
          centerId={null}
          centerName={null}
          logoUrl={centerLogoUrl}
        />
        <TenantShellSkeleton dictionary={dictionary} isRtl={isRtl} />
      </>
    );
  }

  return (
    <>
      {/* TenantFaviconManager owns /tenant/* tab title AND favicon via DOM.
          Passes centerId + centerName so it can write document.title and persist
          branding in module-level state across SPA navigation remount cycles. */}
      <TenantFaviconManager
        centerId={effectiveSession.center.id}
        centerName={effectiveSession.center.name}
        logoUrl={centerLogoUrl}
      />
      <div
        className="min-h-screen bg-[#F8FAFC] text-[#132238]"
        dir={direction}
        lang={locale}
      >
        <div
          className={`min-h-screen min-w-0 lg:flex ${
            isRtl ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          <div className="hidden lg:block lg:w-[280px] lg:shrink-0">
            {sidebar}
          </div>
          {isDrawerOpen ? (
            <div className="fixed inset-0 z-50 bg-[#0B2D5C]/40 lg:hidden">
              <div
                className={`h-full w-[min(82vw,320px)] ${
                  isRtl ? "ml-auto" : "mr-auto"
                }`}
              >
                {sidebar}
              </div>
            </div>
          ) : null}

          <main className="min-w-0 max-w-full flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1600px]">
              <header className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_14px_34px_rgba(11,45,92,0.055)] lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                    {effectiveSession.center.name}
                  </p>
                  <h1 className="mt-1 break-words text-xl font-semibold leading-snug text-[#0B2D5C] sm:text-2xl">
                    {title(dictionary)}
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-[#66758a]">
                    {subtitle(dictionary)}
                  </p>
                </div>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#40516a]">
                    <span className="shrink-0">
                      {dictionary.shell.language}
                    </span>
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
                  <button
                    className={buttonClassName("secondary", "md", "lg:hidden")}
                    onClick={() => setIsDrawerOpen(true)}
                    type="button"
                  >
                    {dictionary.shell.menu}
                  </button>
                </div>
              </header>

              {subscriptionRestrictionMessage || subscriptionWarning ? (
                <section
                  className={`mt-5 rounded-lg border px-5 py-4 text-sm font-semibold ${
                    subscriptionRestrictionMessage
                      ? "border-[#F3B8B8] bg-[#FFF7F7] text-[#B42318]"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  {subscriptionRestrictionMessage || subscriptionWarning}
                </section>
              ) : null}

              {bookingToast ? (
                <section
                  className="mt-5 flex min-w-0 flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900 shadow-[0_12px_28px_rgba(16,185,129,0.12)] sm:flex-row sm:items-center sm:justify-between"
                  role="status"
                >
                  <span className="min-w-0 break-words">{bookingToast}</span>
                  <Link
                    className={buttonClassName("secondary", "sm")}
                    href="/tenant/booking-requests"
                    onClick={() => setBookingToast("")}
                  >
                    {dictionary.notifications.openBookingRequests}
                  </Link>
                </section>
              ) : null}

              {hasPageAccess ? (
                children({
                  centerLogoUrl,
                  dictionary,
                  session: effectiveSession,
                })
              ) : (
                <AdminState
                  body={dictionary.shell.accessDeniedBody}
                  className="mt-5"
                  title={dictionary.shell.accessDeniedTitle}
                  tone="error"
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
