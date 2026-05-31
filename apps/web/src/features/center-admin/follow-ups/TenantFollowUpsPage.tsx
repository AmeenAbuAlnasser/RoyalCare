"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  getTenantFollowUpAnalytics,
  listTenantFollowUps,
  updateTenantFollowUpNotes,
  updateTenantFollowUpStatus,
  type PatientFollowUpFilter,
  type PatientFollowUpStatus,
  type TenantFollowUpAnalytics,
  type TenantPatientFollowUp,
} from "@/lib/api/tenant-follow-ups";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const filters: PatientFollowUpFilter[] = [
  "TODAY",
  "THIS_WEEK",
  "OVERDUE",
  "UPCOMING",
  "CONTACTED",
  "BOOKED",
  "COMPLETED",
];

const copy = {
  en: {
    title: "Follow-ups",
    subtitle: "Track treatment reminders and bring patients back on time.",
    filters: {
      TODAY: "Today",
      THIS_WEEK: "This week",
      OVERDUE: "Overdue",
      UPCOMING: "Upcoming",
      CONTACTED: "Contacted",
      BOOKED: "Booked",
      COMPLETED: "Completed",
    },
    dueToday: "Due today",
    overdue: "Overdue",
    contacted: "Contacted",
    booked: "Booked from follow-ups",
    conversion: "Conversion",
    loading: "Loading follow-ups...",
    loadError: "Could not load follow-ups. Please try again.",
    emptyByFilter: {
      TODAY: {
        title: "No follow-ups due today",
        body: "All of today's reminders are clear. Check Overdue for missed patients or Upcoming for future ones.",
      },
      THIS_WEEK: {
        title: "No follow-ups due this week",
        body: "No treatment reminders are scheduled for the next 7 days.",
      },
      UPCOMING: {
        title: "No upcoming follow-ups",
        body: "Future follow-ups from completed appointments will appear here once scheduled.",
      },
      OVERDUE: {
        title: "No overdue follow-ups",
        body: "All patients are up to date — no missed follow-ups.",
      },
      CONTACTED: {
        title: "No contacted follow-ups",
        body: "Mark a follow-up as contacted to move it here.",
      },
      BOOKED: {
        title: "No booked follow-ups",
        body: "Follow-ups that led to a new appointment will appear here.",
      },
      COMPLETED: {
        title: "No completed follow-ups",
        body: "Follow-up sessions marked as completed will appear here.",
      },
    },
    session: "Session",
    dueDate: "Due date",
    minuteUnit: "min",
    remainingDays: (days: number) => `${days} days left`,
    remainingOneDay: "1 day left",
    afterHours: (hours: number) => `In ${hours} hours`,
    todayBadge: "Today",
    overdueRelativeDays: (days: number) => `${days} days overdue`,
    overdueRelativeOneDay: "1 day overdue",
    overdueRelativeTwoDays: "2 days overdue",
    overdueDays: (days: number) => `${days} days overdue`,
    whatsapp: "Patient WhatsApp",
    createAppointment: "Create appointment",
    markContacted: "Mark contacted",
    markBooked: "Mark booked",
    markCompleted: "Mark completed",
    saveNote: "Save note",
    notePlaceholder: "Add a new follow-up note",
    service: "Service",
    lastClinicalNotes: "Last treatment session",
    previousSessionInfo: "Previous session context",
    provider: "Provider",
    status: "Status",
    appointmentNotes: "Treatment notes",
    internalNotes: "Internal staff notes",
    noClinicalNotes: "No treatment notes recorded for this session.",
    noCompletedTreatment: "No previous treatment session was found.",
    internalNotesBadge: "Has internal notes",
    nonCompletedSessionBadge: "Session not completed yet",
    suggestedAction: "Suggested next action",
    suggestedWhatsapp: "Send the patient a WhatsApp reminder",
    suggestedAppointment: "Create the next session appointment",
    suggestedComplete: "Complete the booked session",
    treatmentTimeline: "Treatment timeline",
    completed: "Completed",
    upcomingFollowUp: "Upcoming follow-up",
    message: (patient: string, service: string, center: string) =>
      `Hello ${patient},\nWe would like to remind you that your next ${service} session at ${center} is coming up.\nWe will be happy to book a convenient appointment for you.`,
  },
  ar: {
    title: "المتابعات",
    subtitle: "تذكيرات جلسات العلاج لمساعدة المرضى على العودة في الوقت المناسب.",
    filters: {
      TODAY: "اليوم",
      THIS_WEEK: "هذا الأسبوع",
      OVERDUE: "متأخرة",
      UPCOMING: "قادمة",
      CONTACTED: "تم التواصل",
      BOOKED: "محجوزة",
      COMPLETED: "مكتملة",
    },
    dueToday: "مستحقة اليوم",
    overdue: "متأخرة",
    contacted: "تم التواصل",
    booked: "حجوزات من المتابعة",
    conversion: "نسبة التحويل",
    loading: "جار تحميل المتابعات...",
    loadError: "تعذر تحميل المتابعات. يرجى المحاولة مرة أخرى.",
    emptyByFilter: {
      TODAY: {
        title: "لا توجد متابعات مستحقة اليوم",
        body: "لا توجد تذكيرات لهذا اليوم. تحقق من المتأخرة للمرضى الفائتين أو القادمة للمجدولين.",
      },
      THIS_WEEK: {
        title: "لا توجد متابعات هذا الأسبوع",
        body: "لا توجد تذكيرات علاجية مجدولة للأيام السبعة القادمة.",
      },
      UPCOMING: {
        title: "لا توجد متابعات قادمة",
        body: "ستظهر هنا المتابعات المستقبلية من المواعيد المكتملة التي تحتوي على خطة متابعة.",
      },
      OVERDUE: {
        title: "لا توجد متابعات متأخرة",
        body: "رائع — جميع المرضى محدّثون. لا يوجد متابعات فائتة.",
      },
      CONTACTED: {
        title: "لا توجد متابعات تم التواصل بشأنها",
        body: "عند تحديد متابعة على أنه تم التواصل، ستظهر هنا.",
      },
      BOOKED: {
        title: "لا توجد متابعات محجوزة",
        body: "ستظهر هنا المتابعات التي أفضت إلى حجز موعد.",
      },
      COMPLETED: {
        title: "لا توجد متابعات مكتملة",
        body: "ستظهر هنا جلسات المتابعة التي تم تحديدها كمكتملة.",
      },
    },
    session: "الجلسة",
    dueDate: "تاريخ الاستحقاق",
    minuteUnit: "دقيقة",
    remainingDays: (days: number) => `متبقي ${days} أيام`,
    remainingOneDay: "متبقي يوم واحد",
    afterHours: (hours: number) => `بعد ${hours} ساعات`,
    todayBadge: "اليوم",
    overdueRelativeDays: (days: number) => `متأخر ${days} أيام`,
    overdueRelativeOneDay: "متأخر يوم واحد",
    overdueRelativeTwoDays: "متأخر يومين",
    overdueDays: (days: number) => `متأخرة ${days} يوم`,
    whatsapp: "واتساب المريض",
    createAppointment: "إنشاء موعد",
    markContacted: "تم التواصل",
    markBooked: "تم الحجز",
    markCompleted: "مكتملة",
    saveNote: "حفظ الملاحظة",
    notePlaceholder: "إضافة ملاحظة متابعة جديدة",
    service: "الخدمة",
    lastClinicalNotes: "آخر جلسة علاجية",
    previousSessionInfo: "معلومات من الجلسة السابقة",
    provider: "المعالج",
    status: "الحالة",
    appointmentNotes: "ملاحظات علاجية",
    internalNotes: "ملاحظات داخلية للطاقم",
    noClinicalNotes: "لا توجد ملاحظات علاجية مسجلة لهذه الجلسة.",
    noCompletedTreatment: "لا توجد جلسة علاجية سابقة.",
    internalNotesBadge: "يوجد ملاحظات داخلية",
    nonCompletedSessionBadge: "جلسة غير مكتملة بعد",
    suggestedAction: "الإجراء المقترح",
    suggestedWhatsapp: "إرسال تذكير واتساب للمريض",
    suggestedAppointment: "إنشاء موعد الجلسة القادمة",
    suggestedComplete: "إكمال الجلسة المحجوزة",
    treatmentTimeline: "سجل العلاج",
    completed: "مكتملة",
    upcomingFollowUp: "متابعة قادمة",
    message: (patient: string, service: string, center: string) =>
      `مرحبًا ${patient} 🌷\nنذكرك أن موعد جلستك القادمة لخدمة ${service} لدى ${center} أصبح قريبًا.\nيسعدنا حجز موعد مناسب لك.`,
  },
  he: {
    title: "מעקבים",
    subtitle: "תזכורות טיפולים כדי להחזיר מטופלים בזמן.",
    filters: {
      TODAY: "היום",
      THIS_WEEK: "השבוע",
      OVERDUE: "באיחור",
      UPCOMING: "קרובים",
      CONTACTED: "נוצר קשר",
      BOOKED: "נקבע",
      COMPLETED: "הושלם",
    },
    dueToday: "להיום",
    overdue: "באיחור",
    contacted: "נוצר קשר",
    booked: "נקבעו ממעקב",
    conversion: "המרה",
    loading: "טוען מעקבים...",
    loadError: "לא ניתן לטעון מעקבים. נסו שוב.",
    emptyByFilter: {
      TODAY: {
        title: "אין מעקבים להיום",
        body: "כל התזכורות לסיום. בדוק 'באיחור' למטופלים שפוספסו או 'קרובים' לעתיד.",
      },
      THIS_WEEK: {
        title: "אין מעקבים לשבוע זה",
        body: "אין תזכורות טיפול מתוכננות לשבעת הימים הקרובים.",
      },
      UPCOMING: {
        title: "אין מעקבים קרובים",
        body: "מעקבים עתידיים מתורים שהושלמו יופיעו כאן לאחר תזמונם.",
      },
      OVERDUE: {
        title: "אין מעקבים באיחור",
        body: "מצוין — כל המטופלים מעודכנים. אין מעקבים שפוספסו.",
      },
      CONTACTED: {
        title: "אין מעקבים שנוצר אליהם קשר",
        body: "סמן מעקב כ'נוצר קשר' כדי שיופיע כאן.",
      },
      BOOKED: {
        title: "אין מעקבים שנקבעו",
        body: "מעקבים שהובילו לקביעת תור חדש יופיעו כאן.",
      },
      COMPLETED: {
        title: "אין מעקבים שהושלמו",
        body: "מפגשי מעקב שסומנו כהושלמו יופיעו כאן.",
      },
    },
    session: "מפגש",
    dueDate: "תאריך יעד",
    minuteUnit: "דק׳",
    remainingDays: (days: number) => `נותרו ${days} ימים`,
    remainingOneDay: "נותר יום אחד",
    afterHours: (hours: number) => `בעוד ${hours} שעות`,
    todayBadge: "היום",
    overdueRelativeDays: (days: number) => `${days} ימים באיחור`,
    overdueRelativeOneDay: "יום אחד באיחור",
    overdueRelativeTwoDays: "יומיים באיחור",
    overdueDays: (days: number) => `${days} ימים באיחור`,
    whatsapp: "וואטסאפ למטופל",
    createAppointment: "יצירת תור",
    markContacted: "סימון שנוצר קשר",
    markBooked: "סימון שנקבע",
    markCompleted: "סימון שהושלם",
    saveNote: "שמירת הערה",
    notePlaceholder: "הוספת הערת מעקב חדשה",
    service: "שירות",
    lastClinicalNotes: "טיפול אחרון",
    previousSessionInfo: "מידע מהטיפול הקודם",
    provider: "מטפל",
    status: "סטטוס",
    appointmentNotes: "הערות טיפול",
    internalNotes: "הערות פנימיות לצוות",
    noClinicalNotes: "לא נרשמו הערות טיפול עבור מפגש זה.",
    noCompletedTreatment: "לא נמצא טיפול קודם.",
    internalNotesBadge: "יש הערות פנימיות",
    nonCompletedSessionBadge: "הטיפול עדיין לא הושלם",
    suggestedAction: "הפעולה המומלצת",
    suggestedWhatsapp: "שליחת תזכורת וואטסאפ למטופל",
    suggestedAppointment: "יצירת תור לטיפול הבא",
    suggestedComplete: "השלמת הטיפול שנקבע",
    treatmentTimeline: "ציר טיפולים",
    completed: "הושלם",
    upcomingFollowUp: "מעקב קרוב",
    message: (patient: string, service: string, center: string) =>
      `שלום ${patient},\nנזכיר שהמפגש הבא עבור ${service} ב-${center} מתקרב.\nנשמח לקבוע עבורך תור מתאים.`,
  },
} satisfies Record<SupportedLocale, Record<string, unknown>>;

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function parseLocalDueDate(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours = 0, minutes = 0] = (timePart ?? "")
    .slice(0, 5)
    .split(":")
    .filter(Boolean)
    .map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getUrgencyBadge(
  dueDate: string,
  locale: SupportedLocale,
  text: typeof copy.en,
) {
  const now = new Date();
  const due = parseLocalDueDate(dueDate);
  const todayStart = startOfLocalDay(now);
  const dueStart = startOfLocalDay(due);
  const dayMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round((dueStart.getTime() - todayStart.getTime()) / dayMs);

  if (dayDiff === 0) {
    return {
      className: "bg-[#ECFDF3] text-[#047857]",
      label: text.todayBadge,
    };
  }

  if (dayDiff > 0) {
    const hoursDiff = Math.ceil((due.getTime() - now.getTime()) / 3600000);
    const label =
      hoursDiff > 0 && hoursDiff < 24
        ? text.afterHours(hoursDiff)
        : dayDiff === 1
        ? text.remainingOneDay
        : text.remainingDays(dayDiff);

    return {
      className: "bg-[#EEF4FF] text-[#0B2D5C]",
      label,
    };
  }

  const overdueDays = Math.abs(dayDiff);
  const label =
    locale === "ar" && overdueDays === 2
      ? text.overdueRelativeTwoDays
      : overdueDays === 1
        ? text.overdueRelativeOneDay
        : text.overdueRelativeDays(overdueDays);

  return {
    className: "bg-[#FFF1F1] text-[#B42318]",
    label,
  };
}

