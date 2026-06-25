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

// ─── Localised copy ──────────────────────────────────────────────────────────

const pageCopy = {
  en: {
    reasonForVisit: "Notes / Reason for visit",
    diagnosis: "Reason for visit / diagnosis",
    noDiagnosis: "No reason for visit or diagnosis notes have been recorded.",
    treatmentSummary: "Current Treatment",
    treatmentProgress: "Treatment progress",
    service: "Service / Treatment",
    totalSessions: "Total sessions",
    completedSessions: "Completed",
    remainingSessions: "Remaining",
    currentPhase: "Current phase",
    lastSession: "Last session",
    nextSession: "Next session",
    provider: "Treating provider",
    noTreatment: "No active treatment plan found.",
    appointment: "Appointment",
    followUp: "Follow-up",
    noProvider: "No provider assigned",
    progressLabel: (done: number, total: number) =>
      `${done} of ${total} sessions completed`,
    phaseLabel: (n: number) => `Phase ${n}`,
    timelineTitle: "Treatment Timeline",
    timelineSubtitle: "Complete session history and upcoming follow-ups.",
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
    reasonForVisit: "ملاحظات / سبب الزيارة",
    diagnosis: "سبب الزيارة / التشخيص",
    noDiagnosis: "لم يتم تسجيل سبب الزيارة أو ملاحظات التشخيص بعد.",
    treatmentSummary: "ملخص العلاج الحالي",
    treatmentProgress: "تقدم العلاج",
    service: "الخدمة / العلاج",
    totalSessions: "إجمالي الجلسات",
    completedSessions: "مكتملة",
    remainingSessions: "المتبقي",
    currentPhase: "المرحلة الحالية",
    lastSession: "آخر جلسة",
    nextSession: "الجلسة القادمة",
    provider: "المعالج",
    noTreatment: "لا توجد خطة علاج نشطة.",
    appointment: "موعد علاجي",
    followUp: "متابعة",
    noProvider: "لم يتم تعيين معالج",
    progressLabel: (done: number, total: number) =>
      `${done} من ${total} جلسة مكتملة`,
    phaseLabel: (n: number) => `مرحلة العلاج ${n}`,
    timelineTitle: "سجل جلسات العلاج",
    timelineSubtitle: "السجل الكامل للجلسات والمتابعات القادمة.",
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
    reasonForVisit: "הערות / סיבת הביקור",
    diagnosis: "סיבת הביקור / אבחנה",
    noDiagnosis: "טרם נרשמו סיבת ביקור או הערות אבחנה.",
    treatmentSummary: "סיכום טיפול נוכחי",
    treatmentProgress: "התקדמות טיפול",
    service: "שירות / טיפול",
    totalSessions: "סה״כ מפגשים",
    completedSessions: "הושלמו",
    remainingSessions: "נותרו",
    currentPhase: "שלב נוכחי",
    lastSession: "מפגש אחרון",
    nextSession: "מפגש הבא",
    provider: "מטפל",
    noTreatment: "לא נמצאה תוכנית טיפול פעילה.",
    appointment: "תור טיפולי",
    followUp: "מעקב",
    noProvider: "לא שובץ מטפל",
    progressLabel: (done: number, total: number) =>
      `${done} מתוך ${total} מפגשים הושלמו`,
    phaseLabel: (n: number) => `שלב ${n}`,
    timelineTitle: "ציר טיפולים",
    timelineSubtitle: "היסטוריית מפגשים ומעקבים קרובים.",
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

// ─── Status colours ───────────────────────────────────────────────────────────

type FollowUpStatus =
  | "DUE" | "UPCOMING" | "CONTACTED" | "BOOKED"
  | "COMPLETED" | "MISSED" | "CANCELLED";

const statusStyle: Record<FollowUpStatus, { badge: string; dot: string; card: string }> = {
  COMPLETED: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot:   "bg-emerald-500",
    card:  "border-emerald-100 bg-emerald-50/30",
  },
  UPCOMING: {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot:   "bg-blue-500",
    card:  "border-blue-100 bg-blue-50/30",
  },
  DUE: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot:   "bg-amber-500",
    card:  "border-amber-100 bg-amber-50/30",
  },
  BOOKED: {
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot:   "bg-indigo-500",
    card:  "border-indigo-100 bg-indigo-50/30",
  },
  CONTACTED: {
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    dot:   "bg-sky-500",
    card:  "border-sky-100 bg-sky-50/30",
  },
  MISSED: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot:   "bg-rose-500",
    card:  "border-rose-100 bg-rose-50/30",
  },
  CANCELLED: {
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    dot:   "bg-slate-400",
    card:  "border-slate-100 bg-slate-50/30",
  },
};

