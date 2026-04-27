import type { SupportedLocale } from "../locales";

type LayoutNav = {
  dashboard: string;
  centers: string;
  subscriptions: string;
  domains: string;
  plans: string;
  users: string;
  notifications: string;
  settings: string;
};

type PlanDetailsDictionary = {
  brand: { name: string; console: string };
  languages: Record<SupportedLocale, string>;
  shell: { menu: string; close: string };
  nav: LayoutNav;
  header: {
    eyebrow: string;
    title: string;
    subtitle: string;
    language: string;
    account: string;
  };
  sections: {
    overview: string;
    includedFeatures: string;
    quickActions: string;
    currentSubscribers: string;
    upgradePaths: string;
    internalNotes: string;
  };
  fields: {
    apiAccess: string;
    createdDate: string;
    currentSubscribers: string;
    customDomainSupport: string;
    emailNotifications: string;
    featuredPlan: string;
    higherPlan: string;
    includedModules: string;
    lastUpdated: string;
    lowerPlan: string;
    maxAppointments: string;
    maxBranches: string;
    maxCustomers: string;
    maxUsers: string;
    monthlyPrice: string;
    planName: string;
    prioritySupport: string;
    recentSubscribers: string;
    recommendedUpgradePath: string;
    revenueContribution: string;
    setupFee: string;
    smsNotifications: string;
    status: string;
    storageLimit: string;
    supportLevel: string;
    trialDuration: string;
    whatsAppNotifications: string;
    yearlyPrice: string;
  };
  actions: {
    activate: string;
    backToPlans: string;
    deactivate: string;
    deletePlan: string;
    duplicatePlan: string;
    editPlan: string;
    markFeatured: string;
    saveNotes: string;
  };
  plans: {
    trial: string;
    starter: string;
    professional: string;
    enterprise: string;
  };
  modules: {
    appointments: string;
    branding: string;
    customers: string;
    domains: string;
    notifications: string;
    permissions: string;
    sessions: string;
    website: string;
  };
  supportLevels: {
    basic: string;
    dedicated: string;
    priority: string;
    standard: string;
  };
  statuses: {
    active: string;
    inactive: string;
  };
  subscribers: {
    alNoorHijama: string;
    balancePhysio: string;
    glowBeauty: string;
    novaLaser: string;
    wellnessHouse: string;
  };
  values: {
    actionsHint: string;
    branches: string;
    days: string;
    disabled: string;
    enabled: string;
    featured: string;
    gb: string;
    noLowerPlan: string;
    noSetupFee: string;
    noTrial: string;
    notFeatured: string;
    notFoundDescription: string;
    notFoundTitle: string;
    notesHelper: string;
    notesLabel: string;
    notesPlaceholder: string;
    subscribers: string;
    users: string;
  };
};

