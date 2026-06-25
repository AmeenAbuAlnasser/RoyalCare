"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { formatAppointmentDateTime, formatTime12h } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  closeTenantFollowUpPlanEarly,
  getTenantFollowUpAnalytics,
  listTenantFollowUps,
  pauseTenantRecurringFollowUp,
  recordTenantRecurringReminder,
  skipTenantRecurringCycle,
  updateTenantFollowUpDueDate,
  updateTenantFollowUpNotes,
  updateTenantFollowUpStatus,
  type PatientFollowUpFilter,
  type PatientFollowUpStatus,
  type TenantFollowUpAnalytics,
  type TenantPatientFollowUp,
} from "@/lib/api/tenant-follow-ups";
import { BranchFilter } from "@/components/branch/BranchFilter";
import { useBranchFilter } from "@/lib/use-branch-filter";
import { CenterAdminShell } from "../layout/CenterAdminShell";

// ── copy / i18n ───────────────────────────────────────────────────────────────

const copy = {
  en: {
    title: "Follow-ups",
    subtitle: "Treatment reminders — bring patients back on time.",
    filters: {
      TODAY: "Today",
      THIS_WEEK: "Next 7 Days",
      OVERDUE: "Overdue",
      UPCOMING: "Upcoming",
      CONTACTED: "Contacted",
      BOOKED: "Booked",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    },
    dueToday: "Due today",
    overdue: "Overdue",
    contacted: "Contacted",
    booked: "Booked from follow-ups",
    conversion: "Conversion",
    loading: "Loading follow-ups...",
    loadError: "Could not load follow-ups. Please try again.",
    loadingPlan: "Loading plan...",
    planLoadError: "Could not load the full plan.",
    searchPlaceholder: "Search patient, phone, or service",
    searchResults: "Search results",
    noSearchResultsTitle: "No matching results",
    noSearchResultsBody: "",
    needsAttentionNow: "Needs Attention Now",
    emptyByFilter: {
      TODAY:    { title: "No follow-ups due today",    body: "Check Overdue for missed patients or Upcoming for future ones." },
      THIS_WEEK:{ title: "No follow-ups in the next 7 days", body: "No reminders scheduled for the next 7 days." },
      UPCOMING: { title: "No upcoming follow-ups",     body: "Follow-ups from completed appointments will appear here." },
      OVERDUE:  { title: "No overdue follow-ups",      body: "All patients are up to date." },
      CONTACTED:{ title: "No contacted follow-ups",    body: "Mark a follow-up as contacted to move it here." },
      BOOKED:   { title: "No booked follow-ups",       body: "Follow-ups that led to a new appointment will appear here." },
      COMPLETED:{ title: "No completed follow-ups",    body: "Completed sessions will appear here." },
      CANCELLED:{ title: "No cancelled follow-ups",    body: "Sessions whose appointment was cancelled will appear here." },
    },
    session: "Session",
    recurringFollowUp: "Recurring Follow-up",
    recurringTypeBadge: "♾ Recurring",
    finitePlanTypeBadge: "📋 Treatment Plan",
    recurringLifetime: "Recurring lifetime follow-up",
    everyInterval: (n: number, unit: string) => `Every ${n} ${unit}`,
    recurringUnits: {
      DAY: (n: number) => (n === 1 ? "day" : "days"),
      WEEK: (n: number) => (n === 1 ? "week" : "weeks"),
      MONTH: (n: number) => (n === 1 ? "month" : "months"),
      YEAR: (n: number) => (n === 1 ? "year" : "years"),
    },
    lastSession: "Last session",
    nextFollowUpDate: "Next follow-up",
    sessionOf: (n: number, total: number) => `Session ${n} of ${total}`,
    sessionNum: (n: number) => `Session ${n}`,
    dueDate: "Due date",
    minuteUnit: "min",
    remainingDays: (n: number) => `${n}d left`,
    remainingOneDay: "1d left",
    afterHours: (h: number) => `In ${h}h`,
    todayBadge: "Today",
    overdueDays: (n: number) => `${n}d overdue`,
    overdueRelativeOneDay: "1d overdue",
    whatsapp: "WhatsApp",
    createAppointment: "Book session",
    appointmentLinked: "Linked appointment",
    appointmentBooked: "Appointment booked",
    viewAppointment: "View appointment",
    editAppointment: "Edit appointment",
    appointmentDate: "Appointment date",
    appointmentStartTime: "Start time",
    appointmentEndTime: "End time",
    appointmentTime: "Appointment time",
    appointmentStatus: "Appointment status",
    bookedAppointmentMissingLink: "Appointment is booked, but the appointment link is not available.",
    bookedSessions: (n: number) => `${n} booked`,
    remainingSessions: (n: number) => `${n} remaining`,
    completionDate: "Completion date",
    markContacted: "Contacted",
    markBooked: "Booked",
    markCompleted: "Complete",
    saveNote: "Save",
    notePlaceholder: "Add a note",
    service: "Service",
    patientLabel: "Patient",
    phoneLabel: "Phone",
    planLabel: "Plan",
    lastTreatmentLabel: "Last treatment",
    provider: "Provider",
    status: "Status",
    appointmentNotes: "Treatment notes",
    internalNotes: "Internal notes",
    noClinicalNotes: "No treatment notes for this session.",
    noCompletedTreatment: "No previous treatment session found.",
    nextFollowUpLabel: "Next Follow-up",
    editDueDate: "Edit due date",
    snoozePostpone: "Snooze/Postpone",
    saveDueDate: "Save date",
    dueDateHelper: "e.g. 30 days from now",
    expandPatient: "Show plan",
    collapsePatient: "Hide plan",
    sessionsCount: (n: number) => `${n} sessions`,
    completedSessions: (n: number) => `${n} done`,
    planSessions: (done: number, total: number) => `${done} / ${total}`,
    nextDue: "Next due",
    matchingSessionsHeader: "Matching this filter",
    otherSessionsHeader: "Other sessions in plan",
    otherFollowUpsHeader: "Other follow-ups",
    actionsMenu: "Actions",
    priorityOverdue: "Overdue",
    priorityToday: "Today",
    priorityThisWeek: "Next 7 Days",
    priorityUpcoming: "Upcoming",
    activeFollowUps: (n: number) => `${n} active`,
    message: (p: string, s: string, c: string) =>
      `Hello ${p},\nWe would like to remind you that your next ${s} session at ${c} is coming up.\nWe will be happy to book a convenient appointment for you.`,
    suggestedAction: "Suggested action",
    suggestedWhatsapp: "Send the patient a WhatsApp reminder",
    suggestedAppointment: "Create the next session",
    suggestedComplete: "Complete the booked session",
    planPhaseHeader: (phase: number, days: number) => `Phase ${phase} — every ${days} days`,
    planPhaseTitle: (phase: number) => `Treatment Phase ${phase}`,
    planPhaseSubtitle: (from: number, to: number, days: number) => `Sessions ${from} → ${to} • Every ${days} days`,
    treatmentJourney: "Patient Treatment Journey",
    treatmentSummary: "Treatment Summary",
    diagnosisCondition: "Diagnosis / condition",
    mainTreatment: "Main treatment",
    planType: "Plan type",
    currentProgress: "Current progress",
    assignedProvider: "Assigned provider",
    lastCompletedSession: "Last completed session",
    nextUpcomingSession: "Next upcoming session",
    medicalNotes: "Patient / medical notes",
    planStartDate: "Plan start date",
    expectedCompletion: "Expected completion",
    notRecorded: "Not recorded",
    noProviderAssigned: "No provider assigned",
    noPlan: "No plan",
    treatmentPlanSessions: (n: number) => `Treatment plan — ${n} sessions`,
    sessionTitleWithService: (session: string, service: string) => `${session} — ${service}`,
    completedStatus: "Completed",
    closedEarlyStatus: "Closed early",
    missedStatus: "Missed",
    cancelledStatus: "Cancelled",
    todayStatus: "Today",
    overdueStatus: "Overdue",
    upcomingStatus: "Upcoming",
    closePlanEarly: "Close plan early",
    closePlanConfirmTitle: "Close treatment plan?",
    closePlanConfirmBody: "This will stop upcoming sessions and remaining reminders.",
    closePlanReasonLabel: "Reason",
    closePlanReasonResult: "Desired result achieved",
    closePlanReasonPatient: "Patient requested stopping",
    closePlanReasonDoctor: "Doctor decision",
    closePlanReasonOther: "Other reason",
    closePlanOtherPlaceholder: "Write the reason",
    confirmClosePlan: "Close plan",
    cancel: "Cancel",
    closedEarlyAt: "Closure date",
    closedEarlyReason: "Reason",
    closedEarlyAfter: "Closed after",
    closedEarlyAfterProgress: (done: number, total: number) => `${done}/${total} sessions`,
  },
  ar: {
    title: "المتابعات",
    subtitle: "تذكيرات جلسات العلاج لمساعدة المرضى على العودة في الوقت المناسب.",
    filters: {
      TODAY: "اليوم",
      THIS_WEEK: "خلال 7 أيام",
      OVERDUE: "متأخرة",
      UPCOMING: "قادمة",
      CONTACTED: "تم التواصل",
      BOOKED: "محجوزة",
      COMPLETED: "مكتملة",
      CANCELLED: "ملغية",
    },
    dueToday: "مستحقة اليوم",
    overdue: "متأخرة",
    contacted: "تم التواصل",
    booked: "حجوزات من المتابعة",
    conversion: "نسبة التحويل",
    loading: "جار تحميل المتابعات...",
    loadError: "تعذر تحميل المتابعات. يرجى المحاولة مرة أخرى.",
    loadingPlan: "جار تحميل الخطة...",
    planLoadError: "تعذر تحميل خطة العلاج الكاملة.",
    searchPlaceholder: "ابحث باسم المريض أو الهاتف أو الخدمة",
    searchResults: "نتائج البحث",
    noSearchResultsTitle: "لا توجد نتائج مطابقة",
    noSearchResultsBody: "",
    needsAttentionNow: "يحتاج متابعة الآن",
    emptyByFilter: {
      TODAY:    { title: "لا توجد متابعات مستحقة اليوم",  body: "تحقق من المتأخرة للمرضى الفائتين أو القادمة للمجدولين." },
      THIS_WEEK:{ title: "لا توجد متابعات خلال 7 أيام", body: "لا توجد تذكيرات مجدولة للأيام السبعة القادمة." },
      UPCOMING: { title: "لا توجد متابعات قادمة",          body: "ستظهر المتابعات المستقبلية من المواعيد المكتملة هنا." },
      OVERDUE:  { title: "لا توجد متابعات متأخرة",         body: "رائع — جميع المرضى محدّثون." },
      CONTACTED:{ title: "لا توجد متابعات تم التواصل بشأنها", body: "عند تحديد متابعة على أنه تم التواصل، ستظهر هنا." },
      BOOKED:   { title: "لا توجد متابعات محجوزة",         body: "ستظهر المتابعات التي أفضت إلى حجز موعد هنا." },
      COMPLETED:{ title: "لا توجد متابعات مكتملة",         body: "ستظهر جلسات المتابعة المكتملة هنا." },
      CANCELLED:{ title: "لا توجد متابعات ملغية",          body: "ستظهر الجلسات التي أُلغي موعدها هنا." },
    },
    session: "الجلسة",
    recurringFollowUp: "متابعة دورية",
    recurringTypeBadge: "♾ متابعة دورية",
    finitePlanTypeBadge: "📋 خطة علاج",
    recurringLifetime: "متابعة دورية مستمرة",
    everyInterval: (n: number, unit: string) => `كل ${n} ${unit}`,
    recurringUnits: {
      DAY: (n: number) => (n === 1 ? "يوم" : "أيام"),
      WEEK: (n: number) => (n === 1 ? "أسبوع" : "أسابيع"),
      MONTH: (n: number) => (n === 1 ? "شهر" : "أشهر"),
      YEAR: (n: number) => (n === 1 ? "سنة" : "سنوات"),
    },
    lastSession: "آخر جلسة",
    nextFollowUpDate: "المتابعة القادمة",
    sessionOf: (n: number, total: number) => `الجلسة ${n} من ${total}`,
    sessionNum: (n: number) => `الجلسة ${n}`,
    dueDate: "تاريخ الاستحقاق",
    minuteUnit: "دقيقة",
    remainingDays: (n: number) => `متبقي ${n} أيام`,
    remainingOneDay: "متبقي يوم",
    afterHours: (h: number) => `بعد ${h} ساعات`,
    todayBadge: "اليوم",
    overdueDays: (n: number) => `متأخرة ${n} يوم`,
    overdueRelativeOneDay: "متأخرة يوم",
    whatsapp: "واتساب",
    createAppointment: "حجز جلسة",
    appointmentLinked: "موعد مرتبط",
    appointmentBooked: "تم حجز موعد",
    viewAppointment: "عرض الموعد",
    editAppointment: "تعديل الموعد",
    appointmentDate: "تاريخ الموعد",
    appointmentStartTime: "وقت البداية",
    appointmentEndTime: "وقت النهاية",
    appointmentTime: "وقت الموعد",
    appointmentStatus: "حالة الموعد",
    bookedAppointmentMissingLink: "موعد محجوز، لكن رابط الموعد غير متوفر",
    bookedSessions: (n: number) => `${n} محجوزة`,
    remainingSessions: (n: number) => `${n} متبقية`,
    completionDate: "تاريخ الإكمال",
    markContacted: "تواصلت",
    markBooked: "حجزت",
    markCompleted: "مكتملة",
    saveNote: "حفظ",
    notePlaceholder: "أضف ملاحظة",
    service: "الخدمة",
    patientLabel: "المريض",
    phoneLabel: "الهاتف",
    planLabel: "الخطة",
    lastTreatmentLabel: "آخر جلسة",
    provider: "المعالج / المقدم",
    status: "الحالة",
    appointmentNotes: "ملاحظات علاجية",
    internalNotes: "ملاحظات داخلية",
    noClinicalNotes: "لا توجد ملاحظات علاجية لهذه الجلسة.",
    noCompletedTreatment: "لا توجد جلسة علاجية سابقة.",
    nextFollowUpLabel: "المتابعة التالية",
    editDueDate: "تعديل التاريخ",
    snoozePostpone: "تأجيل المتابعة",
    saveDueDate: "حفظ التاريخ",
    dueDateHelper: "مثال: 30 يوماً من الآن",
    expandPatient: "عرض الخطة",
    collapsePatient: "إخفاء الخطة",
    sessionsCount: (n: number) => `${n} جلسات`,
    completedSessions: (n: number) => `${n} مكتملة`,
    planSessions: (done: number, total: number) => `${done} / ${total}`,
    nextDue: "الاستحقاق التالي",
    matchingSessionsHeader: "يطابق هذا الفلتر",
    otherSessionsHeader: "جلسات أخرى في الخطة",
    otherFollowUpsHeader: "متابعات أخرى",
    actionsMenu: "إجراءات",
    priorityOverdue: "متأخرة",
    priorityToday: "اليوم",
    priorityThisWeek: "خلال 7 أيام",
    priorityUpcoming: "قادمة",
    activeFollowUps: (n: number) => `${n} نشطة`,
    message: (p: string, s: string, c: string) =>
      `مرحبًا ${p} 🌷\nنذكرك أن موعد جلستك القادمة لخدمة ${s} لدى ${c} أصبح قريبًا.\nيسعدنا حجز موعد مناسب لك.`,
    suggestedAction: "الإجراء المقترح",
    suggestedWhatsapp: "إرسال تذكير واتساب للمريض",
    suggestedAppointment: "إنشاء موعد الجلسة القادمة",
    suggestedComplete: "إكمال الجلسة المحجوزة",
    planPhaseHeader: (phase: number, days: number) => `مرحلة ${phase} — كل ${days} يوم`,
    planPhaseTitle: (phase: number) => `مرحلة العلاج ${phase}`,
    planPhaseSubtitle: (from: number, to: number, days: number) => `الجلسات ${from} → ${to} • كل ${days} يوم`,
    treatmentJourney: "رحلة علاج المريض",
    treatmentSummary: "ملخص العلاج",
    diagnosisCondition: "التشخيص / الحالة",
    mainTreatment: "العلاج الأساسي",
    planType: "نوع الخطة",
    currentProgress: "التقدم الحالي",
    assignedProvider: "المعالج المسؤول",
    lastCompletedSession: "آخر جلسة مكتملة",
    nextUpcomingSession: "الجلسة القادمة",
    medicalNotes: "ملاحظات المريض / ملاحظات طبية",
    planStartDate: "تاريخ بداية الخطة",
    expectedCompletion: "الانتهاء المتوقع",
    notRecorded: "غير مسجل",
    noProviderAssigned: "لم يتم تعيين معالج",
    noPlan: "بدون خطة",
    treatmentPlanSessions: (n: number) => `خطة علاج — ${n} جلسات`,
    sessionTitleWithService: (session: string, service: string) => `${session} — ${service}`,
    completedStatus: "مكتملة",
    closedEarlyStatus: "أُغلقت مبكرًا",
    missedStatus: "فائتة",
    cancelledStatus: "ملغية",
    todayStatus: "اليوم",
    overdueStatus: "متأخرة",
    upcomingStatus: "قادمة",
    closePlanEarly: "إنهاء الخطة مبكرًا",
    closePlanConfirmTitle: "هل تريد إنهاء خطة العلاج؟",
    closePlanConfirmBody: "سيتم إيقاف الجلسات القادمة والتذكيرات المتبقية.",
    closePlanReasonLabel: "سبب الإغلاق",
    closePlanReasonResult: "تحققت النتيجة",
    closePlanReasonPatient: "طلب المريض الإيقاف",
    closePlanReasonDoctor: "قرار الطبيب",
    closePlanReasonOther: "سبب آخر",
    closePlanOtherPlaceholder: "اكتب السبب",
    confirmClosePlan: "إنهاء الخطة",
    cancel: "إلغاء",
    closedEarlyAt: "تاريخ الإغلاق",
    closedEarlyReason: "السبب",
    closedEarlyAfter: "أُغلقت بعد",
    closedEarlyAfterProgress: (done: number, total: number) => `${done}/${total} جلسات`,
  },
  he: {
    title: "מעקבים",
    subtitle: "תזכורות טיפולים כדי להחזיר מטופלים בזמן.",
    filters: {
      TODAY: "היום",
      THIS_WEEK: "7 הימים הקרובים",
      OVERDUE: "באיחור",
      UPCOMING: "קרובים",
      CONTACTED: "נוצר קשר",
      BOOKED: "נקבע",
      COMPLETED: "הושלם",
      CANCELLED: "בוטל",
    },
    dueToday: "להיום",
    overdue: "באיחור",
    contacted: "נוצר קשר",
    booked: "נקבעו ממעקב",
    conversion: "המרה",
    loading: "טוען מעקבים...",
    loadError: "לא ניתן לטעון מעקבים. נסו שוב.",
    loadingPlan: "טוען תוכנית...",
    planLoadError: "לא ניתן לטעון את תוכנית הטיפול.",
    searchPlaceholder: "חיפוש מטופל, טלפון או שירות",
    searchResults: "תוצאות חיפוש",
    noSearchResultsTitle: "לא נמצאו תוצאות",
    noSearchResultsBody: "",
    needsAttentionNow: "דורש מעקב עכשיו",
    emptyByFilter: {
      TODAY:    { title: "אין מעקבים להיום",          body: "בדוק 'באיחור' למטופלים שפוספסו." },
      THIS_WEEK:{ title: "אין מעקבים ב-7 הימים הקרובים", body: "אין תזכורות לשבעת הימים הקרובים." },
      UPCOMING: { title: "אין מעקבים קרובים",          body: "מעקבים עתידיים יופיעו כאן." },
      OVERDUE:  { title: "אין מעקבים באיחור",          body: "מצוין — כל המטופלים מעודכנים." },
      CONTACTED:{ title: "אין מעקבים שנוצר אליהם קשר", body: "סמן מעקב כ'נוצר קשר' כדי שיופיע כאן." },
      BOOKED:   { title: "אין מעקבים שנקבעו",          body: "מעקבים שהובילו לקביעת תור יופיעו כאן." },
      COMPLETED:{ title: "אין מעקבים שהושלמו",         body: "מפגשי מעקב שהושלמו יופיעו כאן." },
      CANCELLED:{ title: "אין מעקבים שבוטלו",          body: "מפגשים שהתור שלהם בוטל יופיעו כאן." },
    },
    session: "מפגש",
    recurringFollowUp: "מעקב מחזורי",
    recurringTypeBadge: "♾ מעקב מחזורי",
    finitePlanTypeBadge: "📋 תוכנית טיפול",
    recurringLifetime: "מעקב מחזורי מתמשך",
    everyInterval: (n: number, unit: string) => `כל ${n} ${unit}`,
    recurringUnits: {
      DAY: (n: number) => (n === 1 ? "יום" : "ימים"),
      WEEK: (n: number) => (n === 1 ? "שבוע" : "שבועות"),
      MONTH: (n: number) => (n === 1 ? "חודש" : "חודשים"),
      YEAR: (n: number) => (n === 1 ? "שנה" : "שנים"),
    },
    lastSession: "טיפול אחרון",
    nextFollowUpDate: "המעקב הבא",
    sessionOf: (n: number, total: number) => `מפגש ${n} מתוך ${total}`,
    sessionNum: (n: number) => `מפגש ${n}`,
    dueDate: "תאריך יעד",
    minuteUnit: "דק׳",
    remainingDays: (n: number) => `נותרו ${n} ימים`,
    remainingOneDay: "נותר יום",
    afterHours: (h: number) => `בעוד ${h} שעות`,
    todayBadge: "היום",
    overdueDays: (n: number) => `${n} ימים באיחור`,
    overdueRelativeOneDay: "יום אחד באיחור",
    whatsapp: "וואטסאפ",
    createAppointment: "קביעת מפגש",
    appointmentLinked: "תור מקושר",
    appointmentBooked: "נקבע תור",
    viewAppointment: "הצג תור",
    editAppointment: "עריכת תור",
    appointmentDate: "תאריך תור",
    appointmentStartTime: "שעת התחלה",
    appointmentEndTime: "שעת סיום",
    appointmentTime: "שעת תור",
    appointmentStatus: "סטטוס תור",
    bookedAppointmentMissingLink: "נקבע תור, אך קישור התור אינו זמין.",
    bookedSessions: (n: number) => `${n} נקבעו`,
    remainingSessions: (n: number) => `${n} נותרו`,
    completionDate: "תאריך השלמה",
    markContacted: "יצרתי קשר",
    markBooked: "נקבע",
    markCompleted: "הושלם",
    saveNote: "שמור",
    notePlaceholder: "הוסף הערה",
    service: "שירות",
    patientLabel: "מטופל",
    phoneLabel: "טלפון",
    planLabel: "תוכנית",
    lastTreatmentLabel: "טיפול אחרון",
    provider: "מטפל",
    status: "סטטוס",
    appointmentNotes: "הערות טיפול",
    internalNotes: "הערות פנימיות",
    noClinicalNotes: "לא נרשמו הערות טיפול.",
    noCompletedTreatment: "לא נמצא טיפול קודם.",
    nextFollowUpLabel: "המעקב הבא",
    editDueDate: "עריכת תאריך",
    snoozePostpone: "דחייה",
    saveDueDate: "שמירת תאריך",
    dueDateHelper: "לדוגמה: 30 ימים מעכשיו",
    expandPatient: "הצג תוכנית",
    collapsePatient: "הסתר תוכנית",
    sessionsCount: (n: number) => `${n} מפגשים`,
    completedSessions: (n: number) => `${n} הושלמו`,
    planSessions: (done: number, total: number) => `${done} / ${total}`,
    nextDue: "הבא",
    matchingSessionsHeader: "תואמים לסינון זה",
    otherSessionsHeader: "שאר המפגשים בתוכנית",
    otherFollowUpsHeader: "מעקבים נוספים",
    actionsMenu: "פעולות",
    priorityOverdue: "באיחור",
    priorityToday: "היום",
    priorityThisWeek: "7 הימים הקרובים",
    priorityUpcoming: "קרובים",
    activeFollowUps: (n: number) => `${n} פעילים`,
    message: (p: string, s: string, c: string) =>
      `שלום ${p},\nנזכיר שהמפגש הבא עבור ${s} ב-${c} מתקרב.\nנשמח לקבוע עבורך תור מתאים.`,
    suggestedAction: "פעולה מומלצת",
    suggestedWhatsapp: "שליחת תזכורת וואטסאפ",
    suggestedAppointment: "יצירת תור לטיפול הבא",
    suggestedComplete: "השלמת הטיפול שנקבע",
    planPhaseHeader: (phase: number, days: number) => `שלב ${phase} — כל ${days} ימים`,
    planPhaseTitle: (phase: number) => `שלב טיפול ${phase}`,
    planPhaseSubtitle: (from: number, to: number, days: number) => `טיפולים ${from} → ${to} • כל ${days} ימים`,
    treatmentJourney: "מסע הטיפול של המטופל",
    treatmentSummary: "סיכום טיפול",
    diagnosisCondition: "אבחנה / מצב",
    mainTreatment: "טיפול עיקרי",
    planType: "סוג תוכנית",
    currentProgress: "התקדמות נוכחית",
    assignedProvider: "מטפל אחראי",
    lastCompletedSession: "טיפול אחרון שהושלם",
    nextUpcomingSession: "הטיפול הקרוב",
    medicalNotes: "הערות מטופל / רפואיות",
    planStartDate: "תאריך תחילת תוכנית",
    expectedCompletion: "סיום צפוי",
    notRecorded: "לא נרשם",
    noProviderAssigned: "לא שובץ מטפל",
    noPlan: "ללא תוכנית",
    treatmentPlanSessions: (n: number) => `תוכנית טיפול — ${n} מפגשים`,
    sessionTitleWithService: (session: string, service: string) => `${session} — ${service}`,
    completedStatus: "הושלם",
    closedEarlyStatus: "נסגר מוקדם",
    missedStatus: "פוספס",
    cancelledStatus: "בוטל",
    todayStatus: "היום",
    overdueStatus: "באיחור",
    upcomingStatus: "קרוב",
    closePlanEarly: "סגירת תוכנית מוקדמת",
    closePlanConfirmTitle: "לסגור את תוכנית הטיפול?",
    closePlanConfirmBody: "המפגשים הקרובים והתזכורות שנותרו ייעצרו.",
    closePlanReasonLabel: "סיבה",
    closePlanReasonResult: "התוצאה הושגה",
    closePlanReasonPatient: "המטופל ביקש לעצור",
    closePlanReasonDoctor: "החלטת רופא",
    closePlanReasonOther: "סיבה אחרת",
    closePlanOtherPlaceholder: "כתבו את הסיבה",
    confirmClosePlan: "סגור תוכנית",
    cancel: "ביטול",
    closedEarlyAt: "תאריך סגירה",
    closedEarlyReason: "סיבה",
    closedEarlyAfter: "נסגר אחרי",
    closedEarlyAfterProgress: (done: number, total: number) => `${done}/${total} מפגשים`,
  },
} satisfies Record<SupportedLocale, Record<string, unknown>>;

