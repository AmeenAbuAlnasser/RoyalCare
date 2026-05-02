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
import { centerStatusFilters } from "./centers-data";
import {
  ApiRequestError,
  listSuperAdminCenters,
  type ApiCenter,
  type ApiCenterStatus,
} from "@/lib/api/super-admin-centers";
import {
  getCurrentSuperAdminPermissions,
  hasPlatformPermission,
} from "@/lib/api/super-admin-permissions";

type Dictionary = (typeof superAdminCentersDictionaries)["en"];
type CenterStatus = keyof Dictionary["statuses"];
type CenterStatusFilter = (typeof centerStatusFilters)[number];
type CenterTypeKey = keyof Dictionary["types"];
type CenterPlanKey = keyof Dictionary["plans"];

type CenterTableRow = {
  centerName: string;
  domain: string;
  expiryDate: string;
  id: string;
  ownerName: string;
  planKey: CenterPlanKey;
  status: CenterStatus;
  type: CenterTypeKey;
};

function mapApiStatus(status: ApiCenterStatus): CenterStatus {
  if (status === "ACTIVE") {
    return "active";
  }

  if (
    status === "SUSPENDED" ||
    status === "CANCELLED" ||
    status === "ARCHIVED"
  ) {
    return "suspended";
  }

  if (status === "PAST_DUE") {
    return "expired";
  }

  return "trial";
}

function mapApiCenterType(type: ApiCenter["type"]): CenterTypeKey {
  const typeMap: Record<ApiCenter["type"], CenterTypeKey> = {
    BEAUTY: "beauty",
    HIJAMA: "hijama",
    LASER: "laser",
    MULTI_SPECIALTY: "multiSpecialty",
    PHYSIOTHERAPY: "physiotherapy",
    WELLNESS: "wellness",
  };

  return typeMap[type];
}

