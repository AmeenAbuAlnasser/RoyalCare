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
  };
  actions: {
    addNewPlan: string;
    viewPlan: string;
    editPlan: string;
    duplicatePlan: string;
    activate: string;
    deactivate: string;
    deletePlan: string;
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
  values: {
    days: string;
    featured: string;
    mobileHint: string;
    noTrial: string;
    users: string;
    branches: string;
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
    },
    actions: {
      addNewPlan: "Add New Plan",
      viewPlan: "View Plan",
      editPlan: "Edit Plan",
      duplicatePlan: "Duplicate Plan",
      activate: "Activate",
      deactivate: "Deactivate",
      deletePlan: "Delete Plan",
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
    },
    actions: {
      addNewPlan: "إضافة باقة جديدة",
      viewPlan: "عرض الباقة",
      editPlan: "تعديل الباقة",
      duplicatePlan: "نسخ الباقة",
      activate: "تفعيل",
      deactivate: "تعطيل",
      deletePlan: "حذف الباقة",
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
    },
    actions: {
      addNewPlan: "הוספת תוכנית חדשה",
      viewPlan: "צפייה בתוכנית",
      editPlan: "עריכת תוכנית",
      duplicatePlan: "שכפול תוכנית",
      activate: "הפעלה",
      deactivate: "השבתה",
      deletePlan: "מחיקת תוכנית",
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
    },
  },
};
