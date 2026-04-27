import type { SupportedLocale } from "../locales";
import { superAdminUsersDictionaries } from "./super-admin-users";

type UserDetailsDictionary = (typeof superAdminUsersDictionaries)["en"] & {
  detailHeader: {
    eyebrow: string;
    subtitle: string;
  };
  sections: (typeof superAdminUsersDictionaries)["en"]["sections"] & {
    overview: string;
    permissionsSummary: string;
    quickActions: string;
    activityTimeline: string;
    responsibilities: string;
    internalNotes: string;
  };
  fields: {
    fullName: string;
    email: string;
    mobile: string;
    role: string;
    department: string;
    status: string;
    createdDate: string;
    lastLogin: string;
    lastActivity: string;
    twoFactor: string;
    assignedRole: string;
    directPermissions: string;
    accessLevel: string;
    restrictedAreas: string;
  };
  detailActions: {
    backToUsers: string;
    editUser: string;
    resetPassword: string;
    suspendUser: string;
    activateUser: string;
    forceLogout: string;
    deleteUser: string;
    saveNotes: string;
  };
  permissions: Record<
    | "approveInvoices"
    | "manageCenters"
    | "manageSubscriptions"
    | "manageSupportTickets"
    | "manageUsers"
    | "viewCenters"
    | "viewSubscriptions",
    string
  >;
  accessLevels: Record<
    "financeOnly" | "fullPlatform" | "limitedCommercial" | "readOnly" | "supportOperations",
    string
  >;
  restrictedAreas: Record<
    "billing" | "billingExports" | "domainVerification" | "platformSettings" | "userManagement",
    string
  >;
  responsibilities: Record<
    "domainVerification" | "salesFollowUp" | "subscriptionApprovals" | "supportEscalations" | "supportTickets",
    string
  >;
  timeline: Record<"lastLogin" | "passwordReset" | "permissionUpdated" | "roleChanged" | "userCreated", string>;
  notes: {
    label: string;
    placeholder: string;
    helper: string;
  };
  detailValues: {
    enabled: string;
    disabled: string;
    noDirectPermissions: string;
    noRestrictedAreas: string;
    futureAction: string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
};

const en: UserDetailsDictionary = {
  ...superAdminUsersDictionaries.en,
  detailHeader: {
    eyebrow: "Platform user",
    subtitle: "Review identity, access, activity, responsibilities, and private administrative notes.",
  },
  sections: {
    ...superAdminUsersDictionaries.en.sections,
    overview: "User Overview",
    permissionsSummary: "Permissions Summary",
    quickActions: "Quick Actions",
    activityTimeline: "Activity Timeline",
    responsibilities: "Assigned Responsibilities",
    internalNotes: "Internal Notes",
  },
  fields: {
    fullName: "Full Name",
    email: "Email",
    mobile: "Mobile Number",
    role: "Role",
    department: "Department",
    status: "Status",
    createdDate: "Created Date",
    lastLogin: "Last Login",
    lastActivity: "Last Activity",
    twoFactor: "Two-Factor Authentication",
    assignedRole: "Assigned Role",
    directPermissions: "Direct Permissions",
    accessLevel: "Access Level",
    restrictedAreas: "Restricted Areas",
  },
  detailActions: {
    backToUsers: "Back to Users",
    editUser: "Edit User",
    resetPassword: "Reset Password",
    suspendUser: "Suspend User",
    activateUser: "Activate User",
    forceLogout: "Force Logout",
    deleteUser: "Delete User",
    saveNotes: "Save Notes",
  },
  permissions: {
    approveInvoices: "Approve invoices",
    manageCenters: "Manage centers",
    manageSubscriptions: "Manage subscriptions",
    manageSupportTickets: "Manage support tickets",
    manageUsers: "Manage platform users",
    viewCenters: "View centers",
    viewSubscriptions: "View subscriptions",
  },
  accessLevels: {
    financeOnly: "Finance only",
    fullPlatform: "Full platform access",
    limitedCommercial: "Limited commercial access",
    readOnly: "Read-only access",
    supportOperations: "Support operations",
  },
  restrictedAreas: {
    billing: "Billing",
    billingExports: "Billing exports",
    domainVerification: "Domain verification",
    platformSettings: "Platform settings",
    userManagement: "User management",
  },
  responsibilities: {
    domainVerification: "Domain verification",
    salesFollowUp: "Sales follow-up",
    subscriptionApprovals: "Subscription approvals",
    supportEscalations: "Support escalations",
    supportTickets: "Support tickets",
  },
  timeline: {
    lastLogin: "Last login",
    passwordReset: "Password reset",
    permissionUpdated: "Permission updated",
    roleChanged: "Role changed",
    userCreated: "User created",
  },
  notes: {
    label: "Private admin notes",
    placeholder: "Write internal notes for RoyalCare platform admins only.",
    helper: "UI only for now. Notes will connect to secure audit-backed storage later.",
  },
  detailValues: {
    enabled: "Enabled",
    disabled: "Disabled",
    noDirectPermissions: "No direct permissions",
    noRestrictedAreas: "No restricted areas",
    futureAction: "UI-only action. Backend permissions and audit logging will be enforced later.",
    notFoundTitle: "User not found",
    notFoundDescription: "This user id does not match a RoyalCare platform user in the current mock dataset.",
  },
};

const ar: UserDetailsDictionary = {
  ...superAdminUsersDictionaries.ar,
  detailHeader: {
    eyebrow: "مستخدم المنصة",
    subtitle: "مراجعة الهوية والوصول والنشاط والمسؤوليات والملاحظات الإدارية الخاصة.",
  },
  sections: {
    ...superAdminUsersDictionaries.ar.sections,
    overview: "نظرة عامة على المستخدم",
    permissionsSummary: "ملخص الصلاحيات",
    quickActions: "إجراءات سريعة",
    activityTimeline: "سجل النشاط",
    responsibilities: "المسؤوليات المعينة",
    internalNotes: "ملاحظات داخلية",
  },
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    mobile: "رقم الجوال",
    role: "الدور",
    department: "القسم",
    status: "الحالة",
    createdDate: "تاريخ الإنشاء",
    lastLogin: "آخر دخول",
    lastActivity: "آخر نشاط",
    twoFactor: "المصادقة الثنائية",
    assignedRole: "الدور المعين",
    directPermissions: "صلاحيات مباشرة",
    accessLevel: "مستوى الوصول",
    restrictedAreas: "مناطق مقيدة",
  },
  detailActions: {
    backToUsers: "العودة إلى المستخدمين",
    editUser: "تعديل المستخدم",
    resetPassword: "إعادة تعيين كلمة المرور",
    suspendUser: "إيقاف المستخدم",
    activateUser: "تفعيل المستخدم",
    forceLogout: "فرض تسجيل الخروج",
    deleteUser: "حذف المستخدم",
    saveNotes: "حفظ الملاحظات",
  },
  permissions: {
    approveInvoices: "اعتماد الفواتير",
    manageCenters: "إدارة المراكز",
    manageSubscriptions: "إدارة الاشتراكات",
    manageSupportTickets: "إدارة تذاكر الدعم",
    manageUsers: "إدارة مستخدمي المنصة",
    viewCenters: "عرض المراكز",
    viewSubscriptions: "عرض الاشتراكات",
  },
  accessLevels: {
    financeOnly: "وصول مالي فقط",
    fullPlatform: "وصول كامل للمنصة",
    limitedCommercial: "وصول تجاري محدود",
    readOnly: "وصول للقراءة فقط",
    supportOperations: "عمليات الدعم",
  },
  restrictedAreas: {
    billing: "الفوترة",
    billingExports: "تصدير الفواتير",
    domainVerification: "التحقق من النطاقات",
    platformSettings: "إعدادات المنصة",
    userManagement: "إدارة المستخدمين",
  },
  responsibilities: {
    domainVerification: "التحقق من النطاقات",
    salesFollowUp: "متابعة المبيعات",
    subscriptionApprovals: "اعتمادات الاشتراك",
    supportEscalations: "تصعيد الدعم",
    supportTickets: "تذاكر الدعم",
  },
  timeline: {
    lastLogin: "آخر دخول",
    passwordReset: "إعادة تعيين كلمة المرور",
    permissionUpdated: "تحديث الصلاحيات",
    roleChanged: "تغيير الدور",
    userCreated: "إنشاء المستخدم",
  },
  notes: {
    label: "ملاحظات إدارية خاصة",
    placeholder: "اكتب ملاحظات داخلية لمديري منصة RoyalCare فقط.",
    helper: "واجهة فقط حالياً. سيتم ربط الملاحظات لاحقاً بتخزين آمن مدعوم بسجل تدقيق.",
  },
  detailValues: {
    enabled: "مفعلة",
    disabled: "معطلة",
    noDirectPermissions: "لا توجد صلاحيات مباشرة",
    noRestrictedAreas: "لا توجد مناطق مقيدة",
    futureAction: "إجراء واجهة فقط. سيتم فرض الصلاحيات وسجل التدقيق من الخادم لاحقاً.",
    notFoundTitle: "المستخدم غير موجود",
    notFoundDescription: "معرف المستخدم هذا لا يطابق مستخدماً في بيانات RoyalCare التجريبية الحالية.",
  },
};

