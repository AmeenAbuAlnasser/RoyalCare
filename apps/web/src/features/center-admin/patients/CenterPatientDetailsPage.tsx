"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { ButtonTooltip } from "@/components/ui/ButtonTooltip";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatDate } from "@/i18n/formatters";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  deleteTenantPatient,
  generatePatientPortalToken,
  getPatient,
  updatePatient,
  updatePatientStatus,
  type CenterPatient,
} from "@/lib/api/center-patients";
import {
  listTenantFollowUps,
  type TenantPatientFollowUp,
} from "@/lib/api/tenant-follow-ups";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";
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

const followUpTimelineCopy = {
  en: {
    title: "Follow-up timeline",
    subtitle: "Upcoming and recent treatment reminders for this patient.",
    openFollowUps: "Open follow-ups",
    session: "Session",
    dueDate: "Due",
    empty: "No follow-up reminders have been created for this patient yet.",
    statuses: {
      DUE: "Due",
      UPCOMING: "Upcoming",
      CONTACTED: "Contacted",
      BOOKED: "Booked",
      COMPLETED: "Completed",
      MISSED: "Missed",
      CANCELLED: "Cancelled",
    },
  },
  ar: {
    title: "سجل المتابعة",
    subtitle: "تذكيرات العلاج القادمة والسابقة لهذا المريض.",
    openFollowUps: "فتح المتابعات",
    session: "الجلسة",
    dueDate: "الاستحقاق",
    empty: "لم يتم إنشاء تذكيرات متابعة لهذا المريض بعد.",
    statuses: {
      DUE: "مستحقة",
      UPCOMING: "قادمة",
      CONTACTED: "تم التواصل",
      BOOKED: "محجوزة",
      COMPLETED: "مكتملة",
      MISSED: "فائتة",
      CANCELLED: "ملغاة",
    },
  },
  he: {
    title: "ציר מעקב",
    subtitle: "תזכורות טיפול קרובות וקודמות עבור המטופל.",
    openFollowUps: "פתיחת מעקבים",
    session: "מפגש",
    dueDate: "יעד",
    empty: "עדיין לא נוצרו תזכורות מעקב למטופל זה.",
    statuses: {
      DUE: "להיום",
      UPCOMING: "קרוב",
      CONTACTED: "נוצר קשר",
      BOOKED: "נקבע",
      COMPLETED: "הושלם",
      MISSED: "פוספס",
      CANCELLED: "בוטל",
    },
  },
} as const;

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
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [portalStatus, setPortalStatus] = useState<"idle" | "generating" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [followUps, setFollowUps] = useState<TenantPatientFollowUp[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    let isMounted = true;

    listTenantFollowUps({ patientId })
      .then((response) => {
        if (isMounted) {
          setFollowUps(response.items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFollowUps([]);
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
      {({ dictionary, session }) => {
        const canUpdate = session.permissions.includes("patients:update");
        const canUpdateStatus = session.permissions.includes("patients:status");
        const canDelete = session.permissions.includes("patients:delete");
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

        const handleDeleteConfirm = async () => {
          if (!patient) return;
          setIsDeleting(true);
          try {
            await deleteTenantPatient(patient.id);
            router.push("/tenant/patients");
          } catch (error) {
            setIsDeleteConfirmOpen(false);
            if (error instanceof ApiRequestError) {
              const details = error.details as { errors?: { patient?: string } } | null;
              setNotice(details?.errors?.patient ?? dictionary.patients.deleteBlocked);
            } else {
              setNotice(dictionary.patients.deleteBlocked);
            }
          } finally {
            setIsDeleting(false);
          }
        };

        const generatePortalLink = async () => {
          setPortalStatus("generating");
          setPortalToken(null);
          try {
            const result = await generatePatientPortalToken(patientId);
            setPortalToken(result.token);
            setPortalStatus("idle");
          } catch {
            setPortalStatus("error");
          }
        };

        const portalUrl = portalToken
          ? `${window.location.origin}/c/${session.center.slug}/patient/${portalToken}`
          : null;

        const copyPortalLink = async () => {
          if (!portalUrl) return;
          try {
            await navigator.clipboard.writeText(portalUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2500);
          } catch {
            // fallback: select the text if clipboard denied
          }
        };

        const whatsAppPortalUrl = (() => {
          if (!portalUrl || !patient?.phone) return null;
          const code = readWhatsAppDefaultCode();
          const normalized = normalizeForWhatsApp(patient.phone, code);
          if (!/^\d{7,15}$/.test(normalized)) return null;
          return `https://wa.me/${normalized}?text=${encodeURIComponent(portalUrl)}`;
        })();

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
                  {canUpdate ? (
                    <button
                      className={buttonClassName("secondary", "md")}
                      onClick={openEdit}
                      type="button"
                    >
                      {dictionary.common.edit}
                    </button>
                  ) : null}
                  {canUpdateStatus ? (
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
                  ) : null}
                  {canDelete ? (
                    patient.canDelete ? (
                      <button
                        className={buttonClassName("danger", "md")}
                        onClick={() => setIsDeleteConfirmOpen(true)}
                        type="button"
                      >
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
                          className={buttonClassName("danger", "md")}
                          disabled
                          type="button"
                        >
                          {dictionary.patients.deletePatient}
                        </button>
                      </ButtonTooltip>
                    )
                  ) : null}
                </>
              ) : null}
            </div>

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
                action={
                <button
                  className={buttonClassName("secondary", "md", "mt-4")}
                  onClick={() => router.push("/tenant/patients")}
                  type="button"
                >
                  {dictionary.nav.patients}
                </button>
                }
                className="mt-5"
                title={dictionary.patients.notFound}
                tone="error"
              />
            ) : null}

            {patient && !isLoading ? (
              <AdminCard className="mt-5 p-5">
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
              </AdminCard>
            ) : null}

            {patient && !isLoading ? (
              <AdminCard className="mt-5 p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2D5C]">
                      {followUpTimelineCopy[locale].title}
                    </h3>
                    <p className="mt-1 text-sm text-[#66758a]">
                      {followUpTimelineCopy[locale].subtitle}
                    </p>
                  </div>
                  <Link
                    className={buttonClassName("secondary", "sm")}
                    href={`/tenant/follow-ups?patientId=${patient.id}`}
                  >
                    {followUpTimelineCopy[locale].openFollowUps}
                  </Link>
                </div>
                {followUps.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {followUps.slice(0, 5).map((followUp) => (
                      <div
                        className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                        key={followUp.id}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#24364f]">
                              {followUp.title}
                            </p>
                            <p className="mt-1 text-xs text-[#66758a]">
                              {followUpTimelineCopy[locale].session}{" "}
                              {followUp.sessionNumber ?? "-"} ·{" "}
                              {followUpTimelineCopy[locale].dueDate}{" "}
                              {formatDate(followUp.dueDate, locale)}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0B2D5C]">
                            {followUpTimelineCopy[locale].statuses[
                              followUp.status
                            ] ?? followUp.status}
                          </span>
                        </div>
                        {followUp.notes ? (
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#66758a]">
                            {followUp.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-dashed border-[#D8DEE8] p-4 text-sm text-[#66758a]">
                    {followUpTimelineCopy[locale].empty}
                  </p>
                )}
              </AdminCard>
            ) : null}

            {patient && !isLoading ? (
              <AdminCard className="mt-5 p-5">
                <h3 className="mb-4 text-sm font-bold text-[#0B2D5C]">
                  {dictionary.patients.patientPortal.title}
                </h3>

                {portalStatus === "error" && (
                  <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {dictionary.patients.patientPortal.error}
                  </p>
                )}

                {!portalToken ? (
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={portalStatus === "generating"}
                    onClick={generatePortalLink}
                    type="button"
                  >
                    {portalStatus === "generating"
                      ? dictionary.patients.patientPortal.generating
                      : dictionary.patients.patientPortal.generate}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                      <span
                        className="min-w-0 flex-1 truncate text-xs text-[#66758a]"
                        dir="ltr"
                      >
                        {portalUrl}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2">
                      <button
                        className={buttonClassName("primary", "md")}
                        onClick={copyPortalLink}
                        type="button"
                      >
                        {copied
                          ? dictionary.patients.patientPortal.copied
                          : dictionary.patients.patientPortal.copyLink}
                      </button>
                      <a
                        className={buttonClassName("secondary", "md")}
                        href={portalUrl ?? "#"}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {dictionary.patients.patientPortal.openPortal}
                      </a>
                      {whatsAppPortalUrl && (
                        <a
                          className="inline-flex items-center gap-2 rounded-lg border border-[#25D366] bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                          href={whatsAppPortalUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {dictionary.patients.patientPortal.shareWhatsApp}
                        </a>
                      )}
                      <button
                        className={buttonClassName("secondary", "md")}
                        onClick={generatePortalLink}
                        type="button"
                      >
                        {dictionary.patients.patientPortal.generate}
                      </button>
                    </div>
                  </div>
                )}
              </AdminCard>
            ) : null}

            {isDeleteConfirmOpen ? (
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
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      type="button"
                    >
                      {dictionary.common.cancel}
                    </button>
                  </div>
                </div>
              </div>
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
