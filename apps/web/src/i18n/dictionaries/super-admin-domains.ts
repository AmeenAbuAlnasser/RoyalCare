import type { SupportedLocale } from "../locales";

type DomainsDictionary = {
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
    pendingVerification: string;
    sslExpiryWarning: string;
    healthOverview: string;
  };
  stats: {
    totalDomains: string;
    verifiedDomains: string;
    pendingVerification: string;
    failedVerification: string;
    expiringSsl: string;
  };
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    all: string;
    verified: string;
    pending: string;
    failed: string;
    suspended: string;
    sslExpiringSoon: string;
  };
  table: {
    centerName: string;
    domainName: string;
    type: string;
    verificationStatus: string;
    dnsStatus: string;
    sslStatus: string;
    addedDate: string;
    lastChecked: string;
    status: string;
    actions: string;
  };
  actions: {
    view: string;
    verify: string;
    recheckDns: string;
    sslRenew: string;
    suspendDomain: string;
    delete: string;
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
  domainTypes: {
    custom: string;
    subdomain: string;
  };
  verificationStatuses: {
    verified: string;
    pending: string;
    failed: string;
    suspended: string;
  };
  statuses: {
    active: string;
    pending: string;
    failed: string;
    suspended: string;
  };
  dnsStatuses: {
    healthy: string;
    warning: string;
    critical: string;
  };
  sslStatuses: {
    valid: string;
    pending: string;
    expiringSoon: string;
    expired: string;
    failed: string;
  };
  health: {
    healthy: string;
    warning: string;
    critical: string;
  };
  values: {
    pendingHint: string;
    sslHint: string;
    mobileHint: string;
  };
};