function mapApiPlan(planCode?: string): CenterPlanKey {
  const normalizedPlan = planCode?.toLowerCase();

  if (
    normalizedPlan === "basic" ||
    normalizedPlan === "trial" ||
    normalizedPlan === "standard" ||
    normalizedPlan === "starter" ||
    normalizedPlan === "premium" ||
    normalizedPlan === "professional" ||
    normalizedPlan === "enterprise"
  ) {
    return normalizedPlan;
  }

  return "trial";
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
    planKey: mapApiPlan(subscription?.planCode),
    status: mapApiStatus(center.status),
    type: mapApiCenterType(center.type),
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
  const [openActionsRow, setOpenActionsRow] = useState<string | null>(null);
  const [centers, setCenters] = useState<CenterTableRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<CenterStatusFilter | null>(null);
  const [actionNotice, setActionNotice] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState("");

  const canCreateCenters = hasPlatformPermission(
    permissions,
    "create:centers",
  );
  const canEditCenters = hasPlatformPermission(permissions, "edit:centers");
  const canManageStatus = hasPlatformPermission(
    permissions,
    "suspend:centers",
  );
  const canManageSubscriptions = hasPlatformPermission(
    permissions,
    "manage:subscriptions",
  );

  useEffect(() => {
    let isMounted = true;

    getCurrentSuperAdminPermissions()
      .then((response) => {
        if (isMounted) {
          setPermissions(response.permissions);
          setPermissionErrorMessage("");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("[RoyalCare centers] failed to load permissions", error);
          setPermissions([]);
          setPermissionErrorMessage(
            error instanceof ApiRequestError
              ? `${error.message} (${error.status})`
              : dictionary.states.errorDescription,
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dictionary.states.errorDescription]);

  useEffect(() => {
    let isMounted = true;

    listSuperAdminCenters()
      .then((response) => {
        if (isMounted) {
          setCenters(response.data.map(mapApiCenter));
          setErrorMessage("");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("[RoyalCare centers] failed to load centers", error);
          setCenters([]);
          setErrorMessage(
            error instanceof ApiRequestError
              ? `${error.message} (${error.status})`
              : dictionary.states.errorDescription,
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dictionary.states.errorDescription]);

  const filteredRows = useMemo<CenterTableRow[]>(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return centers.filter((center) => {
      const matchesStatus = activeStatusFilter
        ? center.status === activeStatusFilter
        : true;
      const matchesSearch = normalizedSearchQuery
        ? [
            center.centerName,
            center.domain,
            center.ownerName,
            dictionary.plans[center.planKey],
            dictionary.types[center.type],
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchQuery)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [activeStatusFilter, centers, dictionary.plans, dictionary.types, searchQuery]);

  const tableState = useMemo(() => {
    if (isLoading) {
      return {
        description: "",
        title: dictionary.states.loading,
      };
    }

    if (errorMessage) {
      return {
        description: errorMessage,
        title: dictionary.states.errorTitle,
      };
    }

    if (centers.length === 0) {
      return {
        description: dictionary.states.emptyDescription,
        title: dictionary.states.emptyTitle,
      };
    }

    if (filteredRows.length === 0) {
      return {
        description: dictionary.states.noResultsDescription,
        title: dictionary.states.noResultsTitle,
      };
    }

    return null;
  }, [
    centers.length,
    dictionary,
    errorMessage,
    filteredRows.length,
    isLoading,
  ]);

  const stats = useMemo(() => {
    return [
      { key: "totalCenters" as const, value: centers.length },
      {
        key: "activeCenters" as const,
        value: centers.filter((center) => center.status === "active").length,
      },
      {
        key: "trialCenters" as const,
        value: centers.filter((center) => center.status === "trial").length,
      },
      {
        key: "suspendedCenters" as const,
        value: centers.filter((center) => center.status === "suspended").length,
      },
    ];
  }, [centers]);

  function prepareRealAction(actionLabel: string, centerName: string) {
    setActionNotice(
      `${actionLabel}: ${centerName}. ${dictionary.states.actionPrepared}`,
    );
  }

  function getActionItems(center: CenterTableRow) {
    return [
      {
        href: `/super-admin/centers/${center.id}`,
        icon: "view" as const,
        label: dictionary.actions.view,
      },
      ...(canEditCenters
        ? [
            {
              href: `/super-admin/centers/${center.id}?mode=edit`,
              icon: "edit" as const,
              label: dictionary.actions.edit,
            },
          ]
        : []),
      ...(canManageSubscriptions
        ? [
            {
              icon: "renew" as const,
              label: dictionary.actions.renewSubscription,
              onSelect: () =>
                prepareRealAction(
                  dictionary.actions.renewSubscription,
                  center.centerName,
                ),
            },
          ]
        : []),
      ...(canManageStatus
        ? [
            {
              icon: "suspend" as const,
              label: dictionary.actions.suspend,
              onSelect: () =>
                prepareRealAction(
                  dictionary.actions.suspend,
                  center.centerName,
                ),
              tone: "warning" as const,
            },
          ]
        : []),
      ...(canEditCenters
        ? [
            {
              icon: "delete" as const,
              label: dictionary.actions.delete,
              onSelect: () =>
                prepareRealAction(dictionary.actions.delete, center.centerName),
              tone: "danger" as const,
            },
          ]
        : []),
    ];
  }

  return (
    <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
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
        {canCreateCenters ? (
          <Link
            className={primaryButtonClassName("w-full sm:w-auto")}
            href="/super-admin/centers/new"
          >
            {dictionary.actions.addNewCenter}
          </Link>
        ) : null}
      </div>

      {permissionErrorMessage ? (
        <p className="mt-4 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
          {permissionErrorMessage}
        </p>
      ) : null}

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
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={dictionary.search.placeholder}
              type="search"
              value={searchQuery}
            />
          </label>

          <div className="flex min-w-0 flex-wrap gap-2">
            {centerStatusFilters.map((filter) => (
              <button
                className={buttonClassName(
                  activeStatusFilter === filter ? "primary" : "secondary",
                  "sm",
                )}
                key={filter}
                onClick={() =>
                  setActiveStatusFilter((current) =>
                    current === filter ? null : filter,
                  )
                }
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
              {filteredRows.map((center) => (
                <tr className="border-t border-[#E5E7EB]" key={center.id}>
                  <td className="px-5 py-4 font-medium text-[#0B2D5C]">
                    {center.centerName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                    {center.ownerName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                    {dictionary.types[center.type]}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#526176]">
                    {dictionary.plans[center.planKey]}
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
                      isOpen={openActionsRow === center.id}
                      items={getActionItems(center)}
                      onClose={() => setOpenActionsRow(null)}
                      onToggle={() =>
                        setOpenActionsRow((current) =>
                          current === center.id ? null : center.id,
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
        {tableState ? (
          <div className="border-t border-[#E5E7EB] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[#0B2D5C]">
              {tableState.title}
            </p>
            {tableState.description ? (
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
                {tableState.description}
              </p>
            ) : null}
          </div>
        ) : null}
        {actionNotice ? (
          <div className="border-t border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3 text-sm font-medium text-[#66758a]">
            {actionNotice}
          </div>
        ) : null}
      </section>
    </SuperAdminLayout>
  );
}
