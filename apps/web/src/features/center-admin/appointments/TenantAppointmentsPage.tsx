"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import {
  getTenantAppointmentOptions,
  listTenantAppointments,
  updateTenantAppointmentStatus,
  type AppointmentInvoiceStatus,
  type AppointmentStatus,
  type TenantAppointment,
  type TenantAppointmentOptions,
} from "@/lib/api/tenant-appointments";
import { createTenantInvoiceFromAppointment } from "@/lib/api/tenant-billing";
import { hasBillingPermission } from "../billing/billing-permissions";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
import {
  formatAppointmentTime,
  getAppointmentProviderName,
  getAppointmentDateInputValue,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";
import { hasTenantAppointmentPermission } from "./appointment-permissions";
import { AppointmentCalendarView } from "./AppointmentCalendarView";

function invoiceBadgeClass(status: AppointmentInvoiceStatus): string {
  const base =
    "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold";

  switch (status) {
    case "PAID":
      return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    case "PARTIAL":
      return `${base} border-indigo-200 bg-indigo-50 text-indigo-700`;
    case "CANCELLED":
      return `${base} border-rose-200 bg-rose-50 text-rose-700`;
    default:
      return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  }
}

function appointmentStatusBadgeClass(status: AppointmentStatus): string {
  const base =
    "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold";

  switch (status) {
    case "SCHEDULED":
      return `${base} border-slate-200 bg-slate-50 text-slate-700`;
    case "CONFIRMED":
      return `${base} border-blue-200 bg-blue-50 text-blue-700`;
    case "IN_PROGRESS":
      return `${base} border-orange-200 bg-orange-50 text-orange-700`;
    case "COMPLETED":
      return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    case "CANCELLED":
      return `${base} border-rose-200 bg-rose-50 text-rose-700`;
    case "NO_SHOW":
      return `${base} border-rose-200 bg-rose-50 text-rose-700`;
    default:
      return `${base} border-slate-200 bg-slate-50 text-slate-700`;
  }
}

function getInvoiceBadgeLabel(
  status: AppointmentInvoiceStatus,
  dictionary: CenterAdminDictionary,
): string {
  if (status === "PENDING") return dictionary.appointments.invoiceUnpaid;
  return dictionary.billingStatuses[status];
}

type StatusFilter = "ALL" | AppointmentStatus;

const appointmentStatusKeys: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

function matchesSearch(appointment: TenantAppointment, search: string) {
  const term = normalizeSearch(search);

  if (!term) {
    return true;
  }

  return [appointment.patient.fullName, appointment.patient.phone]
    .map(normalizeSearch)
    .some((value) => value.includes(term));
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type UrgencyLevel = "upcoming" | "in-progress" | "normal";

function getAppointmentUrgency(
  appointment: TenantAppointment,
  now: Date,
): { level: UrgencyLevel; minutesUntilStart: number } {
  const skip: AppointmentStatus[] = ["CANCELLED", "COMPLETED", "NO_SHOW"];
  if (skip.includes(appointment.status)) {
    return { level: "normal", minutesUntilStart: 0 };
  }

  const dateStr = appointment.appointmentDate.slice(0, 10);
  const start = new Date(`${dateStr}T${appointment.startTime}:00`);
  const end = new Date(`${dateStr}T${appointment.endTime}:00`);
  const minutesUntilStart = (start.getTime() - now.getTime()) / 60_000;

  if (appointment.status === "IN_PROGRESS" || (now >= start && now < end)) {
    return { level: "in-progress", minutesUntilStart };
  }

  if (minutesUntilStart > 0 && minutesUntilStart <= 30) {
    return { level: "upcoming", minutesUntilStart };
  }

  return { level: "normal", minutesUntilStart };
}

export function TenantAppointmentsPage() {
  const { locale } = useLanguage();
  const [appointments, setAppointments] = useState<TenantAppointment[]>([]);
  const [options, setOptions] = useState<TenantAppointmentOptions | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");
  const [creatingInvoiceId, setCreatingInvoiceId] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    let isMounted = true;

    Promise.all([listTenantAppointments(), getTenantAppointmentOptions()])
      .then(([appointmentsResponse, optionsResponse]) => {
        if (isMounted) {
          setAppointments(appointmentsResponse.items);
          setOptions(optionsResponse);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(true);
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
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 4000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (!matchesSearch(appointment, search)) {
          return false;
        }

        if (statusFilter !== "ALL" && appointment.status !== statusFilter) {
          return false;
        }

        if (
          dateFilter &&
          getAppointmentDateInputValue(appointment.appointmentDate) !==
            dateFilter
        ) {
          return false;
        }

        if (providerFilter && appointment.staffUserId !== providerFilter) {
          return false;
        }

        return true;
      }),
    [appointments, dateFilter, providerFilter, search, statusFilter],
  );

  return (
    <CenterAdminShell
      activeNav="appointments"
      subtitle={(dictionary) => dictionary.appointments.subtitle}
      title={(dictionary) => dictionary.appointments.title}
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const hasUpdateAppointmentPermission = hasTenantAppointmentPermission(
          session.permissions,
          "appointments:update",
        );
        const hasUpdateStatusPermission = hasTenantAppointmentPermission(
          session.permissions,
          "appointments:status",
        );
        const hasCreateBillingPermission = hasBillingPermission(
          session.permissions,
          "billing:create",
        );
        const canUpdateStatus = hasUpdateStatusPermission && !isWriteBlocked;
        const canUpdateAppointment =
          hasUpdateAppointmentPermission && !isWriteBlocked;
        const today = todayInputValue();
        const todayCount = appointments.filter(
          (appointment) =>
            getAppointmentDateInputValue(appointment.appointmentDate) === today,
        ).length;
        const upcomingCount = appointments.filter(
          (appointment) =>
            getAppointmentDateInputValue(appointment.appointmentDate) >= today &&
            appointment.status !== "CANCELLED" &&
            appointment.status !== "COMPLETED",
        ).length;

        const canCreateBilling = hasCreateBillingPermission && !isWriteBlocked;

        const changeStatus = async (
          appointment: TenantAppointment,
          status: AppointmentStatus,
        ) => {
          if (!canUpdateStatus) {
            return;
          }

          setSavingId(appointment.id);
          setNotice("");

          try {
            const updated = await updateTenantAppointmentStatus(
              appointment.id,
              status,
            );

            // Preserve or auto-create invoice
            let invoiceForState = appointment.invoice;

            if (status === "COMPLETED" && !appointment.invoice && canCreateBilling) {
              try {
                const inv = await createTenantInvoiceFromAppointment(appointment.id);
                invoiceForState = {
                  id: inv.id,
                  status: inv.status,
                  currency: inv.currency,
                  totalAmount: inv.amount,
                  paidAmount: "0.00",
                  remainingAmount: inv.amount,
                };
              } catch {
                // Service may have no price — user can create manually from details page
              }
            }

            setAppointments((current) =>
              current.map((item) =>
                item.id === updated.id
                  ? { ...updated, invoice: invoiceForState }
                  : item,
              ),
            );
            setNotice(dictionary.appointments.statusUpdated);
          } finally {
            setSavingId("");
          }
        };

        const handleReactivate = async (appointment: TenantAppointment) => {
          if (!canUpdateStatus) return;
          setSavingId(appointment.id);
          setNotice("");
          try {
            const updated = await updateTenantAppointmentStatus(appointment.id, "CONFIRMED");
            setAppointments((current) =>
              current.map((item) =>
                item.id === updated.id
                  ? { ...updated, invoice: item.invoice }
                  : item,
              ),
            );
            setNotice(dictionary.appointments.reactivated);
          } finally {
            setSavingId("");
          }
        };

        const handleCreateInvoice = async (appointment: TenantAppointment) => {
          if (!canCreateBilling) {
            if (restrictionMessage) {
              setNotice(restrictionMessage);
            }
            return;
          }

          setCreatingInvoiceId(appointment.id);
          setNotice("");

          try {
            const inv = await createTenantInvoiceFromAppointment(appointment.id);
            setAppointments((current) =>
              current.map((item) =>
                item.id === appointment.id
                  ? {
                      ...item,
                      invoice: {
                        id: inv.id,
                        status: inv.status,
                        currency: inv.currency,
                        totalAmount: inv.amount,
                        paidAmount: "0.00",
                        remainingAmount: inv.amount,
                      },
                    }
                  : item,
              ),
            );
            setNotice(dictionary.appointments.invoiceCreated);
          } catch {
            // silent — user can create from the appointment details page
          } finally {
            setCreatingInvoiceId("");
          }
        };

        return (
          <>
            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              <SummaryCard label={dictionary.appointments.today} value={todayCount} />
              <SummaryCard
                label={dictionary.appointments.upcoming}
                value={upcomingCount}
              />
            </section>

            <AdminCard className="mt-5 p-4">
              <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px_auto_auto] lg:items-center">
                <input
                  className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={dictionary.appointments.searchPlaceholder}
                  value={search}
                />
                <select
                  className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  value={statusFilter}
                >
                  <option value="ALL">{dictionary.appointments.filterAll}</option>
                  {appointmentStatusKeys.map((status) => (
                    <option key={status} value={status}>
                      {dictionary.appointmentStatuses[status]}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={dictionary.appointments.dateFilter}
                  className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(event) => setDateFilter(event.target.value)}
                  type="date"
                  value={dateFilter}
                />
                <select
                  className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  onChange={(event) => setProviderFilter(event.target.value)}
                  value={providerFilter}
                >
                  <option value="">{dictionary.appointments.allProviders}</option>
                  {options?.providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {getAppointmentProviderName(provider) ||
                        dictionary.common.notAvailable}
                    </option>
                  ))}
                </select>
                {session.permissions.includes("appointments:create") ? (
                  isWriteBlocked ? (
                    <button
                      className={buttonClassName("primary", "md")}
                      disabled
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.appointments.addAppointment}
                    </button>
                  ) : (
                    <Link
                      className={buttonClassName("primary", "md")}
                      href="/tenant/appointments/new"
                    >
                      {dictionary.appointments.addAppointment}
                    </Link>
                  )
                ) : null}
                <div className="flex items-center rounded-md border border-[#D8DEE8] bg-white p-0.5">
                  {(["list", "calendar"] as const).map((m) => (
                    <button
                      key={m}
                      className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                        viewMode === m
                          ? "bg-[#0B2D5C] text-white"
                          : "text-[#66758a] hover:bg-[#F0F4FA]"
                      }`}
                      onClick={() => setViewMode(m)}
                      type="button"
                    >
                      {m === "list"
                        ? dictionary.appointments.listView
                        : dictionary.appointments.calendarView}
                    </button>
                  ))}
                </div>
              </div>
            </AdminCard>

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
                className="mt-5"
                title={dictionary.appointments.loadError}
                tone="error"
              />
            ) : null}

            {!isLoading && !loadError && appointments.length === 0 ? (
              <EmptyState
                body={dictionary.appointments.emptyBody}
                title={dictionary.appointments.emptyTitle}
              />
            ) : null}

            {!isLoading &&
            !loadError &&
            appointments.length > 0 &&
            filteredAppointments.length === 0 ? (
              <EmptyState
                body={dictionary.appointments.noResultsBody}
                title={dictionary.appointments.noResultsTitle}
              />
            ) : null}

            {viewMode === "calendar" && !isLoading && !loadError ? (
              <AppointmentCalendarView
                appointments={filteredAppointments}
                dictionary={dictionary}
                locale={locale}
              />
            ) : null}

            <section className={`mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 ${viewMode === "calendar" ? "hidden" : ""}`}>
              {filteredAppointments.map((appointment) => {
                const urgency = getAppointmentUrgency(appointment, now);
                const isCancelled = appointment.status === "CANCELLED";
                const baseCard = "rounded-lg border p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] transition-shadow duration-150 hover:shadow-[0_16px_36px_rgba(11,45,92,0.09)]";
                const cardClass = isCancelled
                  ? `${baseCard} border-gray-300 bg-gray-100 opacity-60`
                  : appointment.status === "NO_SHOW"
                    ? `${baseCard} border-rose-200 bg-rose-50`
                    : appointment.status === "COMPLETED"
                      ? `${baseCard} border-emerald-200 bg-emerald-50`
                      : urgency.level === "in-progress"
                        ? `${baseCard} border-orange-400 bg-orange-50`
                        : urgency.level === "upcoming"
                          ? `${baseCard} border-red-300 bg-red-50`
                          : `${baseCard} border-[#E5E7EB] bg-white`;

                return (
                  <article className={cardClass} key={appointment.id}>
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className={`break-words text-base font-semibold text-[#0B2D5C]${isCancelled ? " line-through" : ""}`}>
                          {appointment.patient.fullName}
                        </h2>
                        <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                          {formatDate(appointment.appointmentDate, locale)} ·{" "}
                          {formatAppointmentTime(appointment)}
                        </p>
                        {appointment.bookingSource &&
                        appointment.bookingSource.fullName.trim() !==
                          appointment.patient.fullName.trim() ? (
                          <p className="mt-1 break-words text-xs font-medium text-[#66758a]">
                            {dictionary.appointments.requestedBy(
                              appointment.bookingSource.fullName,
                            )}
                          </p>
                        ) : null}
                        {urgency.level === "in-progress" ? (
                          <p className="mt-1 text-xs font-semibold text-orange-700">
                            {dictionary.appointments.inProgressNow}
                          </p>
                        ) : urgency.level === "upcoming" ? (
                          <p className="mt-1 text-xs font-semibold text-red-700">
                            {dictionary.appointments.startsInMinutes.replace(
                              "{n}",
                              String(Math.ceil(urgency.minutesUntilStart)),
                            )}
                          </p>
                        ) : null}
                      </div>
                      <span className={appointmentStatusBadgeClass(appointment.status)}>
                        {dictionary.appointmentStatuses[appointment.status]}
                      </span>
                    </div>
                    <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <Detail
                        label={dictionary.appointments.service}
                        strikethrough={isCancelled}
                        value={getLocalizedAppointmentServiceName(
                          appointment.service,
                          locale,
                          appointment.offerTitle,
                          appointment.customServiceName,
                        )}
                        badge={
                          appointment.serviceId && appointment.service?.followUpEnabled ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              {dictionary.appointments.followUpPlanExists}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                              {dictionary.appointments.followUpPlanNone}
                            </span>
                          )
                        }
                      />
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
                        label={dictionary.patients.phone}
                        value={appointment.patient.phone}
                      />
                    </dl>
                    {appointment.invoice ? (
                      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className={invoiceBadgeClass(appointment.invoice.status)}
                        >
                          {getInvoiceBadgeLabel(
                            appointment.invoice.status,
                            dictionary,
                          )}
                        </span>
                        <span className="text-xs text-[#66758a]" dir="ltr">
                          {appointment.invoice.currency}{" "}
                          {appointment.invoice.totalAmount}
                          {parseFloat(appointment.invoice.remainingAmount) > 0 ? (
                            <> · {dictionary.billing.balanceDue}{" "}
                            {appointment.invoice.remainingAmount}</>
                          ) : null}
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link
                        className={buttonClassName("secondary", "sm")}
                        href={`/tenant/appointments/${appointment.id}`}
                      >
                        {dictionary.common.view}
                      </Link>
                      {hasUpdateAppointmentPermission ? (
                        isCancelled || !canUpdateAppointment ? (
                        <button
                          className={buttonClassName("secondary", "sm")}
                          disabled
                          title={isWriteBlocked ? restrictionMessage : undefined}
                          type="button"
                        >
                          {dictionary.common.edit}
                        </button>
                        ) : (
                        <Link
                          className={buttonClassName("secondary", "sm")}
                          href={`/tenant/appointments/${appointment.id}/edit`}
                        >
                          {dictionary.common.edit}
                        </Link>
                        )
                      ) : null}
                      {isCancelled && canUpdateStatus ? (
                        <button
                          className={buttonClassName("primary", "sm")}
                          disabled={savingId === appointment.id}
                          onClick={() => handleReactivate(appointment)}
                          type="button"
                        >
                          {dictionary.appointments.reactivateAppointment}
                        </button>
                      ) : null}
                      {appointment.invoice ? (
                        <Link
                          className={buttonClassName("secondary", "sm")}
                          href={`/tenant/billing/${appointment.invoice.id}`}
                        >
                          {dictionary.appointments.viewInvoice}
                        </Link>
                      ) : appointment.status === "COMPLETED" &&
                        hasCreateBillingPermission ? (
                        <button
                          className={buttonClassName("secondary", "sm")}
                          disabled={
                            creatingInvoiceId === appointment.id ||
                            !canCreateBilling
                          }
                          onClick={() => handleCreateInvoice(appointment)}
                          title={restrictionMessage || undefined}
                          type="button"
                        >
                          {creatingInvoiceId === appointment.id
                            ? dictionary.common.saving
                            : dictionary.appointments.createInvoice}
                        </button>
                      ) : null}
                      {hasUpdateStatusPermission ? (
                        <select
                          className="min-h-9 rounded-md border border-[#D8DEE8] px-2 text-sm font-semibold text-[#132238]"
                          disabled={
                            savingId === appointment.id ||
                            isCancelled ||
                            !canUpdateStatus
                          }
                          onChange={(event) =>
                            changeStatus(
                              appointment,
                              event.target.value as AppointmentStatus,
                            )
                          }
                          value={appointment.status}
                        >
                          {appointmentStatusKeys.map((status) => (
                            <option key={status} value={status}>
                              {dictionary.appointmentStatuses[status]}
                            </option>
                          ))}
                        </select>
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <AdminCard className="p-4">
      <p className="text-sm font-semibold text-[#66758a]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0B2D5C]">{value}</p>
    </AdminCard>
  );
}

function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <AdminState body={body} className="mt-5 border-dashed" title={title} />
  );
}

function Detail({
  label,
  value,
  strikethrough,
  badge,
}: {
  label: string;
  value: string;
  strikethrough?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <dt className="text-xs font-semibold text-[#66758a]">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold text-[#24364f]${strikethrough ? " line-through" : ""}`}>
        {value}
      </dd>
      {badge != null ? <div className="mt-2 min-w-0">{badge}</div> : null}
    </div>
  );
}
