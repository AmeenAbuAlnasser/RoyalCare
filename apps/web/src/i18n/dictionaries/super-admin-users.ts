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
    suspend: string;
    resetPassword: string;
    delete: string;
  };
  roles: {
    superAdmin: string;
    support: string;
    sales: string;
    finance: string;
    viewer: string;
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
  values: {
    mobileHint: string;
    neverLoggedIn: string;
    rolePreviewHint: string;
  };
};

export const superAdminUsersDictionaries: Record<SupportedLocale, UsersDictionary> = {
  en: {
    brand: { name: "RoyalCare", console: "Super Admin" },
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
    },
    header: {
      eyebrow: "Platform access",
      title: "Users Management",
      subtitle: "Manage RoyalCare platform users, roles, status, departments, and access actions.",
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
      searchPlaceholder: "Search by name, email, or role",
      all: "All",
      role: "Role",
      status: "Status",
      lastLogin: "Last Login",
    },
    table: {
      userName: "User Name",
      email: "Email",
      role: "Role",
      department: "Department",
      status: "Status",
      lastLogin: "Last Login",
      createdDate: "Created Date",
      actions: "Actions",
    },
    actions: {
      addNewUser: "Add New User",
      view: "View",
      edit: "Edit",
      suspend: "Suspend",
      resetPassword: "Reset Password",
      delete: "Delete",
    },
    roles: {
      superAdmin: "Super Admin",
      support: "Support",
      sales: "Sales",
      finance: "Finance",
      viewer: "Viewer",
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
    values: {
      mobileHint: "Mobile uses user cards with one Actions menu per user.",
      neverLoggedIn: "Never logged in",
      rolePreviewHint: "Platform roles control RoyalCare staff access only, not center customer access.",
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
      settings: "الإعدادات",
    },
    header: {
      eyebrow: "وصول المنصة",
      title: "إدارة المستخدمين",
      subtitle: "إدارة مستخدمي منصة رويال كير والأدوار والحالات والأقسام وإجراءات الوصول.",
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
      pendingUsers: "مستخدمون بانتظار التفعيل",
      suspendedUsers: "المستخدمون الموقوفون",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث حسب الاسم أو البريد أو الدور",
      all: "الكل",
      role: "الدور",
      status: "الحالة",
      lastLogin: "آخر دخول",
    },
    table: {
      userName: "اسم المستخدم",
      email: "البريد الإلكتروني",
      role: "الدور",
      department: "القسم",
      status: "الحالة",
      lastLogin: "آخر دخول",
      createdDate: "تاريخ الإنشاء",
      actions: "الإجراءات",
    },
    actions: {
      addNewUser: "إضافة مستخدم جديد",
      view: "عرض",
      edit: "تعديل",
      suspend: "إيقاف",
      resetPassword: "إعادة تعيين كلمة المرور",
      delete: "حذف",
    },
    roles: {
      superAdmin: "مدير عام",
      support: "الدعم",
      sales: "المبيعات",
      finance: "المالية",
      viewer: "مشاهد",
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
    values: {
      mobileHint: "في الجوال يظهر المستخدمون كبطاقات مع قائمة إجراءات واحدة لكل مستخدم.",
      neverLoggedIn: "لم يسجل الدخول",
      rolePreviewHint: "أدوار المنصة تتحكم بوصول فريق رويال كير فقط، وليس وصول عملاء المراكز.",
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
      settings: "הגדרות",
    },
    header: {
      eyebrow: "גישת מערכת",
      title: "ניהול משתמשים",
      subtitle: "ניהול משתמשי פלטפורמת RoyalCare, תפקידים, סטטוסים, מחלקות ופעולות גישה.",
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
      pendingUsers: "משתמשים ממתינים",
      suspendedUsers: "משתמשים מושעים",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי שם, אימייל או תפקיד",
      all: "הכל",
      role: "תפקיד",
      status: "סטטוס",
      lastLogin: "כניסה אחרונה",
    },
    table: {
      userName: "שם משתמש",
      email: "אימייל",
      role: "תפקיד",
      department: "מחלקה",
      status: "סטטוס",
      lastLogin: "כניסה אחרונה",
      createdDate: "תאריך יצירה",
      actions: "פעולות",
    },
    actions: {
      addNewUser: "הוספת משתמש חדש",
      view: "צפייה",
      edit: "עריכה",
      suspend: "השעיה",
      resetPassword: "איפוס סיסמה",
      delete: "מחיקה",
    },
    roles: {
      superAdmin: "Super Admin",
      support: "תמיכה",
      sales: "מכירות",
      finance: "כספים",
      viewer: "צופה",
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
      pending: "ממתין",
      suspended: "מושעה",
    },
    names: {
      amirHaddad: "אמיר חדאד",
      danaNasser: "דנה נאסר",
      mayaCohen: "מאיה כהן",
      noamBar: "נועם בר",
      saraLevi: "שרה לוי",
    },
    values: {
      mobileHint: "במובייל המשתמשים מוצגים ככרטיסים עם תפריט פעולות אחד לכל משתמש.",
      neverLoggedIn: "לא התחבר",
      rolePreviewHint: "תפקידי המערכת שולטים בגישת צוות RoyalCare בלבד, לא בגישת לקוחות המרכזים.",
    },
  },
};
