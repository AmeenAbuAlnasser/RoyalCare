"use client";

import { useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import type {
  CenterPatient,
  PatientGender,
  PatientPayload,
  PatientStatus,
} from "@/lib/api/center-patients";

export type PatientFormState = {
  dateOfBirth: string;
  email: string;
  fullName: string;
  fullNameAr: string;
  fullNameHe: string;
  fullNameEn: string;
  gender: PatientGender;
  nationalId: string;
  notes: string;
  phone: string;
  status: PatientStatus;
};

export type PatientFormErrors = Partial<Record<keyof PatientFormState, string>>;

export function patientToForm(patient?: CenterPatient): PatientFormState {
  return {
    dateOfBirth: patient?.dateOfBirth?.slice(0, 10) ?? "",
    email: patient?.email ?? "",
    fullName: patient?.fullName ?? "",
    fullNameAr: patient?.fullNameAr ?? "",
    fullNameHe: patient?.fullNameHe ?? "",
    fullNameEn: patient?.fullNameEn ?? "",
    gender: patient?.gender ?? "UNKNOWN",
    nationalId: patient?.nationalId ?? "",
    notes: patient?.notes ?? "",
    phone: patient?.phone ?? "",
    status: patient?.status ?? "ACTIVE",
  };
}

export function formToPayload(form: PatientFormState): PatientPayload {
  return {
    dateOfBirth: form.dateOfBirth || null,
    email: form.email || null,
    fullName: form.fullName,
    fullNameAr: form.fullNameAr || null,
    fullNameHe: form.fullNameHe || null,
    fullNameEn: form.fullNameEn || null,
    gender: form.gender,
    nationalId: form.nationalId || null,
    notes: form.notes || null,
    phone: form.phone,
    status: form.status,
  };
}

export function PatientFormModal({
  dictionary,
  errors,
  form,
  isSaving,
  mode,
  onChange,
  onClose,
  onSubmit,
}: {
  dictionary: CenterAdminDictionary;
  errors: PatientFormErrors;
  form: PatientFormState;
  isSaving: boolean;
  mode: "create" | "edit";
  onChange: (nextForm: PatientFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [showExtraNames, setShowExtraNames] = useState(
    !!(form.fullNameAr || form.fullNameHe || form.fullNameEn),
  );

  const title =
    mode === "create"
      ? dictionary.patients.addPatient
      : dictionary.patients.editPatient;

  const submitLabel =
    mode === "create" ? dictionary.patients.submit : dictionary.patients.update;
  const optionalLabel = getOptionalLabel(dictionary);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#0B2D5C]/45 p-0 sm:items-center sm:justify-center sm:p-4">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg border border-[#E5E7EB] bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-lg">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0B2D5C]">{title}</h2>
          <button
            className={buttonClassName("secondary", "sm")}
            onClick={onClose}
            type="button"
          >
            {dictionary.common.close}
          </button>
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            error={errors.fullName}
            label={dictionary.patients.fullName}
            required
          >
            <input
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
              onChange={(event) =>
                onChange({ ...form, fullName: event.target.value })
              }
              value={form.fullName}
            />
          </Field>

          <div className="flex items-end md:col-span-2">
            <button
              className="text-xs font-medium text-[#1D4ED8] hover:underline"
              onClick={() => setShowExtraNames((v) => !v)}
              type="button"
            >
              {showExtraNames ? "▾" : "▸"}{" "}
              {dictionary.patients.namesOptionalHint.split(":")[0]}
            </button>
          </div>

          {showExtraNames && (
            <>
              <p className="text-xs text-[#6B7280] md:col-span-2">
                {dictionary.patients.namesOptionalHint}
              </p>
              <Field
                error={errors.fullNameAr}
                label={dictionary.patients.fullNameAr}
                optionalLabel={optionalLabel}
              >
                <input
                  className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  dir="rtl"
                  onChange={(event) =>
                    onChange({ ...form, fullNameAr: event.target.value })
                  }
                  value={form.fullNameAr}
                />
              </Field>
              <Field
                error={errors.fullNameHe}
                label={dictionary.patients.fullNameHe}
                optionalLabel={optionalLabel}
              >
                <input
                  className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  dir="rtl"
                  onChange={(event) =>
                    onChange({ ...form, fullNameHe: event.target.value })
                  }
                  value={form.fullNameHe}
                />
              </Field>
              <Field
                error={errors.fullNameEn}
                label={dictionary.patients.fullNameEn}
                optionalLabel={optionalLabel}
              >
                <input
                  className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                  dir="ltr"
                  onChange={(event) =>
                    onChange({ ...form, fullNameEn: event.target.value })
                  }
                  value={form.fullNameEn}
                />
              </Field>
            </>
          )}

          <Field
            error={errors.phone}
            label={dictionary.patients.phone}
            required
          >
            <input
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
              dir="ltr"
              onChange={(event) =>
                onChange({ ...form, phone: event.target.value })
              }
              value={form.phone}
            />
          </Field>
          <Field
            error={errors.email}
            label={dictionary.patients.email}
            optionalLabel={optionalLabel}
          >
            <input
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
              dir="ltr"
              onChange={(event) =>
                onChange({ ...form, email: event.target.value })
              }
              value={form.email}
            />
          </Field>
          <Field
            error={errors.gender}
            label={dictionary.patients.gender}
            optionalLabel={optionalLabel}
          >
            <select
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
              onChange={(event) =>
                onChange({
                  ...form,
                  gender: event.target.value as PatientGender,
                })
              }
              value={form.gender}
            >
              {(["UNKNOWN", "MALE", "FEMALE", "OTHER"] as const).map(
                (gender) => (
                  <option key={gender} value={gender}>
                    {dictionary.patientGenders[gender]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field
            error={errors.dateOfBirth}
            label={dictionary.patients.dateOfBirth}
            optionalLabel={optionalLabel}
          >
            <input
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
              onChange={(event) =>
                onChange({ ...form, dateOfBirth: event.target.value })
              }
              type="date"
              value={form.dateOfBirth}
            />
          </Field>
          <Field
            error={errors.nationalId}
            label={dictionary.patients.nationalId}
            optionalLabel={optionalLabel}
          >
            <input
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
              onChange={(event) =>
                onChange({ ...form, nationalId: event.target.value })
              }
              value={form.nationalId}
            />
          </Field>
          <Field error={errors.status} label={dictionary.patients.status} required>
            <select
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238]"
              onChange={(event) =>
                onChange({
                  ...form,
                  status: event.target.value as PatientStatus,
                })
              }
              value={form.status}
            >
              {(["ACTIVE", "INACTIVE", "ARCHIVED"] as const).map((status) => (
                <option key={status} value={status}>
                  {dictionary.patientStatuses[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            className="md:col-span-2"
            error={errors.notes}
            label={getAdditionalNotesLabel(dictionary)}
            optionalLabel={optionalLabel}
          >
            <textarea
              className="min-h-28 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
              onChange={(event) =>
                onChange({ ...form, notes: event.target.value })
              }
              value={form.notes}
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className={buttonClassName("secondary", "md")}
            onClick={onClose}
            type="button"
          >
            {dictionary.common.cancel}
          </button>
          <button
            className={buttonClassName("primary", "md")}
            disabled={isSaving}
            onClick={onSubmit}
            type="button"
          >
            {isSaving ? dictionary.common.saving : submitLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function getOptionalLabel(dictionary: CenterAdminDictionary) {
  const common = dictionary.common as { optional?: string };
  if (common.optional) return common.optional;
  if (dictionary.patients.addPatient === "إضافة مريض") return "اختياري";
  if (dictionary.patients.addPatient === "הוספת מטופל") return "אופציונלי";
  return "Optional";
}

function getAdditionalNotesLabel(dictionary: CenterAdminDictionary) {
  if (dictionary.patients.notes === "ملاحظات") return "ملاحظات إضافية";
  if (dictionary.patients.notes === "Notes") return "Additional notes";
  if (dictionary.patients.notes === "הערות") return "הערות נוספות";
  return dictionary.patients.notes;
}

function Field({
  children,
  className = "",
  error,
  label,
  optionalLabel,
  required = false,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  label: string;
  optionalLabel?: string;
  required?: boolean;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="flex min-w-0 flex-wrap items-baseline gap-1 text-sm font-semibold text-[#24364f]">
        <span>{label}</span>
        {required ? <span className="text-[#B42318]"> *</span> : null}
        {!required && optionalLabel ? (
          <span className="text-xs font-medium text-[#8B98AA]">
            ({optionalLabel})
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
