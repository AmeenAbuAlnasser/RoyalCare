"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supportedLocales, type SupportedLocale } from "@/i18n/locales";
import { publicCentersDictionaries } from "@/i18n/dictionaries/public-centers";
import { getPublicSystemSettings, type SystemSetting } from "@/lib/api/system-settings";

const localeLabels: Record<SupportedLocale, string> = {
  en: "EN",
  ar: "ع",
  he: "ע",
};

function settingsMap(settings: SystemSetting[]) {
  return new Map(settings.map((setting) => [setting.key, setting.value]));
}

function firstValue(...values: Array<string | undefined | null>) {
  return values.find((value) => value?.trim())?.trim() ?? "";
}

function buildWhatsAppUrl(message: string, configuredPhone?: string) {
  if (configuredPhone?.startsWith("http")) return configuredPhone;
  const phone =
    configuredPhone ||
    process.env.NEXT_PUBLIC_ROYALCARE_SUPPORT_WHATSAPP ||
    "970598396860";
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function PublicHeader({
  locale,
  settings: settingsProp = [],
}: {
  locale: SupportedLocale;
  settings?: SystemSetting[];
}) {
  const { setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>(settingsProp);

  useEffect(() => {
    if (settingsProp.length > 0) return;
    let cancelled = false;
    void getPublicSystemSettings()
      .then(({ settings: fetched }) => {
        if (!cancelled) setSettings(fetched);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const d = publicCentersDictionaries[locale];
  const publicSettings = settingsMap(settings);
  const siteName = firstValue(publicSettings.get("public_site_name"), "RoyalCare");
  const logoUrl = firstValue(publicSettings.get("public_logo_url"));
  const supportWhatsApp = firstValue(
    publicSettings.get("public_whatsapp_url"),
    publicSettings.get("public_support_whatsapp"),
  );
  const supportEmail = firstValue(
    publicSettings.get("public_support_email"),
    d.nav.supportEmail,
  );
  const ownerCta = firstValue(
    publicSettings.get(`public_owner_cta_text_${locale}`),
    d.nav.openCenter,
  );

  const navItems = [
    { label: d.nav.home, href: "/centers" },
    { label: d.nav.centers, href: "#featured-centers" },
    { label: d.nav.howItWorks, href: "#how-it-works" },
    { label: d.nav.features, href: "#features" },
    { label: d.nav.faq, href: "#faq" },
    { label: d.nav.contact, href: "#contact" },
  ];

  const navLinks = (
    <nav
      aria-label="Primary"
      className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1"
    >
      {navItems.map((item) => (
        <Link
          className={`rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-[#F8FAFC] hover:text-[#0B2D5C] focus:outline-none focus:ring-3 focus:ring-[#C8A45D]/20 ${
            item.href === "/centers"
              ? "bg-[#C8A45D]/12 text-[#0B2D5C]"
              : "text-[#526176]"
          }`}
          href={item.href}
          key={item.href}
          onClick={() => setIsOpen(false)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const headerActions = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div
        aria-label={d.nav.language}
        className="flex w-max items-center gap-1 rounded-lg bg-[#F1F5F9] p-1"
        role="group"
      >
        {supportedLocales.map((loc) => (
          <button
            aria-pressed={locale === loc}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              locale === loc
                ? "bg-white text-[#0B2D5C] shadow-sm"
                : "text-[#66758a] hover:bg-white/70 hover:text-[#0B2D5C]"
            }`}
            key={loc}
            onClick={() => setLocale(loc)}
            type="button"
          >
            {localeLabels[loc]}
          </button>
        ))}
      </div>

      <Link
        className={buttonClassName(
          "secondary",
          "md",
          "w-full justify-center border-[#0B2D5C] text-[#0B2D5C] lg:w-auto",
        )}
        href="/tenant/login"
        onClick={() => setIsOpen(false)}
      >
        {d.nav.login}
      </Link>

      <Link
        className={buttonClassName(
          "warning",
          "md",
          "w-full justify-center shadow-sm lg:w-auto",
        )}
        href="/open-center"
        onClick={() => setIsOpen(false)}
      >
        {ownerCta}
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/96 shadow-[0_8px_30px_rgba(11,45,92,0.08)] backdrop-blur-xl">
      <div className="bg-[#071F3F] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs font-semibold sm:px-6">
          <p className="min-w-0 truncate">{d.nav.topMessage}</p>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <a
              className="transition hover:text-[#D8BD7A]"
              href={buildWhatsAppUrl(d.landing.footerWhatsAppMessage, supportWhatsApp)}
              rel="noreferrer"
              target="_blank"
            >
              ☎ {d.nav.whatsapp}
            </a>
            <a
              className="transition hover:text-[#D8BD7A]"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-[#E5E7EB] bg-white/92">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              className="inline-flex max-w-[220px] shrink-0 items-center rounded-lg focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/20 sm:max-w-[260px]"
              href="/centers"
            >
              <BrandLogo
                imageUrl={logoUrl}
                siteName={siteName}
                textClassName="text-base"
              />
            </Link>

            <div className="hidden lg:block">{navLinks}</div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {headerActions}
          </div>

          <button
            aria-expanded={isOpen}
            aria-label={isOpen ? d.nav.closeMenu : d.nav.menu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E3E8EF] bg-white text-[#0B2D5C] shadow-sm transition hover:border-[#C8A45D]/60 hover:bg-[#F8FAFC] focus:outline-none focus:ring-3 focus:ring-[#C8A45D]/20 lg:hidden"
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            <span className="text-xl font-black">{isOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-b border-[#E3E8EF] bg-white px-4 py-4 shadow-lg sm:px-6 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {navLinks}
            {headerActions}
          </div>
        </div>
      ) : null}
    </header>
  );
}
