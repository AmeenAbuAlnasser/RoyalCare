import type { SupportedLocale } from "../locales";

type UsersDictionary = {
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
    auditLogs: string;
    settings: string;
  };
  header: {
    eyebrow: string;
    title: string;
    subtitle: string;
    language: string;
    account: string;
  };
  sections: {
    summary: string;
    searchFilters: string;
    usersTable: string;
    rolesPreview: string;
  };
  stats: {
    totalUsers: string;
    activeUsers: string;
    pendingUsers: string;
    suspendedUsers: string;
  };
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    all: string;
    clearFilter: string;
    role: string;
    status: string;
    lastLogin: string;
  };
  table: {
    userName: string;
    email: string;
    role: string;
    department: string;
    status: string;
    lastLogin: string;
    createdDate: string;
    actions: string;
  };
  actions: {
    addNewUser: string;
    view: string;
    edit: string;
    activate: string;
    deactivate: string;
    suspend: string;
    resetPassword: string;
    forcePasswordChange: string;
    sendWelcomeEmail: string;
    delete: string;
    cancel: string;
    save: string;
  };
  roles: {
    SUPER_ADMIN: string;
    PLATFORM_ADMIN: string;
    SUPPORT_ADMIN: string;
    FINANCE_ADMIN: string;
    READ_ONLY_ADMIN: string;
    CENTER_OWNER: string;
    CENTER_MANAGER: string;
    DOCTOR: string;
    RECEPTIONIST: string;
    ACCOUNTANT: string;
    STAFF: string;
  };
  departments: {
    finance: string;
    management: string;
    operations: string;
    sales: string;
    support: string;
  };
  statuses: {
    active: string;
    inactive: string;
    pending: string;
    suspended: string;
  };
  names: {
    amirHaddad: string;
    danaNasser: string;
    mayaCohen: string;
    noamBar: string;
    saraLevi: string;
  };
  form: {
    addTitle: string;
    editTitle: string;
    fullName: string;
    email: string;
    phone: string;
    temporaryPassword: string;
    status: string;
    platformRole: string;
    center: string;
    centerRole: string;
    optional: string;
    noPlatformRole: string;
    noCenter: string;
    noCenterRole: string;
  };
  centerRoles: {
    CENTER_OWNER: string;
    CENTER_MANAGER: string;
    DOCTOR: string;
    RECEPTIONIST: string;
    ACCOUNTANT: string;
    STAFF: string;
  };
  values: {
    mobileHint: string;
    neverLoggedIn: string;
    rolePreviewHint: string;
    loading: string;
    empty: string;
    loadError: string;
    saved: string;
    statusUpdated: string;
    passwordReset: string;
    temporaryPassword: string;
    copy: string;
    copied: string;
    copyFailed: string;
    close: string;
    passwordResetWarning: string;
  };
};

const navEn = {
  dashboard: "Dashboard",
  centers: "Centers",
  subscriptions: "Subscriptions",
  domains: "Domains",
  plans: "Plans",
  users: "Users",
  notifications: "Notifications",
  auditLogs: "Audit Logs",
  settings: "Settings",
};

export const superAdminUsersDictionaries: Record<
  SupportedLocale,
  UsersDictionary
