"use client";

import { useState, type ReactNode } from "react";
import { SuperAdminActionMenu } from "@/features/super-admin/components/SuperAdminActionMenu";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  formatCompactCurrency,
  formatDate,
  formatNumber,
} from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminSubscriptionsDictionaries } from "@/i18n/dictionaries/super-admin-subscriptions";
import {
  autoRenewalFilters,
  dateRangeFilters,
  expiringSoonRows,
  planFilters,
  revenueSnapshot,
  statusFilters,
  subscriptionStats,
  subscriptionsRows,
} from "./subscriptions-data";

type Dictionary = (typeof superAdminSubscriptionsDictionaries)["en"];
type SubscriptionRow = (typeof subscriptionsRows)[number];
type SubscriptionStatus = keyof Dictionary["statuses"];
type PaymentStatus = keyof Dictionary["paymentStatuses"];

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: SubscriptionStatus;
}) {
  const styles: Record<SubscriptionStatus, string> = {
    active: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    trial: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    expired: "border-rose-200 bg-rose-50 text-rose-700",
    suspended: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function PaymentBadge({
  label,
  status,
}: {
  label: string;
  status: PaymentStatus;
}) {
  const styles: Record<PaymentStatus, string> = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    failed: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function FilterSelect({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-[#24364f]">{label}</span>
      <select className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12">
        {children}
      </select>
    </label>
  );
}

function ActionMenu({
  dictionary,
  isOpen,
  onClose,
  onToggle,
  subscriptionId,
}: {
  dictionary: Dictionary;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  subscriptionId: string;
}) {
  return (
    <SuperAdminActionMenu
      isOpen={isOpen}
      items={[
        { href: `/super-admin/subscriptions/${subscriptionId}`, icon: "view", label: dictionary.actions.view },
        { icon: "edit", label: dictionary.actions.edit },
        { icon: "renew", label: dictionary.actions.renew },
        { icon: "upgrade", label: dictionary.actions.upgradePlan },
        { icon: "suspend", label: dictionary.actions.suspend, tone: "warning" },
        { icon: "invoice", label: dictionary.actions.invoiceHistory },
        { icon: "delete", label: dictionary.actions.cancel, tone: "danger" },
      ]}
      onClose={onClose}
      onToggle={onToggle}
      triggerLabel={dictionary.table.actions}
    />
  );
}

function DetailPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
        {value}
      </div>
    </div>
  );
}

export function SuperAdminSubscriptionsPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminSubscriptionsDictionaries[locale];
  const [openMobileActions, setOpenMobileActions] = useState<string | null>(null);
  const [openDesktopActions, setOpenDesktopActions] = useState<string | null>(null);

  function formatMoney(value: number) {
    return formatCompactCurrency(value, locale);
  }

  function renderAutoRenewal(row: SubscriptionRow) {
    return row.autoRenewal ? dictionary.values.enabled : dictionary.values.disabled;
  }

  return (
    <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {subscriptionStats.map((stat) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
              key={stat.key}
            >
              <p className="text-sm font-medium text-[#66758a]">
                {dictionary.stats[stat.key]}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {"type" in stat && stat.type === "money"
                  ? formatMoney(stat.value)
                  : formatNumber(stat.value)}
              </p>
            </article>
          ))}
        </section>

        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.8fr))]">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.searchLabel}
              </span>
              <input
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
              />
            </label>

            <FilterSelect label={dictionary.filters.status}>
              <option>{dictionary.filters.all}</option>
              {statusFilters.map((status) => (
                <option key={status}>{dictionary.statuses[status]}</option>
              ))}
            </FilterSelect>

            <FilterSelect label={dictionary.filters.autoRenewal}>
              {autoRenewalFilters.map((filter) => (
                <option key={filter}>
                  {filter === "all"
                    ? dictionary.filters.all
                    : filter === "on"
                      ? dictionary.filters.on
                      : dictionary.filters.off}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect label={dictionary.filters.planType}>
              {planFilters.map((plan) => (
                <option key={plan}>
                  {plan === "all" ? dictionary.filters.all : dictionary.plans[plan]}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect label={dictionary.filters.dateRange}>
              {dateRangeFilters.map((range) => (
                <option key={range}>
                  {range === "all"
                    ? dictionary.filters.all
                    : range === "7"
                      ? dictionary.filters.days7
                      : range === "14"
                        ? dictionary.filters.days14
                        : dictionary.filters.days30}
                </option>
              ))}
            </FilterSelect>
          </div>
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.expiringSoon}>
            <p className="mb-4 text-sm leading-6 text-[#66758a]">
              {dictionary.values.expiringHint}
            </p>
            <div className="grid min-w-0 grid-cols-1 gap-3">
              {expiringSoonRows.map((row) => (
                <div
                  className="grid min-w-0 grid-cols-1 gap-3 rounded-md border border-[#C8A45D]/35 bg-[#C8A45D]/10 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  key={row.id}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B2D5C]">
                      {dictionary.centers[row.centerNameKey]}
                    </p>
                    <p className="mt-1 text-sm text-[#66758a]">
                      {dictionary.table.expiryDate}: {formatDate(row.expiryDate, locale)}
                    </p>
                  </div>
                  <StatusBadge label={dictionary.statuses[row.status]} status={row.status} />
                </div>
              ))}
            </div>
          </Section>

          <Section title={dictionary.sections.revenueSnapshot}>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {revenueSnapshot.map((item) => (
                <div
                  className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4"
                  key={item.key}
                >
                  <p className="text-sm font-medium text-[#66758a]">
                    {dictionary.revenue[item.key]}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#0B2D5C]">
                    {"type" in item && item.type === "count"
                      ? formatNumber(item.value)
                      : formatMoney(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title={dictionary.sections.table}>
          <div className="hidden max-w-full overflow-x-auto md:block">
            <table className="w-full min-w-[1280px] border-collapse text-sm">
              <thead className="bg-[#F8FAFC] text-[#66758a]">
                <tr>
                  {[
                    "centerName",
                    "owner",
                    "subscriptionPlan",
                    "billingCycle",
                    "startDate",
                    "expiryDate",
                    "autoRenewal",
                    "paymentStatus",
                    "monthlyValue",
                    "status",
                    "actions",
                  ].map((column) => (
                    <th className="px-4 py-3 text-start font-medium" key={column}>
                      {dictionary.table[column as keyof typeof dictionary.table]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptionsRows.map((row) => (
                  <tr className="border-t border-[#E5E7EB]" key={row.id}>
                    <td className="px-4 py-4 font-semibold text-[#0B2D5C]">
                      {dictionary.centers[row.centerNameKey]}
                      <span className="mt-1 block text-xs font-medium text-[#66758a]">
                        {row.domain}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {dictionary.owners[row.ownerNameKey]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {dictionary.plans[row.planKey]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {dictionary.billingCycles[row.billingCycle]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {formatDate(row.startDate, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {formatDate(row.expiryDate, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {renderAutoRenewal(row)}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentBadge
                        label={dictionary.paymentStatuses[row.paymentStatus]}
                        status={row.paymentStatus}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {formatMoney(row.monthlyValue)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        label={dictionary.statuses[row.status]}
                        status={row.status}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ActionMenu
                        dictionary={dictionary}
                        isOpen={openDesktopActions === row.id}
                        onClose={() => setOpenDesktopActions(null)}
                        onToggle={() =>
                          setOpenDesktopActions((current) =>
                            current === row.id ? null : row.id,
                          )
                        }
                        subscriptionId={row.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:hidden">
            <p className="text-sm leading-6 text-[#66758a]">
              {dictionary.values.mobileHint}
            </p>
            {subscriptionsRows.map((row) => (
              <article
                className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                key={row.id}
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-semibold text-[#0B2D5C]">
                      {dictionary.centers[row.centerNameKey]}
                    </h4>
                    <p className="mt-1 break-words text-sm text-[#66758a]">
                      {dictionary.owners[row.ownerNameKey]} · {row.domain}
                    </p>
                  </div>
                  <StatusBadge label={dictionary.statuses[row.status]} status={row.status} />
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3">
                  <DetailPair
                    label={dictionary.table.subscriptionPlan}
                    value={dictionary.plans[row.planKey]}
                  />
                  <DetailPair
                    label={dictionary.table.billingCycle}
                    value={dictionary.billingCycles[row.billingCycle]}
                  />
                  <DetailPair
                    label={dictionary.table.expiryDate}
                    value={formatDate(row.expiryDate, locale)}
                  />
                  <DetailPair
                    label={dictionary.table.monthlyValue}
                    value={formatMoney(row.monthlyValue)}
                  />
                  <DetailPair
                    label={dictionary.table.autoRenewal}
                    value={renderAutoRenewal(row)}
                  />
                  <DetailPair
                    label={dictionary.table.paymentStatus}
                    value={
                      <PaymentBadge
                        label={dictionary.paymentStatuses[row.paymentStatus]}
                        status={row.paymentStatus}
                      />
                    }
                  />
                </div>

                <div className="mt-4">
                  <ActionMenu
                    dictionary={dictionary}
                    isOpen={openMobileActions === row.id}
                    onClose={() => setOpenMobileActions(null)}
                    onToggle={() =>
                      setOpenMobileActions((current) =>
                        current === row.id ? null : row.id,
                      )
                    }
                    subscriptionId={row.id}
                  />
                </div>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </SuperAdminLayout>
  );
}
