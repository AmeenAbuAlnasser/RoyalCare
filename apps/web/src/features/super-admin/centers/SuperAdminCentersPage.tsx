"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

type Dictionary = (typeof superAdminCentersDictionaries)["en"];
type CenterStatus = keyof Dictionary["statuses"];
type CenterStatusFilter = (typeof centerStatusFilters)[number];
type CenterTypeKey = keyof Dictionary["types"];
type CenterPlanKey = keyof Dictionary["plans"];

type ReviewReason =
  | "NO_SUBSCRIPTION"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_GRACE_PERIOD"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_CANCELLED"
  | "OTHER";

type CenterTableRow = {
  centerName: string;
  domain: string;
  expiryDate: string;
  graceDaysRemaining: number | null;
  id: string;
  needsSubscriptionReview: boolean;
  overdueDays: number | null;
  ownerName: string;
  planKey: CenterPlanKey;
  reviewReason: ReviewReason | null;
  status: CenterStatus;
  type: CenterTypeKey;
};

function computeReviewReason(
  center: ApiCenter,
): { reason: ReviewReason; overdueDays: number | null; graceDaysRemaining: number | null } | null {
  if (center.status !== "ACTIVE") return null;
  const sub = center.subscriptions?.[0];
  if (!sub) return { reason: "NO_SUBSCRIPTION", overdueDays: null, graceDaysRemaining: null };
  const status = sub.status.toUpperCase();
  if (status === "CANCELLED") return { reason: "SUBSCRIPTION_CANCELLED", overdueDays: null, graceDaysRemaining: null };
  if (status === "SUSPENDED") return { reason: "SUBSCRIPTION_SUSPENDED", overdueDays: null, graceDaysRemaining: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check grace period first
  if (status === "EXPIRED" && sub.gracePeriodEndsAt) {
    const graceEnd = new Date(sub.gracePeriodEndsAt);
    graceEnd.setHours(0, 0, 0, 0);
    const graceDiff = Math.ceil((graceEnd.getTime() - today.getTime()) / 86400000);
    if (graceDiff > 0) {
      return { reason: "SUBSCRIPTION_GRACE_PERIOD", overdueDays: null, graceDaysRemaining: graceDiff };
    }
  }

  const daysRemaining = Math.ceil(
    (new Date(sub.currentPeriodEnd).getTime() - today.getTime()) / 86400000,
  );
  if (status === "EXPIRED" || daysRemaining < 0) {
    return {
      reason: "SUBSCRIPTION_EXPIRED",
      overdueDays: daysRemaining < 0 ? Math.abs(daysRemaining) : null,
      graceDaysRemaining: null,
    };
  }
  // ACTIVE subscription with daysRemaining > 7 is healthy — not in review
  if (status === "ACTIVE" && daysRemaining > 7) return null;
  // Covers: EXPIRING_SOON (0–7 days), TRIALING, PAST_DUE, unknown
  return { reason: "OTHER", overdueDays: null, graceDaysRemaining: null };
}

function formatExpiredDaysLabel(days: number, locale: string): string {
  if (locale === "ar") {
    const unit = days >= 3 && days <= 10 ? "أيام" : "يوم";
    return `الاشتراك منتهي منذ ${days} ${unit}`;
  }
  if (locale === "he") {
    const unit = days === 1 ? "יום" : "ימים";
    return `המינוי פג לפני ${days} ${unit}`;
  }
  return `Expired ${days} day${days === 1 ? "" : "s"} ago`;
}

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
  const reviewInfo = computeReviewReason(center);

  return {
    centerName: center.name,
    domain: domain?.hostname ?? center.slug,
    expiryDate: subscription?.currentPeriodEnd ?? center.createdAt,
    graceDaysRemaining: reviewInfo?.graceDaysRemaining ?? null,
    id: center.id,
    needsSubscriptionReview: reviewInfo !== null,
    overdueDays: reviewInfo?.overdueDays ?? null,
    ownerName: center.owner?.fullName ?? center.owner?.email ?? "-",
    planKey: mapApiPlan(subscription?.planCode),
    reviewReason: reviewInfo?.reason ?? null,
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
  const router = useRouter();
  const { locale } = useLanguage();
  const dictionary = superAdminCentersDictionaries[locale];
  const searchParams = useSearchParams();
  const [openActionsRow, setOpenActionsRow] = useState<string | null>(null);
  const [centers, setCenters] = useState<CenterTableRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const _statusParam = searchParams.get("status");
  const [activeStatusFilter, setActiveStatusFilter] = useState<CenterStatusFilter | null>(
    _statusParam === "active" ? "active" : _statusParam === "inactive" ? "suspended" : null,
  );
  const [activeLifecycleFilter, setActiveLifecycleFilter] = useState<"NEEDS_SUBSCRIPTION_REVIEW" | null>(
    searchParams.get("lifecycle") === "NEEDS_SUBSCRIPTION_REVIEW" ? "NEEDS_SUBSCRIPTION_REVIEW" : null,
  );
  const [highlightedCenterId, setHighlightedCenterId] = useState<string | null>(
    searchParams.get("centerId"),
  );
  const [urlBanner, setUrlBanner] = useState<"active" | "centerId" | "inactive" | "needsSubscriptionReview" | "noAppointments" | null>(() => {
    const s = searchParams.get("status");
    const c = searchParams.get("centerId");
    const f = searchParams.get("filter");
    const l = searchParams.get("lifecycle");
    if (l === "NEEDS_SUBSCRIPTION_REVIEW") return "needsSubscriptionReview";
    if (s === "active") return "active";
    if (s === "inactive") return "inactive";
    if (c) return "centerId";
    if (f === "no-appointments") return "noAppointments";
    return null;
  });
  const [actionNotice, setActionNotice] = useState("");
  const canCreateCenters = true;
  const canEditCenters = true;
  const canManageStatus = true;
  const canManageSubscriptions = true;

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

  useEffect(() => {
    if (!isLoading && highlightedCenterId) {
      window.setTimeout(() => {
        document
          .getElementById(`center-row-${highlightedCenterId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [isLoading, highlightedCenterId]);

  const filteredRows = useMemo<CenterTableRow[]>(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const rows = centers.filter((center) => {
      const matchesStatus = activeStatusFilter
        ? center.status === activeStatusFilter
        : true;
      const matchesLifecycle =
        activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW"
          ? center.needsSubscriptionReview
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

      return matchesStatus && matchesLifecycle && matchesSearch;
    });

    if (activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW") {
      console.debug(
        "[RoyalCare centers] NEEDS_SUBSCRIPTION_REVIEW filtered count:",
        rows.length,
        "ids:",
        rows.map((r) => r.id.slice(0, 8)),
      );
    }

    return rows;
  }, [activeLifecycleFilter, activeStatusFilter, centers, dictionary.plans, dictionary.types, searchQuery]);

  const reviewBreakdown = useMemo(() => {
    if (activeLifecycleFilter !== "NEEDS_SUBSCRIPTION_REVIEW") return null;
    const counts: Record<ReviewReason, number> = {
      NO_SUBSCRIPTION: 0,
      OTHER: 0,
      SUBSCRIPTION_CANCELLED: 0,
      SUBSCRIPTION_EXPIRED: 0,
      SUBSCRIPTION_GRACE_PERIOD: 0,
      SUBSCRIPTION_SUSPENDED: 0,
    };
    for (const row of filteredRows) {
      if (row.reviewReason) counts[row.reviewReason]++;
    }
    return counts;
  }, [activeLifecycleFilter, filteredRows]);

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
      if (activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW") {
        return {
          description: "",
          title: dictionary.states.filterNeedsSubscriptionReviewEmpty,
        };
      }
      return {
        description: dictionary.states.noResultsDescription,
        title: dictionary.states.noResultsTitle,
      };
    }

    return null;
  }, [
    activeLifecycleFilter,
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

  function clearUrlFilter() {
    setActiveStatusFilter(null);
    setActiveLifecycleFilter(null);
    setHighlightedCenterId(null);
    setUrlBanner(null);
    router.replace("/super-admin/centers", { scroll: false });
  }

  function getUrlBannerLabel(): string {
    if (urlBanner === "active") return dictionary.statuses.active;
    if (urlBanner === "inactive") return dictionary.statuses.suspended;
    if (urlBanner === "centerId") return dictionary.states.highlightCenter;
    if (urlBanner === "noAppointments") return dictionary.states.filterNoAppointments;
    if (urlBanner === "needsSubscriptionReview") return dictionary.states.filterNeedsSubscriptionReview;
    return "";
  }

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

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {centerStatusFilters.map((filter) => (
              <button
                className={buttonClassName(
                  activeStatusFilter === filter && !activeLifecycleFilter
                    ? "primary"
                    : "secondary",
                  "sm",
                )}
                key={filter}
                onClick={() => {
                  setActiveLifecycleFilter(null);
                  setActiveStatusFilter((current) =>
                    current === filter ? null : filter,
                  );
                }}
                type="button"
              >
                {dictionary.filters[filter]}
              </button>
            ))}

            <span
              aria-hidden="true"
              className="h-5 w-px bg-[#E5E7EB]"
            />

            <button
              className={buttonClassName(
                activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW"
                  ? "warning"
                  : "secondary",
                "sm",
              )}
              onClick={() => {
                setActiveStatusFilter(null);
                setActiveLifecycleFilter((current) =>
                  current === "NEEDS_SUBSCRIPTION_REVIEW"
                    ? null
                    : "NEEDS_SUBSCRIPTION_REVIEW",
                );
              }}
              type="button"
            >
              {dictionary.filters.needsSubscriptionReview}
            </button>
          </div>
        </div>

        {activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW" ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <p className="text-sm font-semibold text-[#7A5C20]">
                    {formatNumber(filteredRows.length)}{" "}
                    {dictionary.banner.centersNeedReview}
                  </p>
                </div>
                {reviewBreakdown && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reviewBreakdown.SUBSCRIPTION_EXPIRED > 0 && (
                      <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        {formatNumber(reviewBreakdown.SUBSCRIPTION_EXPIRED)}{" "}
                        {dictionary.banner.expiredSubscriptions}
                      </span>
                    )}
                    {reviewBreakdown.SUBSCRIPTION_GRACE_PERIOD > 0 && (
                      <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {formatNumber(reviewBreakdown.SUBSCRIPTION_GRACE_PERIOD)}{" "}
                        {dictionary.banner.gracePeriod}
                      </span>
                    )}
                    {reviewBreakdown.NO_SUBSCRIPTION > 0 && (
                      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {formatNumber(reviewBreakdown.NO_SUBSCRIPTION)}{" "}
                        {dictionary.banner.noSubscription}
                      </span>
                    )}
                    {reviewBreakdown.SUBSCRIPTION_SUSPENDED > 0 && (
                      <span className="inline-flex items-center rounded border border-amber-300 bg-amber-100/60 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {formatNumber(reviewBreakdown.SUBSCRIPTION_SUSPENDED)}{" "}
                        {dictionary.banner.suspendedSubscription}
                      </span>
                    )}
                    {reviewBreakdown.SUBSCRIPTION_CANCELLED > 0 && (
                      <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {formatNumber(reviewBreakdown.SUBSCRIPTION_CANCELLED)}{" "}
                        {dictionary.banner.cancelledSubscription}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                className="shrink-0 rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#7A5C20] hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                onClick={() => setActiveLifecycleFilter(null)}
                type="button"
              >
                {dictionary.states.clearFilter}
              </button>
            </div>
          </div>
        ) : urlBanner ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] bg-[#FFFBF0] px-5 py-2.5">
            <span className="text-xs font-semibold text-[#7A5C20]">
              {getUrlBannerLabel()}
            </span>
            <button
              className="ms-auto shrink-0 rounded px-2.5 py-1 text-xs font-medium text-[#7A5C20] hover:bg-[#C8A45D]/15"
              onClick={clearUrlFilter}
              type="button"
            >
              {dictionary.states.clearFilter}
            </button>
          </div>
        ) : null}

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
                {activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW" ? (
                  <th className="px-5 py-3 text-start font-medium">
                    {dictionary.table.reviewReason}
                  </th>
                ) : null}
                <th className="px-5 py-3 text-start font-medium">
                  {dictionary.table.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((center) => (
                <tr
                  className={`border-t border-[#E5E7EB] transition-colors ${center.id === highlightedCenterId ? "bg-[#FFFBF0] ring-1 ring-inset ring-[#C8A45D]/50" : ""}`}
                  id={`center-row-${center.id}`}
                  key={center.id}
                >
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
                  {activeLifecycleFilter === "NEEDS_SUBSCRIPTION_REVIEW" ? (
                    <td className="whitespace-nowrap px-5 py-4">
                      {center.reviewReason ? (
                        <span
                          className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${
                            center.reviewReason === "SUBSCRIPTION_EXPIRED"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : center.reviewReason === "SUBSCRIPTION_GRACE_PERIOD"
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : center.reviewReason === "NO_SUBSCRIPTION"
                                  ? "border-slate-200 bg-slate-50 text-slate-600"
                                  : center.reviewReason === "SUBSCRIPTION_SUSPENDED"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : center.reviewReason === "SUBSCRIPTION_CANCELLED"
                                      ? "border-gray-200 bg-gray-50 text-gray-600"
                                      : "border-gray-100 bg-gray-50 text-gray-500"
                          }`}
                        >
                          {center.reviewReason === "SUBSCRIPTION_EXPIRED" &&
                          center.overdueDays !== null
                            ? formatExpiredDaysLabel(center.overdueDays, locale)
                            : center.reviewReason === "SUBSCRIPTION_GRACE_PERIOD"
                              ? `${dictionary.reviewReasons.subscriptionGracePeriod}${center.graceDaysRemaining !== null ? ` — ${center.graceDaysRemaining}` : ""}`
                              : center.reviewReason === "NO_SUBSCRIPTION"
                                ? dictionary.reviewReasons.noSubscription
                                : center.reviewReason === "SUBSCRIPTION_SUSPENDED"
                                  ? dictionary.reviewReasons.subscriptionSuspended
                                  : center.reviewReason === "SUBSCRIPTION_CANCELLED"
                                    ? dictionary.reviewReasons.subscriptionCancelled
                                    : dictionary.reviewReasons.subscriptionExpired}
                        </span>
                      ) : (
                        <span className="text-[#526176]">—</span>
                      )}
                    </td>
                  ) : null}
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