> = {
  en: {
    brand: { name: "RoyalCare", console: "Super Admin" },
    languages: { en: "English", ar: "Arabic", he: "Hebrew" },
    shell: { menu: "Menu", close: "Close" },
    nav: navEn,
    header: {
      eyebrow: "Platform access",
      title: "Users Management",
      subtitle:
        "Manage RoyalCare platform users, roles, status, and center access.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      summary: "User Summary",
      searchFilters: "Search + Filters",
      usersTable: "Users Table",
      rolesPreview: "Roles Preview",
    },
    stats: {
      totalUsers: "Total Users",
      activeUsers: "Active Users",
      pendingUsers: "Pending Users",
      suspendedUsers: "Suspended Users",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by name or email",
      all: "All",
      clearFilter: "Clear filter",
      role: "Role",
      status: "Status",
      lastLogin: "Last Login",
    },
    table: {
      userName: "User Name",
      email: "Email",
      role: "Role",
      department: "Scope",
      status: "Status",
      lastLogin: "Last Login",
      createdDate: "Created Date",
      actions: "Actions",
    },
    actions: {
      addNewUser: "Add New User",
      view: "View",
      edit: "Edit",
      activate: "Activate",
      deactivate: "Deactivate",
      suspend: "Suspend",
      resetPassword: "Reset Password",
      forcePasswordChange: "Force Password Change",
      sendWelcomeEmail: "Send Welcome Email",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
    },
    roles: {
      SUPER_ADMIN: "Super Admin",
      PLATFORM_ADMIN: "Platform Admin",
      SUPPORT_ADMIN: "Support Admin",
      FINANCE_ADMIN: "Finance Admin",
      READ_ONLY_ADMIN: "Read Only Admin",
      CENTER_OWNER: "Center Owner",
      CENTER_MANAGER: "Center Manager",
      DOCTOR: "Doctor",
      RECEPTIONIST: "Receptionist",
      ACCOUNTANT: "Accountant",
      STAFF: "Staff",
    },
    departments: {
      finance: "Finance",
      management: "Management",
      operations: "Operations",
      sales: "Sales",
      support: "Support",
    },
    statuses: {
      active: "Active",
      inactive: "Inactive",
      pending: "Pending",
      suspended: "Suspended",
    },
    names: {
      amirHaddad: "Amir Haddad",
      danaNasser: "Dana Nasser",
      mayaCohen: "Maya Cohen",
      noamBar: "Noam Bar",
      saraLevi: "Sara Levi",
    },
    form: {
      addTitle: "Add user",
      editTitle: "Edit user",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      temporaryPassword: "Temporary Password",
      status: "Status",
      platformRole: "Platform Role",
      center: "Center",
      centerRole: "Center Role",
      optional: "Optional",
      noPlatformRole: "No platform role",
      noCenter: "No center",
      noCenterRole: "No center role",
    },
    centerRoles: {
      ACCOUNTANT: "Accountant",
      CENTER_MANAGER: "Center Manager",
      CENTER_OWNER: "Center Owner",
      DOCTOR: "Doctor",
      RECEPTIONIST: "Receptionist",
      STAFF: "Staff",
    },
    values: {
      mobileHint: "Mobile uses user cards with one Actions menu per user.",
      neverLoggedIn: "Never logged in",
      rolePreviewHint:
        "Platform roles control RoyalCare staff access. Center roles connect users to a specific tenant center.",
      loading: "Loading users...",
      empty: "No users match the current filters.",
      loadError: "Users could not be loaded. Try again.",
      saved: "User saved successfully.",
      statusUpdated: "User status updated.",
      passwordReset: "Password reset successfully.",
      temporaryPassword: "Temporary password",
      copy: "Copy",
      copied: "Copied",
      copyFailed: "Copy failed. Please copy the password manually.",
      close: "Close",
      passwordResetWarning: "Save this password now. It will not be shown again.",
    },
  },
  ar: {
    brand: { name: "رويال كير", console: "إدارة المنصة" },
    languages: { en: "الإنجليزية", ar: "العربية", he: "العبرية" },
    shell: { menu: "القائمة", close: "إغلاق" },
    nav: {
      dashboard: "لوحة التحكم",
      centers: "المراكز",
      subscriptions: "الاشتراكات",
      domains: "النطاقات",
      plans: "الباقات",
      users: "المستخدمون",
      notifications: "الإشعارات",
      auditLogs: "سجل التدقيق",
      settings: "الإعدادات",
    },
    header: {
      eyebrow: "وصول المنصة",
      title: "إدارة المستخدمين",
      subtitle: "إدارة مستخدمي رويال كير وأدوارهم وحالاتهم ووصولهم للمراكز.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      summary: "ملخص المستخدمين",
      searchFilters: "البحث والفلاتر",
      usersTable: "جدول المستخدمين",
      rolesPreview: "معاينة الأدوار",
    },
    stats: {
      totalUsers: "إجمالي المستخدمين",
      activeUsers: "المستخدمون النشطون",
      pendingUsers: "بانتظار التفعيل",
      suspendedUsers: "المستخدمون الموقوفون",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث بالاسم أو البريد",
      all: "الكل",
      clearFilter: "مسح الفلتر",
      role: "الدور",
      status: "الحالة",
      lastLogin: "آخر دخول",
    },
    table: {
      userName: "اسم المستخدم",
      email: "البريد الإلكتروني",
      role: "الدور",
      department: "النطاق",
      status: "الحالة",
      lastLogin: "آخر دخول",
      createdDate: "تاريخ الإنشاء",
      actions: "الإجراءات",
    },
    actions: {
      addNewUser: "إضافة مستخدم جديد",
      view: "عرض",
      edit: "تعديل",
      activate: "تفعيل",
      deactivate: "تعطيل",
      suspend: "إيقاف",
      resetPassword: "إعادة تعيين كلمة المرور",
      forcePasswordChange: "فرض تغيير كلمة المرور",
      sendWelcomeEmail: "إرسال بريد الترحيب",
      delete: "حذف",
      cancel: "إلغاء",
      save: "حفظ",
    },
    roles: {
      SUPER_ADMIN: "مدير عام",
      PLATFORM_ADMIN: "مدير منصة",
      SUPPORT_ADMIN: "مدير دعم",
      FINANCE_ADMIN: "مدير مالي",
      READ_ONLY_ADMIN: "مشاهد فقط",
      CENTER_OWNER: "مالك المركز",
      CENTER_MANAGER: "مدير المركز",
      DOCTOR: "طبيب",
      RECEPTIONIST: "موظف استقبال",
      ACCOUNTANT: "محاسب",
      STAFF: "موظف",
    },
    departments: {
      finance: "المالية",
      management: "الإدارة",
      operations: "العمليات",
      sales: "المبيعات",
      support: "الدعم",
    },
    statuses: {
      active: "نشط",
      inactive: "غير نشط",
      pending: "بانتظار التفعيل",
      suspended: "موقوف",
    },
    names: {
      amirHaddad: "أمير حداد",
      danaNasser: "دانا ناصر",
      mayaCohen: "مايا كوهين",
      noamBar: "نوعام بار",
      saraLevi: "سارة ليفي",
    },
    form: {
      addTitle: "إضافة مستخدم",
      editTitle: "تعديل مستخدم",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      temporaryPassword: "كلمة مرور مؤقتة",
      status: "الحالة",
      platformRole: "دور المنصة",
      center: "المركز",
      centerRole: "دور المركز",
      optional: "اختياري",
      noPlatformRole: "بدون دور منصة",
      noCenter: "بدون مركز",
      noCenterRole: "بدون دور مركز",
    },
    centerRoles: {
      ACCOUNTANT: "محاسب",
      CENTER_MANAGER: "مدير المركز",
      CENTER_OWNER: "مالك المركز",
      DOCTOR: "طبيب",
      RECEPTIONIST: "موظف استقبال",
      STAFF: "موظف",
    },
    values: {
      mobileHint: "في الجوال يظهر المستخدمون كبطاقات مع قائمة إجراءات واحدة.",
      neverLoggedIn: "لم يسجل الدخول",
      rolePreviewHint:
        "أدوار المنصة تتحكم بوصول فريق رويال كير. أدوار المراكز تربط المستخدم بمركز محدد.",
      loading: "جار تحميل المستخدمين...",
      empty: "لا يوجد مستخدمون مطابقون للفلاتر الحالية.",
      loadError: "تعذر تحميل المستخدمين. حاول مرة أخرى.",
      saved: "تم حفظ المستخدم بنجاح.",
      statusUpdated: "تم تحديث حالة المستخدم.",
      passwordReset: "تمت إعادة تعيين كلمة المرور.",
      temporaryPassword: "كلمة المرور المؤقتة",
      copy: "نسخ",
      copied: "تم النسخ",
      copyFailed: "تعذر النسخ. يرجى نسخ كلمة المرور يدويًا.",
      close: "إغلاق",
      passwordResetWarning: "احفظ كلمة المرور الآن، لن تظهر مرة أخرى.",
    },
  },
  he: {
    brand: { name: "RoyalCare", console: "ניהול מערכת" },
    languages: { en: "אנגלית", ar: "ערבית", he: "עברית" },
    shell: { menu: "תפריט", close: "סגירה" },
    nav: {
      dashboard: "לוח בקרה",
      centers: "מרכזים",
      subscriptions: "מינויים",
      domains: "דומיינים",
      plans: "תוכניות",
      users: "משתמשים",
      notifications: "התראות",
      auditLogs: "יומן ביקורת",
      settings: "הגדרות",
    },
    header: {
      eyebrow: "גישת מערכת",
      title: "ניהול משתמשים",
      subtitle: "ניהול משתמשי RoyalCare, תפקידים, סטטוס וגישה למרכזים.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      summary: "סיכום משתמשים",
      searchFilters: "חיפוש וסינון",
      usersTable: "טבלת משתמשים",
      rolesPreview: "תצוגת תפקידים",
    },
    stats: {
      totalUsers: "סך משתמשים",
      activeUsers: "משתמשים פעילים",
      pendingUsers: "ממתינים להפעלה",
      suspendedUsers: "משתמשים מושהים",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי שם או אימייל",
      all: "הכל",
      clearFilter: "נקה סינון",
      role: "תפקיד",
      status: "סטטוס",
      lastLogin: "כניסה אחרונה",
    },
    table: {
      userName: "שם משתמש",
      email: "אימייל",
      role: "תפקיד",
      department: "תחום",
      status: "סטטוס",
      lastLogin: "כניסה אחרונה",
      createdDate: "תאריך יצירה",
      actions: "פעולות",
    },
    actions: {
      addNewUser: "הוספת משתמש חדש",
      view: "צפייה",
      edit: "עריכה",
      activate: "הפעלה",
      deactivate: "השבתה",
      suspend: "השהיה",
      resetPassword: "איפוס סיסמה",
      forcePasswordChange: "חובת שינוי סיסמה",
      sendWelcomeEmail: "שליחת אימייל ברוכים הבאים",
      delete: "מחיקה",
      cancel: "ביטול",
      save: "שמירה",
    },
    roles: {
      SUPER_ADMIN: "מנהל על",
      PLATFORM_ADMIN: "מנהל מערכת",
      SUPPORT_ADMIN: "מנהל תמיכה",
      FINANCE_ADMIN: "מנהל כספים",
      READ_ONLY_ADMIN: "צפייה בלבד",
      CENTER_OWNER: "בעלי המרכז",
      CENTER_MANAGER: "מנהל מרכז",
      DOCTOR: "רופא",
      RECEPTIONIST: "קבלה",
      ACCOUNTANT: "חשבונות",
      STAFF: "צוות",
    },
    departments: {
      finance: "כספים",
      management: "הנהלה",
      operations: "תפעול",
      sales: "מכירות",
      support: "תמיכה",
    },
    statuses: {
      active: "פעיל",
      inactive: "לא פעיל",
      pending: "ממתין",
      suspended: "מושהה",
    },
    names: {
      amirHaddad: "אמיר חדאד",
      danaNasser: "דנה נאסר",
      mayaCohen: "מאיה כהן",
      noamBar: "נועם בר",
      saraLevi: "שרה לוי",
    },
    form: {
      addTitle: "הוספת משתמש",
      editTitle: "עריכת משתמש",
      fullName: "שם מלא",
      email: "אימייל",
      phone: "טלפון",
      temporaryPassword: "סיסמה זמנית",
      status: "סטטוס",
      platformRole: "תפקיד מערכת",
      center: "מרכז",
      centerRole: "תפקיד במרכז",
      optional: "אופציונלי",
      noPlatformRole: "ללא תפקיד מערכת",
      noCenter: "ללא מרכז",
      noCenterRole: "ללא תפקיד מרכז",
    },
    centerRoles: {
      ACCOUNTANT: "חשבונות",
      CENTER_MANAGER: "מנהל מרכז",
      CENTER_OWNER: "בעלי המרכז",
      DOCTOR: "רופא",
      RECEPTIONIST: "קבלה",
      STAFF: "צוות",
    },
    values: {
      mobileHint: "במובייל המשתמשים מוצגים ככרטיסים עם תפריט פעולות אחד.",
      neverLoggedIn: "לא התחבר",
      rolePreviewHint:
        "תפקידי מערכת שולטים בגישת צוות RoyalCare. תפקידי מרכז מחברים משתמש למרכז מסוים.",
      loading: "טוען משתמשים...",
      empty: "אין משתמשים שתואמים למסננים הנוכחיים.",
      loadError: "לא ניתן לטעון משתמשים. נסו שוב.",
      saved: "המשתמש נשמר בהצלחה.",
      statusUpdated: "סטטוס המשתמש עודכן.",
      passwordReset: "הסיסמה אופסה בהצלחה.",
      temporaryPassword: "סיסמה זמנית",
      copy: "העתק",
      copied: "הועתק",
      copyFailed: "ההעתקה נכשלה. יש להעתיק את הסיסמה ידנית.",
      close: "סגירה",
      passwordResetWarning: "שמור את הסיסמה כעת. היא לא תוצג שוב.",
    },
  },
};
