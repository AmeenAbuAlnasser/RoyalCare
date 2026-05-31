import type { SupportedLocale } from "../locales";

type CentersDictionary = {
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
  actions: {
    addNewCenter: string;
    view: string;
    edit: string;
    suspend: string;
    renewSubscription: string;
    delete: string;
  };
  filters: {
    active: string;
    trial: string;
    expired: string;
    suspended: string;
    needsSubscriptionReview: string;
  };
  search: {
    label: string;
    placeholder: string;
  };
  states: {
    actionPrepared: string;
    clearFilter: string;
    emptyDescription: string;
    emptyTitle: string;
    errorDescription: string;
    errorTitle: string;
    filterNoAppointments: string;
    filterNeedsSubscriptionReview: string;
    filterNeedsSubscriptionReviewEmpty: string;
    highlightCenter: string;
    loading: string;
    noResultsDescription: string;
    noResultsTitle: string;
  };
  stats: {
    totalCenters: string;
    activeCenters: string;
    trialCenters: string;
    suspendedCenters: string;
  };
  table: {
    centerName: string;
    ownerName: string;
    centerType: string;
    subscriptionPlan: string;
    subscriptionExpiryDate: string;
    domain: string;
    status: string;
    reviewReason: string;
    actions: string;
  };
  reviewReasons: {
    noSubscription: string;
    subscriptionExpired: string;
    subscriptionExpiredDaysAgo: string;
    subscriptionGracePeriod: string;
    subscriptionSuspended: string;
    subscriptionCancelled: string;
  };
  banner: {
    centersNeedReview: string;
    expiredSubscriptions: string;
    gracePeriod: string;
    noSubscription: string;
    suspendedSubscription: string;
    cancelledSubscription: string;
  };
  statuses: {
    active: string;
    trial: string;
    expired: string;
    suspended: string;
  };
  types: {
    laser: string;
    physiotherapy: string;
    hijama: string;
    beauty: string;
    wellness: string;
    multiSpecialty: string;
  };
  plans: {
    basic: string;
    trial: string;
    standard: string;
    starter: string;
    premium: string;
    professional: string;
    enterprise: string;
  };
  centers: {
    novaLaser: string;
    alNoorHijama: string;
    balancePhysio: string;
    glowBeauty: string;
    wellnessHouse: string;
  };
  owners: {
    mayaCohen: string;
    omarHaddad: string;
    danaLevi: string;
    linaMansour: string;
    noamBar: string;
  };
};

