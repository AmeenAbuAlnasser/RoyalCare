"use client";

import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  formatCompactCurrency,
  formatNumber,
  formatSignedNumber,
  formatSignedPercent,
} from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminDashboardDictionaries } from "@/i18n/dictionaries/super-admin-dashboard";
import {
  domainPreview,
  notificationsPreview,
  overviewCards,
  quickStats,
  recentCenters,
  subscriptionOverview,
} from "./dashboard-data";

type Dictionary = (typeof superAdminDashboardDictionaries)["en"];
type StatusKey = keyof Dictionary["statuses"];

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: StatusKey;
}) {
  const styles: Record<StatusKey, string> = {
    active: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    trial: "border-[#C8A45D]/30 bg-[#C8A45D]/12 text-[#7A5C20]",
    pastDue: "border-[#C8A45D]/35 bg-[#C8A45D]/14 text-[#7A5C20]",
    pending: "border-[#C8A45D]/35 bg-[#C8A45D]/14 text-[#7A5C20]",
    verified: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    failed: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function SectionShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 max-w-full rounded-lg border border-[#E5E7EB] bg-white">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="min-w-0 text-sm font-semibold text-[#0B2D5C]">
          {title}
        </h2>
        {action ? (
          <button
            className={buttonClassName("ghost", "sm", "shrink-0")}
            type="button"
          >
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function formatUpdatedTime(
  minutes: number,
  dictionary: Dictionary,
  formatNumber: (value: number) => string,
) {
  if (minutes >= 60) {
    return `${formatNumber(Math.round(minutes / 60))} ${dictionary.labels.hourAgo}`;
  }

  return `${formatNumber(minutes)} ${dictionary.labels.minutesAgo}`;
}

export function SuperAdminDashboard() {
  const { locale } = useLanguage();
  const dictionary = superAdminDashboardDictionaries[locale];

  return (
    <SuperAdminLayout
      activeNav="dashboard"
      dictionary={dictionary}
    >
            <section className="grid min-w-0 max-w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => {
                const value =
                  card.valueType === "currency"
                    ? formatCompactCurrency(card.value, locale)
                    : formatNumber(card.value);
                const change =
                  card.changeType === "percent"
                    ? formatSignedPercent(card.change)
                    : formatSignedNumber(card.change);

                return (
                  <article
                    className="min-w-0 max-w-full rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                    key={card.key}
                  >
                    <p className="text-sm font-medium text-[#66758a]">
                      {dictionary.overview[card.key]}
                    </p>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                      <p className="min-w-0 text-2xl font-semibold text-[#0B2D5C] sm:text-3xl">
                        {value}
                      </p>
                      <span className="rounded-md bg-[#C8A45D]/12 px-2 py-1 text-xs font-semibold text-[#7A5C20]">
                        {change}
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="mt-6 grid min-w-0 max-w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
              <div className="min-w-0 max-w-full space-y-6">
                <SectionShell title={dictionary.sections.quickStats}>
                  <div className="grid min-w-0 grid-cols-1 gap-0 sm:grid-cols-2">
                    {quickStats.map((stat) => (
                      <div
                        className="min-w-0 border-b border-[#E5E7EB] px-5 py-4 odd:sm:border-e"
                        key={stat.key}
                      >
                        <p className="text-sm text-[#66758a]">
                          {dictionary.stats[stat.key]}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[#0B2D5C]">
                          {formatNumber(stat.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell
                  action={dictionary.actions.viewAll}
                  title={dictionary.sections.recentCenters}
                >
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-sm">
                      <thead className="bg-[#F8FAFC] text-[#66758a]">
                        <tr>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.nav.centers}
                          </th>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.labels.owner}
                          </th>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.labels.plan}
                          </th>
                          <th className="px-5 py-3 text-start font-medium">
                            {dictionary.labels.status}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentCenters.map((center) => (
                          <tr
                            className="border-t border-[#E5E7EB]"
                            key={center.nameKey}
                          >
                            <td className="px-5 py-4 font-medium text-[#0B2D5C]">
                              {dictionary.centers[center.nameKey]}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-[#526176]">
                              {dictionary.owners[center.ownerKey]}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-[#526176]">
                              {dictionary.plans[center.planKey]}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge
                                label={dictionary.statuses[center.status]}
                                status={center.status}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionShell>

                <SectionShell
                  action={dictionary.actions.manage}
                  title={dictionary.sections.subscriptionOverview}
                >
                  <div className="divide-y divide-[#E5E7EB]">
                    {subscriptionOverview.map((item) => (
                      <div
                        className="grid min-w-0 grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                        key={item.planKey}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#0B2D5C]">
                            {dictionary.plans[item.planKey]}
                          </p>
                          <p className="mt-1 text-sm text-[#66758a]">
                            {formatNumber(item.centers)}{" "}
                            {dictionary.labels.centersCount}
                          </p>
                        </div>
                        <p className="text-sm text-[#526176] sm:whitespace-nowrap">
                          {formatNumber(item.renewalCount)}{" "}
                          {dictionary.labels.renewalsThisWeek}
                        </p>
                        <StatusBadge
                          label={dictionary.statuses[item.status]}
                          status={item.status}
                        />
                      </div>
                    ))}
                  </div>
                </SectionShell>
              </div>

              <div className="min-w-0 max-w-full space-y-6">
                <SectionShell
                  action={dictionary.actions.review}
                  title={dictionary.sections.domainManagement}
                >
                  <div className="divide-y divide-[#E5E7EB]">
                    {domainPreview.map((item) => (
                      <div className="px-5 py-4" key={item.domain}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-all font-medium text-[#0B2D5C]">
                              {item.domain}
                            </p>
                            <p className="mt-1 text-sm text-[#66758a]">
                              {dictionary.domainIssues[item.issueKey]}
                            </p>
                          </div>
                          <StatusBadge
                            label={dictionary.statuses[item.status]}
                            status={item.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell
                  action={dictionary.actions.viewAll}
                  title={dictionary.sections.notifications}
                >
                  <div className="divide-y divide-[#E5E7EB]">
                    {notificationsPreview.map((item) => (
                      <div className="px-5 py-4" key={item.titleKey}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-[#0B2D5C]">
                              {dictionary.notificationTitles[item.titleKey]}
                            </p>
                            <p className="mt-1 text-sm text-[#66758a]">
                              {dictionary.labels.updated}:{" "}
                              {formatUpdatedTime(
                                item.updatedMinutes,
                                dictionary,
                                formatNumber,
                              )}
                            </p>
                          </div>
                          <StatusBadge
                            label={dictionary.statuses[item.status]}
                            status={item.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionShell>
              </div>
            </div>
    </SuperAdminLayout>
  );
}
