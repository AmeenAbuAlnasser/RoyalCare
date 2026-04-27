"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatCompactCurrency, formatDate, formatNumber } from "@/i18n/formatters";
import { superAdminPlanDetailsDictionaries } from "@/i18n/dictionaries/super-admin-plan-details";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { planDetailsById, type PlanDetails } from "./plan-details-data";

type Dictionary = (typeof superAdminPlanDetailsDictionaries)["en"];
type Tone = "danger" | "gold" | "navy" | "neutral" | "success";

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: Tone }) {
  const styles: Record<Tone, string> = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function DetailList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3" key={label}>
          <dt className="text-xs font-medium text-[#66758a]">{label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function boolLabel(value: boolean, dictionary: Dictionary) {
  return value ? dictionary.values.enabled : dictionary.values.disabled;
}

function boolBadge(value: boolean, dictionary: Dictionary) {
  return <Badge tone={value ? "success" : "neutral"}>{boolLabel(value, dictionary)}</Badge>;
}

function priceOrNone(value: number, locale: ReturnType<typeof useLanguage>["locale"], dictionary: Dictionary) {
  return value > 0 ? formatCompactCurrency(value, locale) : dictionary.values.noSetupFee;
}

function PlanTitle({ dictionary, plan }: { dictionary: Dictionary; plan: PlanDetails }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
          {dictionary.header.eyebrow}
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="break-words text-xl font-semibold text-[#0B2D5C]">
            {dictionary.plans[plan.nameKey]}
          </h2>
          {plan.isPopular ? <Badge tone="gold">{dictionary.values.featured}</Badge> : null}
          <Badge tone={plan.status === "active" ? "navy" : "neutral"}>
            {dictionary.statuses[plan.status]}
          </Badge>
        </div>
      </div>
      <Link className={buttonClassName("secondary", "md", "w-full sm:w-auto")} href="/super-admin/plans">
        {dictionary.actions.backToPlans}
      </Link>
    </section>
  );
}

function QuickActions({ dictionary, plan }: { dictionary: Dictionary; plan: PlanDetails }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <button className={buttonClassName("primary", "md")} type="button">
        {dictionary.actions.editPlan}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.actions.duplicatePlan}
      </button>
      <button className={buttonClassName(plan.status === "active" ? "warning" : "success", "md")} type="button">
        {plan.status === "active" ? dictionary.actions.deactivate : dictionary.actions.activate}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.actions.markFeatured}
      </button>
      <button className={buttonClassName("danger", "md")} type="button">
        {dictionary.actions.deletePlan}
      </button>
      <p className="text-xs leading-5 text-[#66758a]">{dictionary.values.actionsHint}</p>
    </div>
  );
}

