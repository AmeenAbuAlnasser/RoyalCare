import type { SupportedLocale } from "../locales";

type NotificationsDictionary = {
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
    searchFilters: string;
    notificationsList: string;
    templatesPreview: string;
  };
  stats: {
    totalNotifications: string;
    unread: string;
    critical: string;
    sentToday: string;
  };
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    all: string;
    unread: string;
    critical: string;
    system: string;
    subscription: string;
    domain: string;
    payment: string;
    support: string;
  };
  table: {
    notification: string;
    type: string;
    priority: string;
    relatedCenter: string;
    createdDate: string;
    status: string;
    actions: string;
  };
  actions: {
    view: string;
    markAsRead: string;
    archive: string;
    delete: string;
  };
  types: {
    system: string;
    subscription: string;
    domain: string;
    payment: string;
    support: string;
  };
  priorities: {
    critical: string;
    high: string;
    normal: string;
  };
  statuses: {
    read: string;
    unread: string;
  };
  centers: {
    novaLaser: string;
    alNoorHijama: string;
    balancePhysio: string;
    glowBeauty: string;
    wellnessHouse: string;
  };
  notifications: Record<
    | "domainFailedMessage"
    | "domainFailedTitle"
    | "newCenterMessage"
    | "newCenterTitle"
    | "paymentFailedMessage"
    | "paymentFailedTitle"
    | "subscriptionExpiringMessage"
    | "subscriptionExpiringTitle"
    | "supportTicketMessage"
    | "supportTicketTitle",
    string
  >;
  templates: Record<
    | "domainVerificationFailed"
    | "newCenterCreated"
    | "paymentFailed"
    | "subscriptionExpiring",
    string
  >;
  values: {
    mobileHint: string;
    templatesHint: string;
  };
};

