"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  createTenantPayment,
  getTenantInvoice,
  getTenantPatientCredit,
  listTenantPayments,
  updateTenantInvoiceStatus,
  applyTenantCredit,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentSummary,
  type TenantInvoice,
} from "@/lib/api/tenant-billing";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
import { hasBillingPermission, hasPaymentPermission } from "./billing-permissions";

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "CHECK", "OTHER"];

function getServiceName(
  service: { nameEn: string; nameAr: string; nameHe: string } | null,
  locale: string,
  customServiceName?: string | null,
) {
  if (!service) return customServiceName || "";
  if (locale === "ar" && service.nameAr) return service.nameAr;
  if (locale === "he" && service.nameHe) return service.nameHe;
  return service.nameEn || service.nameAr || service.nameHe || customServiceName || "";
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

  // Use Credit state
  const [creditAmount, setCreditAmount] = useState("");
  const [creditErrors, setCreditErrors] = useState<Record<string, string>>({});
  const [isUsingCredit, setIsUsingCredit] = useState(false);

  // Patient credit is fetched independently so visibility doesn't depend on payments loading.
  const [patientCredit, setPatientCredit] = useState<string | null>(null);

  const loadPayments = (id: string) => {
    setPaymentsLoading(true);
    listTenantPayments(id)
      .then((data) => {
        setPayments(data);
        setPatientCredit(data.patientCreditBalance);
      })
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  };

  useEffect(() => {
    if (!invoiceId) return;
    let isMounted = true;

    Promise.all([
      getTenantInvoice(invoiceId),
      getTenantPatientCredit(invoiceId),
    ])
      .then(([invoiceData, creditData]) => {
        if (isMounted) {
          setInvoice(invoiceData);
          setPatientCredit(creditData.patientCreditBalance);
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
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const hasBillingUpdatePermission = hasBillingPermission(
          session.permissions,
          "billing:update",
        );
        const hasBillingCancelPermission = hasBillingPermission(
          session.permissions,
          "billing:cancel",
        );
        const canViewPayments = hasPaymentPermission(session.permissions, "payments:view");
        const hasCreatePaymentPermission = hasPaymentPermission(
          session.permissions,
          "payments:create",
        );

        const methodLabel = (m: PaymentMethod) => {
          if (m === "CASH") return dictionary.billing.methodCash;
          if (m === "BANK_TRANSFER") return dictionary.billing.methodBankTransfer;
          if (m === "CHECK") return dictionary.billing.methodCheck;
          return dictionary.billing.methodOther;
        };

        const changeStatus = async (next: InvoiceStatus) => {
          if (!invoice || isWriteBlocked) return;
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
          if (isWriteBlocked) {
            setNoticeType("error");
            setNotice(restrictionMessage);
            return;
          }
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
            setPayments((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                paidAmount: result.paidAmount,
                balanceDue: result.balanceDue,
                ...(result.patientCreditBalance !== null
                  ? { patientCreditBalance: result.patientCreditBalance }
                  : {}),
              };
            });
            if (result.patientCreditBalance !== null) {
              setPatientCredit(result.patientCreditBalance);
            }
            loadPayments(invoice.id);
            setPaymentAmount("");
            setPaymentMethod("CASH");
            setPaymentDate("");
            setPaymentNotes("");
            setNoticeType("success");
            setNotice(
              result.creditAdded && parseFloat(result.creditAdded) > 0
                ? `${dictionary.billing.paymentAdded} ${dictionary.billing.overpaymentCreditNotice}`
                : dictionary.billing.paymentAdded,
            );
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

        const submitUseCredit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (isWriteBlocked) {
            setNoticeType("error");
            setNotice(restrictionMessage);
            return;
          }
          if (!invoice || !payments) return;
          setCreditErrors({});

          const errors: Record<string, string> = {};
          const amountNum = parseFloat(creditAmount);
          const creditBalance = parseFloat(payments.patientCreditBalance ?? "0");
          const balanceDue = parseFloat(payments.balanceDue ?? "0");
          const maxApplicable = Math.min(creditBalance, balanceDue);

          if (!creditAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
            errors.amount = dictionary.billing.invalidAmount;
          } else if (amountNum > creditBalance + 0.001) {
            errors.amount = dictionary.billing.insufficientCredit;
          } else if (amountNum > balanceDue + 0.001) {
            errors.amount = `${dictionary.billing.creditAmount}: max ${maxApplicable.toFixed(2)}`;
          }

          if (Object.keys(errors).length > 0) {
            setCreditErrors(errors);
            return;
          }

          setIsUsingCredit(true);
          try {
            const result = await applyTenantCredit(invoice.id, {
              amount: creditAmount.trim(),
            });
            setInvoice((prev) =>
              prev ? { ...prev, status: result.invoiceStatus } : prev,
            );
            setPayments((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                paidAmount: result.paidAmount,
                balanceDue: result.balanceDue,
                patientCreditBalance: result.patientCreditBalance,
              };
            });
            setPatientCredit(result.patientCreditBalance);
            loadPayments(invoice.id);
            setCreditAmount("");
            setNoticeType("success");
            setNotice(dictionary.billing.creditApplied);

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
              setCreditErrors(mapped);
            } else {
              setNoticeType("error");
              setNotice(dictionary.billing.insufficientCredit);
            }
          } finally {
            setIsUsingCredit(false);
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
              <AdminState
                className="mt-5"
                loading
                title={dictionary.billing.loading}
              />
            ) : null}

            {loadError ? (
              <AdminState
                className="mt-5"
                title={dictionary.billing.notFound}
                tone="error"
              />
            ) : null}

            {!isLoading && !loadError && invoice ? (
              <>
                {/* Status header */}
                <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3">
                  <StatusBadge
                    label={dictionary.billingStatuses[invoice.status]}
                    status={invoice.status}
                  />
                  {hasBillingUpdatePermission && (invoice.status === "PENDING" || invoice.status === "PARTIAL") ? (
                    <button
                      className={buttonClassName("success", "sm")}
                      disabled={isSaving || isWriteBlocked}
                      onClick={() => changeStatus("PAID")}
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.billing.markAsPaid}
                    </button>
                  ) : null}
                  {hasBillingCancelPermission &&
                  (invoice.status === "PENDING" ||
                    invoice.status === "PARTIAL" ||
                    invoice.status === "PAID") ? (
                    <button
                      className={buttonClassName("warning", "sm")}
                      disabled={isSaving || isWriteBlocked}
                      onClick={() => changeStatus("CANCELLED")}
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.billing.cancelInvoice}
                    </button>
                  ) : null}
                  {hasBillingUpdatePermission && invoice.status === "CANCELLED" ? (
                    <button
                      className={buttonClassName("primary", "sm")}
                      disabled={isSaving || isWriteBlocked}
                      onClick={() => changeStatus("PENDING")}
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.billing.reopenInvoice}
                    </button>
                  ) : null}
                </div>

                {/* Cancelled notice */}
                {invoice.status === "CANCELLED" ? (
                  <div className="mt-3 flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                    <span className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                      {dictionary.billingStatuses.CANCELLED}
                    </span>
                    <span className="text-sm font-semibold text-red-800">
                      {dictionary.billing.cancelled}
                    </span>
                  </div>
                ) : null}

                {/* Invoice detail card */}
                <section className={`mt-4 rounded-lg border p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)] ${
                  invoice.status === "CANCELLED"
                    ? "border-red-200 bg-red-50"
                    : "border-[#E5E7EB] bg-white"
                }`}>
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label={dictionary.billing.patient}
                      strikethrough={invoice.status === "CANCELLED"}
                      value={`${invoice.patient.fullName} - ${invoice.patient.phone}`}
                    />
                    <DetailField
                      label={dictionary.billing.service}
                      strikethrough={invoice.status === "CANCELLED"}
                      value={getServiceName(
                        invoice.service,
                        locale,
                        invoice.customServiceName,
                      )}
                    />
                    {invoice.customServiceName ? (
                      <DetailField
                        label={dictionary.appointments.customServiceBadge}
                        value={dictionary.appointments.customServiceBadge}
                      />
                    ) : null}
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
                  <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
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
                    <SummaryCard
                      label={dictionary.billing.creditBalance}
                      value={`${payments.patientCreditBalance ?? "0.00"} ${payments.currency}`}
                      variant="credit"
                    />
                  </div>
                ) : null}

                {/* Add Payment form */}
                {hasCreatePaymentPermission && invoice.status !== "CANCELLED" ? (
                  <section className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                    <h2 className="mb-4 text-sm font-bold text-[#0B2D5C]">
                      {dictionary.billing.addPayment}
                    </h2>
                    {isWriteBlocked ? (
                      <p className="mb-4 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
                        {restrictionMessage}
                      </p>
                    ) : null}
                    {invoice.status === "PAID" ||
                    (payments !== null &&
                      parseFloat(payments.balanceDue ?? "0") <= 0.001) ? (
                      <p className="rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                        {dictionary.billing.invoiceFullyPaid}
                      </p>
                    ) : (
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
                            disabled={isWriteBlocked}
                            inputMode="decimal"
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            type="text"
                            value={paymentAmount}
                          />
                          {paymentErrors.amount ? (
                            <p className="mt-1 text-xs text-red-600">{paymentErrors.amount}</p>
                          ) : payments &&
                            paymentAmount &&
                            !isNaN(parseFloat(paymentAmount)) &&
                            parseFloat(paymentAmount) > parseFloat(payments.balanceDue) + 0.001 ? (
                            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-medium text-amber-700">
                              <span>{dictionary.billing.overpaymentCreditHint}</span>
                              <span className="font-bold" dir="ltr">
                                (+
                                {(
                                  parseFloat(paymentAmount) - parseFloat(payments.balanceDue)
                                ).toFixed(2)}{" "}
                                {payments.currency})
                              </span>
                            </p>
                          ) : null}
                        </div>

                        {/* Method */}
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                            {dictionary.billing.paymentMethod}
                          </label>
                          <select
                            className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                            disabled={isWriteBlocked}
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
                            disabled={isWriteBlocked}
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
                            disabled={isWriteBlocked}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            type="text"
                            value={paymentNotes}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          className={buttonClassName("primary", "md")}
                          disabled={isAddingPayment || isWriteBlocked}
                          title={restrictionMessage || undefined}
                          type="submit"
                        >
                          {isAddingPayment ? dictionary.common.saving : dictionary.billing.addPayment}
                        </button>
                      </div>
                    </form>
                    )}
                  </section>
                ) : null}

                {/* Use Credit section is hidden only when both credit=0 and balance=0. */}
                {hasCreatePaymentPermission &&
                !isAddingPayment &&
                invoice.status !== "CANCELLED" &&
                (parseFloat(patientCredit ?? "0") > 0 ||
                  (payments !== null &&
                    parseFloat(payments.balanceDue ?? "0") > 0.001)) ? (
                  <section className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                    <h2 className="mb-1 text-sm font-bold text-indigo-900">
                      {dictionary.billing.useCredit}
                    </h2>
                    <p className="mb-4 text-xs text-indigo-700">
                      {dictionary.billing.creditBalance}:{" "}
                      <span className="font-bold">
                        {patientCredit ?? "0.00"}{" "}
                        {payments?.currency ?? invoice.currency}
                      </span>
                      {payments !== null &&
                      parseFloat(payments.balanceDue ?? "0") > 0.001 &&
                      parseFloat(payments.balanceDue) <
                        parseFloat(patientCredit ?? "0") ? (
                        <span className="ms-2 text-indigo-500">
                          · max {parseFloat(payments.balanceDue).toFixed(2)}
                        </span>
                      ) : null}
                    </p>
                    {payments === null ? null : parseFloat(
                        payments.balanceDue ?? "0",
                      ) <= 0.001 ? (
                      <p className="rounded-md bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-600">
                        {dictionary.billing.noCreditDue}
                      </p>
                    ) : parseFloat(patientCredit ?? "0") <= 0 ? (
                      <p className="rounded-md bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-600">
                        {dictionary.billing.noCreditAvailable}
                      </p>
                    ) : (
                      <form onSubmit={submitUseCredit} noValidate>
                        <div className="flex min-w-0 flex-wrap items-end gap-3">
                          <div className="min-w-0 flex-1">
                            <label className="mb-1 block text-xs font-semibold text-indigo-700">
                              {dictionary.billing.creditAmount}
                            </label>
                            <input
                              className={`min-h-10 w-full rounded-md border px-3 text-sm text-[#132238] ${
                                creditErrors.amount
                                  ? "border-red-400 bg-red-50"
                                  : "border-indigo-300 bg-white"
                              }`}
                              disabled={isWriteBlocked}
                              inputMode="decimal"
                              onChange={(e) => setCreditAmount(e.target.value)}
                              placeholder="0.00"
                              type="text"
                              value={creditAmount}
                            />
                            {creditErrors.amount ? (
                              <p className="mt-1 text-xs text-red-600">
                                {creditErrors.amount}
                              </p>
                            ) : null}
                          </div>
                          <button
                            className="shrink-0 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            disabled={isUsingCredit || isWriteBlocked}
                            title={restrictionMessage || undefined}
                            type="submit"
                          >
                            {isUsingCredit
                              ? dictionary.common.saving
                              : dictionary.billing.useCredit}
                          </button>
                        </div>
                      </form>
                    )}
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

                    {/* Credit usage history */}
                    {payments?.creditUsages && payments.creditUsages.length > 0 ? (
                      <div className="mt-5 min-w-0">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">
                          {dictionary.billing.creditUsageLabel}
                        </h3>
                        <div className="min-w-0 overflow-x-auto">
                          <table className="w-full min-w-[400px] border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-indigo-100">
                                <th className="pb-2 text-start text-xs font-semibold text-indigo-500">
                                  {dictionary.billing.amount}
                                </th>
                                <th className="pb-2 text-start text-xs font-semibold text-indigo-500">
                                  {dictionary.billing.paymentDate}
                                </th>
                                <th className="pb-2 text-start text-xs font-semibold text-indigo-500">
                                  {dictionary.billing.notes}
                                </th>
                                <th className="pb-2 text-start text-xs font-semibold text-indigo-500">
                                  {dictionary.billing.paymentBy}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(payments.creditUsages ?? []).map((c) => (
                                <tr
                                  className="border-b border-indigo-50 last:border-0"
                                  key={c.id}
                                >
                                  <td className="py-3 font-semibold text-indigo-700">
                                    {c.amount} {payments.currency}
                                  </td>
                                  <td className="py-3 text-[#66758a]">
                                    {formatDate(c.createdAt, locale)}
                                  </td>
                                  <td className="py-3 text-[#66758a]">{c.notes ?? "—"}</td>
                                  <td className="py-3 text-[#66758a]">{c.createdBy.fullName}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
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
  if (status === "CANCELLED") {
    return (
      <span className="rounded-full border border-red-600 bg-red-600 px-4 py-1.5 text-sm font-bold text-white">
        {label}
      </span>
    );
  }
  const cls =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : status === "PARTIAL"
        ? "bg-indigo-100 text-indigo-800 border-indigo-300"
        : "bg-amber-100 text-amber-800 border-amber-300";

  return (
    <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function DetailField({
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
      <p className="text-xs font-semibold text-[#66758a]">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold text-[#24364f]${strikethrough ? " line-through" : ""}`}>{value}</p>
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
  variant: "neutral" | "paid" | "due" | "settled" | "credit";
}) {
  const cls =
    variant === "paid"
      ? "bg-emerald-50 border-emerald-200"
      : variant === "due"
        ? "bg-amber-50 border-amber-200"
        : variant === "settled"
          ? "bg-emerald-50 border-emerald-200"
          : variant === "credit"
            ? "bg-indigo-50 border-indigo-200"
            : "bg-[#F8FAFC] border-[#E5E7EB]";

  const textCls =
    variant === "paid" || variant === "settled"
      ? "text-emerald-800"
      : variant === "due"
        ? "text-amber-800"
        : variant === "credit"
          ? "text-indigo-800"
          : "text-[#24364f]";

  return (
    <div className={`min-w-0 rounded-lg border p-4 ${cls}`}>
      <p className="text-xs font-semibold text-[#66758a]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${textCls}`}>{value}</p>
    </div>
  );
}