export function SuperAdminPlanDetailsPage({ planId }: { planId: string }) {
  const { locale } = useLanguage();
  const dictionary = superAdminPlanDetailsDictionaries[locale];
  const plan = planDetailsById[planId];

  if (!plan) {
    return (
      <SuperAdminLayout activeNav="plans" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.header.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B2D5C]">{dictionary.values.notFoundTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {dictionary.values.notFoundDescription}
          </p>
          <Link className={buttonClassName("secondary", "md", "mt-5 w-full sm:w-auto")} href="/super-admin/plans">
            {dictionary.actions.backToPlans}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const trial = plan.trialDuration > 0
    ? `${formatNumber(plan.trialDuration)} ${dictionary.values.days}`
    : dictionary.values.noTrial;
  const modules = plan.modules.map((module) => dictionary.modules[module]).join(", ");
  const lowerPlan = plan.lowerPlan ? dictionary.plans[plan.lowerPlan] : dictionary.values.noLowerPlan;
  const higherPlan = plan.higherPlan ? dictionary.plans[plan.higherPlan] : dictionary.plans.enterprise;

  return (
    <SuperAdminLayout activeNav="plans" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <PlanTitle dictionary={dictionary} plan={plan} />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [dictionary.fields.planName, dictionary.plans[plan.nameKey]],
                [dictionary.fields.monthlyPrice, formatCompactCurrency(plan.monthlyPrice, locale)],
                [dictionary.fields.yearlyPrice, formatCompactCurrency(plan.yearlyPrice, locale)],
                [dictionary.fields.trialDuration, trial],
                [dictionary.fields.setupFee, priceOrNone(plan.setupFee, locale, dictionary)],
                [dictionary.fields.featuredPlan, plan.isPopular ? dictionary.values.featured : dictionary.values.notFeatured],
                [dictionary.fields.status, <Badge key="status" tone={plan.status === "active" ? "navy" : "neutral"}>{dictionary.statuses[plan.status]}</Badge>],
                [dictionary.fields.createdDate, formatDate(plan.createdDate, locale)],
                [dictionary.fields.lastUpdated, formatDate(plan.lastUpdated, locale)],
              ]}
            />
          </Section>
          <Section title={dictionary.sections.quickActions}>
            <QuickActions dictionary={dictionary} plan={plan} />
          </Section>
        </div>

        <Section title={dictionary.sections.includedFeatures}>
          <DetailList
            items={[
              [dictionary.fields.maxUsers, `${formatNumber(plan.maxUsers)} ${dictionary.values.users}`],
              [dictionary.fields.maxBranches, `${formatNumber(plan.maxBranches)} ${dictionary.values.branches}`],
              [dictionary.fields.maxAppointments, formatNumber(plan.maxAppointments)],
              [dictionary.fields.maxCustomers, formatNumber(plan.maxCustomers)],
              [dictionary.fields.storageLimit, `${formatNumber(plan.storageLimitGb)} ${dictionary.values.gb}`],
              [dictionary.fields.includedModules, modules],
              [dictionary.fields.whatsAppNotifications, boolBadge(plan.whatsAppNotifications, dictionary)],
              [dictionary.fields.smsNotifications, boolBadge(plan.smsNotifications, dictionary)],
              [dictionary.fields.emailNotifications, boolBadge(plan.emailNotifications, dictionary)],
              [dictionary.fields.apiAccess, boolBadge(plan.apiAccess, dictionary)],
              [dictionary.fields.customDomainSupport, boolBadge(plan.customDomainSupport, dictionary)],
              [dictionary.fields.prioritySupport, <Badge key="support" tone={plan.supportLevel === "basic" ? "neutral" : "gold"}>{dictionary.supportLevels[plan.supportLevel]}</Badge>],
            ]}
          />
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.currentSubscribers}>
            <DetailList
              items={[
                [dictionary.fields.currentSubscribers, `${formatNumber(plan.currentSubscribers)} ${dictionary.values.subscribers}`],
                [dictionary.fields.revenueContribution, formatCompactCurrency(plan.revenueContribution, locale)],
                [
                  dictionary.fields.recentSubscribers,
                  <ul className="space-y-1" key="subscribers">
                    {plan.recentSubscribers.map((subscriber) => (
                      <li key={subscriber}>{dictionary.subscribers[subscriber]}</li>
                    ))}
                  </ul>,
                ],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.upgradePaths}>
            <DetailList
              items={[
                [dictionary.fields.lowerPlan, lowerPlan],
                [dictionary.fields.higherPlan, higherPlan],
                [dictionary.fields.recommendedUpgradePath, dictionary.plans[plan.recommendedUpgradePath]],
              ]}
            />
          </Section>
        </div>

        <Section title={dictionary.sections.internalNotes}>
          <label className="block min-w-0">
            <span className="text-sm font-medium text-[#24364f]">{dictionary.values.notesLabel}</span>
            <textarea
              className="mt-2 min-h-36 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
              placeholder={dictionary.values.notesPlaceholder}
            />
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#66758a]">{dictionary.values.notesHelper}</p>
            <button className={buttonClassName("secondary", "md", "w-full sm:w-auto")} type="button">
              {dictionary.actions.saveNotes}
            </button>
          </div>
        </Section>
      </div>
    </SuperAdminLayout>
  );
}
