"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  createTenantInvoice,
  getTenantBillingOptions,
  type TenantBillingOptions,
} from "@/lib/api/tenant-billing";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type FormState = {
  patientId: string;
  serviceId: string;
  staffUserId: string;
  amount: string;
  currency: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState | "root", string>>;

function defaultForm(): FormState {
  return {
    patientId: "",
    serviceId: "",
    staffUserId: "",
    amount: "",
    currency: "ILS",
    notes: "",
  };
}

function validateForm(form: FormState, dictionary: CenterAdminDictionary): FormErrors {
  const errors: FormErrors = {};

  if (!form.patientId) errors.patientId = dictionary.billing.fieldRequired;
  if (!form.serviceId) errors.serviceId = dictionary.billing.fieldRequired;

  const amount = parseFloat(form.amount);

  if (!form.amount.trim() || isNaN(amount) || amount <= 0)
    errors.amount = dictionary.billing.invalidAmount;

  if (!form.currency.trim()) errors.currency = dictionary.billing.fieldRequired;

  return errors;
}

function extractErrors(error: unknown, dictionary: CenterAdminDictionary): FormErrors {
  if (!(error instanceof ApiRequestError)) return {};

  const details = error.details;

  if (!details || typeof details !== "object" || !("errors" in details)) return {};

  const source = (details as { errors?: Record<string, unknown> }).errors;

  if (!source) return {};

  const mapped: FormErrors = {};

  for (const key of Object.keys(source)) {
    if (key === "patientId") mapped.patientId = dictionary.billing.fieldRequired;
    else if (key === "serviceId") mapped.serviceId = dictionary.billing.fieldRequired;
    else if (key === "amount") mapped.amount = dictionary.billing.invalidAmount;
    else if (key === "staffUserId") mapped.staffUserId = dictionary.billing.fieldRequired;
    else if (key === "currency") mapped.currency = dictionary.billing.fieldRequired;
  }

  return mapped;
}

function getServiceName(
  service: { nameEn: string; nameAr: string; nameHe: string },
  locale: string,
) {
  if (locale === "ar" && service.nameAr) return service.nameAr;
  if (locale === "he" && service.nameHe) return service.nameHe;
  return service.nameEn || service.nameAr || service.nameHe;
}

export function TenantInvoiceFormPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [options, setOptions] = useState<TenantBillingOptions | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getTenantBillingOptions()
      .then((data) => {
        if (isMounted) setOptions(data);
      })
      .catch(() => {
        if (isMounted) setOptionsError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CenterAdminShell
      activeNav="billing"
      subtitle={(d) => d.billing.subtitle}
      title={(d) => d.billing.addInvoice}
    >
      {({ dictionary }) => {
        const locale =
          typeof document !== "undefined"
            ? (document.documentElement.lang as string) || "en"
            : "en";

        const onServiceChange = (serviceId: string) => {
          const svc = options?.services.find((s) => s.id === serviceId);
          setForm((f) => ({
            ...f,
            serviceId,
            amount: svc?.price ?? f.amount,
            currency: svc?.currency ?? f.currency,
          }));
        };

        const submit = async () => {
          const nextErrors = validateForm(form, dictionary);
          setErrors(nextErrors);

          if (Object.keys(nextErrors).length > 0) return;

          setIsSaving(true);

          try {
            const saved = await createTenantInvoice({
              patientId: form.patientId,
              serviceId: form.serviceId,
              staffUserId: form.staffUserId || null,
              amount: form.amount,
              currency: form.currency.trim().toUpperCase(),
              notes: form.notes.trim() || null,
            });

            router.push(`/tenant/billing/${saved.id}`);
          } catch (error) {
            setErrors(extractErrors(error, dictionary));
          } finally {
            setIsSaving(false);
          }
        };

        if (optionsError) {
          return (
            <>
              <div className="mt-5">
                <Link className={buttonClassName("secondary", "md")} href="/tenant/billing">
                  {dictionary.nav.billing}
                </Link>
              </div>
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.billing.loadError}
              </p>
            </>
          );
        }

        if (!options) {
          return (
            <>
              <div className="mt-5">
                <Link className={buttonClassName("secondary", "md")} href="/tenant/billing">
                  {dictionary.nav.billing}
                </Link>
              </div>
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.billing.loading}
              </p>
            </>
          );
        }

        return (
          <>
            <div className="mt-5">
              <Link className={buttonClassName("secondary", "md")} href="/tenant/billing">
                {dictionary.nav.billing}
              </Link>
            </div>

            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">

                {/* Patient */}
                <Field error={errors.patientId} label={dictionary.billing.patient}>
                  <select
                    className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    value={form.patientId}
                  >
                    <option value="">— {dictionary.billing.selectPatient} —</option>
                    {options.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} · {p.phone}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Service */}
                <Field error={errors.serviceId} label={dictionary.billing.service}>
                  <select
                    className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                    onChange={(e) => onServiceChange(e.target.value)}
                    value={form.serviceId}
                  >
                    <option value="">— {dictionary.billing.selectService} —</option>
                    {options.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getServiceName(s, locale)}
                        {s.price ? ` · ${s.price} ${s.currency}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Provider (optional) */}
                <Field
                  error={errors.staffUserId}
                  label={dictionary.billing.provider}
                  optionalLabel={dictionary.billing.providerOptional}
                >
                  <select
                    className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                    onChange={(e) => setForm({ ...form, staffUserId: e.target.value })}
                    value={form.staffUserId}
                  >
                    <option value="">— {dictionary.billing.noProvider} —</option>
                    {options.providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Amount */}
                <Field error={errors.amount} label={dictionary.billing.amount}>
                  <input
                    className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                    dir="ltr"
                    inputMode="decimal"
                    min="0.01"
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    step="0.01"
                    type="number"
                    value={form.amount}
                  />
                </Field>

                {/* Currency */}
                <Field error={errors.currency} label={dictionary.billing.currency}>
                  <input
                    className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                    dir="ltr"
                    maxLength={10}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value.toUpperCase() })
                    }
                    placeholder="ILS / USD / EUR"
                    value={form.currency}
                  />
                </Field>

                {/* Notes (full width) */}
                <div className="md:col-span-2">
                  <Field
                    error={errors.notes}
                    label={dictionary.billing.notes}
                    optionalLabel={dictionary.billing.notesOptional}
                  >
                    <textarea
                      className="min-h-[96px] w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      value={form.notes}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  className={buttonClassName("secondary", "md")}
                  href="/tenant/billing"
                >
                  {dictionary.common.cancel}
                </Link>
                <button
                  className={buttonClassName("primary", "md")}
                  disabled={isSaving}
                  onClick={submit}
                  type="button"
                >
                  {isSaving ? dictionary.common.saving : dictionary.billing.submit}
                </button>
              </div>
            </section>
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function Field({
  children,
  error,
  label,
  optionalLabel,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  optionalLabel?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold text-[#24364f]">
        {label}
        {optionalLabel ? (
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
