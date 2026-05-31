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
    searchFilters: string;
    notificationsList: string;
    templatesPreview: string;
  };
  stats: {
    totalNotifications: string;
    pending: string;
    sent: string;
    failed: string;
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
    statusAll: string;
    statusPending: string;
    statusSent: string;
    statusFailed: string;
    renewalRequests: string;
    systemAlerts: string;
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
    sendWhatsApp: string;
    openSubscription: string;
    markAsHandled: string;
    markAllAsRead: string;
  };
  whatsapp: {
    modalTitle: string;
    phoneLabel: string;
    messageLabel: string;
    copyButton: string;
    copiedHint: string;
    logged: string;
    openButton970: string;
    openButton972: string;
    tryBothHint: string;
    noPhone: string;
    cancel: string;
    renewalRequestMessage: (centerName: string) => string;
  };
  types: {
    system: string;
    subscription: string;
    domain: string;
    payment: string;
    support: string;
    SUBSCRIPTION_EXPIRING: string;
    SUBSCRIPTION_EXPIRED: string;
    SUBSCRIPTION_RENEWAL_REQUEST: string;
    SUBSCRIPTION_SUSPENDED: string;
    SUBSCRIPTION_RENEWED: string;
    TRIAL_ENDING_SOON: string;
    MISSING_WHATSAPP_PHONE: string;
  };
  priorities: {
    critical: string;
    high: string;
    normal: string;
  };
  statuses: {
    read: string;
    unread: string;
    PENDING: string;
    SENT: string;
    FAILED: string;
    CANCELLED: string;
  };
  channels: {
    IN_APP: string;
    EMAIL: string;
    SMS: string;
    WHATSAPP: string;
  };
  empty: {
    noNotifications: string;
    noNotificationsHint: string;
    markAllReadFailed: string;
  };
  loading: string;
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
  whatsappAttempts: {
    attempts: string;
    copied: string;
    lastAttempt: string;
    opened: string;
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
      auditLogs: "Audit Logs",
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
      pending: "Unread",
      sent: "Sent",
      failed: "Failed",
      sentToday: "Sent Today",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by center name",
      all: "All",
      unread: "Unread",
      critical: "Critical",
      system: "System",
      subscription: "Subscription",
      domain: "Domain",
      payment: "Payment",
      support: "Support",
      statusAll: "All Statuses",
      statusPending: "Pending",
      statusSent: "Sent",
      statusFailed: "Failed",
      renewalRequests: "Renewal Requests",
      systemAlerts: "System Alerts",
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
      sendWhatsApp: "Send WhatsApp",
      openSubscription: "Open Subscription",
      markAsHandled: "Mark as Handled",
      markAllAsRead: "Mark All as Read",
    },
    whatsapp: {
      modalTitle: "Send via WhatsApp",
      phoneLabel: "Phone Number",
      messageLabel: "Message (editable)",
      copyButton: "Copy Message",
      copiedHint: "Copied!",
      logged: "Logged ✓",
      openButton970: "Open WhatsApp +970",
      openButton972: "Open WhatsApp +972",
      tryBothHint: "Try +970 first; if the number doesn't open, try +972.",
      noPhone: "No WhatsApp number for this center. Add a number to the center or set a support number in Settings.",
      cancel: "Cancel",
      renewalRequestMessage: (centerName: string) =>
        `Hello ${centerName}, we have received your RoyalCare subscription renewal request and will follow up with you to complete the renewal.`,
    },
    types: {
      system: "System",
      subscription: "Subscription",
      domain: "Domain",
      payment: "Payment",
      support: "Support",
      SUBSCRIPTION_EXPIRING: "Expiring Soon",
      SUBSCRIPTION_EXPIRED: "Expired",
      SUBSCRIPTION_RENEWAL_REQUEST: "Renewal Request",
      SUBSCRIPTION_SUSPENDED: "Suspended",
      SUBSCRIPTION_RENEWED: "Renewed",
      TRIAL_ENDING_SOON: "Trial Ending Soon",
      MISSING_WHATSAPP_PHONE: "Missing WhatsApp Phone",
    },
    priorities: {
      critical: "Critical",
      high: "High",
      normal: "Normal",
    },
    statuses: {
      read: "Read",
      unread: "Unread",
      PENDING: "Pending",
      SENT: "Sent",
      FAILED: "Failed",
      CANCELLED: "Cancelled",
    },
    channels: {
      IN_APP: "In-App",
      EMAIL: "Email",
      SMS: "SMS",
      WHATSAPP: "WhatsApp",
    },
    empty: {
      noNotifications: "No notifications found",
      noNotificationsHint: "Subscription lifecycle notifications will appear here automatically.",
      markAllReadFailed: "Notifications could not be marked as read. Please try again.",
    },
    loading: "Loading notifications…",
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
    whatsappAttempts: {
      attempts: "attempts",
      copied: "copied",
      lastAttempt: "Last attempt",
      opened: "opened",
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
      pending: "غير مقروء",
      sent: "مرسل",
      failed: "فشل",
      sentToday: "أرسلت اليوم",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث باسم المركز",
      all: "الكل",
      unread: "غير مقروء",
      critical: "حرج",
      system: "النظام",
      subscription: "الاشتراك",
      domain: "النطاق",
      payment: "الدفع",
      support: "الدعم",
      statusAll: "كل الحالات",
      statusPending: "معلق",
      statusSent: "مرسل",
      statusFailed: "فشل",
      renewalRequests: "طلبات التجديد",
      systemAlerts: "تنبيهات النظام",
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
      sendWhatsApp: "إرسال واتساب",
      openSubscription: "فتح الاشتراك",
      markAsHandled: "تحديد كمعالج",
      markAllAsRead: "تحديد الكل كمقروء",
    },
    whatsapp: {
      modalTitle: "إرسال عبر واتساب",
      phoneLabel: "رقم الهاتف",
      messageLabel: "الرسالة (قابلة للتعديل)",
      copyButton: "نسخ الرسالة",
      copiedHint: "تم النسخ!",
      logged: "تم تسجيل محاولة واتساب ✓",
      openButton970: "فتح واتساب +970",
      openButton972: "فتح واتساب +972",
      tryBothHint: "جرّب +970 أولاً؛ إذا لم يفتح الرقم، جرّب +972.",
      noPhone: "لا يوجد رقم واتساب. أضف رقم للمركز أو رقم دعم من الإعدادات.",
      cancel: "إلغاء",
      renewalRequestMessage: (centerName: string) =>
        `مرحباً ${centerName}، وصلنا طلب تجديد اشتراككم في RoyalCare وسنتابع معكم لإتمام التجديد.`,
    },
    types: {
      system: "النظام",
      subscription: "الاشتراك",
      domain: "النطاق",
      payment: "الدفع",
      support: "الدعم",
      SUBSCRIPTION_EXPIRING: "ينتهي قريباً",
      SUBSCRIPTION_EXPIRED: "منتهي",
      SUBSCRIPTION_RENEWAL_REQUEST: "طلب تجديد",
      SUBSCRIPTION_SUSPENDED: "موقوف",
      SUBSCRIPTION_RENEWED: "تم التجديد",
      TRIAL_ENDING_SOON: "الفترة التجريبية تنتهي قريباً",
      MISSING_WHATSAPP_PHONE: "رقم واتساب غير متوفر",
    },
    priorities: {
      critical: "حرج",
      high: "مرتفع",
      normal: "عادي",
    },
    statuses: {
      read: "مقروء",
      unread: "غير مقروء",
      PENDING: "معلق",
      SENT: "مرسل",
      FAILED: "فشل",
      CANCELLED: "ملغي",
    },
    channels: {
      IN_APP: "داخل التطبيق",
      EMAIL: "البريد الإلكتروني",
      SMS: "رسالة نصية",
      WHATSAPP: "واتساب",
    },
    empty: {
      noNotifications: "لا توجد إشعارات",
      noNotificationsHint: "ستظهر هنا إشعارات دورة حياة الاشتراك تلقائياً.",
      markAllReadFailed: "تعذر تحديد الإشعارات كمقروءة. يرجى المحاولة مرة أخرى.",
    },
    loading: "جارٍ تحميل الإشعارات…",
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
    whatsappAttempts: {
      attempts: "محاولات",
      copied: "نسخ",
      lastAttempt: "آخر محاولة",
      opened: "فتح",
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
      pending: "לא נקרא",
      sent: "נשלח",
      failed: "נכשל",
      sentToday: "נשלחו היום",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי שם מרכז",
      all: "הכל",
      unread: "לא נקרא",
      critical: "קריטי",
      system: "מערכת",
      subscription: "מינוי",
      domain: "דומיין",
      payment: "תשלום",
      support: "תמיכה",
      statusAll: "כל הסטטוסים",
      statusPending: "ממתין",
      statusSent: "נשלח",
      statusFailed: "נכשל",
      renewalRequests: "בקשות חידוש",
      systemAlerts: "התראות מערכת",
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
      sendWhatsApp: "שליחת וואטסאפ",
      openSubscription: "פתיחת מינוי",
      markAsHandled: "סימון כטופל",
      markAllAsRead: "סמן הכל כנקרא",
    },
    whatsapp: {
      modalTitle: "שלח דרך וואטסאפ",
      phoneLabel: "מספר טלפון",
      messageLabel: "הודעה (ניתנת לעריכה)",
      copyButton: "העתק הודעה",
      copiedHint: "הועתק!",
      logged: "נרשם ✓",
      openButton970: "פתח וואטסאפ +970",
      openButton972: "פתח וואטסאפ +972",
      tryBothHint: "נסה +970 תחילה; אם המספר לא נפתח, נסה +972.",
      noPhone: "אין מספר WhatsApp. הוסף מספר למרכז או הגדר מספר תמיכה בהגדרות.",
      cancel: "ביטול",
      renewalRequestMessage: (centerName: string) =>
        `שלום ${centerName}, קיבלנו את בקשת חידוש המינוי שלכם ב-RoyalCare ונעקוב אחריכם להשלמת החידוש.`,
    },
    types: {
      system: "מערכת",
      subscription: "מינוי",
      domain: "דומיין",
      payment: "תשלום",
      support: "תמיכה",
      SUBSCRIPTION_EXPIRING: "עומד לפוג",
      SUBSCRIPTION_EXPIRED: "פג תוקף",
      SUBSCRIPTION_RENEWAL_REQUEST: "בקשת חידוש",
      SUBSCRIPTION_SUSPENDED: "מושעה",
      SUBSCRIPTION_RENEWED: "חודש",
      TRIAL_ENDING_SOON: "תקופת הניסיון עומדת להסתיים",
      MISSING_WHATSAPP_PHONE: "חסר מספר WhatsApp",
    },
    priorities: {
      critical: "קריטי",
      high: "גבוה",
      normal: "רגיל",
    },
    statuses: {
      read: "נקרא",
      unread: "לא נקרא",
      PENDING: "ממתין",
      SENT: "נשלח",
      FAILED: "נכשל",
      CANCELLED: "בוטל",
    },
    channels: {
      IN_APP: "באפליקציה",
      EMAIL: "אימייל",
      SMS: "SMS",
      WHATSAPP: "וואטסאפ",
    },
    empty: {
      noNotifications: "לא נמצאו התראות",
      noNotificationsHint: "התראות מחזור חיי המינוי יופיעו כאן באופן אוטומטי.",
      markAllReadFailed: "לא ניתן לסמן את ההתראות כנקראו. נסה שוב.",
    },
    loading: "טוען התראות…",
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
    whatsappAttempts: {
      attempts: "ניסיונות",
      copied: "הועתק",
      lastAttempt: "ניסיון אחרון",
      opened: "נפתח",
    },
  },
};
