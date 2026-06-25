"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { AdminState } from "@/components/ui/admin-surfaces";
import { formatNumber } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import { publicCentersDictionaries } from "@/i18n/dictionaries/public-centers";
import type { SupportedLocale } from "@/i18n/locales";
import {
  listPublicCenters,
  type PublicCenterSummary,
  type PublicCenterType,
} from "@/lib/api/public-centers";
import {
  getPlatformContact,
  getPublicSystemSettings,
  type SystemSetting,
} from "@/lib/api/system-settings";
import { trackPlatformEvent } from "@/lib/marketing/platform-track";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { publicPricingDictionaries } from "@/i18n/dictionaries/public-pricing";
import {
  listPublicPlans,
  type ApiPlanFeature,
  type PublicPlan,
} from "@/lib/api/super-admin-plans";
import {
  buildPricingWhatsAppMessage,
  buildPricingWhatsAppUrl,
  getPublicFeatureName,
  getPublicPlanName,
} from "@/features/public/pricing/pricing-whatsapp";

type Dictionary = (typeof publicCentersDictionaries)["en"];

function resolveLocalizedName(
  center: Pick<PublicCenterSummary, "name" | "nameAr" | "nameEn" | "nameHe">,
  _locale: SupportedLocale,
): string {
  return center.name || center.nameEn || center.nameAr || center.nameHe || "";
}

function resolveServiceName(
  service: { nameEn: string; nameAr: string; nameHe: string },
  _locale: SupportedLocale,
): string {
  return service.nameEn || service.nameAr || service.nameHe;
}


function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function getCenterSearchText(center: PublicCenterSummary) {
  return [
    center.name,
    center.nameAr,
    center.nameEn,
    center.nameHe,
    center.type,
    ...center.services.flatMap((service) => [
      service.nameAr,
      service.nameEn,
      service.nameHe,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildWhatsAppUrl(message: string, configuredPhone?: string) {
  if (configuredPhone?.startsWith("http")) return configuredPhone;
  const phone =
    configuredPhone ||
    process.env.NEXT_PUBLIC_ROYALCARE_SUPPORT_WHATSAPP ||
    "970598396860";
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

function makeSettingsMap(settings: SystemSetting[]) {
  return new Map(settings.map((setting) => [setting.key, setting.value]));
}

function firstValue(...values: Array<string | undefined | null>) {
  return values.find((value) => value?.trim())?.trim() ?? "";
}

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(Math.round(value * eased));
      if (p < 1) window.requestAnimationFrame(tick);
    };
    const frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [started, value]);

  return <span ref={ref}>{prefix}{formatNumber(current)}</span>;
}

const AVATAR_COLORS = [
  "bg-[#0B2D5C]",
  "bg-[#7A5C20]",
  "bg-emerald-700",
  "bg-violet-700",
  "bg-rose-700",
  "bg-teal-700",
];

function TestimonialAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  const color = AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color} text-sm font-bold text-white`}>
      {initials || "R"}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} stars`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          className={`h-4 w-4 ${star <= rating ? "text-[#C8A45D]" : "text-[#E5E7EB]"}`}
          fill="currentColor"
          key={star}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}