const recurringCopy = {
  ar: {
    plansTab: "خطط الجلسات", recurringTab: "دورية", nearDue: "قريبة الاستحقاق",
    today: "اليوم", overdue: "متأخرة", contacted: "تم التواصل", booked: "تم الحجز",
    branch: "الفرع", recurrence: "التكرار", lastAppointment: "آخر موعد",
    nextDue: "الاستحقاق القادم", status: "الحالة", reminderCount: "مرات التذكير",
    sendReminder: "إرسال تذكير واتساب", markContacted: "تحديد تم التواصل",
    bookAppointment: "حجز الموعد القادم", skipCycle: "تخطي هذه الدورة",
    pause: "إيقاف المتابعة الدورية",
    confirmSkip: "هل تريد تخطي دورة المتابعة الحالية وإنشاء الدورة التالية؟",
    confirmPause: "هل تريد إيقاف هذه المتابعة الدورية؟",
    noRows: "لا توجد متابعات دورية ضمن هذا الفلتر.", dueToday: "دورية مستحقة اليوم",
    dueSoon: "دورية خلال 7 أيام", overdueCounter: "دورية متأخرة",
    paused: "متوقفة", skipped: "تم التخطي",
  },
  en: {
    plansTab: "Session plans", recurringTab: "Recurring", nearDue: "Due soon",
    today: "Today", overdue: "Overdue", contacted: "Contacted", booked: "Booked",
    branch: "Branch", recurrence: "Recurrence", lastAppointment: "Last appointment",
    nextDue: "Next due date", status: "Status", reminderCount: "Reminder count",
    sendReminder: "Send WhatsApp reminder", markContacted: "Mark as contacted",
    bookAppointment: "Book next appointment", skipCycle: "Skip this cycle",
    pause: "Pause recurring follow-up",
    confirmSkip: "Skip this cycle and create the next recurring cycle?",
    confirmPause: "Pause this recurring follow-up?",
    noRows: "No recurring follow-ups match this filter.", dueToday: "Recurring due today",
    dueSoon: "Recurring due within 7 days", overdueCounter: "Recurring overdue",
    paused: "Paused", skipped: "Skipped",
  },
  he: {
    plansTab: "תוכניות מפגשים", recurringTab: "מחזורי", nearDue: "קרוב למועד",
    today: "היום", overdue: "באיחור", contacted: "נוצר קשר", booked: "נקבע",
    branch: "סניף", recurrence: "מחזוריות", lastAppointment: "תור אחרון",
    nextDue: "מועד הבא", status: "סטטוס", reminderCount: "מספר תזכורות",
    sendReminder: "שליחת תזכורת בוואטסאפ", markContacted: "סימון שנוצר קשר",
    bookAppointment: "קביעת התור הבא", skipCycle: "דילוג על מחזור זה",
    pause: "השהיית מעקב מחזורי",
    confirmSkip: "לדלג על המחזור הנוכחי וליצור את המחזור הבא?",
    confirmPause: "להשהות את המעקב המחזורי?",
    noRows: "אין מעקבים מחזוריים התואמים למסנן.", dueToday: "מחזורי להיום",
    dueSoon: "מחזורי בתוך 7 ימים", overdueCounter: "מחזורי באיחור",
    paused: "מושהה", skipped: "דולג",
  },
} as const;

