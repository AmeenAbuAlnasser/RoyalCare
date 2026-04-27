"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatCompactCurrency, formatDate } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminSubscriptionDetailsDictionaries } from "@/i18n/dictionaries/super-admin-subscription-details";
import {
  paymentHistoryById,
  renewalHistoryById,
  subscriptionDetailsById,
  type SubscriptionDetails,
} from "./subscription-details-data";

type Dictionary = (typeof superAdminSubscriptionDetailsDictionaries)["en"];
type SubscriptionStatus = keyof Dictionary["statuses"];
type PaymentStatus = keyof Dictionary["paymentStatuses"];

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

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "gold" | "navy" | "success" | "neutral";
}) {
  const styles = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function statusTone(status: SubscriptionStatus) {
  if (status === "active") return "navy";
  if (status === "trial") return "gold";
  if (status === "expired") return "danger";
  return "neutral";
}

function paymentTone(status: PaymentStatus) {
  if (status === "paid") return "success";
  if (status === "pending") return "gold";
  return "danger";
}

function DetailList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3" key={label}>
          <dt className="text-xs font-medium text-[#66758a]">{label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LogoMark({ subscription }: { subscription: SubscriptionDetails }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#0B2D5C] text-xl font-semibold text-[#C8A45D]">
      {subscription.centerNameKey.slice(0, 2).toUpperCase()}
    </div>
  );
}

function QuickActions({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <button className={buttonClassName("primary", "md")} type="button">
        {dictionary.detailActions.renewSubscription}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.upgradePlan}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.downgradePlan}
      </button>
      <button className={buttonClassName("warning", "md")} type="button">
        {dictionary.detailActions.suspendSubscription}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.generateInvoice}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.viewInvoiceHistory}
      </button>
      <button className={buttonClassName("danger", "md")} type="button">
        {dictionary.detailActions.cancelSubscription}
      </button>
      <p className="text-xs leading-5 text-[#66758a]">
        {dictionary.values.actionsHint}
      </p>
    </div>
  );
}

