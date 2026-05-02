"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatDate } from "@/i18n/formatters";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  getPatient,
  updatePatient,
  updatePatientStatus,
  type CenterPatient,
} from "@/lib/api/center-patients";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formToPayload,
  PatientFormModal,
  patientToForm,
  type PatientFormErrors,
  type PatientFormState,
} from "./PatientFormModal";

function extractErrors(error: unknown, dictionary: CenterAdminDictionary) {
  if (!(error instanceof ApiRequestError)) {
    return {};
  }

  const details = error.details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const errors = (details as { errors?: Record<string, unknown> }).errors;

  if (!errors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [
      key,
      key === "phone"
        ? dictionary.patients.invalidPhone
        : typeof value === "string"
          ? value
          : dictionary.patients.fieldRequired,
    ]),
  ) as PatientFormErrors;
}

export function CenterPatientDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { locale } = useLanguage();
  const patientId = params.id;
  const [patient, setPatient] = useState<CenterPatient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<PatientFormState>(() => patientToForm());
  const [formErrors, setFormErrors] = useState<PatientFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    getPatient(patientId)
      .then((response) => {
        if (isMounted) {
          setPatient(response);
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
  }, [patientId]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 4000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  return (
    <CenterAdminShell
      activeNav="patients"
      subtitle={(dictionary) => dictionary.patients.subtitle}
      title={(dictionary) => dictionary.patients.detailsTitle}
    >
      {({ dictionary }) => {
        const openEdit = () => {
          if (!patient) {
            return;
          }

          setForm(patientToForm(patient));
          setFormErrors({});
          setIsEditing(true);
        };

        const submit = async () => {
          if (!patient) {
            return;
          }

          setFormErrors({});
          setIsSaving(true);
          setNotice("");

          try {
            const updated = await updatePatient(patient.id, formToPayload(form));
            setPatient(updated);
            setIsEditing(false);
            setNotice(dictionary.patients.saved);
          } catch (error) {
            setFormErrors(extractErrors(error, dictionary));
          } finally {
            setIsSaving(false);
          }
        };

        const changeStatus = async () => {
          if (!patient) {
            return;
          }

          const nextStatus =
            patient.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
          const updated = await updatePatientStatus(patient.id, nextStatus);
          setPatient(updated);
          setNotice(
            nextStatus === "ARCHIVED"
              ? dictionary.patients.archived
              : dictionary.patients.activated,
          );
        };

        return (
          <>
            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/patients"
              >
                {dictionary.nav.patients}
              </Link>
              {patient ? (
                <>
                  <button
                    className={buttonClassName("secondary", "md")}
                    onClick={openEdit}
                    type="button"
                  >
                    {dictionary.common.edit}
                  </button>
                  <button
                    className={buttonClassName(
                      patient.status === "ARCHIVED" ? "success" : "warning",
                      "md",
                    )}
                    onClick={changeStatus}
                    type="button"
                  >
                    {patient.status === "ARCHIVED"
                      ? dictionary.common.activate
                      : dictionary.common.archive}
                  </button>
                </>
              ) : null}
            </div>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.patients.loading}
              </p>
            ) : null}

            {loadError ? (
              <section className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-6">
                <h2 className="text-base font-semibold text-[#B42318]">
                  {dictionary.patients.notFound}
                </h2>
                <button
                  className={buttonClassName("secondary", "md", "mt-4")}
                  onClick={() => router.push("/tenant/patients")}
                  type="button"
                >
                  {dictionary.nav.patients}
                </button>
              </section>
            ) : null}

            {patient && !isLoading ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-[#0B2D5C]">
                      {patient.fullName}
                    </h2>
                    <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                      {patient.phone}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                    {dictionary.patientStatuses[patient.status]}
                  </span>
                </div>

                <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Detail
                    label={dictionary.patients.email}
                    value={patient.email || dictionary.common.notAvailable}
                  />
                  <Detail
                    label={dictionary.patients.gender}
                    value={dictionary.patientGenders[patient.gender]}
                  />
                  <Detail
                    label={dictionary.patients.dateOfBirth}
                    value={
                      patient.dateOfBirth
                        ? formatDate(patient.dateOfBirth, locale)
                        : dictionary.common.notAvailable
                    }
                  />
                  <Detail
                    label={dictionary.patients.nationalId}
                    value={patient.nationalId || dictionary.common.notAvailable}
                  />
                  <Detail
                    label={dictionary.patients.createdAt}
                    value={formatDate(patient.createdAt, locale)}
                  />
                  <Detail
                    label={dictionary.patients.updatedAt}
                    value={formatDate(patient.updatedAt, locale)}
                  />
                </dl>

                <div className="mt-5 rounded-md bg-[#F8FAFC] p-4">
                  <h3 className="text-sm font-semibold text-[#24364f]">
                    {dictionary.patients.notes}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#66758a]">
                    {patient.notes || dictionary.common.notAvailable}
                  </p>
                </div>
              </section>
            ) : null}

            {isEditing ? (
              <PatientFormModal
                dictionary={dictionary}
                errors={formErrors}
                form={form}
                isSaving={isSaving}
                mode="edit"
                onChange={setForm}
                onClose={() => setIsEditing(false)}
                onSubmit={submit}
              />
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
