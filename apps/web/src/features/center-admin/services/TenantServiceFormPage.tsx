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
          : key === "price"
            ? dictionary.services.invalidPrice
            : key === "currency"
              ? dictionary.services.invalidCurrency
              : dictionary.services.fieldRequired;

      return [key, typeof value === "string" ? fallback : fallback];
    }),
  ) as TenantServiceFormErrors;
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