export function SuperAdminSubscriptionDetailsPage({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const { locale } = useLanguage();
  const dictionary = superAdminSubscriptionDetailsDictionaries[locale];
  const subscription =
    subscriptionDetailsById[
      subscriptionId as keyof typeof subscriptionDetailsById
    ];

  if (!subscription) {
    return (
      <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.header.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B2D5C]">
            {dictionary.values.notFoundTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {dictionary.values.notFoundDescription}
          </p>
          <Link
            className={buttonClassName("secondary", "md", "mt-5 w-full sm:w-auto")}
            href="/super-admin/subscriptions"
          >
            {dictionary.detailActions.backToSubscriptions}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const payments =
    paymentHistoryById[subscriptionId as keyof typeof paymentHistoryById] ?? [];
  const timeline =
    renewalHistoryById[subscriptionId as keyof typeof renewalHistoryById] ?? [];
  const price = `${formatCompactCurrency(subscription.monthlyValue, locale)} / ${formatCompactCurrency(subscription.yearlyPrice, locale)}`;

  return (
    <SuperAdminLayout activeNav="subscriptions" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <LogoMark subscription={subscription} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.header.eyebrow}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold text-[#0B2D5C]">
                {dictionary.centers[subscription.centerNameKey]}
              </h2>
              <p className="mt-1 break-words text-sm text-[#66758a]">
                {subscription.domain}
              </p>
            </div>
          </div>
          <Link
            className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
            href="/super-admin/subscriptions"
          >
            {dictionary.detailActions.backToSubscriptions}
          </Link>
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [dictionary.table.centerName, dictionary.centers[subscription.centerNameKey]],
                [dictionary.table.owner, dictionary.owners[subscription.ownerNameKey]],
                [dictionary.table.subscriptionPlan, dictionary.plans[subscription.planKey]],
                [dictionary.table.billingCycle, dictionary.billingCycles[subscription.billingCycle]],
                [dictionary.fields.price, price],
                [dictionary.table.startDate, formatDate(subscription.startDate, locale)],
                [dictionary.table.expiryDate, formatDate(subscription.expiryDate, locale)],
                [dictionary.table.autoRenewal, subscription.autoRenewal ? dictionary.values.enabled : dictionary.values.disabled],
                [
                  dictionary.table.status,
                  <Badge key="status" label={dictionary.statuses[subscription.status]} tone={statusTone(subscription.status)} />,
                ],
                [
                  dictionary.table.paymentStatus,
                  <Badge key="payment" label={dictionary.paymentStatuses[subscription.paymentStatus]} tone={paymentTone(subscription.paymentStatus)} />,
                ],
                [dictionary.fields.lastPaymentDate, formatDate(subscription.lastPaymentDate, locale)],
                [dictionary.fields.nextRenewalDate, formatDate(subscription.nextRenewalDate, locale)],
              ]}
            />
          </Section>
          <Section title={dictionary.sections.quickActions}>
            <QuickActions dictionary={dictionary} />
          </Section>
        </div>

        <Section title={dictionary.sections.paymentHistory}>
          <div className="hidden max-w-full overflow-x-auto md:block">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead className="bg-[#F8FAFC] text-[#66758a]">
                <tr>
                  {[
                    dictionary.payments.invoiceNumber,
                    dictionary.payments.paymentDate,
                    dictionary.payments.amount,
                    dictionary.payments.paymentMethod,
                    dictionary.payments.status,
                    dictionary.payments.invoiceLink,
                  ].map((heading) => (
                    <th className="px-4 py-3 text-start font-medium" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr className="border-t border-[#E5E7EB]" key={payment.invoice}>
                    <td className="px-4 py-4 font-semibold text-[#0B2D5C]">{payment.invoice}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatDate(payment.date, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatCompactCurrency(payment.amount, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{dictionary.payments[payment.method]}</td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.paymentStatuses[payment.status]} tone={paymentTone(payment.status)} />
                    </td>
                    <td className="px-4 py-4">
                      <button className={buttonClassName("secondary", "sm")} type="button">
                        {dictionary.payments.openInvoice}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {payments.map((payment) => (
              <article className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3" key={payment.invoice}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0B2D5C]">{payment.invoice}</p>
                    <p className="mt-1 text-sm text-[#66758a]">{formatDate(payment.date, locale)}</p>
                  </div>
                  <Badge label={dictionary.paymentStatuses[payment.status]} tone={paymentTone(payment.status)} />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#24364f]">
                  {formatCompactCurrency(payment.amount, locale)} · {dictionary.payments[payment.method]}
                </p>
                <button className={buttonClassName("secondary", "sm", "mt-3 w-full")} type="button">
                  {dictionary.payments.openInvoice}
                </button>
              </article>
            ))}
          </div>
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.renewalHistory}>
            <ol className="space-y-4">
              {timeline.map((item, index) => (
                <li className="flex gap-3" key={`${item}-${index}`}>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#C8A45D] bg-[#0B2D5C]" />
                  <div>
                    <p className="text-sm font-semibold text-[#24364f]">
                      {dictionary.timeline[item]}
                    </p>
                    <p className="text-xs text-[#66758a]">
                      {formatDate(index === 0 ? subscription.startDate : subscription.lastPaymentDate, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={dictionary.sections.billingInformation}>
            <DetailList
              items={[
                [dictionary.fields.billingContact, subscription.billingContact],
                [dictionary.fields.billingEmail, subscription.billingEmail],
                [dictionary.fields.companyName, subscription.companyName],
                [dictionary.fields.vatNumber, subscription.vatNumber],
                [dictionary.fields.address, subscription.billingAddress],
                [dictionary.fields.currency, subscription.currency],
              ]}
            />
          </Section>
        </div>

        <Section title={dictionary.sections.internalNotes}>
          <label className="block min-w-0">
            <span className="text-sm font-medium text-[#24364f]">
              {dictionary.notes.label}
            </span>
            <textarea
              className="mt-2 min-h-36 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
              placeholder={dictionary.notes.placeholder}
            />
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#66758a]">{dictionary.notes.helper}</p>
            <button className={buttonClassName("secondary", "md", "w-full sm:w-auto")} type="button">
              {dictionary.detailActions.saveNotes}
            </button>
          </div>
        </Section>
      </div>
    </SuperAdminLayout>
  );
}
