import type { SupportedLocale } from "../locales";

type SettingsDictionary = {
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
    general: string;
    branding: string;
    security: string;
    notifications: string;
    subscriptionDefaults: string;
    domainDefaults: string;
    backupHealth: string;
    whatsapp: string;
  };
  fields: {
    platformName: string;
    defaultLanguage: string;
    supportedLanguages: string;
    defaultCurrency: string;
    timezone: string;
    dateFormat: string;
    platformLogo: string;
    primaryColor: string;
    secondaryColor: string;
    emailBranding: string;
    loginPageBranding: string;
    twoFactorDefault: string;
    passwordPolicy: string;
    sessionTimeout: string;
    loginAttemptLimit: string;
    forcePasswordReset: string;
    emailNotifications: string;
    whatsappNotifications: string;
    systemAlerts: string;
    paymentAlerts: string;
    subscriptionAlerts: string;
    defaultTrialDuration: string;
    gracePeriod: string;
    autoSuspensionRules: string;
    defaultSubdomainPattern: string;
    sslAutoRenewal: string;
    dnsVerificationRules: string;
    lastBackup: string;
    backupFrequency: string;
    systemStatus: string;
    databaseHealth: string;
    whatsappCountryCode: string;
    whatsappSupportPhone: string;
  };
  actions: {
    saveSettings: string;
    resetToDefault: string;
    backupNow: string;
  };
  values: {
    enabled: string;
    disabled: string;
    logoPreview: string;
    strongPasswordPolicy: string;
    afterGracePeriod: string;
    aCnameTxt: string;
    daily: string;
    operational: string;
    healthy: string;
    minutes: string;
    days: string;
    uiOnly: string;
    whatsapp970: string;
    whatsapp972: string;
    whatsappDescription: string;
    whatsappSaveSuccess: string;
    whatsappSaveError: string;
    whatsappSupportPhonePlaceholder: string;
    whatsappPhoneError: string;
    whatsappPhoneHelper: string;
  };
};

