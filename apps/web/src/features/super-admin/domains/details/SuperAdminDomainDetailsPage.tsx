"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminDomainDetailsDictionaries } from "@/i18n/dictionaries/super-admin-domain-details";
import {
  domainActivityById,
  domainDetailsById,
  type DomainDetails,
} from "./domain-details-data";

type Dictionary = (typeof superAdminDomainDetailsDictionaries)["en"];
type Tone = "critical" | "healthy" | "neutral" | "warning";

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

function Badge({ label, tone }: { label: string; tone: Tone }) {
  const styles: Record<Tone, string> = {
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

function toneFromStatus(value: string): Tone {
  if (["verified", "healthy", "valid", "active"].includes(value)) return "healthy";
  if (["pending", "warning", "expiringSoon"].includes(value)) return "warning";
  if (["failed", "critical", "expired"].includes(value)) return "critical";
  return "neutral";
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

function DnsRecord({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <code className="mt-2 block break-all rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#0B2D5C]">
        {value}
      </code>
    </div>
  );
}

function QuickActions({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <button className={buttonClassName("primary", "md")} type="button">
        {dictionary.detailActions.verifyDomain}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.recheckDns}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.renewSsl}
      </button>
      <button className={buttonClassName("warning", "md")} type="button">
        {dictionary.detailActions.suspendDomain}
      </button>
      <button className={buttonClassName("danger", "md")} type="button">
        {dictionary.detailActions.deleteDomain}
      </button>
      <p className="text-xs leading-5 text-[#66758a]">
        {dictionary.values.actionsHint}
      </p>
    </div>
  );
}

function DomainTitle({
  dictionary,
  domain,
}: {
  dictionary: Dictionary;
  domain: DomainDetails;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
          {dictionary.header.eyebrow}
        </p>
        <h2 className="mt-1 break-words text-xl font-semibold text-[#0B2D5C]">
          {domain.domainName}
        </h2>
        <p className="mt-1 break-words text-sm text-[#66758a]">
          {dictionary.centers[domain.centerNameKey]}
        </p>
      </div>
      <Link
        className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
        href="/super-admin/domains"
      >
        {dictionary.detailActions.backToDomains}
      </Link>
    </section>
  );
}

export function SuperAdminDomainDetailsPage({ domainId }: { domainId: string }) {
  const { locale } = useLanguage();
  const dictionary = superAdminDomainDetailsDictionaries[locale];
  const domain = domainDetailsById[domainId as keyof typeof domainDetailsById];

  if (!domain) {
    return (
      <SuperAdminLayout activeNav="domains" dictionary={dictionary}>
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
            href="/super-admin/domains"
          >
            {dictionary.detailActions.backToDomains}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const activity =
    domainActivityById[domainId as keyof typeof domainActivityById] ?? [];

  return (
    <SuperAdminLayout activeNav="domains" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <DomainTitle dictionary={dictionary} domain={domain} />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [dictionary.table.domainName, domain.domainName],
                [dictionary.table.centerName, dictionary.centers[domain.centerNameKey]],
                [dictionary.table.status, <Badge key="status" label={dictionary.statuses[domain.status]} tone={toneFromStatus(domain.status)} />],
                [dictionary.table.type, dictionary.domainTypes[domain.type]],
                [dictionary.table.verificationStatus, <Badge key="verification" label={dictionary.verificationStatuses[domain.verificationStatus]} tone={toneFromStatus(domain.verificationStatus)} />],
                [dictionary.table.dnsStatus, <Badge key="dns" label={dictionary.dnsStatuses[domain.dnsStatus]} tone={toneFromStatus(domain.dnsStatus)} />],
                [dictionary.table.sslStatus, <Badge key="ssl" label={dictionary.sslStatuses[domain.sslStatus]} tone={toneFromStatus(domain.sslStatus)} />],
                [dictionary.table.addedDate, formatDate(domain.addedDate, locale)],
                [dictionary.table.lastChecked, formatDate(domain.lastChecked, locale)],
                [dictionary.fields.ownerName, dictionary.owners[domain.ownerNameKey]],
              ]}
            />
          </Section>
          <Section title={dictionary.sections.verificationActions}>
            <QuickActions dictionary={dictionary} />
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.dnsInstructions}>
            <div className="grid min-w-0 grid-cols-1 gap-3">
              <DnsRecord label={dictionary.fields.aRecord} value={domain.aRecord} />
              <DnsRecord label={dictionary.fields.cname} value={domain.cname} />
              <DnsRecord label={dictionary.fields.txtRecord} value={domain.txtRecord} />
            </div>
          </Section>
          <Section title={dictionary.sections.sslCertificateInfo}>
            <DetailList
              items={[
                [dictionary.fields.provider, domain.sslProvider],
                [dictionary.fields.issuedDate, formatDate(domain.issuedDate, locale)],
                [dictionary.fields.expiryDate, formatDate(domain.sslExpiryDate, locale)],
                [dictionary.fields.autoRenew, domain.autoRenew ? dictionary.values.enabled : dictionary.values.disabled],
                [dictionary.fields.certificateStatus, <Badge key="certificate" label={dictionary.sslStatuses[domain.sslStatus]} tone={toneFromStatus(domain.sslStatus)} />],
              ]}
            />
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.activityTimeline}>
            <ol className="space-y-4">
              {activity.map((item, index) => (
                <li className="flex gap-3" key={`${item}-${index}`}>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#C8A45D] bg-[#0B2D5C]" />
                  <div>
                    <p className="text-sm font-semibold text-[#24364f]">
                      {dictionary.timeline[item]}
                    </p>
                    <p className="text-xs text-[#66758a]">
                      {formatDate(index === 0 ? domain.addedDate : domain.lastChecked, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

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
      </div>
    </SuperAdminLayout>
  );
}
