"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import { publicPricingDictionaries } from "@/i18n/dictionaries/public-pricing";
import { listPublicPlans, type ApiPlanFeature, type PublicPlan } from "@/lib/api/super-admin-plans";
import { getPlatformContact } from "@/lib/api/system-settings";
import { trackPlatformEvent } from "@/lib/marketing/platform-track";
import { PublicHeader } from "@/features/public/centers/PublicHeader";
import { PublicFooter } from "@/features/public/centers/PublicFooter";
import {
  buildPricingWhatsAppMessage,
  buildPricingWhatsAppUrl,
  getPublicFeatureName,
  getPublicPlanDescription,
  getPublicPlanName,
} from "./pricing-whatsapp";

type PricingDictionary = (typeof publicPricingDictionaries)["en"];

function FeatureRow({
  feature,
  includedLabel,
  locale,
  notIncludedLabel,
}: {
  feature: ApiPlanFeature;
  includedLabel: string;
  locale: SupportedLocale;
  notIncludedLabel: string;
}) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      {feature.included ? (
        <span
          aria-label={includedLabel}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#C8A45D]/25 bg-[#FFF7E6] text-xs font-black text-[#0B2D5C]"
        >
          ✓
        </span>
      ) : (
        <span
          aria-label={notIncludedLabel}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400"
        >
          -
        </span>
      )}
      <span
        className={`text-sm leading-6 ${
          feature.included ? "font-semibold text-[#1e3a5f]" : "text-[#9aa5b4] line-through"
        }`}
      >
        {getPublicFeatureName(feature, locale)}
      </span>
    </li>
  );
}

function WhatsAppMark() {
  return (
    <svg aria-hidden className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.04 2.04a9.86 9.86 0 0 0-8.47 14.91L2.4 21.6l4.76-1.13A9.85 9.85 0 1 0 12.04 2.04Zm0 1.78a8.07 8.07 0 1 1-4.11 15l-.32-.19-2.63.62.65-2.54-.21-.34a8.06 8.06 0 0 1 6.62-12.55Zm-3.3 4.35c-.18 0-.47.07-.72.34-.25.27-.94.92-.94 2.25s.96 2.61 1.1 2.79c.13.18 1.88 3.02 4.65 4.11 2.3.9 2.78.72 3.28.68.5-.05 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.11-.25-.18-.52-.32-.27-.13-1.62-.8-1.87-.89-.25-.09-.43-.13-.61.14-.18.27-.7.89-.86 1.07-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.56.13-.13.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.48-.84-2.02-.22-.53-.45-.46-.61-.46h-.53Z" />
    </svg>
  );
}

