"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  createTenantService,
  getTenantService,
  updateTenantService,
} from "@/lib/api/tenant-services";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formToPayload,
  serviceToForm,
  type TenantServiceFormErrors,
  type TenantServiceFormState,
} from "./service-form";

type ServiceLanguage = "EN" | "AR" | "HE";
type FollowUpRuleField =
  | "fromSessionNumber"
  | "toSessionNumber"
  | "intervalDays";

function requiredFieldsForLanguage(language: string) {
  if (language === "AR") {
    return {
      name: "nameAr",
    } as const;
  }

  if (language === "HE") {
    return {
      name: "nameHe",
    } as const;
  }

  return {
    name: "nameEn",
  } as const;
}

function validateForm(
  form: TenantServiceFormState,
  primaryLanguage: ServiceLanguage,
  dictionary: CenterAdminDictionary,
) {
  const requiredFields = requiredFieldsForLanguage(primaryLanguage);
  const nextErrors: TenantServiceFormErrors = {};
  const durationValue = Number(form.durationMinutes);
  const durationMinutes =
    form.durationUnit === "HOURS" ? durationValue * 60 : durationValue;
  const bufferValue = Number(form.bufferMinutes);

  if (!form[requiredFields.name].trim()) {
    nextErrors[requiredFields.name] = dictionary.services.fieldRequired;
  }

  if (
    form.durationMinutes &&
    (!Number.isFinite(durationValue) ||
      durationValue <= 0 ||
      !Number.isInteger(durationMinutes))
  ) {
    nextErrors.durationMinutes = dictionary.services.invalidDuration;
  }

  if (
    form.bufferMinutes &&
    (!Number.isFinite(bufferValue) ||
      bufferValue < 0 ||
      bufferValue > 240 ||
      !Number.isInteger(bufferValue))
  ) {
    nextErrors.bufferMinutes = dictionary.services.invalidBuffer;
  }

  if (form.followUpEnabled) {
    const intervalValue = Number(form.defaultIntervalDays);
    const totalValue = Number(form.totalRecommendedSessions);

    if (
      form.defaultIntervalDays &&
      (!Number.isInteger(intervalValue) || intervalValue <= 0)
    ) {
      nextErrors.defaultIntervalDays = dictionary.services.invalidDuration;
    }

    if (
      form.totalRecommendedSessions &&
      (!Number.isInteger(totalValue) || totalValue <= 0)
    ) {
      nextErrors.totalRecommendedSessions =
        dictionary.services.invalidDuration;
    }

    if (form.followUpType === "SESSION_PLAN") {
      const hasInvalidRule = form.followUpRules.some((rule) => {
        const from = Number(rule.fromSessionNumber);
        const to = Number(rule.toSessionNumber);
        const interval = Number(rule.intervalDays);

        return (
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          !Number.isInteger(interval) ||
          from <= 0 ||
          to < from ||
          interval <= 0
        );
      });

      if (hasInvalidRule) {
        nextErrors.followUpRules = dictionary.services.invalidDuration;
      }
    }
  }

  return nextErrors;
}

function extractErrors(error: unknown, dictionary: CenterAdminDictionary) {
  if (!(error instanceof ApiRequestError)) {
    return {};
  }

  const details = error.details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const source = (details as { errors?: Record<string, unknown> }).errors;

  if (!source) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => {
      const fallback =
        key === "durationMinutes"
          ? dictionary.services.invalidDuration
          : key === "bufferMinutes"
            ? dictionary.services.invalidBuffer
          : key === "price"
            ? dictionary.services.invalidPrice
            : key === "currency"
              ? dictionary.services.invalidCurrency
              : dictionary.services.fieldRequired;

      return [key, typeof value === "string" ? fallback : fallback];
    }),
  ) as TenantServiceFormErrors;
}

function parseRuleValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getRuleWarnings(
  form: TenantServiceFormState,
  dictionary: CenterAdminDictionary,
) {
  if (!form.followUpEnabled || form.followUpType !== "SESSION_PLAN") {
    return [];
  }

  const warnings: string[] = [];
  const normalized = form.followUpRules
    .map((rule) => ({
      from: parseRuleValue(rule.fromSessionNumber),
      to: parseRuleValue(rule.toSessionNumber),
      interval: parseRuleValue(rule.intervalDays),
    }))
    .filter(
      (rule): rule is { from: number; to: number; interval: number } =>
        rule.from !== null && rule.to !== null && rule.interval !== null,
    )
    .sort((a, b) => a.from - b.from);

  if (
    normalized.some(
      (rule) => rule.from <= 0 || rule.to <= 0 || rule.from > rule.to,
    )
  ) {
    warnings.push(dictionary.services.invalidRangeOrder);
  }

  if (normalized.some((rule) => rule.interval <= 0)) {
    warnings.push(dictionary.services.invalidIntervals);
  }

  if (
    normalized.some((rule, index) => {
      const nextRule = normalized[index + 1];
      return Boolean(nextRule && rule.to >= nextRule.from);
    })
  ) {
    warnings.push(dictionary.services.overlappingRanges);
  }

  const totalSessions = parseRuleValue(form.totalRecommendedSessions);
  if (totalSessions && normalized.length > 0) {
    const uncovered: number[] = [];

    for (let session = 1; session <= totalSessions; session += 1) {
      const covered = normalized.some(
        (rule) => session >= rule.from && session <= rule.to,
      );
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

function getPlanPreview(form: TenantServiceFormState) {
  const totalSessions = parseRuleValue(form.totalRecommendedSessions) ?? 8;
  const sessions = Array.from(
    { length: Math.min(totalSessions, 12) },
    (_, index) => index + 1,
  );

  return sessions
    .map((session) => {
      if (form.followUpType === "FIXED_INTERVAL") {
        const interval = parseRuleValue(form.defaultIntervalDays);
        return interval && interval > 0 ? { session, interval } : null;
      }

      const match = form.followUpRules.find((rule) => {
        const from = parseRuleValue(rule.fromSessionNumber);
        const to = parseRuleValue(rule.toSessionNumber);
        return from !== null && to !== null && session >= from && session <= to;
      });
      const interval = match
        ? parseRuleValue(match.intervalDays)
        : parseRuleValue(form.defaultIntervalDays);

      return interval && interval > 0 ? { session, interval } : null;
    })
    .filter((item): item is { session: number; interval: number } =>
      Boolean(item),
    );
}

function ruleLabel(
  dictionary: CenterAdminDictionary,
  field: FollowUpRuleField,
) {
  if (field === "fromSessionNumber") return dictionary.services.sessionsFrom;
  if (field === "toSessionNumber") return dictionary.services.sessionsTo;
  return dictionary.services.intervalDays;
}


export function TenantServiceFormPage({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const serviceId = params.id;
  const [form, setForm] = useState<TenantServiceFormState>(() =>
    serviceToForm(),
  );
  const [errors, setErrors] = useState<TenantServiceFormErrors>({});
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !serviceId) {
      return;
    }

    let isMounted = true;

    getTenantService(serviceId)
      .then((service) => {
        if (isMounted) {
          setForm(serviceToForm(service));
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
  }, [mode, serviceId]);

  return (
    <CenterAdminShell
      activeNav="services"
      requiredPermission={
        mode === "create" ? "services:create" : "services:update"
      }
      subtitle={(dictionary) => dictionary.services.subtitle}
      title={(dictionary) =>
        mode === "create"
          ? dictionary.services.addService
          : dictionary.services.editService
      }
    >
      {({ dictionary, session }) => {
        const primaryLanguage = session.center.primaryLanguage as ServiceLanguage;
        const requiredFields = requiredFieldsForLanguage(primaryLanguage);
        const followUpWarnings = getRuleWarnings(form, dictionary);
        const followUpPreview = getPlanPreview(form);
        const applyPreset = (
          preset: "LASER" | "HIJAMA" | "SKINCARE",
        ) => {
          if (preset === "LASER") {
            setForm({
              ...form,
              followUpEnabled: true,
              followUpType: "SESSION_PLAN",
              defaultIntervalDays: "30",
              totalRecommendedSessions: "8",
              followUpRules: [
                {
                  fromSessionNumber: "1",
                  toSessionNumber: "4",
                  intervalDays: "30",
                },
                {
                  fromSessionNumber: "5",
                  toSessionNumber: "8",
                  intervalDays: "40",
                },
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
        const submit = async () => {
          const nextErrors = validateForm(form, primaryLanguage, dictionary);

          setErrors(nextErrors);

          if (Object.keys(nextErrors).length > 0) {
            return;
          }

          setIsSaving(true);

          try {
            const saved =
              mode === "edit" && serviceId
                ? await updateTenantService(serviceId, formToPayload(form))
                : await createTenantService(formToPayload(form));

            router.push(`/tenant/services/${saved.id}`);
          } catch (error) {
            setErrors(extractErrors(error, dictionary));
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <>
            <div className="mt-5">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/services"
              >
                {dictionary.nav.services}
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.services.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.services.notFound}
              </p>
            ) : null}

            {!isLoading && !loadError ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    error={errors.nameEn}
                    isRequired={requiredFields.name === "nameEn"}
                    label={dictionary.services.nameEn}
                    optionalLabel={dictionary.services.optional}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, nameEn: event.target.value })
                      }
                      value={form.nameEn}
                    />
                  </Field>
                  <Field
                    error={errors.nameAr}
                    isRequired={requiredFields.name === "nameAr"}
                    label={dictionary.services.nameAr}
                    optionalLabel={dictionary.services.optional}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      dir="rtl"
                      onChange={(event) =>
                        setForm({ ...form, nameAr: event.target.value })
                      }
                      value={form.nameAr}
                    />
                  </Field>
                  <Field
                    error={errors.nameHe}
                    isRequired={requiredFields.name === "nameHe"}
                    label={dictionary.services.nameHe}
                    optionalLabel={dictionary.services.optional}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      dir="rtl"
                      onChange={(event) =>
                        setForm({ ...form, nameHe: event.target.value })
                      }
                      value={form.nameHe}
                    />
                  </Field>
                  <Field
                    error={errors.durationMinutes}
                    label={dictionary.services.durationMinutes}
                  >
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(120px,0.55fr)] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.45fr)]">
                      <input
                        className="min-h-11 w-full min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                        min="0"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            durationMinutes: event.target.value,
                          })
                        }
                        step="0.25"
                        type="number"
                        value={form.durationMinutes}
                      />
                      <select
                        className="min-h-11 w-full min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            durationUnit: event.target.value as
                              | "HOURS"
                              | "MINUTES",
                          })
                        }
                        value={form.durationUnit}
                      >
                        <option value="MINUTES">
                          {dictionary.services.durationUnitMinutes}
                        </option>
                        <option value="HOURS">
                          {dictionary.services.durationUnitHours}
                        </option>
                      </select>
                    </div>
                  </Field>
                  <Field error={errors.price} label={dictionary.services.price}>
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      min="0"
                      onChange={(event) =>
                        setForm({ ...form, price: event.target.value })
                      }
                      step="0.01"
                      type="number"
                      value={form.price}
                    />
                  </Field>
                  <Field
                    error={errors.bufferMinutes}
                    label={dictionary.services.bufferMinutes}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      max="240"
                      min="0"
                      onChange={(event) =>
                        setForm({ ...form, bufferMinutes: event.target.value })
                      }
                      step="1"
                      type="number"
                      value={form.bufferMinutes}
                    />
                  </Field>
                  <Field
                    error={errors.currency}
                    label={dictionary.services.currency}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm uppercase text-[#132238]"
                      dir="ltr"
                      maxLength={3}
                      onChange={(event) =>
                        setForm({ ...form, currency: event.target.value })
                      }
                      value={form.currency}
                    />
                  </Field>
                  <label className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#24364f]">
                    <input
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm({ ...form, isActive: event.target.checked })
                      }
                      type="checkbox"
                    />
                    {dictionary.serviceStatuses.ACTIVE}
                  </label>
                  <Field
                    className="md:col-span-2"
                    error={errors.descriptionEn}
                    label={dictionary.services.descriptionEn}
                    optionalLabel={dictionary.services.optional}
                  >
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          descriptionEn: event.target.value,
                        })
                      }
                      value={form.descriptionEn}
                    />
                  </Field>
                  <Field
                    className="md:col-span-2"
                    error={errors.descriptionAr}
                    label={dictionary.services.descriptionAr}
                    optionalLabel={dictionary.services.optional}
                  >
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      dir="rtl"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          descriptionAr: event.target.value,
                        })
                      }
                      value={form.descriptionAr}
                    />
                  </Field>
                  <Field
                    className="md:col-span-2"
                    error={errors.descriptionHe}
                    label={dictionary.services.descriptionHe}
                    optionalLabel={dictionary.services.optional}
                  >
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      dir="rtl"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          descriptionHe: event.target.value,
                        })
                      }
                      value={form.descriptionHe}
                    />
                  </Field>
                </div>

                <section className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2D5C]">
                        {dictionary.services.followUpSettings}
                      </h2>
                      <p className="mt-1 text-sm text-[#66758a]">
                        {dictionary.services.followUpDescription}
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
                      <Field
                        error={errors.defaultIntervalDays}
                        label={dictionary.services.defaultIntervalDays}
                      >
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
                      <Field
                        error={errors.totalRecommendedSessions}
                        label={
                          dictionary.services.totalRecommendedSessions
                        }
                        optionalLabel={dictionary.services.optional}
                      >
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
                          {[
                            {
                              key: "LASER" as const,
                              label: dictionary.services.laserPreset,
                            },
                            {
                              key: "HIJAMA" as const,
                              label: dictionary.services.hijamaPreset,
                            },
                            {
                              key: "SKINCARE" as const,
                              label: dictionary.services.skincarePreset,
                            },
                          ].map((preset) => (
                            <button
                              className={buttonClassName(
                                "secondary",
                                "sm",
                                "justify-between bg-white",
                              )}
                              key={preset.key}
                              onClick={() => applyPreset(preset.key)}
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
                              className={buttonClassName(
                                "secondary",
                                "sm",
                                "shrink-0",
                              )}
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
                                key={`follow-up-rule-${index}`}
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
                                    {parseRuleValue(rule.intervalDays) ? (
                                      <p className="mt-2 text-sm font-bold text-[#0B2D5C]">
                                        <span aria-hidden="true">⏰ </span>
                                        {dictionary.services.reminderAfterDays(
                                          Number(rule.intervalDays),
                                        )}
                                      </p>
                                    ) : null}
                                  </div>
                                  <button
                                    className={buttonClassName(
                                      "ghost",
                                      "sm",
                                      "shrink-0",
                                    )}
                                    onClick={(event) => {
                                      const input =
                                        event.currentTarget
                                          .closest("div.rounded-lg")
                                          ?.querySelector("input");
                                      input?.focus();
                                    }}
                                    type="button"
                                  >
                                    {dictionary.services.editPhase}
                                  </button>
                                </div>
                                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                                  {([
                                    "fromSessionNumber",
                                    "toSessionNumber",
                                    "intervalDays",
                                  ] as FollowUpRuleField[]).map((field) => (
                                    <label
                                      className="block min-w-0"
                                      key={field}
                                    >
                                      <span className="text-xs font-bold text-[#24364f]">
                                        {ruleLabel(dictionary, field)}
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
                                        followUpRules:
                                          form.followUpRules.filter(
                                            (_, ruleIndex) =>
                                              ruleIndex !== index,
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
                          {followUpWarnings.length > 0 ? (
                            <div className="mt-3 space-y-2 rounded-lg border border-[#F7DFA8] bg-[#FFF8E7] p-3">
                              {followUpWarnings.map((warning) => (
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
                              {followUpPreview.map((item) => (
                                <div
                                  className="rounded-md bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#24364f]"
                                  key={`preview-${item.session}`}
                                >
                                  {dictionary.services.previewSessionLine(
                                    item.session,
                                    item.interval,
                                  )}
                                </div>
                              ))}
                            </div>
                            {errors.followUpRules ? (
                              <p className="mt-3 text-xs font-semibold text-[#B42318]">
                                {errors.followUpRules}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      <Field
                        className="md:col-span-2"
                        label={dictionary.services.whatsappMessageArabic}
                        optionalLabel={dictionary.services.optional}
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
                      <Field
                        label={dictionary.services.whatsappMessageEnglish}
                        optionalLabel={dictionary.services.optional}
                      >
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
                      <Field
                        label={dictionary.services.whatsappMessageHebrew}
                        optionalLabel={dictionary.services.optional}
                      >
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

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    className={buttonClassName("secondary", "md")}
                    href="/tenant/services"
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
                        ? dictionary.services.submit
                        : dictionary.services.update}
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
  isRequired = false,
  label,
  optionalLabel,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  isRequired?: boolean;
  label: string;
  optionalLabel?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-sm font-semibold text-[#24364f]">
        {label}
        {isRequired ? (
          <span aria-hidden="true" className="text-[#B42318]">
            {" "}
            *
          </span>
        ) : optionalLabel ? (
          <span className="ms-2 text-xs font-medium text-[#66758a]">
            {optionalLabel}
          </span>
        ) : null}
      </span>
      <span className="mt-2 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