export const superAdminPlanDetailsDictionaries: Record<SupportedLocale, PlanDetailsDictionary> = {
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
      eyebrow: "Plan configuration",
      title: "Plan Details",
      subtitle: "Review pricing, limits, features, subscribers, and upgrade paths for one subscription plan.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      overview: "Plan Overview",
      includedFeatures: "Included Features",
      quickActions: "Quick Actions",
      currentSubscribers: "Current Subscribers",
      upgradePaths: "Upgrade Paths",
      internalNotes: "Internal Notes",
    },
    fields: {
      apiAccess: "API Access",
      createdDate: "Created Date",
      currentSubscribers: "Centers Using This Plan",
      customDomainSupport: "Custom Domain Support",
      emailNotifications: "Email Notifications",
      featuredPlan: "Featured Plan",
      higherPlan: "Higher Plan",
      includedModules: "Included Modules",
      lastUpdated: "Last Updated",
      lowerPlan: "Lower Plan",
      maxAppointments: "Max Appointments",
      maxBranches: "Max Branches",
      maxCustomers: "Max Customers",
      maxUsers: "Max Users",
      monthlyPrice: "Monthly Price",
      planName: "Plan Name",
      prioritySupport: "Priority Support",
      recentSubscribers: "Most Recent Subscribers",
      recommendedUpgradePath: "Recommended Upgrade Path",
      revenueContribution: "Revenue Contribution",
      setupFee: "Setup Fee",
      smsNotifications: "SMS Notifications",
      status: "Status",
      storageLimit: "Storage Limit",
      supportLevel: "Support Level",
      trialDuration: "Trial Duration",
      whatsAppNotifications: "WhatsApp Notifications",
      yearlyPrice: "Yearly Price",
    },
    actions: {
      activate: "Activate Plan",
      backToPlans: "Back to Plans",
      deactivate: "Deactivate Plan",
      deletePlan: "Delete Plan",
      duplicatePlan: "Duplicate Plan",
      editPlan: "Edit Plan",
      markFeatured: "Mark as Featured",
      saveNotes: "Save Notes",
    },
    plans: {
      trial: "Trial",
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    },
    modules: {
      appointments: "Appointments",
      branding: "Branding",
      customers: "Customers",
      domains: "Domains",
      notifications: "Notifications",
      permissions: "Permissions",
      sessions: "Sessions",
      website: "Website",
    },
    supportLevels: {
      basic: "Basic",
      dedicated: "Dedicated",
      priority: "Priority",
      standard: "Standard",
    },
    statuses: { active: "Active", inactive: "Inactive" },
    subscribers: {
      alNoorHijama: "Al Noor Hijama",
      balancePhysio: "Balance Physio",
      glowBeauty: "Glow Beauty Clinic",
      novaLaser: "Nova Laser Center",
      wellnessHouse: "Wellness House",
    },
    values: {
      actionsHint: "Actions are UI-only until the Plans API is connected.",
      branches: "branches",
      days: "days",
      disabled: "Disabled",
      enabled: "Enabled",
      featured: "Featured",
      gb: "GB",
      noLowerPlan: "No lower plan",
      noSetupFee: "No setup fee",
      noTrial: "No trial",
      notFeatured: "Not featured",
      notFoundDescription: "This plan id does not exist in the current mock data.",
      notFoundTitle: "Plan not found",
      notesHelper: "Private notes are visible to Super Admin users only.",
      notesLabel: "Private plan notes",
      notesPlaceholder: "Add internal pricing, sales, or operational notes...",
      subscribers: "subscribers",
      users: "users",
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
      eyebrow: "إعدادات الباقة",
      title: "تفاصيل الباقة",
      subtitle: "مراجعة الأسعار والحدود والميزات والمشتركين ومسارات الترقية لباقه اشتراك واحدة.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      overview: "نظرة عامة على الباقة",
      includedFeatures: "الميزات المشمولة",
      quickActions: "إجراءات سريعة",
      currentSubscribers: "المشتركون الحاليون",
      upgradePaths: "مسارات الترقية",
      internalNotes: "ملاحظات داخلية",
    },
    fields: {
      apiAccess: "الوصول إلى API",
      createdDate: "تاريخ الإنشاء",
      currentSubscribers: "المراكز التي تستخدم الباقة",
      customDomainSupport: "دعم النطاق المخصص",
      emailNotifications: "إشعارات البريد الإلكتروني",
      featuredPlan: "باقة مميزة",
      higherPlan: "الباقة الأعلى",
      includedModules: "الوحدات المشمولة",
      lastUpdated: "آخر تحديث",
      lowerPlan: "الباقة الأدنى",
      maxAppointments: "الحد الأقصى للمواعيد",
      maxBranches: "الحد الأقصى للفروع",
      maxCustomers: "الحد الأقصى للعملاء",
      maxUsers: "الحد الأقصى للمستخدمين",
      monthlyPrice: "السعر الشهري",
      planName: "اسم الباقة",
      prioritySupport: "دعم أولوية",
      recentSubscribers: "أحدث المشتركين",
      recommendedUpgradePath: "مسار الترقية المقترح",
      revenueContribution: "مساهمة الإيرادات",
      setupFee: "رسوم الإعداد",
      smsNotifications: "إشعارات SMS",
      status: "الحالة",
      storageLimit: "حد التخزين",
      supportLevel: "مستوى الدعم",
      trialDuration: "مدة التجربة",
      whatsAppNotifications: "إشعارات واتساب",
      yearlyPrice: "السعر السنوي",
    },
    actions: {
      activate: "تفعيل الباقة",
      backToPlans: "العودة إلى الباقات",
      deactivate: "تعطيل الباقة",
      deletePlan: "حذف الباقة",
      duplicatePlan: "نسخ الباقة",
      editPlan: "تعديل الباقة",
      markFeatured: "تعيين كباقة مميزة",
      saveNotes: "حفظ الملاحظات",
    },
    plans: {
      trial: "تجربة",
      starter: "البداية",
      professional: "الاحترافية",
      enterprise: "المؤسسات",
    },
    modules: {
      appointments: "المواعيد",
      branding: "الهوية",
      customers: "العملاء",
      domains: "النطاقات",
      notifications: "الإشعارات",
      permissions: "الصلاحيات",
      sessions: "الجلسات",
      website: "الموقع",
    },
    supportLevels: {
      basic: "أساسي",
      dedicated: "مخصص",
      priority: "أولوية",
      standard: "قياسي",
    },
    statuses: { active: "نشط", inactive: "غير نشط" },
    subscribers: {
      alNoorHijama: "النور للحجامة",
      balancePhysio: "بالانس للعلاج الطبيعي",
      glowBeauty: "عيادة جلو للتجميل",
      novaLaser: "مركز نوفا ليزر",
      wellnessHouse: "ويلنس هاوس",
    },
    values: {
      actionsHint: "الإجراءات واجهة فقط حتى يتم ربط واجهة برمجة تطبيقات الباقات.",
      branches: "فروع",
      days: "أيام",
      disabled: "غير مفعل",
      enabled: "مفعل",
      featured: "مميزة",
      gb: "GB",
      noLowerPlan: "لا توجد باقة أدنى",
      noSetupFee: "لا توجد رسوم إعداد",
      noTrial: "بدون تجربة",
      notFeatured: "غير مميزة",
      notFoundDescription: "معرف هذه الباقة غير موجود في بيانات العرض الحالية.",
      notFoundTitle: "الباقة غير موجودة",
      notesHelper: "الملاحظات الخاصة تظهر لمستخدمي إدارة المنصة فقط.",
      notesLabel: "ملاحظات خاصة للباقة",
      notesPlaceholder: "أضف ملاحظات داخلية عن الأسعار أو المبيعات أو التشغيل...",
      subscribers: "مشتركين",
      users: "مستخدمين",
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
      eyebrow: "הגדרות תוכנית",
      title: "פרטי תוכנית",
      subtitle: "סקירת מחירים, מגבלות, תכונות, מנויים ומסלולי שדרוג עבור תוכנית אחת.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      overview: "סקירת תוכנית",
      includedFeatures: "תכונות כלולות",
      quickActions: "פעולות מהירות",
      currentSubscribers: "מנויים נוכחיים",
      upgradePaths: "מסלולי שדרוג",
      internalNotes: "הערות פנימיות",
    },
    fields: {
      apiAccess: "גישת API",
      createdDate: "תאריך יצירה",
      currentSubscribers: "מרכזים המשתמשים בתוכנית",
      customDomainSupport: "תמיכה בדומיין מותאם",
      emailNotifications: "התראות אימייל",
      featuredPlan: "תוכנית מומלצת",
      higherPlan: "תוכנית גבוהה יותר",
      includedModules: "מודולים כלולים",
      lastUpdated: "עדכון אחרון",
      lowerPlan: "תוכנית נמוכה יותר",
      maxAppointments: "מקסימום תורים",
      maxBranches: "מקסימום סניפים",
      maxCustomers: "מקסימום לקוחות",
      maxUsers: "מקסימום משתמשים",
      monthlyPrice: "מחיר חודשי",
      planName: "שם תוכנית",
      prioritySupport: "תמיכה מועדפת",
      recentSubscribers: "המנויים האחרונים",
      recommendedUpgradePath: "מסלול שדרוג מומלץ",
      revenueContribution: "תרומת הכנסות",
      setupFee: "דמי הקמה",
      smsNotifications: "התראות SMS",
      status: "סטטוס",
      storageLimit: "מגבלת אחסון",
      supportLevel: "רמת תמיכה",
      trialDuration: "משך ניסיון",
      whatsAppNotifications: "התראות WhatsApp",
      yearlyPrice: "מחיר שנתי",
    },
    actions: {
      activate: "הפעלת תוכנית",
      backToPlans: "חזרה לתוכניות",
      deactivate: "השבתת תוכנית",
      deletePlan: "מחיקת תוכנית",
      duplicatePlan: "שכפול תוכנית",
      editPlan: "עריכת תוכנית",
      markFeatured: "סימון כמומלצת",
      saveNotes: "שמירת הערות",
    },
    plans: {
      trial: "ניסיון",
      starter: "מתחילים",
      professional: "מקצועי",
      enterprise: "ארגוני",
    },
    modules: {
      appointments: "תורים",
      branding: "מיתוג",
      customers: "לקוחות",
      domains: "דומיינים",
      notifications: "התראות",
      permissions: "הרשאות",
      sessions: "מפגשים",
      website: "אתר",
    },
    supportLevels: {
      basic: "בסיסי",
      dedicated: "ייעודי",
      priority: "עדיפות",
      standard: "רגיל",
    },
    statuses: { active: "פעיל", inactive: "לא פעיל" },
    subscribers: {
      alNoorHijama: "אל נור חיג'אמה",
      balancePhysio: "Balance Physio",
      glowBeauty: "Glow Beauty Clinic",
      novaLaser: "Nova Laser Center",
      wellnessHouse: "Wellness House",
    },
    values: {
      actionsHint: "הפעולות הן UI בלבד עד לחיבור API של התוכניות.",
      branches: "סניפים",
      days: "ימים",
      disabled: "כבוי",
      enabled: "פעיל",
      featured: "מומלץ",
      gb: "GB",
      noLowerPlan: "אין תוכנית נמוכה יותר",
      noSetupFee: "אין דמי הקמה",
      noTrial: "ללא ניסיון",
      notFeatured: "לא מומלצת",
      notFoundDescription: "מזהה התוכנית אינו קיים בנתוני הדמו הנוכחיים.",
      notFoundTitle: "התוכנית לא נמצאה",
      notesHelper: "הערות פרטיות מוצגות רק למשתמשי Super Admin.",
      notesLabel: "הערות פרטיות לתוכנית",
      notesPlaceholder: "הוסף הערות פנימיות לגבי מחיר, מכירות או תפעול...",
      subscribers: "מנויים",
      users: "משתמשים",
    },
  },
};