function PlanCard({
  dictionary,
  locale,
  onCtaClick,
  plan,
  salesWhatsappNumber,
}: {
  dictionary: PricingDictionary;
  locale: SupportedLocale;
  onCtaClick: (plan: PublicPlan) => void;
  plan: PublicPlan;
  salesWhatsappNumber: string;
}) {
  const name = getPublicPlanName(plan, locale);
  const description = getPublicPlanDescription(plan, locale);
  const isProfessional = plan.code.toUpperCase() === "PROFESSIONAL";
  const isPopular = plan.isPopular || isProfessional;
  const isEnterprise = plan.isContactPricing || plan.code.toUpperCase() === "ENTERPRISE";
  const features = (plan.features as ApiPlanFeature[] | null) ?? [];
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = expanded ? features : features.slice(0, 6);
  const hasMoreFeatures = features.length > 6;

  const message = buildPricingWhatsAppMessage(plan, dictionary.whatsapp);
  const ctaHref = salesWhatsappNumber
    ? buildPricingWhatsAppUrl(salesWhatsappNumber, message)
    : null;

  const ctaLabel = plan.isContactPricing
    ? dictionary.plans.contactUs
    : dictionary.plans.getStarted;

  const priceBlock = plan.isContactPricing ? (
    <div className="mt-6 rounded-2xl border border-[#C8A45D]/35 bg-white/75 px-5 py-4 shadow-inner shadow-[#C8A45D]/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8A6A25]">
        {dictionary.plans.customPricing}
      </p>
      <p className="mt-2 text-3xl font-black leading-none text-[#0B2D5C] sm:text-4xl">
        {dictionary.plans.contactUs}
      </p>
    </div>
  ) : (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-5xl font-black leading-none tracking-normal text-[#0B2D5C] sm:text-6xl">
          {plan.yearlyPrice}
        </span>
        <span className="pb-1 text-sm font-black uppercase tracking-[0.12em] text-[#8A6A25]">
          {plan.currency}
        </span>
      </div>
      <span className="mt-2 block text-sm font-semibold text-[#66758a]">
        {dictionary.plans.perYear}
      </span>
    </div>
  );

  const ctaStyle = isPopular
    ? "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2D5C] px-5 text-center text-sm font-black text-white shadow-[0_14px_32px_rgba(11,45,92,0.22)] transition hover:bg-[#C8A45D] hover:text-[#071F3F] focus:outline-none focus:ring-3 focus:ring-[#C8A45D]/35"
    : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0B2D5C] bg-[#0B2D5C] px-5 text-center text-sm font-black text-white transition hover:border-[#C8A45D] hover:bg-[#C8A45D] hover:text-[#071F3F] focus:outline-none focus:ring-3 focus:ring-[#C8A45D]/30";
  const disabledCtaStyle =
    "inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-100 px-5 text-center text-sm font-bold text-slate-400";

  return (
    <article
      className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border bg-white transition duration-200 hover:-translate-y-1 ${
        isPopular
          ? "z-10 border-[#C8A45D]/80 shadow-[0_30px_80px_rgba(11,45,92,0.18),0_0_48px_rgba(200,164,93,0.25)] md:-mt-5 md:scale-[1.035]"
          : isEnterprise
            ? "border-[#0B2D5C]/20 shadow-[0_18px_48px_rgba(11,45,92,0.1)] hover:shadow-[0_26px_64px_rgba(11,45,92,0.16)]"
            : "border-[#E3E8EF] shadow-[0_16px_44px_rgba(11,45,92,0.08)] hover:shadow-[0_24px_58px_rgba(11,45,92,0.13)]"
      }`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
          isPopular ? "bg-[#C8A45D]" : isEnterprise ? "bg-[#0B2D5C]" : "bg-[#D8BD7A]"
        }`}
      />
      {isPopular ? (
        <div className="absolute end-5 top-5 z-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8A45D]/35 bg-[#071F3F] px-3.5 py-1.5 text-xs font-black text-[#F6E6B8] shadow-[0_10px_26px_rgba(7,31,63,0.28)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8A45D]" />
            {dictionary.plans.popular}
          </span>
        </div>
      ) : null}

      <div
        className={`px-7 pb-7 pt-9 sm:px-8 ${
          isPopular
            ? "bg-[linear-gradient(135deg,#FFF8E8_0%,#F3E3BD_48%,#FFFFFF_100%)]"
            : isEnterprise
              ? "bg-[linear-gradient(135deg,#F7F9FC_0%,#EEF3F8_55%,#FFFFFF_100%)]"
              : "bg-[linear-gradient(135deg,#FFFFFF_0%,#F8F7F4_100%)]"
        }`}
      >
        <h3 className="max-w-[13rem] text-2xl font-black leading-tight text-[#0B2D5C]">
          {name}
        </h3>
        {description ? (
          <p className="mt-3 min-h-12 text-sm leading-7 text-[#526176]">
            {description}
          </p>
        ) : null}
        {priceBlock}
      </div>

      <div className="flex flex-1 flex-col px-7 pb-8 pt-6 sm:px-8">
        {features.length > 0 ? (
          <>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#8A6A25]">
              {dictionary.plans.featuresHeading}
            </p>
            <ul className="flex-1 space-y-1 divide-y divide-[#EEF2F6]">
              {visibleFeatures.map((feature) => (
                <FeatureRow
                  feature={feature}
                  includedLabel={dictionary.plans.included}
                  key={feature.key}
                  locale={locale}
                  notIncludedLabel={dictionary.plans.notIncluded}
                />
              ))}
            </ul>
            {hasMoreFeatures ? (
              <button
                className="mt-4 text-start text-sm font-black text-[#0B2D5C] underline decoration-[#C8A45D]/70 underline-offset-4 transition hover:text-[#8A6A25]"
                onClick={() => setExpanded((current) => !current)}
                type="button"
              >
                {expanded ? dictionary.plans.showLessFeatures : dictionary.plans.viewAllFeatures}
              </button>
            ) : null}
          </>
        ) : null}

        <div className="mt-9">
          {ctaHref ? (
            <a
              className={ctaStyle}
              href={ctaHref}
              onClick={() => onCtaClick(plan)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppMark />
              {ctaLabel}
            </a>
          ) : (
            <button className={disabledCtaStyle} disabled type="button">
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function WhyPricingSection({ dictionary }: { dictionary: PricingDictionary }) {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-9 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">
            RoyalCare
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[#0B2D5C] sm:text-4xl">
            {dictionary.why.title}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dictionary.why.benefits.map((benefit, index) => (
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

function FinalCtaSection({
  dictionary,
  salesWhatsappNumber,
}: {
  dictionary: PricingDictionary;
  salesWhatsappNumber: string;
}) {
  const whatsappHref = salesWhatsappNumber
    ? buildPricingWhatsAppUrl(salesWhatsappNumber, dictionary.finalCta.whatsappMessage)
    : null;

  return (
    <section className="bg-[#071F3F] py-12 sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 text-white md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">
            RoyalCare
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            {dictionary.finalCta.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            {dictionary.finalCta.subtitle}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          {whatsappHref ? (
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C8A45D]/35 bg-[#0B2D5C] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition hover:bg-[#C8A45D] hover:text-[#071F3F]"
              href={whatsappHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppMark />
              {dictionary.finalCta.whatsapp}
            </a>
          ) : null}
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#C8A45D] px-6 text-sm font-black text-[#071F3F] transition hover:bg-[#D7B76A]"
            href="/open-center"
          >
            {dictionary.finalCta.openCenter}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PricingPage() {
  const { locale, direction } = useLanguage();
  const d = publicPricingDictionaries[locale];

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesWhatsappNumber, setSalesWhatsappNumber] = useState("");

  function loadData() {
    setLoading(true);
    setError(null);

    Promise.all([
      listPublicPlans(),
      getPlatformContact().catch(() => ({ salesWhatsappNumber: "" })),
    ])
      .then(([plansData, contact]) => {
        setPlans([...plansData].sort((a, b) => a.displayOrder - b.displayOrder));
        setSalesWhatsappNumber(contact.salesWhatsappNumber ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError(d.loadError);
        setLoading(false);
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [locale]);

  function handleCtaClick(plan: PublicPlan) {
    trackPlatformEvent("PricingPlanWhatsAppClick", {
      planId: plan.id,
      planCode: plan.code,
      planName: plan.nameEn,
      isContactPricing: plan.isContactPricing,
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]" dir={direction} lang={locale}>
      <PublicHeader locale={locale} />

      <main>
        <section className="relative overflow-hidden bg-[#071F3F] pb-16 pt-12 sm:pb-20 sm:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(200,164,93,0.22),transparent_62%),linear-gradient(135deg,#061B35_0%,#0B2D5C_52%,#071F3F_100%)]"
          />
          <div className="relative mx-auto max-w-5xl px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">
              {d.hero.eyebrow}
            </p>
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              {d.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#B8C5D6] sm:text-lg">
              {d.hero.subtitle}
            </p>
          </div>
          <div className="absolute bottom-0 start-0 end-0 h-10 rounded-t-[2rem] bg-[#F8F7F4]" />
        </section>

        <section className="relative mx-auto max-w-7xl -mt-5 px-5 pb-16 sm:-mt-6 sm:pb-20">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C8A45D] border-t-transparent" />
              <span className="text-sm font-medium text-[#66758a]">{d.loading}</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-rose-700">{error}</p>
              <button
                className="mt-4 rounded-lg bg-[#0B2D5C] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071F3F]"
                onClick={loadData}
                type="button"
              >
                {d.loadError.split(".")[0]}
              </button>
            </div>
          ) : plans.length === 0 ? (
            <p className="py-20 text-center text-sm text-[#66758a]">{d.noPlans}</p>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8">
              {plans.map((plan) => (
                <PlanCard
                  dictionary={d}
                  key={plan.id}
                  locale={locale}
                  onCtaClick={handleCtaClick}
                  plan={plan}
                  salesWhatsappNumber={salesWhatsappNumber}
                />
              ))}
            </div>
          )}
        </section>

        <WhyPricingSection dictionary={d} />

        <section className="border-y border-[#DDE6EF] bg-[#EEF4F8] py-12">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-5 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              locale === "ar" ? "بيانات مشفرة" : locale === "he" ? "נתונים מוצפנים" : "Encrypted data",
              locale === "ar" ? "دعم متخصص" : locale === "he" ? "תמיכה מקצועית" : "Dedicated support",
              locale === "ar" ? "إعداد سريع" : locale === "he" ? "הגדרה מהירה" : "Quick setup",
              locale === "ar" ? "متعدد اللغات" : locale === "he" ? "רב-לשוני" : "Multilingual",
            ].map((label) => (
              <div
                className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 text-sm font-black text-[#0B2D5C] shadow-[0_10px_28px_rgba(11,45,92,0.06)]"
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        <FinalCtaSection dictionary={d} salesWhatsappNumber={salesWhatsappNumber} />
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
