import type { SupportedLocale } from "../locales";

type CenterDetailsDictionary = {
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
  sections: {
    overview: string;
    quickActions: string;
    adminInfo: string;
    brandingLanguages: string;
    activityTimeline: string;
    notes: string;
  };
  fields: {
    centerName: string;
    logo: string;
    ownerName: string;
    centerType: string;
    servicesOffered: string;
    status: string;
    subscriptionPlan: string;
    startDate: string;
    expiryDate: string;
    autoRenewal: string;
    domain: string;
    createdDate: string;
    adminName: string;
    email: string;
    mobile: string;
    permissionsPreset: string;
    lastLogin: string;
    accountStatus: string;
    primaryColor: string;
    secondaryColor: string;
    defaultLanguage: string;
    enabledLanguages: string;
    dnsVerificationStatus: string;
  };
  actions: {
    backToCenters: string;
    editCenter: string;
    renewSubscription: string;
    suspendCenter: string;
    activateCenter: string;
    deleteCenter: string;
    loginAsCenterAdmin: string;
    saveNotes: string;
  };
  statuses: {
    active: string;
    trial: string;
    expired: string;
    suspended: string;
  };
  accountStatuses: {
    active: string;
    pendingActivation: string;
  };
  domainStatuses: {
    pending: string;
    verified: string;
    failed: string;
  };
  plans: {
    trial: string;
    starter: string;
    professional: string;
    enterprise: string;
  };
  centerTypes: {
    medicalCenter: string;
    beautyCenter: string;
    wellnessCenter: string;
    multiSpecialtyCenter: string;
    other: string;
  };
  services: {
    laser: string;
    hijama: string;
    physiotherapy: string;
    occupationalTherapy: string;
    beauty: string;
    skinCare: string;
    massage: string;
    nutrition: string;
    rehabilitation: string;
    other: string;
  };
  permissionPresets: {
    fullAccess: string;
    standardManagement: string;
    limitedAccess: string;
    customPermissions: string;
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
  timeline: {
    centerCreated: string;
    subscriptionRenewed: string;
    domainVerified: string;
    adminUpdated: string;
    paymentReceived: string;
  };
  notes: {
    label: string;
    placeholder: string;
    helper: string;
  };
  values: {
    enabled: string;
    disabled: string;
    noLogo: string;
    futureAction: string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
};

export const superAdminCenterDetailsDictionaries: Record<
  SupportedLocale,
  CenterDetailsDictionary
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
      eyebrow: "Center management",
      title: "Center Details",
      subtitle: "Review and manage one RoyalCare center tenant.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      overview: "Center Overview",
      quickActions: "Quick Actions",
      adminInfo: "Center Admin Information",
      brandingLanguages: "Branding + Languages",
      activityTimeline: "Activity Timeline",
      notes: "Internal Notes",
    },
    fields: {
      centerName: "Center Name",
      logo: "Logo",
      ownerName: "Owner Name",
      centerType: "Center Type",
      servicesOffered: "Services Offered",
      status: "Status",
      subscriptionPlan: "Subscription Plan",
      startDate: "Start Date",
      expiryDate: "Expiry Date",
      autoRenewal: "Auto Renewal",
      domain: "Domain",
      createdDate: "Created Date",
      adminName: "Admin Name",
      email: "Email",
      mobile: "Mobile",
      permissionsPreset: "Permissions Preset",
      lastLogin: "Last Login",
      accountStatus: "Account Status",
      primaryColor: "Primary Color",
      secondaryColor: "Secondary Color",
      defaultLanguage: "Default Language",
      enabledLanguages: "Enabled Languages",
      dnsVerificationStatus: "DNS Verification Status",
    },
    actions: {
      backToCenters: "Back to Centers",
      editCenter: "Edit Center",
      renewSubscription: "Renew Subscription",
      suspendCenter: "Suspend Center",
      activateCenter: "Activate Center",
      deleteCenter: "Delete Center",
      loginAsCenterAdmin: "Login as Center Admin",
      saveNotes: "Save Notes",
    },
    statuses: {
      active: "Active",
      trial: "Trial",
      expired: "Expired",
      suspended: "Suspended",
    },
    accountStatuses: {
      active: "Active",
      pendingActivation: "Pending Activation",
    },
    domainStatuses: {
      pending: "Pending",
      verified: "Verified",
      failed: "Failed",
    },
    plans: {
      trial: "Trial",
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    },
    centerTypes: {
      medicalCenter: "Medical Center",
      beautyCenter: "Beauty Center",
      wellnessCenter: "Wellness Center",
      multiSpecialtyCenter: "Multi-Specialty Center",
      other: "Other",
    },
    services: {
      laser: "Laser",
      hijama: "Hijama",
      physiotherapy: "Physiotherapy",
      occupationalTherapy: "Occupational Therapy",
      beauty: "Beauty",
      skinCare: "Skin Care",
      massage: "Massage",
      nutrition: "Nutrition",
      rehabilitation: "Rehabilitation",
      other: "Other",
    },
    permissionPresets: {
      fullAccess: "Full Access",
      standardManagement: "Standard Management",
      limitedAccess: "Limited Access",
      customPermissions: "Custom Permissions",
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
    timeline: {
      centerCreated: "Center created",
      subscriptionRenewed: "Subscription renewed",
      domainVerified: "Domain verified",
      adminUpdated: "Admin updated",
      paymentReceived: "Payment received",
    },
    notes: {
      label: "Super Admin notes",
      placeholder: "Add internal notes about this center. These notes are visible only to RoyalCare admins.",
      helper: "UI only. Notes are not saved yet.",
    },
    values: {
      enabled: "Enabled",
      disabled: "Disabled",
      noLogo: "No logo uploaded",
      futureAction: "Future action",
      notFoundTitle: "Center not found",
      notFoundDescription: "No mock center exists for this route id. Return to Centers Management and choose an existing center.",
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
      eyebrow: "إدارة المركز",
      title: "تفاصيل المركز",
      subtitle: "مراجعة وإدارة مركز واحد داخل منصة رويال كير.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      overview: "نظرة عامة على المركز",
      quickActions: "إجراءات سريعة",
      adminInfo: "معلومات مدير المركز",
      brandingLanguages: "الهوية واللغات",
      activityTimeline: "سجل النشاط",
      notes: "ملاحظات داخلية",
    },
    fields: {
      centerName: "اسم المركز",
      logo: "الشعار",
      ownerName: "اسم المالك",
      centerType: "نوع المركز",
      servicesOffered: "الخدمات المقدمة",
      status: "الحالة",
      subscriptionPlan: "باقة الاشتراك",
      startDate: "تاريخ البداية",
      expiryDate: "تاريخ الانتهاء",
      autoRenewal: "التجديد التلقائي",
      domain: "النطاق",
      createdDate: "تاريخ الإنشاء",
      adminName: "اسم المدير",
      email: "البريد الإلكتروني",
      mobile: "رقم الجوال",
      permissionsPreset: "نموذج الصلاحيات",
      lastLogin: "آخر دخول",
      accountStatus: "حالة الحساب",
      primaryColor: "اللون الأساسي",
      secondaryColor: "اللون الثانوي",
      defaultLanguage: "اللغة الافتراضية",
      enabledLanguages: "اللغات المفعلة",
      dnsVerificationStatus: "حالة تحقق DNS",
    },
    actions: {
      backToCenters: "العودة إلى المراكز",
      editCenter: "تعديل المركز",
      renewSubscription: "تجديد الاشتراك",
      suspendCenter: "إيقاف المركز",
      activateCenter: "تفعيل المركز",
      deleteCenter: "حذف المركز",
      loginAsCenterAdmin: "الدخول كمدير المركز",
      saveNotes: "حفظ الملاحظات",
    },
    statuses: {
      active: "نشط",
      trial: "تجربة",
      expired: "منتهي",
      suspended: "موقوف",
    },
    accountStatuses: {
      active: "نشط",
      pendingActivation: "بانتظار التفعيل",
    },
    domainStatuses: {
      pending: "بانتظار التحقق",
      verified: "تم التحقق",
      failed: "فشل",
    },
    plans: {
      trial: "تجربة",
      starter: "البداية",
      professional: "الاحترافية",
      enterprise: "المؤسسات",
    },
    centerTypes: {
      medicalCenter: "مركز طبي",
      beautyCenter: "مركز تجميل",
      wellnessCenter: "مركز عافية",
      multiSpecialtyCenter: "مركز متعدد التخصصات",
      other: "أخرى",
    },
    services: {
      laser: "ليزر",
      hijama: "حجامة",
      physiotherapy: "علاج طبيعي",
      occupationalTherapy: "علاج وظيفي",
      beauty: "تجميل",
      skinCare: "العناية بالبشرة",
      massage: "مساج",
      nutrition: "تغذية",
      rehabilitation: "إعادة تأهيل",
      other: "أخرى",
    },
    permissionPresets: {
      fullAccess: "صلاحيات كاملة",
      standardManagement: "إدارة قياسية",
      limitedAccess: "صلاحيات محدودة",
      customPermissions: "صلاحيات مخصصة",
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
    timeline: {
      centerCreated: "تم إنشاء المركز",
      subscriptionRenewed: "تم تجديد الاشتراك",
      domainVerified: "تم التحقق من النطاق",
      adminUpdated: "تم تحديث المدير",
      paymentReceived: "تم استلام الدفع",
    },
    notes: {
      label: "ملاحظات مدير المنصة",
      placeholder: "أضف ملاحظات داخلية عن هذا المركز. هذه الملاحظات تظهر فقط لمديري رويال كير.",
      helper: "واجهة فقط. لا يتم حفظ الملاحظات حاليا.",
    },
    values: {
      enabled: "مفعل",
      disabled: "غير مفعل",
      noLogo: "لم يتم رفع شعار",
      futureAction: "إجراء مستقبلي",
      notFoundTitle: "المركز غير موجود",
      notFoundDescription: "لا يوجد مركز تجريبي لهذا المعرف. ارجع إلى إدارة المراكز واختر مركزا موجودا.",
    },
  },
  he: {
    brand: {
      name: "RoyalCare",
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
      eyebrow: "ניהול מרכז",
      title: "פרטי מרכז",
      subtitle: "סקירה וניהול של מרכז אחד בפלטפורמת RoyalCare.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      overview: "סקירת מרכז",
      quickActions: "פעולות מהירות",
      adminInfo: "פרטי מנהל המרכז",
      brandingLanguages: "מיתוג ושפות",
      activityTimeline: "ציר פעילות",
      notes: "הערות פנימיות",
    },
    fields: {
      centerName: "שם המרכז",
      logo: "לוגו",
      ownerName: "שם בעלים",
      centerType: "סוג מרכז",
      servicesOffered: "שירותים מוצעים",
      status: "סטטוס",
      subscriptionPlan: "תוכנית מינוי",
      startDate: "תאריך התחלה",
      expiryDate: "תאריך סיום",
      autoRenewal: "חידוש אוטומטי",
      domain: "דומיין",
      createdDate: "תאריך יצירה",
      adminName: "שם מנהל",
      email: "אימייל",
      mobile: "נייד",
      permissionsPreset: "תבנית הרשאות",
      lastLogin: "כניסה אחרונה",
      accountStatus: "סטטוס חשבון",
      primaryColor: "צבע ראשי",
      secondaryColor: "צבע משני",
      defaultLanguage: "שפת ברירת מחדל",
      enabledLanguages: "שפות פעילות",
      dnsVerificationStatus: "סטטוס אימות DNS",
    },
    actions: {
      backToCenters: "חזרה למרכזים",
      editCenter: "עריכת מרכז",
      renewSubscription: "חידוש מינוי",
      suspendCenter: "השהיית מרכז",
      activateCenter: "הפעלת מרכז",
      deleteCenter: "מחיקת מרכז",
      loginAsCenterAdmin: "כניסה כמנהל המרכז",
      saveNotes: "שמירת הערות",
    },
    statuses: {
      active: "פעיל",
      trial: "ניסיון",
      expired: "פג תוקף",
      suspended: "מושהה",
    },
    accountStatuses: {
      active: "פעיל",
      pendingActivation: "ממתין להפעלה",
    },
    domainStatuses: {
      pending: "ממתין",
      verified: "מאומת",
      failed: "נכשל",
    },
    plans: {
      trial: "ניסיון",
      starter: "מתחילים",
      professional: "מקצועי",
      enterprise: "ארגוני",
    },
    centerTypes: {
      medicalCenter: "מרכז רפואי",
      beautyCenter: "מרכז יופי",
      wellnessCenter: "מרכז בריאות",
      multiSpecialtyCenter: "מרכז רב-תחומי",
      other: "אחר",
    },
    services: {
      laser: "לייזר",
      hijama: "חיג'אמה",
      physiotherapy: "פיזיותרפיה",
      occupationalTherapy: "ריפוי בעיסוק",
      beauty: "יופי",
      skinCare: "טיפוח עור",
      massage: "עיסוי",
      nutrition: "תזונה",
      rehabilitation: "שיקום",
      other: "אחר",
    },
    permissionPresets: {
      fullAccess: "גישה מלאה",
      standardManagement: "ניהול רגיל",
      limitedAccess: "גישה מוגבלת",
      customPermissions: "הרשאות מותאמות",
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
    timeline: {
      centerCreated: "המרכז נוצר",
      subscriptionRenewed: "המינוי חודש",
      domainVerified: "הדומיין אומת",
      adminUpdated: "המנהל עודכן",
      paymentReceived: "תשלום התקבל",
    },
    notes: {
      label: "הערות מנהל מערכת",
      placeholder: "הוספת הערות פנימיות על המרכז. ההערות גלויות רק למנהלי RoyalCare.",
      helper: "ממשק בלבד. ההערות לא נשמרות כרגע.",
    },
    values: {
      enabled: "פעיל",
      disabled: "כבוי",
      noLogo: "לא הועלה לוגו",
      futureAction: "פעולה עתידית",
      notFoundTitle: "המרכז לא נמצא",
      notFoundDescription: "לא קיים מרכז דמו עבור מזהה הנתיב הזה. חזרו לניהול המרכזים ובחרו מרכז קיים.",
    },
  },
};