export const superAdminNotificationsDictionaries: Record<SupportedLocale, NotificationsDictionary> = {
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
      eyebrow: "Platform alerts",
      title: "Notifications Management",
      subtitle: "Monitor and manage RoyalCare system, subscription, domain, payment, and support notifications.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      searchFilters: "Search + Filters",
      notificationsList: "Notifications List",
      templatesPreview: "Notification Templates Preview",
    },
    stats: {
      totalNotifications: "Total Notifications",
      unread: "Unread",
      critical: "Critical",
      sentToday: "Sent Today",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by title, center, or message",
      all: "All",
      unread: "Unread",
      critical: "Critical",
      system: "System",
      subscription: "Subscription",
      domain: "Domain",
      payment: "Payment",
      support: "Support",
    },
    table: {
      notification: "Notification",
      type: "Type",
      priority: "Priority",
      relatedCenter: "Related Center",
      createdDate: "Created Date",
      status: "Status",
      actions: "Actions",
    },
    actions: {
      view: "View",
      markAsRead: "Mark as Read",
      archive: "Archive",
      delete: "Delete",
    },
    types: {
      system: "System",
      subscription: "Subscription",
      domain: "Domain",
      payment: "Payment",
      support: "Support",
    },
    priorities: {
      critical: "Critical",
      high: "High",
      normal: "Normal",
    },
    statuses: {
      read: "Read",
      unread: "Unread",
    },
    centers: {
      novaLaser: "Nova Laser Center",
      alNoorHijama: "Al Noor Hijama",
      balancePhysio: "Balance Physio",
      glowBeauty: "Glow Beauty Clinic",
      wellnessHouse: "Wellness House",
    },
    notifications: {
      domainFailedTitle: "Domain verification failed",
      domainFailedMessage: "DNS records do not match the required RoyalCare configuration.",
      paymentFailedTitle: "Payment failed",
      paymentFailedMessage: "The latest subscription renewal payment could not be processed.",
      subscriptionExpiringTitle: "Subscription expiring soon",
      subscriptionExpiringMessage: "The center subscription expires within the next 7 days.",
      newCenterTitle: "New center created",
      newCenterMessage: "A new center was created and is waiting for setup review.",
      supportTicketTitle: "Support ticket needs attention",
      supportTicketMessage: "A high-priority support ticket has been waiting for more than 24 hours.",
    },
    templates: {
      subscriptionExpiring: "Subscription expiring",
      domainVerificationFailed: "Domain verification failed",
      paymentFailed: "Payment failed",
      newCenterCreated: "New center created",
    },
    values: {
      mobileHint: "Mobile uses notification cards with the shared bottom-sheet action menu.",
      templatesHint: "Templates are UI-only previews until notification delivery settings are connected.",
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
      eyebrow: "تنبيهات المنصة",
      title: "إدارة الإشعارات",
      subtitle: "متابعة وإدارة إشعارات النظام والاشتراكات والنطاقات والمدفوعات والدعم في RoyalCare.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      searchFilters: "البحث والفلاتر",
      notificationsList: "قائمة الإشعارات",
      templatesPreview: "معاينة قوالب الإشعارات",
    },
    stats: {
      totalNotifications: "إجمالي الإشعارات",
      unread: "غير مقروءة",
      critical: "حرجة",
      sentToday: "أرسلت اليوم",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث حسب العنوان أو المركز أو الرسالة",
      all: "الكل",
      unread: "غير مقروء",
      critical: "حرج",
      system: "النظام",
      subscription: "الاشتراك",
      domain: "النطاق",
      payment: "الدفع",
      support: "الدعم",
    },
    table: {
      notification: "الإشعار",
      type: "النوع",
      priority: "الأولوية",
      relatedCenter: "المركز المرتبط",
      createdDate: "تاريخ الإنشاء",
      status: "الحالة",
      actions: "الإجراءات",
    },
    actions: {
      view: "عرض",
      markAsRead: "تحديد كمقروء",
      archive: "أرشفة",
      delete: "حذف",
    },
    types: {
      system: "النظام",
      subscription: "الاشتراك",
      domain: "النطاق",
      payment: "الدفع",
      support: "الدعم",
    },
    priorities: {
      critical: "حرج",
      high: "مرتفع",
      normal: "عادي",
    },
    statuses: {
      read: "مقروء",
      unread: "غير مقروء",
    },
    centers: {
      novaLaser: "مركز نوفا ليزر",
      alNoorHijama: "مركز النور للحجامة",
      balancePhysio: "بالانس فيزيو",
      glowBeauty: "عيادة جلو للتجميل",
      wellnessHouse: "بيت العافية",
    },
    notifications: {
      domainFailedTitle: "فشل التحقق من النطاق",
      domainFailedMessage: "سجلات DNS لا تطابق إعدادات RoyalCare المطلوبة.",
      paymentFailedTitle: "فشل الدفع",
      paymentFailedMessage: "تعذرت معالجة دفعة تجديد الاشتراك الأخيرة.",
      subscriptionExpiringTitle: "الاشتراك ينتهي قريباً",
      subscriptionExpiringMessage: "ينتهي اشتراك المركز خلال الأيام السبعة القادمة.",
      newCenterTitle: "تم إنشاء مركز جديد",
      newCenterMessage: "تم إنشاء مركز جديد وينتظر مراجعة الإعداد.",
      supportTicketTitle: "تذكرة دعم تحتاج متابعة",
      supportTicketMessage: "تذكرة دعم عالية الأولوية تنتظر منذ أكثر من 24 ساعة.",
    },
    templates: {
      subscriptionExpiring: "انتهاء الاشتراك",
      domainVerificationFailed: "فشل التحقق من النطاق",
      paymentFailed: "فشل الدفع",
      newCenterCreated: "إنشاء مركز جديد",
    },
    values: {
      mobileHint: "في الجوال تظهر الإشعارات كبطاقات مع قائمة إجراءات سفلية مشتركة.",
      templatesHint: "القوالب للمعاينة فقط إلى أن يتم ربط إعدادات إرسال الإشعارات.",
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
      eyebrow: "התראות מערכת",
      title: "ניהול התראות",
      subtitle: "מעקב וניהול התראות מערכת, מינויים, דומיינים, תשלומים ותמיכה ב-RoyalCare.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      searchFilters: "חיפוש וסינון",
      notificationsList: "רשימת התראות",
      templatesPreview: "תצוגת תבניות התראה",
    },
    stats: {
      totalNotifications: "סך התראות",
      unread: "לא נקראו",
      critical: "קריטיות",
      sentToday: "נשלחו היום",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי כותרת, מרכז או הודעה",
      all: "הכל",
      unread: "לא נקרא",
      critical: "קריטי",
      system: "מערכת",
      subscription: "מינוי",
      domain: "דומיין",
      payment: "תשלום",
      support: "תמיכה",
    },
    table: {
      notification: "התראה",
      type: "סוג",
      priority: "עדיפות",
      relatedCenter: "מרכז קשור",
      createdDate: "תאריך יצירה",
      status: "סטטוס",
      actions: "פעולות",
    },
    actions: {
      view: "צפייה",
      markAsRead: "סימון כנקרא",
      archive: "ארכוב",
      delete: "מחיקה",
    },
    types: {
      system: "מערכת",
      subscription: "מינוי",
      domain: "דומיין",
      payment: "תשלום",
      support: "תמיכה",
    },
    priorities: {
      critical: "קריטי",
      high: "גבוה",
      normal: "רגיל",
    },
    statuses: {
      read: "נקרא",
      unread: "לא נקרא",
    },
    centers: {
      novaLaser: "מרכז נובה לייזר",
      alNoorHijama: "מרכז אל נור לחיג'אמה",
      balancePhysio: "באלאנס פיזיו",
      glowBeauty: "קליניקת גלו ביוטי",
      wellnessHouse: "בית הבריאות",
    },
    notifications: {
      domainFailedTitle: "אימות הדומיין נכשל",
      domainFailedMessage: "רשומות DNS אינן תואמות את הגדרת RoyalCare הנדרשת.",
      paymentFailedTitle: "התשלום נכשל",
      paymentFailedMessage: "לא ניתן היה לעבד את תשלום חידוש המינוי האחרון.",
      subscriptionExpiringTitle: "המינוי עומד לפוג",
      subscriptionExpiringMessage: "מינוי המרכז יפוג בתוך 7 הימים הקרובים.",
      newCenterTitle: "מרכז חדש נוצר",
      newCenterMessage: "מרכז חדש נוצר וממתין לבדיקת הגדרה.",
      supportTicketTitle: "פניית תמיכה דורשת טיפול",
      supportTicketMessage: "פניית תמיכה בעדיפות גבוהה ממתינה יותר מ-24 שעות.",
    },
    templates: {
      subscriptionExpiring: "מינוי עומד לפוג",
      domainVerificationFailed: "אימות דומיין נכשל",
      paymentFailed: "תשלום נכשל",
      newCenterCreated: "מרכז חדש נוצר",
    },
    values: {
      mobileHint: "במובייל ההתראות מוצגות ככרטיסים עם תפריט פעולות תחתון משותף.",
      templatesHint: "התבניות הן תצוגה בלבד עד לחיבור הגדרות שליחת התראות.",
    },
  },
};
