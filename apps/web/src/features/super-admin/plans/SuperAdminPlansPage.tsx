"use client";

import { useState, type ReactNode } from "react";
import { buttonClassName, primaryButtonClassName } from "@/components/ui/button-styles";
import { SuperAdminActionMenu } from "@/features/super-admin/components/SuperAdminActionMenu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatCompactCurrency, formatNumber } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminPlansDictionaries } from "@/i18n/dictionaries/super-admin-plans";
import { planFilters, planRows, planStats } from "./plans-data";

type Dictionary = (typeof superAdminPlansDictionaries)["en"];
type PlanRow = (typeof planRows)[number];

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

function Badge({ children, tone }: { children: ReactNode; tone: "gold" | "navy" | "neutral" }) {
  const styles = {
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function ActionMenu({
  dictionary,
  isOpen,
  onClose,
  onToggle,
  plan,
}: {
  dictionary: Dictionary;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  plan: PlanRow;
}) {
  return (
    <SuperAdminActionMenu
      isOpen={isOpen}
      items={[
        { href: `/super-admin/plans/${plan.id}`, icon: "view", label: dictionary.actions.viewPlan },
        { icon: "edit", label: dictionary.actions.editPlan },
        { icon: "duplicate", label: dictionary.actions.duplicatePlan },
        {
          icon: plan.status === "active" ? "suspend" : "activate",
          label: plan.status === "active" ? dictionary.actions.deactivate : dictionary.actions.activate,
          tone: plan.status === "active" ? "warning" : "success",
        },
        { icon: "delete", label: dictionary.actions.deletePlan, tone: "danger" },
      ]}
      onClose={onClose}
      onToggle={onToggle}
      triggerLabel={dictionary.fields.actions}
    />
  );
}

function DetailPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</div>
    </div>
  );
}

function PlanCard({
  dictionary,
  isOpen,
  onClose,
  onToggle,
  plan,
}: {
  dictionary: Dictionary;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  plan: PlanRow;
}) {
  const { locale } = useLanguage();
  const modules = plan.modules.map((module) => dictionary.modules[module]).join(", ");
  const trial =
    plan.trialDuration > 0
      ? `${formatNumber(plan.trialDuration)} ${dictionary.values.days}`
      : dictionary.values.noTrial;

  return (
    <article className={`min-w-0 rounded-lg border bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)] ${plan.isPopular ? "border-[#C8A45D]/65" : "border-[#E5E7EB]"}`}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold text-[#0B2D5C]">
              {dictionary.plans[plan.nameKey]}
            </h4>
            {plan.isPopular ? <Badge tone="gold">{dictionary.values.featured}</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-[#66758a]">
            {formatCompactCurrency(plan.monthlyPrice, locale)} / {formatCompactCurrency(plan.yearlyPrice, locale)}
          </p>
        </div>
        <Badge tone={plan.status === "active" ? "navy" : "neutral"}>
          {dictionary.statuses[plan.status]}
        </Badge>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <DetailPair label={dictionary.fields.trialDuration} value={trial} />
        <DetailPair label={dictionary.fields.maxUsers} value={`${formatNumber(plan.maxUsers)} ${dictionary.values.users}`} />
        <DetailPair label={dictionary.fields.maxBranches} value={`${formatNumber(plan.maxBranches)} ${dictionary.values.branches}`} />
        <DetailPair label={dictionary.fields.supportLevel} value={dictionary.supportLevels[plan.supportLevel]} />
        <div className="md:col-span-2">
          <DetailPair label={dictionary.fields.includedModules} value={modules} />
        </div>
      </div>

      <div className="mt-4">
        <ActionMenu dictionary={dictionary} isOpen={isOpen} onClose={onClose} onToggle={onToggle} plan={plan} />
      </div>
    </article>
  );
}

export function SuperAdminPlansPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminPlansDictionaries[locale];
  const [openActions, setOpenActions] = useState<string | null>(null);

  return (
    <SuperAdminLayout activeNav="plans" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
              {dictionary.header.eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#0B2D5C]">{dictionary.header.title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">{dictionary.header.subtitle}</p>
          </div>
          <button className={primaryButtonClassName("w-full sm:w-auto")} type="button">
            {dictionary.actions.addNewPlan}
          </button>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {planStats.map((stat) => (
            <article className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]" key={stat.key}>
              <p className="text-sm font-medium text-[#66758a]">{dictionary.stats[stat.key]}</p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {"valueKey" in stat ? dictionary.plans[stat.valueKey] : formatNumber(stat.value)}
              </p>
            </article>
          ))}
        </section>

        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">{dictionary.filters.searchLabel}</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
              />
            </label>
            <div className="flex min-w-0 flex-wrap gap-2">
              <button className={buttonClassName("primary", "sm")} type="button">{dictionary.filters.all}</button>
              {planFilters.map((filter) => (
                <button className={buttonClassName("secondary", "sm")} key={filter} type="button">
                  {dictionary.filters[filter]}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title={dictionary.sections.plansList}>
          <p className="mb-4 text-sm leading-6 text-[#66758a] md:hidden">
            {dictionary.values.mobileHint}
          </p>
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            {planRows.map((plan) => (
              <PlanCard
                dictionary={dictionary}
                isOpen={openActions === plan.id}
                key={plan.id}
                onClose={() => setOpenActions(null)}
                onToggle={() => setOpenActions((current) => (current === plan.id ? null : plan.id))}
                plan={plan}
              />
            ))}
          </div>
        </Section>

        <Section title={dictionary.sections.comparison}>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-[#F8FAFC] text-[#66758a]">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{dictionary.fields.planName}</th>
                  <th className="px-4 py-3 text-start font-medium">{dictionary.fields.monthlyPrice}</th>
                  <th className="px-4 py-3 text-start font-medium">{dictionary.fields.yearlyPrice}</th>
                  <th className="px-4 py-3 text-start font-medium">{dictionary.fields.maxUsers}</th>
                  <th className="px-4 py-3 text-start font-medium">{dictionary.fields.maxBranches}</th>
                  <th className="px-4 py-3 text-start font-medium">{dictionary.fields.supportLevel}</th>
                </tr>
              </thead>
              <tbody>
                {planRows.map((plan) => (
                  <tr className="border-t border-[#E5E7EB]" key={plan.id}>
                    <td className="px-4 py-4 font-semibold text-[#0B2D5C]">{dictionary.plans[plan.nameKey]}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatCompactCurrency(plan.monthlyPrice, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatCompactCurrency(plan.yearlyPrice, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatNumber(plan.maxUsers)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatNumber(plan.maxBranches)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{dictionary.supportLevels[plan.supportLevel]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </SuperAdminLayout>
  );
}
