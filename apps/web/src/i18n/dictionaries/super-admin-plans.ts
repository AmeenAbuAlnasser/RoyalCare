import type { SupportedLocale } from "../locales";

type PlansDictionary = {
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
    summary: string;
    searchFilters: string;
    plansList: string;
    comparison: string;
  };
  stats: {
    totalPlans: string;
    activePlans: string;
    mostPopularPlan: string;
    highestRevenuePlan: string;
  };
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    all: string;
    active: string;
    inactive: string;
    trialEnabled: string;
    popular: string;
  };
  fields: {
    planName: string;
    monthlyPrice: string;
    yearlyPrice: string;
    trialDuration: string;
    maxUsers: string;
    maxBranches: string;
    includedModules: string;
    supportLevel: string;
    status: string;
    actions: string;
    // v2
    code: string;
    currency: string;
    subscriptionsCount: string;
    displayOrder: string;
    maxPatients: string;
    maxAppointmentsPerMonth: string;
    nameEn: string;
    nameAr: string;
    nameHe: string;
    descriptionEn: string;
    descriptionAr: string;
    descriptionHe: string;
    isActive: string;
    isPublic: string;
    isPopular: string;
    isContactPricing: string;
    features: string;
  };
  actions: {
    addNewPlan: string;
    viewPlan: string;
    editPlan: string;
    duplicatePlan: string;
    activate: string;
    deactivate: string;
    deletePlan: string;
    // v2
    createPlan: string;
    saveChanges: string;
    moveUp: string;
    moveDown: string;
  };
  values: {
    days: string;
    featured: string;
    mobileHint: string;
    noTrial: string;
    users: string;
    branches: string;
    // v2
    contactPricing: string;
    hidden: string;
    noLimit: string;
    perYear: string;
    subscriptions: string;
  };
  form: {
    createTitle: string;
    editTitle: string;
    save: string;
    saving: string;
    cancel: string;
    featuresSection: string;
    limitsNote: string;
  };
  errors: {
    loadError: string;
    saveFailed: string;
    deactivateBlocked: string;
  };
  messages: {
    created: string;
    updated: string;
    deactivated: string;
  };
  featureKeys: {
    website_builder: string;
    online_booking: string;
    patients: string;
    appointments: string;
    services: string;
    billing: string;
    patient_portal: string;
    marketing_tracking: string;
    custom_domain: string;
    advanced_reports: string;
    unlimited_users: string;
    priority_support: string;
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
};

