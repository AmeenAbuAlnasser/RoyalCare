"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type {
  CenterAdminDictionary,
  CenterRoleKey,
} from "@/i18n/dictionaries/center-admin";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  createTenantStaff,
  getTenantStaff,
  updateTenantStaff,
  type TenantStaffStatus,
} from "@/lib/api/tenant-staff";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formToPayload,
  staffToForm,
  type TenantStaffFormErrors,
  type TenantStaffFormState,
} from "./staff-form";

const roles: CenterRoleKey[] = [
  "CENTER_OWNER",
  "CENTER_MANAGER",
  "DOCTOR",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "STAFF",
];

function validateForm(
  form: TenantStaffFormState,
  mode: "create" | "edit",
  dictionary: CenterAdminDictionary,
) {
  const errors: TenantStaffFormErrors = {};

  if (!form.fullName.trim()) {
    errors.fullName = dictionary.staff.fieldRequired;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = dictionary.staff.invalidEmail;
  }

  if (mode === "create" && !form.password.trim()) {
    errors.password = dictionary.staff.fieldRequired;
  } else if (form.password.trim() && form.password.length < 8) {
    errors.password = dictionary.staff.invalidPassword;
  }

  return errors;
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
    Object.keys(source).map((key) => {
      const fallback =
        key === "email"
          ? error.status === 409
            ? dictionary.staff.duplicateEmail
            : dictionary.staff.invalidEmail
          : key === "password"
            ? dictionary.staff.invalidPassword
            : dictionary.staff.fieldRequired;

      return [key, fallback];
    }),
  ) as TenantStaffFormErrors;
}

export function TenantStaffFormPage({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const staffId = params.id;
  const [form, setForm] = useState<TenantStaffFormState>(() => staffToForm());
  const [errors, setErrors] = useState<TenantStaffFormErrors>({});
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !staffId) {
      return;
    }

    let isMounted = true;

    getTenantStaff(staffId)
      .then((staff) => {
        if (isMounted) {
          setForm(staffToForm(staff));
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
  }, [mode, staffId]);

  return (
    <CenterAdminShell
      activeNav="staff"
      requiredPermission={mode === "create" ? "staff:create" : "staff:update"}
      subtitle={(dictionary) => dictionary.staff.subtitle}
      title={(dictionary) =>
        mode === "create" ? dictionary.staff.addStaff : dictionary.staff.editStaff
      }
    >
      {({ dictionary }) => {
        const submit = async () => {
          const nextErrors = validateForm(form, mode, dictionary);

          setErrors(nextErrors);

          if (Object.keys(nextErrors).length > 0) {
            return;
          }

          setIsSaving(true);

          try {
            const saved =
              mode === "edit" && staffId
                ? await updateTenantStaff(staffId, formToPayload(form, mode))
                : await createTenantStaff(
                    formToPayload(form, mode) as TenantStaffFormState,
                  );

            router.push(`/tenant/staff/${saved.id}`);
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
                href="/tenant/staff"
              >
                {dictionary.nav.staff}
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.staff.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.staff.notFound}
              </p>
            ) : null}

            {!isLoading && !loadError ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  <Field error={errors.fullName} label={dictionary.staff.fullName}>
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, fullName: event.target.value })
                      }
                      value={form.fullName}
                    />
                  </Field>
                  <Field error={errors.email} label={dictionary.staff.email}>
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      dir="ltr"
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      type="email"
                      value={form.email}
                    />
                  </Field>
                  <Field
                    error={errors.password}
                    label={dictionary.staff.password}
                    optionalLabel={
                      mode === "edit" ? dictionary.staff.passwordOptional : undefined
                    }
                  >
                    <input
                      autoComplete="new-password"
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      type="password"
                      value={form.password}
                    />
                  </Field>
                  <Field error={errors.role} label={dictionary.staff.role}>
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          role: event.target.value as CenterRoleKey,
                        })
                      }
                      value={form.role}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {dictionary.roles[role]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field error={errors.status} label={dictionary.staff.status}>
                    <select
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as TenantStaffStatus,
                        })
                      }
                      value={form.status}
                    >
                      <option value="ACTIVE">
                        {dictionary.staffStatuses.ACTIVE}
                      </option>
                      <option value="INACTIVE">
                        {dictionary.staffStatuses.INACTIVE}
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    className={buttonClassName("secondary", "md")}
                    href="/tenant/staff"
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
                        ? dictionary.staff.submit
                        : dictionary.staff.update}
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
