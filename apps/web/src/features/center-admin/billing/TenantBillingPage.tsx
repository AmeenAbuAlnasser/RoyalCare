"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  listTenantInvoices,
  updateTenantInvoiceStatus,
  type InvoiceStatus,
  type TenantInvoice,
} from "@/lib/api/tenant-billing";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import { hasBillingPermission } from "./billing-permissions";

function getServiceName(
  service: { nameEn: string; nameAr: string; nameHe: string },
  locale: string,
) {
  if (locale === "ar" && service.nameAr) return service.nameAr;
  if (locale === "he" && service.nameHe) return service.nameHe;
  return service.nameEn || service.nameAr || service.nameHe;
}

export function TenantBillingPage() {
  const { locale } = useLanguage();
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let isMounted = true;

    listTenantInvoices({ search, status: statusFilter })
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
  }, [search, statusFilter]);

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
        const canCreate = hasBillingPermission(session.role.key, "billing.create");
        const canMarkPaid = hasBillingPermission(session.role.key, "billing.mark_paid");
        const canUpdate = hasBillingPermission(session.role.key, "billing.update");

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

        return (
          <>
            {/* Filters */}
            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(160px,0.38fr)]">
                  <input
                    className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={dictionary.billing.searchPlaceholder}
                    value={search}
                  />
                  <select
                    className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                    onChange={(e) =>
                      setStatusFilter(e.target.value as InvoiceStatus | "ALL")
                    }
                    value={statusFilter}
                  >
                    <option value="ALL">{dictionary.billing.filterAllStatuses}</option>
                    <option value="PENDING">{dictionary.billingStatuses.PENDING}</option>
                    <option value="PARTIAL">{dictionary.billingStatuses.PARTIAL}</option>
                    <option value="PAID">{dictionary.billingStatuses.PAID}</option>
                    <option value="CANCELLED">{dictionary.billingStatuses.CANCELLED}</option>
                  </select>
                </div>
                {canCreate ? (
                  <Link
                    className={buttonClassName("primary", "md")}
                    href="/tenant/billing/new"
                  >
                    {dictionary.billing.addInvoice}
                  </Link>
                ) : null}
              </div>
            </section>

            {/* Notice */}
            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {/* Loading */}
            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.billing.loading}
              </p>
            ) : null}

            {/* Error */}
            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.billing.loadError}
              </p>
            ) : null}

            {/* Empty */}
            {!isLoading && !loadError && invoices.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">
                  {dictionary.billing.emptyTitle}
                </h2>
                <p className="mt-2 text-sm text-[#66758a]">
                  {dictionary.billing.emptyBody}
                </p>
              </section>
            ) : null}

            {/* Invoice cards */}
            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {invoices.map((item) => {
                const isPending = item.status === "PENDING";
                const isPartial = item.status === "PARTIAL";
                const isPaid = item.status === "PAID";
                const isSaving = savingId === item.id;

                return (
                  <article
                    className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                    key={item.id}
                  >
                    {/* Header */}
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-semibold text-[#0B2D5C]">
                          {item.patient.fullName}
                        </h2>
                        <p className="mt-1 break-words text-sm text-[#66758a]">
                          {getServiceName(item.service, locale)}
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
                        value={
                          item.patient.phone
                            ? `${item.patient.fullName} · ${item.patient.phone}`
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
                      {canMarkPaid && (isPending || isPartial) ? (
                        <button
                          className={buttonClassName("success", "sm")}
                          disabled={isSaving}
                          onClick={() => changeStatus(item, "PAID")}
                          type="button"
                        >
                          {dictionary.billing.markAsPaid}
                        </button>
                      ) : null}
                      {canUpdate && (isPending || isPartial || isPaid) ? (
                        <button
                          className={buttonClassName("warning", "sm")}
                          disabled={isSaving}
                          onClick={() => changeStatus(item, "CANCELLED")}
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
  const cls =
    status === "PAID"
      ? "bg-emerald-50 text-emerald-800"
      : status === "PARTIAL"
        ? "bg-indigo-50 text-indigo-800"
        : status === "PENDING"
          ? "bg-amber-50 text-amber-800"
          : "bg-[#FFF7F7] text-[#B42318]";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <dt className="text-xs font-semibold text-[#66758a]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#24364f]">
        {value}
      </dd>
    </div>
  );
}