export const superAdminPlansDictionaries: Record<SupportedLocale, PlansDictionary> = {
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
      eyebrow: "Revenue configuration",
      title: "Plans Management",
      subtitle: "Manage RoyalCare subscription plans, pricing, limits, modules, and support levels.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      summary: "Plan Summary",
      searchFilters: "Search + Filters",
      plansList: "Plans List",
      comparison: "Plan Comparison Preview",
    },
    stats: {
      totalPlans: "Total Plans",
      activePlans: "Active Plans",
      mostPopularPlan: "Most Popular Plan",
      highestRevenuePlan: "Highest Revenue Plan",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by plan, module, or support level",
      all: "All",
      active: "Active",
      inactive: "Inactive",
      trialEnabled: "Trial Enabled",
      popular: "Popular Plans",
    },
    fields: {
      planName: "Plan Name",
      monthlyPrice: "Monthly Price",
      yearlyPrice: "Yearly Price",
      trialDuration: "Trial Duration",
      maxUsers: "Max Users",
      maxBranches: "Max Branches",
      includedModules: "Included Modules",
      supportLevel: "Support Level",
      status: "Status",
      actions: "Actions",
      code: "Plan Code",
      currency: "Currency",
      subscriptionsCount: "Subscriptions",
      displayOrder: "Display Order",
      maxPatients: "Max Patients",
      maxAppointmentsPerMonth: "Max Appointments / Month",
      nameEn: "Name (English)",
      nameAr: "Name (Arabic)",
      nameHe: "Name (Hebrew)",
      descriptionEn: "Description (English)",
      descriptionAr: "Description (Arabic)",
      descriptionHe: "Description (Hebrew)",
      isActive: "Active",
      isPublic: "Public (show on pricing page)",
      isPopular: "Mark as popular",
      isContactPricing: "Contact pricing (hide price)",
      features: "Features",
    },
    actions: {
      addNewPlan: "Add New Plan",
      viewPlan: "View Plan",
      editPlan: "Edit Plan",
      duplicatePlan: "Duplicate Plan",
      activate: "Activate",
      deactivate: "Deactivate",
      deletePlan: "Delete Plan",
      createPlan: "Create Plan",
      saveChanges: "Save Changes",
      moveUp: "Move up",
      moveDown: "Move down",
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
    statuses: {
      active: "Active",
      inactive: "Inactive",
    },
    values: {
      days: "days",
      featured: "Featured",
      mobileHint: "Mobile uses plan cards with one Actions menu per plan.",
      noTrial: "No trial",
      users: "users",
      branches: "branches",
      contactPricing: "Contact pricing",
      hidden: "Hidden",
      noLimit: "No limit",
      perYear: "/yr",
      subscriptions: "subscriptions",
    },
    form: {
      createTitle: "Create Plan",
      editTitle: "Edit Plan",
      save: "Save",
      saving: "Saving…",
      cancel: "Cancel",
      featuresSection: "Features",
      limitsNote: "Stored for future enforcement — not applied yet.",
    },
    errors: {
      loadError: "Plans could not be loaded. Please try again.",
      saveFailed: "Failed to save plan. Please try again.",
      deactivateBlocked: "This plan cannot be deactivated because it has active subscriptions.",
    },
    messages: {
      created: "Plan created successfully.",
      updated: "Plan updated successfully.",
      deactivated: "Plan deactivated successfully.",
    },
    featureKeys: {
      website_builder: "Website Builder",
      online_booking: "Online Booking",
      patients: "Patients",
      appointments: "Appointments",
      services: "Services",
      billing: "Billing",
      patient_portal: "Patient Portal",
      marketing_tracking: "Marketing Tracking",
      custom_domain: "Custom Domain",
      advanced_reports: "Advanced Reports",
      unlimited_users: "Unlimited Users",
      priority_support: "Priority Support",
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
      eyebrow: "إعدادات الإيرادات",
      title: "إدارة الباقات",
      subtitle: "إدارة باقات رويال كير والأسعار والحدود والوحدات ومستويات الدعم.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      summary: "ملخص الباقات",
      searchFilters: "البحث والفلاتر",
      plansList: "قائمة الباقات",
      comparison: "معاينة مقارنة الباقات",
    },
    stats: {
      totalPlans: "إجمالي الباقات",
      activePlans: "الباقات النشطة",
      mostPopularPlan: "الباقة الأكثر شيوعا",
      highestRevenuePlan: "أعلى باقة إيرادا",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث حسب الباقة أو الوحدة أو مستوى الدعم",
      all: "الكل",
      active: "نشط",
      inactive: "غير نشط",
      trialEnabled: "تجربة مفعلة",
      popular: "باقات شائعة",
    },
    fields: {
      planName: "اسم الباقة",
      monthlyPrice: "السعر الشهري",
      yearlyPrice: "السعر السنوي",
      trialDuration: "مدة التجربة",
      maxUsers: "الحد الأقصى للمستخدمين",
      maxBranches: "الحد الأقصى للفروع",
      includedModules: "الوحدات المشمولة",
      supportLevel: "مستوى الدعم",
      status: "الحالة",
      actions: "الإجراءات",
      code: "رمز الباقة",
      currency: "العملة",
      subscriptionsCount: "الاشتراكات",
      displayOrder: "ترتيب العرض",
      maxPatients: "الحد الأقصى للمرضى",
      maxAppointmentsPerMonth: "الحد الأقصى للمواعيد / شهر",
      nameEn: "الاسم (إنجليزي)",
      nameAr: "الاسم (عربي)",
      nameHe: "الاسم (عبري)",
      descriptionEn: "الوصف (إنجليزي)",
      descriptionAr: "الوصف (عربي)",
      descriptionHe: "الوصف (عبري)",
      isActive: "نشط",
      isPublic: "عام (يظهر في صفحة الأسعار)",
      isPopular: "تمييز كشائع",
      isContactPricing: "تسعير بالتواصل (إخفاء السعر)",
      features: "الميزات",
    },
    actions: {
      addNewPlan: "إضافة باقة جديدة",
      viewPlan: "عرض الباقة",
      editPlan: "تعديل الباقة",
      duplicatePlan: "نسخ الباقة",
      activate: "تفعيل",
      deactivate: "تعطيل",
      deletePlan: "حذف الباقة",
      createPlan: "إنشاء باقة",
      saveChanges: "حفظ التغييرات",
      moveUp: "تحريك لأعلى",
      moveDown: "تحريك لأسفل",
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
    statuses: {
      active: "نشط",
      inactive: "غير نشط",
    },
    values: {
      days: "أيام",
      featured: "مميزة",
      mobileHint: "في الجوال تظهر الباقات كبطاقات مع قائمة إجراءات واحدة لكل باقة.",
      noTrial: "بدون تجربة",
      users: "مستخدمين",
      branches: "فروع",
      contactPricing: "تسعير بالتواصل",
      hidden: "مخفية",
      noLimit: "بلا حد",
      perYear: "/سنة",
      subscriptions: "اشتراكات",
    },
    form: {
      createTitle: "إنشاء باقة",
      editTitle: "تعديل الباقة",
      save: "حفظ",
      saving: "جارٍ الحفظ…",
      cancel: "إلغاء",
      featuresSection: "الميزات",
      limitsNote: "محفوظة للتطبيق المستقبلي — غير مفعلة بعد.",
    },
    errors: {
      loadError: "تعذر تحميل الباقات. يرجى المحاولة مرة أخرى.",
      saveFailed: "فشل حفظ الباقة. يرجى المحاولة مرة أخرى.",
      deactivateBlocked: "لا يمكن تعطيل هذه الباقة لأنها تحتوي على اشتراكات نشطة.",
    },
    messages: {
      created: "تم إنشاء الباقة بنجاح.",
      updated: "تم تحديث الباقة بنجاح.",
      deactivated: "تم تعطيل الباقة بنجاح.",
    },
    featureKeys: {
      website_builder: "منشئ المواقع",
      online_booking: "الحجز الإلكتروني",
      patients: "المرضى",
      appointments: "المواعيد",
      services: "الخدمات",
      billing: "الفواتير",
      patient_portal: "بوابة المريض",
      marketing_tracking: "تتبع التسويق",
      custom_domain: "نطاق مخصص",
      advanced_reports: "تقارير متقدمة",
      unlimited_users: "مستخدمون غير محدودين",
      priority_support: "دعم أولوي",
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
      eyebrow: "הגדרות הכנסה",
      title: "ניהול תוכניות",
      subtitle: "ניהול תוכניות RoyalCare, מחירים, מגבלות, מודולים ורמות תמיכה.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      summary: "סיכום תוכניות",
      searchFilters: "חיפוש וסינון",
      plansList: "רשימת תוכניות",
      comparison: "תצוגת השוואת תוכניות",
    },
    stats: {
      totalPlans: "סך תוכניות",
      activePlans: "תוכניות פעילות",
      mostPopularPlan: "התוכנית הפופולרית ביותר",
      highestRevenuePlan: "התוכנית עם ההכנסה הגבוהה ביותר",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי תוכנית, מודול או רמת תמיכה",
      all: "הכל",
      active: "פעיל",
      inactive: "לא פעיל",
      trialEnabled: "ניסיון פעיל",
      popular: "תוכניות פופולריות",
    },
    fields: {
      planName: "שם תוכנית",
      monthlyPrice: "מחיר חודשי",
      yearlyPrice: "מחיר שנתי",
      trialDuration: "משך ניסיון",
      maxUsers: "מקסימום משתמשים",
      maxBranches: "מקסימום סניפים",
      includedModules: "מודולים כלולים",
      supportLevel: "רמת תמיכה",
      status: "סטטוס",
      actions: "פעולות",
      code: "קוד תוכנית",
      currency: "מטבע",
      subscriptionsCount: "מינויים",
      displayOrder: "סדר תצוגה",
      maxPatients: "מקסימום מטופלים",
      maxAppointmentsPerMonth: "מקסימום תורים / חודש",
      nameEn: "שם (אנגלית)",
      nameAr: "שם (ערבית)",
      nameHe: "שם (עברית)",
      descriptionEn: "תיאור (אנגלית)",
      descriptionAr: "תיאור (ערבית)",
      descriptionHe: "תיאור (עברית)",
      isActive: "פעיל",
      isPublic: "ציבורי (מוצג בדף מחירים)",
      isPopular: "סמן כפופולרי",
      isContactPricing: "תמחור ביצירת קשר (הסתר מחיר)",
      features: "תכונות",
    },
    actions: {
      addNewPlan: "הוספת תוכנית חדשה",
      viewPlan: "צפייה בתוכנית",
      editPlan: "עריכת תוכנית",
      duplicatePlan: "שכפול תוכנית",
      activate: "הפעלה",
      deactivate: "השבתה",
      deletePlan: "מחיקת תוכנית",
      createPlan: "יצירת תוכנית",
      saveChanges: "שמור שינויים",
      moveUp: "הזז למעלה",
      moveDown: "הזז למטה",
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
    statuses: {
      active: "פעיל",
      inactive: "לא פעיל",
    },
    values: {
      days: "ימים",
      featured: "מומלץ",
      mobileHint: "במובייל התוכניות מוצגות ככרטיסים עם תפריט פעולות אחד לכל תוכנית.",
      noTrial: "ללא ניסיון",
      users: "משתמשים",
      branches: "סניפים",
      contactPricing: "תמחור ביצירת קשר",
      hidden: "מוסתר",
      noLimit: "ללא הגבלה",
      perYear: "/שנה",
      subscriptions: "מינויים",
    },
    form: {
      createTitle: "יצירת תוכנית",
      editTitle: "עריכת תוכנית",
      save: "שמור",
      saving: "שומר…",
      cancel: "ביטול",
      featuresSection: "תכונות",
      limitsNote: "שמור לאכיפה עתידית — אינו מוחל עדיין.",
    },
    errors: {
      loadError: "לא ניתן לטעון תוכניות. נסה שוב.",
      saveFailed: "שמירת התוכנית נכשלה. נסה שוב.",
      deactivateBlocked: "לא ניתן להשבית תוכנית זו כי יש לה מינויים פעילים.",
    },
    messages: {
      created: "התוכנית נוצרה בהצלחה.",
      updated: "התוכנית עודכנה בהצלחה.",
      deactivated: "התוכנית הושבתה בהצלחה.",
    },
    featureKeys: {
      website_builder: "בונה אתרים",
      online_booking: "הזמנה אונליין",
      patients: "מטופלים",
      appointments: "תורים",
      services: "שירותים",
      billing: "חיוב",
      patient_portal: "פורטל מטופלים",
      marketing_tracking: "מעקב שיווקי",
      custom_domain: "דומיין מותאם",
      advanced_reports: "דוחות מתקדמים",
      unlimited_users: "משתמשים ללא הגבלה",
      priority_support: "תמיכה מועדפת",
    },
  },
};