type CopyText = typeof copy.en;

type FollowUpPhaseRule = { fromSessionNumber: number; toSessionNumber: number; intervalDays: number };

function parseFollowUpPhaseRules(rules: unknown): FollowUpPhaseRule[] {
  if (!Array.isArray(rules)) return [];
  return rules.reduce<FollowUpPhaseRule[]>((acc, r) => {
    if (!r || typeof r !== "object") return acc;
    const obj = r as Record<string, unknown>;
    const from = Number(obj.fromSessionNumber);
    const to = Number(obj.toSessionNumber);
    const interval = Number(obj.intervalDays);
    if (Number.isInteger(from) && Number.isInteger(to) && Number.isInteger(interval) && from > 0 && to >= from && interval > 0) {
      acc.push({ fromSessionNumber: from, toSessionNumber: to, intervalDays: interval });
    }
    return acc;
  }, []).sort((a, b) => a.fromSessionNumber - b.fromSessionNumber);
}

// ── helpers ───────────────────────────────────────────────────────────────────

const filters: PatientFollowUpFilter[] = [
  "TODAY", "THIS_WEEK", "OVERDUE", "UPCOMING", "CONTACTED", "BOOKED", "COMPLETED", "CANCELLED",
];

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function followUpPlanBadgeClass(isRecurring: boolean) {
  return isRecurring
    ? "border-[#C7D2FE] bg-[#EEF0FF] text-[#3730A3]"
    : "border-[#BFDBFE] bg-[#EAF3FF] text-[#0B4A8B]";
}

function followUpPlanBadgeLabel(item: TenantPatientFollowUp, text: CopyText) {
  return item.isRecurring ? text.recurringTypeBadge : text.finitePlanTypeBadge;
}

function recurringIntervalText(item: TenantPatientFollowUp, text: CopyText) {
  if (!item.isRecurring || !item.recurringIntervalValue || !item.recurringIntervalUnit) return null;
  const unit = text.recurringUnits[item.recurringIntervalUnit](item.recurringIntervalValue);
  return text.everyInterval(item.recurringIntervalValue, unit);
}

function parseLocalDueDate(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours = 0, minutes = 0] = (timePart ?? "").slice(0, 5).split(":").filter(Boolean).map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function localDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addLocalDays(d: Date, days: number) {
  const next = startOfLocalDay(d);
  next.setDate(next.getDate() + days);
  return next;
}

function getUrgencyInfo(dueDate: string, locale: SupportedLocale, text: CopyText) {
  const now = new Date();
  const due = parseLocalDueDate(dueDate);
  const dayDiff = Math.round(
    (startOfLocalDay(due).getTime() - startOfLocalDay(now).getTime()) / 86_400_000,
  );

  if (dayDiff === 0)
    return { label: text.todayBadge, className: "bg-[#FFF1DC] text-[#854D0E]", ring: "ring-[#F59E0B]" };
  if (dayDiff > 0) {
    const h = Math.ceil((due.getTime() - now.getTime()) / 3_600_000);
    const label =
      h > 0 && h < 24 ? text.afterHours(h) : dayDiff === 1 ? text.remainingOneDay : text.remainingDays(dayDiff);
    return { label, className: "bg-[#EEF4FF] text-[#0B2D5C]", ring: "" };
  }
  const od = Math.abs(dayDiff);
  const label = od === 1 ? text.overdueRelativeOneDay : text.overdueDays(od);
  return { label, className: "bg-[#FFF1F1] text-[#B42318]", ring: "ring-[#F87171]" };
}

function getDueDayDiff(dueDate: string) {
  const now = new Date();
  const due = parseLocalDueDate(dueDate);
  return Math.round(
    (startOfLocalDay(due).getTime() - startOfLocalDay(now).getTime()) / 86_400_000,
  );
}

function serviceName(
  service: TenantPatientFollowUp["service"],
  _locale: SupportedLocale,
) {
  if (!service) return "";
  return service.nameEn || service.nameAr || service.nameHe;
}

function patientDisplayName(patient: TenantPatientFollowUp["patient"], _locale: SupportedLocale) {
  return patient.fullName;
}

type LinkedAppointmentDetails =
  | NonNullable<TenantPatientFollowUp["linkedAppointment"]>
  | NonNullable<TenantPatientFollowUp["nextAppointment"]>;

function getLinkedAppointment(item: TenantPatientFollowUp): LinkedAppointmentDetails | null {
  return item.linkedAppointment ?? item.nextAppointment ?? null;
}

function linkedAppointmentDate(appointment: LinkedAppointmentDetails | null) {
  if (!appointment) return null;
  return "date" in appointment ? appointment.date : appointment.appointmentDate;
}

function formatAppointmentTime(value: string | null | undefined, text: CopyText) {
  return value ? formatTime12h(value) : text.notRecorded;
}

function providerDisplayName(item: TenantPatientFollowUp, text: CopyText) {
  const linkedAppointment = getLinkedAppointment(item);
  return (
    linkedAppointment?.provider?.fullName ??
    item.lastTreatment?.provider?.fullName ??
    item.treatmentTimeline.find((entry) => entry.provider?.fullName)?.provider?.fullName ??
    text.noProviderAssigned
  );
}

type FollowUpWithOptionalAppointmentLinks = TenantPatientFollowUp & {
  linkedAppointmentId?: string | null;
};

function getLinkedAppointmentId(item: TenantPatientFollowUp): string | null {
  return item.linkedAppointmentId ?? item.nextAppointmentId ?? null;
}

type SessionVisualState = "UNBOOKED" | "BOOKED" | "COMPLETED" | "MISSED" | "CLOSED_EARLY" | "CANCELLED" | "SKIPPED" | "PAUSED";

function sessionVisualState(item: TenantPatientFollowUp): SessionVisualState {
  return item.effectiveVisualState as SessionVisualState;
}

function isBookedSession(item: TenantPatientFollowUp) {
  return sessionVisualState(item) === "BOOKED";
}

function isCompletedSession(item: TenantPatientFollowUp) {
  return sessionVisualState(item) === "COMPLETED";
}

function appointmentStatusLabel(status: string | null | undefined, locale: SupportedLocale) {
  const labels: Record<string, Record<SupportedLocale, string>> = {
    CANCELLED: { ar: "ملغي", en: "Cancelled", he: "בוטל" },
    COMPLETED: { ar: "مكتمل", en: "Completed", he: "הושלם" },
    CONFIRMED: { ar: "مؤكد", en: "Confirmed", he: "מאושר" },
    SCHEDULED: { ar: "مجدول", en: "Scheduled", he: "נקבע" },
  };
  return status ? labels[status]?.[locale] ?? status : "";
}

function planDisplayName(
  item: TenantPatientFollowUp,
  totalSessions: number | null,
  text: CopyText,
) {
  if (item.isRecurring) {
    return recurringIntervalText(item, text) || text.recurringLifetime;
  }

  if (totalSessions && totalSessions > 0) {
    return text.treatmentPlanSessions(totalSessions);
  }

  if (item.service?.followUpMode === "SESSION_BASED_PLAN") {
    return text.finitePlanTypeBadge;
  }

  return text.noPlan;
}

function sessionDisplayName(
  item: TenantPatientFollowUp,
  totalSessions: number | null,
  text: CopyText,
) {
  if (item.isRecurring) return text.recurringFollowUp;
  if (item.sessionNumber != null && totalSessions && totalSessions > 0) {
    return text.sessionOf(item.sessionNumber, totalSessions);
  }
  if (item.sessionNumber != null) return text.sessionNum(item.sessionNumber);
  return text.session;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤئ]/g, "ء")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function itemProviderNames(item: TenantPatientFollowUp) {
  const names = new Set<string>();
  if (item.lastTreatment?.provider?.fullName) names.add(item.lastTreatment.provider.fullName);
  for (const entry of item.treatmentTimeline) {
    if (entry.provider?.fullName) names.add(entry.provider.fullName);
  }
  return [...names];
}

function itemSearchRank(item: TenantPatientFollowUp, rawQuery: string, locale: SupportedLocale) {
  const query = normalizeSearchText(rawQuery);
  const phoneQuery = normalizePhone(rawQuery);
  if (!query && !phoneQuery) return null;

  const phone = normalizePhone(item.patient.phone);
  if (phoneQuery && phone === phoneQuery) return 1;
  if (phoneQuery && phone.includes(phoneQuery)) return 3;

  const names = [
    item.patient.fullName,
  ].map(normalizeSearchText).filter(Boolean);

  if (names.some((name) => name === query)) return 2;
  if (names.some((name) => name.includes(query))) return 3;

  const services = [
    serviceName(item.service, locale),
    item.title,
  ].map(normalizeSearchText).filter(Boolean);

  if (services.some((name) => name.includes(query))) return 4;

  const providers = itemProviderNames(item).map(normalizeSearchText).filter(Boolean);
  if (providers.some((name) => name.includes(query))) return 5;

  return null;
}

function highlightText(value: string, query: string): ReactNode {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return value;

  const source = value;
  const normalizedSource = normalizeSearchText(source);
  const matchIndex = normalizedSource.indexOf(normalizedQuery);
  if (matchIndex < 0) return value;

  const rawLower = source.toLowerCase();
  const rawQuery = query.trim().toLowerCase();
  const rawIndex = rawQuery ? rawLower.indexOf(rawQuery) : -1;
  if (rawIndex < 0) return value;

  return (
    <>
      {source.slice(0, rawIndex)}
      <mark className="rounded-sm bg-[#FFF3BF] px-0.5 text-inherit">{source.slice(rawIndex, rawIndex + rawQuery.length)}</mark>
      {source.slice(rawIndex + rawQuery.length)}
    </>
  );
}

function whatsappHref(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
}

function closeReasonLabel(reason: string, text: CopyText) {
  const labels: Record<string, string> = {
    DOCTOR_DECISION: text.closePlanReasonDoctor,
    OTHER: text.closePlanReasonOther,
    PATIENT_REQUEST: text.closePlanReasonPatient,
    RESULT_ACHIEVED: text.closePlanReasonResult,
  };
  return labels[reason] ?? reason;
}

function isActionableFollowUp(item: TenantPatientFollowUp) {
  return !["BOOKED", "COMPLETED", "CLOSED_EARLY", "CANCELLED", "SKIPPED", "PAUSED"].includes(item.effectiveStatus);
}

function isActiveFollowUp(item: TenantPatientFollowUp) {
  return ["DUE", "UPCOMING", "CONTACTED", "MISSED"].includes(item.effectiveStatus);
}

function isClosedPlan(item: TenantPatientFollowUp) {
  return item.planStatus === "CLOSED_EARLY" || item.planStatus === "PAUSED" || item.effectiveStatus === "CLOSED_EARLY" || item.effectiveStatus === "PAUSED";
}

function planClosureInfo(items: TenantPatientFollowUp[]) {
  return items.find((item) => item.planStatus === "CLOSED_EARLY" || item.closedEarlyAt) ?? null;
}

function canClosePlanEarly(items: TenantPatientFollowUp[]) {
  const finiteItems = items.filter((item) => !item.isRecurring);
  if (finiteItems.length === 0 || finiteItems.some((item) => item.planStatus === "CLOSED_EARLY")) {
    return false;
  }

  return finiteItems.some((item) =>
    ["DUE", "UPCOMING", "CONTACTED", "MISSED"].includes(item.effectiveStatus) &&
    !item.linkedAppointmentId,
  );
}

function shouldAutoExpandGroup(group: PatientGroup) {
  return group.items.some((item) => {
    if (!isActiveFollowUp(item)) return false;
    const dayDiff = getDueDayDiff(item.dueDate);
    return dayDiff <= 0;
  });
}

function knownSessionTotal(
  nearest: TenantPatientFollowUp,
  planItems: TenantPatientFollowUp[],
) {
  const snapshotTotals = [
    nearest.planTotalSessions,
    ...planItems.map((item) => item.planTotalSessions),
  ].filter((value): value is number => typeof value === "number" && value > 0);

  if (snapshotTotals.length > 0) {
    return Math.max(...snapshotTotals);
  }

  const finitePlanItems = planItems.filter((item) => !item.isRecurring);
  const sessionNumbers = [
    nearest.isRecurring ? null : nearest.sessionNumber,
    ...nearest.treatmentTimeline.map((entry) => entry.sessionNumber),
    ...finitePlanItems.map((item) => item.sessionNumber),
  ].filter((value): value is number => typeof value === "number");

  return sessionNumbers.length > 0 ? Math.max(...sessionNumbers) : null;
}

function planDateRange(items: TenantPatientFollowUp[]) {
  const dates = items.flatMap((item) => [
    item.dueDate,
    item.lastTreatment?.appointmentDate ?? null,
    item.nextAppointment?.appointmentDate ?? null,
    ...item.treatmentTimeline.map((entry) => entry.date),
  ]).filter((value): value is string => Boolean(value));

  if (dates.length === 0) return { end: null, start: null };
  const sorted = [...dates].sort();
  return { end: sorted[sorted.length - 1], start: sorted[0] };
}

