import type { SupportedLocale } from "../locales";

type DashboardDictionary = {
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
  overview: {
    activeCenters: string;
    trialCenters: string;
    monthlyRevenue: string;
    openDomainTasks: string;
  };
  sections: {
    quickStats: string;
    recentCenters: string;
    subscriptionOverview: string;
    domainManagement: string;
    notifications: string;
  };
  labels: {
    status: string;
    owner: string;
    plan: string;
    renewal: string;
    domain: string;
    issue: string;
    action: string;
    updated: string;
    centersCount: string;
    renewalsThisWeek: string;
    minutesAgo: string;
    hourAgo: string;
  };
  actions: {
    viewAll: string;
    review: string;
    manage: string;
  };
  statuses: {
    active: string;
    trial: string;
    pastDue: string;
    pending: string;
    verified: string;
    failed: string;
  };
  stats: {
    newCenters: string;
    appointmentsToday: string;
    pendingVerifications: string;
    supportItems: string;
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
  };
  owners: {
    mayaCohen: string;
    omarHaddad: string;
    danaLevi: string;
  };
  domainIssues: {
    primaryVerified: string;
    dnsPending: string;
    sslFailed: string;
  };
  notificationTitles: {
    subscriptionRenewalQueue: string;
    domainVerificationCompleted: string;
    pastDueCenterReview: string;
  };
};

