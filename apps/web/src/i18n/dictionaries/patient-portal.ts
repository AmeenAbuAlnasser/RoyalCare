import type { SupportedLocale } from "../locales";

export type PatientPortalDictionary = {
  loading: string;
  errorTitle: string;
  errorExpired: string;
  errorNotFound: string;
  errorGeneric: string;
  greeting: string;
  creditBalance: string;
  currency: string;
  nextAppointment: string;
  noNextAppointment: string;
  noNextAppointmentBody: string;
  whatsappCenter: string;
  reschedule: string;
  cancelRequest: string;
  moreUpcoming: (n: number) => string;
  previousAppointments: string;
  noAppointmentHistory: string;
  myBills: string;
  noBillingHistory: string;
  invoiceNumber: string;
  provider: string;
  notes: string;
  total: string;
  paid: string;
  invoiceStatus: {
    PENDING: string;
    PARTIAL: string;
    PAID: string;
    CANCELLED: string;
  };
  appointmentStatus: {
    SCHEDULED: string;
    CONFIRMED: string;
    IN_PROGRESS: string;
    COMPLETED: string;
    CANCELLED: string;
    NO_SHOW: string;
  };
  paymentMethod: {
    CASH: string;
    BANK_TRANSFER: string;
    CHECK: string;
    OTHER: string;
  };
  rescheduleMessage: (service: string, date: string, time: string) => string;
  cancelMessage: (service: string, date: string, time: string) => string;
};

const en: PatientPortalDictionary = {
  loading: "Loading…",
  errorTitle: "Unable to load portal",
  errorExpired: "This portal link has expired. Please request a new one from the center.",
  errorNotFound: "This portal link is invalid or has been removed.",
  errorGeneric: "Something went wrong. Please try again later.",
  greeting: "Hi",
  creditBalance: "Credit balance",
  currency: "ILS",
  nextAppointment: "Your next appointment",
  noNextAppointment: "No upcoming appointments",
  noNextAppointmentBody: "Contact us to schedule your next visit.",
  whatsappCenter: "WhatsApp us",
  reschedule: "Reschedule",
  cancelRequest: "Cancel request",
  moreUpcoming: (n) => `${n} more upcoming`,
  previousAppointments: "Previous appointments",
  noAppointmentHistory: "No previous appointments.",
  myBills: "My bills",
  noBillingHistory: "No billing records.",
  invoiceNumber: "Invoice",
  provider: "Provider",
  notes: "Notes",
  total: "Total",
  paid: "Paid",
  invoiceStatus: {
    PENDING: "Pending",
    PARTIAL: "Partially paid",
    PAID: "Paid",
    CANCELLED: "Cancelled",
  },
  appointmentStatus: {
    SCHEDULED: "Scheduled",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No show",
  },
  paymentMethod: {
    CASH: "Cash",
    BANK_TRANSFER: "Bank transfer",
    CHECK: "Cheque",
    OTHER: "Other",
  },
  rescheduleMessage: (service, date, time) =>
    `Hello, I would like to reschedule my appointment for ${service} on ${date} at ${time}.`,
  cancelMessage: (service, date, time) =>
    `Hello, I would like to cancel my appointment for ${service} on ${date} at ${time}.`,
};

