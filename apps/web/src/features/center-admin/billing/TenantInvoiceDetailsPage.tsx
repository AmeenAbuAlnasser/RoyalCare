"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  createTenantPayment,
  getTenantInvoice,
  listTenantPayments,
  updateTenantInvoiceStatus,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentSummary,
  type TenantInvoice,
} from "@/lib/api/tenant-billing";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import { hasBillingPermission, hasPaymentPermission } from "./billing-permissions";

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "CHECK", "OTHER"];

function getServiceName(
  service: { nameEn: string; nameAr: string; nameHe: string },
  locale: string,
) {
  if (locale === "ar" && service.nameAr) return service.nameAr;
  if (locale === "he" && service.nameHe) return service.nameHe;
  return service.nameEn || service.nameAr || service.nameHe;
}

export function TenantInvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const { locale } = useLanguage();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState<TenantInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");
  const [isSaving, setIsSaving] = useState(false);

  // Payment state
  const [payments, setPayments] = useState<PaymentSummary | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const loadPayments = (id: string) => {
    setPaymentsLoading(true);
    listTenantPayments(id)
      .then((data) => setPayments(data))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  };

  useEffect(() => {
    if (!invoiceId) return;
    let isMounted = true;

    getTenantInvoice(invoiceId)
      .then((data) => {
        if (isMounted) {
          setInvoice(data);
          loadPayments(invoiceId);
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
  }, [invoiceId]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(id);
  }, [notice]);

  return (
    <CenterAdminShell
      activeNav="billing"
      subtitle={(d) => d.billing.subtitle}
      title={(d) => d.billing.invoiceTitle}
    >
      {({ dictionary, session }) => {
        const canMarkPaid = hasBillingPermission(session.role.key, "billing.mark_paid");
        const canUpdate = hasBillingPermission(session.role.key, "billing.update");
        const canViewPayments = hasPaymentPermission(session.role.key, "payments.view");
        const canCreatePayment = hasPaymentPermission(session.role.key, "payments.create");

        const methodLabel = (m: PaymentMethod) => {
          if (m === "CASH") return dictionary.billing.methodCash;
          if (m === "BANK_TRANSFER") return dictionary.billing.methodBankTransfer;
          if (m === "CHECK") return dictionary.billing.methodCheck;
          return dictionary.billing.methodOther;
        };

        const changeStatus = async (next: InvoiceStatus) => {
          if (!invoice) return;
          setIsSaving(true);
          setNotice("");
          try {
            const updated = await updateTenantInvoiceStatus(invoice.id, next);
            setInvoice(updated);
            if (invoiceId) loadPayments(invoiceId);
            setNoticeType("success");
            setNotice(
              next === "PAID"
                ? dictionary.billing.markedPaid
                : next === "PENDING"
                  ? dictionary.billing.reopened
                  : dictionary.billing.cancelled,
            );
          } catch {
            // keep current state
          } finally {
            setIsSaving(false);
          }
        };

        const submitPayment = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!invoice) return;
          setPaymentErrors({});

          const errors: Record<string, string> = {};
          const amountNum = parseFloat(paymentAmount);
          if (!paymentAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
            errors.amount = dictionary.billing.invalidAmount;
          }

          if (Object.keys(errors).length > 0) {
            setPaymentErrors(errors);
            return;
          }

          setIsAddingPayment(true);
          try {
            const result = await createTenantPayment(invoice.id, {
              amount: paymentAmount.trim(),
              method: paymentMethod,
              notes: paymentNotes.trim() || undefined,
              paidAt: paymentDate || undefined,
            });
            setInvoice((prev) =>
              prev ? { ...prev, status: result.invoiceStatus } : prev,
            );
            loadPayments(invoice.id);
            setPaymentAmount("");
            setPaymentMethod("CASH");
            setPaymentDate("");
            setPaymentNotes("");
            setNoticeType("success");
            setNotice(dictionary.billing.paymentAdded);
          } catch (err: unknown) {
            const apiErr = err as { details?: { errors?: Record<string, string> } };
            const fieldErrors = apiErr?.details?.errors;
            if (fieldErrors && typeof fieldErrors === "object") {
              const mapped: Record<string, string> = {};
              if (fieldErrors.amount) mapped.amount = fieldErrors.amount;
              if (fieldErrors.invoice) {
                setNoticeType("error");
                setNotice(fieldErrors.invoice);
              }
              setPaymentErrors(mapped);
            } else {
              setNoticeType("error");
              setNotice(dictionary.billing.overpaymentError);
            }
          } finally {
            setIsAddingPayment(false);
          }
        };

        return (
          <>
            <div className="mt-5">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/billing"
              >
                {dictionary.nav.billing}
              </Link>
            </div>

            {notice ? (
              <p
                className={`mt-4 rounded-md border px-4 py-3 text-sm font-semibold ${
                  noticeType === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.billing.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.billing.notFound}
              </p>
            ) : null}

            {!isLoading && !loadError && invoice ? (
              <>
                {/* Status header */}
                <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3">
                  <StatusBadge
                    label={dictionary.billingStatuses[invoice.status]}
                    status={invoice.status}
                  />
                  {canMarkPaid && (invoice.status === "PENDING" || invoice.status === "PARTIAL") ? (
                    <button
                      className={buttonClassName("success", "sm")}
                      disabled={isSaving}
                      onClick={() => changeStatus("PAID")}
                      type="button"
                    >
                      {dictionary.billing.markAsPaid}
                    </button>
                  ) : null}
                  {canUpdate &&
                  (invoice.status === "PENDING" ||
                    invoice.status === "PARTIAL" ||
                    invoice.status === "PAID") ? (
                    <button
                      className={buttonClassName("warning", "sm")}
                      disabled={isSaving}
                      onClick={() => changeStatus("CANCELLED")}
                      type="button"
                    >
                      {dictionary.billing.cancelInvoice}
                    </button>
                  ) : null}
                  {canUpdate && invoice.status === "CANCELLED" ? (
                    <button
                      className={buttonClassName("primary", "sm")}
                      disabled={isSaving}
                      onClick={() => changeStatus("PENDING")}
                      type="button"
                    >
                      {dictionary.billing.reopenInvoice}
                    </button>
                  ) : null}
                </div>

                {/* Invoice detail card */}
                <section className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label={dictionary.billing.patient}
                      value={`${invoice.patient.fullName} · ${invoice.patient.phone}`}
                    />
                    <DetailField
                      label={dictionary.billing.service}
                      value={getServiceName(invoice.service, locale)}
                    />
                    {invoice.staffUser ? (
                      <DetailField
                        label={dictionary.billing.provider}
                        value={invoice.staffUser.fullName}
                      />
                    ) : null}
                    <DetailField
                      label={dictionary.billing.amount}
                      value={`${invoice.amount} ${invoice.currency}`}
                    />
                    <DetailField
                      label={dictionary.billing.status}
                      value={dictionary.billingStatuses[invoice.status]}
                    />
                    <DetailField
                      label={dictionary.billing.createdAt}
                      value={formatDate(invoice.createdAt, locale)}
                    />
                    <DetailField
                      label={dictionary.billing.updatedAt}
                      value={formatDate(invoice.updatedAt, locale)}
                    />
                    {invoice.notes ? (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <DetailField
                          label={dictionary.billing.notes}
                          value={invoice.notes}
                        />
                      </div>
                    ) : null}
                  </div>
                </section>

                {/* Payment summary bar */}
                {canViewPayments && payments ? (
                  <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                    <SummaryCard
                      label={dictionary.billing.invoiceTotal}
                      value={`${payments.invoiceTotal} ${payments.currency}`}
                      variant="neutral"
                    />
                    <SummaryCard
                      label={dictionary.billing.paidAmount}
                      value={`${payments.paidAmount} ${payments.currency}`}
                      variant="paid"
                    />
                    <SummaryCard
                      label={dictionary.billing.balanceDue}
                      value={`${payments.balanceDue} ${payments.currency}`}
                      variant={parseFloat(payments.balanceDue) > 0 ? "due" : "settled"}
                    />
                  </div>
                ) : null}

                {/* Add Payment form */}
                {canCreatePayment && invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
                  <section className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                    <h2 className="mb-4 text-sm font-bold text-[#0B2D5C]">
                      {dictionary.billing.addPayment}
                    </h2>
                    <form onSubmit={submitPayment} noValidate>
                      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Amount */}
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                            {dictionary.billing.amount}
                          </label>
                          <input
                            className={`min-h-10 w-full rounded-md border px-3 text-sm text-[#132238] ${
                              paymentErrors.amount
                                ? "border-red-400 bg-red-50"
                                : "border-[#D8DEE8]"
                            }`}
                            inputMode="decimal"
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            type="text"
                            value={paymentAmount}
                          />
                          {paymentErrors.amount ? (
                            <p className="mt-1 text-xs text-red-600">{paymentErrors.amount}</p>
                          ) : null}
                        </div>

                        {/* Method */}
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                            {dictionary.billing.paymentMethod}
                          </label>
                          <select
                            className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            value={paymentMethod}
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m} value={m}>
                                {methodLabel(m)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date */}
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                            {dictionary.billing.paymentDate}
                          </label>
                          <input
                            className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                            onChange={(e) => setPaymentDate(e.target.value)}
                            type="date"
                            value={paymentDate}
                          />
                        </div>

                        {/* Notes */}
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                            {dictionary.billing.paymentNotes}{" "}
                            <span className="font-normal text-[#a0aec0]">
                              ({dictionary.billing.paymentNotesOptional})
                            </span>
                          </label>
                          <input
                            className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            type="text"
                            value={paymentNotes}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          className={buttonClassName("primary", "md")}
                          disabled={isAddingPayment}
                          type="submit"
                        >
                          {isAddingPayment ? dictionary.common.saving : dictionary.billing.addPayment}
                        </button>
                      </div>
                    </form>
                  </section>
                ) : null}

                {/* Payment history */}
                {canViewPayments ? (
                  <section className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                    <h2 className="mb-4 text-sm font-bold text-[#0B2D5C]">
                      {dictionary.billing.paymentHistory}
                    </h2>

                    {paymentsLoading ? (
                      <p className="text-sm text-[#66758a]">{dictionary.billing.loading}</p>
                    ) : payments && payments.payments.length > 0 ? (
                      <div className="min-w-0 overflow-x-auto">
                        <table className="w-full min-w-[500px] border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-[#E5E7EB]">
                              <th className="pb-2 text-start text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.amount}
                              </th>
                              <th className="pb-2 text-start text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.paymentMethod}
                              </th>
                              <th className="pb-2 text-start text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.paymentDate}
                              </th>
                              <th className="pb-2 text-start text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.notes}
                              </th>
                              <th className="pb-2 text-start text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.paymentBy}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.payments.map((p) => (
                              <tr
                                className="border-b border-[#F3F4F6] last:border-0"
                                key={p.id}
                              >
                                <td className="py-3 font-semibold text-[#24364f]">
                                  {p.amount} {p.currency}
                                </td>
                                <td className="py-3 text-[#24364f]">{methodLabel(p.method)}</td>
                                <td className="py-3 text-[#66758a]">
                                  {formatDate(p.paidAt, locale)}
                                </td>
                                <td className="py-3 text-[#66758a]">{p.notes ?? "—"}</td>
                                <td className="py-3 text-[#66758a]">{p.createdBy.fullName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-[#66758a]">{dictionary.billing.noPayments}</p>
                    )}
                  </section>
                ) : null}
              </>
            ) : null}
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function StatusBadge({ status, label }: { status: InvoiceStatus; label: string }) {
  const cls =
    status === "PAID"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "PARTIAL"
        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
        : status === "PENDING"
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-[#FFF7F7] text-[#B42318] border-[#F3B8B8]";

  return (
    <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <p className="text-xs font-semibold text-[#66758a]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#24364f]">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "neutral" | "paid" | "due" | "settled";
}) {
  const cls =
    variant === "paid"
      ? "bg-emerald-50 border-emerald-200"
      : variant === "due"
        ? "bg-amber-50 border-amber-200"
        : variant === "settled"
          ? "bg-emerald-50 border-emerald-200"
          : "bg-[#F8FAFC] border-[#E5E7EB]";

  const textCls =
    variant === "paid" || variant === "settled"
      ? "text-emerald-800"
      : variant === "due"
        ? "text-amber-800"
        : "text-[#24364f]";

  return (
    <div className={`min-w-0 rounded-lg border p-4 ${cls}`}>
      <p className="text-xs font-semibold text-[#66758a]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${textCls}`}>{value}</p>
    </div>
  );
}
