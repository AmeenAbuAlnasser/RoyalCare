"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { buttonClassName } from "@/components/ui/button-styles";
import { type SupportedLocale } from "@/i18n/locales";
import { publicCentersDictionaries } from "@/i18n/dictionaries/public-centers";
import { getPublicSystemSettings, type SystemSetting } from "@/lib/api/system-settings";

type SocialKey = "facebook" | "instagram" | "whatsapp" | "youtube";

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

function SocialIcon({ type }: { type: SocialKey }) {
  const common = {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (type === "facebook") {
    return (
      <svg {...common}>
        <path d="M14.2 8.1V6.7c0-.7.5-.9.9-.9h2.2V2.1L14.2 2c-3.5 0-4.3 2.6-4.3 4.3v1.8H7.1V12h2.8v10h4.1V12h3.1l.5-3.9h-3.4Z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg {...common}>
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm5.1-2.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
      </svg>
    );
  }

  if (type === "whatsapp") {
    return (
      <svg {...common}>
        <path d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.1 4 4.1-1.1A10 10 0 1 0 12 2Zm0 18a7.9 7.9 0 0 1-4-1.1l-.3-.2-2.4.6.7-2.3-.2-.3A8 8 0 1 1 12 20Zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.2.2-.4.1-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2.9 2.3.1.2 1.6 2.6 4 3.6 1.5.7 2.1.7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1 0-.1-.2-.1-.4-.2Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

export function PublicFooter({
  locale,
  settings: settingsProp = [],
}: {
  locale: SupportedLocale;
  settings?: SystemSetting[];
}) {
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
  const footerLogoUrl = firstValue(
    publicSettings.get("public_footer_logo_url"),
    publicSettings.get("public_logo_url"),
  );
  const supportWhatsApp = firstValue(
    publicSettings.get("public_whatsapp_url"),
    publicSettings.get("public_support_whatsapp"),
  );
  const footerGroups = [
    { title: d.footer.centersTitle, links: d.footer.centersLinks },
    { title: d.footer.ownersTitle, links: d.footer.ownersLinks },
    { title: d.footer.infoTitle, links: d.footer.infoLinks },
  ];
  const socialLinks = [
    {
      key: "facebook",
      label: d.footer.social.facebook,
      href: publicSettings.get("public_facebook_url") ?? "",
    },
    {
      key: "instagram",
      label: d.footer.social.instagram,
      href: publicSettings.get("public_instagram_url") ?? "",
    },
    {
      key: "whatsapp",
      label: d.footer.social.whatsapp,
      href: buildWhatsAppUrl(d.landing.footerWhatsAppMessage, supportWhatsApp),
    },
    {
      key: "youtube",
      label: d.footer.social.youtube,
      href: publicSettings.get("public_youtube_url") ?? "",
    },
  ].filter(
    (link): link is { key: SocialKey; label: string; href: string } =>
      Boolean(link.href.trim()),
  );

  return (
    <footer className="bg-[#071F3F] text-white" id="contact">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_0.8fr_1.25fr]">
        <div className="min-w-0">
          <Link
            className="inline-flex max-w-full items-center rounded-lg focus:outline-none focus:ring-3 focus:ring-[#D8BD7A]/30"
            href="/centers"
          >
            <BrandLogo
              dark
              imageUrl={footerLogoUrl}
              siteName={siteName}
              textClassName="text-xl"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/72">
            {d.footer.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socialLinks.map((link) => (
              <a
                aria-label={link.label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0B2D5C] bg-[#0B2D5C] text-white transition hover:border-[#D8BD7A] hover:bg-[#D8BD7A] hover:text-[#071F3F] focus:outline-none focus:ring-3 focus:ring-[#D8BD7A]/30"
                href={link.href}
                key={link.key}
                rel="noreferrer"
                target="_blank"
              >
                <SocialIcon type={link.key} />
              </a>
            ))}
          </div>
        </div>

        {footerGroups.map((group) => (
          <div className="min-w-0" key={group.title}>
            <h3 className="text-sm font-black text-[#D8BD7A]">{group.title}</h3>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link}>
                  <a
                    className="text-sm font-semibold text-white/72 transition hover:text-white"
                    href="#"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="min-w-0">
          <h3 className="text-sm font-black text-[#D8BD7A]">
            {d.footer.newsletterTitle}
          </h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="sr-only" htmlFor="public-newsletter-email">
              {d.footer.newsletterPlaceholder}
            </label>
            <input
              className="min-h-11 w-full min-w-0 rounded-lg border border-white/16 bg-white/10 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/45 focus:border-[#D8BD7A] focus:ring-3 focus:ring-[#D8BD7A]/20"
              id="public-newsletter-email"
              placeholder={d.footer.newsletterPlaceholder}
              type="email"
            />
            <button
              className={buttonClassName("warning", "md", "w-full")}
              type="submit"
            >
              {d.footer.newsletterSubmit}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-white/68">
            {d.footer.copyright} · {d.footer.rights}
          </p>
          <div className="flex flex-wrap gap-2">
            {d.footer.badges.map((badge) => (
              <span
                className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-black text-white/78"
                key={badge}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