const he: UserDetailsDictionary = {
  ...superAdminUsersDictionaries.he,
  detailHeader: {
    eyebrow: "משתמש מערכת",
    subtitle: "סקירת זהות, גישה, פעילות, תחומי אחריות והערות ניהול פרטיות.",
  },
  sections: {
    ...superAdminUsersDictionaries.he.sections,
    overview: "סקירת משתמש",
    permissionsSummary: "סיכום הרשאות",
    quickActions: "פעולות מהירות",
    activityTimeline: "ציר פעילות",
    responsibilities: "תחומי אחריות",
    internalNotes: "הערות פנימיות",
  },
  fields: {
    fullName: "שם מלא",
    email: "אימייל",
    mobile: "מספר נייד",
    role: "תפקיד",
    department: "מחלקה",
    status: "סטטוס",
    createdDate: "תאריך יצירה",
    lastLogin: "כניסה אחרונה",
    lastActivity: "פעילות אחרונה",
    twoFactor: "אימות דו-שלבי",
    assignedRole: "תפקיד משויך",
    directPermissions: "הרשאות ישירות",
    accessLevel: "רמת גישה",
    restrictedAreas: "אזורים מוגבלים",
  },
  detailActions: {
    backToUsers: "חזרה למשתמשים",
    editUser: "עריכת משתמש",
    resetPassword: "איפוס סיסמה",
    suspendUser: "השעת משתמש",
    activateUser: "הפעלת משתמש",
    forceLogout: "ניתוק כפוי",
    deleteUser: "מחיקת משתמש",
    saveNotes: "שמירת הערות",
  },
  permissions: {
    approveInvoices: "אישור חשבוניות",
    manageCenters: "ניהול מרכזים",
    manageSubscriptions: "ניהול מינויים",
    manageSupportTickets: "ניהול פניות תמיכה",
    manageUsers: "ניהול משתמשי מערכת",
    viewCenters: "צפייה במרכזים",
    viewSubscriptions: "צפייה במינויים",
  },
  accessLevels: {
    financeOnly: "גישה לכספים בלבד",
    fullPlatform: "גישה מלאה למערכת",
    limitedCommercial: "גישה מסחרית מוגבלת",
    readOnly: "גישה לקריאה בלבד",
    supportOperations: "פעילות תמיכה",
  },
  restrictedAreas: {
    billing: "חיוב",
    billingExports: "ייצוא חיובים",
    domainVerification: "אימות דומיינים",
    platformSettings: "הגדרות מערכת",
    userManagement: "ניהול משתמשים",
  },
  responsibilities: {
    domainVerification: "אימות דומיינים",
    salesFollowUp: "מעקב מכירות",
    subscriptionApprovals: "אישורי מינויים",
    supportEscalations: "הסלמות תמיכה",
    supportTickets: "פניות תמיכה",
  },
  timeline: {
    lastLogin: "כניסה אחרונה",
    passwordReset: "איפוס סיסמה",
    permissionUpdated: "הרשאה עודכנה",
    roleChanged: "תפקיד השתנה",
    userCreated: "משתמש נוצר",
  },
  notes: {
    label: "הערות ניהול פרטיות",
    placeholder: "כתיבת הערות פנימיות למנהלי RoyalCare בלבד.",
    helper: "כרגע ממשק בלבד. בהמשך ההערות יחוברו לאחסון מאובטח עם יומן ביקורת.",
  },
  detailValues: {
    enabled: "פעיל",
    disabled: "כבוי",
    noDirectPermissions: "אין הרשאות ישירות",
    noRestrictedAreas: "אין אזורים מוגבלים",
    futureAction: "פעולת ממשק בלבד. הרשאות ויומן ביקורת יאכפו בהמשך בצד השרת.",
    notFoundTitle: "המשתמש לא נמצא",
    notFoundDescription: "מזהה המשתמש אינו תואם משתמש במידע הדמה הנוכחי של RoyalCare.",
  },
};

export const superAdminUserDetailsDictionaries: Record<SupportedLocale, UserDetailsDictionary> = {
  en,
  ar,
  he,
};
