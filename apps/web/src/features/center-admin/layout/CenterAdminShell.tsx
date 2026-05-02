"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  centerAdminDictionaries,
  type CenterAdminDictionary,
} from "@/i18n/dictionaries/center-admin";
import {
  supportedLocales,
  type SupportedLocale,
} from "@/i18n/locales";
import {
  getCenterSession,
  logoutCenterUser,
  type CenterSession,
} from "@/lib/api/center-auth";
import {
  getTenantLocaleSessionKey,
  markTenantDefaultLocaleApplied,
} from "../login/CenterLoginPage";

type NavKey =
  | "dashboard"
  | "patients"
  | "appointments"
  | "services"
  | "staff"
  | "billing"
  | "reports"
  | "settings";

type CenterAdminShellProps = {
  activeNav: NavKey;
  children: (context: {
    dictionary: CenterAdminDictionary;
    session: CenterSession;
  }) => ReactNode;
  subtitle: (dictionary: CenterAdminDictionary) => string;
  title: (dictionary: CenterAdminDictionary) => string;
};

const navItems: Array<{ href?: string; key: NavKey }> = [
  { key: "dashboard", href: "/tenant/dashboard" },
  { key: "patients", href: "/tenant/patients" },
  { key: "appointments", href: "/tenant/appointments" },
  { key: "services", href: "/tenant/services" },
  { key: "staff", href: "/tenant/staff" },
  { key: "billing", href: "/tenant/billing" },
  { key: "reports", href: "/tenant/reports" },
  { key: "settings", href: "/tenant/settings" },
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

function TenantLogo({ center }: { center: CenterSession["center"] }) {
  const logoUrl = center.branding?.logoUrl?.trim();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={center.name}
        className="h-12 w-12 shrink-0 rounded-md border border-white/15 bg-white object-contain"
        src={logoUrl}
      />
    );
  }

  return (
    <div
      aria-label={center.name}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white text-sm font-bold text-[#0B2D5C]"
      role="img"
    >
      {getInitials(center.name) || "C"}
    </div>
  );
}

export function CenterAdminShell({
  activeNav,
  children,
  subtitle,
  title,
}: CenterAdminShellProps) {
  const router = useRouter();
  const { direction, locale, setLocale } = useLanguage();
  const dictionary = centerAdminDictionaries[locale];
  const isRtl = direction === "rtl";
  const [session, setSession] = useState<CenterSession | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState<"idle" | "loading">("idle");

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

  const sidebar = session ? (
    <aside className="flex h-full min-w-0 flex-col bg-[#0B2D5C] p-4 text-white">
      <div className="mb-6 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TenantLogo center={session.center} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {session.center.name}
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
      <nav className="flex min-w-0 flex-1 flex-col gap-1">
        {navItems.map((item) =>
          item.href ? (
            <Link
              className={navClassName(item.key)}
              href={item.href}
              key={item.key}
              onClick={() => setIsDrawerOpen(false)}
            >
              {dictionary.nav[item.key]}
            </Link>
          ) : (
            <button
              className={`${navClassName(item.key)} cursor-not-allowed opacity-70`}
              disabled
              key={item.key}
              type="button"
            >
              {dictionary.nav[item.key]}
            </button>
          ),
        )}
      </nav>
      <button
        className={buttonClassName("secondary", "md", "mt-4 w-full")}
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

  if (status === "loading" || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
        <p className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 text-sm font-semibold text-[#0B2D5C]">
          {dictionary.dashboard.loading}
        </p>
      </main>
    );
  }

  return (
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
          <header className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {session.center.name}
              </p>
              <h1 className="mt-1 break-words text-xl font-semibold text-[#0B2D5C]">
                {title(dictionary)}
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#66758a]">
                {subtitle(dictionary)}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#40516a]">
                <span className="shrink-0">{dictionary.shell.language}</span>
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

          {children({ dictionary, session })}
        </main>
      </div>
    </div>
  );
}
