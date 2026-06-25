"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  cancelTenantAppointment,
  getTenantAppointment,
  sendTenantAppointmentReminder,
  updateTenantAppointmentStatus,
  type AppointmentReminderResponse,
  type AppointmentStatus,
  type TenantAppointment,
} from "@/lib/api/tenant-appointments";
import {
  createTenantInvoiceFromAppointment,
  createTenantPayment,
  getTenantInvoiceForAppointment,
  listTenantPayments,
  applyTenantCredit,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentSummary,
  type TenantInvoice,
} from "@/lib/api/tenant-billing";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  hasBillingPermission,
  hasPaymentPermission,
} from "../billing/billing-permissions";
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
import {
  formatAppointmentTime,
  getAppointmentProviderName,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";
import { hasTenantAppointmentPermission } from "./appointment-permissions";

type ServiceFollowUpPhaseRule = {
  fromSessionNumber: number;
  toSessionNumber: number;
  intervalDays: number;
};

function parseServiceFollowUpRules(rules: unknown): ServiceFollowUpPhaseRule[] {
  if (!Array.isArray(rules)) return [];
  return rules.reduce<ServiceFollowUpPhaseRule[]>((acc, r) => {
    if (!r || typeof r !== "object") return acc;
    const obj = r as Record<string, unknown>;
    const from = Number(obj.fromSessionNumber);
    const to = Number(obj.toSessionNumber);
    const interval = Number(obj.intervalDays);
    if (Number.isInteger(from) && Number.isInteger(to) && Number.isInteger(interval) && from > 0 && to >= from && interval > 0) {
      acc.push({ fromSessionNumber: from, toSessionNumber: to, intervalDays: interval });
    }
    return acc;
  }, []).sort((a, b) => a.fromSessionNumber - b.fromSessionNumber);
}

const appointmentStatusKeys: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "CHECK", "OTHER"];

