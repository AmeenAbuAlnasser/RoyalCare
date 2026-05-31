import type { SupportedLocale } from "../locales";

type AuditLogsDictionary = {
  brand: { name: string; console: string };
  languages: Record<SupportedLocale, string>;
  shell: { menu: string; close: string };
  nav: {
    dashboard: string;
    centers: string;
    subscriptions: string;
    domains: string;
    plans: string;
    users: string;
    notifications: string;
    settings: string;
    auditLogs: string;
  };
  header: {
    eyebrow: string;
    title: string;
    subtitle: string;
    language: string;
    account: string;
  };
  filters: {
    title: string;
    activeFilterLabel: string;
    clearFilter: string;
    actorSearchLabel: string;
    actorSearchPlaceholder: string;
    actorSearchNoResults: string;
    targetSearchLabel: string;
    targetSearchPlaceholder: string;
    targetSearchNoResults: string;
    centerIdLabel: string;
    centerIdPlaceholder: string;
    actionLabel: string;
    actionPlaceholder: string;
    dateFromLabel: string;
    dateToLabel: string;
    applyButton: string;
    clearButton: string;
  };
  table: {
    action: string;
    actor: string;
    target: string;
    center: string;
    date: string;
    noResults: string;
    unspecified: string;
    unknownActor: string;
    unknownTarget: string;
    unknownCenter: string;
  };
  timeline: {
    actor: string;
    center: string;
    centerId: string;
    creditAmount: string;
    date: string;
    device: string;
    invoice: string;
    invoiceUnavailable: string;
    invoiceNumber: string;
    ip: string;
    noResults: string;
    patient: string;
    paymentAmount: string;
    subscription: string;
    target: string;
    technicalDetails: string;
  };
  metadataLabels: Record<string, string>;
  actions: {
    clearSelection: string;
  };
  actionLabels: {
    CENTER_ACTIVATED: string;
    CENTER_DEACTIVATED: string;
    CENTER_STATUS_CHANGED: string;
    PASSWORD_RESET: string;
    STAFF_PASSWORD_RESET: string;
    STAFF_STATUS_CHANGED: string;
    TENANT_STAFF_STATUS_CHANGED: string;
    TENANT_APPOINTMENT_CREATED: string;
    TENANT_APPOINTMENT_UPDATED: string;
    TENANT_APPOINTMENT_STATUS_CHANGED: string;
    TENANT_APPOINTMENT_CANCELLED: string;
    TENANT_APPOINTMENT_RESTORED: string;
    TENANT_PATIENT_CREATED: string;
    TENANT_PATIENT_UPDATED: string;
    TENANT_PATIENT_STATUS_CHANGED: string;
    TENANT_PATIENT_RESTORED: string;
    TENANT_INVOICE_CREATED: string;
    TENANT_INVOICE_STATUS_CHANGED: string;
    TENANT_INVOICE_RESTORED: string;
    TENANT_PAYMENT_ADDED: string;
    TENANT_CREDIT_CREATED: string;
    TENANT_CREDIT_USED: string;
    TENANT_INVOICE_CANCELLED: string;
    SUBSCRIPTION_INVOICE_CREATED: string;
    SUBSCRIPTION_INVOICE_PAID: string;
    SUBSCRIPTION_INVOICE_CANCELLED: string;
    SUBSCRIPTION_INVOICE_DOWNLOADED: string;
    USER_UPDATED: string;
    USER_STATUS_CHANGED: string;
    "user.created": string;
    "user.updated": string;
    "user.status_changed": string;
    "user.password_reset": string;
    "user.center_role_assigned": string;
    "user.center_role_removed": string;
    "center.login_as": string;
    LOGIN_AS_CENTER: string;
  };
  pagination: {
    showing: string;
    of: string;
    results: string;
    previous: string;
    next: string;
  };
  loadingError: string;
};

