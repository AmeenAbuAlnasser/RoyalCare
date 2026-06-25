"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  listTenantInvoices,
  updateTenantInvoiceStatus,
  type InvoiceStatus,
  type TenantInvoice,
} from "@/lib/api/tenant-billing";
import { BranchFilter } from "@/components/branch/BranchFilter";
import { useBranchFilter } from "@/lib/use-branch-filter";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
import { hasBillingPermission } from "./billing-permissions";

type BillingFilter = "ALL" | InvoiceStatus;

function getServiceName(
  service: { nameEn: string; nameAr: string; nameHe: string } | null,
  _locale: string,
  customServiceName?: string | null,
) {
  if (!service) return customServiceName || "";
  return service.nameEn || service.nameAr || service.nameHe || customServiceName || "";
}

export function TenantBillingPage() {
  const { locale } = useLanguage();
  const { branchId, setBranchId } = useBranchFilter();
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let isMounted = true;

    listTenantInvoices({ search, status: statusFilter, branchId: branchId || undefined })
      .then((response) => {
        if (isMounted) {
          setLoadError(false);
          setInvoices(response.items);
        }
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, branchId]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  return (
    <CenterAdminShell
      activeNav="billing"
      subtitle={(d) => d.billing.subtitle}
      title={(d) => d.billing.title}
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const canMarkPaid =
          hasBillingPermission(session.permissions, "billing:update") &&
          !isWriteBlocked;
        const canCancel =
          hasBillingPermission(session.permissions, "billing:cancel") &&
          !isWriteBlocked;

        const changeStatus = async (item: TenantInvoice, next: InvoiceStatus) => {
          setSavingId(item.id);
          setNotice("");
          try {
            const updated = await updateTenantInvoiceStatus(item.id, next);
            setInvoices((cur) =>
              cur.map((inv) => (inv.id === updated.id ? updated : inv)),
            );
            setNotice(
              next === "PAID"
                ? dictionary.billing.markedPaid
                : dictionary.billing.cancelled,
            );
          } finally {
            setSavingId("");
          }
        };

        const filterTabs: Array<{ value: BillingFilter; label: string }> = [
          { value: "ALL", label: dictionary.billing.filterAll },
          { value: "PENDING", label: dictionary.billingStatuses.PENDING },
          { value: "PARTIAL", label: dictionary.billingStatuses.PARTIAL },
          { value: "PAID", label: dictionary.billingStatuses.PAID },
          { value: "CANCELLED", label: dictionary.billingStatuses.CANCELLED },
        ];

        const emptyStates: Record<BillingFilter, { title: string; body: string }> = {
          ALL: {
            title: dictionary.billing.emptyTitle,
            body: dictionary.billing.emptyBody,
          },
          PENDING: {
            title: dictionary.billing.emptyPendingTitle,
            body: dictionary.billing.emptyPendingBody,
          },
          PARTIAL: {
            title: dictionary.billing.emptyPartialTitle,
            body: dictionary.billing.emptyPartialBody,
          },
          PAID: {
            title: dictionary.billing.emptyPaidTitle,
            body: dictionary.billing.emptyPaidBody,
          },
          CANCELLED: {
            title: dictionary.billing.emptyCancelledTitle,
            body: dictionary.billing.emptyCancelledBody,
          },
        };

        const currentEmpty = emptyStates[statusFilter];

        return (
          <>
            {/* Filters */}
            <AdminCard className="mt-5 p-4">
              {/* Status tab bar */}
              <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#F1F5F9] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${
                      statusFilter === tab.value
                        ? "bg-white text-[#0B2D5C] shadow-sm"
                        : "text-[#66758a] hover:bg-white/60 hover:text-[#0B2D5C]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search + Add button */}
              <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="min-h-11 min-w-0 flex-1 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={dictionary.billing.searchPlaceholder}
                  value={search}
                />
                <BranchFilter onChange={setBranchId} value={branchId} />
                {hasBillingPermission(session.permissions, "billing:create") ? (
                  isWriteBlocked ? (
                    <button
                      className={buttonClassName("primary", "md")}
                      disabled
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.billing.addInvoice}
                    </button>
                  ) : (
                    <Link
                      className={buttonClassName("primary", "md")}
                      href="/tenant/billing/new"
                    >
                      {dictionary.billing.addInvoice}
                    </Link>
                  )
                ) : null}
              </div>
            </AdminCard>

            {/* Notice */}
            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {/* Loading */}
            {isLoading ? (
              <AdminState
                className="mt-5"
                loading
                title={dictionary.billing.loading}
              />
            ) : null}

            {/* Error */}
            {loadError ? (
              <AdminState
                className="mt-5"
                title={dictionary.billing.loadError}
                tone="error"
              />
            ) : null}

            {/* Empty state */}
            {!isLoading && !loadError && invoices.length === 0 ? (
              <AdminState
                body={currentEmpty.body}
                className="mt-5 border-dashed"
                title={currentEmpty.title}
              />
            ) : null}

            {/* Invoice cards */}
            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {invoices.map((item) => {
                const isPending = item.status === "PENDING";
                const isPartial = item.status === "PARTIAL";
                const isPaid = item.status === "PAID";
                const isCancelled = item.status === "CANCELLED";
                const isSaving = savingId === item.id;

                return (
                  <article
                    className={`rounded-xl border p-4 shadow-[0_14px_34px_rgba(11,45,92,0.055)] transition-shadow duration-150 hover:shadow-[0_18px_42px_rgba(11,45,92,0.09)] ${
                      isCancelled
                        ? "border-red-200 bg-red-50 opacity-60"
                        : isPaid
                          ? "border-emerald-200 bg-emerald-50"
                          : isPartial
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-[#E5E7EB] bg-white"
                    }`}
                    key={item.id}
                  >
                    {/* Header */}
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className={`break-words text-base font-semibold text-[#0B2D5C]${isCancelled ? " line-through" : ""}`}>
                          {item.patient.fullName}
                        </h2>
                        <p className={`mt-1 break-words text-sm text-[#66758a]${isCancelled ? " line-through" : ""}`}>
                          {getServiceName(item.service, locale, item.customServiceName)}
                          {item.customServiceName ? (
                            <span className="ms-2 rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-bold text-[#0B2D5C]">
                              {dictionary.appointments.customServiceBadge}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-wrap gap-2">
                        <span className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                          {item.amount} {item.currency}
                        </span>
                        <StatusBadge
                          status={item.status}
                          label={dictionary.billingStatuses[item.status]}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      <Detail
                        label={dictionary.billing.patient}
                        strikethrough={isCancelled}
                        value={
                          item.patient.phone
                            ? `${item.patient.fullName} - ${item.patient.phone}`
                            : item.patient.fullName
                        }
                      />
                      {item.staffUser ? (
                        <Detail
                          label={dictionary.billing.provider}
                          value={item.staffUser.fullName}
                        />
                      ) : null}
                      <Detail
                        label={dictionary.billing.createdAt}
                        value={formatDate(item.createdAt, locale)}
                      />
                    </dl>

                    {/* Actions */}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link
                        className={buttonClassName("secondary", "sm")}
                        href={`/tenant/billing/${item.id}`}
                      >
                        {dictionary.common.view}
                      </Link>
                      {hasBillingPermission(session.permissions, "billing:update") &&
                      (isPending || isPartial) ? (
                        <button
                          className={buttonClassName("success", "sm")}
                          disabled={isSaving || !canMarkPaid}
                          onClick={() => changeStatus(item, "PAID")}
                          title={restrictionMessage || undefined}
                          type="button"
                        >
                          {dictionary.billing.markAsPaid}
                        </button>
                      ) : null}
                      {hasBillingPermission(session.permissions, "billing:cancel") &&
                      (isPending || isPartial || isPaid) ? (
                        <button
                          className={buttonClassName("warning", "sm")}
                          disabled={isSaving || !canCancel}
                          onClick={() => changeStatus(item, "CANCELLED")}
                          title={restrictionMessage || undefined}
                          type="button"
                        >
                          {dictionary.billing.cancelInvoice}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function StatusBadge({ status, label }: { status: InvoiceStatus; label: string }) {
  const base =
    "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold";

  if (status === "CANCELLED") {
    return (
      <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
        {label}
      </span>
    );
  }
  const cls =
    status === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "PARTIAL"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`${base} ${cls}`}>
      {label}
    </span>
  );
}

function Detail({
  label,
  value,
  strikethrough,
}: {
  label: string;
  value: string;
  strikethrough?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <dt className="text-xs font-semibold text-[#66758a]">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold text-[#24364f]${strikethrough ? " line-through" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
