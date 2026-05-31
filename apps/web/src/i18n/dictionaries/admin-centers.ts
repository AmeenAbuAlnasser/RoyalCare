import type { SupportedLocale } from "../locales";

type AdminCentersDictionary = {
  brand: {
    name: string;
    console: string;
  };
  languages: Record<SupportedLocale, string>;
  shell: {
    menu: string;
    close: string;
  };
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
  page: {
    listTitle: string;
    listSubtitle: string;
    detailsTitle: string;
    detailsSubtitle: string;
    usersTitle: string;
    usersSubtitle: string;
    back: string;
    loading: string;
    empty: string;
    emptyUsers: string;
    error: string;
    loginAsError: string;
    loginAsLoading: string;
    noActiveManager: string;
    managerAdded: string;
    managerCreateError: string;
    managerModalTitle: string;
    managerModalSubtitle: string;
    updated: string;
    comingSoon: string;
  };
  table: {
    name: string;
    slug: string;
    status: string;
    usersCount: string;
    createdAt: string;
    actions: string;
    email: string;
    role: string;
    fullName: string;
    phone: string;
    temporaryPassword: string;
  };
  actions: {
    view: string;
    addCenter: string;
    addUser: string;
    addCenterManager: string;
    activate: string;
    loginAs: string;
    resetPassword: string;
    cancel: string;
    saveManager: string;
    suspend: string;
  };
  statuses: Record<string, string>;
};

export const adminCentersDictionaries: Record<
  SupportedLocale,
  AdminCentersDictionary