function serviceName(
  service: TenantPatientFollowUp["service"],
  locale: SupportedLocale,
) {
  if (!service) return "";
  if (locale === "ar") return service.nameAr || service.nameEn || service.nameHe;
  if (locale === "he") return service.nameHe || service.nameEn || service.nameAr;
  return service.nameEn || service.nameAr || service.nameHe;
}

function patientName(
  patient: TenantPatientFollowUp["patient"],
  locale: SupportedLocale,
) {
  if (locale === "ar") return patient.fullNameAr || patient.fullName;
  if (locale === "he") return patient.fullNameHe || patient.fullNameEn || patient.fullName;
  return patient.fullNameEn || patient.fullName;
}

function appointmentStatusLabel(status: string, locale: SupportedLocale) {
  const labels = {
    en: {
      CANCELLED: "Cancelled",
      COMPLETED: "Completed",
      CONFIRMED: "Confirmed",
      NO_SHOW: "No-show",
      PENDING: "Pending",
    },
    ar: {
      CANCELLED: "ملغي",
      COMPLETED: "مكتمل",
      CONFIRMED: "مؤكد",
      NO_SHOW: "لم يحضر",
      PENDING: "قيد الانتظار",
    },
    he: {
      CANCELLED: "בוטל",
      COMPLETED: "הושלם",
      CONFIRMED: "מאושר",
      NO_SHOW: "לא הגיע",
      PENDING: "ממתין",
    },
  } satisfies Record<SupportedLocale, Record<string, string>>;

  const localizedLabels: Record<string, string> = labels[locale];
  return localizedLabels[status] ?? status;
}

