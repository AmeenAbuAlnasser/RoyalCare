"use client";

import { useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminActionMenu } from "@/features/super-admin/components/SuperAdminActionMenu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatNumber } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminDomainsDictionaries } from "@/i18n/dictionaries/super-admin-domains";
import {
  domainRows,
  domainStats,
  pendingVerificationRows,
  sslExpiryRows,
  verificationFilters,
} from "./domains-data";

type Dictionary = (typeof superAdminDomainsDictionaries)["en"];
type DomainRow = (typeof domainRows)[number];
type HealthTone = "critical" | "healthy" | "warning";

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

function Badge({ label, tone }: { label: string; tone: HealthTone | "neutral" }) {
  const styles = {
    critical: "border-rose-200 bg-rose-50 text-rose-700",
    healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    warning: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function toneFromStatus(value: string): HealthTone | "neutral" {
  if (["verified", "healthy", "valid", "active"].includes(value)) return "healthy";
  if (["pending", "warning", "expiringSoon"].includes(value)) return "warning";
  if (["failed", "critical", "expired"].includes(value)) return "critical";
  return "neutral";
}

function ActionMenu({
  dictionary,
  domainId,
  isOpen,
  onClose,
  onToggle,
}: {
  dictionary: Dictionary;
  domainId: string;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <SuperAdminActionMenu
      isOpen={isOpen}
      items={[
        { href: `/super-admin/domains/${domainId}`, icon: "view", label: dictionary.actions.view },
        { icon: "verify", label: dictionary.actions.verify },
        { icon: "refresh", label: dictionary.actions.recheckDns },
        { icon: "renew", label: dictionary.actions.sslRenew },
        { icon: "suspend", label: dictionary.actions.suspendDomain, tone: "warning" },
        { icon: "delete", label: dictionary.actions.delete, tone: "danger" },
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

function DomainMiniRow({
  dictionary,
  row,
}: {
  dictionary: Dictionary;
  row: DomainRow;
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 rounded-md border border-[#C8A45D]/35 bg-[#C8A45D]/10 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="break-words font-semibold text-[#0B2D5C]">
          {row.domainName}
        </p>
        <p className="mt-1 text-sm text-[#66758a]">
          {dictionary.centers[row.centerNameKey]}
        </p>
      </div>
      <Badge
        label={dictionary.verificationStatuses[row.verificationStatus]}
        tone={toneFromStatus(row.verificationStatus)}
      />
    </div>
  );
}

export function SuperAdminDomainsPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminDomainsDictionaries[locale];
  const [openActions, setOpenActions] = useState<string | null>(null);
  const healthCounts = {
    critical: domainRows.filter((row) => row.health === "critical").length,
    healthy: domainRows.filter((row) => row.health === "healthy").length,
    warning: domainRows.filter((row) => row.health === "warning").length,
  };

  return (
    <SuperAdminLayout activeNav="domains" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {domainStats.map((stat) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
              key={stat.key}
            >
              <p className="text-sm font-medium text-[#66758a]">
                {dictionary.stats[stat.key]}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {formatNumber(stat.value)}
              </p>
            </article>
          ))}
        </section>

        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.searchLabel}
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
              />
            </label>
            <div className="flex min-w-0 flex-wrap gap-2">
              <button className={buttonClassName("primary", "sm")} type="button">
                {dictionary.filters.all}
              </button>
              {verificationFilters.map((filter) => (
                <button className={buttonClassName("secondary", "sm")} key={filter} type="button">
                  {dictionary.filters[filter]}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,0.8fr)]">
          <Section title={dictionary.sections.pendingVerification}>
            <p className="mb-4 text-sm leading-6 text-[#66758a]">
              {dictionary.values.pendingHint}
            </p>
            <div className="grid gap-3">
              {pendingVerificationRows.map((row) => (
                <DomainMiniRow dictionary={dictionary} key={row.id} row={row} />
              ))}
            </div>
          </Section>

          <Section title={dictionary.sections.sslExpiryWarning}>
            <p className="mb-4 text-sm leading-6 text-[#66758a]">
              {dictionary.values.sslHint}
            </p>
            <div className="grid gap-3">
              {sslExpiryRows.map((row) => (
                <DomainMiniRow dictionary={dictionary} key={row.id} row={row} />
              ))}
            </div>
          </Section>

          <Section title={dictionary.sections.healthOverview}>
            <div className="grid gap-3">
              {(["healthy", "warning", "critical"] as const).map((key) => (
                <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4" key={key}>
                  <p className="text-sm font-medium text-[#66758a]">
                    {dictionary.health[key]}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#0B2D5C]">
                    {formatNumber(healthCounts[key])}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title={dictionary.sections.table}>
          <div className="hidden max-w-full overflow-x-auto md:block">
            <table className="w-full min-w-[1240px] border-collapse text-sm">
              <thead className="bg-[#F8FAFC] text-[#66758a]">
                <tr>
                  {[
                    "centerName",
                    "domainName",
                    "type",
                    "verificationStatus",
                    "dnsStatus",
                    "sslStatus",
                    "addedDate",
                    "lastChecked",
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
                {domainRows.map((row) => (
                  <tr className="border-t border-[#E5E7EB]" key={row.id}>
                    <td className="px-4 py-4 font-semibold text-[#0B2D5C]">
                      {dictionary.centers[row.centerNameKey]}
                      <span className="mt-1 block text-xs font-medium text-[#66758a]">
                        {dictionary.owners[row.ownerNameKey]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{row.domainName}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{dictionary.domainTypes[row.type]}</td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.verificationStatuses[row.verificationStatus]} tone={toneFromStatus(row.verificationStatus)} />
                    </td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.dnsStatuses[row.dnsStatus]} tone={toneFromStatus(row.dnsStatus)} />
                    </td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.sslStatuses[row.sslStatus]} tone={toneFromStatus(row.sslStatus)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatDate(row.addedDate, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatDate(row.lastChecked, locale)}</td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.statuses[row.status]} tone={toneFromStatus(row.status)} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ActionMenu
                        dictionary={dictionary}
                        domainId={row.id}
                        isOpen={openActions === row.id}
                        onClose={() => setOpenActions(null)}
                        onToggle={() =>
                          setOpenActions((current) => (current === row.id ? null : row.id))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:hidden">
            <p className="text-sm leading-6 text-[#66758a]">{dictionary.values.mobileHint}</p>
            {domainRows.map((row) => (
              <article
                className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                key={row.id}
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-semibold text-[#0B2D5C]">
                      {row.domainName}
                    </h4>
                    <p className="mt-1 break-words text-sm text-[#66758a]">
                      {dictionary.centers[row.centerNameKey]}
                    </p>
                  </div>
                  <Badge label={dictionary.verificationStatuses[row.verificationStatus]} tone={toneFromStatus(row.verificationStatus)} />
                </div>
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3">
                  <DetailPair label={dictionary.table.type} value={dictionary.domainTypes[row.type]} />
                  <DetailPair label={dictionary.table.dnsStatus} value={<Badge label={dictionary.dnsStatuses[row.dnsStatus]} tone={toneFromStatus(row.dnsStatus)} />} />
                  <DetailPair label={dictionary.table.sslStatus} value={<Badge label={dictionary.sslStatuses[row.sslStatus]} tone={toneFromStatus(row.sslStatus)} />} />
                  <DetailPair label={dictionary.table.lastChecked} value={formatDate(row.lastChecked, locale)} />
                </div>
                <div className="mt-4">
                  <ActionMenu
                    dictionary={dictionary}
                    domainId={row.id}
                    isOpen={openActions === row.id}
                    onClose={() => setOpenActions(null)}
                    onToggle={() =>
                      setOpenActions((current) => (current === row.id ? null : row.id))
                    }
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