function latestCompletedSession(items: TenantPatientFollowUp[]) {
  const completedTimeline = items
    .flatMap((item) => item.treatmentTimeline)
    .filter((entry) => entry.type === "COMPLETED")
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (completedTimeline) return completedTimeline.date;

  return items
    .map((item) => item.lastTreatment?.appointmentDate ?? null)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

function nextUpcomingSession(items: TenantPatientFollowUp[]) {
  const today = localDateKey(new Date());
  return [...items]
    .filter((item) => !["COMPLETED", "CANCELLED"].includes(item.effectiveStatus))
    .sort((a, b) => {
      const aFuture = a.dueDate >= today ? 0 : 1;
      const bFuture = b.dueDate >= today ? 0 : 1;
      if (aFuture !== bFuture) return aFuture - bFuture;
      return a.dueDate.localeCompare(b.dueDate);
    })[0] ?? null;
}

function primaryProvider(items: TenantPatientFollowUp[]) {
  for (const item of items) {
    if (item.lastTreatment?.provider?.fullName) return item.lastTreatment.provider.fullName;
    const timelineProvider = item.treatmentTimeline.find((entry) => entry.provider?.fullName)?.provider?.fullName;
    if (timelineProvider) return timelineProvider;
  }
  return null;
}

function primaryMedicalNote(items: TenantPatientFollowUp[]) {
  for (const item of items) {
    const note =
      item.lastTreatment?.notes?.trim() ||
      item.lastTreatment?.internalNotes?.trim() ||
      item.notes?.trim();
    if (note) return note;
  }
  return null;
}

function sessionTitle(
  item: TenantPatientFollowUp,
  locale: SupportedLocale,
  text: CopyText,
  totalSessions: number | null,
) {
  const sessionLabel = sessionDisplayName(item, totalSessions, text);
  const svc = serviceName(item.service, locale) || item.title;
  return svc ? text.sessionTitleWithService(sessionLabel, svc) : sessionLabel;
}

function statusVisual(item: TenantPatientFollowUp, text: CopyText) {
  const state = sessionVisualState(item);

  if (state === "COMPLETED") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "✓",
      label: text.completedStatus,
      rail: "bg-emerald-500",
    };
  }

  if (state === "BOOKED") {
    return {
      badge: "border-blue-200 bg-blue-50 text-blue-800",
      icon: "📅",
      label: text.appointmentBooked,
      rail: "bg-blue-500",
    };
  }

  if (state === "CANCELLED") {
    return {
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      icon: "×",
      label: text.cancelledStatus,
      rail: "bg-slate-400",
    };
  }

  if (state === "CLOSED_EARLY") {
    return {
      badge: "border-slate-200 bg-slate-50 text-slate-700",
      icon: "−",
      label: text.closedEarlyStatus,
      rail: "bg-slate-500",
    };
  }

  if (state === "MISSED") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      icon: "!",
      label: text.missedStatus,
      rail: "bg-red-500",
    };
  }

  const dayDiff = getDueDayDiff(item.dueDate);
  if (item.effectiveStatus === "DUE" && dayDiff === 0) {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      icon: "!",
      label: text.todayStatus,
      rail: "bg-amber-500",
    };
  }

  if (dayDiff < 0 || item.effectiveStatus === "MISSED") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      icon: "!",
      label: text.overdueStatus,
      rail: "bg-red-500",
    };
  }

  return {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    icon: "•",
    label: text.upcomingStatus,
    rail: "bg-blue-500",
  };
}

function priorityBarCounts(analytics: TenantFollowUpAnalytics | null) {
  return {
    overdue: analytics?.overdue ?? 0,
    today: analytics?.dueToday ?? 0,
    thisWeek: analytics?.thisWeek ?? 0,
    upcoming: analytics?.upcoming ?? 0,
    cancelled: analytics?.cancelled ?? 0,
  };
}

// Mirror of the backend buildListWhere status rules — used to split the
// expanded session timeline into "matches this filter" vs "other sessions".
function sessionMatchesFilter(
  item: TenantPatientFollowUp,
  filter: PatientFollowUpFilter,
): boolean {
  const now = new Date();
  const todayStr = localDateKey(now);
  const tomorrowStr = localDateKey(addLocalDays(now, 1));
  const sevenDaysFromTodayStr = localDateKey(addLocalDays(now, 7));
  const due = item.dueDate.slice(0, 10);
  // Use effectiveStatus everywhere so the client split matches the backend's
  // appointment-derived filters (BOOKED/COMPLETED come from the linked appointment).
  const isDateFilterEligible = !["COMPLETED", "CLOSED_EARLY", "CANCELLED"].includes(item.effectiveStatus);

  let computedVisibility = true;
  switch (filter) {
    case "TODAY":
      computedVisibility = due === todayStr && isDateFilterEligible;
      break;
    case "THIS_WEEK":
      // Non-terminal sessions due from today through today+7 (inclusive),
      // including BOOKED. Terminal states (COMPLETED/CANCELLED/CLOSED_EARLY/MISSED)
      // are excluded by the status list.
      computedVisibility =
        due >= todayStr &&
        due <= sevenDaysFromTodayStr &&
        ["UPCOMING", "DUE", "BOOKED", "CONTACTED"].includes(item.effectiveStatus);
      break;
    case "OVERDUE":
      computedVisibility = due < todayStr && isDateFilterEligible;
      break;
    case "UPCOMING":
      // Strict status categorization: UPCOMING shows ONLY actionable, future-oriented
      // sessions — UPCOMING, DUE, BOOKED. It must never include CANCELLED,
      // CLOSED_EARLY, COMPLETED, MISSED (or CONTACTED, which has its own filter).
      computedVisibility = ["UPCOMING", "DUE", "BOOKED"].includes(item.effectiveStatus);
      break;
    case "CONTACTED":
      computedVisibility = item.effectiveStatus === "CONTACTED";
      break;
    case "BOOKED":
      computedVisibility = item.effectiveStatus === "BOOKED";
      break;
    case "COMPLETED":
      computedVisibility = item.effectiveStatus === "COMPLETED";
      break;
    case "CANCELLED":
      computedVisibility = item.effectiveStatus === "CANCELLED";
      break;
    default:
      computedVisibility = true;
      break;
  }

  return computedVisibility;
}

function actionableDueTime(item: TenantPatientFollowUp) {
  return new Date(`${item.dueDate}T00:00:00.000Z`).getTime();
}