const en: AuditLogsDictionary = {
  brand: { name: "RoyalCare", console: "Super Admin Console" },
  languages: { en: "English", ar: "Arabic", he: "Hebrew" },
  shell: { menu: "Menu", close: "Close" },
  nav: {
    dashboard: "Dashboard",
    centers: "Centers",
    subscriptions: "Subscriptions",
    domains: "Domains",
    plans: "Plans",
    users: "Users",
    notifications: "Notifications",
    settings: "Settings",
    auditLogs: "Audit Logs",
  },
  header: {
    eyebrow: "Super Admin Console",
    title: "Audit Logs",
    subtitle: "Track all platform-level actions and changes",
    language: "Language",
    account: "Account",
  },
  filters: {
    title: "Filters",
    activeFilterLabel: "Active filters",
    clearFilter: "Clear filter",
    actorSearchLabel: "Search actor",
    actorSearchPlaceholder: "Search actor by name or email",
    actorSearchNoResults: "No users found",
    targetSearchLabel: "Search target",
    targetSearchPlaceholder: "Search affected user by name or email",
    targetSearchNoResults: "No users found",
    centerIdLabel: "Center ID",
    centerIdPlaceholder: "Filter by center ID",
    actionLabel: "Action",
    actionPlaceholder: "All actions",
    dateFromLabel: "From date",
    dateToLabel: "To date",
    applyButton: "Apply",
    clearButton: "Clear",
  },
  table: {
    action: "Action",
    actor: "Actor",
    target: "Target",
    center: "Center",
    date: "Date",
    noResults: "No audit log entries found.",
    unspecified: "Not specified",
    unknownActor: "Unknown actor",
    unknownTarget: "Unknown target",
    unknownCenter: "Unknown center",
  },
  timeline: {
    actor: "Actor",
    center: "Center",
    centerId: "Center ID",
    creditAmount: "Credit amount",
    date: "Date",
    device: "Device",
    invoice: "Invoice",
    invoiceUnavailable: "Invoice unavailable",
    invoiceNumber: "Invoice number",
    ip: "IP address",
    noResults: "No results match the current filters",
    patient: "Patient",
    paymentAmount: "Payment amount",
    subscription: "Subscription",
    target: "Target",
    technicalDetails: "Technical details",
  },
  metadataLabels: {
    actor: "Actor",
    invoiceId: "Invoice",
    invoiceNumber: "Invoice number",
    invoice: "Invoice",
    patientId: "Patient",
    patientName: "Patient name",
    patient: "Patient",
    paymentAmount: "Payment amount",
    creditAmount: "Credit amount",
    amount: "Amount",
    total: "Total",
    currency: "Currency",
    status: "Status",
    paymentMethod: "Payment method",
    centerId: "Center ID",
    centerName: "Center",
    subscriptionId: "Subscription",
    subscriptionInvoiceId: "Subscription invoice",
    subscriptionInvoiceNumber: "Subscription invoice number",
    planName: "Plan",
    dueDate: "Due date",
    paidAt: "Paid at",
    cancelledAt: "Cancelled at",
  },
  actions: {
    clearSelection: "Clear selection",
  },
  actionLabels: {
    CENTER_ACTIVATED: "Center activated",
    CENTER_DEACTIVATED: "Center deactivated",
    CENTER_STATUS_CHANGED: "Center status changed",
    PASSWORD_RESET: "Password reset",
    STAFF_PASSWORD_RESET: "Staff password reset",
    STAFF_STATUS_CHANGED: "Staff status changed",
    TENANT_STAFF_STATUS_CHANGED: "Tenant staff status changed",
    TENANT_APPOINTMENT_CREATED: "Appointment created",
    TENANT_APPOINTMENT_UPDATED: "Appointment updated",
    TENANT_APPOINTMENT_STATUS_CHANGED: "Appointment status changed",
    TENANT_APPOINTMENT_CANCELLED: "Appointment cancelled",
    TENANT_APPOINTMENT_RESTORED: "Appointment restored",
    TENANT_PATIENT_CREATED: "Patient created",
    TENANT_PATIENT_UPDATED: "Patient updated",
    TENANT_PATIENT_STATUS_CHANGED: "Patient status changed",
    TENANT_PATIENT_RESTORED: "Patient restored",
    TENANT_INVOICE_CREATED: "Invoice created",
    TENANT_INVOICE_STATUS_CHANGED: "Invoice status changed",
    TENANT_INVOICE_RESTORED: "Invoice restored",
    TENANT_PAYMENT_ADDED: "Payment added",
    TENANT_CREDIT_CREATED: "Patient credit created",
    TENANT_CREDIT_USED: "Patient credit used",
    TENANT_INVOICE_CANCELLED: "Invoice cancelled",
    SUBSCRIPTION_INVOICE_CREATED: "Subscription invoice created",
    SUBSCRIPTION_INVOICE_PAID: "Subscription invoice paid",
    SUBSCRIPTION_INVOICE_CANCELLED: "Subscription invoice cancelled",
    SUBSCRIPTION_INVOICE_DOWNLOADED: "Subscription invoice PDF downloaded",
    USER_UPDATED: "User updated",
    USER_STATUS_CHANGED: "User status changed",
    "user.created": "User created",
    "user.updated": "User updated",
    "user.status_changed": "User status changed",
    "user.password_reset": "Password reset",
    "user.center_role_assigned": "Center role assigned",
    "user.center_role_removed": "Center role removed",
    "center.login_as": "Login as center",
    LOGIN_AS_CENTER: "Login as center",
  },
  pagination: {
    showing: "Showing",
    of: "of",
    results: "results",
    previous: "Previous",
    next: "Next",
  },
  loadingError: "Failed to load audit logs. Please try again.",
};