function CenterTypeBadge({
  type,
  label,
}: {
  type: PublicCenterType;
  label: string;
}) {
  const colors: Record<PublicCenterType, string> = {
    LASER: "border-violet-200 bg-violet-50 text-violet-700",
    PHYSIOTHERAPY: "border-blue-200 bg-blue-50 text-blue-700",
    HIJAMA: "border-teal-200 bg-teal-50 text-teal-700",
    BEAUTY: "border-pink-200 bg-pink-50 text-pink-700",
    WELLNESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
    MULTI_SPECIALTY: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-bold ${colors[type]}`}
    >
      {label}
    </span>
  );
}

const TYPE_GRADIENTS: Record<PublicCenterType, string> = {
  LASER: "from-violet-900 via-violet-800 to-violet-700",
  PHYSIOTHERAPY: "from-blue-900 via-blue-800 to-blue-700",
  HIJAMA: "from-teal-900 via-teal-800 to-teal-700",
  BEAUTY: "from-pink-900 via-pink-800 to-pink-700",
  WELLNESS: "from-emerald-900 via-emerald-800 to-emerald-700",
  MULTI_SPECIALTY: "from-[#0B2D5C] via-[#123B72] to-[#1a4a8a]",
};

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="aspect-video bg-[#E5E7EB]" />
      <div className="px-4 pb-4 pt-10">
        <div className="h-5 w-3/4 rounded-lg bg-[#E5E7EB]" />
        <div className="mt-2 h-3.5 w-1/3 rounded bg-[#EEF2F7]" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-20 rounded-full bg-[#E5E7EB]" />
          <div className="h-6 w-24 rounded-full bg-[#E5E7EB]" />
        </div>
        <div className="mt-3 flex gap-1.5">
          <div className="h-6 w-16 rounded-full bg-[#EEF2F7]" />
          <div className="h-6 w-20 rounded-full bg-[#EEF2F7]" />
          <div className="h-6 w-14 rounded-full bg-[#EEF2F7]" />
        </div>
        <div className="mt-4 h-10 w-full rounded-lg bg-[#E5E7EB]" />
      </div>
    </div>
  );
}

function CenterCard({
  center,
  index,
  locale,
  d,
}: {
  center: PublicCenterSummary;
  index: number;
  locale: SupportedLocale;
  d: Dictionary;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const displayName = resolveLocalizedName(center, locale);
  const serviceChips = center.services.slice(0, 2);
  const extraCount = Math.max(0, center.services.length - 2);
  const brandingCover =
    center.branding?.cardImageUrl?.trim() || center.branding?.coverImageUrl?.trim() || null;
  const hasCover = Boolean(brandingCover) && !imgFailed;
  const rating = (4.7 + (index % 3) * 0.1).toFixed(1);
  const isToday = index % 2 === 0;

  const cityDisplay =
    locale === "ar"
      ? center.branding?.cityAr || center.branding?.cityEn || null
      : locale === "he"
        ? center.branding?.cityHe || center.branding?.cityEn || null
        : center.branding?.cityEn || null;

  const gradient = TYPE_GRADIENTS[center.type];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "R";

  return (
    <Link
      aria-label={`Open ${displayName} center profile`}
      className="group flex h-full min-w-0 cursor-pointer flex-col"
      href={`/c/${center.slug}`}
      onClick={() => trackPlatformEvent("OpenCenterWebsite", { centerSlug: center.slug, centerName: displayName })}
      rel="noopener noreferrer"
      target="_blank"
    >
      <article className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E3E8EF] bg-white shadow-[0_8px_24px_rgba(11,45,92,0.08)] transition duration-200 group-hover:-translate-y-1.5 group-hover:border-[#C8A45D]/50 group-hover:shadow-[0_24px_52px_rgba(11,45,92,0.15)]">

        {/* Outer wrapper - relative so logo can hang below image without being clipped */}
        <div className="relative">

          {/* Image - 16:9, own overflow-hidden so hover scale is contained */}
          <div className="relative aspect-video overflow-hidden rounded-t-2xl">
            {/* Elegant gradient fallback */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            {/* Center monogram - shown only when no cover image, no ugly icon */}
            {!hasCover && (
              <div className="absolute inset-0 flex items-center justify-center select-none">
                <span className="text-8xl font-black text-white/[0.08]">{initials}</span>
              </div>
            )}
            {/* Cover image */}
            {brandingCover && (
              <img
                alt=""
                className={`absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105 ${imgFailed ? "opacity-0" : ""}`}
                decoding="async"
                loading="lazy"
                onError={() => setImgFailed(true)}
                src={brandingCover}
              />
            )}
            {/* Scrim for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/8 to-transparent" />

            {/* Type badge - top start */}
            <div className="absolute start-3 top-3">
              <CenterTypeBadge label={d.centerTypes[center.type]} type={center.type} />
            </div>

            {/* Rating badge - top end */}
            <div className="absolute end-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-[#0B2D5C] shadow">
                <span className="text-[#C8A45D]">★</span>
                {rating}
              </span>
            </div>
          </div>

          {/* Logo - absolute on the outer wrapper (no overflow-hidden here), never clipped */}
          <div className="absolute bottom-0 start-4 z-10 translate-y-1/2">
            {center.branding?.logoUrl ? (
              <img
                alt={displayName}
                className="h-14 w-14 rounded-xl border-2 border-white bg-white object-contain p-1 shadow-lg"
                decoding="async"
                loading="lazy"
                src={center.branding.logoUrl}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-[#0B2D5C] text-base font-black text-white shadow-lg">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Body - pt-10 reserves 40px above content so the 56px logo (half = 28px) has breathing room */}
        <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-10">

          {/* Name + city */}
          <div className="min-w-0">
            {/* min-h-[2.75rem] = 2 lines x text-base leading-snug (1.375 x 1rem x 2) */}
            <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-black leading-snug text-[#0B2D5C]">
              {displayName}
            </h3>
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#66758a]">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="truncate">{cityDisplay ?? d.landing.cityFallback}</span>
            </div>
          </div>

          {/* Services count + next-available pills - flex-nowrap keeps this row single-line */}
          <div className="flex min-w-0 flex-nowrap gap-2 overflow-hidden">
            <span className="inline-flex items-center rounded-full border border-[#E3E8EF] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#0B2D5C]">
              {formatNumber(center.services.length)}&nbsp;{d.landing.servicesCount}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                isToday
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {isToday ? d.landing.nextAvailableToday : d.landing.nextAvailableSoon}
            </span>
          </div>

          {/* Service chips - flex-nowrap + overflow-hidden = exactly one row, always same height */}
          <div className="flex min-w-0 flex-nowrap gap-1.5 overflow-hidden">
            {serviceChips.length > 0 ? (
              <>
                {serviceChips.map((service) => {
                  const name = resolveServiceName(service, locale);
                  if (!name) return null;
                  return (
                    <span
                      className="max-w-[9rem] shrink-0 truncate rounded-full border border-[#E3E8EF] bg-[#F8FAFC] px-2.5 py-0.5 text-xs font-semibold text-[#526176]"
                      key={service.nameEn || service.nameAr || service.nameHe}
                      title={name}
                    >
                      {name}
                    </span>
                  );
                })}
                {extraCount > 0 && (
                  <span className="shrink-0 rounded-full border border-[#E3E8EF] bg-[#F8FAFC] px-2.5 py-0.5 text-xs font-semibold text-[#66758a]">
                    +{extraCount}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-[#66758a]">{d.directory.noServices}</span>
            )}
          </div>

          {/* CTA - div styled as button; no nested <a> inside the parent Link */}
          <div className={buttonClassName("primary", "md", "pointer-events-none mt-auto w-full justify-center")}>
            {d.landing.bookCta}
          </div>
        </div>
      </article>
    </Link>
  );
}

function getPreviewPlans(plans: PublicPlan[]) {
  const byCode = new Map(plans.map((plan) => [plan.code.toUpperCase(), plan]));
  const preferred = ["BASIC", "PROFESSIONAL", "ENTERPRISE"]
    .map((code) => byCode.get(code))
    .filter((plan): plan is PublicPlan => Boolean(plan));

  if (preferred.length === 3) return preferred;
  return [...plans].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 3);
}

function PricingPreviewSection({
  locale,
  plans,
  salesWhatsappNumber,
  text,
}: {
  locale: SupportedLocale;
  plans: PublicPlan[];
  salesWhatsappNumber: string;
  text: Dictionary["landing"];
}) {
  if (plans.length === 0) return null;

  const pricingCopy = publicPricingDictionaries[locale];
  const previewPlans = getPreviewPlans(plans);

  return (
    <section className="bg-[#F8F7F4] py-14 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex min-w-0 flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C8A45D]">
              {text.pricingPreviewEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#0B2D5C] sm:text-4xl">
              {text.pricingPreviewTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#66758a]">
              {text.pricingPreviewSubtitle}
            </p>
          </div>
          <Link
            className={buttonClassName(
              "secondary",
              "md",
              "w-full justify-center border-[#0B2D5C] bg-white text-[#0B2D5C] shadow-[0_10px_26px_rgba(11,45,92,0.06)] hover:border-[#C8A45D] hover:bg-[#C8A45D] hover:text-[#071F3F] md:w-auto",
            )}
            href="/pricing"
          >
            {text.pricingPreviewFullDetails}
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8">
          {previewPlans.map((plan) => {
            const isProfessional = plan.code.toUpperCase() === "PROFESSIONAL";
            const isHighlighted = plan.isPopular || isProfessional;
            const features = ((plan.features as ApiPlanFeature[] | null) ?? [])
              .filter((feature) => feature.included)
              .slice(0, 4);
            const message = buildPricingWhatsAppMessage(
              plan,
              pricingCopy.whatsapp,
            );
            const whatsappHref = salesWhatsappNumber
              ? buildPricingWhatsAppUrl(salesWhatsappNumber, message)
              : null;

            return (
              <article
                className={`relative flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border bg-white p-6 shadow-[0_16px_44px_rgba(11,45,92,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(11,45,92,0.13)] sm:p-7 ${
                  isHighlighted
                    ? "border-[#C8A45D]/80 bg-[linear-gradient(135deg,#FFF8E8_0%,#FFFFFF_52%)] shadow-[0_28px_72px_rgba(11,45,92,0.16),0_0_42px_rgba(200,164,93,0.22)] md:-mt-4 md:scale-[1.03]"
                    : plan.isContactPricing
                      ? "border-[#0B2D5C]/20 bg-[linear-gradient(135deg,#F7F9FC_0%,#FFFFFF_62%)]"
                      : "border-[#E3E8EF] bg-[linear-gradient(135deg,#FFFFFF_0%,#FBFAF7_100%)]"
                }`}
                key={plan.id}
              >
                {isHighlighted ? (
                  <span className="mb-5 w-max rounded-full border border-[#C8A45D]/35 bg-[#071F3F] px-3.5 py-1.5 text-xs font-black text-[#F6E6B8] shadow-[0_10px_26px_rgba(7,31,63,0.24)]">
                    {pricingCopy.plans.popular}
                  </span>
                ) : null}
                <h3 className="text-2xl font-black leading-tight text-[#0B2D5C]">
                  {getPublicPlanName(plan, locale)}
                </h3>
                <div className="mt-5 min-h-20">
                  {plan.isContactPricing ? (
                    <div className="rounded-2xl border border-[#C8A45D]/35 bg-white/75 px-4 py-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8A6A25]">
                        {pricingCopy.plans.customPricing}
                      </p>
                      <p className="mt-2 text-3xl font-black leading-none text-[#0B2D5C]">
                        {pricingCopy.plans.contactPricing}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="flex flex-wrap items-end gap-2">
                      <span className="text-5xl font-black leading-none text-[#0B2D5C]">
                        {plan.yearlyPrice}
                      </span>
                      <span className="pb-1 text-sm font-black uppercase tracking-[0.12em] text-[#8A6A25]">
                        {plan.currency}
                      </span>
                      </p>
                      <span className="mt-2 block text-sm font-semibold text-[#66758a]">
                        {pricingCopy.plans.perYear}
                      </span>
                    </div>
                  )}
                </div>
                <ul className="mt-5 flex-1 space-y-3">
                  {features.map((feature) => (
                    <li
                      className="flex min-w-0 items-start gap-3 text-sm font-semibold leading-6 text-[#526176]"
                      key={feature.key}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#C8A45D]/25 bg-[#FFF7E6] text-xs font-black text-[#0B2D5C]">
                        ✓
                      </span>
                      <span className="min-w-0">
                        {getPublicFeatureName(feature, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  {whatsappHref ? (
                    <a
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#0B2D5C] bg-[#0B2D5C] px-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(11,45,92,0.14)] transition hover:border-[#C8A45D] hover:bg-[#C8A45D] hover:text-[#071F3F] focus:outline-none focus:ring-3 focus:ring-[#C8A45D]/30"
                      href={whatsappHref}
                      onClick={() =>
                        trackPlatformEvent("PricingPlanWhatsAppClick", {
                          isContactPricing: plan.isContactPricing,
                          planCode: plan.code,
                          planId: plan.id,
                          planName: plan.nameEn,
                        })
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {text.pricingPreviewWhatsappCta}
                    </a>
                  ) : (
                    <button
                      className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-400"
                      disabled
                      type="button"
                    >
                      {text.pricingPreviewWhatsappCta}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyRoyalCareSection({ text }: { text: Dictionary["landing"] }) {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-9 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C8A45D]">
            RoyalCare
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#0B2D5C] sm:text-4xl">
            {text.whyRoyalCareTitle}
          </h2>
          <p className="mt-4 text-base leading-8 text-[#66758a]">
            {text.whyRoyalCareSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {text.whyRoyalCareBenefits.map((benefit, index) => (
            <article
              className="group min-w-0 rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-[0_12px_34px_rgba(11,45,92,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#C8A45D]/45 hover:shadow-[0_22px_50px_rgba(11,45,92,0.11)]"
              key={benefit.title}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C8A45D]/25 bg-[#F8F7F4] text-sm font-black text-[#0B2D5C] transition group-hover:bg-[#0B2D5C] group-hover:text-white">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 text-lg font-black text-[#0B2D5C]">
                {benefit.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#66758a]">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CentersDirectoryPage() {
  const { locale, direction } = useLanguage();
  const activeLocale = locale as SupportedLocale;
  const d = publicCentersDictionaries[activeLocale];
  const [centers, setCenters] = useState<PublicCenterSummary[]>([]);
  const [publicSettings, setPublicSettings] = useState<SystemSetting[]>([]);
  const [publicPlans, setPublicPlans] = useState<PublicPlan[]>([]);
  const [salesWhatsappNumber, setSalesWhatsappNumber] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) setStatus("loading");
        return listPublicCenters();
      })
      .then((data) => {
        if (!cancelled) {
          setCenters(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPublicSystemSettings()
      .then((res) => {
        if (!cancelled) setPublicSettings(res.settings);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    trackPlatformEvent("ViewCentersDirectory");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listPublicPlans().catch(() => []),
      getPlatformContact().catch(() => ({ salesWhatsappNumber: "" })),
    ]).then(([plans, contact]) => {
      if (cancelled) return;
      setPublicPlans([...plans].sort((a, b) => a.displayOrder - b.displayOrder));
      setSalesWhatsappNumber(contact.salesWhatsappNumber ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const settings = useMemo(
    () => makeSettingsMap(publicSettings),
    [publicSettings],
  );
  const localizedSuffix = activeLocale;
  const heroTitle = firstValue(
    settings.get(`public_hero_title_${localizedSuffix}`),
    d.landing.heroTitle,
  );
  const heroSubtitle = firstValue(
    settings.get(`public_hero_subtitle_${localizedSuffix}`),
    d.landing.heroSubtitle,
  );
  const ownerCta = firstValue(
    settings.get(`public_owner_cta_text_${localizedSuffix}`),
    d.landing.secondaryCta,
  );
  const patientCta = firstValue(
    settings.get(`public_patient_cta_text_${localizedSuffix}`),
    d.landing.primaryCta,
  );
  const heroImageUrl = firstValue(
    settings.get("public_hero_image_url"),
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1800&q=80",
  );
  const siteName = firstValue(settings.get("public_site_name"), "RoyalCare");
  const supportWhatsApp = firstValue(
    settings.get("public_whatsapp_url"),
    settings.get("public_support_whatsapp"),
  );

  useEffect(() => {
    if (siteName) {
      document.title = `${siteName} - ${d.meta.directoryTitle.replace(/^RoyalCare\s*[-—]\s*/u, "")}`;
    }
  }, [d.meta.directoryTitle, siteName]);

  const filteredCenters = useMemo(() => {
    const search = normalizeSearch(query);
    if (!search) return centers;
    return centers.filter((center) => getCenterSearchText(center).includes(search));
  }, [centers, query]);


  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#F6F8FB] text-[#0B2D5C]"
      dir={direction}
      lang={activeLocale}
    >
      <PublicHeader locale={activeLocale} settings={publicSettings} />

      <main className="min-w-0">
        <section className="relative overflow-hidden bg-[#061B35]">
          {/* Background: image overlay + multi-layer gradient */}
          <div className="absolute inset-0">
            <img
              alt=""
              className="h-full w-full object-cover opacity-[0.17]"
              decoding="async"
              fetchPriority="high"
              src={heroImageUrl}
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,27,53,0.98)_0%,rgba(11,45,92,0.97)_54%,rgba(7,31,63,0.98)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(200,164,93,0.14),transparent)]" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">

              {/* Left: text */}
              <div className="min-w-0 text-white">
                {/* Eyebrow pill */}
                <span className="inline-flex items-center gap-2 rounded-full border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-4 py-2 text-xs font-bold text-[#D8BD7A]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C8A45D]" />
                  {d.landing.heroEyebrow}
                </span>

                {/* Title */}
                <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  {heroTitle}
                </h1>

                {/* Subtitle */}
                <p className="mt-5 max-w-lg text-base leading-8 text-white/72 sm:text-lg">
                  {heroSubtitle}
                </p>

                {/* Search bar */}
                <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center">
                    <label className="sr-only" htmlFor="public-center-search">
                      {d.landing.searchPlaceholder}
                    </label>
                    <div className="flex flex-1 items-center gap-3 px-4">
                      <svg
                        className="h-4 w-4 shrink-0 text-[#8A98AA]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                      </svg>
                      <input
                        className="min-h-12 flex-1 min-w-0 bg-transparent py-1 text-sm font-semibold text-[#0B2D5C] outline-none placeholder:text-[#8A98AA]"
                        id="public-center-search"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={d.landing.searchPlaceholder}
                        value={query}
                      />
                    </div>
                    <a
                      className="hidden shrink-0 border-s border-[#E5E7EB] px-5 py-3.5 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#F8FAFC] sm:flex"
                      href="#featured-centers"
                    >
                      {patientCta}
                    </a>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#C8A45D] px-7 text-sm font-bold text-[#0B2D5C] shadow-[0_4px_20px_rgba(200,164,93,0.45)] transition hover:bg-[#D4B56A] focus:outline-none focus:ring-2 focus:ring-[#C8A45D]/60 sm:w-auto"
                    href="#featured-centers"
                  >
                    {patientCta}
                  </a>
                  <a
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/30 sm:w-auto"
                    href="#featured-centers"
                  >
                    {d.landing.exploreCta}
                  </a>
                </div>

                {/* Owner link - less prominent */}
                <p className="mt-5 text-xs text-white/45">
                  <Link
                    className="underline underline-offset-2 transition hover:text-white/70"
                    href="/open-center"
                  >
                    {ownerCta}
                  </Link>
                </p>
              </div>

              {/* Right: glass card */}
              <div className="min-w-0">
                <div className="rounded-3xl border border-white/18 bg-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-5">
                  <div className="overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                    <img
                      alt=""
                      className="h-52 w-full object-cover sm:h-64 lg:h-72"
                      decoding="async"
                      fetchPriority="high"
                      src={heroImageUrl}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/15 bg-white/15 p-3.5 text-white backdrop-blur-sm">
                      <p className="text-2xl font-black">+5,000</p>
                      <p className="mt-0.5 text-xs font-semibold text-white/65">{d.landing.heroStatPatientsLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/15 p-3.5 text-white backdrop-blur-sm">
                      <p className="text-2xl font-black">+120</p>
                      <p className="mt-0.5 text-xs font-semibold text-white/65">{d.landing.heroStatCentersLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/15 p-3.5 text-white backdrop-blur-sm">
                      <p className="text-2xl font-black">4.9 ★</p>
                      <p className="mt-0.5 text-xs font-semibold text-white/65">{d.landing.heroStatRatingLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/15 p-3.5 text-white backdrop-blur-sm">
                      <p className="text-2xl font-black">24/7</p>
                      <p className="mt-0.5 text-xs font-semibold text-white/65">{d.landing.heroStatBookingLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <PricingPreviewSection
          locale={activeLocale}
          plans={publicPlans}
          salesWhatsappNumber={salesWhatsappNumber}
          text={d.landing}
        />

        <WhyRoyalCareSection text={d.landing} />

        {/* === How It Works === */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16" id="how-it-works">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C8A45D]">
              {d.landing.howItWorksEyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#0B2D5C] sm:text-3xl">
              {d.landing.howItWorksTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#66758a]">
              {d.landing.howItWorksSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {d.landing.howItWorksSteps.map((step, index) => (
              <div
                className={`group relative flex flex-col items-center rounded-3xl border border-[#E3E8EF] bg-white p-7 text-center shadow-[0_8px_24px_rgba(11,45,92,0.06)] transition duration-200 hover:-translate-y-1.5 hover:border-[#C8A45D]/45 hover:shadow-[0_18px_44px_rgba(11,45,92,0.11)]${d.landing.howItWorksSteps.length % 2 !== 0 && index === d.landing.howItWorksSteps.length - 1 ? " sm:col-span-2 sm:mx-auto sm:max-w-sm lg:col-span-1 lg:max-w-none lg:mx-0" : ""}`}
                key={index}
              >
                <span className="absolute -top-3.5 start-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#0B2D5C] text-xs font-black text-white shadow">
                  {index + 1}
                </span>
                <span className="text-5xl" role="img">{step.icon}</span>
                <h3 className="mt-4 text-lg font-black text-[#0B2D5C]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#66758a]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === Trusted Numbers (scroll-animated) === */}
        <section className="bg-[#0B2D5C] py-12 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D8BD7A]">
                {d.landing.trustedNumbersEyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                {d.landing.trustedNumbersTitle}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center rounded-2xl border border-white/12 bg-white/8 p-6 text-center text-white backdrop-blur-sm">
                <p className="text-3xl font-black sm:text-4xl">
                  <AnimatedCounter prefix="+" value={5000} />
                </p>
                <p className="mt-2 text-sm font-semibold text-white/70">{d.landing.heroStatPatientsLabel}</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/12 bg-white/8 p-6 text-center text-white backdrop-blur-sm">
                <p className="text-3xl font-black sm:text-4xl">
                  <AnimatedCounter prefix="+" value={120} />
                </p>
                <p className="mt-2 text-sm font-semibold text-white/70">{d.landing.heroStatCentersLabel}</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/12 bg-white/8 p-6 text-center text-white backdrop-blur-sm">
                <p className="text-3xl font-black sm:text-4xl">4.9 ★</p>
                <p className="mt-2 text-sm font-semibold text-white/70">{d.landing.heroStatRatingLabel}</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/12 bg-white/8 p-6 text-center text-white backdrop-blur-sm">
                <p className="text-3xl font-black sm:text-4xl">24/7</p>
                <p className="mt-2 text-sm font-semibold text-white/70">{d.landing.heroStatBookingLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
          id="featured-centers"
        >
          <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#C8A45D]">
                {d.directory.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#0B2D5C] sm:text-3xl">
                {d.landing.featuredCentersTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
                {d.landing.featuredCentersSubtitle}
              </p>
            </div>
            {query ? (
              <button
                className="min-h-10 rounded-lg border border-[#E3E8EF] bg-white px-4 text-sm font-bold text-[#0B2D5C] transition hover:border-[#C8A45D]/60 hover:bg-[#F8FAFC]"
                onClick={() => setQuery("")}
                type="button"
              >
                {d.landing.clearSearch}
              </button>
            ) : null}
          </div>

          {status === "loading" ? (
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <SkeletonCard key={item} />
              ))}
            </div>
          ) : status === "error" ? (
            <AdminState title={d.directory.loadError} tone="error" />
          ) : filteredCenters.length === 0 ? (
            <AdminState
              body={d.landing.emptySearchBody}
              className="border-dashed"
              title={d.landing.emptySearchTitle}
            />
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCenters.map((center, index) => (
                <CenterCard
                  center={center}
                  d={d}
                  index={index}
                  key={center.slug}
                  locale={activeLocale}
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white py-10 sm:py-14" id="features">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-[#C8A45D]">
                {d.landing.whyEyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#0B2D5C] sm:text-3xl">
                {d.landing.whyTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#66758a]">
                {d.landing.whySubtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {d.landing.ownerFeatures.map((feature) => (
                <div
                  className="rounded-2xl border border-[#E3E8EF] bg-[#F8FAFC] p-4 transition hover:border-[#C8A45D]/45 hover:bg-white hover:shadow-sm"
                  key={feature.title}
                >
                  <h3 className="font-black text-[#0B2D5C]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#66758a]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === Testimonials === */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C8A45D]">
                {d.landing.testimonialsEyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-black text-[#0B2D5C] sm:text-3xl">
                {d.landing.testimonialsTitle}
              </h2>
            </div>

            {/* Mobile: horizontal swipe */}
            <div className={"-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"}>
              {d.landing.testimonials.map((item) => (
                <figure
                  className="w-[82vw] max-w-xs flex-shrink-0 rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_8px_24px_rgba(11,45,92,0.07)]"
                  key={item.name + "-m"}
                >
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar name={item.name} />
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#0B2D5C]">{item.name}</p>
                      <p className="text-xs font-semibold text-[#66758a]">{item.city}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StarRating rating={item.rating} />
                  </div>
                  <blockquote className="mt-3 text-sm leading-7 text-[#526176]">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </figure>
              ))}
            </div>

            {/* Tablet+: grid */}
            <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {d.landing.testimonials.map((item) => (
                <figure
                  className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_8px_24px_rgba(11,45,92,0.07)] transition duration-150 hover:shadow-[0_18px_44px_rgba(11,45,92,0.11)]"
                  key={item.name + "-d"}
                >
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar name={item.name} />
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#0B2D5C]">{item.name}</p>
                      <p className="text-xs font-semibold text-[#66758a]">{item.city}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StarRating rating={item.rating} />
                  </div>
                  <blockquote className="mt-3 text-sm leading-7 text-[#526176]">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#EEF4F8] py-14 text-[#0B2D5C] sm:py-20" id="faq">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C8A45D]">
                {d.landing.faqEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {d.landing.faqTitle}
              </h2>
            </div>
            <div className="space-y-3">
              {d.landing.faq.map((item) => (
                <details
                  className="group rounded-2xl border border-[#DDE6EF] bg-white/80 p-5 shadow-[0_12px_34px_rgba(11,45,92,0.06)] transition open:border-[#C8A45D]/45 open:bg-white"
                  key={item.question}
                >
                  <summary className="cursor-pointer list-none text-sm font-black">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#66758a]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter locale={activeLocale} settings={publicSettings} />
    </div>
  );
}