function followUpStateLabel(
  item: TenantPatientFollowUp,
  text: typeof copy.en,
) {
  if (item.status === "COMPLETED") return text.filters.COMPLETED;
  if (item.overdueDays > 0) return text.filters.OVERDUE;
  return text.filters.UPCOMING;
}

function followUpStateClassName(item: TenantPatientFollowUp) {
  if (item.status === "COMPLETED") {
    return "bg-[#ECFDF3] text-[#047857]";
  }

  if (item.overdueDays > 0) {
    return "bg-[#FFF7F7] text-[#B42318]";
  }

  return "bg-[#EEF4FF] text-[#0B2D5C]";
}

function suggestedActionLabel(item: TenantPatientFollowUp, text: typeof copy.en) {
  if (item.nextAppointment) return text.suggestedComplete;
  if (item.overdueDays > 0) return text.suggestedWhatsapp;
  if (item.status === "CONTACTED") return text.suggestedAppointment;
  return text.suggestedWhatsapp;
}

function whatsappHref(phone: string, message: string) {
  const normalized = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function TenantFollowUpsPage() {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const text = copy[locale] as typeof copy.en;
  const patientId = searchParams.get("patientId") || undefined;
  const [filter, setFilter] = useState<PatientFollowUpFilter>("TODAY");
  const [items, setItems] = useState<TenantPatientFollowUp[]>([]);
  const [analytics, setAnalytics] = useState<TenantFollowUpAnalytics | null>(
    null,
  );
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [analyticsToken, setAnalyticsToken] = useState(0);
  const requestGenRef = useRef(0);

  const refresh = useCallback(() => {
    setRefreshToken((t) => t + 1);
    setAnalyticsToken((t) => t + 1);
  }, []);

  // Analytics are global — fetch once on mount and after mutations, NOT on filter change
  useEffect(() => {
    console.debug("[fetch:start] TenantFollowUpsPage — analytics");
    getTenantFollowUpAnalytics()
      .then(setAnalytics)
      .catch(() => undefined);
  }, [analyticsToken]);

  // List re-fetches on filter/patientId change or explicit refresh
  useEffect(() => {
    const gen = ++requestGenRef.current;
    setStatus("loading");
    console.debug(`[fetch:start] TenantFollowUpsPage — follow-ups filter=${filter}`);

    listTenantFollowUps({ filter, patientId })
      .then((followUps) => {
        if (gen !== requestGenRef.current) return;
        setItems(followUps.items);
        setStatus("success");
        setNotesDraft((prev) => {
          const next: Record<string, string> = {};
          for (const item of followUps.items) {
            next[item.id] = item.id in prev ? prev[item.id] : (item.notes ?? "");
          }
          return next;
        });
        console.debug(`[fetch:end] TenantFollowUpsPage — follow-ups count=${followUps.items.length}`);
      })
      .catch(() => {
        if (gen !== requestGenRef.current) return;
        setStatus("error");
      });
  }, [filter, patientId, refreshToken]);

  const metrics = useMemo(
    () => [
      { label: text.dueToday, value: analytics?.dueToday ?? 0 },
      { label: text.overdue, value: analytics?.overdue ?? 0 },
      { label: text.contacted, value: analytics?.contacted ?? 0 },
      { label: text.booked, value: analytics?.bookedFromFollowUps ?? 0 },
      { label: text.conversion, value: `${analytics?.conversionRate ?? 0}%` },
    ],
    [analytics, text],
  );

  const updateStatus = async (id: string, nextStatus: PatientFollowUpStatus) => {
    setBusyId(id);
    try {
      await updateTenantFollowUpStatus(id, nextStatus);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const saveNote = async (id: string) => {
    setBusyId(id);
    try {
      await updateTenantFollowUpNotes(id, notesDraft[id] ?? "");
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <CenterAdminShell
      activeNav="followUps"
      requiredPermission="appointments:view"
      subtitle={() => text.subtitle}
      title={() => text.title}
    >
      {({ session }) => (
        <div className="mt-5 space-y-5">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
              <div
                className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_28px_rgba(11,45,92,0.04)]"
                key={metric.label}
              >
                <p className="text-xs font-semibold text-[#66758a]">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0B2D5C]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                className={
                  item === filter
                    ? buttonClassName("primary", "sm", "shrink-0")
                    : buttonClassName("secondary", "sm", "shrink-0")
                }
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {text.filters[item]}
              </button>
            ))}
          </div>

          {status === "loading" ? (
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-sm font-semibold text-[#0B2D5C]">
              {text.loading}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] p-5 text-sm font-semibold text-[#B42318]">
              {text.loadError}
            </div>
          ) : null}

          {status === "success" && items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#C8A45D]/60 bg-white p-8 text-center">
              <h2 className="text-lg font-bold text-[#0B2D5C]">
                {text.emptyByFilter[filter].title}
              </h2>
              <p className="mt-2 text-sm text-[#66758a]">
                {text.emptyByFilter[filter].body}
              </p>
            </div>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            {items.map((item) => {
              const currentPatientName = patientName(item.patient, locale);
              const currentServiceName =
                serviceName(item.service, locale) || item.title;
              const hasAppointmentNotes = Boolean(
                item.lastTreatment?.notes?.trim(),
              );
              const hasInternalTreatmentNotes = Boolean(
                item.lastTreatment?.internalNotes?.trim(),
              );
              const isNonCompletedTreatmentContext =
                Boolean(item.lastTreatment) &&
                item.lastTreatment?.status !== "COMPLETED";
              const message = text.message(
                currentPatientName,
                currentServiceName,
                session.center.name,
              );
              const stateBadgeClassName = followUpStateClassName(item);
              const stateBadgeLabel = followUpStateLabel(item, text);
              const suggestion = suggestedActionLabel(item, text);
              const urgencyBadge = getUrgencyBadge(item.dueDate, locale, text);
              const cardTone =
                item.overdueDays > 0
                  ? "border-[#F3B8B8] bg-[#FFFCFC] shadow-[0_14px_34px_rgba(180,35,24,0.08)]"
                  : "border-[#E8ECF2] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]";

              return (
                <article
                  className={`rounded-lg border p-4 ${cardTone}`}
                  key={item.id}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold text-[#0B2D5C]">
                          {currentPatientName}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-[#66758a]">
                          {item.patient.phone}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${urgencyBadge.className}`}
                      >
                        {urgencyBadge.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-[#24364f]">
                      <span className="min-w-0 truncate">
                        {currentServiceName}
                      </span>
                      <span className="text-[#C8A45D]">/</span>
                      <span>
                        {text.session} {item.sessionNumber ?? "-"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${stateBadgeClassName}`}
                      >
                        {stateBadgeLabel}
                      </span>
                      {isNonCompletedTreatmentContext ? (
                        <span className="rounded-full bg-[#FFF7F7] px-3 py-1 text-xs font-bold text-[#B42318]">
                          {text.nonCompletedSessionBadge}
                        </span>
                      ) : null}
                      {hasInternalTreatmentNotes ? (
                        <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-bold text-[#8A5A00]">
                          {text.internalNotesBadge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-[#66758a]">
                      {text.dueDate}: {formatDate(item.dueDate)}
                    </p>
                  </div>

                  <section className="mt-4 rounded-lg bg-[#F8FAFC] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-[#0B2D5C]">
                        {text.lastClinicalNotes}
                      </h3>
                    </div>
                    {item.lastTreatment ? (
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#66758a]">
                            {formatDate(item.lastTreatment.appointmentDate)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#24364f]">
                            {appointmentStatusLabel(
                              item.lastTreatment.status,
                              locale,
                            )}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#24364f]">
                            {item.lastTreatment.durationMinutes}{" "}
                            {text.minuteUnit}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#24364f]">
                            {item.lastTreatment.provider?.fullName || "-"}
                          </span>
                        </div>
                        <ClinicalText
                          label={text.appointmentNotes}
                          value={item.lastTreatment.notes}
                        />
                        <ClinicalText
                          label={text.internalNotes}
                          value={item.lastTreatment.internalNotes}
                        />
                        {!hasAppointmentNotes && !hasInternalTreatmentNotes ? (
                          <p className="text-sm text-[#66758a]">
                            {text.noClinicalNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#66758a]">
                        {text.noCompletedTreatment}
                      </p>
                    )}
                  </section>

                  {item.treatmentTimeline.length > 0 ? (
                    <section className="mt-4 rounded-lg bg-white p-3.5 ring-1 ring-[#EEF1F5]">
                      <h3 className="text-sm font-bold text-[#0B2D5C]">
                        {text.treatmentTimeline}
                      </h3>
                      <div className="mt-3 space-y-2">
                        {item.treatmentTimeline.map((timelineItem) => (
                          <div
                            className="relative border-s-2 border-[#CFE0F4] pb-4 ps-5 text-sm last:pb-0"
                            key={`${timelineItem.type}-${timelineItem.id}`}
                          >
                            <span className="absolute -start-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#7EA6D8]" />
                            <span className="block text-base font-bold text-[#24364f]">
                              {text.session} {timelineItem.sessionNumber} —{" "}
                              {timelineItem.type === "COMPLETED"
                                ? text.completed
                                : text.upcomingFollowUp}
                              {timelineItem.provider?.fullName ? (
                                <span className="mt-1 block text-xs font-semibold text-[#66758a]">
                                  {text.provider}:{" "}
                                  {timelineItem.provider.fullName}
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-[#66758a]">
                              {formatDate(timelineItem.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <label className="mt-3.5 block">
                    <span className="text-sm font-bold text-[#24364f]">
                      {text.notePlaceholder}
                    </span>
                    <textarea
                      className="mt-2 min-h-16 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                      onChange={(event) =>
                        setNotesDraft({
                          ...notesDraft,
                          [item.id]: event.target.value,
                        })
                      }
                      value={notesDraft[item.id] ?? ""}
                    />
                  </label>

                  <div className="mt-3.5 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#24364f]">
                    <span className="font-bold text-[#0B2D5C]">
                      {text.suggestedAction}:{" "}
                    </span>
                    <span className="font-semibold text-[#66758a]">
                      {suggestion}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#128C7E] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0F7A6E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
                      href={whatsappHref(item.patient.phone, message)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px] font-black"
                      >
                        W
                      </span>
                      {text.whatsapp}
                    </a>
                    <Link
                      className={buttonClassName("secondary", "sm")}
                      href={`/tenant/appointments/new?patientId=${item.patientId}&serviceId=${item.serviceId ?? ""}&followUpId=${item.id}`}
                    >
                      {text.createAppointment}
                    </Link>
                    <button
                      className={buttonClassName("secondary", "sm")}
                      disabled={busyId === item.id}
                      onClick={() => updateStatus(item.id, "CONTACTED")}
                      type="button"
                    >
                      {text.markContacted}
                    </button>
                    <button
                      className={buttonClassName("secondary", "sm")}
                      disabled={busyId === item.id}
                      onClick={() => updateStatus(item.id, "BOOKED")}
                      type="button"
                    >
                      {text.markBooked}
                    </button>
                    <button
                      className={buttonClassName("secondary", "sm")}
                      disabled={busyId === item.id}
                      onClick={() => updateStatus(item.id, "COMPLETED")}
                      type="button"
                    >
                      {text.markCompleted}
                    </button>
                    <button
                      className={buttonClassName("ghost", "sm")}
                      disabled={busyId === item.id}
                      onClick={() => saveNote(item.id)}
                      type="button"
                    >
                      {text.saveNote}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </CenterAdminShell>
  );
}

function ClinicalText({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;

  return (
    <div>
      <span className="text-xs font-bold text-[#24364f]">{label}</span>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#132238]">
        {value}
      </p>
    </div>
  );
}
