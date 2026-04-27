"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buttonClassName,
  primaryButtonClassName,
} from "@/components/ui/button-styles";
import { SuperAdminActionMenu } from "@/features/super-admin/components/SuperAdminActionMenu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatNumber } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminCentersDictionaries } from "@/i18n/dictionaries/super-admin-centers";
import {
  centerStatusFilters,
  centersRows,
  centersStats,
} from "./centers-data";
import {
  listSuperAdminCenters,
  type ApiCenter,
  type ApiCenterStatus,
} from "@/lib/api/super-admin-centers";

type Dictionary = (typeof superAdminCentersDictionaries)["en"];
type CenterStatus = keyof Dictionary["statuses"];

type CenterTableRow = {
  centerName: string;
  domain: string;
  expiryDate: string;
  id: string;
  ownerName: string;
  planName: string;
  status: CenterStatus;
  type: string;
};

function mapApiStatus(status: ApiCenterStatus): CenterStatus {
  if (status === "ACTIVE") {
    return "active";
  }

  if (status === "SUSPENDED" || status === "CANCELLED" || status === "ARCHIVED") {
    return "suspended";
  }

  if (status === "PAST_DUE") {
    return "expired";
  }

  return "trial";
}

function formatApiCenterType(type: ApiCenter["type"]) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapApiCenter(center: ApiCenter): CenterTableRow {
  const subscription = center.subscriptions?.[0];
  const domain = center.domains?.[0];

  return {
    centerName: center.name,
    domain: domain?.hostname ?? center.slug,
    expiryDate: subscription?.currentPeriodEnd ?? center.createdAt,
    id: center.id,
    ownerName: center.owner?.fullName ?? center.owner?.email ?? "-",
    planName: subscription?.planName ?? "-",
    status: mapApiStatus(center.status),
    type: formatApiCenterType(center.type),
  };
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: CenterStatus;
}) {
  const styles: Record<CenterStatus, string> = {
    active: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    trial: "border-[#C8A45D]/30 bg-[#C8A45D]/12 text-[#7A5C20]",
    expired: "border-rose-200 bg-rose-50 text-rose-700",
    suspended: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${styles[status]}`}
    >
      {label}
    </span>
  );
}

export function SuperAdminCentersPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminCentersDictionaries[locale];
  const [openActionsRow, setOpenActionsRow] = useState<number | null>(null);
  const [apiCenters, setApiCenters] = useState<CenterTableRow[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    listSuperAdminCenters()
      .then((response) => {
        if (isMounted) {
          setApiCenters(response.data.map(mapApiCenter));
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiCenters(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const tableRows = useMemo<CenterTableRow[]>(() => {
    if (apiCenters) {
      return apiCenters;
    }

    return centersRows.map((center, index) => ({
      centerName: dictionary.centers[center.centerNameKey],
      domain: center.domain,
      expiryDate: center.expiryDate,
      id: String(index + 1),
      ownerName: dictionary.owners[center.ownerNameKey],
      planName: dictionary.plans[center.planKey],
      status: center.status,
      type: dictionary.types[center.typeKey],
    }));
  }, [apiCenters, dictionary]);

  const stats = useMemo(() => {
    if (!apiCenters) {
      return centersStats;
    }

    return [
      { key: "totalCenters" as const, value: apiCenters.length },
      {
        key: "activeCenters" as const,
        value: apiCenters.filter((center) => center.status === "active").length,
      },
      {
        key: "trialCenters" as const,
        value: apiCenters.filter((center) => center.status === "trial").length,
      },
      {
        key: "suspendedCenters" as const,
        value: apiCenters.filter((center) => center.status === "suspended").length,
      },
    ];
  }, [apiCenters]);

  return (
    <SuperAdminLayout
      activeNav="centers"
      dictionary={dictionary}
    >
            <div className="flex min-w-0 max-w-full flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                  {dictionary.header.eyebrow}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-[#0B2D5C]">
                  {dictionary.header.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#66758a]">
                  {dictionary.header.subtitle}
                </p>
              </div>
              <Link
                className={primaryButtonClassName("w-full sm:w-auto")}
                href="/super-admin/centers/new"
              >
                {dictionary.actions.addNewCenter}
              </Link>
            </div>

            <section className="mt-5 grid min-w-0 max-w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  className="min-w-0 max-w-full rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                  key={stat.key}
                >
                  <p className="text-sm font-medium text-[#66758a]">
                    {dictionary.stats[stat.key]}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[#0B2D5C]">
                    {formatNumber(stat.value)}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-6 min-w-0 max-w-full rounded-lg border border-[#E5E7EB] bg-white">
              <div className="grid min-w-0 grid-cols-1 gap-4 border-b border-[#E5E7EB] px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label className="block min-w-0">
                  <span className="text-sm font-medium text-[#24364f]">
                    {dictionary.search.label}
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                    placeholder={dictionary.search.placeholder}
                    type="search"
                  />
                </label>

                <div className="flex min-w-0 flex-wrap gap-2">
                  {centerStatusFilters.map((filter) => (
                    <button
                      className={buttonClassName(
                        filter === "active" ? "primary" : "secondary",
                        "sm",
                      )}
                      key={filter}
                      type="button"
                    >
                      {dictionary.filters[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse text-sm">
                  <thead className="bg-[#F8FAFC] text-[#66758a]">
                    <tr>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.centerName}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.ownerName}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.centerType}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.subscriptionPlan}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.subscriptionExpiryDate}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.domain}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.status}
                      </th>
                      <th className="px-5 py-3 text-start font-medium">
                        {dictionary.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((center, index) => (
                      <tr
                        className="border-t border-[#E5E7EB]"
                        key={center.id}
                      >
                        <td className="px-5 py-4 font-medium text-[#0B2D5C]">
                          {center.centerName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                          {center.ownerName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                          {center.type}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                          {center.planName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                          {formatDate(center.expiryDate, locale)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                          {center.domain}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge
                            label={dictionary.statuses[center.status]}
                            status={center.status}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <SuperAdminActionMenu
                            isOpen={openActionsRow === index}
                            items={[
                              {
                                href: `/super-admin/centers/${center.id}`,
                                icon: "view",
                                label: dictionary.actions.view,
                              },
                              { icon: "edit", label: dictionary.actions.edit },
                              {
                                icon: "renew",
                                label: dictionary.actions.renewSubscription,
                              },
                              {
                                icon: "suspend",
                                label: dictionary.actions.suspend,
                                tone: "warning",
                              },
                              {
                                icon: "delete",
                                label: dictionary.actions.delete,
                                tone: "danger",
                              },
                            ]}
                            onClose={() => setOpenActionsRow(null)}
                            onToggle={() =>
                              setOpenActionsRow((current) =>
                                current === index ? null : index,
                              )
                            }
                            triggerLabel={dictionary.table.actions}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
    </SuperAdminLayout>
  );
}
