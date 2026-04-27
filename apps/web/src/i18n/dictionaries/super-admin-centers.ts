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
  };
  search: {
    label: string;
    placeholder: string;
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
    actions: string;
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
  };
  plans: {
    starter: string;
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
    },
    search: {
      label: "Search",
      placeholder: "Search by center, owner, domain, or type",
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
      actions: "Actions",
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
    },
    plans: {
      starter: "Starter",
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
    },
    search: {
      label: "بحث",
      placeholder: "ابحث حسب المركز أو المالك أو النطاق أو النوع",
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
      actions: "الإجراءات",
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
    },
    plans: {
      starter: "البداية",
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
    },
    search: {
      label: "חיפוש",
      placeholder: "חיפוש לפי מרכז, בעלים, דומיין או סוג",
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
      actions: "פעולות",
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
    },
    plans: {
      starter: "מתחילים",
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
