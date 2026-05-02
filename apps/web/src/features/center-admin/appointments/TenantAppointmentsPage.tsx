"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  getTenantAppointmentOptions,
  listTenantAppointments,
  updateTenantAppointmentStatus,
  type AppointmentStatus,
  type TenantAppointment,
  type TenantAppointmentOptions,
} from "@/lib/api/tenant-appointments";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formatAppointmentTime,
  getAppointmentProviderName,
  getAppointmentDateInputValue,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";
import { hasTenantAppointmentPermission } from "./appointment-permissions";

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
        const canCreate = hasTenantAppointmentPermission(
          session.role.key,
          "appointments.create",
        );
        const canUpdateStatus = hasTenantAppointmentPermission(
          session.role.key,
          "appointments.status.update",
        );
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
            setAppointments((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
            setNotice(dictionary.appointments.statusUpdated);
          } finally {
            setSavingId("");
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

            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px_auto] lg:items-center">
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
                {canCreate ? (
                  <Link
                    className={buttonClassName("primary", "md")}
                    href="/tenant/appointments/new"
                  >
                    {dictionary.appointments.addAppointment}
                  </Link>
                ) : null}
              </div>
            </section>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.appointments.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.appointments.loadError}
              </p>
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

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredAppointments.map((appointment) => (
                <article
                  className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                  key={appointment.id}
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-semibold text-[#0B2D5C]">
                        {appointment.patient.fullName}
                      </h2>
                      <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                        {formatDate(appointment.appointmentDate, locale)} ·{" "}
                        {formatAppointmentTime(appointment)}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                      {dictionary.appointmentStatuses[appointment.status]}
                    </span>
                  </div>
                  <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <Detail
                      label={dictionary.appointments.service}
                      value={getLocalizedAppointmentServiceName(
                        appointment.service,
                        locale,
                      )}
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      className={buttonClassName("secondary", "sm")}
                      href={`/tenant/appointments/${appointment.id}`}
                    >
                      {dictionary.common.view}
                    </Link>
                    <Link
                      className={buttonClassName("secondary", "sm")}
                      href={`/tenant/appointments/${appointment.id}/edit`}
                    >
                      {dictionary.common.edit}
                    </Link>
                    {canUpdateStatus ? (
                      <select
                        className="min-h-9 rounded-md border border-[#D8DEE8] px-2 text-sm font-semibold text-[#132238]"
                        disabled={savingId === appointment.id}
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
              ))}
            </section>
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <p className="text-sm font-semibold text-[#66758a]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0B2D5C]">{value}</p>
    </div>
  );
}

function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
      <h2 className="text-base font-semibold text-[#0B2D5C]">{title}</h2>
      <p className="mt-2 text-sm text-[#66758a]">{body}</p>
    </section>
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