function getNextActionableId(items: TenantPatientFollowUp[]) {
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`).getTime();
  const actionable = [...items]
    .filter(isActionableFollowUp)
    .sort((a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0));
  const future = actionable.filter((r) => actionableDueTime(r) >= today);
  if (future.length > 0)
    return future.sort((a, b) => actionableDueTime(a) - actionableDueTime(b))[0].id;
  return actionable.sort(
    (a, b) => Math.abs(today - actionableDueTime(a)) - Math.abs(today - actionableDueTime(b)),
  )[0]?.id ?? null;
}

function sortPlan(items: TenantPatientFollowUp[]) {
  return [...items].sort((a, b) => {
    if (a.sessionNumber !== null && b.sessionNumber !== null && a.sessionNumber !== b.sessionNumber)
      return a.sessionNumber - b.sessionNumber;
    if (a.sessionNumber !== null && b.sessionNumber === null) return -1;
    if (a.sessionNumber === null && b.sessionNumber !== null) return 1;
    const dc = (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    return dc !== 0 ? dc : a.id.localeCompare(b.id);
  });
}

// Groups items from the current filter response by patient.
// Each group shows the nearest (first-due) item as the summary.
type PatientGroup = {
  patientId: string;
  patient: TenantPatientFollowUp["patient"];
  nearest: TenantPatientFollowUp;
  items: TenantPatientFollowUp[];
};

function groupByPatient(items: TenantPatientFollowUp[]): PatientGroup[] {
  const map = new Map<string, PatientGroup>();
  const sorted = [...items].sort((a, b) =>
    a.dueDate === b.dueDate ? a.id.localeCompare(b.id) : a.dueDate.localeCompare(b.dueDate),
  );
  for (const item of sorted) {
    const g = map.get(item.patientId);
    if (g) { g.items.push(item); continue; }
    map.set(item.patientId, { patientId: item.patientId, patient: item.patient, nearest: item, items: [item] });
  }
  return [...map.values()].sort((a, b) => a.nearest.dueDate.localeCompare(b.nearest.dueDate));
}

// ── session status visuals ────────────────────────────────────────────────────

function sessionDotClass(item: TenantPatientFollowUp) {
  switch (sessionVisualState(item)) {
    case "COMPLETED": return "bg-[#22C55E]";
    case "BOOKED":    return "bg-[#2563EB]";
    case "MISSED":    return "bg-[#EF4444]";
    case "CLOSED_EARLY": return "bg-[#64748B]";
    case "CANCELLED": return "bg-[#D1D5DB]";
    default:          return "bg-[#94A3B8]";
  }
}

function sessionCardTone(item: TenantPatientFollowUp, isNext: boolean) {
  const state = sessionVisualState(item);
  if (state === "BOOKED") return "border-[#93C5FD] bg-[#EFF6FF] shadow-[0_12px_30px_rgba(37,99,235,0.10)]";
  if (state === "COMPLETED") return "border-[#A7F3D0] bg-[#F0FDF4]";
  if (state === "MISSED") return "border-[#FECACA] bg-[#FFF7F7]";
  if (state === "CLOSED_EARLY") return "border-[#CBD5E1] bg-[#F8FAFC] opacity-80";
  if (state === "CANCELLED") return "border-[#E5E7EB] bg-[#F9FAFB] opacity-60";
  if (isNext) return "border-[#C8A45D] bg-[#FFFCF4]";
  if (item.effectiveStatus === "DUE") return "border-[#FECACA] bg-[#FFFAFA]";
  return "border-[#E8ECF2] bg-white";
}

// ── ProgressDots ─────────────────────────────────────────────────────────────

function ProgressDots({ items }: { items: TenantPatientFollowUp[] }) {
  const MAX = 10;
  const visible = items.slice(0, MAX);
  return (
    <span className="inline-flex items-center gap-0.5">
      {visible.map((item) => (
        <span
          key={item.id}
          className={`inline-block h-2 w-2 rounded-full ${sessionDotClass(item)}`}
          title={item.effectiveStatus}
        />
      ))}
      {items.length > MAX && (
        <span className="ms-0.5 text-[10px] font-bold text-[#66758a]">+{items.length - MAX}</span>
      )}
    </span>
  );
}

function TreatmentSummaryCard({
  items,
  locale,
  nearest,
  text,
  totalSessions,
}: {
  items: TenantPatientFollowUp[];
  locale: SupportedLocale;
  nearest: TenantPatientFollowUp;
  text: CopyText;
  totalSessions: number | null;
}) {
  const service = serviceName(nearest.service, locale) || nearest.title;
  const range = planDateRange(items);
  const next = nextUpcomingSession(items);
  const provider = primaryProvider(items) ?? text.noProviderAssigned;
  const medicalNote = primaryMedicalNote(items);
  const finiteItems = items.filter((item) => !item.isRecurring);
  const progressTotal = totalSessions ?? finiteItems.length;
  const visualCompletedCount = finiteItems.filter(isCompletedSession).length;
  const bookedCount = finiteItems.filter(isBookedSession).length;
  const remainingCount = Math.max(progressTotal - visualCompletedCount - bookedCount, 0);
  const progressValue = progressTotal > 0 ? Math.min(100, Math.round((visualCompletedCount / progressTotal) * 100)) : 0;
  const currentProgress = progressTotal > 0
    ? text.planSessions(visualCompletedCount, progressTotal)
    : text.notRecorded;
  const patient = patientDisplayName(nearest.patient, locale);
  const plan = planDisplayName(nearest, totalSessions, text);
  const currentSession = sessionDisplayName(nearest, totalSessions, text);
  const closure = planClosureInfo(finiteItems);
  const closedAfter = closure?.closedEarlyAfterSession ?? visualCompletedCount;
  const closureReason = closure?.closedEarlyReason
    ? closeReasonLabel(closure.closedEarlyReason, text)
    : null;

  const detailItems = [
    { label: text.patientLabel, value: `${patient} · ${nearest.patient.phone}`, wide: true },
    { label: text.diagnosisCondition, value: medicalNote ?? text.notRecorded, wide: true },
    { label: text.service, value: service || text.notRecorded },
    { label: text.provider, value: provider },
    { label: text.planLabel, value: plan },
    { label: text.session, value: currentSession },
    { label: text.currentProgress, value: currentProgress },
    { label: text.filters.BOOKED, value: text.bookedSessions(bookedCount) },
    { label: text.filters.UPCOMING, value: text.remainingSessions(remainingCount) },
    {
      label: text.lastCompletedSession,
      value: latestCompletedSession(items) ? formatDate(latestCompletedSession(items) as string) : text.notRecorded,
    },
    {
      label: text.nextUpcomingSession,
      value: next ? `${sessionTitle(next, locale, text, totalSessions)} · ${formatDate(next.dueDate)}` : text.notRecorded,
      wide: true,
    },
    { label: text.planStartDate, value: range.start ? formatDate(range.start) : text.notRecorded },
    { label: text.expectedCompletion, value: range.end ? formatDate(range.end) : text.notRecorded },
    ...(closure
      ? [
          { label: text.status, value: text.closedEarlyStatus },
          {
            label: text.closedEarlyAfter,
            value: text.closedEarlyAfterProgress(closedAfter, progressTotal || finiteItems.length || closedAfter),
          },
          { label: text.closedEarlyAt, value: closure.closedEarlyAt ? formatDate(closure.closedEarlyAt) : text.notRecorded },
          { label: text.closedEarlyReason, value: closureReason || text.notRecorded, wide: true },
        ]
      : []),
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-[#DDE6F0] bg-[#F8FBFD] shadow-[0_16px_38px_rgba(11,45,92,0.08)]">
      <div className="border-b border-[#E5EDF5] bg-white px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#C8A45D]">
              {text.treatmentJourney}
            </p>
            <h3 className="mt-1 break-words text-lg font-black text-[#0B2D5C]">
              {text.treatmentSummary}
            </h3>
            <p className="mt-1 break-words text-sm font-bold text-[#24364f]">
              {service || text.notRecorded}
            </p>
            {closure ? (
              <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                {text.closedEarlyStatus}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 rounded-lg border border-[#DCE8F5] bg-[#F7FAFD] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#66758a]">{text.currentProgress}</span>
              <span className="text-sm font-black text-[#0B2D5C]">{currentProgress}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E5ECF5]">
              <div
                className="h-full rounded-full bg-[#0B2D5C]"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <dl className="grid min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {detailItems.map((detail) => (
          <div
            className={`min-w-0 rounded-lg border border-[#E7EDF4] bg-white px-3 py-3 ${detail.wide ? "lg:col-span-2" : ""}`}
            key={detail.label}
          >
            <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">
              {detail.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-bold leading-5 text-[#24364f]">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── SessionCard ───────────────────────────────────────────────────────────────
// Compact editable card for a single follow-up session inside the expanded patient timeline.

type SessionCardProps = {
  busyId: string | null;
  centerName: string;
  dueDateDraft: string;
  isNext: boolean;
  item: TenantPatientFollowUp;
  locale: SupportedLocale;
  notesDraft: string;
  text: CopyText;
  totalSessions: number | null;
  onDueDateChange: (id: string, value: string) => void;
  onNoteChange: (id: string, value: string) => void;
  onSaveDueDate: (id: string, patientId: string) => void;
  onSaveNote: (id: string, patientId: string) => void;
  onUpdateStatus: (id: string, status: PatientFollowUpStatus, patientId: string) => void;
};

function SessionCard({
  busyId, centerName, dueDateDraft, isNext, item, locale,
  notesDraft, text, totalSessions,
  onDueDateChange, onNoteChange, onSaveDueDate, onSaveNote, onUpdateStatus,
}: SessionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const svcName = serviceName(item.service, locale) || item.title;
  const ptName  = patientDisplayName(item.patient, locale);
  const urgency = getUrgencyInfo(item.dueDate, locale, text);
  const message = text.message(ptName, svcName, centerName);
  const isBusy  = busyId === item.id;
  const tone    = sessionCardTone(item, isNext);
  const typeBadgeClass = followUpPlanBadgeClass(item.isRecurring);
  const intervalText = recurringIntervalText(item, text);
  const visual = statusVisual(item, text);
  const sessionHeading = sessionTitle(item, locale, text, totalSessions);
  const providerName = providerDisplayName(item, text);
  const sessionNote = item.lastTreatment?.notes?.trim() || item.notes?.trim() || "";
  const visualState = sessionVisualState(item);
  const linkedAppointment = getLinkedAppointment(item);
  const appointmentDate = linkedAppointmentDate(linkedAppointment);
  const linkedAppointmentId = getLinkedAppointmentId(item);
  // A usable linked appointment is one that actually fulfils this session. The
  // backend clears the link on NO_SHOW/CANCELLED, so linkedAppointmentId is normally
  // null in those cases; the status guards remain as defensive belt-and-suspenders.
  const hasLinkedAppointment =
    Boolean(item.linkedAppointmentId) &&
    item.linkedAppointmentStatus !== "CANCELLED" &&
    item.linkedAppointmentStatus !== "NO_SHOW";
  const isBookedWithoutAppointmentLink =
    visualState === "BOOKED" && !linkedAppointmentId;
  const isClosedReadOnly = isClosedPlan(item);
  const canBookSession = item.effectiveCanBook;
  const appointmentProvider = linkedAppointment?.provider?.fullName ?? providerName;
  const statusLabel: Record<PatientFollowUpStatus, string> = {
    DUE:       locale === "ar" ? "مستحقة" : locale === "he" ? "לפירעון" : "Due",
    UPCOMING:  locale === "ar" ? "قادمة"  : locale === "he" ? "קרוב"    : "Upcoming",
    CONTACTED: locale === "ar" ? "تم التواصل" : locale === "he" ? "נוצר קשר" : "Contacted",
    BOOKED:    locale === "ar" ? "محجوزة" : locale === "he" ? "נקבע"    : "Booked",
    COMPLETED: locale === "ar" ? "مكتملة" : locale === "he" ? "הושלם"   : "Completed",
    MISSED:    locale === "ar" ? "فائتة"  : locale === "he" ? "פוספס"   : "Missed",
    CLOSED_EARLY: text.closedEarlyStatus,
    SKIPPED: recurringCopy[locale].skipped,
    PAUSED: recurringCopy[locale].paused,
    CANCELLED: locale === "ar" ? "ملغية"  : locale === "he" ? "בוטל"    : "Cancelled",
  };
  const displayStatusLabel =
    visualState === "BOOKED"
      ? statusLabel.BOOKED
      : visualState === "COMPLETED"
      ? statusLabel.COMPLETED
      : visualState === "MISSED"
      ? statusLabel.MISSED
      : visualState === "CANCELLED"
      ? statusLabel.CANCELLED
      : visualState === "CLOSED_EARLY"
      ? statusLabel.CLOSED_EARLY
      : item.effectiveStatus === "BOOKED" && !hasLinkedAppointment
      ? statusLabel.DUE
      : statusLabel[item.effectiveStatus as PatientFollowUpStatus] ?? item.effectiveStatus;
  const appointmentPanelTitle =
    visualState === "COMPLETED"
      ? text.completedStatus
      : visualState === "CANCELLED"
      ? statusLabel.CANCELLED
      : visualState === "CLOSED_EARLY"
      ? text.closedEarlyStatus
      : text.appointmentBooked;

  return (
    <div className={`overflow-visible rounded-xl border p-4 transition-all ${tone}`}>
      {/* Header row */}
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${visual.rail}`}>
            {visual.icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${typeBadgeClass}`}>
                {followUpPlanBadgeLabel(item, text)}
              </span>
              {hasLinkedAppointment ? (
                <span className="inline-flex rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-black text-blue-800">
                  {text.appointmentLinked}
                </span>
              ) : null}
              {isNext ? (
                <span className="inline-flex rounded-full bg-[#0B2D5C] px-2.5 py-1 text-[10px] font-black text-white">
                  {text.nextFollowUpLabel}
                </span>
              ) : null}
            </div>
            <h4 className="mt-2 break-words text-base font-black leading-6 text-[#0B2D5C]">
              {sessionHeading}
            </h4>
            {item.isRecurring ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#66758a]">
                {intervalText ? <span className="font-bold text-[#3730A3]">{intervalText}</span> : null}
                <span>
                  {text.lastSession}:{" "}
                  <span className="font-semibold text-[#24364f]">
                    {item.lastTreatment ? formatDate(item.lastTreatment.appointmentDate) : text.noCompletedTreatment}
                  </span>
                </span>
                <span>
                  {text.nextFollowUpDate}:{" "}
                  <span className="font-semibold text-[#24364f]">{formatDate(item.dueDate)}</span>
                </span>
              </div>
            ) : (
              <p className="mt-1 text-xs font-semibold text-[#66758a]">
                {svcName}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${visual.badge}`}>
            {visual.label}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${urgency.className}`}>
            {urgency.label}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-[#E7EDF4] bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.session}</dt>
          <dd className="mt-1 break-words text-sm font-bold text-[#24364f]">
            {sessionDisplayName(item, totalSessions, text)}
          </dd>
        </div>
        <div className="rounded-lg border border-[#E7EDF4] bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.service}</dt>
          <dd className="mt-1 break-words text-sm font-bold text-[#24364f]">{svcName}</dd>
        </div>
        <div className="rounded-lg border border-[#E7EDF4] bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.status}</dt>
          <dd className="mt-1 text-sm font-bold text-[#24364f]">{displayStatusLabel}</dd>
        </div>
        <div className="rounded-lg border border-[#E7EDF4] bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.dueDate}</dt>
          <dd className="mt-1 text-sm font-bold text-[#24364f]">{formatDate(item.dueDate)}</dd>
        </div>
        <div className="rounded-lg border border-[#E7EDF4] bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.provider}</dt>
          <dd className="mt-1 break-words text-sm font-bold text-[#24364f]">
            {providerName ?? text.noProviderAssigned}
          </dd>
        </div>
      </dl>

      {hasLinkedAppointment ? (
        <div className="mt-3 rounded-xl border border-blue-200 bg-white/90 px-3 py-3 shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
                {appointmentPanelTitle}
              </p>
              <p className="mt-1 break-words text-sm font-black text-[#0B2D5C]">
                {linkedAppointment
                  ? formatAppointmentDateTime(
                      appointmentDate,
                      linkedAppointment.startTime,
                    )
                  : text.appointmentLinked}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {linkedAppointmentId ? (
                <>
                  <Link
                    className="rounded-lg bg-[#0B2D5C] px-3 py-1.5 text-xs font-black text-white hover:bg-[#164575]"
                    href={`/tenant/appointments/${linkedAppointmentId}`}
                  >
                    {text.viewAppointment}
                  </Link>
                  <Link
                    className="rounded-lg border border-[#C7D7EA] bg-white px-3 py-1.5 text-xs font-black text-[#0B2D5C] hover:bg-[#F5F8FC]"
                    href={`/tenant/appointments/${linkedAppointmentId}/edit`}
                  >
                    {text.editAppointment}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-[#E7EDF4] bg-[#F8FBFF] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">
                {visualState === "COMPLETED" ? text.completionDate : text.appointmentDate}
              </dt>
              <dd className="mt-1 text-sm font-bold text-[#24364f]">
                {appointmentDate ? formatDate(appointmentDate) : text.notRecorded}
              </dd>
            </div>
            <div className="rounded-lg border border-[#E7EDF4] bg-[#F8FBFF] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.appointmentStartTime}</dt>
              <dd className="mt-1 text-sm font-bold text-[#24364f]">
                {formatAppointmentTime(linkedAppointment?.startTime, text)}
              </dd>
            </div>
            <div className="rounded-lg border border-[#E7EDF4] bg-[#F8FBFF] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.appointmentEndTime}</dt>
              <dd className="mt-1 text-sm font-bold text-[#24364f]">
                {formatAppointmentTime(linkedAppointment?.endTime, text)}
              </dd>
            </div>
            <div className="rounded-lg border border-[#E7EDF4] bg-[#F8FBFF] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.provider}</dt>
              <dd className="mt-1 break-words text-sm font-bold text-[#24364f]">{appointmentProvider}</dd>
            </div>
            <div className="rounded-lg border border-[#E7EDF4] bg-[#F8FBFF] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.appointmentStatus}</dt>
              <dd className="mt-1 text-sm font-bold text-[#24364f]">
                {appointmentStatusLabel(linkedAppointment?.status, locale) || displayStatusLabel}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {isBookedWithoutAppointmentLink ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
          {text.bookedAppointmentMissingLink}
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-[#E7EDF4] bg-white/75 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">
          {text.medicalNotes}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#526176]">
          {sessionNote || text.noClinicalNotes}
        </p>
      </div>

      {/* Action menu */}
      {!isClosedReadOnly || hasLinkedAppointment ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF1F5] pt-3">
          {!isClosedReadOnly ? (
            <a
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#D8F3EA] bg-[#F0FBF7] px-2.5 text-xs font-bold text-[#0F766E] hover:bg-[#DDF7EE]"
              href={whatsappHref(item.patient.phone, message)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0F766E] text-[9px] font-black text-white">W</span>
              {text.whatsapp}
            </a>
          ) : null}
          <div className="relative">
            <button
              className="inline-flex h-8 items-center rounded-md bg-[#0B2D5C] px-3 text-xs font-bold text-white shadow-sm hover:bg-[#103D78]"
              onClick={() => setShowActions((p) => !p)}
              type="button"
            >
              {text.actionsMenu} <span className="ms-1 text-[10px]">{showActions ? "▲" : "▼"}</span>
            </button>
            {showActions ? (
              <div className="absolute end-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-[#D8DEE8] bg-white py-1 text-xs font-semibold text-[#24364f] shadow-[0_14px_35px_rgba(11,45,92,0.16)]">
                {!isClosedReadOnly ? (
                  <a
                    className="block px-3 py-2 hover:bg-[#F5F7FA]"
                    href={whatsappHref(item.patient.phone, message)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {text.whatsapp}
                  </a>
                ) : null}
                {hasLinkedAppointment ? (
                  <>
                    <Link
                      className="block px-3 py-2 hover:bg-[#F5F7FA]"
                      href={`/tenant/appointments/${linkedAppointmentId}`}
                    >
                      {text.viewAppointment}
                    </Link>
                    {linkedAppointmentId ? (
                      <Link
                        className="block px-3 py-2 hover:bg-[#F5F7FA]"
                        href={`/tenant/appointments/${linkedAppointmentId}/edit`}
                      >
                        {text.editAppointment}
                      </Link>
                    ) : null}
                  </>
                ) : canBookSession ? (
                  <Link
                    className="block px-3 py-2 hover:bg-[#F5F7FA]"
                    href={`/tenant/appointments/new?patientId=${item.patientId}&serviceId=${item.serviceId ?? ""}&followUpId=${item.id}`}
                  >
                    {text.createAppointment}
                  </Link>
                ) : null}
                {!isClosedReadOnly && visualState !== "COMPLETED" && visualState !== "BOOKED" && visualState !== "CANCELLED" && visualState !== "CLOSED_EARLY" ? (
                  <>
                    <button
                      className="block w-full px-3 py-2 text-start hover:bg-[#F5F7FA] disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => {
                        setShowActions(false);
                        onUpdateStatus(item.id, "CONTACTED", item.patientId);
                      }}
                      type="button"
                    >
                      {text.markContacted}
                    </button>
                    <button
                      className="block w-full px-3 py-2 text-start hover:bg-[#F5F7FA] disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => {
                        setShowActions(false);
                        onUpdateStatus(item.id, "BOOKED", item.patientId);
                      }}
                      type="button"
                    >
                      {text.markBooked}
                    </button>
                    <button
                      className="block w-full px-3 py-2 text-start text-[#15803D] hover:bg-[#F0FDF4] disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => {
                        setShowActions(false);
                        onUpdateStatus(item.id, "COMPLETED", item.patientId);
                      }}
                      type="button"
                    >
                      {text.markCompleted}
                    </button>
                  </>
                ) : null}
                {!isClosedReadOnly ? (
                  <button
                    className="block w-full px-3 py-2 text-start hover:bg-[#F5F7FA]"
                    onClick={() => {
                      setShowActions(false);
                      setShowDetails((p) => !p);
                    }}
                    type="button"
                  >
                    {item.isRecurring ? text.snoozePostpone : text.editDueDate}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* Expandable edit section */}
      {showDetails && !isClosedReadOnly ? (
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#EEF1F5] pt-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[#24364f]">
              {item.isRecurring ? text.snoozePostpone : text.editDueDate}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                className="min-h-9 flex-1 rounded-md border border-[#D8DEE8] px-2.5 text-sm text-[#132238]"
                onChange={(e) => onDueDateChange(item.id, e.target.value)}
                type="date"
                value={dueDateDraft}
              />
              <button
                className={buttonClassName("secondary", "sm")}
                disabled={isBusy || !dueDateDraft}
                onClick={() => onSaveDueDate(item.id, item.patientId)}
                type="button"
              >
                {text.saveDueDate}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-[#66758a]">{text.dueDateHelper}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#24364f]">{text.notePlaceholder}</label>
            <div className="mt-1.5 flex gap-2">
              <textarea
                className="min-h-16 flex-1 rounded-md border border-[#D8DEE8] px-2.5 py-1.5 text-xs text-[#132238]"
                onChange={(e) => onNoteChange(item.id, e.target.value)}
                value={notesDraft}
              />
              <button
                className={buttonClassName("ghost", "sm")}
                disabled={isBusy}
                onClick={() => onSaveNote(item.id, item.patientId)}
                type="button"
              >
                {text.saveNote}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

// ── PatientQueueRow ───────────────────────────────────────────────────────────
// Compact patient row: summary in header, full session timeline on expand.

type PatientQueueRowProps = {
  busyId: string | null;
  centerName: string;
  dueDateDraft: Record<string, string>;
  filter: PatientFollowUpFilter;
  group: PatientGroup;
  hasPlanError: boolean;
  isExpanded: boolean;
  isPlanLoading: boolean;
  locale: SupportedLocale;
  nextActionableId: string | null;
  notesDraft: Record<string, string>;
  planItems: TenantPatientFollowUp[];
  rowRef?: (node: HTMLElement | null) => void;
  searchQuery: string;
  showFullPlan: boolean;
  text: CopyText;
  onDueDateChange: (id: string, value: string) => void;
  onNoteChange: (id: string, value: string) => void;
  onSaveDueDate: (id: string, patientId: string) => void;
  onSaveNote: (id: string, patientId: string) => void;
  onToggle: (patientId: string, isExpanded: boolean) => void;
  onUpdateStatus: (id: string, status: PatientFollowUpStatus, patientId: string) => void;
  onClosePlanEarly: (followUpId: string, patientId: string) => void;
};

function PatientQueueRow({
  busyId, centerName, dueDateDraft, filter, group, hasPlanError, isExpanded,
  isPlanLoading, locale, nextActionableId, notesDraft, planItems, rowRef, searchQuery, showFullPlan, text,
  onClosePlanEarly, onDueDateChange, onNoteChange, onSaveDueDate, onSaveNote, onToggle, onUpdateStatus,
}: PatientQueueRowProps) {
  const { nearest, patient, patientId } = group;
  const name    = patientDisplayName(patient, locale);
  const svc     = serviceName(nearest.service, locale) || nearest.title;
  const urgency = getUrgencyInfo(nearest.dueDate, locale, text);
  const planLoaded = planItems.length > 0;
  const finitePlanItems = planItems.filter((item) => !item.isRecurring);
  const totalSessions = knownSessionTotal(nearest, planItems);
  const displayTotalSessions =
    totalSessions ?? nearest.planTotalSessions ?? nearest.service?.totalRecommendedSessions ?? null;
  const completedCount = finitePlanItems.filter(isCompletedSession).length;
  const activeCount = planLoaded
    ? planItems.filter(isActiveFollowUp).length
    : group.items.filter(isActiveFollowUp).length;
  const finiteActiveCount = planLoaded
    ? finitePlanItems.filter(isActiveFollowUp).length
    : group.items.filter((item) => !item.isRecurring && isActiveFollowUp(item)).length;
  const progressTotalValue = Math.max(totalSessions ?? 0, finiteActiveCount);
  const progressTotal = progressTotalValue > 1 ? progressTotalValue : null;
  const nextSession = nearest.isRecurring ? null : nearest.sessionNumber;
  const typeBadgeClass = followUpPlanBadgeClass(nearest.isRecurring);
  const intervalText = recurringIntervalText(nearest, text);
  const provider = providerDisplayName(nearest, text);
  const plan = planDisplayName(nearest, displayTotalSessions, text);
  const session = sessionDisplayName(nearest, displayTotalSessions, text);
  const closePlanAnchorId = finitePlanItems[0]?.id ?? nearest.id;
  const showClosePlanEarly = planLoaded && !nearest.isRecurring && canClosePlanEarly(finitePlanItems);

  // Urgency border accent
  const overdue = nearest.overdueDays > 0;
  const dueToday = urgency.label === text.todayBadge;
  const borderAccent = overdue
    ? "border-s-[3px] border-s-[#EF4444]"
    : dueToday
    ? "border-s-[3px] border-s-[#F59E0B]"
    : "border-s-[3px] border-s-transparent";

  return (
    <article ref={rowRef} className={`overflow-visible rounded-lg border border-[#E1E7EF] bg-white shadow-[0_3px_12px_rgba(11,45,92,0.035)] ${borderAccent}`}>
      {/* ── Compact header row ── */}
      <button
        className="flex w-full min-w-0 items-start gap-3 p-3.5 text-start hover:bg-[#FAFBFC]"
        onClick={() => onToggle(patientId, isExpanded)}
        type="button"
      >
        {/* Chevron */}
        <span className={`mt-0.5 shrink-0 text-[#0B2D5C] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
          ▶
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="truncate text-[15px] font-black text-[#0B2D5C]">{highlightText(name, searchQuery)}</h2>
              <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${typeBadgeClass}`}>
                {followUpPlanBadgeLabel(nearest, text)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${urgency.className}`}>
                {urgency.label}
              </span>
              <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-bold text-[#4B5563]">
                {text.activeFollowUps(activeCount)}
              </span>
            </div>
          </div>

          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.patientLabel}</dt>
              <dd className="mt-1 truncate text-sm font-black text-[#0B2D5C]">{highlightText(name, searchQuery)}</dd>
              <dd className="mt-0.5 truncate text-xs font-semibold text-[#66758a]" dir="ltr">
                {highlightText(patient.phone, searchQuery)}
              </dd>
            </div>
            <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.service}</dt>
              <dd className="mt-1 truncate text-sm font-bold text-[#24364f]">
                {svc ? highlightText(svc, searchQuery) : text.notRecorded}
              </dd>
            </div>
            <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.provider}</dt>
              <dd className="mt-1 truncate text-sm font-bold text-[#24364f]">{provider}</dd>
            </div>
            <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.planLabel}</dt>
              <dd className="mt-1 truncate text-sm font-bold text-[#24364f]">{plan}</dd>
            </div>
            <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{text.session}</dt>
              <dd className="mt-1 truncate text-sm font-bold text-[#24364f]">{session}</dd>
            </div>
          </dl>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {nextSession != null ? (
              <span className="text-xs font-bold text-[#24364f]">
                {progressTotal != null ? text.planSessions(nextSession, progressTotal) : text.sessionNum(nextSession)}
              </span>
            ) : null}

            {nearest.isRecurring ? (
              <>
                {intervalText ? (
                  <span className="text-[10px] font-black text-[#3730A3]">{intervalText}</span>
                ) : null}
                <span className="text-[10px] text-[#66758a]">
                  {text.nextFollowUpDate}: <span className="font-bold text-[#24364f]">{formatDate(nearest.dueDate)}</span>
                </span>
              </>
            ) : null}

            {!nearest.isRecurring && planLoaded && finitePlanItems.length > 0 ? (
              <ProgressDots items={sortPlan(finitePlanItems)} />
            ) : null}

            {!nearest.isRecurring && totalSessions != null && planLoaded && finitePlanItems.length > 0 ? (
              <span className="text-[10px] font-semibold text-[#66758a]">
                {text.planSessions(completedCount, totalSessions)}
              </span>
            ) : null}

            {!nearest.isRecurring ? (
              <span className="text-[10px] text-[#66758a]">
                {text.nextDue}: <span className="font-bold text-[#24364f]">{formatDate(nearest.dueDate)}</span>
              </span>
            ) : null}
          </div>
        </div>
      </button>

      {/* ── Expanded: session timeline split by active filter ── */}
      {isExpanded ? (
        <div className="border-t border-[#EEF1F5]">
          {isPlanLoading ? (
            <div className="px-4 py-5 text-sm font-semibold text-[#0B2D5C]">{text.loadingPlan}</div>
          ) : hasPlanError ? (
            <div className="px-4 py-5 text-sm font-semibold text-[#B42318]">{text.planLoadError}</div>
          ) : planItems.length === 0 ? (
            <div className="px-4 py-5 text-sm font-semibold text-[#66758a]">—</div>
          ) : (() => {
              const sorted       = sortPlan(planItems);
              const finiteSorted = sorted.filter((item) => !item.isRecurring);
              const recurringItems = sorted.filter((item) => item.isRecurring);
              const hasFinitePlan  = finiteSorted.length > 0;

              // Phase rules from the patient-plan snapshot first, then service defaults.
              const phaseRules = hasFinitePlan
                ? parseFollowUpPhaseRules(
                    finiteSorted[0]?.planPhases ?? finiteSorted[0]?.service?.followUpRules,
                  )
                : [];
              const hasPhaseRules = phaseRules.length > 0 && new Set(finiteSorted.map(i => i.serviceId)).size === 1;

              // Which finite sessions are visible under the active filter.
              // In full-plan mode (search / patient detail) show everything; otherwise
              // show ONLY sessions matching the filter so terminal/other-status sessions
              // (CANCELLED, COMPLETED, MISSED, …) never leak into the wrong filter tab.
              const visibleFinite = showFullPlan
                ? finiteSorted
                : finiteSorted.filter((s) => sessionMatchesFilter(s, filter));

              const renderCard = (sessionItem: TenantPatientFollowUp) => {
                // FINAL HARD GUARD — runs for EVERY card in EVERY path (phase-grouped,
                // flat, recurring, summary lists). A terminal/non-matching session must
                // never render under a status filter (e.g. a CANCELLED session in the
                // UPCOMING tab), even when it arrives via the includeAllForPatient plan
                // fetch. Full history (patient detail / search) bypasses this via
                // showFullPlan so cancelled sessions remain visible there.
                if (!showFullPlan && !sessionMatchesFilter(sessionItem, filter)) {
                  return null;
                }
                return (
                  <SessionCard
                    key={sessionItem.id}
                    busyId={busyId}
                    centerName={centerName}
                    dueDateDraft={dueDateDraft[sessionItem.id] ?? sessionItem.dueDate}
                    isNext={sessionItem.id === nextActionableId}
                    item={sessionItem}
                    locale={locale}
                    notesDraft={notesDraft[sessionItem.id] ?? ""}
                    text={text}
                    totalSessions={totalSessions}
                    onDueDateChange={onDueDateChange}
                    onNoteChange={onNoteChange}
                    onSaveDueDate={onSaveDueDate}
                    onSaveNote={onSaveNote}
                    onUpdateStatus={onUpdateStatus}
                  />
                );
              };

              return (
                <div className="space-y-4 bg-[#FBFCFE] p-3.5">
                  <TreatmentSummaryCard
                    items={sorted}
                    locale={locale}
                    nearest={nearest}
                    text={text}
                    totalSessions={totalSessions}
                  />

                  {hasFinitePlan ? (
                    <div className="rounded-xl border border-[#E8ECF2] bg-white px-4 py-3">
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-[#C8A45D]">
                            {text.treatmentJourney}
                          </p>
                          <p className="mt-1 text-sm font-black text-[#0B2D5C]">
                            {hasFinitePlan ? text.finitePlanTypeBadge : text.recurringTypeBadge}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <ProgressDots items={finiteSorted} />
                          <span className="text-xs font-bold text-[#66758a]">
                            {totalSessions != null
                              ? text.planSessions(completedCount, totalSessions)
                              : text.planSessions(completedCount, finiteSorted.length)}
                          </span>
                          {showClosePlanEarly ? (
                            <button
                              className="rounded-md border border-[#F5C2C7] bg-[#FFF5F5] px-3 py-1.5 text-xs font-black text-[#B42318] hover:bg-[#FFE8E8]"
                              onClick={() => onClosePlanEarly(closePlanAnchorId, patientId)}
                              type="button"
                            >
                              {text.closePlanEarly}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Phase-grouped finite sessions */}
                  {hasFinitePlan && hasPhaseRules ? (
                    <div className="space-y-3">
                      {phaseRules.map((rule, i) => {
                        const group = visibleFinite.filter(s =>
                          s.sessionNumber !== null &&
                          s.sessionNumber >= rule.fromSessionNumber &&
                          s.sessionNumber <= rule.toSessionNumber,
                        );
                        if (group.length === 0) return null;
                        return (
                          <div key={i}>
                            <div className="mb-1.5 rounded-md bg-[#EEF4FF] px-3 py-2">
                              <p className="text-[11px] font-black text-[#0B2D5C]">
                                {text.planPhaseTitle(i + 1)}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[#66758a]">
                                {text.planPhaseSubtitle(rule.fromSessionNumber, rule.toSessionNumber, rule.intervalDays)}
                              </p>
                            </div>
                            <div className="space-y-2">{group.map(renderCard)}</div>
                          </div>
                        );
                      })}
                      {visibleFinite.filter(s =>
                        s.sessionNumber === null ||
                        !phaseRules.some(r => s.sessionNumber! >= r.fromSessionNumber && s.sessionNumber! <= r.toSessionNumber)
                      ).map(renderCard)}
                    </div>
                  ) : hasFinitePlan ? (
                    /* Flat finite sessions fallback (no phase rules) */
                    <div className="space-y-2">
                      {visibleFinite.length > 0 ? (
                        <div className="space-y-2">
                          {visibleFinite.map(renderCard)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Recurring follow-ups — always visually separated from finite plan */}
                  {recurringItems.length > 0 ? (
                    <div className={`space-y-2${hasFinitePlan ? " mt-1 rounded-lg border border-dashed border-[#C7D2FE] p-3" : ""}`}>
                      {hasFinitePlan ? (
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#3730A3]">
                          {text.otherFollowUpsHeader}
                        </p>
                      ) : null}
                      {recurringItems.map(renderCard)}
                    </div>
                  ) : null}
                </div>
              );
            })()
          }
        </div>
      ) : null}
    </article>
  );
}

// ── TenantFollowUpsPage ───────────────────────────────────────────────────────

type RecurringQueueProps = {
  busyId: string | null;
  centerName: string;
  items: TenantPatientFollowUp[];
  locale: SupportedLocale;
  text: CopyText;
  onContacted: (item: TenantPatientFollowUp) => void;
  onPause: (item: TenantPatientFollowUp) => void;
  onReminder: (item: TenantPatientFollowUp) => void;
  onSkip: (item: TenantPatientFollowUp) => void;
};

function RecurringQueue({
  busyId, centerName, items, locale, text,
  onContacted, onPause, onReminder, onSkip,
}: RecurringQueueProps) {
  const labels = recurringCopy[locale];
  if (items.length === 0) {
    return <div className="rounded-xl border border-dashed border-[#C7D2FE] bg-white p-8 text-center text-sm font-semibold text-[#66758a]">{labels.noRows}</div>;
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
      {items.map((item) => {
        const patientName = patientDisplayName(item.patient, locale);
        const service = serviceName(item.service, locale) || item.title;
        const urgency = getUrgencyInfo(item.nextDueDate, locale, text);
        const interval = recurringIntervalText(item, text) || text.recurringLifetime;
        const message = text.message(patientName, service, centerName);
        const branch = item.lastTreatment?.branch ?? item.sourceAppointment?.branch;
        const branchName = branch
          ? branch.name || (locale === "ar" ? branch.cityAr : locale === "he" ? branch.cityHe : branch.cityEn) || text.notRecorded
          : text.notRecorded;
        const lastAppointment = item.lastTreatment?.appointmentDate ?? item.sourceAppointment?.appointmentDate ?? null;
        const isBusy = busyId === item.id;
        const isTerminal = ["BOOKED", "COMPLETED", "CANCELLED", "SKIPPED", "PAUSED"].includes(item.effectiveStatus);
        const statusLabel = item.effectiveStatus === "PAUSED"
          ? labels.paused
          : item.effectiveStatus === "SKIPPED"
            ? labels.skipped
            : item.effectiveStatus === "CONTACTED"
              ? labels.contacted
              : item.effectiveStatus === "BOOKED"
                ? labels.booked
                : item.effectiveStatus === "DUE"
                  ? labels.today
                  : item.effectiveStatus;

        return (
          <article className="min-w-0 rounded-xl border border-[#C7D2FE] bg-gradient-to-br from-white to-[#F7F7FF] p-4 shadow-[0_12px_30px_rgba(55,48,163,0.07)]" key={item.id}>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#C7D2FE] bg-[#EEF0FF] px-2.5 py-1 text-[10px] font-black text-[#3730A3]">{labels.recurringTab}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${urgency.className}`}>{urgency.label}</span>
                </div>
                <h2 className="mt-2 break-words text-base font-black text-[#0B2D5C]">{patientName}</h2>
                <a className="mt-1 inline-flex text-sm font-bold text-[#0F766E] hover:underline" dir="ltr" href={`tel:${item.patient.phone}`}>{item.patient.phone}</a>
              </div>
              <span className="rounded-full border border-[#D8DEE8] bg-white px-3 py-1 text-xs font-black text-[#24364f]">{statusLabel}</span>
            </div>

            <dl className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                [text.service, service], [labels.branch, branchName], [labels.recurrence, interval],
                [labels.lastAppointment, lastAppointment ? formatDate(lastAppointment) : text.notRecorded],
                [labels.nextDue, formatDate(item.nextDueDate)], [labels.reminderCount, String(item.reminderCount ?? 0)],
              ].map(([label, value]) => (
                <div className="min-w-0 rounded-lg border border-[#E7E7F5] bg-white/85 px-3 py-2" key={label}>
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#8A98AA]">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-bold text-[#24364f]">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E7E7F5] pt-3">
              {!isTerminal ? <a className={buttonClassName("primary", "sm")} href={whatsappHref(item.patient.phone, message)} onClick={() => onReminder(item)} rel="noopener noreferrer" target="_blank">{labels.sendReminder}</a> : null}
              {!isTerminal && item.effectiveStatus !== "CONTACTED" ? <button className={buttonClassName("secondary", "sm")} disabled={isBusy} onClick={() => onContacted(item)} type="button">{labels.markContacted}</button> : null}
              {item.effectiveCanBook ? <Link className={buttonClassName("secondary", "sm")} href={`/tenant/appointments/new?patientId=${item.patientId}&serviceId=${item.serviceId ?? ""}&followUpId=${item.id}`}>{labels.bookAppointment}</Link> : null}
              {!isTerminal ? <>
                <button className={buttonClassName("secondary", "sm")} disabled={isBusy} onClick={() => onSkip(item)} type="button">{labels.skipCycle}</button>
                <button className={buttonClassName("warning", "sm")} disabled={isBusy} onClick={() => onPause(item)} type="button">{labels.pause}</button>
              </> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function TenantFollowUpsPage() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const text = copy[locale] as CopyText;
  const patientIdParam = searchParams.get("patientId") || undefined;
  const urlFilter = (searchParams.get("filter") ?? "").toUpperCase();
  const initialWorkflow = searchParams.get("kind") === "recurring" ? "RECURRING_CONTINUOUS" : "PLANS";
  const recurringInitialFilters = ["THIS_WEEK", "TODAY", "OVERDUE", "CONTACTED", "BOOKED"];
  const initialFilter = initialWorkflow === "RECURRING_CONTINUOUS"
    ? recurringInitialFilters.includes(urlFilter)
      ? (urlFilter as PatientFollowUpFilter)
      : "THIS_WEEK"
    : filters.includes(urlFilter as PatientFollowUpFilter)
      ? (urlFilter as PatientFollowUpFilter)
      : "TODAY";
  const [workflow, setWorkflow] = useState<"PLANS" | "RECURRING_CONTINUOUS">(initialWorkflow);
  // ── state ──────────────────────────────────────────────────────────────────

  const [filter, setFilter]           = useState<PatientFollowUpFilter>(initialFilter);
  const { branchId: branchFilterId, setBranchId: setBranchFilterId } = useBranchFilter();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") ?? "");
  const [items, setItems]             = useState<TenantPatientFollowUp[]>([]);
  const [analytics, setAnalytics]     = useState<TenantFollowUpAnalytics | null>(null);
  const [status, setStatus]           = useState<"loading" | "success" | "error">("loading");
  const [notesDraft, setNotesDraft]   = useState<Record<string, string>>({});
  const [dueDateDraft, setDueDateDraft] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [planItems, setPlanItems]     = useState<Record<string, TenantPatientFollowUp[]>>({});
  const planItemsRef = useRef<Record<string, TenantPatientFollowUp[]>>({});
  planItemsRef.current = planItems;
  const [planLoading, setPlanLoading] = useState<Record<string, boolean>>({});
  const [planError, setPlanError]     = useState<Record<string, boolean>>({});
  const [busyId, setBusyId]           = useState<string | null>(null);
  const [closePlanTarget, setClosePlanTarget] = useState<{ followUpId: string; patientId: string } | null>(null);
  const [closePlanReason, setClosePlanReason] = useState("RESULT_ACHIEVED");
  const [closePlanOtherReason, setClosePlanOtherReason] = useState("");
  const [analyticsToken, setAnalyticsToken] = useState(0);
  const requestGenRef = useRef(0);
  const previousExpandedBeforeSearchRef = useRef<Record<string, boolean> | null>(null);
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── derived ────────────────────────────────────────────────────────────────

  const hasSearch = debouncedSearch.trim().length > 0;

  const visibleItems = useMemo(() => {
    const query = debouncedSearch.trim();
    const ranked = items
      .map((item) => ({
        item,
        rank: query ? itemSearchRank(item, query, locale) : 0,
      }))
      .filter(({ rank }) => {
        if (query && rank === null) return false;
        return true;
      })
      .sort((a, b) => {
        const rankDiff = (a.rank ?? 99) - (b.rank ?? 99);
        if (rankDiff !== 0) return rankDiff;
        const aDate = workflow === "RECURRING_CONTINUOUS" ? a.item.nextDueDate : a.item.dueDate;
        const bDate = workflow === "RECURRING_CONTINUOUS" ? b.item.nextDueDate : b.item.dueDate;
        const dueDiff = aDate.localeCompare(bDate);
        return dueDiff !== 0 ? dueDiff : a.item.id.localeCompare(b.item.id);
      });

    return ranked.map(({ item }) => item);
  }, [debouncedSearch, items, locale, workflow]);

  const patientGroups = useMemo(() => groupByPatient(visibleItems), [visibleItems]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const mergeDrafts = useCallback((followUps: TenantPatientFollowUp[]) => {
    setNotesDraft((prev) => {
      const next = { ...prev };
      for (const item of followUps) if (!(item.id in next)) next[item.id] = item.notes ?? "";
      return next;
    });
    setDueDateDraft((prev) => {
      const next = { ...prev };
      for (const item of followUps) if (!(item.id in next)) next[item.id] = item.dueDate;
      return next;
    });
  }, []);

  const replaceFollowUpInState = useCallback((updated: TenantPatientFollowUp) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setPlanItems((prev) => {
      const currentPlan = prev[updated.patientId];
      if (!currentPlan) return prev;

      return {
        ...prev,
        [updated.patientId]: sortPlan(
          currentPlan.map((item) => (item.id === updated.id ? updated : item)),
        ),
      };
    });
    setNotesDraft((prev) => ({ ...prev, [updated.id]: updated.notes ?? "" }));
    setDueDateDraft((prev) => ({ ...prev, [updated.id]: updated.dueDate }));
  }, []);

  const loadPatientPlan = useCallback(
    async (pid: string, opts?: { force?: boolean }) => {
      if (!opts?.force && planItemsRef.current[pid]) return planItemsRef.current[pid];
      setPlanLoading((p) => ({ ...p, [pid]: true }));
      setPlanError((p) => ({ ...p, [pid]: false }));
      try {
        const res = await listTenantFollowUps({ includeAllForPatient: true, patientId: pid });
        const sorted = sortPlan(res.items);
        setPlanItems((p) => ({ ...p, [pid]: sorted }));
        mergeDrafts(sorted);
        return sorted;
      } catch {
        setPlanError((p) => ({ ...p, [pid]: true }));
        return [];
      } finally {
        setPlanLoading((p) => ({ ...p, [pid]: false }));
      }
    },
    [mergeDrafts],
  );

  const togglePatient = useCallback(
    (pid: string, isExpanded: boolean) => {
      setExpandedIds((p) => ({ ...p, [pid]: !isExpanded }));
      if (!isExpanded) void loadPatientPlan(pid);
    },
    [loadPatientPlan],
  );

  const changeFilter = useCallback((nextFilter: PatientFollowUpFilter) => {
    setFilter(nextFilter);
  }, []);

  const updateSearchInput = useCallback((value: string) => {
    if (value.trim() && !searchInput.trim() && !previousExpandedBeforeSearchRef.current) {
      previousExpandedBeforeSearchRef.current = expandedIds;
    }

    if (!value.trim() && previousExpandedBeforeSearchRef.current) {
      setExpandedIds(previousExpandedBeforeSearchRef.current);
      previousExpandedBeforeSearchRef.current = null;
    }

    setSearchInput(value);
  }, [expandedIds, searchInput]);

  const refreshAfterMutation = useCallback(
    async (pid: string, updated?: TenantPatientFollowUp) => {
      const mutationGen = ++requestGenRef.current;

      if (updated) {
        replaceFollowUpInState(updated);
      }

      const [planRes, listRes] = await Promise.all([
        listTenantFollowUps({ includeAllForPatient: true, patientId: pid }),
        listTenantFollowUps({
          filter: hasSearch ? undefined : filter,
          includeAll: hasSearch,
          kind: workflow === "RECURRING_CONTINUOUS" ? "RECURRING_CONTINUOUS" : "SESSION_BASED_PLAN",
          patientId: patientIdParam,
        }),
      ]);

      if (mutationGen !== requestGenRef.current) return;

      const sortedPlan = sortPlan(planRes.items);
      setPlanItems((p) => ({ ...p, [pid]: sortedPlan }));
      setItems(listRes.items);
      mergeDrafts([...sortedPlan, ...listRes.items]);
      setExpandedIds((p) => ({ ...p, [pid]: true }));
      setAnalyticsToken((t) => t + 1);

    },
    [filter, hasSearch, mergeDrafts, patientIdParam, replaceFollowUpInState, workflow],
  );

  // ── mutations ──────────────────────────────────────────────────────────────

  const updateStatus = async (id: string, next: PatientFollowUpStatus, pid: string) => {
    setBusyId(id);
    try {
      const updated = await updateTenantFollowUpStatus(id, next);
      await refreshAfterMutation(pid, updated);
    } finally { setBusyId(null); }
  };

  const saveNote = async (id: string, pid: string) => {
    setBusyId(id);
    try {
      const updated = await updateTenantFollowUpNotes(id, notesDraft[id] ?? "");
      await refreshAfterMutation(pid, updated);
    } finally { setBusyId(null); }
  };

  const saveDueDate = async (id: string, pid: string) => {
    setBusyId(id);
    try {
      const nextDueDate = dueDateDraft[id] ?? "";
      const updated = await updateTenantFollowUpDueDate(id, nextDueDate);
      await refreshAfterMutation(pid, updated);
    } finally { setBusyId(null); }
  };

  const recordRecurringReminder = async (item: TenantPatientFollowUp) => {
    setBusyId(item.id);
    try {
      const updated = await recordTenantRecurringReminder(item.id);
      await refreshAfterMutation(item.patientId, updated);
    } finally { setBusyId(null); }
  };

  const skipRecurring = async (item: TenantPatientFollowUp) => {
    if (!window.confirm(recurringCopy[locale].confirmSkip)) return;
    setBusyId(item.id);
    try {
      await skipTenantRecurringCycle(item.id);
      await refreshAfterMutation(item.patientId);
    } finally { setBusyId(null); }
  };

  const pauseRecurring = async (item: TenantPatientFollowUp) => {
    if (!window.confirm(recurringCopy[locale].confirmPause)) return;
    setBusyId(item.id);
    try {
      const updated = await pauseTenantRecurringFollowUp(item.id);
      await refreshAfterMutation(item.patientId, updated);
    } finally { setBusyId(null); }
  };

  const submitClosePlanEarly = async () => {
    if (!closePlanTarget) return;
    const reason =
      closePlanReason === "OTHER"
        ? closePlanOtherReason.trim()
        : closePlanReason;

    setBusyId(closePlanTarget.followUpId);
    try {
      const updated = await closeTenantFollowUpPlanEarly(closePlanTarget.followUpId, reason);
      await refreshAfterMutation(closePlanTarget.patientId, updated);
      setClosePlanTarget(null);
      setClosePlanReason("RESULT_ACHIEVED");
      setClosePlanOtherReason("");
    } finally {
      setBusyId(null);
    }
  };

  // ── effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    getTenantFollowUpAnalytics(branchFilterId || undefined).then(setAnalytics).catch(() => undefined);
  }, [analyticsToken, branchFilterId]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    params.set("filter", filter.toLowerCase());
    params.set("kind", workflow === "RECURRING_CONTINUOUS" ? "recurring" : "plans");
    params.delete("crm");

    const nextUrl = `${pathname}?${params.toString()}`;
    if (typeof window !== "undefined" && `${window.location.pathname}${window.location.search}` === nextUrl) {
      return;
    }
    router.replace(nextUrl, { scroll: false });
  }, [debouncedSearch, filter, pathname, router, searchParams, workflow]);

  useEffect(() => {
    const gen = ++requestGenRef.current;
    setStatus("loading");
    const shouldLoadBroadList = debouncedSearch.trim().length > 0;
    // patientId deep-link: skip the active filter so ALL sessions for that patient load.
    const shouldIgnoreFilter = shouldLoadBroadList || Boolean(patientIdParam);
    listTenantFollowUps({
      filter: shouldIgnoreFilter ? undefined : filter,
      includeAll: shouldLoadBroadList,
      kind: workflow === "RECURRING_CONTINUOUS" ? "RECURRING_CONTINUOUS" : "SESSION_BASED_PLAN",
      patientId: patientIdParam,
      branchId: branchFilterId || undefined,
    })
      .then((res) => {
        if (gen !== requestGenRef.current) return;
        setItems(res.items);
        setStatus("success");
        mergeDrafts(res.items);
        const searchedRows = shouldLoadBroadList
          ? res.items.filter((item) => itemSearchRank(item, debouncedSearch, locale) !== null)
          : res.items;
        const sourceGroups = workflow === "PLANS" ? groupByPatient(searchedRows) : [];
        const autoExpanded = sourceGroups.reduce<Record<string, boolean>>(
          (acc, group) => {
            if (
              (shouldLoadBroadList && sourceGroups.length === 1) ||
              patientIdParam === group.patientId ||
              (!shouldLoadBroadList && shouldAutoExpandGroup(group))
            ) {
              acc[group.patientId] = true;
            }
            return acc;
          },
          {},
        );
        setExpandedIds(autoExpanded);
        Object.keys(autoExpanded).forEach((pid) => {
          void loadPatientPlan(pid);
        });
      })
      .catch(() => {
        if (gen !== requestGenRef.current) return;
        setStatus("error");
      });
  }, [debouncedSearch, filter, locale, loadPatientPlan, mergeDrafts, patientIdParam, branchFilterId, workflow]);

  useEffect(() => {
    if (!debouncedSearch.trim() || patientGroups.length !== 1) return;
    const patientId = patientGroups[0]?.patientId;
    if (!patientId) return;

    window.setTimeout(() => {
      rowRefs.current[patientId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }, [debouncedSearch, patientGroups]);

  // ── sticky priority counts ────────────────────────────────────────────────

  const priorityCounts = useMemo(() => priorityBarCounts(analytics), [analytics]);

  const priorityItems = useMemo(
    () => [
      {
        className: "border-[#FECACA] bg-[#FFF7F7] text-[#B42318]",
        filter: "OVERDUE" as PatientFollowUpFilter,
        label: text.priorityOverdue,
        value: priorityCounts.overdue,
      },
      {
        className: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
        filter: "TODAY" as PatientFollowUpFilter,
        label: text.priorityToday,
        value: priorityCounts.today,
      },
      {
        className: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
        filter: "THIS_WEEK" as PatientFollowUpFilter,
        label: text.priorityThisWeek,
        value: priorityCounts.thisWeek,
      },
      {
        className: "border-[#E5E7EB] bg-white text-[#4B5563]",
        filter: "UPCOMING" as PatientFollowUpFilter,
        label: text.priorityUpcoming,
        value: priorityCounts.upcoming,
      },
      {
        // Cancelled — soft gray/red, jumps to the dedicated CANCELLED filter.
        className: "border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]",
        filter: "CANCELLED" as PatientFollowUpFilter,
        label: text.filters.CANCELLED,
        value: priorityCounts.cancelled,
      },
    ],
    [priorityCounts, text],
  );
  const recurringFilters: PatientFollowUpFilter[] = [
    "THIS_WEEK", "TODAY", "OVERDUE", "CONTACTED", "BOOKED",
  ];
  const visibleFilters = workflow === "RECURRING_CONTINUOUS" ? recurringFilters : filters;
  const recurringFilterLabel = (value: PatientFollowUpFilter) => {
    const labels = recurringCopy[locale];
    if (value === "THIS_WEEK") return labels.nearDue;
    if (value === "TODAY") return labels.today;
    if (value === "OVERDUE") return labels.overdue;
    if (value === "CONTACTED") return labels.contacted;
    if (value === "BOOKED") return labels.booked;
    return text.filters[value];
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <CenterAdminShell
      activeNav="followUps"
      requiredPermission="appointments:view"
      subtitle={() => text.subtitle}
      title={() => text.title}
    >
      {({ session }) => (
        <>
        <div className="mt-4 w-full max-w-none space-y-4">

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#E1E7EF] bg-white p-2">
            {(["PLANS", "RECURRING_CONTINUOUS"] as const).map((value) => (
              <button
                className={value === workflow ? buttonClassName("primary", "md") : buttonClassName("secondary", "md")}
                key={value}
                onClick={() => {
                  setWorkflow(value);
                  setFilter(value === "RECURRING_CONTINUOUS" ? "THIS_WEEK" : "TODAY");
                }}
                type="button"
              >
                {value === "RECURRING_CONTINUOUS" ? recurringCopy[locale].recurringTab : recurringCopy[locale].plansTab}
              </button>
            ))}
          </div>

          {/* Priority bar */}
          <div className="sticky top-3 z-10 rounded-lg border border-[#E1E7EF] bg-white/95 p-2 shadow-[0_8px_24px_rgba(11,45,92,0.08)] backdrop-blur">
            <div className={`grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 ${workflow === "PLANS" ? "lg:grid-cols-5" : ""}`}>
              {(workflow === "RECURRING_CONTINUOUS"
                ? [
                    { className: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]", filter: "TODAY" as PatientFollowUpFilter, label: recurringCopy[locale].dueToday, value: analytics?.recurringDueToday ?? 0 },
                    { className: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]", filter: "THIS_WEEK" as PatientFollowUpFilter, label: recurringCopy[locale].dueSoon, value: analytics?.recurringThisWeek ?? 0 },
                    { className: "border-[#FECACA] bg-[#FFF7F7] text-[#B42318]", filter: "OVERDUE" as PatientFollowUpFilter, label: recurringCopy[locale].overdueCounter, value: analytics?.recurringOverdue ?? 0 },
                  ]
                : priorityItems).map((item) => (
                <button
                  className={`flex min-w-0 items-center justify-between rounded-md border px-3 py-2 text-start transition hover:shadow-sm ${item.className}`}
                  key={item.filter}
                  onClick={() => changeFilter(item.filter)}
                  type="button"
                >
                  <span className="truncate text-xs font-black">{item.label}</span>
                  <span className="ms-2 text-lg font-black">{item.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Search ── */}
          <div className="sticky top-[84px] z-10 rounded-lg border border-[#E1E7EF] bg-white/95 p-3 shadow-[0_8px_24px_rgba(11,45,92,0.06)] backdrop-blur">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm font-black text-[#8B98AA] ltr:left-3 rtl:right-3">
                ⌕
              </span>
              <input
                className="h-11 w-full rounded-lg border border-[#D8DEE8] bg-[#F8FAFC] px-9 text-sm font-semibold text-[#132238] outline-none transition placeholder:text-[#8B98AA] focus:border-[#C8A45D] focus:bg-white focus:ring-2 focus:ring-[#C8A45D]/20"
                dir={locale === "en" ? "ltr" : "rtl"}
                onChange={(event) => updateSearchInput(event.target.value)}
                placeholder={text.searchPlaceholder}
                value={searchInput}
              />
              {searchInput ? (
                <button
                  className="absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-sm font-black text-[#66758a] hover:bg-[#EEF1F5] ltr:right-2 rtl:left-2"
                  onClick={() => updateSearchInput("")}
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex">
              <BranchFilter
                className="h-11 w-full rounded-lg border border-[#D8DEE8] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#132238]"
                onChange={setBranchFilterId}
                value={branchFilterId}
              />
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleFilters.map((f) => (
              <button
                className={
                  f === filter
                    ? buttonClassName("primary", "sm", "shrink-0")
                    : buttonClassName("secondary", "sm", "shrink-0")
                }
                key={f}
                onClick={() => changeFilter(f)}
                type="button"
              >
                {workflow === "RECURRING_CONTINUOUS" ? recurringFilterLabel(f) : text.filters[f]}
              </button>
            ))}
          </div>

          {/* ── Loading state ── */}
          {status === "loading" ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-sm font-semibold text-[#0B2D5C]">
              {text.loading}
            </div>
          ) : null}

          {/* ── Error state ── */}
          {status === "error" ? (
            <div className="rounded-xl border border-[#F3B8B8] bg-[#FFF7F7] p-5 text-sm font-semibold text-[#B42318]">
              {text.loadError}
            </div>
          ) : null}

          {/* ── Empty state ── */}
          {status === "success" && workflow === "PLANS" && patientGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C8A45D]/50 bg-white p-8 text-center">
              <h2 className="text-base font-bold text-[#0B2D5C]">
                {hasSearch ? text.noSearchResultsTitle : text.emptyByFilter[filter].title}
              </h2>
              {hasSearch && !text.noSearchResultsBody ? null : (
                <p className="mt-2 text-sm text-[#66758a]">
                  {hasSearch ? text.noSearchResultsBody : text.emptyByFilter[filter].body}
                </p>
              )}
            </div>
          ) : null}

          {/* ── Patient queue ── */}
          {status === "success" && workflow === "RECURRING_CONTINUOUS" ? (
            <RecurringQueue
              busyId={busyId}
              centerName={session.center.name}
              items={visibleItems.filter((item) => item.isRecurring)}
              locale={locale}
              text={text}
              onContacted={(item) => void updateStatus(item.id, "CONTACTED", item.patientId)}
              onPause={(item) => void pauseRecurring(item)}
              onReminder={(item) => void recordRecurringReminder(item)}
              onSkip={(item) => void skipRecurring(item)}
            />
          ) : null}

          {status === "success" && workflow === "PLANS" && patientGroups.length > 0 ? (
            <div className="space-y-3">
              {hasSearch ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-black text-[#8A5A00]">
                    {text.searchResults}
                  </span>
                  <span className="text-xs font-bold text-[#66758a]">
                    {patientGroups.length}
                  </span>
                </div>
              ) : null}

              {/* Patient accordions: heavy session cards mount only when expanded. */}
              <div className="grid min-w-0 grid-cols-1 gap-2.5">
                {patientGroups.map((group) => {
                  const pid            = group.patientId;
                  const isExpanded     = Boolean(expandedIds[pid]);
                  const isPlanLoading  = Boolean(planLoading[pid]);
                  const hasPlanError   = Boolean(planError[pid]);
                  const groupPlanItems = planItems[pid] ?? [];
                  const nextId         = getNextActionableId(groupPlanItems);

                  return (
                    <PatientQueueRow
                      key={pid}
                      busyId={busyId}
                      centerName={session.center.name}
                      dueDateDraft={dueDateDraft}
                      filter={filter}
                      group={group}
                      hasPlanError={hasPlanError}
                      isExpanded={isExpanded}
                      isPlanLoading={isPlanLoading}
                      locale={locale}
                      nextActionableId={nextId}
                      notesDraft={notesDraft}
                      planItems={groupPlanItems}
                      rowRef={(node) => {
                        rowRefs.current[pid] = node;
                      }}
                      searchQuery={debouncedSearch}
                      // Full plan (incl. terminal sessions: CANCELLED/CLOSED_EARLY/
                      // COMPLETED/MISSED) is shown ONLY in patient-detail full history
                      // (patientId in the URL). On the filtered list — including while
                      // searching — the active filter applies to the expanded plan too,
                      // so terminal sessions never leak into e.g. the UPCOMING tab.
                      showFullPlan={Boolean(patientIdParam)}
                      text={text}
                      onDueDateChange={(id, value) =>
                        setDueDateDraft((p) => ({ ...p, [id]: value }))
                      }
                      onNoteChange={(id, value) =>
                        setNotesDraft((p) => ({ ...p, [id]: value }))
                      }
                      onSaveDueDate={saveDueDate}
                      onSaveNote={saveNote}
                      onToggle={togglePatient}
                      onUpdateStatus={updateStatus}
                      onClosePlanEarly={(followUpId, pid) => {
                        setClosePlanTarget({ followUpId, patientId: pid });
                        setClosePlanReason("RESULT_ACHIEVED");
                        setClosePlanOtherReason("");
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

        </div>

        {closePlanTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-follow-up-plan-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E1E7EF] bg-white p-5 shadow-[0_24px_70px_rgba(11,45,92,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="close-follow-up-plan-title" className="text-lg font-black text-[#0B2D5C]">
                  {text.closePlanConfirmTitle}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#526176]">
                  {text.closePlanConfirmBody}
                </p>
              </div>
              <button
                className="rounded-md px-2 py-1 text-lg font-black text-[#66758a] hover:bg-[#F4F6F9]"
                onClick={() => setClosePlanTarget(null)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wide text-[#8A98AA]">
                {text.closePlanReasonLabel}
              </label>
              {[
                ["RESULT_ACHIEVED", text.closePlanReasonResult],
                ["PATIENT_REQUEST", text.closePlanReasonPatient],
                ["DOCTOR_DECISION", text.closePlanReasonDoctor],
                ["OTHER", text.closePlanReasonOther],
              ].map(([value, label]) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E1E7EF] px-3 py-2 text-sm font-bold text-[#24364f] hover:bg-[#F8FAFC]"
                  key={value}
                >
                  <input
                    checked={closePlanReason === value}
                    className="h-4 w-4 accent-[#0B2D5C]"
                    name="closePlanReason"
                    onChange={() => setClosePlanReason(value)}
                    type="radio"
                  />
                  <span>{label}</span>
                </label>
              ))}

              {closePlanReason === "OTHER" ? (
                <textarea
                  className="min-h-20 w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                  onChange={(event) => setClosePlanOtherReason(event.target.value)}
                  placeholder={text.closePlanOtherPlaceholder}
                  value={closePlanOtherReason}
                />
              ) : null}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className={buttonClassName("secondary", "md")}
                onClick={() => setClosePlanTarget(null)}
                type="button"
              >
                {text.cancel}
              </button>
              <button
                className={buttonClassName("danger", "md")}
                disabled={Boolean(busyId)}
                onClick={submitClosePlanEarly}
                type="button"
              >
                {text.confirmClosePlan}
              </button>
            </div>
          </div>
        </div>
        ) : null}
        </>
      )}
    </CenterAdminShell>
  );
}