export const superAdminCentersDictionaries: Record<
  SupportedLocale,
  CentersDictionary
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
      eyebrow: "Tenant administration",
      title: "Centers Management",
      subtitle: "Review centers, subscriptions, domains, and tenant status.",
      language: "Language",
      account: "Platform Admin",
    },
    actions: {
      addNewCenter: "Add New Center",
      view: "View",
      edit: "Edit",
      suspend: "Suspend",
      renewSubscription: "Renew Subscription",
      delete: "Delete",
    },
    filters: {
      active: "Active",
      trial: "Trial",
      expired: "Expired",
      suspended: "Suspended",
      needsSubscriptionReview: "Needs Review",
    },
    search: {
      label: "Search",
      placeholder: "Search by center, owner, domain, or type",
    },
    states: {
      actionPrepared:
        "This action is ready for confirmation once live actions are enabled.",
      clearFilter: "Clear filter",
      emptyDescription: "Create your first center to see it here.",
      emptyTitle: "No centers found",
      errorDescription:
        "Centers could not be loaded right now. Try again in a moment.",
      errorTitle: "Centers could not be loaded",
      filterNoAppointments: "Centers with no recent appointments",
      filterNeedsSubscriptionReview: "Needs Review",
      filterNeedsSubscriptionReviewEmpty:
        "No centers require subscription attention right now.",
      highlightCenter: "Viewing specific center",
      loading: "Loading centers...",
      noResultsDescription: "Try changing the search text or status filter.",
      noResultsTitle: "No matching centers",
    },
    stats: {
      totalCenters: "Total centers",
      activeCenters: "Active centers",
      trialCenters: "Trial centers",
      suspendedCenters: "Suspended centers",
    },
    table: {
      centerName: "Center Name",
      ownerName: "Owner Name",
      centerType: "Center Type",
      subscriptionPlan: "Subscription Plan",
      subscriptionExpiryDate: "Subscription Expiry Date",
      domain: "Domain",
      status: "Status",
      reviewReason: "Review Reason",
      actions: "Actions",
    },
    reviewReasons: {
      noSubscription: "No subscription",
      subscriptionExpired: "Subscription expired",
      subscriptionExpiredDaysAgo: "day|days",
      subscriptionGracePeriod: "Grace period",
      subscriptionSuspended: "Subscription suspended",
      subscriptionCancelled: "Subscription cancelled",
    },
    banner: {
      centersNeedReview: "centers need review",
      expiredSubscriptions: "expired subscriptions",
      gracePeriod: "in grace period",
      noSubscription: "centers with no subscription",
      suspendedSubscription: "subscription suspended",
      cancelledSubscription: "subscription cancelled",
    },
    statuses: {
      active: "Active",
      trial: "Trial",
      expired: "Expired",
      suspended: "Suspended",
    },
    types: {
      laser: "Laser",
      physiotherapy: "Physiotherapy",
      hijama: "Hijama",
      beauty: "Beauty",
      wellness: "Wellness",
      multiSpecialty: "Multi-specialty",
    },
    plans: {
      basic: "Basic",
      trial: "Trial",
      standard: "Standard",
      starter: "Starter",
      premium: "Premium",
      professional: "Professional",
      enterprise: "Enterprise",
    },
    centers: {
      novaLaser: "Nova Laser Center",
      alNoorHijama: "Al Noor Hijama",
      balancePhysio: "Balance Physio",
      glowBeauty: "Glow Beauty Clinic",
      wellnessHouse: "Wellness House",
    },
    owners: {
      mayaCohen: "Maya Cohen",
      omarHaddad: "Omar Haddad",
      danaLevi: "Dana Levi",
      linaMansour: "Lina Mansour",
      noamBar: "Noam Bar",
    },
  },
  ar: {
    brand: {
      name: "رويال كير",
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
      eyebrow: "إدارة المستأجرين",
      title: "إدارة المراكز",
      subtitle: "مراجعة المراكز والاشتراكات والنطاقات وحالة كل مركز.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    actions: {
      addNewCenter: "إضافة مركز جديد",
      view: "عرض",
      edit: "تعديل",
      suspend: "إيقاف",
      renewSubscription: "تجديد الاشتراك",
      delete: "حذف",
    },
    filters: {
      active: "نشط",
      trial: "تجربة",
      expired: "منتهي",
      suspended: "موقوف",
      needsSubscriptionReview: "تحتاج متابعة",
    },
    search: {
      label: "بحث",
      placeholder: "ابحث حسب المركز أو المالك أو النطاق أو النوع",
    },
    states: {
      actionPrepared: "هذا الإجراء جاهز للتأكيد عند تفعيل الإجراءات المباشرة.",
      clearFilter: "إزالة الفلتر",
      emptyDescription: "أنشئ المركز الأول ليظهر هنا.",
      emptyTitle: "لا توجد مراكز",
      errorDescription: "تعذر تحميل المراكز الآن. حاول مرة أخرى بعد قليل.",
      errorTitle: "تعذر تحميل المراكز",
      filterNoAppointments: "مراكز بدون مواعيد حديثة",
      filterNeedsSubscriptionReview: "تحتاج متابعة",
      filterNeedsSubscriptionReviewEmpty: "لا توجد مراكز تحتاج متابعة حالياً.",
      highlightCenter: "عرض مركز محدد",
      loading: "جار تحميل المراكز...",
      noResultsDescription: "جرّب تغيير نص البحث أو فلتر الحالة.",
      noResultsTitle: "لا توجد مراكز مطابقة",
    },
    stats: {
      totalCenters: "إجمالي المراكز",
      activeCenters: "المراكز النشطة",
      trialCenters: "مراكز التجربة",
      suspendedCenters: "المراكز الموقوفة",
    },
    table: {
      centerName: "اسم المركز",
      ownerName: "اسم المالك",
      centerType: "نوع المركز",
      subscriptionPlan: "باقة الاشتراك",
      subscriptionExpiryDate: "تاريخ انتهاء الاشتراك",
      domain: "النطاق",
      status: "الحالة",
      reviewReason: "سبب المتابعة",
      actions: "الإجراءات",
    },
    reviewReasons: {
      noSubscription: "لا يوجد اشتراك",
      subscriptionExpired: "الاشتراك منتهي",
      subscriptionExpiredDaysAgo: "يوم|أيام",
      subscriptionGracePeriod: "فترة السماح",
      subscriptionSuspended: "الاشتراك موقوف",
      subscriptionCancelled: "الاشتراك ملغي",
    },
    banner: {
      centersNeedReview: "مراكز تحتاج متابعة",
      expiredSubscriptions: "اشتراكات منتهية",
      gracePeriod: "في فترة السماح",
      noSubscription: "مراكز بدون اشتراك",
      suspendedSubscription: "اشتراك موقوف",
      cancelledSubscription: "اشتراك ملغي",
    },
    statuses: {
      active: "نشط",
      trial: "تجربة",
      expired: "منتهي",
      suspended: "موقوف",
    },
    types: {
      laser: "ليزر",
      physiotherapy: "علاج طبيعي",
      hijama: "حجامة",
      beauty: "تجميل",
      wellness: "عافية",
      multiSpecialty: "متعدد التخصصات",
    },
    plans: {
      basic: "أساسي",
      trial: "تجربة",
      standard: "قياسي",
      starter: "البداية",
      premium: "مميز",
      professional: "الاحترافية",
      enterprise: "المؤسسات",
    },
    centers: {
      novaLaser: "مركز نوفا ليزر",
      alNoorHijama: "مركز النور للحجامة",
      balancePhysio: "بالانس فيزيو",
      glowBeauty: "عيادة جلو للتجميل",
      wellnessHouse: "بيت العافية",
    },
    owners: {
      mayaCohen: "مايا كوهين",
      omarHaddad: "عمر حداد",
      danaLevi: "دانا ليفي",
      linaMansour: "لينا منصور",
      noamBar: "نوعام بار",
    },
  },
  he: {
    brand: {
      name: "רויאל קייר",
      console: "ניהול מערכת",
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
      subscriptions: "מינויים",
      domains: "דומיינים",
      plans: "תוכניות",
      users: "משתמשים",
      notifications: "התראות",
      auditLogs: "יומן ביקורת",
      settings: "הגדרות",
    },
    header: {
      eyebrow: "ניהול דיירים",
      title: "ניהול מרכזים",
      subtitle: "בדיקת מרכזים, מינויים, דומיינים וסטטוס דיירים.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    actions: {
      addNewCenter: "הוסף מרכז חדש",
      view: "צפייה",
      edit: "עריכה",
      suspend: "השהיה",
      renewSubscription: "חידוש מינוי",
      delete: "מחיקה",
    },
    filters: {
      active: "פעיל",
      trial: "ניסיון",
      expired: "פג תוקף",
      suspended: "מושהה",
      needsSubscriptionReview: "דורשים מעקב",
    },
    search: {
      label: "חיפוש",
      placeholder: "חיפוש לפי מרכז, בעלים, דומיין או סוג",
    },
    states: {
      actionPrepared: "הפעולה הזו מוכנה לאישור לאחר הפעלת הפעולות החיות.",
      clearFilter: "הסר סינון",
      emptyDescription: "צרו את המרכז הראשון כדי לראות אותו כאן.",
      emptyTitle: "לא נמצאו מרכזים",
      errorDescription: "לא ניתן לטעון מרכזים כרגע. נסו שוב בעוד רגע.",
      errorTitle: "לא ניתן לטעון מרכזים",
      filterNoAppointments: "מרכזים ללא תורים אחרונים",
      filterNeedsSubscriptionReview: "דורשים מעקב",
      filterNeedsSubscriptionReviewEmpty: "אין מרכזים הדורשים בדיקת מינוי כרגע.",
      highlightCenter: "צפייה במרכז ספציפי",
      loading: "טוען מרכזים...",
      noResultsDescription: "נסו לשנות את החיפוש או את מסנן הסטטוס.",
      noResultsTitle: "אין מרכזים תואמים",
    },
    stats: {
      totalCenters: "כל המרכזים",
      activeCenters: "מרכזים פעילים",
      trialCenters: "מרכזי ניסיון",
      suspendedCenters: "מרכזים מושהים",
    },
    table: {
      centerName: "שם המרכז",
      ownerName: "שם בעלים",
      centerType: "סוג מרכז",
      subscriptionPlan: "תוכנית מינוי",
      subscriptionExpiryDate: "תאריך סיום מינוי",
      domain: "דומיין",
      status: "סטטוס",
      reviewReason: "סיבת הבדיקה",
      actions: "פעולות",
    },
    reviewReasons: {
      noSubscription: "אין מינוי",
      subscriptionExpired: "המינוי פג",
      subscriptionExpiredDaysAgo: "יום|ימים",
      subscriptionGracePeriod: "תקופת חסד",
      subscriptionSuspended: "המינוי מושהה",
      subscriptionCancelled: "המינוי בוטל",
    },
    banner: {
      centersNeedReview: "מרכזים דורשים בדיקה",
      expiredSubscriptions: "מינויים שפגו",
      gracePeriod: "בתקופת חסד",
      noSubscription: "מרכזים ללא מינוי",
      suspendedSubscription: "מינוי מושהה",
      cancelledSubscription: "מינוי בוטל",
    },
    statuses: {
      active: "פעיל",
      trial: "ניסיון",
      expired: "פג תוקף",
      suspended: "מושהה",
    },
    types: {
      laser: "לייזר",
      physiotherapy: "פיזיותרפיה",
      hijama: "חיג'אמה",
      beauty: "יופי",
      wellness: "בריאות",
      multiSpecialty: "רב-תחומי",
    },
    plans: {
      basic: "בסיסי",
      trial: "ניסיון",
      standard: "סטנדרטי",
      starter: "מתחילים",
      premium: "פרימיום",
      professional: "מקצועי",
      enterprise: "ארגוני",
    },
    centers: {
      novaLaser: "מרכז נובה לייזר",
      alNoorHijama: "מרכז אל נור לחיג'אמה",
      balancePhysio: "באלאנס פיזיו",
      glowBeauty: "קליניקת גלו ביוטי",
      wellnessHouse: "בית הבריאות",
    },
    owners: {
      mayaCohen: "מאיה כהן",
      omarHaddad: "עומר חדאד",
      danaLevi: "דנה לוי",
      linaMansour: "לינה מנסור",
      noamBar: "נועם בר",
    },
  },
};