const ar: AuditLogsDictionary = {
  brand: { name: "رويال كير", console: "لوحة المشرف العام" },
  languages: { en: "الإنجليزية", ar: "العربية", he: "العبرية" },
  shell: { menu: "القائمة", close: "إغلاق" },
  nav: {
    dashboard: "لوحة التحكم",
    centers: "المراكز",
    subscriptions: "الاشتراكات",
    domains: "النطاقات",
    plans: "الخطط",
    users: "المستخدمون",
    notifications: "الإشعارات",
    settings: "الإعدادات",
    auditLogs: "سجل التدقيق",
  },
  header: {
    eyebrow: "لوحة المشرف العام",
    title: "سجل التدقيق",
    subtitle: "تتبع جميع الإجراءات والتغييرات على مستوى المنصة",
    language: "اللغة",
    account: "الحساب",
  },
  filters: {
    title: "الفلاتر",
    activeFilterLabel: "الفلاتر النشطة",
    clearFilter: "مسح الفلتر",
    actorSearchLabel: "البحث عن المنفذ",
    actorSearchPlaceholder: "ابحث عن المنفذ بالاسم أو البريد الإلكتروني",
    actorSearchNoResults: "لم يتم العثور على مستخدمين",
    targetSearchLabel: "البحث عن المستهدف",
    targetSearchPlaceholder: "ابحث عن المستهدف بالاسم أو البريد الإلكتروني",
    targetSearchNoResults: "لم يتم العثور على مستخدمين",
    centerIdLabel: "معرف المركز",
    centerIdPlaceholder: "فلترة حسب معرف المركز",
    actionLabel: "الإجراء",
    actionPlaceholder: "كل الإجراءات",
    dateFromLabel: "من تاريخ",
    dateToLabel: "إلى تاريخ",
    applyButton: "تطبيق",
    clearButton: "مسح",
  },
  table: {
    action: "الإجراء",
    actor: "المنفذ",
    target: "المستهدف",
    center: "المركز",
    date: "التاريخ",
    noResults: "لا توجد سجلات تدقيق.",
    unspecified: "غير محدد",
    unknownActor: "منفذ غير معروف",
    unknownTarget: "مستهدف غير معروف",
    unknownCenter: "مركز غير معروف",
  },
  timeline: {
    actor: "المنفذ",
    center: "المركز",
    centerId: "معرف المركز",
    creditAmount: "مبلغ الرصيد",
    date: "التاريخ",
    device: "الجهاز",
    invoice: "الفاتورة",
    invoiceUnavailable: "الفاتورة غير متاحة",
    invoiceNumber: "رقم الفاتورة",
    ip: "عنوان IP",
    noResults: "لا توجد نتائج مطابقة للفلاتر الحالية",
    patient: "المريض",
    paymentAmount: "مبلغ الدفعة",
    subscription: "الاشتراك",
    target: "المستهدف",
    technicalDetails: "التفاصيل التقنية",
  },
  metadataLabels: {
    actor: "المنفذ",
    invoiceId: "الفاتورة",
    invoiceNumber: "رقم الفاتورة",
    invoice: "الفاتورة",
    patientId: "المريض",
    patientName: "اسم المريض",
    patient: "المريض",
    paymentAmount: "مبلغ الدفعة",
    creditAmount: "مبلغ الرصيد",
    amount: "المبلغ",
    total: "الإجمالي",
    currency: "العملة",
    status: "الحالة",
    paymentMethod: "طريقة الدفع",
    centerId: "معرف المركز",
    centerName: "المركز",
    subscriptionId: "الاشتراك",
    subscriptionInvoiceId: "فاتورة الاشتراك",
    subscriptionInvoiceNumber: "رقم فاتورة الاشتراك",
    planName: "الخطة",
    dueDate: "تاريخ الاستحقاق",
    paidAt: "تاريخ الدفع",
    cancelledAt: "تاريخ الإلغاء",
  },
  actions: {
    clearSelection: "مسح الاختيار",
  },
  actionLabels: {
    CENTER_ACTIVATED: "تم تفعيل المركز",
    CENTER_DEACTIVATED: "تم تعطيل المركز",
    CENTER_STATUS_CHANGED: "تم تغيير حالة المركز",
    PASSWORD_RESET: "تم إعادة تعيين كلمة المرور",
    STAFF_PASSWORD_RESET: "تم إعادة تعيين كلمة المرور للموظف",
    STAFF_STATUS_CHANGED: "تم تغيير حالة الموظف",
    TENANT_STAFF_STATUS_CHANGED: "تم تغيير حالة موظف داخل المركز",
    TENANT_APPOINTMENT_CREATED: "تم إنشاء موعد",
    TENANT_APPOINTMENT_UPDATED: "تم تحديث موعد",
    TENANT_APPOINTMENT_STATUS_CHANGED: "تم تغيير حالة الموعد",
    TENANT_APPOINTMENT_CANCELLED: "تم إلغاء موعد",
    TENANT_APPOINTMENT_RESTORED: "تم استعادة موعد",
    TENANT_PATIENT_CREATED: "تم إنشاء مريض",
    TENANT_PATIENT_UPDATED: "تم تحديث مريض",
    TENANT_PATIENT_STATUS_CHANGED: "تم تغيير حالة المريض",
    TENANT_PATIENT_RESTORED: "تم استعادة مريض",
    TENANT_INVOICE_CREATED: "تم إنشاء فاتورة",
    TENANT_INVOICE_STATUS_CHANGED: "تم تغيير حالة الفاتورة",
    TENANT_INVOICE_RESTORED: "تم استعادة فاتورة",
    TENANT_PAYMENT_ADDED: "تم إضافة دفعة",
    TENANT_CREDIT_CREATED: "تم إنشاء رصيد مريض",
    TENANT_CREDIT_USED: "تم استخدام رصيد مريض",
    TENANT_INVOICE_CANCELLED: "تم إلغاء فاتورة",
    SUBSCRIPTION_INVOICE_CREATED: "تم إنشاء فاتورة اشتراك",
    SUBSCRIPTION_INVOICE_PAID: "تم دفع فاتورة اشتراك",
    SUBSCRIPTION_INVOICE_CANCELLED: "تم إلغاء فاتورة اشتراك",
    SUBSCRIPTION_INVOICE_DOWNLOADED: "تم تحميل فاتورة اشتراك PDF",
    USER_UPDATED: "تم تحديث مستخدم",
    USER_STATUS_CHANGED: "تم تغيير حالة المستخدم",
    "user.created": "تم إنشاء مستخدم",
    "user.updated": "تم تحديث مستخدم",
    "user.status_changed": "تم تغيير حالة المستخدم",
    "user.password_reset": "تم إعادة تعيين كلمة المرور",
    "user.center_role_assigned": "تم تعيين دور في المركز",
    "user.center_role_removed": "تم إزالة دور من المركز",
    "center.login_as": "تسجيل دخول بحساب المركز",
    LOGIN_AS_CENTER: "تسجيل دخول بحساب المركز",
  },
  pagination: {
    showing: "عرض",
    of: "من",
    results: "نتيجة",
    previous: "السابق",
    next: "التالي",
  },
  loadingError: "فشل تحميل سجل التدقيق. يرجى المحاولة مرة أخرى.",
};

