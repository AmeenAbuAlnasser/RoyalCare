"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { ButtonTooltip } from "@/components/ui/ButtonTooltip";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatAppointmentDateTime, formatNumber } from "@/i18n/formatters";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  createPatient,
  deleteTenantPatient,
  listPatients,
  updatePatient,
  updatePatientStatus,
  type CenterPatient,
  type PatientGender,
  type PatientStatus,
} from "@/lib/api/center-patients";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  canUseTenantAction,
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
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

function patientStatusBadgeClass(status: CenterPatient["status"]) {
  const base =
    "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold";

  if (status === "ACTIVE") {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (status === "ARCHIVED") {
    return `${base} border-slate-200 bg-slate-50 text-slate-600`;
  }

  return `${base} border-amber-200 bg-amber-50 text-amber-700`;
}

type GenderFilter = "ALL" | PatientGender;
type StatusFilter = "ALL" | PatientStatus;
type ArchiveFilter = "ALL" | "ACTIVE_ONLY" | "ARCHIVED_ONLY";
type BinaryFilter = "ALL" | "YES" | "NO";

function isThisMonth(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function getPatientInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase() || "P";
}

function formatMoneyAmount(value: number) {
  const sign = value < 0 ? "-" : "";
  const [whole, cents] = Math.abs(value).toFixed(2).split(".");

  return `${sign}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

function formatOutstandingBalance(patient: CenterPatient, fallback: string) {
  const amount = Number(patient.summary?.outstandingBalance ?? 0);

  if (amount <= 0) {
    return fallback;
  }

  return `${patient.summary.outstandingCurrency} ${formatMoneyAmount(amount)}`;
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  archive: "M20.25 7.5l-.625 10.632A2.25 2.25 0 0117.378 20.25H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0h-16.5m16.5 0l-.5-2.25A2.25 2.25 0 0017.55 3.5H6.45a2.25 2.25 0 00-2.2 1.75L3.75 7.5m5.25 4.5h6",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  chevron: "M19 9l-7 7-7-7",
  coin: "M12 6c-3.314 0-6 1.12-6 2.5S8.686 11 12 11s6-1.12 6-2.5S15.314 6 12 6zm-6 2.5v7C6 16.88 8.686 18 12 18s6-1.12 6-2.5v-7",
  file: "M9 12h6m-6 4h6M8 3h5l5 5v13H8a2 2 0 01-2-2V5a2 2 0 012-2z",
  patient: "M15 7a3 3 0 11-6 0 3 3 0 016 0zM5 21a7 7 0 0114 0",
  plus: "M12 5v14m7-7H5",
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z",
};

function KpiCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "emerald" | "slate" | "amber";
  value: string;
}) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  }[tone];

  return (
    <div className={`min-w-0 rounded-xl border p-4 ${toneClass}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/75">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-black leading-tight text-[#0B2D5C]" dir="ltr">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#EEF2F7] bg-[#F8FAFC] px-3 py-2">
      <dt className="truncate text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-[#24364f]" dir="auto">
        {value}
      </dd>
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  value,
  children,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="min-w-0 text-xs font-bold text-[#475569]">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-sm font-medium text-[#132238] focus:border-[#0B2D5C] focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

export function CenterPatientsPage() {
  const { locale } = useLanguage();
  const [patients, setPatients] = useState<CenterPatient[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("ALL");
  const [upcomingFilter, setUpcomingFilter] = useState<BinaryFilter>("ALL");
  const [receivablesFilter, setReceivablesFilter] = useState<BinaryFilter>("ALL");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [activePatient, setActivePatient] = useState<CenterPatient | null>(null);
  const [form, setForm] = useState<PatientFormState>(() => patientToForm());
  const [formErrors, setFormErrors] = useState<PatientFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CenterPatient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const patientStats = useMemo(() => {
    return {
      active: patients.filter((patient) => patient.status === "ACTIVE").length,
      archived: patients.filter((patient) => patient.status === "ARCHIVED").length,
      newThisMonth: patients.filter((patient) => isThisMonth(patient.createdAt)).length,
      total: patients.length,
    };
  }, [patients]);

  return (
    <CenterAdminShell
      activeNav="patients"
      subtitle={(dictionary) => dictionary.patients.subtitle}
      title={(dictionary) => dictionary.patients.title}
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const canCreate = canUseTenantAction(session, "patients:create");
        const canCreateAppointment = canUseTenantAction(session, "appointments:create");
        const canCreateInvoice = canUseTenantAction(session, "billing:create");
        const canUpdateStatus = canUseTenantAction(session, "patients:status");
        const canDeletePatients = session.permissions.includes("patients:delete");

        const handleDeleteConfirm = async () => {
          if (!deleteTarget) return;
          setIsDeleting(true);
          try {
            await deleteTenantPatient(deleteTarget.id);
            setPatients((current) =>
              current.filter((item) => item.id !== deleteTarget.id),
            );
            setDeleteTarget(null);
            setNotice(dictionary.patients.deleted);
          } catch {
            setDeleteTarget(null);
            setNotice(dictionary.patients.deleteBlocked);
          } finally {
            setIsDeleting(false);
          }
        };
        const filteredPatients = patients.filter((patient) => {
          if (!matchesSearch(patient, search)) return false;
          if (genderFilter !== "ALL" && patient.gender !== genderFilter) return false;
          if (statusFilter !== "ALL" && patient.status !== statusFilter) return false;
          if (archiveFilter === "ACTIVE_ONLY" && patient.status === "ARCHIVED") return false;
          if (archiveFilter === "ARCHIVED_ONLY" && patient.status !== "ARCHIVED") return false;
          const hasUpcoming = (patient.summary?.upcomingAppointmentsCount ?? 0) > 0;
          const hasReceivables = Number(patient.summary?.outstandingBalance ?? 0) > 0;
          if (upcomingFilter === "YES" && !hasUpcoming) return false;
          if (upcomingFilter === "NO" && hasUpcoming) return false;
          if (receivablesFilter === "YES" && !hasReceivables) return false;
          if (receivablesFilter === "NO" && hasReceivables) return false;
          return true;
        });

        const patientCards = filteredPatients.map((patient) => {
          const latestSummary = patient.summary?.latestSession ?? null;
          const latestSession = latestSummary
            ? formatAppointmentDateTime(
                latestSummary.appointmentDate,
                latestSummary.startTime,
                locale,
              )
            : dictionary.patients.noData;

          return (
          <AdminCard className="overflow-hidden p-0" key={patient.id}>
            <div className="p-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-lg font-black text-[#0B2D5C] ring-1 ring-[#CFE0F6]">
                  {getPatientInitial(patient.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-black text-[#0B2D5C]">
                        {patient.fullName}
                      </h2>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#66758a]">
                        <span dir="ltr">{patient.phone}</span>
                        <span className="truncate">{patient.email || dictionary.patients.noData}</span>
                      </div>
                    </div>
                    <span className={patientStatusBadgeClass(patient.status)}>
                      {dictionary.patientStatuses[patient.status]}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="mt-4 grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-5">
                <SummaryMetric
                  label={dictionary.patients.treatmentPlansCount}
                  value={formatNumber(patient.summary?.treatmentPlansCount ?? 0)}
                />
                <SummaryMetric
                  label={dictionary.patients.overdueSessionsCount}
                  value={formatNumber(patient.summary?.overdueSessionsCount ?? 0)}
                />
                <SummaryMetric
                  label={dictionary.patients.outstandingBalance}
                  value={formatOutstandingBalance(
                    patient,
                    dictionary.patients.noData,
                  )}
                />
                <SummaryMetric
                  label={dictionary.patients.lastSession}
                  value={latestSession}
                />
                <SummaryMetric
                  label={dictionary.patients.appointmentsCount}
                  value={formatNumber(patient.linkedRecordCounts.appointments)}
                />
              </dl>

              <div className="mt-4 border-t border-[#EEF2F7] pt-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">
                  {dictionary.patients.quickActions}
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <Link
                    aria-disabled={!canCreateAppointment}
                    className={
                      canCreateAppointment
                        ? "inline-flex min-h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                        : "pointer-events-none inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400"
                    }
                    href={`/tenant/appointments/new?patientId=${patient.id}`}
                    title={!canCreateAppointment ? restrictionMessage || dictionary.patients.unavailableAction : undefined}
                  >
                    <Icon path={ICONS.calendar} />
                    {dictionary.patients.createAppointment}
                  </Link>
                  <button
                    className="inline-flex min-h-9 cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400"
                    disabled
                    title={dictionary.patients.unavailableAction}
                    type="button"
                  >
                    <Icon path={ICONS.pulse} />
                    {dictionary.patients.createTreatmentPlan}
                  </button>
                  <Link
                    aria-disabled={!canCreateInvoice}
                    className={
                      canCreateInvoice
                        ? "inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                        : "pointer-events-none inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400"
                    }
                    href="/tenant/billing/new"
                    title={!canCreateInvoice ? restrictionMessage || dictionary.patients.unavailableAction : undefined}
                  >
                    <Icon path={ICONS.file} />
                    {dictionary.patients.createInvoice}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 border-t border-[#EEF2F7] bg-[#FBFDFF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap gap-2">
                <Link
                  className={buttonClassName("primary", "sm")}
                  href={`/tenant/patients/${patient.id}`}
                >
                  {dictionary.common.view}
                </Link>
                {session.permissions.includes("patients:update") ? (
                  <button
                    className={buttonClassName("secondary", "sm")}
                    disabled={isWriteBlocked}
                    onClick={() => openEdit(patient)}
                    title={restrictionMessage || undefined}
                    type="button"
                  >
                    {dictionary.common.edit}
                  </button>
                ) : null}
              </div>

              {(session.permissions.includes("patients:status") || canDeletePatients) ? (
                <details className="relative">
                  <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-3 text-xs font-bold text-[#374151] transition-colors hover:border-[#0B2D5C] hover:text-[#0B2D5C]">
                    {dictionary.patients.moreActions}
                    <Icon path={ICONS.chevron} />
                  </summary>
                  <div className="absolute end-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-lg">
                    {session.permissions.includes("patients:status") ? (
                      <button
                        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-start text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        disabled={isWriteBlocked}
                        onClick={async () => {
                          if (!canUpdateStatus) return;
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
                        title={restrictionMessage || undefined}
                        type="button"
                      >
                        <Icon path={ICONS.archive} />
                        {patient.status === "ARCHIVED"
                          ? dictionary.common.activate
                          : dictionary.common.archive}
                      </button>
                    ) : null}
                    {canDeletePatients ? (
                      patient.canDelete ? (
                        <button
                          className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-start text-xs font-bold text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(patient)}
                          type="button"
                        >
                          <Icon path={ICONS.archive} />
                          {dictionary.patients.deletePatient}
                        </button>
                      ) : (
                        <ButtonTooltip
                          text={(() => {
                            const c = patient.linkedRecordCounts;
                            const hasAny = c.appointments > 0 || c.invoices > 0 || c.payments > 0 || c.followUps > 0 || c.creditTransactions > 0;
                            return hasAny
                              ? dictionary.patients.deleteBlockedWithCounts(c)
                              : dictionary.patients.deleteBlockedTooltip;
                          })()}
                        >
                          <button
                            className="flex min-h-9 w-full cursor-not-allowed items-center gap-2 rounded-lg px-3 text-start text-xs font-bold text-slate-400"
                            disabled
                            type="button"
                          >
                            <Icon path={ICONS.archive} />
                            {dictionary.patients.deletePatient}
                          </button>
                        </ButtonTooltip>
                      )
                    ) : null}
                  </div>
                </details>
              ) : null}
            </div>
          </AdminCard>
          );
        });
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
            <section className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={<Icon path={ICONS.users} />}
                label={dictionary.patients.totalPatients}
                tone="blue"
                value={formatNumber(patientStats.total)}
              />
              <KpiCard
                icon={<Icon path={ICONS.patient} />}
                label={dictionary.patients.activePatients}
                tone="emerald"
                value={formatNumber(patientStats.active)}
              />
              <KpiCard
                icon={<Icon path={ICONS.archive} />}
                label={dictionary.patients.archivedPatients}
                tone="slate"
                value={formatNumber(patientStats.archived)}
              />
              <KpiCard
                icon={<Icon path={ICONS.plus} />}
                label={dictionary.patients.newPatientsThisMonth}
                tone="amber"
                value={formatNumber(patientStats.newThisMonth)}
              />
            </section>

            <AdminCard className="mt-4 p-4">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <input
                      className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#D8DEE8] px-3 text-sm text-[#132238] focus:border-[#0B2D5C] focus:outline-none"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={dictionary.patients.searchPlaceholder}
                      value={search}
                    />
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#D8DEE8] bg-white px-4 text-sm font-bold text-[#374151] lg:hidden"
                      onClick={() => setShowMobileFilters((value) => !value)}
                      type="button"
                    >
                      {dictionary.patients.filters}
                      <Icon path={ICONS.chevron} />
                    </button>
                  </div>
                  <div className={`${showMobileFilters ? "grid" : "hidden"} mt-3 min-w-0 grid-cols-1 gap-3 border-t border-[#EEF2F7] pt-3 sm:grid-cols-2 lg:grid lg:grid-cols-5 lg:border-t-0 lg:pt-0`}>
                    <FilterSelect
                      label={dictionary.patients.gender}
                      onChange={(value) => setGenderFilter(value as GenderFilter)}
                      value={genderFilter}
                    >
                      <option value="ALL">{dictionary.patients.allGenders}</option>
                      <option value="MALE">{dictionary.patientGenders.MALE}</option>
                      <option value="FEMALE">{dictionary.patientGenders.FEMALE}</option>
                      <option value="OTHER">{dictionary.patientGenders.OTHER}</option>
                      <option value="UNKNOWN">{dictionary.patientGenders.UNKNOWN}</option>
                    </FilterSelect>
                    <FilterSelect
                      label={dictionary.patients.status}
                      onChange={(value) => setStatusFilter(value as StatusFilter)}
                      value={statusFilter}
                    >
                      <option value="ALL">{dictionary.patients.allStatuses}</option>
                      <option value="ACTIVE">{dictionary.patientStatuses.ACTIVE}</option>
                      <option value="INACTIVE">{dictionary.patientStatuses.INACTIVE}</option>
                      <option value="ARCHIVED">{dictionary.patientStatuses.ARCHIVED}</option>
                    </FilterSelect>
                    <FilterSelect
                      label={dictionary.patients.archiveFilter}
                      onChange={(value) => setArchiveFilter(value as ArchiveFilter)}
                      value={archiveFilter}
                    >
                      <option value="ALL">{dictionary.patients.allArchiveStates}</option>
                      <option value="ACTIVE_ONLY">{dictionary.patients.activeOnly}</option>
                      <option value="ARCHIVED_ONLY">{dictionary.patients.archivedOnly}</option>
                    </FilterSelect>
                    <FilterSelect
                      label={dictionary.patients.hasUpcomingAppointment}
                      onChange={(value) => setUpcomingFilter(value as BinaryFilter)}
                      value={upcomingFilter}
                    >
                      <option value="ALL">{dictionary.patients.filterAll}</option>
                      <option value="YES">{dictionary.patients.filterYes}</option>
                      <option value="NO">{dictionary.patients.filterNo}</option>
                    </FilterSelect>
                    <FilterSelect
                      label={dictionary.patients.hasReceivables}
                      onChange={(value) => setReceivablesFilter(value as BinaryFilter)}
                      value={receivablesFilter}
                    >
                      <option value="ALL">{dictionary.patients.filterAll}</option>
                      <option value="YES">{dictionary.patients.filterYes}</option>
                      <option value="NO">{dictionary.patients.filterNo}</option>
                    </FilterSelect>
                  </div>
                </div>
                {session.permissions.includes("patients:create") ? (
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={!canCreate}
                    onClick={openCreate}
                    title={restrictionMessage || undefined}
                    type="button"
                  >
                    {dictionary.patients.addPatient}
                  </button>
                ) : null}
              </div>
            </AdminCard>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <AdminState
                className="mt-5"
                loading
                title={dictionary.patients.loading}
              />
            ) : null}

            {loadError ? (
              <AdminState
                className="mt-5"
                title={dictionary.patients.loadError}
                tone="error"
              />
            ) : null}

            {!isLoading && !loadError && patients.length === 0 ? (
              <AdminCard className="mt-5 border-dashed p-8">
                <div className="mx-auto flex max-w-md flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0B2D5C]">
                    <Icon path={ICONS.patient} />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-[#0B2D5C]">
                    {dictionary.patients.emptyTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#66758a]">
                    {dictionary.patients.emptyBody}
                  </p>
                  {session.permissions.includes("patients:create") ? (
                    <button
                      className={`${buttonClassName("primary", "md")} mt-5`}
                      disabled={!canCreate}
                      onClick={openCreate}
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.patients.addFirstPatient}
                    </button>
                  ) : null}
                </div>
              </AdminCard>
            ) : null}

            {!isLoading &&
            !loadError &&
            patients.length > 0 &&
            filteredPatients.length === 0 ? (
              <AdminState
                body={dictionary.patients.noResultsBody}
                className="mt-5 border-dashed"
                title={dictionary.patients.noResultsTitle}
              />
            ) : null}

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {patientCards}
            </section>

            {!isLoading && !loadError && patients.length > 0 ? (
              <div className="mt-4 flex min-w-0 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {dictionary.patients.paginationSummary(
                    filteredPatients.length,
                    patients.length,
                  )}
                </span>
                <span className="text-xs font-semibold text-[#94A3B8]">
                  {dictionary.patients.paginationPrepared}
                </span>
              </div>
            ) : null}

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

            {deleteTarget ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                  <h3 className="text-base font-bold text-[#0B2D5C]">
                    {dictionary.patients.deleteConfirmTitle}
                  </h3>
                  <p className="mt-2 text-sm text-[#66758a]">
                    {dictionary.patients.deleteConfirmBody}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <button
                      className={buttonClassName("danger", "md")}
                      disabled={isDeleting}
                      onClick={handleDeleteConfirm}
                      type="button"
                    >
                      {dictionary.patients.deleteConfirmButton}
                    </button>
                    <button
                      className={buttonClassName("secondary", "md")}
                      disabled={isDeleting}
                      onClick={() => setDeleteTarget(null)}
                      type="button"
                    >
                      {dictionary.common.cancel}
                    </button>
                  </div>
                </div>
              </div>
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