export const superAdminDomainsDictionaries: Record<SupportedLocale, DomainsDictionary> = {
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
      eyebrow: "Domain operations",
      title: "Domains Management",
      subtitle: "Manage center domains, DNS verification, SSL status, and domain health.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      summary: "Domain Summary",
      searchFilters: "Search + Filters",
      table: "Domains Table",
      pendingVerification: "Pending Verification",
      sslExpiryWarning: "SSL Expiry Warning",
      healthOverview: "Domain Health Overview",
    },
    stats: {
      totalDomains: "Total Domains",
      verifiedDomains: "Verified Domains",
      pendingVerification: "Pending Verification",
      failedVerification: "Failed Verification",
      expiringSsl: "Expiring SSL Certificates",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by center, domain, or owner",
      all: "All",
      verified: "Verified",
      pending: "Pending",
      failed: "Failed",
      suspended: "Suspended",
      sslExpiringSoon: "SSL Expiring Soon",
    },
    table: {
      centerName: "Center Name",
      domainName: "Domain Name",
      type: "Type",
      verificationStatus: "Verification Status",
      dnsStatus: "DNS Status",
      sslStatus: "SSL Status",
      addedDate: "Added Date",
      lastChecked: "Last Checked",
      status: "Status",
      actions: "Actions",
    },
    actions: {
      view: "View",
      verify: "Verify",
      recheckDns: "Recheck DNS",
      sslRenew: "SSL Renew",
      suspendDomain: "Suspend Domain",
      delete: "Delete",
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
    domainTypes: { custom: "Custom Domain", subdomain: "Subdomain" },
    verificationStatuses: {
      verified: "Verified",
      pending: "Pending",
      failed: "Failed",
      suspended: "Suspended",
    },
    statuses: {
      active: "Active",
      pending: "Pending",
      failed: "Failed",
      suspended: "Suspended",
    },
    dnsStatuses: {
      healthy: "Healthy",
      warning: "Warning",
      critical: "Critical",
    },
    sslStatuses: {
      valid: "Valid",
      pending: "Pending",
      expiringSoon: "Expiring Soon",
      expired: "Expired",
      failed: "Failed",
    },
    health: {
      healthy: "Healthy",
      warning: "Warning",
      critical: "Critical",
    },
    values: {
      pendingHint: "These domains are waiting for DNS setup or verification.",
      sslHint: "Review SSL certificates that are expiring soon or already expired.",
      mobileHint: "Mobile uses domain cards with one Actions menu per domain.",
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
      eyebrow: "إدارة النطاقات",
      title: "إدارة النطاقات",
      subtitle: "إدارة نطاقات المراكز والتحقق من DNS وحالة SSL وصحة النطاقات.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      summary: "ملخص النطاقات",
      searchFilters: "البحث والفلاتر",
      table: "جدول النطاقات",
      pendingVerification: "بانتظار التحقق",
      sslExpiryWarning: "تحذير انتهاء SSL",
      healthOverview: "نظرة عامة على صحة النطاقات",
    },
    stats: {
      totalDomains: "إجمالي النطاقات",
      verifiedDomains: "النطاقات الموثقة",
      pendingVerification: "بانتظار التحقق",
      failedVerification: "فشل التحقق",
      expiringSsl: "شهادات SSL قاربت الانتهاء",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث حسب المركز أو النطاق أو المالك",
      all: "الكل",
      verified: "موثق",
      pending: "معلق",
      failed: "فشل",
      suspended: "موقوف",
      sslExpiringSoon: "SSL ينتهي قريبا",
    },
    table: {
      centerName: "اسم المركز",
      domainName: "اسم النطاق",
      type: "النوع",
      verificationStatus: "حالة التحقق",
      dnsStatus: "حالة DNS",
      sslStatus: "حالة SSL",
      addedDate: "تاريخ الإضافة",
      lastChecked: "آخر فحص",
      status: "الحالة",
      actions: "الإجراءات",
    },
    actions: {
      view: "عرض",
      verify: "تحقق",
      recheckDns: "إعادة فحص DNS",
      sslRenew: "تجديد SSL",
      suspendDomain: "إيقاف النطاق",
      delete: "حذف",
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
    domainTypes: { custom: "نطاق مخصص", subdomain: "نطاق فرعي" },
    verificationStatuses: {
      verified: "موثق",
      pending: "معلق",
      failed: "فشل",
      suspended: "موقوف",
    },
    statuses: {
      active: "نشط",
      pending: "معلق",
      failed: "فشل",
      suspended: "موقوف",
    },
    dnsStatuses: {
      healthy: "سليم",
      warning: "تحذير",
      critical: "حرج",
    },
    sslStatuses: {
      valid: "صالح",
      pending: "معلق",
      expiringSoon: "ينتهي قريبا",
      expired: "منتهي",
      failed: "فشل",
    },
    health: {
      healthy: "سليم",
      warning: "تحذير",
      critical: "حرج",
    },
    values: {
      pendingHint: "هذه النطاقات بانتظار إعداد DNS أو التحقق.",
      sslHint: "راجع شهادات SSL التي قاربت الانتهاء أو انتهت بالفعل.",
      mobileHint: "في الجوال تظهر النطاقات كبطاقات مع قائمة إجراءات واحدة لكل نطاق.",
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
      eyebrow: "ניהול דומיינים",
      title: "ניהול דומיינים",
      subtitle: "ניהול דומייני מרכזים, אימות DNS, סטטוס SSL ובריאות דומיינים.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      summary: "סיכום דומיינים",
      searchFilters: "חיפוש וסינון",
      table: "טבלת דומיינים",
      pendingVerification: "ממתין לאימות",
      sslExpiryWarning: "אזהרת תפוגת SSL",
      healthOverview: "סקירת בריאות דומיינים",
    },
    stats: {
      totalDomains: "סך דומיינים",
      verifiedDomains: "דומיינים מאומתים",
      pendingVerification: "ממתינים לאימות",
      failedVerification: "אימות נכשל",
      expiringSsl: "תעודות SSL שפגות בקרוב",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי מרכז, דומיין או בעלים",
      all: "הכל",
      verified: "מאומת",
      pending: "ממתין",
      failed: "נכשל",
      suspended: "מושהה",
      sslExpiringSoon: "SSL פג בקרוב",
    },
    table: {
      centerName: "שם המרכז",
      domainName: "שם דומיין",
      type: "סוג",
      verificationStatus: "סטטוס אימות",
      dnsStatus: "סטטוס DNS",
      sslStatus: "סטטוס SSL",
      addedDate: "תאריך הוספה",
      lastChecked: "בדיקה אחרונה",
      status: "סטטוס",
      actions: "פעולות",
    },
    actions: {
      view: "צפייה",
      verify: "אימות",
      recheckDns: "בדיקת DNS מחדש",
      sslRenew: "חידוש SSL",
      suspendDomain: "השהיית דומיין",
      delete: "מחיקה",
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
    domainTypes: { custom: "דומיין מותאם", subdomain: "תת-דומיין" },
    verificationStatuses: {
      verified: "מאומת",
      pending: "ממתין",
      failed: "נכשל",
      suspended: "מושהה",
    },
    statuses: {
      active: "פעיל",
      pending: "ממתין",
      failed: "נכשל",
      suspended: "מושהה",
    },
    dnsStatuses: {
      healthy: "תקין",
      warning: "אזהרה",
      critical: "קריטי",
    },
    sslStatuses: {
      valid: "תקף",
      pending: "ממתין",
      expiringSoon: "פג בקרוב",
      expired: "פג תוקף",
      failed: "נכשל",
    },
    health: {
      healthy: "תקין",
      warning: "אזהרה",
      critical: "קריטי",
    },
    values: {
      pendingHint: "דומיינים אלה ממתינים להגדרת DNS או אימות.",
      sslHint: "בדקו תעודות SSL שפגות בקרוב או שכבר פגו.",
      mobileHint: "במובייל הדומיינים מוצגים ככרטיסים עם תפריט פעולות אחד לכל דומיין.",
    },
  },
};
