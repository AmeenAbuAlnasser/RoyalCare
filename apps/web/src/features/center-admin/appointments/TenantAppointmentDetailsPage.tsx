"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  cancelTenantAppointment,
  getTenantAppointment,
  updateTenantAppointmentStatus,
  type AppointmentStatus,
  type TenantAppointment,
} from "@/lib/api/tenant-appointments";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formatAppointmentTime,
  getAppointmentProviderName,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";
import { hasTenantAppointmentPermission } from "./appointment-permissions";

const appointmentStatusKeys: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export function TenantAppointmentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;
  const { locale } = useLanguage();
  const [appointment, setAppointment] = useState<TenantAppointment | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    let isMounted = true;

    getTenantAppointment(appointmentId)
      .then((response) => {
        if (isMounted) {
          setAppointment(response);
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
  }, [appointmentId]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 4000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  return (
    <CenterAdminShell
      activeNav="appointments"
      subtitle={(dictionary) => dictionary.appointments.subtitle}
      title={(dictionary) => dictionary.appointments.detailsTitle}
    >
      {({ dictionary, session }) => {
        const canUpdate = hasTenantAppointmentPermission(
          session.role.key,
          "appointments.update",
        );
        const canCancel = hasTenantAppointmentPermission(
          session.role.key,
          "appointments.cancel",
        );
        const canUpdateStatus = hasTenantAppointmentPermission(
          session.role.key,
          "appointments.status.update",
        );

        const changeStatus = async (status: AppointmentStatus) => {
          if (!appointment || !canUpdateStatus) {
            return;
          }

          setIsSaving(true);
          setNotice("");

          try {
            const updated = await updateTenantAppointmentStatus(
              appointment.id,
              status,
            );
            setAppointment(updated);
            setNotice(dictionary.appointments.statusUpdated);
          } finally {
            setIsSaving(false);
          }
        };

        const cancelAppointment = async () => {
          if (!appointment || !canCancel || !cancelReason.trim()) {
            return;
          }

          setIsSaving(true);
          setNotice("");

          try {
            const updated = await cancelTenantAppointment(
              appointment.id,
              cancelReason,
            );
            setAppointment(updated);
            setNotice(dictionary.appointments.cancelled);
          } finally {
            setIsSaving(false);
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
              {appointment && canUpdate ? (
                <Link
                  className={buttonClassName("secondary", "md")}
                  href={`/tenant/appointments/${appointment.id}/edit`}
                >
                  {dictionary.common.edit}
                </Link>
              ) : null}
            </div>

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
              <section className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-6">
                <h2 className="text-base font-semibold text-[#B42318]">
                  {dictionary.appointments.notFound}
                </h2>
                <button
                  className={buttonClassName("secondary", "md", "mt-4")}
                  onClick={() => router.push("/tenant/appointments")}
                  type="button"
                >
                  {dictionary.nav.appointments}
                </button>
              </section>
            ) : null}

            {appointment && !isLoading ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-[#0B2D5C]">
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
                    label={dictionary.appointments.notes}
                    value={appointment.notes || dictionary.common.notAvailable}
                  />
                  <TextBlock
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
                  {canUpdateStatus ? (
                    <label className="block min-w-0">
                      <span className="text-sm font-semibold text-[#24364f]">
                        {dictionary.appointments.changeStatus}
                      </span>
                      <select
                        className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                        disabled={isSaving}
                        onChange={(event) =>
                          changeStatus(event.target.value as AppointmentStatus)
                        }
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
                  {canCancel && appointment.status !== "CANCELLED" ? (
                    <>
                      <label className="block min-w-0">
                        <span className="text-sm font-semibold text-[#24364f]">
                          {dictionary.appointments.cancellationReason}
                        </span>
                        <input
                          className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                          onChange={(event) =>
                            setCancelReason(event.target.value)
                          }
                          value={cancelReason}
                        />
                      </label>
                      <button
                        className={buttonClassName("warning", "md")}
                        disabled={isSaving || !cancelReason.trim()}
                        onClick={cancelAppointment}
                        type="button"
                      >
                        {dictionary.appointments.cancelAppointment}
                      </button>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        );
      }}
    </CenterAdminShell>
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

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-4">
      <h3 className="text-sm font-semibold text-[#24364f]">{label}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#66758a]">
        {value}
      </p>
    </div>
  );
}
