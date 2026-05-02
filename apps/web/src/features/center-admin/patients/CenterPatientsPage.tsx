"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatDate } from "@/i18n/formatters";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  createPatient,
  listPatients,
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

  const source = (details as { errors?: Record<string, unknown> }).errors;

  if (!source) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => {
      if (key === "phone" && error.status === 409) {
        return [key, dictionary.patients.duplicatePhone];
      }

      if (key === "phone") {
        return [key, dictionary.patients.invalidPhone];
      }

      if (key === "fullName") {
        return [key, dictionary.patients.fieldRequired];
      }

      return [key, typeof value === "string" ? value : dictionary.patients.fieldRequired];
    }),
  ) as PatientFormErrors;
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

function compactPhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

function matchesSearch(patient: CenterPatient, search: string) {
  const term = normalizeSearch(search);

  if (!term) {
    return true;
  }

  const name = normalizeSearch(patient.fullName);
  const phone = normalizeSearch(patient.phone);
  const compactedPhone = compactPhone(phone);
  const compactedTerm = compactPhone(term);

  return (
    name.includes(term) ||
    phone.includes(term) ||
    compactedPhone.includes(compactedTerm)
  );
}

export function CenterPatientsPage() {
  const { locale } = useLanguage();
  const [patients, setPatients] = useState<CenterPatient[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [activePatient, setActivePatient] = useState<CenterPatient | null>(null);
  const [form, setForm] = useState<PatientFormState>(() => patientToForm());
  const [formErrors, setFormErrors] = useState<PatientFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    listPatients()
      .then((response) => {
        if (isMounted) {
          setPatients(response.items);
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

  const openCreate = () => {
    setActivePatient(null);
    setForm(patientToForm());
    setFormErrors({});
    setModalMode("create");
  };

  const openEdit = (patient: CenterPatient) => {
    setActivePatient(patient);
    setForm(patientToForm(patient));
    setFormErrors({});
    setModalMode("edit");
  };

  const refresh = async () => {
    const response = await listPatients();
    setPatients(response.items);
  };

  return (
    <CenterAdminShell
      activeNav="patients"
      subtitle={(dictionary) => dictionary.patients.subtitle}
      title={(dictionary) => dictionary.patients.title}
    >
      {({ dictionary }) => {
        const filteredPatients = patients.filter((patient) =>
          matchesSearch(patient, search),
        );

        const patientCards = filteredPatients.map((patient) => (
          <article
            className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
            key={patient.id}
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-base font-semibold text-[#0B2D5C]">
                  {patient.fullName}
                </h2>
                <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                  {patient.phone}
                </p>
                <p className="mt-1 break-words text-sm text-[#66758a]">
                  {patient.email || dictionary.common.notAvailable}
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                {dictionary.patientStatuses[patient.status]}
              </span>
            </div>
            <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Detail
                label={dictionary.patients.gender}
                value={dictionary.patientGenders[patient.gender]}
              />
              <Detail
                label={dictionary.patients.createdAt}
                value={formatDate(patient.createdAt, locale)}
              />
            </dl>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                className={buttonClassName("secondary", "sm")}
                href={`/tenant/patients/${patient.id}`}
              >
                {dictionary.common.view}
              </Link>
              <button
                className={buttonClassName("secondary", "sm")}
                onClick={() => openEdit(patient)}
                type="button"
              >
                {dictionary.common.edit}
              </button>
              <button
                className={buttonClassName(
                  patient.status === "ARCHIVED" ? "success" : "warning",
                  "sm",
                )}
                onClick={async () => {
                  const nextStatus =
                    patient.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
                  const updated = await updatePatientStatus(
                    patient.id,
                    nextStatus,
                  );
                  setPatients((current) =>
                    current.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  );
                  setNotice(
                    nextStatus === "ARCHIVED"
                      ? dictionary.patients.archived
                      : dictionary.patients.activated,
                  );
                }}
                type="button"
              >
                {patient.status === "ARCHIVED"
                  ? dictionary.common.activate
                  : dictionary.common.archive}
              </button>
            </div>
          </article>
        ));

        const submit = async () => {
          setFormErrors({});
          setIsSaving(true);
          setNotice("");

          try {
            if (modalMode === "edit" && activePatient) {
              await updatePatient(activePatient.id, formToPayload(form));
            } else {
              await createPatient(formToPayload(form));
            }

            await refresh();
            setModalMode(null);
            setNotice(dictionary.patients.saved);
          } catch (error) {
            setFormErrors(extractErrors(error, dictionary));
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <>
            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    className="min-h-11 min-w-0 flex-1 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={dictionary.patients.searchPlaceholder}
                    value={search}
                  />
                </div>
                <button
                  className={buttonClassName("primary", "md")}
                  onClick={openCreate}
                  type="button"
                >
                  {dictionary.patients.addPatient}
                </button>
              </div>
            </section>

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
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.patients.loadError}
              </p>
            ) : null}

            {!isLoading && !loadError && patients.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">
                  {dictionary.patients.emptyTitle}
                </h2>
                <p className="mt-2 text-sm text-[#66758a]">
                  {dictionary.patients.emptyBody}
                </p>
              </section>
            ) : null}

            {!isLoading &&
            !loadError &&
            patients.length > 0 &&
            filteredPatients.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">
                  {dictionary.patients.noResultsTitle}
                </h2>
                <p className="mt-2 text-sm text-[#66758a]">
                  {dictionary.patients.noResultsBody}
                </p>
              </section>
            ) : null}

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {patientCards}
            </section>

            {modalMode ? (
              <PatientFormModal
                dictionary={dictionary}
                errors={formErrors}
                form={form}
                isSaving={isSaving}
                mode={modalMode}
                onChange={setForm}
                onClose={() => setModalMode(null)}
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
