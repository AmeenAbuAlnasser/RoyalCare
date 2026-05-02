"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import {
  createTenantAppointment,
  getTenantAppointment,
  getTenantAppointmentOptions,
  updateTenantAppointment,
  type AppointmentConflictDetails,
  type AppointmentStatus,
  type TenantAppointmentOptions,
} from "@/lib/api/tenant-appointments";
import { AppointmentConflictAlert } from "./AppointmentConflictAlert";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getAppointmentProviderName,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";
import {
  appointmentToForm,
  formToAppointmentPayload,
  type TenantAppointmentFormErrors,
  type TenantAppointmentFormState,
} from "./appointment-form";

const appointmentStatuses: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function validateForm(
  form: TenantAppointmentFormState,
  dictionary: CenterAdminDictionary,
) {
  const errors: TenantAppointmentFormErrors = {};

  if (!form.patientId) {
    errors.patientId = dictionary.appointments.fieldRequired;
  }

  if (!form.serviceId) {
    errors.serviceId = dictionary.appointments.fieldRequired;
  }

  if (!form.staffUserId) {
    errors.staffUserId = dictionary.appointments.fieldRequired;
  }

  if (!form.appointmentDate) {
    errors.appointmentDate = dictionary.appointments.invalidDate;
  }

  if (!form.startTime) {
    errors.startTime = dictionary.appointments.invalidTime;
  }

  if (!form.durationMinutes || Number(form.durationMinutes) <= 0) {
    errors.durationMinutes = dictionary.appointments.invalidDuration;
  }

  return errors;
}

function extractErrors(error: unknown, dictionary: CenterAdminDictionary) {
  if (!isApiRequestError(error)) {
    return {};
  }

  const details = (error as ApiRequestError).details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const source = (details as { errors?: Record<string, unknown> }).errors;

  if (!source) {
    return {};
  }

  return Object.fromEntries(
    Object.keys(source).map((key) => {
      const fallback =
        key === "appointmentDate"
          ? dictionary.appointments.invalidDate
          : key === "startTime" || key === "endTime"
            ? dictionary.appointments.invalidTime
            : key === "durationMinutes"
              ? dictionary.appointments.invalidDuration
              : key === "patientId" || key === "staffUserId"
                ? dictionary.appointments.overlap
                : dictionary.appointments.fieldRequired;

      return [key, fallback];
    }),
  ) as TenantAppointmentFormErrors;
}

function isApiRequestError(
  error: unknown,
): error is ApiRequestError {
  if (error instanceof ApiRequestError) return true;
  // HMR fallback: class identity breaks on hot reload, check by name + shape.
  return (
    error instanceof Error &&
    error.name === "ApiRequestError" &&
    "details" in error
  );
}

function extractConflictDetails(
  error: unknown,
): AppointmentConflictDetails | null {
  if (!error || typeof error !== "object") return null;

  const err = error as Record<string, unknown>;

  // Build every candidate object that might contain conflictDetails.
  // This covers all possible API client shapes: custom ApiRequestError,
  // Axios-style, plain objects, and extra body-nesting variants.
  const candidates: unknown[] = [
    err,                               // error.conflictDetails (direct)
    err.details,                       // error.details.conflictDetails
    err.data,                          // error.data.conflictDetails
  ];

  // error.details.body (extra nesting layer sometimes added by middleware)
  const d = err.details;
  if (d && typeof d === "object") {
    candidates.push((d as Record<string, unknown>).body);
  }

  // error.response.data (Axios / fetch-wrapper shape)
  const r = err.response;
  if (r && typeof r === "object") {
    candidates.push((r as Record<string, unknown>).data);
  }

  // Re-parse rawResponseBody in case safelyParseJson() failed on first try.
  const raw = err.rawResponseBody;
  if (typeof raw === "string" && raw.trim()) {
    try { candidates.push(JSON.parse(raw)); } catch { /* ignore */ }
  }

  // Search every candidate for a non-null conflictDetails object.
  for (const src of candidates) {
    if (!src || typeof src !== "object" || Array.isArray(src)) continue;
    const cd = (src as Record<string, unknown>).conflictDetails;
    if (cd && typeof cd === "object" && !Array.isArray(cd)) {
      return cd as AppointmentConflictDetails;
    }
  }

  // Last resort: if errors.patientId or errors.staffUserId is present the
  // server confirmed a conflict even though conflictDetails was not found in
  // any expected location.  Show the alert with blank fields (renders "—")
  // so the red box always appears on a confirmed conflict.
  const details = err.details;
  if (details && typeof details === "object") {
    const errs = (details as Record<string, unknown>).errors;
    if (errs && typeof errs === "object") {
      const e = errs as Record<string, unknown>;
      if (e.patientId || e.staffUserId) {
        return {
          appointmentDate: "",
          endTime: "",
          patientName: "",
          providerName: "",
          serviceNameAr: "",
          serviceNameEn: "",
          serviceNameHe: "",
          startTime: "",
        };
      }
    }
  }

  return null;
}