const he: AuditLogsDictionary = {
  brand: { name: "RoyalCare", console: "מסוף מנהל-על" },
  languages: { en: "אנגלית", ar: "ערבית", he: "עברית" },
  shell: { menu: "תפריט", close: "סגור" },
  nav: {
    dashboard: "לוח בקרה",
    centers: "מרכזים",
    subscriptions: "מינויים",
    domains: "דומיינים",
    plans: "תוכניות",
    users: "משתמשים",
    notifications: "התראות",
    settings: "הגדרות",
    auditLogs: "יומן ביקורת",
  },
  header: {
    eyebrow: "מסוף מנהל-על",
    title: "יומן ביקורת",
    subtitle: "מעקב אחר כל הפעולות והשינויים ברמת הפלטפורמה",
    language: "שפה",
    account: "חשבון",
  },
  filters: {
    title: "מסננים",
    activeFilterLabel: "מסננים פעילים",
    clearFilter: "נקה מסנן",
    actorSearchLabel: "חיפוש מבצע",
    actorSearchPlaceholder: "חפש מבצע לפי שם או אימייל",
    actorSearchNoResults: "לא נמצאו משתמשים",
    targetSearchLabel: "חיפוש יעד",
    targetSearchPlaceholder: "חפש יעד לפי שם או אימייל",
    targetSearchNoResults: "לא נמצאו משתמשים",
    centerIdLabel: "מזהה מרכז",
    centerIdPlaceholder: "סנן לפי מזהה מרכז",
    actionLabel: "פעולה",
    actionPlaceholder: "כל הפעולות",
    dateFromLabel: "מתאריך",
    dateToLabel: "עד תאריך",
    applyButton: "החל",
    clearButton: "נקה",
  },
  table: {
    action: "פעולה",
    actor: "מבצע",
    target: "יעד",
    center: "מרכז",
    date: "תאריך",
    noResults: "לא נמצאו רשומות ביקורת.",
    unspecified: "לא צוין",
    unknownActor: "מבצע לא ידוע",
    unknownTarget: "יעד לא ידוע",
    unknownCenter: "מרכז לא ידוע",
  },
  timeline: {
    actor: "מבצע",
    center: "מרכז",
    centerId: "מזהה מרכז",
    creditAmount: "סכום זיכוי",
    date: "תאריך",
    device: "מכשיר",
    invoice: "חשבונית",
    invoiceUnavailable: "חשבונית לא זמינה",
    invoiceNumber: "מספר חשבונית",
    ip: "כתובת IP",
    noResults: "אין תוצאות התואמות למסננים הנוכחיים",
    patient: "מטופל",
    paymentAmount: "סכום תשלום",
    subscription: "מינוי",
    target: "יעד",
    technicalDetails: "פרטים טכניים",
  },
  metadataLabels: {
    actor: "מבצע",
    invoiceId: "חשבונית",
    invoiceNumber: "מספר חשבונית",
    invoice: "חשבונית",
    patientId: "מטופל",
    patientName: "שם מטופל",
    patient: "מטופל",
    paymentAmount: "סכום תשלום",
    creditAmount: "סכום זיכוי",
    amount: "סכום",
    total: "סה\"כ",
    currency: "מטבע",
    status: "סטטוס",
    paymentMethod: "אמצעי תשלום",
    centerId: "מזהה מרכז",
    centerName: "מרכז",
    subscriptionId: "מינוי",
    subscriptionInvoiceId: "חשבונית מינוי",
    subscriptionInvoiceNumber: "מספר חשבונית מינוי",
    planName: "תוכנית",
    dueDate: "תאריך יעד",
    paidAt: "שולם בתאריך",
    cancelledAt: "בוטל בתאריך",
  },
  actions: {
    clearSelection: "נקה בחירה",
  },
  actionLabels: {
    CENTER_ACTIVATED: "המרכז הופעל",
    CENTER_DEACTIVATED: "המרכז הושבת",
    CENTER_STATUS_CHANGED: "סטטוס המרכז השתנה",
    PASSWORD_RESET: "סיסמה אופסה",
    STAFF_PASSWORD_RESET: "איפוס סיסמה לעובד",
    STAFF_STATUS_CHANGED: "סטטוס איש צוות השתנה",
    TENANT_STAFF_STATUS_CHANGED: "סטטוס איש צוות במרכז השתנה",
    TENANT_APPOINTMENT_CREATED: "נוצר תור",
    TENANT_APPOINTMENT_UPDATED: "תור עודכן",
    TENANT_APPOINTMENT_STATUS_CHANGED: "סטטוס התור השתנה",
    TENANT_APPOINTMENT_CANCELLED: "תור בוטל",
    TENANT_APPOINTMENT_RESTORED: "תור שוחזר",
    TENANT_PATIENT_CREATED: "נוצר מטופל",
    TENANT_PATIENT_UPDATED: "מטופל עודכן",
    TENANT_PATIENT_STATUS_CHANGED: "סטטוס המטופל השתנה",
    TENANT_PATIENT_RESTORED: "מטופל שוחזר",
    TENANT_INVOICE_CREATED: "נוצרה חשבונית",
    TENANT_INVOICE_STATUS_CHANGED: "סטטוס החשבונית השתנה",
    TENANT_INVOICE_RESTORED: "חשבונית שוחזרה",
    TENANT_PAYMENT_ADDED: "נוסף תשלום",
    TENANT_CREDIT_CREATED: "נוצר זיכוי למטופל",
    TENANT_CREDIT_USED: "נוצל זיכוי למטופל",
    TENANT_INVOICE_CANCELLED: "בוטלה חשבונית",
    SUBSCRIPTION_INVOICE_CREATED: "נוצרה חשבונית מינוי",
    SUBSCRIPTION_INVOICE_PAID: "חשבונית מינוי שולמה",
    SUBSCRIPTION_INVOICE_CANCELLED: "חשבונית מינוי בוטלה",
    SUBSCRIPTION_INVOICE_DOWNLOADED: "חשבונית מינוי PDF הורדה",
    USER_UPDATED: "משתמש עודכן",
    USER_STATUS_CHANGED: "סטטוס משתמש השתנה",
    "user.created": "משתמש נוצר",
    "user.updated": "משתמש עודכן",
    "user.status_changed": "סטטוס משתמש השתנה",
    "user.password_reset": "סיסמה אופסה",
    "user.center_role_assigned": "תפקיד מרכז הוקצה",
    "user.center_role_removed": "תפקיד מרכז הוסר",
    "center.login_as": "כניסה כמרכז",
    LOGIN_AS_CENTER: "כניסה כמרכז",
  },
  pagination: {
    showing: "מציג",
    of: "מתוך",
    results: "תוצאות",
    previous: "הקודם",
    next: "הבא",
  },
  loadingError: "טעינת יומן הביקורת נכשלה. נסה שוב.",
};

export const superAdminAuditLogsDictionaries = { en, ar, he } as const;

export type SuperAdminAuditLogsDictionary = AuditLogsDictionary;