> = {
  en: {
    brand: {
      name: "RoyalCare",
      console: "Super Admin",
    },
    languages: {
      en: "English",
      ar: "Arabic",
      he: "Hebrew",
    },
    shell: {
      menu: "Menu",
      close: "Close",
    },
    nav: {
      dashboard: "Dashboard",
      centers: "Centers",
      subscriptions: "Subscriptions",
      domains: "Domains",
      plans: "Plans",
      users: "Users",
      notifications: "Notifications",
      auditLogs: "Audit Logs",
      settings: "Settings",
    },
    header: {
      eyebrow: "Platform administration",
      title: "Centers Management",
      subtitle: "Monitor tenant centers, status, and assigned users.",
      language: "Language",
      account: "Platform Admin",
    },
    page: {
      listTitle: "Centers",
      listSubtitle: "All tenant centers visible to Super Admin only.",
      detailsTitle: "Center details",
      detailsSubtitle: "Center profile and users assigned to this tenant.",
      usersTitle: "Center users",
      usersSubtitle: "Users assigned inside this center.",
      back: "Back to centers",
      loading: "Loading centers...",
      empty: "No centers found.",
      emptyUsers: "No users are assigned to this center.",
      error: "Centers could not be loaded. Try again in a moment.",
      loginAsError: "Center admin login could not be started.",
      loginAsLoading: "Opening tenant dashboard...",
      noActiveManager:
        "No active center manager exists for this center. Please add or activate a manager.",
      managerAdded: "Center manager added successfully",
      managerCreateError: "Center manager could not be added. Review the fields and try again.",
      managerModalTitle: "Add Center Manager",
      managerModalSubtitle:
        "Create or assign an active center manager for this center.",
      updated: "Center status updated.",
      comingSoon: "Coming soon",
    },
    table: {
      name: "Name",
      slug: "Slug",
      status: "Status",
      usersCount: "Users",
      createdAt: "Created",
      actions: "Actions",
      email: "Email",
      role: "Role",
      fullName: "Name",
      phone: "Phone",
      temporaryPassword: "Temporary password",
    },
    actions: {
      view: "View",
      addCenter: "Add Center",
      addUser: "Add User to Center",
      addCenterManager: "Add Center Manager",
      activate: "Activate",
      loginAs: "Login as Center Admin",
      resetPassword: "Reset Center Manager Password",
      cancel: "Cancel",
      saveManager: "Save manager",
      suspend: "Suspend",
    },
    statuses: {
      ACTIVE: "Active",
      ARCHIVED: "Archived",
      CANCELLED: "Cancelled",
      PAST_DUE: "Past due",
      SUSPENDED: "Suspended",
      TRIAL: "Trial",
    },
  },
  ar: {
    brand: {
      name: "RoyalCare",
      console: "إدارة المنصة",
    },
    languages: {
      en: "الإنجليزية",
      ar: "العربية",
      he: "العبرية",
    },
    shell: {
      menu: "القائمة",
      close: "إغلاق",
    },
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
      eyebrow: "إدارة المنصة",
      title: "إدارة المراكز",
      subtitle: "متابعة مراكز العملاء والحالة والمستخدمين المرتبطين بها.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    page: {
      listTitle: "المراكز",
      listSubtitle: "كل مراكز العملاء المتاحة لمدير المنصة فقط.",
      detailsTitle: "تفاصيل المركز",
      detailsSubtitle: "ملف المركز والمستخدمون المرتبطون بهذا المستأجر.",
      usersTitle: "مستخدمو المركز",
      usersSubtitle: "المستخدمون المعينون داخل هذا المركز.",
      back: "العودة إلى المراكز",
      loading: "جاري تحميل المراكز...",
      empty: "لا توجد مراكز.",
      emptyUsers: "لا يوجد مستخدمون مرتبطون بهذا المركز.",
      error: "تعذر تحميل المراكز. حاول مرة أخرى بعد قليل.",
      loginAsError: "تعذر بدء الدخول كمدير المركز.",
      loginAsLoading: "جاري فتح لوحة تحكم المركز...",
      noActiveManager:
        "لا يوجد مدير نشط لهذا المركز. يرجى إضافة مدير أو تفعيل مدير موجود.",
      managerAdded: "تم إضافة مدير المركز بنجاح",
      managerCreateError: "تعذر إضافة مدير المركز. راجع الحقول ثم حاول مرة أخرى.",
      managerModalTitle: "إضافة مدير مركز",
      managerModalSubtitle:
        "أنشئ أو عيّن مدير مركز نشط لهذا المركز.",
      updated: "تم تحديث حالة المركز.",
      comingSoon: "قريبًا",
    },
    table: {
      name: "الاسم",
      slug: "المعرف",
      status: "الحالة",
      usersCount: "المستخدمون",
      createdAt: "تاريخ الإنشاء",
      actions: "الإجراءات",
      email: "البريد الإلكتروني",
      role: "الدور",
      fullName: "الاسم",
      phone: "الهاتف",
      temporaryPassword: "كلمة مرور مؤقتة",
    },
    actions: {
      view: "عرض",
      addCenter: "إضافة مركز",
      addUser: "إضافة مستخدم للمركز",
      addCenterManager: "إضافة مدير مركز",
      activate: "تفعيل",
      loginAs: "الدخول كمدير المركز",
      resetPassword: "إعادة تعيين كلمة مرور مدير المركز",
      cancel: "إلغاء",
      saveManager: "حفظ المدير",
      suspend: "تعليق",
    },
    statuses: {
      ACTIVE: "نشط",
      ARCHIVED: "مؤرشف",
      CANCELLED: "ملغي",
      PAST_DUE: "متأخر",
      SUSPENDED: "معلق",
      TRIAL: "تجريبي",
    },
  },
  he: {
    brand: {
      name: "RoyalCare",
      console: "ניהול פלטפורמה",
    },
    languages: {
      en: "אנגלית",
      ar: "ערבית",
      he: "עברית",
    },
    shell: {
      menu: "תפריט",
      close: "סגירה",
    },
    nav: {
      dashboard: "לוח בקרה",
      centers: "מרכזים",
      subscriptions: "מנויים",
      domains: "דומיינים",
      plans: "תוכניות",
      users: "משתמשים",
      notifications: "התראות",
      auditLogs: "יומן ביקורת",
      settings: "הגדרות",
    },
    header: {
      eyebrow: "ניהול פלטפורמה",
      title: "ניהול מרכזים",
      subtitle: "מעקב אחר מרכזים, סטטוס ומשתמשים משויכים.",
      language: "שפה",
      account: "מנהל פלטפורמה",
    },
    page: {
      listTitle: "מרכזים",
      listSubtitle: "כל מרכזי הלקוחות הזמינים למנהל פלטפורמה בלבד.",
      detailsTitle: "פרטי מרכז",
      detailsSubtitle: "פרופיל המרכז והמשתמשים המשויכים אליו.",
      usersTitle: "משתמשי המרכז",
      usersSubtitle: "משתמשים המשויכים למרכז זה.",
      back: "חזרה למרכזים",
      loading: "טוען מרכזים...",
      empty: "לא נמצאו מרכזים.",
      emptyUsers: "אין משתמשים המשויכים למרכז זה.",
      error: "לא ניתן לטעון מרכזים כרגע. נסה שוב בעוד רגע.",
      loginAsError: "לא ניתן להתחיל כניסה כמנהל מרכז.",
      loginAsLoading: "פותח את לוח הבקרה של המרכז...",
      noActiveManager:
        "לא קיים מנהל פעיל למרכז זה. יש להוסיף או להפעיל מנהל.",
      managerAdded: "מנהל המרכז נוסף בהצלחה",
      managerCreateError: "לא ניתן להוסיף מנהל מרכז. בדקו את השדות ונסו שוב.",
      managerModalTitle: "הוספת מנהל מרכז",
      managerModalSubtitle:
        "יצירה או שיוך של מנהל מרכז פעיל למרכז זה.",
      updated: "סטטוס המרכז עודכן.",
      comingSoon: "בקרוב",
    },
    table: {
      name: "שם",
      slug: "מזהה",
      status: "סטטוס",
      usersCount: "משתמשים",
      createdAt: "נוצר",
      actions: "פעולות",
      email: "אימייל",
      role: "תפקיד",
      fullName: "שם",
      phone: "טלפון",
      temporaryPassword: "סיסמה זמנית",
    },
    actions: {
      view: "צפייה",
      addCenter: "הוספת מרכז",
      addUser: "הוספת משתמש למרכז",
      addCenterManager: "הוספת מנהל מרכז",
      activate: "הפעלה",
      loginAs: "כניסה כמנהל מרכז",
      resetPassword: "איפוס סיסמת מנהל מרכז",
      cancel: "ביטול",
      saveManager: "שמירת מנהל",
      suspend: "השהיה",
    },
    statuses: {
      ACTIVE: "פעיל",
      ARCHIVED: "בארכיון",
      CANCELLED: "מבוטל",
      PAST_DUE: "באיחור",
      SUSPENDED: "מושהה",
      TRIAL: "ניסיון",
    },
  },
};