export const superAdminDashboardDictionaries: Record<
  SupportedLocale,
  DashboardDictionary
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
      eyebrow: "Platform overview",
      title: "RoyalCare Super Admin Dashboard",
      subtitle:
        "Monitor tenant activity, subscriptions, domains, and platform notices.",
      language: "Language",
      account: "Platform Admin",
    },
    overview: {
      activeCenters: "Active centers",
      trialCenters: "Trial centers",
      monthlyRevenue: "Monthly revenue",
      openDomainTasks: "Domain tasks",
    },
    sections: {
      quickStats: "Quick stats",
      recentCenters: "Recent centers",
      subscriptionOverview: "Subscription overview",
      domainManagement: "Domain management",
      notifications: "Notifications",
    },
    labels: {
      status: "Status",
      owner: "Owner",
      plan: "Plan",
      renewal: "Renewal",
      domain: "Domain",
      issue: "Issue",
      action: "Action",
      updated: "Updated",
      centersCount: "centers",
      renewalsThisWeek: "renewals this week",
      minutesAgo: "min ago",
      hourAgo: "hr ago",
    },
    actions: {
      viewAll: "View all",
      review: "Review",
      manage: "Manage",
    },
    statuses: {
      active: "Active",
      trial: "Trial",
      pastDue: "Past due",
      pending: "Pending",
      verified: "Verified",
      failed: "Failed",
    },
    stats: {
      newCenters: "New centers this week",
      appointmentsToday: "Appointments today",
      pendingVerifications: "Pending verifications",
      supportItems: "Support items",
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
    },
    owners: {
      mayaCohen: "Maya Cohen",
      omarHaddad: "Omar Haddad",
      danaLevi: "Dana Levi",
    },
    domainIssues: {
      primaryVerified: "Primary domain verified",
      dnsPending: "DNS verification pending",
      sslFailed: "SSL check failed",
    },
    notificationTitles: {
      subscriptionRenewalQueue: "Subscription renewal queue",
      domainVerificationCompleted: "Domain verification completed",
      pastDueCenterReview: "Past due center requires review",
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
      eyebrow: "نظرة عامة على المنصة",
      title: "لوحة تحكم رويال كير",
      subtitle: "متابعة نشاط المراكز والاشتراكات والنطاقات وتنبيهات المنصة.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    overview: {
      activeCenters: "المراكز النشطة",
      trialCenters: "مراكز التجربة",
      monthlyRevenue: "الإيراد الشهري",
      openDomainTasks: "مهام النطاقات",
    },
    sections: {
      quickStats: "إحصائيات سريعة",
      recentCenters: "أحدث المراكز",
      subscriptionOverview: "نظرة على الاشتراكات",
      domainManagement: "إدارة النطاقات",
      notifications: "الإشعارات",
    },
    labels: {
      status: "الحالة",
      owner: "المالك",
      plan: "الباقة",
      renewal: "التجديد",
      domain: "النطاق",
      issue: "المشكلة",
      action: "إجراء",
      updated: "آخر تحديث",
      centersCount: "مراكز",
      renewalsThisWeek: "تجديدات هذا الأسبوع",
      minutesAgo: "دقيقة",
      hourAgo: "ساعة",
    },
    actions: {
      viewAll: "عرض الكل",
      review: "مراجعة",
      manage: "إدارة",
    },
    statuses: {
      active: "نشط",
      trial: "تجربة",
      pastDue: "متأخر",
      pending: "قيد الانتظار",
      verified: "موثق",
      failed: "فشل",
    },
    stats: {
      newCenters: "مراكز جديدة هذا الأسبوع",
      appointmentsToday: "مواعيد اليوم",
      pendingVerifications: "توثيقات معلقة",
      supportItems: "طلبات دعم",
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
    },
    owners: {
      mayaCohen: "مايا كوهين",
      omarHaddad: "عمر حداد",
      danaLevi: "دانا ليفي",
    },
    domainIssues: {
      primaryVerified: "تم توثيق النطاق الرئيسي",
      dnsPending: "توثيق إعدادات النطاق قيد الانتظار",
      sslFailed: "فشل فحص شهادة الأمان",
    },
    notificationTitles: {
      subscriptionRenewalQueue: "قائمة تجديد الاشتراكات",
      domainVerificationCompleted: "اكتمل توثيق النطاق",
      pastDueCenterReview: "مركز متأخر يحتاج إلى مراجعة",
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
      eyebrow: "סקירת מערכת",
      title: "לוח בקרת רויאל קייר",
      subtitle: "מעקב אחר פעילות מרכזים, מינויים, דומיינים והתראות מערכת.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    overview: {
      activeCenters: "מרכזים פעילים",
      trialCenters: "מרכזי ניסיון",
      monthlyRevenue: "הכנסה חודשית",
      openDomainTasks: "משימות דומיין",
    },
    sections: {
      quickStats: "נתונים מהירים",
      recentCenters: "מרכזים אחרונים",
      subscriptionOverview: "סקירת מינויים",
      domainManagement: "ניהול דומיינים",
      notifications: "התראות",
    },
    labels: {
      status: "סטטוס",
      owner: "בעלים",
      plan: "תוכנית",
      renewal: "חידוש",
      domain: "דומיין",
      issue: "בעיה",
      action: "פעולה",
      updated: "עודכן",
      centersCount: "מרכזים",
      renewalsThisWeek: "חידושים השבוע",
      minutesAgo: "דקות",
      hourAgo: "שעה",
    },
    actions: {
      viewAll: "הצג הכל",
      review: "בדיקה",
      manage: "ניהול",
    },
    statuses: {
      active: "פעיל",
      trial: "ניסיון",
      pastDue: "באיחור",
      pending: "ממתין",
      verified: "מאומת",
      failed: "נכשל",
    },
    stats: {
      newCenters: "מרכזים חדשים השבוע",
      appointmentsToday: "תורים היום",
      pendingVerifications: "אימותים ממתינים",
      supportItems: "פניות תמיכה",
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
    },
    owners: {
      mayaCohen: "מאיה כהן",
      omarHaddad: "עומר חדאד",
      danaLevi: "דנה לוי",
    },
    domainIssues: {
      primaryVerified: "הדומיין הראשי אומת",
      dnsPending: "אימות DNS ממתין",
      sslFailed: "בדיקת SSL נכשלה",
    },
    notificationTitles: {
      subscriptionRenewalQueue: "תור חידוש מינויים",
      domainVerificationCompleted: "אימות הדומיין הושלם",
      pastDueCenterReview: "מרכז באיחור דורש בדיקה",
    },
  },
};