function calculateEndTime(startTime: string, durationMinutes: string) {
  if (!startTime || !durationMinutes) {
    return "";
  }

  const [hours, minutes] = startTime.split(":").map(Number);
  const duration = Number(durationMinutes);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || duration <= 0) {
    return "";
  }

  const total = hours * 60 + minutes + duration;

  if (total > 24 * 60) {
    return "";
  }

  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function TenantAppointmentFormPage({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const { locale } = useLanguage();
  const appointmentId = params.id;
  const [form, setForm] = useState<TenantAppointmentFormState>(() =>
    appointmentToForm(),
  );
  const [options, setOptions] = useState<TenantAppointmentOptions | null>(null);
  const [errors, setErrors] = useState<TenantAppointmentFormErrors>({});
  const [conflictDetails, setConflictDetails] =
    useState<AppointmentConflictDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getTenantAppointmentOptions(),
      mode === "edit" && appointmentId
        ? getTenantAppointment(appointmentId)
        : Promise.resolve(null),
    ])
      .then(([optionsResponse, appointment]) => {
        if (isMounted) {
          setOptions(optionsResponse);

          if (appointment) {
            setForm(appointmentToForm(appointment));
          }
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
  }, [appointmentId, mode]);

  return (
    <CenterAdminShell
      activeNav="appointments"
      subtitle={(dictionary) => dictionary.appointments.subtitle}
      title={(dictionary) =>
        mode === "create"
          ? dictionary.appointments.addAppointment
          : dictionary.appointments.editAppointment
      }
    >
      {({ dictionary }) => {
        const submit = async () => {
          const nextErrors = validateForm(form, dictionary);

          setErrors(nextErrors);
          setConflictDetails(null);

          if (Object.keys(nextErrors).length > 0) {
            return;
          }

          setIsSaving(true);

          try {
            const saved =
              mode === "edit" && appointmentId
                ? await updateTenantAppointment(
                    appointmentId,
                    formToAppointmentPayload(form),
                  )
                : await createTenantAppointment(formToAppointmentPayload(form));

            router.push(`/tenant/appointments/${saved.id}`);
          } catch (error) {
            const extracted = extractConflictDetails(error);
            setErrors(extractErrors(error, dictionary));
            setConflictDetails(extracted);
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <>
            <div className="mt-5">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/appointments"
              >
                {dictionary.nav.appointments}
              </Link>
            </div>

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

            {!isLoading && !loadError ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    error={errors.patientId}
                    label={dictionary.appointments.patient}
                  >
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, patientId: event.target.value })
                      }
                      value={form.patientId}
                    >
                      <option value="">{dictionary.appointments.patient}</option>
                      {options?.patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.fullName} · {patient.phone}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    error={errors.serviceId}
                    label={dictionary.appointments.service}
                  >
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) => {
                        const service = options?.services.find(
                          (item) => item.id === event.target.value,
                        );
                        setForm({
                          ...form,
                          durationMinutes:
                            service?.durationMinutes?.toString() ||
                            form.durationMinutes,
                          serviceId: event.target.value,
                        });
                      }}
                      value={form.serviceId}
                    >
                      <option value="">{dictionary.appointments.service}</option>
                      {options?.services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {getLocalizedAppointmentServiceName(service, locale)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    error={errors.staffUserId}
                    label={dictionary.appointments.provider}
                  >
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, staffUserId: event.target.value })
                      }
                      value={form.staffUserId}
                    >
                      <option value="">{dictionary.appointments.provider}</option>
                      {options?.providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {getAppointmentProviderName(provider) ||
                            dictionary.common.notAvailable}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    error={errors.appointmentDate}
                    label={dictionary.appointments.appointmentDate}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          appointmentDate: event.target.value,
                        })
                      }
                      type="date"
                      value={form.appointmentDate}
                    />
                  </Field>
                  <Field
                    error={errors.startTime}
                    label={dictionary.appointments.startTime}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, startTime: event.target.value })
                      }
                      type="time"
                      value={form.startTime}
                    />
                  </Field>
                  <Field
                    error={errors.durationMinutes}
                    label={dictionary.appointments.durationMinutes}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      min="1"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          durationMinutes: event.target.value,
                        })
                      }
                      type="number"
                      value={form.durationMinutes}
                    />
                  </Field>
                  <Field label={dictionary.appointments.status}>
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as AppointmentStatus,
                        })
                      }
                      value={form.status}
                    >
                      {appointmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {dictionary.appointmentStatuses[status]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={dictionary.appointments.endTime}>
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] bg-[#F8FAFC] px-3 text-sm text-[#66758a]"
                      readOnly
                      value={calculateEndTime(
                        form.startTime,
                        form.durationMinutes,
                      )}
                    />
                  </Field>
                  <Field className="md:col-span-2" label={dictionary.appointments.notes}>
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, notes: event.target.value })
                      }
                      value={form.notes}
                    />
                  </Field>
                  <Field
                    className="md:col-span-2"
                    label={dictionary.appointments.internalNotes}
                  >
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, internalNotes: event.target.value })
                      }
                      value={form.internalNotes}
                    />
                  </Field>
                </div>

                {conflictDetails ? (
                  <AppointmentConflictAlert
                    details={conflictDetails}
                    dictionary={dictionary}
                    locale={locale}
                  />
                ) : null}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    className={buttonClassName("secondary", "md")}
                    href="/tenant/appointments"
                  >
                    {dictionary.common.cancel}
                  </Link>
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={isSaving}
                    onClick={submit}
                    type="button"
                  >
                    {isSaving
                      ? dictionary.common.saving
                      : mode === "create"
                        ? dictionary.appointments.submit
                        : dictionary.appointments.update}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function Field({
  children,
  className = "",
  error,
  label,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  label: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-sm font-semibold text-[#24364f]">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
