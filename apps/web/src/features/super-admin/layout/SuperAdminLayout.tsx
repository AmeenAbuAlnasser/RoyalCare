"use client";

import { useState, type ReactNode } from "react";
import { RoyalCareLogo } from "@/components/brand/RoyalCareLogo";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  supportedLocales,
  type SupportedLocale,
} from "@/i18n/locales";

const navigationItems = [
  { key: "dashboard", href: "/super-admin/dashboard" },
  { key: "centers", href: "/super-admin/centers" },
  { key: "subscriptions", href: "/super-admin/subscriptions" },
  { key: "domains", href: "/super-admin/domains" },
  { key: "plans", href: "/super-admin/plans" },
  { key: "users", href: "/super-admin/users" },
  { key: "notifications", href: "/super-admin/notifications" },
  { key: "settings", href: "/super-admin/settings" },
] as const;

type NavigationKey = (typeof navigationItems)[number]["key"];

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

function NavigationList({
  activeNav,
  dictionary,
  onNavigate,
}: {
  activeNav: NavigationKey;
  dictionary: SuperAdminLayoutDictionary;
  onNavigate?: () => void;
}) {
  return (
    <nav className="px-4 py-6">
      <ul className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = item.key === activeNav;

          return (
            <li key={item.key}>
              <a
                className={`flex min-h-12 items-center rounded-md border-y border-e border-s-4 px-4 py-2.5 text-[15px] transition ${
                  isActive
                    ? "border-y-white/10 border-e-white/10 border-s-[#C8A45D] bg-[#123B72] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(200,164,93,0.12)]"
                    : "border-y-transparent border-e-transparent border-s-transparent font-medium text-white/84 hover:border-y-white/10 hover:border-e-white/10 hover:border-s-[#C8A45D]/45 hover:bg-[#123B72]/55 hover:text-white"
                }`}
                href={item.href}
                onClick={onNavigate}
              >
                {dictionary.nav[item.key]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SuperAdminLayout({
  activeNav,
  children,
  dictionary,
}: {
  activeNav: NavigationKey;
  children: ReactNode;
  dictionary: SuperAdminLayoutDictionary;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { direction, locale, setLocale } = useLanguage();
  const isRtl = direction === "rtl";

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

          <NavigationList activeNav={activeNav} dictionary={dictionary} />
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
              </div>
            </div>
          </header>

          <main className="min-w-0 max-w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
