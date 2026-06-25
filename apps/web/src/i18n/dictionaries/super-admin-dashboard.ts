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
  overview: {
    activeCenters: string;
    centersNeedingFollowUp: string;
    totalCenters: string;
    totalUsers: string;
    monthlyRevenue: string;
  };
  overviewHelper: {
    activeCenters: string;
    centersNeedingFollowUp: string;
  };
  centersAtRiskBreakdown: {
    noSubscription: string;
    expired: string;
    suspended: string;
    gracePeriod: string;
  };
  subscriptionHelper: {
    activeSubscriptions: string;
  };
  sections: {
    auditActivity: string;
    billingOverview: string;
    smartInsights: string;
    quickStats: string;
    recentCenters: string;
    revenueByCenter: string;
    subscriptionOverview: string;
    domainManagement: string;
    notifications: string;
    revenueTrend: string;
    appointmentsTrend: string;
    topCentersByRevenue: string;
    topCentersByAppointments: string;
    auditActivityTrend: string;
    subscriptionFinancials: string;
  };
  charts: {
    noData: string;
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
    invoices: string;
    loadError: string;
    loading: string;
    noData: string;
    notAvailable: string;
  };
  actions: {
    viewAll: string;
    review: string;
    manage: string;
    view: string;
  };
  statuses: {
    active: string;
    archived: string;
    cancelled: string;
    paid: string;
    partial: string;
    suspended: string;
    trial: string;
    pastDue: string;
    pending: string;
    verified: string;
    failed: string;
  };
  stats: {
    newCenters: string;
    appointmentsToday: string;
    completedAppointments: string;
    pendingVerifications: string;
    sensitiveActions: string;
    supportItems: string;
  };
  billing: {
    paidInvoices: string;
    pendingInvoices: string;
    partialInvoices: string;
  };
  subscriptionBilling: {
    totalRevenue: string;
    paidInvoices: string;
    pendingInvoices: string;
    overdueInvoices: string;
    mrr: string;
    revenueByPlan: string;
  };
  insights: {
    alerts: string;
    highlights: string;
    recommendations: string;
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
  platformUsage: {
    sectionTitle: string;
    totalPatients: string;
    totalAppointments: string;
    appointmentsLast30Days: string;
    totalInvoices: string;
    totalUsers: string;
    activeCenters: string;
  };
  subscriptions: {
    sectionTitle: string;
    activeSubscriptions: string;
    cancelled: string;
    expiringSoon: string;
    expired: string;
    gracePeriod: string;
    suspended: string;
    total: string;
    trialing: string;
    unknown: string;
    viewAll: string;
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
      auditLogs: "Audit Logs",
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
      totalCenters: "Total centers",
      activeCenters: "Operational centers",
      centersNeedingFollowUp: "Needs follow-up",
      monthlyRevenue: "Monthly revenue",
      totalUsers: "Users",
    },
    overviewHelper: {
      activeCenters: "Centers that can currently use the system, regardless of subscription status.",
      centersNeedingFollowUp: "Operational centers without an effective subscription.",
    },
    centersAtRiskBreakdown: {
      noSubscription: "No subscription",
      expired: "Expired",
      suspended: "Suspended",
      gracePeriod: "Grace period",
    },
    subscriptionHelper: {
      activeSubscriptions: "Commercially active subscriptions not expiring within 7 days.",
    },
    sections: {
      auditActivity: "Latest audit activity",
      billingOverview: "Billing overview",
      smartInsights: "Smart insights",
      quickStats: "Quick stats",
      recentCenters: "Recent centers",
      revenueByCenter: "Revenue by center",
      subscriptionOverview: "Subscription overview",
      domainManagement: "Domain management",
      notifications: "Notifications",
      revenueTrend: "Revenue Trend (30 Days)",
      appointmentsTrend: "Appointments Trend (30 Days)",
      topCentersByRevenue: "Top Centers by Revenue",
      topCentersByAppointments: "Top Centers by Appointments",
      auditActivityTrend: "Audit Activity (30 Days)",
      subscriptionFinancials: "Subscription financials",
    },
    charts: {
      noData: "No chart data available",
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
      invoices: "invoices",
      loadError: "Dashboard data could not be loaded. Please try again.",
      loading: "Loading",
      noData: "No data available",
      notAvailable: "Not available",
    },
    actions: {
      viewAll: "View all",
      review: "Review",
      manage: "Manage",
      view: "View",
    },
    statuses: {
      active: "Active",
      archived: "Archived",
      cancelled: "Cancelled",
      paid: "Paid",
      partial: "Partial",
      suspended: "Suspended",
      trial: "Trial",
      pastDue: "Past due",
      pending: "Pending",
      verified: "Verified",
      failed: "Failed",
    },
    stats: {
      newCenters: "New centers this week",
      appointmentsToday: "Appointments today",
      completedAppointments: "Completed appointments",
      pendingVerifications: "Pending verifications",
      sensitiveActions: "Sensitive actions",
      supportItems: "Support items",
    },
    billing: {
      paidInvoices: "Paid invoices",
      pendingInvoices: "Pending invoices",
      partialInvoices: "Partial invoices",
    },
    subscriptionBilling: {
      totalRevenue: "Total subscription revenue",
      paidInvoices: "Paid subscription invoices",
      pendingInvoices: "Pending subscription invoices",
      overdueInvoices: "Overdue subscription invoices",
      mrr: "MRR",
      revenueByPlan: "Revenue by plan",
    },
    insights: {
      alerts: "Alerts",
      highlights: "Highlights",
      recommendations: "Recommendations",
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
    platformUsage: {
      sectionTitle: "Platform Usage Metrics",
      totalPatients: "Total Patients",
      totalAppointments: "Total Appointments",
      appointmentsLast30Days: "Appointments Last 30 Days",
      totalInvoices: "Total Invoices",
      totalUsers: "Total Users",
      activeCenters: "Active Centers",
    },
    subscriptions: {
      sectionTitle: "Subscription Overview",
      activeSubscriptions: "Effective",
      cancelled: "Cancelled",
      expiringSoon: "Expiring Soon",
      expired: "Expired",
      gracePeriod: "Grace Period",
      suspended: "Suspended",
      total: "Total",
      trialing: "Trialing",
      unknown: "Unknown",
      viewAll: "View All Subscriptions",
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
      eyebrow: "نظرة عامة على المنصة",
      title: "لوحة تحكم رويال كير",
      subtitle: "متابعة نشاط المراكز والاشتراكات والنطاقات وتنبيهات المنصة.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    overview: {
      totalCenters: "إجمالي المراكز",
      activeCenters: "المراكز التشغيلية",
      centersNeedingFollowUp: "تحتاج متابعة",
      monthlyRevenue: "الإيراد الشهري",
      totalUsers: "المستخدمون",
    },
    overviewHelper: {
      activeCenters: "مراكز يمكنها استخدام النظام حالياً بغض النظر عن حالة الاشتراك.",
      centersNeedingFollowUp: "مراكز تشغيلية بدون اشتراك فعال.",
    },
    centersAtRiskBreakdown: {
      noSubscription: "بدون اشتراك",
      expired: "منتهية",
      suspended: "موقوفة",
      gracePeriod: "فترة سماح",
    },
    subscriptionHelper: {
      activeSubscriptions: "اشتراكات تجارية فعالة وغير منتهية.",
    },
    sections: {
      auditActivity: "أحدث أنشطة التدقيق",
      billingOverview: "نظرة على الفواتير",
      smartInsights: "رؤى ذكية",
      quickStats: "إحصائيات سريعة",
      recentCenters: "أحدث المراكز",
      revenueByCenter: "الإيراد حسب المركز",
      subscriptionOverview: "نظرة على الاشتراكات",
      domainManagement: "إدارة النطاقات",
      notifications: "الإشعارات",
      revenueTrend: "اتجاه الإيرادات (30 يومًا)",
      appointmentsTrend: "اتجاه المواعيد (30 يومًا)",
      topCentersByRevenue: "أعلى المراكز إيرادًا",
      topCentersByAppointments: "أعلى المراكز بالمواعيد",
      auditActivityTrend: "نشاط التدقيق (30 يومًا)",
      subscriptionFinancials: "المؤشرات المالية للاشتراكات",
    },
    charts: {
      noData: "لا توجد بيانات للرسم البياني",
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
      invoices: "فواتير",
      loadError: "تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.",
      loading: "جار التحميل",
      noData: "لا توجد بيانات",
      notAvailable: "غير متوفر",
    },
    actions: {
      viewAll: "عرض الكل",
      review: "مراجعة",
      manage: "إدارة",
      view: "عرض",
    },
    statuses: {
      active: "نشط",
      archived: "مؤرشف",
      cancelled: "ملغى",
      paid: "مدفوع",
      partial: "جزئي",
      suspended: "معلق",
      trial: "تجربة",
      pastDue: "متأخر",
      pending: "قيد الانتظار",
      verified: "موثق",
      failed: "فشل",
    },
    stats: {
      newCenters: "مراكز جديدة هذا الأسبوع",
      appointmentsToday: "مواعيد اليوم",
      completedAppointments: "المواعيد المكتملة",
      pendingVerifications: "توثيقات معلقة",
      sensitiveActions: "إجراءات حساسة",
      supportItems: "طلبات دعم",
    },
    billing: {
      paidInvoices: "فواتير مدفوعة",
      pendingInvoices: "فواتير معلقة",
      partialInvoices: "فواتير جزئية",
    },
    subscriptionBilling: {
      totalRevenue: "إجمالي إيراد الاشتراكات",
      paidInvoices: "فواتير اشتراك مدفوعة",
      pendingInvoices: "فواتير اشتراك معلقة",
      overdueInvoices: "فواتير اشتراك متأخرة",
      mrr: "الإيراد الشهري المتكرر",
      revenueByPlan: "الإيراد حسب الخطة",
    },
    insights: {
      alerts: "تنبيهات",
      highlights: "نقاط إيجابية",
      recommendations: "توصيات",
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
    platformUsage: {
      sectionTitle: "مؤشرات استخدام المنصة",
      totalPatients: "إجمالي المرضى",
      totalAppointments: "إجمالي الحجوزات",
      appointmentsLast30Days: "حجوزات آخر 30 يوم",
      totalInvoices: "إجمالي الفواتير",
      totalUsers: "إجمالي المستخدمين",
      activeCenters: "المراكز النشطة",
    },
    subscriptions: {
      sectionTitle: "نظرة على الاشتراكات",
      activeSubscriptions: "فعالة",
      cancelled: "ملغاة",
      expiringSoon: "تنتهي قريبًا",
      expired: "منتهية",
      gracePeriod: "فترة السماح",
      suspended: "موقوفة",
      total: "المجموع",
      trialing: "تجريبية",
      unknown: "غير معروفة",
      viewAll: "عرض جميع الاشتراكات",
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
      eyebrow: "סקירת מערכת",
      title: "לוח בקרת רויאל קייר",
      subtitle: "מעקב אחר פעילות מרכזים, מינויים, דומיינים והתראות מערכת.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    overview: {
      totalCenters: "סה״כ מרכזים",
      activeCenters: "מרכזים תפעוליים",
      centersNeedingFollowUp: "דורשים מעקב",
      monthlyRevenue: "הכנסה חודשית",
      totalUsers: "משתמשים",
    },
    overviewHelper: {
      activeCenters: "מרכזים שיכולים להשתמש במערכת כעת, ללא תלות בסטטוס המינוי.",
      centersNeedingFollowUp: "מרכזים תפעוליים ללא מינוי אפקטיבי.",
    },
    centersAtRiskBreakdown: {
      noSubscription: "ללא מינוי",
      expired: "פג תוקף",
      suspended: "מושהה",
      gracePeriod: "תקופת חסד",
    },
    subscriptionHelper: {
      activeSubscriptions: "מינויים מסחריים אפקטיביים שלא מסתיימים תוך 7 ימים.",
    },
    sections: {
      auditActivity: "פעילות ביקורת אחרונה",
      billingOverview: "סקירת חיוב",
      smartInsights: "תובנות חכמות",
      quickStats: "נתונים מהירים",
      recentCenters: "מרכזים אחרונים",
      revenueByCenter: "הכנסה לפי מרכז",
      subscriptionOverview: "סקירת מינויים",
      domainManagement: "ניהול דומיינים",
      notifications: "התראות",
      revenueTrend: "מגמת הכנסות (30 יום)",
      appointmentsTrend: "מגמת תורים (30 יום)",
      topCentersByRevenue: "מרכזים מובילים לפי הכנסות",
      topCentersByAppointments: "מרכזים מובילים לפי תורים",
      auditActivityTrend: "פעילות ביקורת (30 יום)",
      subscriptionFinancials: "מדדי כספים למינויים",
    },
    charts: {
      noData: "אין נתוני גרף זמינים",
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
      invoices: "חשבוניות",
      loadError: "לא ניתן לטעון את נתוני לוח הבקרה. נסה שוב.",
      loading: "טוען",
      noData: "אין נתונים",
      notAvailable: "לא זמין",
    },
    actions: {
      viewAll: "הצג הכל",
      review: "בדיקה",
      manage: "ניהול",
      view: "הצג",
    },
    statuses: {
      active: "פעיל",
      archived: "בארכיון",
      cancelled: "בוטל",
      paid: "שולם",
      partial: "חלקי",
      suspended: "מושעה",
      trial: "ניסיון",
      pastDue: "באיחור",
      pending: "ממתין",
      verified: "מאומת",
      failed: "נכשל",
    },
    stats: {
      newCenters: "מרכזים חדשים השבוע",
      appointmentsToday: "תורים היום",
      completedAppointments: "תורים שהושלמו",
      pendingVerifications: "אימותים ממתינים",
      sensitiveActions: "פעולות רגישות",
      supportItems: "פניות תמיכה",
    },
    billing: {
      paidInvoices: "חשבוניות ששולמו",
      pendingInvoices: "חשבוניות ממתינות",
      partialInvoices: "חשבוניות חלקיות",
    },
    subscriptionBilling: {
      totalRevenue: "סה\"כ הכנסות ממינויים",
      paidInvoices: "חשבוניות מינוי ששולמו",
      pendingInvoices: "חשבוניות מינוי ממתינות",
      overdueInvoices: "חשבוניות מינוי באיחור",
      mrr: "הכנסה חודשית חוזרת",
      revenueByPlan: "הכנסה לפי תוכנית",
    },
    insights: {
      alerts: "התראות",
      highlights: "נקודות חיוביות",
      recommendations: "המלצות",
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
    platformUsage: {
      sectionTitle: "מדדי שימוש בפלטפורמה",
      totalPatients: "סך המטופלים",
      totalAppointments: "סך התורים",
      appointmentsLast30Days: "תורים ב-30 הימים האחרונים",
      totalInvoices: "סך החשבוניות",
      totalUsers: "סך המשתמשים",
      activeCenters: "מרכזים פעילים",
    },
    subscriptions: {
      sectionTitle: "סקירת מינויים",
      activeSubscriptions: "אפקטיביים",
      cancelled: "בוטלו",
      expiringSoon: "מסתיימים בקרוב",
      expired: "פג תוקף",
      gracePeriod: "תקופת חסד",
      suspended: "מושהים",
      total: "סך הכל",
      trialing: "בניסיון",
      unknown: "לא ידוע",
      viewAll: "הצג את כל המינויים",
    },
  },
};
