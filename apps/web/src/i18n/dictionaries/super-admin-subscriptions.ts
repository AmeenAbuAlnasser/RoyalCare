import type { SupportedLocale } from "../locales";

type SuperAdminSubscriptionsDictionary = {
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
    table: string;
    mobileList: string;
    expiringSoon: string;
    revenueSnapshot: string;
  };
  stats: {
    activeSubscriptions: string;
    trialSubscriptions: string;
    expiringSoon: string;
    expiredSubscriptions: string;
    monthlyRevenue: string;
  };
  revenue: {
    mrr: string;
    arr: string;
    pendingPayments: string;
    failedRenewals: string;
  };
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    status: string;
    autoRenewal: string;
    planType: string;
    dateRange: string;
    all: string;
    on: string;
    off: string;
    days7: string;
    days14: string;
    days30: string;
  };
  table: {
    centerName: string;
    owner: string;
    subscriptionPlan: string;
    billingCycle: string;
    startDate: string;
    expiryDate: string;
    autoRenewal: string;
    paymentStatus: string;
    monthlyValue: string;
    status: string;
    actions: string;
  };
  actions: {
    view: string;
    edit: string;
    renew: string;
    upgradePlan: string;
    suspend: string;
    cancel: string;
    invoiceHistory: string;
  };
  statuses: {
    active: string;
    trial: string;
    expired: string;
    suspended: string;
  };
  plans: {
    trial: string;
    starter: string;
    professional: string;
    enterprise: string;
  };
  billingCycles: {
    monthly: string;
    yearly: string;
  };
  paymentStatuses: {
    paid: string;
    pending: string;
    failed: string;
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
  values: {
    enabled: string;
    disabled: string;
    expiringHint: string;
    mobileHint: string;
  };
};

export const superAdminSubscriptionsDictionaries: Record<
  SupportedLocale,
  SuperAdminSubscriptionsDictionary