export const superAdminSettingsDictionaries: Record<SupportedLocale, SettingsDictionary> = {
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
      eyebrow: "Platform configuration",
      title: "Settings Management",
      subtitle: "Manage RoyalCare global platform, branding, security, notifications, subscriptions, domains, backup, and system health settings.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      general: "General Platform Settings",
      branding: "Branding Settings",
      security: "Security Settings",
      notifications: "Notification Settings",
      subscriptionDefaults: "Subscription Defaults",
      domainDefaults: "Domain Defaults",
      backupHealth: "Backup & System Health",
      whatsapp: "WhatsApp Settings",
    },
    fields: {
      platformName: "Platform Name",
      defaultLanguage: "Default Language",
      supportedLanguages: "Supported Languages",
      defaultCurrency: "Default Currency",
      timezone: "Timezone",
      dateFormat: "Date Format",
      platformLogo: "Platform Logo",
      primaryColor: "Primary Color",
      secondaryColor: "Secondary Color",
      emailBranding: "Email Branding",
      loginPageBranding: "Login Page Branding",
      twoFactorDefault: "Two-Factor Authentication Default",
      passwordPolicy: "Password Policy",
      sessionTimeout: "Session Timeout",
      loginAttemptLimit: "Login Attempt Limits",
      forcePasswordReset: "Force Password Reset",
      emailNotifications: "Email Notifications",
      whatsappNotifications: "WhatsApp Notifications",
      systemAlerts: "System Alerts",
      paymentAlerts: "Payment Alerts",
      subscriptionAlerts: "Subscription Alerts",
      defaultTrialDuration: "Default Trial Duration",
      gracePeriod: "Grace Period",
      autoSuspensionRules: "Auto Suspension Rules",
      defaultSubdomainPattern: "Default Subdomain Pattern",
      sslAutoRenewal: "SSL Auto Renewal",
      dnsVerificationRules: "DNS Verification Rules",
      lastBackup: "Last Backup",
      backupFrequency: "Backup Frequency",
      systemStatus: "System Status",
      databaseHealth: "Database Health",
      whatsappCountryCode: "Default WhatsApp Country Code",
      whatsappSupportPhone: "WhatsApp Support Number",
    },
    actions: {
      saveSettings: "Save Settings",
      resetToDefault: "Reset to Default",
      backupNow: "Backup Now",
    },
    values: {
      enabled: "Enabled",
      disabled: "Disabled",
      logoPreview: "RoyalCare logo preview",
      strongPasswordPolicy: "Strong policy: 12 characters, mixed case, number, and symbol",
      afterGracePeriod: "Suspend after grace period",
      aCnameTxt: "A, CNAME, and TXT record verification",
      daily: "Daily",
      operational: "Operational",
      healthy: "Healthy",
      minutes: "minutes",
      days: "days",
      uiOnly: "UI-only settings until backend configuration APIs are connected.",
      whatsapp970: "+970 — Palestine",
      whatsapp972: "+972 — Israel",
      whatsappDescription: "Applied when a stored phone number has no country code prefix.",
      whatsappSaveSuccess: "WhatsApp settings saved.",
      whatsappSaveError: "Failed to save. Please try again.",
      whatsappSupportPhonePlaceholder: "e.g. 0598397660",
      whatsappPhoneError: "Enter 7–10 digits (digits only).",
      whatsappPhoneHelper: "Combined with the country code when opening WhatsApp. A leading 0 will be removed automatically.",
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
      eyebrow: "إعدادات المنصة",
      title: "إدارة الإعدادات",
      subtitle: "إدارة إعدادات RoyalCare العامة والعلامة التجارية والأمان والإشعارات والاشتراكات والنطاقات والنسخ الاحتياطي وصحة النظام.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      general: "إعدادات المنصة العامة",
      branding: "إعدادات العلامة التجارية",
      security: "إعدادات الأمان",
      notifications: "إعدادات الإشعارات",
      subscriptionDefaults: "افتراضيات الاشتراك",
      domainDefaults: "افتراضيات النطاقات",
      backupHealth: "النسخ الاحتياطي وصحة النظام",
      whatsapp: "إعدادات واتساب",
    },
    fields: {
      platformName: "اسم المنصة",
      defaultLanguage: "اللغة الافتراضية",
      supportedLanguages: "اللغات المدعومة",
      defaultCurrency: "العملة الافتراضية",
      timezone: "المنطقة الزمنية",
      dateFormat: "تنسيق التاريخ",
      platformLogo: "شعار المنصة",
      primaryColor: "اللون الأساسي",
      secondaryColor: "اللون الثانوي",
      emailBranding: "هوية البريد الإلكتروني",
      loginPageBranding: "هوية صفحة الدخول",
      twoFactorDefault: "المصادقة الثنائية افتراضياً",
      passwordPolicy: "سياسة كلمة المرور",
      sessionTimeout: "مهلة الجلسة",
      loginAttemptLimit: "حد محاولات الدخول",
      forcePasswordReset: "فرض إعادة تعيين كلمة المرور",
      emailNotifications: "إشعارات البريد الإلكتروني",
      whatsappNotifications: "إشعارات واتساب",
      systemAlerts: "تنبيهات النظام",
      paymentAlerts: "تنبيهات الدفع",
      subscriptionAlerts: "تنبيهات الاشتراك",
      defaultTrialDuration: "مدة التجربة الافتراضية",
      gracePeriod: "فترة السماح",
      autoSuspensionRules: "قواعد الإيقاف التلقائي",
      defaultSubdomainPattern: "نمط النطاق الفرعي الافتراضي",
      sslAutoRenewal: "تجديد SSL التلقائي",
      dnsVerificationRules: "قواعد التحقق من DNS",
      lastBackup: "آخر نسخة احتياطية",
      backupFrequency: "تكرار النسخ الاحتياطي",
      systemStatus: "حالة النظام",
      databaseHealth: "صحة قاعدة البيانات",
      whatsappCountryCode: "مفتاح الدولة الافتراضي لواتساب",
      whatsappSupportPhone: "رقم واتساب الدعم",
    },
    actions: {
      saveSettings: "حفظ الإعدادات",
      resetToDefault: "إعادة للوضع الافتراضي",
      backupNow: "نسخ احتياطي الآن",
    },
    values: {
      enabled: "مفعل",
      disabled: "معطل",
      logoPreview: "معاينة شعار RoyalCare",
      strongPasswordPolicy: "سياسة قوية: 12 حرفاً مع أحرف كبيرة وصغيرة ورقم ورمز",
      afterGracePeriod: "الإيقاف بعد فترة السماح",
      aCnameTxt: "التحقق عبر سجلات A و CNAME و TXT",
      daily: "يومي",
      operational: "يعمل",
      healthy: "سليم",
      minutes: "دقائق",
      days: "أيام",
      uiOnly: "الإعدادات واجهة فقط إلى أن يتم ربط واجهات إعدادات الخادم.",
      whatsapp970: "+970 — فلسطين",
      whatsapp972: "+972 — إسرائيل",
      whatsappDescription: "يُطبّق عند غياب مفتاح الدولة في رقم الهاتف المخزّن.",
      whatsappSaveSuccess: "تم حفظ إعدادات واتساب.",
      whatsappSaveError: "فشل الحفظ. يرجى المحاولة مرة أخرى.",
      whatsappSupportPhonePlaceholder: "مثال: 0598397660",
      whatsappPhoneError: "أدخل 7–10 أرقام فقط.",
      whatsappPhoneHelper: "سيتم دمج هذا الرقم مع مفتاح الدولة عند فتح واتساب. إذا كان الرقم يبدأ بـ 0 سيتم حذفه تلقائيًا.",
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
      eyebrow: "הגדרות מערכת",
      title: "ניהול הגדרות",
      subtitle: "ניהול הגדרות גלובליות של RoyalCare: פלטפורמה, מיתוג, אבטחה, התראות, מינויים, דומיינים, גיבוי ובריאות מערכת.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      general: "הגדרות פלטפורמה כלליות",
      branding: "הגדרות מיתוג",
      security: "הגדרות אבטחה",
      notifications: "הגדרות התראות",
      subscriptionDefaults: "ברירות מחדל למינויים",
      domainDefaults: "ברירות מחדל לדומיינים",
      backupHealth: "גיבוי ובריאות מערכת",
      whatsapp: "הגדרות WhatsApp",
    },
    fields: {
      platformName: "שם הפלטפורמה",
      defaultLanguage: "שפת ברירת מחדל",
      supportedLanguages: "שפות נתמכות",
      defaultCurrency: "מטבע ברירת מחדל",
      timezone: "אזור זמן",
      dateFormat: "פורמט תאריך",
      platformLogo: "לוגו הפלטפורמה",
      primaryColor: "צבע ראשי",
      secondaryColor: "צבע משני",
      emailBranding: "מיתוג אימייל",
      loginPageBranding: "מיתוג דף כניסה",
      twoFactorDefault: "אימות דו-שלבי כברירת מחדל",
      passwordPolicy: "מדיניות סיסמה",
      sessionTimeout: "זמן תפוגת סשן",
      loginAttemptLimit: "מגבלת ניסיונות כניסה",
      forcePasswordReset: "איפוס סיסמה כפוי",
      emailNotifications: "התראות אימייל",
      whatsappNotifications: "התראות WhatsApp",
      systemAlerts: "התראות מערכת",
      paymentAlerts: "התראות תשלום",
      subscriptionAlerts: "התראות מינוי",
      defaultTrialDuration: "משך ניסיון ברירת מחדל",
      gracePeriod: "תקופת חסד",
      autoSuspensionRules: "כללי השעיה אוטומטית",
      defaultSubdomainPattern: "תבנית תת-דומיין",
      sslAutoRenewal: "חידוש SSL אוטומטי",
      dnsVerificationRules: "כללי אימות DNS",
      lastBackup: "גיבוי אחרון",
      backupFrequency: "תדירות גיבוי",
      systemStatus: "סטטוס מערכת",
      databaseHealth: "בריאות מסד נתונים",
      whatsappCountryCode: "קידומת ברירת מחדל ל-WhatsApp",
      whatsappSupportPhone: "מספר WhatsApp תמיכה",
    },
    actions: {
      saveSettings: "שמירת הגדרות",
      resetToDefault: "איפוס לברירת מחדל",
      backupNow: "גיבוי עכשיו",
    },
    values: {
      enabled: "פעיל",
      disabled: "כבוי",
      logoPreview: "תצוגת לוגו RoyalCare",
      strongPasswordPolicy: "מדיניות חזקה: 12 תווים, אותיות גדולות וקטנות, מספר וסימן",
      afterGracePeriod: "השעה לאחר תקופת החסד",
      aCnameTxt: "אימות רשומות A, CNAME ו-TXT",
      daily: "יומי",
      operational: "פעיל",
      healthy: "תקין",
      minutes: "דקות",
      days: "ימים",
      uiOnly: "ההגדרות הן ממשק בלבד עד לחיבור API של הגדרות השרת.",
      whatsapp970: "+970 — פלסטין",
      whatsapp972: "+972 — ישראל",
      whatsappDescription: "מוחל כאשר למספר הטלפון המאוחסן אין קידומת מדינה.",
      whatsappSaveSuccess: "הגדרות WhatsApp נשמרו.",
      whatsappSaveError: "שמירה נכשלה. אנא נסה שוב.",
      whatsappSupportPhonePlaceholder: "לדוגמה: 0598397660",
      whatsappPhoneError: "יש להזין 7–10 ספרות בלבד.",
      whatsappPhoneHelper: "ישולב עם קידומת המדינה בעת פתיחת WhatsApp. ספרת 0 בתחילה תוסר אוטומטית.",
    },
  },
};
