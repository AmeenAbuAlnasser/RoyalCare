"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { centerAdminDictionaries } from "@/i18n/dictionaries/center-admin";
import {
  loginCenterUser,
  resolveCenterLogin,
  type CenterLoginContext,
  type CenterSession,
} from "@/lib/api/center-auth";
import type { SupportedLocale } from "@/i18n/locales";

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

export function getTenantLocaleSessionKey(session: CenterSession) {
  return `royalcare.tenantLocale.defaultApplied.${session.center.id}.${session.user.id}`;
}

export function markTenantDefaultLocaleApplied(session: CenterSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getTenantLocaleSessionKey(session),
    mapApiLanguage(session.center.primaryLanguage),
  );
}

function CenterLogo({ center }: { center?: CenterSession["center"] }) {
  const logoUrl = center?.branding?.logoUrl?.trim();

  if (center && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={center.name}
        className="h-16 w-16 rounded-lg border border-white/15 bg-white object-contain"
        src={logoUrl}
      />
    );
  }

  return (
    <div
      aria-label={center?.name}
      className="flex h-16 w-16 items-center justify-center rounded-lg border border-white/15 bg-white text-lg font-bold text-[#0B2D5C]"
      role="img"
    >
      {center ? getInitials(center.name) || "C" : "RC"}
    </div>
  );
}

export function CenterLoginPage({ centerSlug }: { centerSlug?: string }) {
  const router = useRouter();
  const { direction, locale, setLocale } = useLanguage();
  const dictionary = centerAdminDictionaries[locale];
  const [loginContext, setLoginContext] = useState<CenterLoginContext | null>(
    null,
  );
  const [contextStatus, setContextStatus] = useState<
    "idle" | "loading" | "ready" | "not-found"
  >(centerSlug ? "loading" : "idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!centerSlug) {
      return;
    }

    let isMounted = true;

    resolveCenterLogin(centerSlug)
      .then((context) => {
        if (!isMounted) {
          return;
        }

        setLoginContext(context);
        setLocale(mapApiLanguage(context.center.primaryLanguage));
        setContextStatus("ready");
      })
      .catch(() => {
        if (isMounted) {
          setContextStatus("not-found");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [centerSlug, setLocale]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loginContext && !loginContext.loginAllowed) {
      return;
    }

    setStatus("loading");

    try {
      const session = await loginCenterUser(email, password, centerSlug);
      setLocale(mapApiLanguage(session.center.primaryLanguage));
      markTenantDefaultLocaleApplied(session);
      router.push("/tenant/dashboard");
    } catch {
      setStatus("error");
    }
  };

  const center = loginContext?.center;
  const isBlocked = Boolean(loginContext && !loginContext.loginAllowed);
  const isLoadingContext = contextStatus === "loading";
  const isNotFound = contextStatus === "not-found";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-8"
      dir={direction}
    >
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_24px_70px_rgba(11,45,92,0.10)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col justify-between bg-[#0B2D5C] p-6 text-white sm:p-8">
          <div>
            <CenterLogo center={center} />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
              {center?.name ?? dictionary.brand.console}
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
              {dictionary.login.title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
              {dictionary.login.subtitle}
            </p>
          </div>
        </div>

        <form className="min-w-0 space-y-5 p-6 sm:p-8" onSubmit={submitLogin}>
          {isLoadingContext ? (
            <p className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#0B2D5C]">
              {dictionary.dashboard.loading}
            </p>
          ) : null}
          {isNotFound ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {dictionary.login.centerNotFound}
            </p>
          ) : null}
          {isBlocked ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
              {dictionary.login.blockedCenter}
            </p>
          ) : null}
          {status === "error" ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {dictionary.login.error}
            </p>
          ) : null}
          <label className="block min-w-0">
            <span className="text-sm font-medium text-[#24364f]">
              {dictionary.login.email}
            </span>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-[#E5E7EB] px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label className="block min-w-0">
            <span className="text-sm font-medium text-[#24364f]">
              {dictionary.login.password}
            </span>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-[#E5E7EB] px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <button
            className={buttonClassName("primary", "lg", "w-full")}
            disabled={
              status === "loading" ||
              isLoadingContext ||
              isNotFound ||
              isBlocked
            }
            type="submit"
          >
            {status === "loading"
              ? dictionary.login.submitting
              : dictionary.login.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