function getStatusStyle(status: string) {
  return statusStyle[status as FollowUpStatus] ?? statusStyle.UPCOMING;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getServiceName(
  service: TenantPatientFollowUp["service"],
  _locale: string,
): string {
  if (!service) return "";
  return service.nameEn || service.nameAr || service.nameHe;
}

type TreatmentTimelineEntry = TenantPatientFollowUp["treatmentTimeline"][number];

type UnifiedTimelineItem = {
  id: string;
  date: string;
  followUpId?: string;
  isFollowUp: boolean;
  providerName: string | null;
  serviceName: string;
  sessionNumber: number | null;
  status: string;
  title: string;
  type: TreatmentTimelineEntry["type"];
};

function getPrimaryFollowUp(followUps: TenantPatientFollowUp[]) {
  const activeFinite = followUps.find(
    (f) =>
      !f.isRecurring &&
      f.status !== "CANCELLED" &&
      (f.planTotalSessions ||
        (f.planPhases?.length ?? 0) > 0 ||
        f.service?.totalRecommendedSessions ||
        (f.service?.followUpRules?.length ?? 0) > 0 ||
        f.treatmentTimeline.length > 0),
  );

  return (
    activeFinite ??
    followUps.find((f) => f.status !== "CANCELLED" && f.service) ??
    followUps[0] ??
    null
  );
}

function getTotalSessions(followUp: TenantPatientFollowUp | null) {
  if (!followUp) return null;
  if (followUp.planTotalSessions) return followUp.planTotalSessions;
  const rules = followUp.planPhases ?? followUp.service?.followUpRules ?? [];
  const totalFromRules =
    rules.length > 0 ? Math.max(...rules.map((r) => r.toSessionNumber)) : null;
  return followUp.service?.totalRecommendedSessions ?? totalFromRules;
}

function getUnifiedTimeline(
  followUps: TenantPatientFollowUp[],
  locale: "en" | "ar" | "he",
): UnifiedTimelineItem[] {
  const items = new Map<string, UnifiedTimelineItem>();

  for (const followUp of followUps) {
    const serviceName = getServiceName(followUp.service, locale);

    for (const entry of followUp.treatmentTimeline) {
      const key = `${entry.type}:${entry.id}`;
      if (items.has(key)) continue;

      items.set(key, {
        date: entry.date,
        id: entry.id,
        isFollowUp: entry.type === "FOLLOW_UP",
        providerName: entry.provider?.fullName ?? null,
        serviceName,
        sessionNumber: entry.sessionNumber,
        status: entry.status,
        title: followUp.title,
        type: entry.type,
      });
    }

    const followUpKey = `follow-up:${followUp.id}`;
    if (!items.has(followUpKey) && !items.has(`FOLLOW_UP:${followUp.id}`)) {
      items.set(followUpKey, {
        date: followUp.dueDate,
        followUpId: followUp.id,
        id: followUp.id,
        isFollowUp: true,
        providerName:
          followUp.nextAppointment?.status === "CANCELLED"
            ? null
            : followUp.lastTreatment?.provider?.fullName ?? null,
        serviceName,
        sessionNumber: followUp.sessionNumber,
        status: followUp.status,
        title: followUp.title,
        type: "FOLLOW_UP",
      });
    }
  }

  return Array.from(items.values()).sort((a, b) => {
    if (a.sessionNumber !== null && b.sessionNumber !== null) {
      if (a.sessionNumber !== b.sessionNumber) return a.sessionNumber - b.sessionNumber;
      if (a.type !== b.type) return a.type === "COMPLETED" ? -1 : 1;
    }
    if (a.sessionNumber !== null && b.sessionNumber === null) return -1;
    if (a.sessionNumber === null && b.sessionNumber !== null) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

function getTreatmentSummary(followUps: TenantPatientFollowUp[]) {
  const primary = getPrimaryFollowUp(followUps);
  if (!primary) return null;

  const rules = primary.service?.followUpRules ?? [];
  const total = getTotalSessions(primary);

  const completedItems = new Map<string, TreatmentTimelineEntry>();
  for (const followUp of followUps) {
    for (const entry of followUp.treatmentTimeline) {
      if (entry.type === "COMPLETED") completedItems.set(entry.id, entry);
    }
  }
  const completed = completedItems.size;
  const highestCompletedSession = Math.max(
    0,
    ...Array.from(completedItems.values()).map((entry) => entry.sessionNumber),
  );
  const nextSessionNumber = primary.sessionNumber ?? highestCompletedSession + 1;

  const currentPhaseIndex =
    nextSessionNumber && rules.length > 0
      ? rules.findIndex(
          (r) =>
            nextSessionNumber >= r.fromSessionNumber &&
            nextSessionNumber <= r.toSessionNumber,
        ) + 1
      : null;

  const nextDate =
    primary.nextAppointment?.appointmentDate ??
    (primary.status === "UPCOMING" || primary.status === "DUE"
      ? primary.dueDate
      : null);

  return {
    service: primary.service,
    total,
    completed,
    remaining: total !== null ? Math.max(0, total - completed) : null,
    currentPhase: currentPhaseIndex && currentPhaseIndex > 0 ? currentPhaseIndex : null,
    lastDate: primary.lastTreatment?.appointmentDate ?? null,
    nextDate,
    provider: primary.lastTreatment?.provider?.fullName ?? null,
    sessionNumber: nextSessionNumber,
  };
}

function extractErrors(error: unknown, dictionary: CenterAdminDictionary) {
  if (!(error instanceof ApiRequestError)) return {};
  const details = error.details;
  if (!details || typeof details !== "object" || !("errors" in details)) return {};
  const errors = (details as { errors?: Record<string, unknown> }).errors;
  if (!errors) return {};
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <dt className="text-xs font-semibold text-[#66758a]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#24364f]">{value}</dd>
    </div>
  );
}

function TreatmentSummaryCard({
  followUps,
  locale,
}: {
  followUps: TenantPatientFollowUp[];
  locale: "en" | "ar" | "he";
}) {
  const t = pageCopy[locale];
  const summary = getTreatmentSummary(followUps);
  const serviceName = summary ? getServiceName(summary.service, locale) : null;
  const progress =
    summary?.total && summary.total > 0
      ? Math.min(100, Math.round((summary.completed / summary.total) * 100))
      : null;

  return (
    <AdminCard className="mt-5 overflow-hidden">
      <div className="border-b border-[#E5E7EB] bg-[#F0F4FA] px-5 py-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0B2D5C]">{t.treatmentSummary}</h3>
            {serviceName ? (
              <p className="mt-1 break-words text-sm font-semibold text-[#24364f]">
                {serviceName}
              </p>
            ) : null}
          </div>
          {progress !== null ? (
            <span className="w-fit rounded-full border border-[#C8D7EA] bg-white px-3 py-1 text-xs font-bold text-[#0B2D5C]">
              {progress}%
            </span>
          ) : null}
        </div>
      </div>

      {!summary ? (
        <p className="px-5 py-6 text-sm text-[#66758a]">{t.noTreatment}</p>
      ) : (
        <div className="p-5">
          {summary.total !== null && summary.total > 0 && progress !== null ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="text-[#66758a]">
                  {t.progressLabel(summary.completed, summary.total)}
                </span>
                <span className="shrink-0 text-[#0B2D5C]">{t.treatmentProgress}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#0B2D5C] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summary.total !== null ? (
              <SummaryDetail label={t.totalSessions} value={String(summary.total)} />
            ) : null}
            <SummaryDetail
              label={t.completedSessions}
              value={String(summary.completed)}
              accent="emerald"
            />
            {summary.remaining !== null ? (
              <SummaryDetail
                label={t.remainingSessions}
                value={String(summary.remaining)}
                accent={summary.remaining > 0 ? "blue" : "emerald"}
              />
            ) : null}
            {summary.currentPhase ? (
              <SummaryDetail
                label={t.currentPhase}
                value={t.phaseLabel(summary.currentPhase)}
              />
            ) : null}
            {summary.lastDate ? (
              <SummaryDetail label={t.lastSession} value={formatDate(summary.lastDate, locale)} />
            ) : null}
            {summary.nextDate ? (
              <SummaryDetail
                label={t.nextSession}
                value={formatDate(summary.nextDate, locale)}
                accent="blue"
              />
            ) : null}
            {summary.provider ? (
              <SummaryDetail label={t.provider} value={summary.provider} />
            ) : null}
          </dl>
        </div>
      )}
    </AdminCard>
  );
}

function SummaryDetail({
  accent,
  label,
  value,
}: {
  accent?: "emerald" | "blue";
  label: string;
  value: string;
}) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "blue"
        ? "text-[#0B2D5C]"
        : "text-[#24364f]";
  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAFC] px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9BABBF]">
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-bold ${valueClass}`}>{value}</dd>
    </div>
  );
}

function DiagnosisCard({
  locale,
  patient,
}: {
  locale: "en" | "ar" | "he";
  patient: CenterPatient;
}) {
  const t = pageCopy[locale];
  const hasNotes = Boolean(patient.notes?.trim());

  return (
    <AdminCard className="mt-5 p-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#0B2D5C]">{t.diagnosis}</h3>
          <p className="mt-1 text-xs leading-5 text-[#66758a]">
            {hasNotes ? t.reasonForVisit : t.noDiagnosis}
          </p>
        </div>
      </div>
      {hasNotes ? (
        <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
          <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-[#24364f]">
            {patient.notes}
          </p>
        </div>
      ) : null}
    </AdminCard>
  );
}

function TreatmentTimeline({
  followUps,
  locale,
  patient,
}: {
  followUps: TenantPatientFollowUp[];
  locale: "en" | "ar" | "he";
  patient: CenterPatient;
}) {
  const t = pageCopy[locale];
  const timeline = getUnifiedTimeline(followUps, locale);
  const isRtl = locale === "ar" || locale === "he";

  return (
    <AdminCard className="mt-5 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#E5E7EB] bg-[#F0F4FA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#0B2D5C]">{t.timelineTitle}</h3>
          <p className="mt-0.5 text-xs text-[#66758a]">{t.timelineSubtitle}</p>
        </div>
        <Link
          className={buttonClassName("secondary", "sm", "shrink-0")}
          href={`/tenant/follow-ups?patientId=${patient.id}`}
        >
          {t.openFollowUps}
        </Link>
      </div>

      {timeline.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[#66758a]">{t.empty}</p>
      ) : (
        <div className="divide-y divide-[#F0F4FA]">
          {timeline.map((item, index) => {
            const style = getStatusStyle(item.status);
            const statusLabel =
              t.statuses[item.status as keyof typeof t.statuses] ?? item.status;
            const isLast = index === timeline.length - 1;
            const typeLabel = item.isFollowUp ? t.followUp : t.appointment;

            return (
              <div
                className={`relative flex gap-4 px-5 py-4 ${isRtl ? "flex-row-reverse" : ""} ${style.card}`}
                key={`${item.type}-${item.id}-${index}`}
              >
                {/* Timeline dot + line */}
                <div className="flex shrink-0 flex-col items-center">
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ring-2 ring-white ${style.dot}`}
                  />
                  {!isLast ? (
                    <div className="mt-1 w-px flex-1 bg-[#E5E7EB]" />
                  ) : null}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#0B2D5C]">
                          {item.sessionNumber
                            ? `${t.session} ${item.sessionNumber}`
                            : item.title}
                        </p>
                        <span className="rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#66758a]">
                          {typeLabel}
                        </span>
                      </div>
                      {item.serviceName ? (
                        <p className="mt-0.5 text-xs text-[#66758a]">
                          {item.serviceName}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#66758a]">
                    <span>
                      {t.dueDate}: {formatDate(item.date, locale)}
                    </span>
                    {item.providerName ? (
                      <span>{item.providerName}</span>
                    ) : item.isFollowUp ? null : (
                      <span>{t.noProvider}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      .then((response) => { if (isMounted) setPatient(response); })
      .catch(() => { if (isMounted) setLoadError(true); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [patientId]);

  useEffect(() => {
    let isMounted = true;
    // includeAllForPatient fetches the full history including completed follow-ups
    listTenantFollowUps({ patientId, includeAllForPatient: true })
      .then((response) => { if (isMounted) setFollowUps(response.items); })
      .catch(() => { if (isMounted) setFollowUps([]); });
    return () => { isMounted = false; };
  }, [patientId]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(id);
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
          if (!patient) return;
          setForm(patientToForm(patient));
          setFormErrors({});
          setIsEditing(true);
        };

        const submit = async () => {
          if (!patient) return;
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
          if (!patient) return;
          const nextStatus = patient.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
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
            // ignore clipboard errors
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
            {/* Action bar */}
            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className={buttonClassName("secondary", "md")} href="/tenant/patients">
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
                          const hasAny =
                            c.appointments > 0 || c.invoices > 0 ||
                            c.payments > 0 || c.followUps > 0 ||
                            c.creditTransactions > 0;
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
              <AdminState className="mt-5" loading title={dictionary.patients.loading} />
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

            {/* ── Patient info ─────────────────────────────────────── */}
            {patient && !isLoading ? (
              <AdminCard className="mt-5 p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold text-[#0B2D5C]">
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

                <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                </dl>
              </AdminCard>
            ) : null}

            {/* Reason / diagnosis */}
            {patient && !isLoading ? (
              <DiagnosisCard locale={locale} patient={patient} />
            ) : null}

            {/* ── Treatment summary ────────────────────────────────── */}
            {patient && !isLoading ? (
              <TreatmentSummaryCard
                followUps={followUps}
                locale={locale}
              />
            ) : null}

            {/* ── Treatment timeline ───────────────────────────────── */}
            {patient && !isLoading ? (
              <TreatmentTimeline
                followUps={followUps}
                locale={locale}
                patient={patient}
              />
            ) : null}

            {/* ── Patient portal ───────────────────────────────────── */}
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
                      <span className="min-w-0 flex-1 truncate text-xs text-[#66758a]" dir="ltr">
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

            {/* ── Delete confirmation modal ─────────────────────────── */}
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