export function TenantAppointmentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;
  const { locale } = useLanguage();

  // Appointment state
  const [appointment, setAppointment] = useState<TenantAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Invoice state
  const [invoice, setInvoice] = useState<TenantInvoice | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceCreateError, setInvoiceCreateError] = useState<"noServicePrice" | null>(null);

  // Payment form state
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
  const [payNotes, setPayNotes] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [payAmountError, setPayAmountError] = useState("");

  // Credit form state
  const [creditAmount, setCreditAmount] = useState("");
  const [isUsingCredit, setIsUsingCredit] = useState(false);
  const [creditError, setCreditError] = useState("");

  // Reminder state
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<AppointmentReminderResponse | null>(null);

  // Load appointment
  useEffect(() => {
    let isMounted = true;
    getTenantAppointment(appointmentId)
      .then((response) => { if (isMounted) setAppointment(response); })
      .catch(() => { if (isMounted) setLoadError(true); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [appointmentId]);

  // Load invoice for this appointment
  useEffect(() => {
    let isMounted = true;
    getTenantInvoiceForAppointment(appointmentId)
      .then(async (found) => {
        if (!isMounted) return;
        setInvoice(found);
        if (found) {
          const summary = await listTenantPayments(found.id);
          if (isMounted) setPaymentSummary(summary);
        }
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setInvoiceLoading(false); });
    return () => { isMounted = false; };
  }, [appointmentId]);

  // The details endpoint resolves this from the appointment's persisted Prisma
  // relations, which is also the source used by appointment cards/actions.
  const followUpPlan = appointment?.followUpPlan ?? [];

  // Auto-dismiss notice
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const refreshInvoiceAndPayments = async (inv: TenantInvoice) => {
    const [updated, summary] = await Promise.all([
      getTenantInvoiceForAppointment(appointmentId),
      listTenantPayments(inv.id),
    ]);
    setInvoice(updated ?? inv);
    setPaymentSummary(summary);
  };

  return (
    <CenterAdminShell
      activeNav="appointments"
      subtitle={(dictionary) => dictionary.appointments.subtitle}
      title={(dictionary) => dictionary.appointments.detailsTitle}
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const hasUpdatePermission = hasTenantAppointmentPermission(session.permissions, "appointments:update");
        const hasCancelPermission = hasTenantAppointmentPermission(session.permissions, "appointments:cancel");
        const hasUpdateStatusPermission = hasTenantAppointmentPermission(session.permissions, "appointments:status");

        const canViewBilling = hasBillingPermission(session.permissions, "billing:view");
        const hasCreateInvoicePermission = hasBillingPermission(session.permissions, "billing:create");
        const hasAddPaymentPermission = hasPaymentPermission(session.permissions, "payments:create");
        const canUpdate = hasUpdatePermission && !isWriteBlocked;
        const canCancel = hasCancelPermission && !isWriteBlocked;
        const canUpdateStatus = hasUpdateStatusPermission && !isWriteBlocked;
        const canCreateInvoice = hasCreateInvoicePermission && !isWriteBlocked;
        const canAddPayment = hasAddPaymentPermission && !isWriteBlocked;

        const methodLabel = (m: PaymentMethod) => {
          if (m === "CASH") return dictionary.billing.methodCash;
          if (m === "BANK_TRANSFER") return dictionary.billing.methodBankTransfer;
          if (m === "CHECK") return dictionary.billing.methodCheck;
          return dictionary.billing.methodOther;
        };

        const changeStatus = async (status: AppointmentStatus) => {
          if (!appointment || !canUpdateStatus) {
            if (isWriteBlocked && restrictionMessage) {
              setNotice(restrictionMessage);
            }
            return;
          }
          setIsSaving(true);
          setNotice("");
          try {
            const updated = await updateTenantAppointmentStatus(appointment.id, status);
            setAppointment(updated);
            setNotice(dictionary.appointments.statusUpdated);
            if (status === "COMPLETED") {
              getTenantInvoiceForAppointment(appointment.id)
                .then(async (found) => {
                  setInvoice(found);
                  if (found) {
                    const summary = await listTenantPayments(found.id);
                    setPaymentSummary(summary);
                  }
                })
                .catch(() => {});
            }
          } finally {
            setIsSaving(false);
          }
        };

        const cancelAppointment = async () => {
          if (!appointment || !canCancel || !cancelReason.trim()) {
            if (isWriteBlocked && restrictionMessage) {
              setNotice(restrictionMessage);
            }
            return;
          }
          setIsSaving(true);
          setNotice("");
          try {
            const updated = await cancelTenantAppointment(appointment.id, cancelReason);
            setAppointment(updated);
            setNotice(dictionary.appointments.cancelled);
          } finally {
            setIsSaving(false);
          }
        };

        const reactivateAppointment = async () => {
          if (!appointment || !canUpdateStatus) return;
          console.log('[appointment:reactivate-click]', { appointmentId: appointment.id, currentStatus: appointment.status });
          const confirmed = window.confirm(dictionary.appointments.reactivateConfirm);
          if (!confirmed) return;
          setIsSaving(true);
          setNotice("");
          try {
            console.log('[appointment:reactivate-request]', { appointmentId: appointment.id, newStatus: 'CONFIRMED' });
            const updated = await updateTenantAppointmentStatus(appointment.id, "CONFIRMED");
            console.log('[appointment:reactivate-success]', { appointmentId: updated.id, newStatus: updated.status });
            setAppointment(updated);
            setNotice(dictionary.appointments.reactivated);
          } finally {
            setIsSaving(false);
          }
        };

        const createInvoice = async () => {
          if (!canCreateInvoice) {
            if (isWriteBlocked && restrictionMessage) {
              setNotice(restrictionMessage);
            }
            return;
          }

          setIsCreatingInvoice(true);
          setInvoiceCreateError(null);
          try {
            const created = await createTenantInvoiceFromAppointment(appointmentId);
            setInvoice(created);
            const summary = await listTenantPayments(created.id);
            setPaymentSummary(summary);
            setNotice(dictionary.appointments.invoiceCreated);
          } catch (err: unknown) {
            const apiErr = err as { details?: { errors?: { amount?: string } } };
            if (apiErr?.details?.errors?.amount) {
              setInvoiceCreateError("noServicePrice");
            }
          } finally {
            setIsCreatingInvoice(false);
          }
        };

        const submitPayment = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!invoice) return;
          setPayAmountError("");
          if (!canAddPayment) {
            if (isWriteBlocked && restrictionMessage) {
              setPayAmountError(restrictionMessage);
            }
            return;
          }
          const n = parseFloat(payAmount);
          if (!payAmount || isNaN(n) || n <= 0) {
            setPayAmountError(dictionary.billing.invalidAmount);
            return;
          }
          setIsAddingPayment(true);
          try {
            await createTenantPayment(invoice.id, {
              amount: payAmount,
              method: payMethod,
              notes: payNotes || null,
              paidAt: payDate || undefined,
            });
            await refreshInvoiceAndPayments(invoice);
            setPayAmount("");
            setPayNotes("");
            setNotice(dictionary.billing.paymentAdded);
          } catch (err: unknown) {
            const apiErr = err as { details?: { errors?: { invoice?: string; amount?: string } } };
            const apiMsg = apiErr?.details?.errors?.invoice || apiErr?.details?.errors?.amount;
            setPayAmountError(apiMsg || dictionary.billing.overpaymentError);
          } finally {
            setIsAddingPayment(false);
          }
        };

        const submitUseCredit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!invoice || !paymentSummary) return;
          setCreditError("");
          if (!canAddPayment) {
            if (isWriteBlocked && restrictionMessage) {
              setCreditError(restrictionMessage);
            }
            return;
          }
          const n = parseFloat(creditAmount);
          if (!creditAmount || isNaN(n) || n <= 0) {
            setCreditError(dictionary.billing.invalidAmount);
            return;
          }
          const maxApplicable = Math.min(
            parseFloat(paymentSummary.patientCreditBalance ?? "0"),
            parseFloat(paymentSummary.balanceDue),
          );
          if (n > maxApplicable + 0.001) {
            setCreditError(
              `${dictionary.billing.insufficientCredit} (max: ${maxApplicable.toFixed(2)})`,
            );
            return;
          }
          setIsUsingCredit(true);
          try {
            await applyTenantCredit(invoice.id, { amount: String(Math.min(n, maxApplicable).toFixed(2)) });
            await refreshInvoiceAndPayments(invoice);
            setCreditAmount("");
            setNotice(dictionary.billing.creditApplied);
          } catch (err: unknown) {
            const apiErr = err as { details?: { errors?: { amount?: string; invoice?: string } } };
            const msg =
              apiErr?.details?.errors?.amount ||
              apiErr?.details?.errors?.invoice;
            setCreditError(msg || dictionary.billing.insufficientCredit);
          } finally {
            setIsUsingCredit(false);
          }
        };

        return (
          <>
            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/appointments"
              >
                {dictionary.nav.appointments}
              </Link>
              {appointment && hasUpdatePermission ? (
                appointment.status === "CANCELLED" || !canUpdate ? (
                  <button
                    className={buttonClassName("secondary", "md")}
                    disabled
                    title={isWriteBlocked ? restrictionMessage : undefined}
                    type="button"
                  >
                    {dictionary.common.edit}
                  </button>
                ) : (
                  <Link
                    className={buttonClassName("secondary", "md")}
                    href={`/tenant/appointments/${appointment.id}/edit`}
                  >
                    {dictionary.common.edit}
                  </Link>
                )
              ) : null}
              {appointment?.status === "CANCELLED" && canUpdateStatus ? (
                <button
                  className={buttonClassName("primary", "md")}
                  disabled={isSaving}
                  onClick={reactivateAppointment}
                  type="button"
                >
                  {dictionary.appointments.reactivateAppointment}
                </button>
              ) : null}
            </div>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <AdminState
                className="mt-5"
                loading
                title={dictionary.appointments.loading}
              />
            ) : null}

            {loadError ? (
              <AdminState
                action={
                <button
                  className={buttonClassName("secondary", "md", "mt-4")}
                  onClick={() => router.push("/tenant/appointments")}
                  type="button"
                >
                  {dictionary.nav.appointments}
                </button>
                }
                className="mt-5"
                title={dictionary.appointments.notFound}
                tone="error"
              />
            ) : null}

            {appointment && !isLoading ? (
              <section className={`mt-5 rounded-lg border p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)] ${
                appointment.status === "CANCELLED"
                  ? "border-gray-300 bg-gray-100"
                  : appointment.status === "COMPLETED"
                    ? "border-emerald-200 bg-emerald-50"
                    : appointment.status === "NO_SHOW"
                      ? "border-rose-200 bg-rose-50"
                      : "border-[#E5E7EB] bg-white"
              }`}>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className={`break-words text-xl font-semibold text-[#0B2D5C]${appointment.status === "CANCELLED" ? " line-through" : ""}`}>
                      {appointment.patient.fullName}
                    </h2>
                    <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                      {formatDate(appointment.appointmentDate, locale)} ·{" "}
                      {formatAppointmentTime(appointment)}
                    </p>
                  </div>
                  <AppointmentStatusBadge
                    label={dictionary.appointmentStatuses[appointment.status]}
                    status={appointment.status}
                  />
                </div>

                {appointment.bookingSource ? (
                  <section className="mt-5 rounded-lg border border-[#C8A45D]/35 bg-[#FFFBF0] p-4">
                    <h3 className="text-sm font-bold text-[#0B2D5C]">
                      {dictionary.appointments.bookingRequestDetails}
                    </h3>
                    <dl className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
                      <Detail
                        label={dictionary.appointments.bookingRequester}
                        value={appointment.bookingSource.fullName}
                      />
                      <Detail
                        label={dictionary.appointments.bookingRequesterPhone}
                        value={appointment.bookingSource.phone}
                      />
                      <Detail
                        label={dictionary.appointments.bookingRequestNotes}
                        value={
                          appointment.bookingSource.notes ||
                          dictionary.common.notAvailable
                        }
                      />
                    </dl>
                  </section>
                ) : null}

                <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Detail
                    label={dictionary.appointments.patient}
                    value={appointment.patient.fullName}
                  />
                  <Detail
                    label={dictionary.patients.phone}
                    value={appointment.patient.phone}
                  />
                  <Detail
                    label={dictionary.appointments.service}
                    strikethrough={appointment.status === "CANCELLED"}
                    value={getLocalizedAppointmentServiceName(
                      appointment.service,
                      locale,
                      appointment.offerTitle,
                      appointment.customServiceName,
                    )}
                  />
                  {appointment.customServiceName ? (
                    <Detail
                      label={dictionary.appointments.customServiceBadge}
                      value={dictionary.appointments.customServiceBadge}
                    />
                  ) : null}
                  <Detail
                    label={dictionary.appointments.provider}
                    value={
                      getAppointmentProviderName(appointment.staffUser) ||
                      dictionary.common.notAvailable
                    }
                  />
                  <Detail
                    label={dictionary.appointments.durationMinutes}
                    value={appointment.durationMinutes.toString()}
                  />
                  <Detail
                    label={dictionary.appointments.createdBy}
                    value={
                      getAppointmentProviderName(appointment.createdByUser) ||
                      dictionary.common.notAvailable
                    }
                  />
                  <Detail
                    label={dictionary.appointments.createdAt}
                    value={formatDate(appointment.createdAt, locale)}
                  />
                  <Detail
                    label={dictionary.appointments.updatedAt}
                    value={formatDate(appointment.updatedAt, locale)}
                  />
                  <Detail
                    label={dictionary.appointments.reminderSent}
                    value={
                      appointment.reminderSent
                        ? dictionary.common.activate
                        : dictionary.common.notAvailable
                    }
                  />
                </dl>

                <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
                  <TextBlock
                    helper={dictionary.appointments.notesHelper}
                    label={dictionary.appointments.notes}
                    value={appointment.notes || dictionary.common.notAvailable}
                  />
                  <TextBlock
                    helper={dictionary.appointments.internalNotesHelper}
                    label={dictionary.appointments.internalNotes}
                    value={
                      appointment.internalNotes ||
                      dictionary.common.notAvailable
                    }
                  />
                  {appointment.cancellationReason ? (
                    <TextBlock
                      label={dictionary.appointments.cancellationReason}
                      value={appointment.cancellationReason}
                    />
                  ) : null}
                </div>

                <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_auto] md:items-end">
                  {hasUpdateStatusPermission ? (
                    <label className="block min-w-0">
                      <span className="text-sm font-semibold text-[#24364f]">
                        {dictionary.appointments.changeStatus}
                      </span>
                      <select
                        className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                        disabled={
                          isSaving ||
                          appointment.status === "CANCELLED" ||
                          !canUpdateStatus
                        }
                        onChange={(event) =>
                          changeStatus(event.target.value as AppointmentStatus)
                        }
                        title={isWriteBlocked ? restrictionMessage : undefined}
                        value={appointment.status}
                      >
                        {appointmentStatusKeys.map((status) => (
                          <option key={status} value={status}>
                            {dictionary.appointmentStatuses[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {hasCancelPermission && appointment.status !== "CANCELLED" ? (
                    <>
                      <label className="block min-w-0">
                        <span className="text-sm font-semibold text-[#24364f]">
                          {dictionary.appointments.cancellationReason}
                        </span>
                        <input
                          className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                          disabled={!canCancel}
                          onChange={(event) =>
                            setCancelReason(event.target.value)
                          }
                          title={isWriteBlocked ? restrictionMessage : undefined}
                          value={cancelReason}
                        />
                      </label>
                      <button
                        className={buttonClassName("warning", "md")}
                        disabled={isSaving || !canCancel || !cancelReason.trim()}
                        onClick={cancelAppointment}
                        title={isWriteBlocked ? restrictionMessage : undefined}
                        type="button"
                      >
                        {dictionary.appointments.cancelAppointment}
                      </button>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* ── Follow-up Plan section ── */}
            {appointment && !isLoading ? (
              <section className="mt-6 rounded-lg border border-[#E1E7EF] bg-white p-5">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-bold text-[#0B2D5C]">
                    {dictionary.appointments.followUpPlanSection}
                  </h3>
                  <Link
                    className={buttonClassName("secondary", "sm")}
                    href={`/tenant/follow-ups?patientId=${appointment.patientId}`}
                  >
                    {dictionary.appointments.viewInFollowUps}
                  </Link>
                </div>

                {!appointment.hasFollowUpPlan || !appointment.followUpPlanSummary ? (
                  <p className="mt-4 text-sm text-[#66758a]">
                    {dictionary.appointments.followUpPlanNoRecord}
                  </p>
                ) : appointment.followUpPlanSummary.type === "RECURRING_CONTINUOUS" ? (
                  /* ── Recurring follow-up view ── */
                  (() => {
                    const activeRecurring = followUpPlan.find(
                      (f) => f.isRecurring && !["COMPLETED", "CANCELLED"].includes(f.status),
                    );
                    const completedItems = followUpPlan.filter((f) => f.status === "COMPLETED");
                    const lastCompleted = completedItems.length > 0 ? completedItems[completedItems.length - 1] : null;
                    const intervalValue =
                      appointment.followUpPlanSummary?.recurringIntervalValue ??
                      activeRecurring?.recurringIntervalValue ??
                      appointment.service?.recurringIntervalValue;
                    const intervalUnit =
                      appointment.followUpPlanSummary?.recurringIntervalUnit ??
                      activeRecurring?.recurringIntervalUnit ??
                      appointment.service?.recurringIntervalUnit;

                    const unitText = (n: number, unit: string | null | undefined) => {
                      if (unit === "DAY") return dictionary.appointments.followUpIntervalDay(n);
                      if (unit === "WEEK") return dictionary.appointments.followUpIntervalWeek(n);
                      if (unit === "MONTH") return dictionary.appointments.followUpIntervalMonth(n);
                      if (unit === "YEAR") return dictionary.appointments.followUpIntervalYear(n);
                      return "";
                    };

                    return (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full border border-[#C7D2FE] bg-[#EEF0FF] px-2.5 py-0.5 text-xs font-bold text-[#3730A3]">
                            {dictionary.appointments.followUpRecurringBadge}
                          </span>
                          {intervalValue && intervalUnit ? (
                            <span className="text-sm font-semibold text-[#24364f]">
                              {dictionary.appointments.followUpEvery} {intervalValue} {unitText(intervalValue, intervalUnit)}
                            </span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {activeRecurring ? (
                            <div className="rounded-md bg-[#F8FAFC] p-3">
                              <p className="text-xs font-semibold text-[#66758a]">
                                {dictionary.appointments.followUpNextDue}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#0B2D5C]">
                                {formatDate(activeRecurring.dueDate, locale)}
                              </p>
                              <FollowUpStatusBadge locale={locale} status={activeRecurring.status} />
                            </div>
                          ) : null}
                          {lastCompleted ? (
                            <div className="rounded-md bg-[#F8FAFC] p-3">
                              <p className="text-xs font-semibold text-[#66758a]">
                                {dictionary.appointments.followUpLastCompleted}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#24364f]">
                                {formatDate(lastCompleted.dueDate, locale)}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()
                ) : followUpPlan.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-dashed border-[#D8DEE8] bg-[#F8FAFC] p-4">
                    <p className="text-sm text-[#66758a]">{dictionary.appointments.followUpPlanNoRecord}</p>
                  </div>
                ) : (
                  /* ── SESSION_BASED_PLAN session timeline ── */
                  (() => {
                    const sorted = [...followUpPlan].sort((a, b) => {
                      if (a.sessionNumber !== null && b.sessionNumber !== null) return a.sessionNumber - b.sessionNumber;
                      return a.dueDate.localeCompare(b.dueDate);
                    });
                    // Use stored plan phases from the first row when available (most accurate),
                    // then fall back to the appointment's template snapshot, then to service rules.
                    const firstPlanPhases = sorted[0]?.planPhases ?? null;
                    const hasTemplateSnapshot = appointment.treatmentTemplateId !== null;
                    const phaseSource =
                      firstPlanPhases ??
                      (hasTemplateSnapshot
                        ? appointment.treatmentTemplatePhases
                        : appointment.service?.followUpRules);
                    const rules = parseServiceFollowUpRules(phaseSource);

                    // Detect next actionable session
                    const today = new Date().toISOString().slice(0, 10);
                    const actionable = sorted.filter(s => !["COMPLETED", "CANCELLED", "BOOKED"].includes(s.status));
                    const nextId = (actionable.find(s => (s.dueDate.slice(0, 10)) >= today) ?? actionable[0])?.id ?? null;

                    // Relative time label + card color per session
                    const getRelative = (dueDate: string) => {
                      const due = dueDate.slice(0, 10);
                      if (due === today) return { label: dictionary.appointments.followUpRelativeToday, cls: "text-[#854D0E] font-bold" };
                      const diff = Math.round((new Date(due + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / 86400000);
                      if (diff < 0) return { label: dictionary.appointments.followUpRelativeOverdue(Math.abs(diff)), cls: "text-[#B42318] font-semibold" };
                      return { label: dictionary.appointments.followUpRelativeRemaining(diff), cls: "text-[#3B82F6] font-semibold" };
                    };

                    const cardBorder = (status: string, isNext: boolean) => {
                      if (isNext) return "border-[#3B82F6] bg-[#EFF6FF]";
                      switch (status) {
                        case "COMPLETED": return "border-[#BBF7D0] bg-[#F0FDF4]";
                        case "BOOKED":    return "border-[#DDD6FE] bg-[#F5F3FF]";
                        case "CONTACTED": return "border-[#BAE6FD] bg-[#F0F9FF]";
                        case "DUE":       return "border-[#FECACA] bg-[#FEF2F2]";
                        case "MISSED":    return "border-[#E5E7EB] bg-[#F9FAFB] opacity-60";
                        case "CANCELLED": return "border-[#E5E7EB] bg-[#F9FAFB] opacity-40";
                        default:          return "border-[#E8ECF2] bg-[#F8FAFC]";
                      }
                    };

                    const renderRow = (item: typeof sorted[0]) => {
                      const isNext = item.id === nextId;
                      const { label: relLabel, cls: relCls } = getRelative(item.dueDate);
                      return (
                        <div
                          className={`flex min-w-0 flex-col gap-1.5 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 ${cardBorder(item.status, isNext)}`}
                          key={item.id}
                        >
                          {/* Session number + next badge */}
                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-24">
                            <span className="text-xs font-black text-[#0B2D5C]">
                              {item.sessionNumber != null ? dictionary.appointments.followUpSession(item.sessionNumber) : "—"}
                            </span>
                            {isNext ? (
                              <span className="rounded-full bg-[#3B82F6] px-2 py-0.5 text-[10px] font-black text-white">
                                {dictionary.appointments.followUpNextSessionBadge}
                              </span>
                            ) : null}
                          </div>
                          {/* Date */}
                          <span className="min-w-[90px] text-sm text-[#66758a]" dir="ltr">
                            {formatDate(item.dueDate, locale)}
                          </span>
                          {/* Relative time */}
                          <span className={`text-xs ${relCls}`}>{relLabel}</span>
                          {/* Status badge */}
                          <FollowUpStatusBadge locale={locale} status={item.status} />
                        </div>
                      );
                    };

                    const ungrouped = sorted.filter(s => s.sessionNumber === null || !rules.some(r => s.sessionNumber! >= r.fromSessionNumber && s.sessionNumber! <= r.toSessionNumber));

                    if (rules.length === 0) {
                      return <div className="mt-4 space-y-1.5">{sorted.map(renderRow)}</div>;
                    }

                    return (
                      <div className="mt-4 space-y-4">
                        {rules.map((rule, i) => {
                          const group = sorted.filter(s => s.sessionNumber !== null && s.sessionNumber >= rule.fromSessionNumber && s.sessionNumber <= rule.toSessionNumber);
                          if (group.length === 0) return null;
                          return (
                            <div key={i}>
                              <div className="mb-2 rounded-md bg-[#EEF4FF] px-3 py-2">
                                <p className="text-xs font-black text-[#0B2D5C]">
                                  {dictionary.appointments.followUpPhaseTitle(i + 1)}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#66758a]">
                                  {dictionary.appointments.followUpPhaseSubtitle(rule.fromSessionNumber, rule.toSessionNumber, rule.intervalDays)}
                                </p>
                              </div>
                              <div className="space-y-1.5">{group.map(renderRow)}</div>
                            </div>
                          );
                        })}
                        {ungrouped.length > 0 ? <div className="space-y-1.5">{ungrouped.map(renderRow)}</div> : null}
                      </div>
                    );
                  })()
                )}
              </section>
            ) : null}

            {/* ── Reminder section ── */}
            {appointment && !isLoading && hasTenantAppointmentPermission(session.permissions, "appointments:update") ? (
              <section className="mt-6 rounded-lg border border-[#D8DEE8] bg-white p-5">
                <h3 className="text-sm font-bold text-[#0B2D5C]">
                  {dictionary.appointments.reminderMessagesSection}
                </h3>

                <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-[#F8FAFC] p-3">
                    <dt className="text-xs font-semibold text-[#66758a]">
                      {dictionary.appointments.lastReminderSent}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#24364f]">
                      {appointment.lastReminderSentAt
                        ? formatDate(appointment.lastReminderSentAt, locale)
                        : dictionary.appointments.reminderNotSentYet}
                    </dd>
                  </div>
                  <div className="rounded-md bg-[#F8FAFC] p-3">
                    <dt className="text-xs font-semibold text-[#66758a]">
                      {dictionary.appointments.reminderCountLabel}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#24364f]">
                      {appointment.reminderCount}
                    </dd>
                  </div>
                  <div className="rounded-md bg-[#F8FAFC] p-3">
                    <dt className="text-xs font-semibold text-[#66758a]">
                      {dictionary.appointments.reminderSent}
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {appointment.reminder24hSent ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {dictionary.appointments.reminder24hSentLabel}
                        </span>
                      ) : null}
                      {appointment.reminder2hSent ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {dictionary.appointments.reminder2hSentLabel}
                        </span>
                      ) : null}
                      {!appointment.reminder24hSent && !appointment.reminder2hSent ? (
                        <span className="text-sm font-semibold text-[#24364f]">
                          {dictionary.appointments.reminderNotSentYet}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>

                {appointment.status !== "CANCELLED" &&
                appointment.status !== "COMPLETED" &&
                appointment.status !== "NO_SHOW" ? (
                  <div className="mt-5">
                    {reminderResult ? (
                      <div className="rounded-xl border border-[#25D366]/30 bg-[#F0FDF4] p-4">
                        <p className="text-sm font-semibold text-emerald-800">
                          {dictionary.appointments.reminderSentSuccess}
                        </p>
                        <p className="mt-1 text-xs text-emerald-600" dir="ltr">
                          {reminderResult.whatsApp.phone}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 rtl:flex-row-reverse">
                          <a
                            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,211,102,0.30)] transition-all hover:bg-[#1DA851] hover:shadow-[0_4px_18px_rgba(37,211,102,0.40)] rtl:flex-row-reverse"
                            href={reminderResult.whatsApp.waLink}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <WhatsAppIcon />
                            {dictionary.appointments.openWhatsApp}
                          </a>
                          <button
                            className={buttonClassName("secondary", "sm")}
                            onClick={() => {
                              void navigator.clipboard.writeText(reminderResult.whatsApp.message);
                            }}
                            type="button"
                          >
                            {dictionary.appointments.copyMessage}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,211,102,0.30)] transition-all duration-150 hover:bg-[#1DA851] hover:shadow-[0_4px_18px_rgba(37,211,102,0.40)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none rtl:flex-row-reverse sm:w-auto"
                          disabled={isSendingReminder || isWriteBlocked}
                          onClick={async () => {
                            setIsSendingReminder(true);
                            try {
                              const result = await sendTenantAppointmentReminder(appointment.id, locale);
                              setReminderResult(result);
                              if (result.appointment) {
                                setAppointment((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        reminderSent: result.appointment!.reminderSent,
                                        lastReminderSentAt: result.appointment!.lastReminderSentAt,
                                        reminderCount: result.appointment!.reminderCount,
                                        reminder24hSent: result.appointment!.reminder24hSent,
                                        reminder2hSent: result.appointment!.reminder2hSent,
                                      }
                                    : prev,
                                );
                              }
                            } catch {
                              // silent — user can retry
                            } finally {
                              setIsSendingReminder(false);
                            }
                          }}
                          title={isWriteBlocked ? restrictionMessage : undefined}
                          type="button"
                        >
                          {isSendingReminder ? (
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                fill="currentColor"
                              />
                            </svg>
                          ) : (
                            <WhatsAppIcon />
                          )}
                          {isSendingReminder
                            ? dictionary.appointments.reminderSending
                            : dictionary.appointments.sendReminderNow}
                        </button>
                        <p className="mt-2 text-xs text-[#66758a]">
                          {dictionary.appointments.reminderHelperText}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* ── Invoice section ── */}
            {canViewBilling && appointment && !isLoading ? (
              <>
                {/* Section header */}
                <div className="mt-8 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-bold text-[#0B2D5C]">
                    {dictionary.appointments.invoiceSection}
                  </h2>
                  {invoice ? (
                    <div className="flex min-w-0 flex-wrap items-start gap-3">
                      <div className="min-w-0">
                        <InvoiceStatusBadge
                          label={dictionary.billingStatuses[invoice.status as keyof typeof dictionary.billingStatuses]}
                          status={invoice.status}
                        />
                        <InvoiceStatusDescription
                          description={getInvoiceStatusDescription(invoice.status, dictionary)}
                        />
                      </div>
                      <Link
                        className={buttonClassName("secondary", "sm")}
                        href={`/tenant/billing/${invoice.id}`}
                      >
                        {dictionary.appointments.openInvoice}
                      </Link>
                    </div>
                  ) : null}
                </div>

                {/* Loading invoice */}
                {invoiceLoading ? (
                  <p className="mt-3 text-sm text-[#66758a]">
                    {dictionary.billing.loading}
                  </p>
                ) : null}

                {/* No invoice yet */}
                {!invoiceLoading && !invoice ? (
                  <div className="mt-3 rounded-lg border border-dashed border-[#D8DEE8] bg-[#F8FAFC] p-5">
                    <p className="text-sm font-semibold text-[#24364f]">
                      {dictionary.appointments.noInvoice}
                    </p>
                    <p className="mt-1 text-sm text-[#66758a]">
                      {dictionary.appointments.noInvoiceBody}
                    </p>
                    {invoiceCreateError === "noServicePrice" ? (
                      <p className="mt-3 text-sm font-medium text-amber-700">
                        {dictionary.appointments.noServicePrice}
                      </p>
                    ) : appointment.status === "CANCELLED" ? (
                      <p className="mt-3 text-sm font-medium text-red-600">
                        {dictionary.appointments.invoiceBlockedCancelled}
                      </p>
                    ) : appointment.status !== "COMPLETED" ? (
                      <p className="mt-3 text-sm text-[#66758a]">
                        {dictionary.appointments.invoiceRequiresCompleted}
                      </p>
                    ) : hasCreateInvoicePermission ? (
                      <button
                        className={buttonClassName("primary", "md", "mt-4")}
                        disabled={isCreatingInvoice || !canCreateInvoice}
                        onClick={createInvoice}
                        title={isWriteBlocked ? restrictionMessage : undefined}
                        type="button"
                      >
                        {isCreatingInvoice
                          ? dictionary.common.saving
                          : dictionary.appointments.createInvoice}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {/* Invoice exists */}
                {!invoiceLoading && invoice && paymentSummary ? (
                  <>
                    {/* Financial summary */}
                    {(() => {
                      const hasCredit = parseFloat(paymentSummary.patientCreditBalance ?? "0") > 0;
                      const gridCls = hasCredit
                        ? "mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                        : "mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3";
                      return (
                        <div className={gridCls}>
                          <SummaryCard
                            label={dictionary.billing.invoiceTotal}
                            value={`${paymentSummary.invoiceTotal} ${paymentSummary.currency}`}
                            variant="neutral"
                            description={dictionary.billing.invoiceTotalDesc}
                          />
                          <SummaryCard
                            label={dictionary.billing.paidAmount}
                            value={`${paymentSummary.paidAmount} ${paymentSummary.currency}`}
                            variant={
                              parseFloat(paymentSummary.paidAmount) >= parseFloat(paymentSummary.invoiceTotal)
                                ? "settled"
                                : "paid"
                            }
                            description={dictionary.billing.paidAmountDesc}
                          />
                          <SummaryCard
                            label={dictionary.billing.balanceDue}
                            value={`${paymentSummary.balanceDue} ${paymentSummary.currency}`}
                            variant={parseFloat(paymentSummary.balanceDue) <= 0 ? "settled" : "due"}
                            description={dictionary.billing.balanceDueDesc}
                            tooltip={dictionary.billing.balanceDueTooltip}
                          />
                          {hasCredit ? (
                            <SummaryCard
                              label={dictionary.billing.creditBalance}
                              value={`${paymentSummary.patientCreditBalance} ${paymentSummary.currency}`}
                              variant="credit"
                              description={dictionary.billing.creditBalanceDesc}
                            />
                          ) : null}
                        </div>
                      );
                    })()}

                    {/* Paid notice */}
                    {invoice.status === "PAID" ? (
                      <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        {dictionary.appointments.invoiceFullyPaid}
                      </p>
                    ) : null}

                    {/* Add Payment form */}
                    {hasAddPaymentPermission &&
                    invoice.status !== "PAID" &&
                    invoice.status !== "CANCELLED" ? (
                      <section className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                        <h3 className="mb-4 text-sm font-bold text-[#0B2D5C]">
                          {dictionary.billing.addPayment}
                        </h3>
                        <form noValidate onSubmit={submitPayment}>
                          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.amount}
                              </label>
                              <input
                                className={`min-h-10 w-full rounded-md border px-3 text-sm text-[#132238] ${
                                  payAmountError
                                    ? "border-red-400 bg-red-50"
                                    : "border-[#D8DEE8]"
                                }`}
                                inputMode="decimal"
                                disabled={!canAddPayment}
                                onChange={(e) => {
                                  setPayAmount(e.target.value);
                                  setPayAmountError("");
                                }}
                                placeholder="0.00"
                                type="text"
                                value={payAmount}
                              />
                              {payAmountError ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {payAmountError}
                                </p>
                              ) : payAmount &&
                                !isNaN(parseFloat(payAmount)) &&
                                parseFloat(payAmount) >
                                  parseFloat(paymentSummary.balanceDue) + 0.001 ? (
                                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-medium text-amber-700">
                                  <span>{dictionary.billing.overpaymentCreditHint}</span>
                                  <span className="font-bold" dir="ltr">
                                    (+
                                    {(
                                      parseFloat(payAmount) -
                                      parseFloat(paymentSummary.balanceDue)
                                    ).toFixed(2)}{" "}
                                    {paymentSummary.currency})
                                  </span>
                                </p>
                              ) : null}
                            </div>

                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.paymentMethod}
                              </label>
                              <select
                                className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                disabled={!canAddPayment}
                                onChange={(e) =>
                                  setPayMethod(e.target.value as PaymentMethod)
                                }
                                value={payMethod}
                              >
                                {PAYMENT_METHODS.map((m) => (
                                  <option key={m} value={m}>
                                    {methodLabel(m)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.paymentDate}
                              </label>
                              <input
                                className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                disabled={!canAddPayment}
                                onChange={(e) => setPayDate(e.target.value)}
                                type="date"
                                value={payDate}
                              />
                            </div>

                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold text-[#66758a]">
                                {dictionary.billing.paymentNotes}{" "}
                                <span className="font-normal text-[#a0aec0]">
                                  ({dictionary.billing.paymentNotesOptional})
                                </span>
                              </label>
                              <input
                                className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                disabled={!canAddPayment}
                                onChange={(e) => setPayNotes(e.target.value)}
                                type="text"
                                value={payNotes}
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button
                              className={buttonClassName("primary", "md")}
                              disabled={isAddingPayment || !canAddPayment}
                              title={isWriteBlocked ? restrictionMessage : undefined}
                              type="submit"
                            >
                              {isAddingPayment
                                ? dictionary.common.saving
                                : dictionary.billing.addPayment}
                            </button>
                          </div>
                        </form>
                      </section>
                    ) : null}

                    {/* Use Credit section */}
                    {hasAddPaymentPermission &&
                    !isAddingPayment &&
                    (invoice.status === "PENDING" || invoice.status === "PARTIAL") &&
                    parseFloat(paymentSummary.patientCreditBalance ?? "0") > 0 ? (
                      <section className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                        <h3 className="mb-1 text-sm font-bold text-indigo-900">
                          {dictionary.billing.useCredit}
                        </h3>
                        <p className="mb-4 text-xs text-indigo-700">
                          {dictionary.billing.creditBalance}:{" "}
                          <span className="font-bold">
                            {paymentSummary.patientCreditBalance}{" "}
                            {paymentSummary.currency}
                          </span>
                          {parseFloat(paymentSummary.balanceDue) <
                          parseFloat(paymentSummary.patientCreditBalance ?? "0") ? (
                            <span className="ms-2 text-indigo-500">
                              · max {parseFloat(paymentSummary.balanceDue).toFixed(2)}
                            </span>
                          ) : null}
                        </p>
                        <form noValidate onSubmit={submitUseCredit}>
                          <div className="flex min-w-0 flex-wrap items-end gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <label className="text-xs font-semibold text-indigo-700">
                                  {dictionary.billing.creditAmount}
                                </label>
                                <button
                                  className="text-xs font-semibold text-indigo-600 hover:underline"
                                  disabled={!canAddPayment}
                                  onClick={() => {
                                    const max = Math.min(
                                      parseFloat(paymentSummary.patientCreditBalance ?? "0"),
                                      parseFloat(paymentSummary.balanceDue),
                                    );
                                    setCreditAmount(max.toFixed(2));
                                    setCreditError("");
                                  }}
                                  type="button"
                                >
                                  max: {Math.min(
                                    parseFloat(paymentSummary.patientCreditBalance ?? "0"),
                                    parseFloat(paymentSummary.balanceDue),
                                  ).toFixed(2)}
                                </button>
                              </div>
                              <input
                                className={`min-h-10 w-full rounded-md border px-3 text-sm text-[#132238] ${
                                  creditError
                                    ? "border-red-400 bg-red-50"
                                    : "border-indigo-300 bg-white"
                                }`}
                                inputMode="decimal"
                                disabled={!canAddPayment}
                                onChange={(e) => {
                                  setCreditAmount(e.target.value);
                                  setCreditError("");
                                }}
                                placeholder="0.00"
                                type="text"
                                value={creditAmount}
                              />
                              {creditError ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {creditError}
                                </p>
                              ) : null}
                            </div>
                            <button
                              className="shrink-0 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                              disabled={isUsingCredit || !canAddPayment}
                              title={isWriteBlocked ? restrictionMessage : undefined}
                              type="submit"
                            >
                              {isUsingCredit
                                ? dictionary.common.saving
                                : dictionary.billing.useCredit}
                            </button>
                          </div>
                        </form>
                      </section>
                    ) : null}

                    {/* Payment history */}
                    {(paymentSummary.payments.length > 0 ||
                      paymentSummary.creditUsages.length > 0) ? (
                      <section className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                        <h3 className="mb-4 text-sm font-bold text-[#0B2D5C]">
                          {dictionary.billing.paymentHistory}
                        </h3>

                        {paymentSummary.payments.length > 0 ? (
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
                                {paymentSummary.payments.map((p) => (
                                  <tr
                                    className="border-b border-[#F3F4F6] last:border-0"
                                    key={p.id}
                                  >
                                    <td className="py-3 font-semibold text-[#24364f]">
                                      {p.amount} {p.currency}
                                    </td>
                                    <td className="py-3 text-[#24364f]">
                                      {methodLabel(p.method)}
                                    </td>
                                    <td className="py-3 text-[#66758a]">
                                      {formatDate(p.paidAt, locale)}
                                    </td>
                                    <td className="py-3 text-[#66758a]">
                                      {p.notes ?? "—"}
                                    </td>
                                    <td className="py-3 text-[#66758a]">
                                      {p.createdBy.fullName}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-[#66758a]">
                            {dictionary.billing.noPayments}
                          </p>
                        )}

                        {paymentSummary.creditUsages.length > 0 ? (
                          <div className="mt-5 min-w-0">
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">
                              {dictionary.billing.creditUsageLabel}
                            </h4>
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
                                  {paymentSummary.creditUsages.map((c) => (
                                    <tr
                                      className="border-b border-indigo-50 last:border-0"
                                      key={c.id}
                                    >
                                      <td className="py-3 font-semibold text-indigo-700">
                                        {c.amount} {paymentSummary.currency}
                                      </td>
                                      <td className="py-3 text-[#66758a]">
                                        {formatDate(c.createdAt, locale)}
                                      </td>
                                      <td className="py-3 text-[#66758a]">
                                        {c.notes ?? "—"}
                                      </td>
                                      <td className="py-3 text-[#66758a]">
                                        {c.createdBy.fullName}
                                      </td>
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
            ) : null}
          </>
        );
      }}
    </CenterAdminShell>
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

function TextBlock({
  helper,
  label,
  value,
}: {
  helper?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-4">
      <h3 className="text-sm font-semibold text-[#24364f]">{label}</h3>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-[#66758a]">{helper}</p>
      ) : null}
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#66758a]">
        {value}
      </p>
    </div>
  );
}

function getInvoiceStatusDescription(
  status: InvoiceStatus,
  dictionary: {
    billing: {
      statusPaidDesc: string;
      statusPartialDesc: string;
      statusPendingDesc: string;
    };
  },
) {
  if (status === "PAID") return dictionary.billing.statusPaidDesc;
  if (status === "PARTIAL") return dictionary.billing.statusPartialDesc;
  if (status === "PENDING") return dictionary.billing.statusPendingDesc;
  return "";
}

function InvoiceStatusDescription({ description }: { description: string }) {
  if (!description) return null;
  return (
    <p className="mt-1 max-w-md text-xs leading-5 text-[#66758a]">
      {description}
    </p>
  );
}

function InvoiceStatusBadge({
  status,
  label,
}: {
  status: InvoiceStatus;
  label: string;
}) {
  if (status === "CANCELLED") {
    return (
      <span className="rounded-full border border-red-600 bg-red-600 px-3 py-1 text-xs font-bold text-white">
        {label}
      </span>
    );
  }
  const cls =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "PARTIAL"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function AppointmentStatusBadge({
  status,
  label,
}: {
  status: AppointmentStatus;
  label: string;
}) {
  const cls: Record<AppointmentStatus, string> = {
    SCHEDULED: "bg-slate-100 text-slate-700",
    CONFIRMED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-600 text-white font-bold",
    NO_SHOW: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${cls[status] ?? cls.SCHEDULED}`}>
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  variant,
  description,
  tooltip,
}: {
  label: string;
  value: string;
  variant: "neutral" | "paid" | "due" | "settled" | "credit";
  description?: string;
  tooltip?: string;
}) {
  const cls =
    variant === "paid"    ? "bg-emerald-50 border-emerald-200" :
    variant === "due"     ? "bg-amber-50 border-amber-200" :
    variant === "settled" ? "bg-emerald-50 border-emerald-200" :
    variant === "credit"  ? "bg-indigo-50 border-indigo-200" :
                            "bg-[#F8FAFC] border-[#E5E7EB]";

  const textCls =
    variant === "paid" || variant === "settled" ? "text-emerald-800" :
    variant === "due"                           ? "text-amber-800" :
    variant === "credit"                        ? "text-indigo-700" :
                                                  "text-[#24364f]";

  const labelCls =
    variant === "credit" ? "text-indigo-500" : "text-[#66758a]";

  return (
    <div className={`min-w-0 rounded-lg border p-4 ${cls}`} title={tooltip}>
      <p className={`text-xs font-semibold ${labelCls}`}>{label}</p>
      <p className={`mt-1 text-lg font-bold leading-tight ${textCls}`}>{value}</p>
      {description ? (
        <p className="mt-1.5 text-[11px] leading-snug text-[#8B98AA]">{description}</p>
      ) : null}
    </div>
  );
}

function FollowUpStatusBadge({ status, locale }: { status: string; locale: string }) {
  const labels: Record<string, Record<string, string>> = {
    en: { DUE: "Due", UPCOMING: "Upcoming", CONTACTED: "Contacted", BOOKED: "Booked", COMPLETED: "Completed", MISSED: "Missed", CANCELLED: "Cancelled" },
    ar: { DUE: "مستحقة", UPCOMING: "قادمة", CONTACTED: "تم التواصل", BOOKED: "محجوزة", COMPLETED: "مكتملة", MISSED: "فائتة", CANCELLED: "ملغاة" },
    he: { DUE: "לפירעון", UPCOMING: "קרוב", CONTACTED: "נוצר קשר", BOOKED: "נקבע", COMPLETED: "הושלם", MISSED: "פוספס", CANCELLED: "בוטל" },
  };
  const cls: Record<string, string> = {
    COMPLETED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    BOOKED:    "border-violet-200 bg-violet-100 text-violet-800",
    CONTACTED: "border-blue-200 bg-blue-100 text-blue-800",
    DUE:       "border-red-200 bg-red-100 text-red-800",
    UPCOMING:  "border-sky-200 bg-sky-100 text-sky-800",
    MISSED:    "border-gray-200 bg-gray-100 text-gray-500",
    CANCELLED: "border-gray-200 bg-gray-100 text-gray-400",
  };
  const localeLabels = labels[locale] ?? labels.en;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls[status] ?? cls.UPCOMING}`}>
      {localeLabels[status] ?? status}
    </span>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