const ar: PatientPortalDictionary = {
  loading: "جارٍ التحميل…",
  errorTitle: "تعذّر تحميل البوابة",
  errorExpired: "انتهت صلاحية رابط البوابة. يرجى طلب رابط جديد من المركز.",
  errorNotFound: "رابط البوابة غير صالح أو تمت إزالته.",
  errorGeneric: "حدث خطأ ما. يرجى المحاولة مجدداً.",
  greeting: "مرحباً",
  creditBalance: "رصيد الائتمان",
  currency: "ش.ج",
  nextAppointment: "موعدك القادم",
  noNextAppointment: "لا توجد مواعيد قادمة",
  noNextAppointmentBody: "تواصل معنا لجدولة زيارتك القادمة.",
  whatsappCenter: "تواصل معنا عبر واتساب",
  reschedule: "إعادة جدولة",
  cancelRequest: "طلب إلغاء",
  moreUpcoming: (n) => `${n} مواعيد قادمة أخرى`,
  previousAppointments: "المواعيد السابقة",
  noAppointmentHistory: "لا توجد مواعيد سابقة.",
  myBills: "فواتيري",
  noBillingHistory: "لا توجد سجلات فواتير.",
  invoiceNumber: "فاتورة",
  provider: "مقدم الخدمة",
  notes: "ملاحظات",
  total: "الإجمالي",
  paid: "مدفوع",
  invoiceStatus: {
    PENDING: "معلقة",
    PARTIAL: "مدفوعة جزئياً",
    PAID: "مدفوعة",
    CANCELLED: "ملغاة",
  },
  appointmentStatus: {
    SCHEDULED: "مجدول",
    CONFIRMED: "مؤكد",
    IN_PROGRESS: "جارٍ",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغى",
    NO_SHOW: "لم يحضر",
  },
  paymentMethod: {
    CASH: "نقداً",
    BANK_TRANSFER: "تحويل بنكي",
    CHECK: "شيك",
    OTHER: "أخرى",
  },
  rescheduleMessage: (service, date, time) =>
    `مرحباً، أود إعادة جدولة موعدي لخدمة ${service} بتاريخ ${date} الساعة ${time}.`,
  cancelMessage: (service, date, time) =>
    `مرحباً، أود إلغاء موعدي لخدمة ${service} بتاريخ ${date} الساعة ${time}.`,
};

const he: PatientPortalDictionary = {
  loading: "טוען…",
  errorTitle: "לא ניתן לטעון את הפורטל",
  errorExpired: "קישור הפורטל פג תוקפו. בקש קישור חדש מהמרכז.",
  errorNotFound: "קישור הפורטל אינו תקף או הוסר.",
  errorGeneric: "אירעה שגיאה. נסה שוב מאוחר יותר.",
  greeting: "שלום",
  creditBalance: "יתרת זיכוי",
  currency: "₪",
  nextAppointment: "התור הקרוב שלך",
  noNextAppointment: "אין תורים קרובים",
  noNextAppointmentBody: "צרו קשר כדי לקבוע את הביקור הבא שלכם.",
  whatsappCenter: "שלחו לנו בוואטסאפ",
  reschedule: "שינוי מועד",
  cancelRequest: "בקשת ביטול",
  moreUpcoming: (n) => `עוד ${n} תורים קרובים`,
  previousAppointments: "תורים קודמים",
  noAppointmentHistory: "אין תורים קודמים.",
  myBills: "החשבוניות שלי",
  noBillingHistory: "אין רשומות חיוב.",
  invoiceNumber: "חשבונית",
  provider: "נותן שירות",
  notes: "הערות",
  total: "סה\"כ",
  paid: "שולם",
  invoiceStatus: {
    PENDING: "ממתין",
    PARTIAL: "שולם חלקית",
    PAID: "שולם",
    CANCELLED: "בוטל",
  },
  appointmentStatus: {
    SCHEDULED: "מתוכנן",
    CONFIRMED: "מאושר",
    IN_PROGRESS: "בתהליך",
    COMPLETED: "הושלם",
    CANCELLED: "בוטל",
    NO_SHOW: "לא הגיע",
  },
  paymentMethod: {
    CASH: "מזומן",
    BANK_TRANSFER: "העברה בנקאית",
    CHECK: "צ'ק",
    OTHER: "אחר",
  },
  rescheduleMessage: (service, date, time) =>
    `שלום, אני מעוניין לשנות את מועד התור שלי עבור ${service} בתאריך ${date} בשעה ${time}.`,
  cancelMessage: (service, date, time) =>
    `שלום, אני מעוניין לבטל את התור שלי עבור ${service} בתאריך ${date} בשעה ${time}.`,
};

const dictionaries: Record<SupportedLocale, PatientPortalDictionary> = {
  en,
  ar,
  he,
};

export function getPatientPortalDictionary(
  locale: SupportedLocale,
): PatientPortalDictionary {
  return dictionaries[locale] ?? en;
}
