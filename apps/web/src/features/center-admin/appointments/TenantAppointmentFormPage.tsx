"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import {
  createTenantAppointment,
  getTenantAppointment,
  getTenantAppointmentOptions,
  getTenantAvailability,
  updateTenantAppointment,
  type AppointmentConflictDetails,
  type AppointmentStatus,
  type TenantAppointment,
  type TenantAppointmentOptions,
  type TenantAvailabilitySlot,
} from "@/lib/api/tenant-appointments";
import {
  getTenantFollowUp,
  updateTenantFollowUpStatus,
  type TenantPatientFollowUp,
} from "@/lib/api/tenant-follow-ups";
import { AppointmentConflictAlert } from "./AppointmentConflictAlert";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type SlotState =
  | { status: "prompt" }
  | { status: "loading" }
  | { status: "ready"; slots: TenantAvailabilitySlot[] }
  | { status: "error" };
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
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
  isOfferAppointment: boolean,
  isCustomService: boolean,
) {
  const errors: TenantAppointmentFormErrors = {};

  if (!form.patientId) {
    errors.patientId = dictionary.appointments.fieldRequired;
  }

  if (!form.serviceId && !isCustomService && !isOfferAppointment) {
    errors.serviceId = dictionary.appointments.fieldRequired;
  }

  if (isCustomService && !form.customServiceName.trim()) {
    errors.customServiceName = dictionary.appointments.fieldRequired;
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

  if (form.startTime && form.durationMinutes && Number(form.durationMinutes) > 0) {
    const computed = calculateEndTime(form.startTime, form.durationMinutes);
    if (!computed) {
      errors.endTime = dictionary.appointments.endOfDayError;
    }
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
          : key === "endTime"
            ? dictionary.appointments.endOfDayError
            : key === "startTime"
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

function tryParseJson(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractConflictDetails(
  error: unknown,
): AppointmentConflictDetails | null {
  if (!error || typeof error !== "object") return null;
  const err = error as Record<string, unknown>;

  // Resolve the parsed response body — prefer error.details (set by our API
  // client), fall back to re-parsing rawResponseBody if details is null.
  const body: Record<string, unknown> | null =
    (err.details && typeof err.details === "object" && !Array.isArray(err.details)
      ? (err.details as Record<string, unknown>)
      : null) ?? tryParseJson(err.rawResponseBody);

  if (!body) return null;

  const cd = body.conflictDetails;
  if (!cd || typeof cd !== "object" || Array.isArray(cd)) return null;

  return cd as AppointmentConflictDetails;
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

type FollowUpFormSlice = {
  followUpEnabled: boolean;
  followUpType: "FIXED_INTERVAL" | "SESSION_PLAN";
  defaultIntervalDays: string;
  totalRecommendedSessions: string;
  followUpRules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>;
};

type FollowUpRuleField = "fromSessionNumber" | "toSessionNumber" | "intervalDays";

function parseFollowUpRuleValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getFollowUpRuleWarnings(
  form: FollowUpFormSlice,
  dictionary: { services: { invalidRangeOrder: string; invalidIntervals: string; overlappingRanges: string; uncoveredSessions: (range: string) => string } },
): string[] {
  if (!form.followUpEnabled || form.followUpType !== "SESSION_PLAN") {
    return [];
  }
  const warnings: string[] = [];
  const normalized = form.followUpRules
    .map((rule) => ({
      from: parseFollowUpRuleValue(rule.fromSessionNumber),
      to: parseFollowUpRuleValue(rule.toSessionNumber),
      interval: parseFollowUpRuleValue(rule.intervalDays),
    }))
    .filter(
      (rule): rule is { from: number; to: number; interval: number } =>
        rule.from !== null && rule.to !== null && rule.interval !== null,
    )
    .sort((a, b) => a.from - b.from);
  if (normalized.some((rule) => rule.from <= 0 || rule.to <= 0 || rule.from > rule.to)) {
    warnings.push(dictionary.services.invalidRangeOrder);
  }
  if (normalized.some((rule) => rule.interval <= 0)) {
    warnings.push(dictionary.services.invalidIntervals);
  }
  if (normalized.some((rule, index) => {
    const nextRule = normalized[index + 1];
    return Boolean(nextRule && rule.to >= nextRule.from);
  })) {
    warnings.push(dictionary.services.overlappingRanges);
  }
  const totalSessions = parseFollowUpRuleValue(form.totalRecommendedSessions);
  if (totalSessions && normalized.length > 0) {
    const uncovered: number[] = [];
    for (let session = 1; session <= totalSessions; session += 1) {
      const covered = normalized.some((rule) => session >= rule.from && session <= rule.to);
      if (!covered) uncovered.push(session);
    }
    if (uncovered.length > 0) {
      const ranges: string[] = [];
      let start = uncovered[0];
      let previous = uncovered[0];
      for (const session of uncovered.slice(1)) {
        if (session === previous + 1) {
          previous = session;
        } else {
          ranges.push(start === previous ? `${start}` : `${start} - ${previous}`);
          start = session;
          previous = session;
        }
      }
      ranges.push(start === previous ? `${start}` : `${start} - ${previous}`);
      warnings.push(dictionary.services.uncoveredSessions(ranges.join(", ")));
    }
  }
  return warnings;
}

function getFollowUpPlanPreview(form: FollowUpFormSlice) {
  const totalSessions = parseFollowUpRuleValue(form.totalRecommendedSessions) ?? 8;
  const sessions = Array.from(
    { length: Math.min(totalSessions, 12) },
    (_, index) => index + 1,
  );
  return sessions
    .map((session) => {
      if (form.followUpType === "FIXED_INTERVAL") {
        const interval = parseFollowUpRuleValue(form.defaultIntervalDays);
        return interval && interval > 0 ? { session, interval } : null;
      }
      const match = form.followUpRules.find((rule) => {
        const from = parseFollowUpRuleValue(rule.fromSessionNumber);
        const to = parseFollowUpRuleValue(rule.toSessionNumber);
        return from !== null && to !== null && session >= from && session <= to;
      });
      const interval = match
        ? parseFollowUpRuleValue(match.intervalDays)
        : parseFollowUpRuleValue(form.defaultIntervalDays);
      return interval && interval > 0 ? { session, interval } : null;
    })
    .filter((item): item is { session: number; interval: number } => Boolean(item));
}

function followUpRuleLabel(
  dictionary: { services: { sessionsFrom: string; sessionsTo: string; intervalDays: string } },
  field: FollowUpRuleField,
) {
  if (field === "fromSessionNumber") return dictionary.services.sessionsFrom;
  if (field === "toSessionNumber") return dictionary.services.sessionsTo;
  return dictionary.services.intervalDays;
}

const followUpContextCopy = {
  en: {
    title: "Previous session context",
    previousNotes: "Treatment notes",
    internalNotes: "Internal staff notes",
    provider: "Previous provider",
    duration: "Previous duration",
    treatmentDetails: "Treatment details",
    timeline: "Treatment timeline",
    completed: "Completed",
    followUp: "Upcoming follow-up",
    session: "Session",
    empty: "No previous clinical notes were recorded.",
  },
  ar: {
    title: "معلومات من الجلسة السابقة",
    previousNotes: "ملاحظات علاجية",
    internalNotes: "ملاحظات داخلية للطاقم",
    provider: "المعالج السابق",
    duration: "مدة الجلسة السابقة",
    treatmentDetails: "تفاصيل العلاج",
    timeline: "سجل العلاج",
    completed: "مكتملة",
    followUp: "متابعة قادمة",
    session: "الجلسة",
    empty: "لا توجد ملاحظات علاجية مسجلة للجلسة السابقة.",
  },
  he: {
    title: "מידע מהטיפול הקודם",
    previousNotes: "הערות טיפול",
    internalNotes: "הערות פנימיות לצוות",
    provider: "מטפל קודם",
    duration: "משך טיפול קודם",
    treatmentDetails: "פרטי טיפול",
    timeline: "ציר טיפולים",
    completed: "הושלם",
    followUp: "מעקב קרוב",
    session: "טיפול",
    empty: "לא נרשמו הערות קליניות לטיפול הקודם.",
  },
} as const;

function formatDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function TenantAppointmentFormPage({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const appointmentId = params.id;
  const prefillPatientId = searchParams.get("patientId");
  const prefillServiceId = searchParams.get("serviceId");
  const sourceFollowUpId = searchParams.get("followUpId");
  const [form, setForm] = useState<TenantAppointmentFormState>(() =>
    appointmentToForm(),
  );
  const [loadedAppointment, setLoadedAppointment] = useState<TenantAppointment | null>(null);
  const [options, setOptions] = useState<TenantAppointmentOptions | null>(null);
  const [errors, setErrors] = useState<TenantAppointmentFormErrors>({});
  const [conflictDetails, setConflictDetails] =
    useState<AppointmentConflictDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slotState, setSlotState] = useState<SlotState>({ status: "prompt" });
  const [customServiceMode, setCustomServiceMode] = useState(false);
  const [sourceFollowUp, setSourceFollowUp] =
    useState<TenantPatientFollowUp | null>(null);

  const isOfferAppointment =
    mode === "edit" &&
    Boolean(loadedAppointment?.offerTitle && !loadedAppointment?.serviceId);
  const usesCustomService = customServiceMode && !isOfferAppointment;

  useEffect(() => {
    let isMounted = true;

    if (isOfferAppointment || usesCustomService || !form.serviceId || !form.appointmentDate) {
      queueMicrotask(() => {
        if (isMounted) setSlotState({ status: "prompt" });
      });
      return () => { isMounted = false; };
    }

    queueMicrotask(() => {
      if (isMounted) setSlotState({ status: "loading" });
    });
    getTenantAvailability(
      form.serviceId,
      form.appointmentDate,
      form.staffUserId || undefined,
      mode === "edit" && appointmentId ? appointmentId : undefined,
    )
      .then((res) => { if (isMounted) setSlotState({ status: "ready", slots: res.slots }); })
      .catch(() => { if (isMounted) setSlotState({ status: "error" }); });
    return () => { isMounted = false; };
  }, [form.serviceId, form.appointmentDate, form.staffUserId, mode, appointmentId, isOfferAppointment, usesCustomService]);

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
            setLoadedAppointment(appointment);
            setCustomServiceMode(
              Boolean(appointment.customServiceName && !appointment.serviceId),
            );
          } else if (mode === "create" && (prefillPatientId || prefillServiceId)) {
            setForm((current) => {
              const selectedService = optionsResponse.services.find(
                (service) => service.id === prefillServiceId,
              );
              return {
                ...current,
                patientId: prefillPatientId || current.patientId,
                serviceId: prefillServiceId || current.serviceId,
                durationMinutes:
                  selectedService?.durationMinutes?.toString() ||
                  current.durationMinutes,
              };
            });
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
  }, [appointmentId, mode, prefillPatientId, prefillServiceId]);

  useEffect(() => {
    let isMounted = true;

    if (mode !== "create" || !sourceFollowUpId) {
      Promise.resolve().then(() => {
        if (isMounted) setSourceFollowUp(null);
      });
      return () => {
        isMounted = false;
      };
    }

    getTenantFollowUp(sourceFollowUpId)
      .then((followUp) => {
        if (isMounted) setSourceFollowUp(followUp);
      })
      .catch(() => {
        if (isMounted) setSourceFollowUp(null);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, sourceFollowUpId]);

  return (
    <CenterAdminShell
      activeNav="appointments"
      requiredPermission={
        mode === "create" ? "appointments:create" : "appointments:update"
      }
      subtitle={(dictionary) => dictionary.appointments.subtitle}
      title={(dictionary) =>
        mode === "create"
          ? dictionary.appointments.addAppointment
          : dictionary.appointments.editAppointment
      }
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const followUpText = followUpContextCopy[locale];

        const submit = async () => {
          if (isWriteBlocked) {
            return;
          }

          const nextErrors = validateForm(
            form,
            dictionary,
            isOfferAppointment,
            usesCustomService,
          );

          setErrors(nextErrors);
          setConflictDetails(null);
          setSaveError(null);

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

            if (mode === "create" && sourceFollowUpId) {
              await updateTenantFollowUpStatus(sourceFollowUpId, "BOOKED").catch(
                () => undefined,
              );
            }

            router.push(`/tenant/appointments/${saved.id}`);
          } catch (error) {
            const extracted = extractConflictDetails(error);
            const fieldErrors = extractErrors(error, dictionary);
            setErrors(fieldErrors);
            setConflictDetails(extracted);
            if (Object.keys(fieldErrors).length === 0 && !extracted) {
              const apiMessage =
                isApiRequestError(error) &&
                error.details &&
                typeof error.details === "object" &&
                "message" in error.details &&
                typeof (error.details as { message?: unknown }).message === "string"
                  ? (error.details as { message: string }).message
                  : null;
              setSaveError(apiMessage || dictionary.appointments.saveError);
            }
          } finally {
            setIsSaving(false);
          }
        };

        const followUpRuleWarnings = getFollowUpRuleWarnings(form, dictionary);
        const followUpPlanPreview = getFollowUpPlanPreview(form);
        const applyFollowUpPreset = (preset: "LASER" | "HIJAMA" | "SKINCARE") => {
          if (preset === "LASER") {
            setForm({
              ...form,
              followUpEnabled: true,
              followUpType: "SESSION_PLAN",
              defaultIntervalDays: "30",
              totalRecommendedSessions: "8",
              followUpRules: [
                { fromSessionNumber: "1", toSessionNumber: "4", intervalDays: "30" },
                { fromSessionNumber: "5", toSessionNumber: "8", intervalDays: "40" },
              ],
            });
            return;
          }
          setForm({
            ...form,
            followUpEnabled: true,
            followUpType: "FIXED_INTERVAL",
            defaultIntervalDays: preset === "HIJAMA" ? "90" : "30",
            totalRecommendedSessions: "",
          });
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
                {sourceFollowUp ? (
                  <section className="mb-5 rounded-lg border border-[#D8DEE8] bg-[#F8FAFC] p-4">
                    <h2 className="text-base font-bold text-[#0B2D5C]">
                      {followUpText.title}
                    </h2>
                    {sourceFollowUp.lastTreatment ? (
                      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
                        <ContextDetail
                          label={followUpText.provider}
                          value={
                            sourceFollowUp.lastTreatment.provider?.fullName ||
                            dictionary.common.notAvailable
                          }
                        />
                        <ContextDetail
                          label={followUpText.duration}
                          value={`${sourceFollowUp.lastTreatment.durationMinutes} ${dictionary.services.durationUnitMinutes}`}
                        />
                        <ContextDetail
                          label={followUpText.treatmentDetails}
                          value={formatDateOnly(
                            sourceFollowUp.lastTreatment.appointmentDate,
                          )}
                        />
                        <ContextNote
                          label={followUpText.previousNotes}
                          value={sourceFollowUp.lastTreatment.notes}
                        />
                        <ContextNote
                          label={followUpText.internalNotes}
                          value={sourceFollowUp.lastTreatment.internalNotes}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#66758a]">
                        {followUpText.empty}
                      </p>
                    )}
                    {sourceFollowUp.treatmentTimeline.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-sm font-bold text-[#24364f]">
                          {followUpText.timeline}
                        </h3>
                        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {sourceFollowUp.treatmentTimeline.map((item) => (
                            <div
                              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#24364f]"
                              key={`${item.type}-${item.id}`}
                            >
                              {followUpText.session} {item.sessionNumber} —{" "}
                              {item.type === "COMPLETED"
                                ? followUpText.completed
                                : followUpText.followUp}
                              {item.provider?.fullName ? (
                                <span className="mt-1 block text-xs text-[#66758a]">
                                  {followUpText.provider}:{" "}
                                  {item.provider.fullName}
                                </span>
                              ) : null}
                              <span className="mt-1 block text-xs text-[#66758a]">
                                {formatDateOnly(item.date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}
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
                  {isOfferAppointment ? (
                    <Field label={dictionary.appointments.service}>
                      <div className="flex min-h-11 items-center gap-2 rounded-md border border-[#D8DEE8] bg-[#F8FAFC] px-3 text-sm text-[#132238]">
                        <span>🎁</span>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold truncate">
                            {loadedAppointment?.offerTitle ?? dictionary.appointments.service}
                          </p>
                          {loadedAppointment?.offerPrice ? (
                            <p className="text-xs text-[#66758a]">
                              {loadedAppointment.offerPrice}{" "}
                              {loadedAppointment.offerCurrency}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Field>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="mb-3 flex w-fit items-center gap-2 text-sm font-bold text-[#24364f]">
                        <input
                          checked={customServiceMode}
                          onChange={(event) => {
                            const enabled = event.target.checked;
                            setCustomServiceMode(enabled);
                            setForm({
                              ...form,
                              customServiceName: enabled
                                ? form.customServiceName
                                : "",
                              customServicePrice: enabled
                                ? form.customServicePrice
                                : "",
                              saveCustomService: enabled
                                ? form.saveCustomService
                                : false,
                              serviceId: enabled ? "" : form.serviceId,
                              startTime: "",
                            });
                          }}
                          type="checkbox"
                        />
                        {dictionary.appointments.customService}
                      </label>

                      {usesCustomService ? (
                        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                          <Field
                            error={errors.customServiceName}
                            label={dictionary.appointments.customServiceName}
                          >
                            <input
                              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  customServiceName: event.target.value,
                                })
                              }
                              value={form.customServiceName}
                            />
                          </Field>
                          <Field
                            error={errors.durationMinutes}
                            helper={dictionary.appointments.customServiceDurationHelper}
                            label={
                              dictionary.appointments.customServiceDuration
                            }
                          >
                            <div className="relative flex items-center">
                              <input
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 pe-20 text-sm text-[#132238]"
                                min="1"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    durationMinutes: event.target.value,
                                  })
                                }
                                placeholder={dictionary.appointments.customServiceDurationPlaceholder}
                                type="number"
                                value={form.durationMinutes}
                              />
                              <span className="pointer-events-none absolute end-3 select-none text-sm text-[#66758a]">
                                {dictionary.services.durationUnitMinutes}
                              </span>
                            </div>
                          </Field>
                          <Field
                            error={errors.customServicePrice}
                            helper={dictionary.appointments.customServicePriceHelper}
                            label={dictionary.appointments.customServicePrice}
                          >
                            <div className="relative flex items-center">
                              <input
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 pe-10 text-sm text-[#132238]"
                                min="0"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    customServicePrice: event.target.value,
                                  })
                                }
                                placeholder={dictionary.appointments.customServicePricePlaceholder}
                                step="0.01"
                                type="number"
                                value={form.customServicePrice}
                              />
                              <span className="pointer-events-none absolute end-3 select-none text-sm text-[#66758a]">₪</span>
                            </div>
                          </Field>
                          <label className="flex items-center gap-2 text-sm font-bold text-[#24364f] md:col-span-3">
                            <input
                              checked={form.saveCustomService}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  saveCustomService: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            {dictionary.appointments.saveCustomService}
                          </label>
                          {form.saveCustomService ? (
                            <div className="md:col-span-3">
                              <section className="mt-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h2 className="text-base font-bold text-[#0B2D5C]">
                                      {dictionary.services.followUpSettings}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#66758a]">
                                      {dictionary.services.followUpDescription}
                                    </p>
                                    <p className="mt-2 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                                      {
                                        dictionary.appointments
                                          .followUpCreatedAfterCompletionHelper
                                      }
                                    </p>
                                  </div>
                                  <label className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] bg-white px-3 text-sm font-semibold text-[#24364f]">
                                    <input
                                      checked={form.followUpEnabled}
                                      onChange={(event) =>
                                        setForm({
                                          ...form,
                                          followUpEnabled: event.target.checked,
                                        })
                                      }
                                      type="checkbox"
                                    />
                                    {dictionary.services.enableFollowUpPlan}
                                  </label>
                                </div>
                                {form.followUpEnabled ? (
                                  <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field label={dictionary.services.planType}>
                                      <select
                                        className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            followUpType: event.target.value as
                                              | "FIXED_INTERVAL"
                                              | "SESSION_PLAN",
                                          })
                                        }
                                        value={form.followUpType}
                                      >
                                        <option value="FIXED_INTERVAL">
                                          {dictionary.services.fixedInterval}
                                        </option>
                                        <option value="SESSION_PLAN">
                                          {dictionary.services.sessionPlan}
                                        </option>
                                      </select>
                                    </Field>
                                    <Field label={dictionary.services.defaultIntervalDays}>
                                      <input
                                        className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                        min="1"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            defaultIntervalDays: event.target.value,
                                          })
                                        }
                                        step="1"
                                        type="number"
                                        value={form.defaultIntervalDays}
                                      />
                                    </Field>
                                    <Field label={dictionary.services.totalRecommendedSessions}>
                                      <input
                                        className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                        min="1"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            totalRecommendedSessions: event.target.value,
                                          })
                                        }
                                        step="1"
                                        type="number"
                                        value={form.totalRecommendedSessions}
                                      />
                                    </Field>
                                    <label className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] bg-white px-3 text-sm font-semibold text-[#24364f]">
                                      <input
                                        checked={form.autoCreateNextReminder}
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            autoCreateNextReminder: event.target.checked,
                                          })
                                        }
                                        type="checkbox"
                                      />
                                      {dictionary.services.createNextReminderAutomatically}
                                    </label>
                                    <div className="md:col-span-2">
                                      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                                        {(
                                          [
                                            { key: "LASER" as const, label: dictionary.services.laserPreset },
                                            { key: "HIJAMA" as const, label: dictionary.services.hijamaPreset },
                                            { key: "SKINCARE" as const, label: dictionary.services.skincarePreset },
                                          ] as const
                                        ).map((preset) => (
                                          <button
                                            className={buttonClassName("secondary", "sm", "justify-between bg-white")}
                                            key={preset.key}
                                            onClick={() => applyFollowUpPreset(preset.key)}
                                            type="button"
                                          >
                                            <span>{preset.label}</span>
                                            <span className="text-[#C8A45D]">
                                              {dictionary.services.applyPreset}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {form.followUpType === "SESSION_PLAN" ? (
                                      <div className="md:col-span-2">
                                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <h3 className="text-sm font-bold text-[#24364f]">
                                              {dictionary.services.sessionPlan}
                                            </h3>
                                            <p className="mt-1 text-sm leading-6 text-[#66758a]">
                                              {dictionary.services.followUpRuleHelper}
                                            </p>
                                          </div>
                                          <button
                                            className={buttonClassName("secondary", "sm", "shrink-0")}
                                            onClick={() =>
                                              setForm({
                                                ...form,
                                                followUpRules: [
                                                  ...form.followUpRules,
                                                  {
                                                    fromSessionNumber: "",
                                                    toSessionNumber: "",
                                                    intervalDays: "",
                                                  },
                                                ],
                                              })
                                            }
                                            type="button"
                                          >
                                            {dictionary.services.addRule}
                                          </button>
                                        </div>
                                        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
                                          {form.followUpRules.map((rule, index) => (
                                            <div
                                              className="rounded-lg border border-[#D8DEE8] bg-white p-4 shadow-[0_10px_24px_rgba(11,45,92,0.04)]"
                                              key={`custom-follow-up-rule-${index}`}
                                            >
                                              <div className="flex items-start justify-between gap-3">
                                                <div>
                                                  <h4 className="text-sm font-bold text-[#0B2D5C]">
                                                    {dictionary.services.phaseTitle(index + 1)}
                                                  </h4>
                                                  <p className="mt-1 text-xs font-semibold text-[#66758a]">
                                                    {dictionary.services.sessionsFrom}{" "}
                                                    {rule.fromSessionNumber || "-"}{" "}
                                                    {dictionary.services.sessionsTo}{" "}
                                                    {rule.toSessionNumber || "-"}
                                                  </p>
                                                  {parseFollowUpRuleValue(rule.intervalDays) ? (
                                                    <p className="mt-2 text-sm font-bold text-[#0B2D5C]">
                                                      <span aria-hidden="true">⏰ </span>
                                                      {dictionary.services.reminderAfterDays(
                                                        Number(rule.intervalDays),
                                                      )}
                                                    </p>
                                                  ) : null}
                                                </div>
                                              </div>
                                              <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                                                {(
                                                  [
                                                    "fromSessionNumber",
                                                    "toSessionNumber",
                                                    "intervalDays",
                                                  ] as FollowUpRuleField[]
                                                ).map((field) => (
                                                  <label className="block min-w-0" key={field}>
                                                    <span className="text-xs font-bold text-[#24364f]">
                                                      {followUpRuleLabel(dictionary, field)}
                                                    </span>
                                                    <input
                                                      className="mt-1 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                                      min="1"
                                                      onChange={(event) => {
                                                        const nextRules = [
                                                          ...form.followUpRules,
                                                        ];
                                                        nextRules[index] = {
                                                          ...nextRules[index],
                                                          [field]: event.target.value,
                                                        };
                                                        setForm({
                                                          ...form,
                                                          followUpRules: nextRules,
                                                        });
                                                      }}
                                                      type="number"
                                                      value={rule[field]}
                                                    />
                                                  </label>
                                                ))}
                                              </div>
                                              <div className="mt-4 flex justify-end">
                                                <button
                                                  className={buttonClassName("danger", "sm")}
                                                  onClick={() =>
                                                    setForm({
                                                      ...form,
                                                      followUpRules: form.followUpRules.filter(
                                                        (_, ruleIndex) => ruleIndex !== index,
                                                      ),
                                                    })
                                                  }
                                                  type="button"
                                                >
                                                  {dictionary.services.deletePhase}
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        {followUpRuleWarnings.length > 0 ? (
                                          <div className="mt-3 space-y-2 rounded-lg border border-[#F7DFA8] bg-[#FFF8E7] p-3">
                                            {followUpRuleWarnings.map((warning) => (
                                              <p
                                                className="text-sm font-semibold text-[#8A5A00]"
                                                key={warning}
                                              >
                                                {warning}
                                              </p>
                                            ))}
                                          </div>
                                        ) : null}
                                        <div className="mt-4 rounded-lg border border-[#D8DEE8] bg-white p-4">
                                          <h3 className="text-sm font-bold text-[#0B2D5C]">
                                            {dictionary.services.planPreview}
                                          </h3>
                                          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                            {followUpPlanPreview.map((item) => (
                                              <div
                                                className="rounded-md bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#24364f]"
                                                key={`custom-follow-up-preview-${item.session}`}
                                              >
                                                {dictionary.services.previewSessionLine(
                                                  item.session,
                                                  item.interval,
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : null}
                                    <Field
                                      className="md:col-span-2"
                                      label={dictionary.services.whatsappMessageArabic}
                                    >
                                      <textarea
                                        className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                        dir="rtl"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            reminderMessageAr: event.target.value,
                                          })
                                        }
                                        value={form.reminderMessageAr}
                                      />
                                    </Field>
                                    <Field label={dictionary.services.whatsappMessageEnglish}>
                                      <textarea
                                        className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            reminderMessageEn: event.target.value,
                                          })
                                        }
                                        value={form.reminderMessageEn}
                                      />
                                    </Field>
                                    <Field label={dictionary.services.whatsappMessageHebrew}>
                                      <textarea
                                        className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                        dir="rtl"
                                        onChange={(event) =>
                                          setForm({
                                            ...form,
                                            reminderMessageHe: event.target.value,
                                          })
                                        }
                                        value={form.reminderMessageHe}
                                      />
                                    </Field>
                                  </div>
                                ) : null}
                              </section>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-[#66758a] md:col-span-3">
                              {dictionary.appointments.followUpPlanLockedHelper}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
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
                                  startTime: "",
                                });
                              }}
                              value={form.serviceId}
                            >
                              <option value="">
                                {dictionary.appointments.service}
                              </option>
                              {options?.services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {getLocalizedAppointmentServiceName(
                                    service,
                                    locale,
                                  )}
                                </option>
                              ))}
                            </select>
                          </Field>
                          {mode === "edit" && loadedAppointment?.customServiceSaved && form.serviceId ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {dictionary.appointments.savedServiceBadge}
                              </span>
                            </div>
                          ) : null}
                          {mode === "edit" && loadedAppointment?.service?.followUpEnabled === true && form.serviceId ? (
                            <div className="mt-2 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                              <span>{dictionary.appointments.followUpActiveInService}</span>
                              {" "}
                              <Link
                                className="underline hover:text-sky-900"
                                href={`/tenant/services/${form.serviceId}`}
                              >
                                {dictionary.appointments.editServiceFollowUp}
                              </Link>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}
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
                          startTime: "",
                        })
                      }
                      type="date"
                      value={form.appointmentDate}
                    />
                  </Field>
                  <div className="min-w-0 md:col-span-2">
                    <span className="text-sm font-semibold text-[#24364f]">
                      {dictionary.appointments.startTime}
                    </span>
                    <div className="mt-2">
                      {isOfferAppointment || usesCustomService ? (
                        <input
                          className="min-h-11 w-full max-w-xs rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                          onChange={(e) =>
                            setForm({ ...form, startTime: e.target.value })
                          }
                          type="time"
                          value={form.startTime}
                        />
                      ) : slotState.status === "prompt" ? (
                        <p className="text-sm text-[#66758a]">
                          {dictionary.appointments.selectServiceAndDate}
                        </p>
                      ) : slotState.status === "loading" ? (
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-9 w-16 animate-pulse rounded-md bg-[#E5E7EB]"
                            />
                          ))}
                        </div>
                      ) : slotState.status === "error" ? (
                        <p className="text-sm text-[#B42318]">
                          {dictionary.appointments.loadError}
                        </p>
                      ) : slotState.slots.length === 0 ? (
                        <p className="text-sm text-[#66758a]">
                          {dictionary.appointments.noSlots}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {slotState.slots.map(({ time, available }) => {
                            const isSelected = form.startTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={!available}
                                onClick={() =>
                                  setForm({ ...form, startTime: time })
                                }
                                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                                  isSelected
                                    ? "border-[#0B2D5C] bg-[#0B2D5C] text-white"
                                    : available
                                      ? "border-[#D8DEE8] bg-white text-[#24364f] hover:border-[#0B2D5C] hover:bg-[#F0F4FA]"
                                      : "cursor-not-allowed border-[#E5E7EB] bg-[#F8FAFC] text-[#A0AEC0] line-through"
                                }`}
                              >
                                {time}
                                {!available && (
                                  <span className="ms-1 text-[10px] font-normal">
                                    · {dictionary.appointments.slotBooked}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {errors.startTime ? (
                      <span className="mt-1 block text-xs font-semibold text-[#B42318]">
                        {errors.startTime}
                      </span>
                    ) : null}
                  </div>
                  {!usesCustomService ? (
                    <Field
                      error={errors.durationMinutes}
                      helper={dictionary.appointments.durationMinutesHelper}
                      label={dictionary.appointments.durationMinutes}
                    >
                      <div className="relative flex items-center">
                        <input
                          className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 pe-20 text-sm text-[#132238]"
                          min="1"
                          onChange={(event) =>
                            setForm({
                              ...form,
                              durationMinutes: event.target.value,
                            })
                          }
                          placeholder={dictionary.appointments.durationMinutesPlaceholder}
                          type="number"
                          value={form.durationMinutes}
                        />
                        <span className="pointer-events-none absolute end-3 select-none text-sm text-[#66758a]">
                          {dictionary.services.durationUnitMinutes}
                        </span>
                      </div>
                    </Field>
                  ) : null}
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
                  <Field
                    error={errors.endTime}
                    label={dictionary.appointments.endTime}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] bg-[#F8FAFC] px-3 text-sm text-[#66758a]"
                      readOnly
                      value={calculateEndTime(
                        form.startTime,
                        form.durationMinutes,
                      )}
                    />
                  </Field>
                  <Field
                    className="md:col-span-2"
                    helper={dictionary.appointments.notesHelper}
                    label={dictionary.appointments.notes}
                  >
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
                    helper={dictionary.appointments.internalNotesHelper}
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

                {saveError ? (
                  <p className="mt-4 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
                    {saveError}
                  </p>
                ) : null}

                {isWriteBlocked ? (
                  <p className="mt-4 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
                    {restrictionMessage}
                  </p>
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
                    disabled={isSaving || isWriteBlocked}
                    onClick={submit}
                    title={restrictionMessage || undefined}
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
  helper,
  label,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  helper?: string;
  label: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-sm font-semibold text-[#24364f]">{label}</span>
      <span className="mt-2 block">{children}</span>
      {helper ? (
        <span className="mt-1 block text-xs text-[#66758a]">{helper}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ContextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <span className="block text-xs font-bold text-[#66758a]">{label}</span>
      <span className="mt-1 block break-words text-sm font-bold text-[#132238]">
        {value}
      </span>
    </div>
  );
}

function ContextNote({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;

  return (
    <div className="rounded-md bg-white p-3 md:col-span-3">
      <span className="block text-xs font-bold text-[#66758a]">{label}</span>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#132238]">
        {value}
      </p>
    </div>
  );
}