> = {
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
      eyebrow: "Revenue operations",
      title: "Subscriptions Management",
      subtitle: "Manage center plans, renewals, payment status, and subscription risk.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      summary: "Subscription Summary",
      searchFilters: "Search + Filters",
      table: "Subscriptions Table",
      mobileList: "Subscriptions",
      expiringSoon: "Expiring Soon",
      revenueSnapshot: "Revenue Snapshot",
    },
    stats: {
      activeSubscriptions: "Total Active Subscriptions",
      trialSubscriptions: "Trial Subscriptions",
      expiringSoon: "Expiring Soon",
      expiredSubscriptions: "Expired Subscriptions",
      monthlyRevenue: "Monthly Revenue",
    },
    revenue: {
      mrr: "MRR",
      arr: "ARR",
      pendingPayments: "Pending Payments",
      failedRenewals: "Failed Renewals",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by center, owner, or domain",
      status: "Status",
      autoRenewal: "Auto Renewal",
      planType: "Plan Type",
      dateRange: "Date Range",
      all: "All",
      on: "ON",
      off: "OFF",
      days7: "Next 7 days",
      days14: "Next 14 days",
      days30: "Next 30 days",
    },
    table: {
      centerName: "Center Name",
      owner: "Owner",
      subscriptionPlan: "Subscription Plan",
      billingCycle: "Billing Cycle",
      startDate: "Start Date",
      expiryDate: "Expiry Date",
      autoRenewal: "Auto Renewal",
      paymentStatus: "Payment Status",
      monthlyValue: "Monthly Value",
      status: "Status",
      actions: "Actions",
    },
    actions: {
      view: "View",
      edit: "Edit",
      renew: "Renew",
      upgradePlan: "Upgrade Plan",
      suspend: "Suspend",
      cancel: "Cancel",
      invoiceHistory: "Invoice History",
    },
    statuses: {
      active: "Active",
      trial: "Trial",
      expired: "Expired",
      suspended: "Suspended",
    },
    plans: {
      trial: "Trial",
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    },
    billingCycles: {
      monthly: "Monthly",
      yearly: "Yearly",
    },
    paymentStatuses: {
      paid: "Paid",
      pending: "Pending",
      failed: "Failed",
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
    values: {
      enabled: "Enabled",
      disabled: "Disabled",
      expiringHint: "Highlighted subscriptions need renewal attention within 7, 14, or 30 days.",
      mobileHint: "Mobile uses cards with one Actions menu per subscription.",
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
      eyebrow: "إدارة الإيرادات",
      title: "إدارة الاشتراكات",
      subtitle: "إدارة باقات المراكز والتجديدات وحالة الدفع ومخاطر الاشتراك.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      summary: "ملخص الاشتراكات",
      searchFilters: "البحث والفلاتر",
      table: "جدول الاشتراكات",
      mobileList: "الاشتراكات",
      expiringSoon: "تنتهي قريبا",
      revenueSnapshot: "ملخص الإيرادات",
    },
    stats: {
      activeSubscriptions: "إجمالي الاشتراكات النشطة",
      trialSubscriptions: "اشتراكات التجربة",
      expiringSoon: "تنتهي قريبا",
      expiredSubscriptions: "الاشتراكات المنتهية",
      monthlyRevenue: "الإيراد الشهري",
    },
    revenue: {
      mrr: "الإيراد الشهري المتكرر",
      arr: "الإيراد السنوي المتكرر",
      pendingPayments: "مدفوعات معلقة",
      failedRenewals: "تجديدات فاشلة",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث حسب المركز أو المالك أو النطاق",
      status: "الحالة",
      autoRenewal: "التجديد التلقائي",
      planType: "نوع الباقة",
      dateRange: "نطاق التاريخ",
      all: "الكل",
      on: "مفعل",
      off: "غير مفعل",
      days7: "خلال 7 أيام",
      days14: "خلال 14 يوما",
      days30: "خلال 30 يوما",
    },
    table: {
      centerName: "اسم المركز",
      owner: "المالك",
      subscriptionPlan: "باقة الاشتراك",
      billingCycle: "دورة الفوترة",
      startDate: "تاريخ البداية",
      expiryDate: "تاريخ الانتهاء",
      autoRenewal: "التجديد التلقائي",
      paymentStatus: "حالة الدفع",
      monthlyValue: "القيمة الشهرية",
      status: "الحالة",
      actions: "الإجراءات",
    },
    actions: {
      view: "عرض",
      edit: "تعديل",
      renew: "تجديد",
      upgradePlan: "ترقية الباقة",
      suspend: "إيقاف",
      cancel: "إلغاء",
      invoiceHistory: "سجل الفواتير",
    },
    statuses: {
      active: "نشط",
      trial: "تجربة",
      expired: "منتهي",
      suspended: "موقوف",
    },
    plans: {
      trial: "تجربة",
      starter: "البداية",
      professional: "الاحترافية",
      enterprise: "المؤسسات",
    },
    billingCycles: {
      monthly: "شهري",
      yearly: "سنوي",
    },
    paymentStatuses: {
      paid: "مدفوع",
      pending: "معلق",
      failed: "فشل",
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
    values: {
      enabled: "مفعل",
      disabled: "غير مفعل",
      expiringHint: "الاشتراكات المميزة تحتاج متابعة تجديد خلال 7 أو 14 أو 30 يوما.",
      mobileHint: "في الجوال تظهر الاشتراكات كبطاقات مع قائمة إجراءات واحدة لكل اشتراك.",
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
      eyebrow: "ניהול הכנסות",
      title: "ניהול מינויים",
      subtitle: "ניהול תוכניות מרכזים, חידושים, סטטוס תשלום וסיכוני מינוי.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      summary: "סיכום מינויים",
      searchFilters: "חיפוש וסינון",
      table: "טבלת מינויים",
      mobileList: "מינויים",
      expiringSoon: "מסתיימים בקרוב",
      revenueSnapshot: "תמונת הכנסות",
    },
    stats: {
      activeSubscriptions: "סך מינויים פעילים",
      trialSubscriptions: "מינויי ניסיון",
      expiringSoon: "מסתיימים בקרוב",
      expiredSubscriptions: "מינויים שפג תוקפם",
      monthlyRevenue: "הכנסה חודשית",
    },
    revenue: {
      mrr: "MRR",
      arr: "ARR",
      pendingPayments: "תשלומים ממתינים",
      failedRenewals: "חידושים שנכשלו",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי מרכז, בעלים או דומיין",
      status: "סטטוס",
      autoRenewal: "חידוש אוטומטי",
      planType: "סוג תוכנית",
      dateRange: "טווח תאריכים",
      all: "הכל",
      on: "פעיל",
      off: "כבוי",
      days7: "7 ימים הקרובים",
      days14: "14 ימים הקרובים",
      days30: "30 ימים הקרובים",
    },
    table: {
      centerName: "שם המרכז",
      owner: "בעלים",
      subscriptionPlan: "תוכנית מינוי",
      billingCycle: "מחזור חיוב",
      startDate: "תאריך התחלה",
      expiryDate: "תאריך סיום",
      autoRenewal: "חידוש אוטומטי",
      paymentStatus: "סטטוס תשלום",
      monthlyValue: "ערך חודשי",
      status: "סטטוס",
      actions: "פעולות",
    },
    actions: {
      view: "צפייה",
      edit: "עריכה",
      renew: "חידוש",
      upgradePlan: "שדרוג תוכנית",
      suspend: "השהיה",
      cancel: "ביטול",
      invoiceHistory: "היסטוריית חשבוניות",
    },
    statuses: {
      active: "פעיל",
      trial: "ניסיון",
      expired: "פג תוקף",
      suspended: "מושהה",
    },
    plans: {
      trial: "ניסיון",
      starter: "מתחילים",
      professional: "מקצועי",
      enterprise: "ארגוני",
    },
    billingCycles: {
      monthly: "חודשי",
      yearly: "שנתי",
    },
    paymentStatuses: {
      paid: "שולם",
      pending: "ממתין",
      failed: "נכשל",
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
    values: {
      enabled: "פעיל",
      disabled: "כבוי",
      expiringHint: "מינויים מסומנים דורשים טיפול חידוש בתוך 7, 14 או 30 ימים.",
      mobileHint: "במובייל המינויים מוצגים ככרטיסים עם תפריט פעולות אחד לכל מינוי.",
    },
  },
};
