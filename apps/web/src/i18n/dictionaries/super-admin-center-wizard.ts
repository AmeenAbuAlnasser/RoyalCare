import type { SupportedLocale } from "../locales";

export type CenterWizardDictionary = {
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
  wizard: {
    pageEyebrow: string;
    pageTitle: string;
    pageSubtitle: string;
    progress: string;
    backToCenters: string;
    previous: string;
    next: string;
    confirm: string;
    createCenter: string;
    saveDraft: string;
    mockNotice: string;
    enabled: string;
    disabled: string;
    enabledLanguageSummary: string;
    noLanguagesSelected: string;
    chooseLogo: string;
    selectedLogo: string;
    noLogoSelected: string;
    logoPreviewAlt: string;
    datePickerHint: string;
    uploadHint: string;
    reviewHint: string;
    reviewWarning: string;
    saveSuccess: string;
    saveError: string;
    saving: string;
  };
  steps: {
    basicInfo: string;
    subscription: string;
    domain: string;
    branding: string;
    adminAccount: string;
    review: string;
  };
  groups: {
    centerIdentity: string;
    contactDetails: string;
    planSetup: string;
    domainRouting: string;
    brandSystem: string;
    languageSetup: string;
    adminIdentity: string;
    accessSetup: string;
    notificationPreferences: string;
    reviewCenter: string;
    reviewSubscription: string;
    reviewDomain: string;
    reviewBranding: string;
    reviewAdmin: string;
  };
  fields: {
    centerName: string;
    ownerName: string;
    phone: string;
    email: string;
    primaryCategory: string;
    servicesOffered: string;
    customServiceName: string;
    subscriptionPlan: string;
    startDate: string;
    expiryDate: string;
    autoRenewal: string;
    customDomain: string;
    subdomain: string;
    dnsStatus: string;
    logoUpload: string;
    primaryColor: string;
    secondaryColor: string;
    defaultLanguage: string;
    enabledLanguages: string;
    adminName: string;
    adminEmail: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
    permissionsPreset: string;
    allowWhatsappNotifications: string;
    allowEmailNotifications: string;
    twoFactorAuthentication: string;
    accountStatus: string;
  };
  validation: {
    invalidEmail: string;
    passwordMismatch: string;
    requiredField: string;
  };
  dateParts: {
    day: string;
    month: string;
    year: string;
  };
  placeholders: {
    centerName: string;
    ownerName: string;
    phone: string;
    email: string;
    customDomain: string;
    subdomain: string;
    customServiceName: string;
    adminName: string;
    adminEmail: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
    startDate: string;
    expiryDate: string;
  };
  mockValues: {
    startDate: string;
    expiryDate: string;
  };
  primaryCategories: {
    medicalCenter: string;
    beautyCenter: string;
    wellnessCenter: string;
    multiSpecialtyCenter: string;
    other: string;
  };
  offeredServices: {
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
  plans: {
    trial: string;
    starter: string;
    professional: string;
    enterprise: string;
  };
  dnsStatuses: {
    pending: string;
    verified: string;
    failed: string;
  };
  languageNames: Record<SupportedLocale, string>;
  permissionPresets: {
    fullAccess: string;
    standardManagement: string;
    limitedAccess: string;
    customPermissions: string;
  };
  accountStatuses: {
    active: string;
    pendingActivation: string;
  };
};

export const superAdminCenterWizardDictionaries: Record<
  SupportedLocale,
  CenterWizardDictionary
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
      title: "Add New Center",
      subtitle: "Create a new center tenant with subscription, domain, branding, and admin access.",
      language: "Language",
      account: "Platform Admin",
    },
    wizard: {
      pageEyebrow: "Center setup wizard",
      pageTitle: "Add New Center",
      pageSubtitle: "Prepare the center profile, subscription, domain, branding, languages, and first admin account.",
      progress: "Step",
      backToCenters: "Back to Centers",
      previous: "Previous",
      next: "Next",
      confirm: "Confirm Center",
      createCenter: "Create Center",
      saveDraft: "Save Draft",
      mockNotice: "UI only. Values are mock placeholders and are not saved yet.",
      enabled: "Enabled",
      disabled: "Disabled",
      enabledLanguageSummary: "Arabic, Hebrew, English",
      noLanguagesSelected: "No languages selected",
      chooseLogo: "Choose logo",
      selectedLogo: "Selected file",
      noLogoSelected: "No logo selected",
      logoPreviewAlt: "Selected center logo preview",
      datePickerHint: "Select day, month, and year. Stored value remains YYYY-MM-DD.",
      uploadHint: "Choose an image file. This preview is local only and is not uploaded yet.",
      reviewHint: "Review the mock setup before future backend integration.",
      reviewWarning: "Please review all information carefully before creating the center.",
      saveSuccess: "Center created successfully. Redirecting to Centers Management.",
      saveError: "Center could not be created. Check the required fields and API server.",
      saving: "Creating...",
    },
    steps: {
      basicInfo: "Center Basic Info",
      subscription: "Subscription Plan",
      domain: "Domain Setup",
      branding: "Branding + Languages",
      adminAccount: "Center Admin Account",
      review: "Review + Confirm",
    },
    groups: {
      centerIdentity: "Center identity",
      contactDetails: "Contact details",
      planSetup: "Plan setup",
      domainRouting: "Domain routing",
      brandSystem: "Brand system",
      languageSetup: "Language setup",
      adminIdentity: "Admin identity",
      accessSetup: "Access setup",
      notificationPreferences: "Notification preferences",
      reviewCenter: "Center",
      reviewSubscription: "Subscription",
      reviewDomain: "Domain",
      reviewBranding: "Branding",
      reviewAdmin: "Admin",
    },
    fields: {
      centerName: "Center Name",
      ownerName: "Owner Name",
      phone: "Phone",
      email: "Email",
      primaryCategory: "Primary Category",
      servicesOffered: "Services Offered",
      customServiceName: "Custom service name",
      subscriptionPlan: "Subscription Plan",
      startDate: "Start Date",
      expiryDate: "Expiry Date",
      autoRenewal: "Auto Renewal",
      customDomain: "Custom Domain",
      subdomain: "Subdomain Option",
      dnsStatus: "DNS Verification Status",
      logoUpload: "Center Logo",
      primaryColor: "Primary Color",
      secondaryColor: "Secondary Color",
      defaultLanguage: "Default Language",
      enabledLanguages: "Enabled Languages",
      adminName: "Admin Full Name",
      adminEmail: "Admin Email",
      mobileNumber: "Mobile Number",
      password: "Password",
      confirmPassword: "Confirm Password",
      permissionsPreset: "Permissions Preset",
      allowWhatsappNotifications: "Allow WhatsApp notifications",
      allowEmailNotifications: "Allow Email notifications",
      twoFactorAuthentication: "Two-factor authentication",
      accountStatus: "Account Status",
    },
    validation: {
      invalidEmail: "Enter a valid email address.",
      passwordMismatch: "Passwords do not match.",
      requiredField: "Required",
    },
    dateParts: {
      day: "Day",
      month: "Month",
      year: "Year",
    },
    placeholders: {
      centerName: "Nova Laser Center",
      ownerName: "Maya Cohen",
      phone: "+972 50 000 0000",
      email: "owner@example.com",
      customDomain: "center-domain.com",
      subdomain: "nova.royalcare.app",
      customServiceName: "Enter service name",
      adminName: "Center Admin",
      adminEmail: "admin@center-domain.com",
      mobileNumber: "+972 50 000 0000",
      password: "Create temporary password",
      confirmPassword: "Repeat temporary password",
      startDate: "yyyy-mm-dd",
      expiryDate: "yyyy-mm-dd",
    },
    mockValues: {
      startDate: "2026-04-26",
      expiryDate: "2026-05-26",
    },
    primaryCategories: {
      medicalCenter: "Medical Center",
      beautyCenter: "Beauty Center",
      wellnessCenter: "Wellness Center",
      multiSpecialtyCenter: "Multi-Specialty Center",
      other: "Other",
    },
    offeredServices: {
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
    plans: {
      trial: "Trial",
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    },
    dnsStatuses: {
      pending: "Pending",
      verified: "Verified",
      failed: "Failed",
    },
    languageNames: {
      ar: "Arabic",
      he: "Hebrew",
      en: "English",
    },
    permissionPresets: {
      fullAccess: "Full Access",
      standardManagement: "Standard Management",
      limitedAccess: "Limited Access",
      customPermissions: "Custom Permissions",
    },
    accountStatuses: {
      active: "Active",
      pendingActivation: "Pending Activation",
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
      title: "إضافة مركز جديد",
      subtitle: "إنشاء مركز جديد مع الاشتراك والنطاق والهوية وحساب المدير.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    wizard: {
      pageEyebrow: "معالج إعداد المركز",
      pageTitle: "إضافة مركز جديد",
      pageSubtitle: "جهز ملف المركز والاشتراك والنطاق والهوية واللغات وحساب المدير الأول.",
      progress: "الخطوة",
      backToCenters: "العودة إلى المراكز",
      previous: "السابق",
      next: "التالي",
      confirm: "تأكيد المركز",
      createCenter: "إنشاء المركز",
      saveDraft: "حفظ كمسودة",
      mockNotice: "واجهة فقط. القيم أمثلة تجريبية ولا يتم حفظها حاليا.",
      enabled: "مفعل",
      disabled: "غير مفعل",
      enabledLanguageSummary: "العربية، العبرية، الإنجليزية",
      noLanguagesSelected: "لم يتم اختيار أي لغة",
      chooseLogo: "اختيار الشعار",
      selectedLogo: "الملف المختار",
      noLogoSelected: "لم يتم اختيار شعار",
      logoPreviewAlt: "معاينة شعار المركز المختار",
      datePickerHint: "اختر اليوم والشهر والسنة. تبقى القيمة المخزنة بصيغة YYYY-MM-DD.",
      uploadHint: "اختر ملف صورة. المعاينة محلية فقط ولا يتم رفعها حاليا.",
      reviewHint: "راجع إعدادات المثال قبل ربطها لاحقا بالخلفية.",
      reviewWarning: "يرجى مراجعة جميع المعلومات بعناية قبل إنشاء المركز.",
      saveSuccess: "تم إنشاء المركز بنجاح. جار الانتقال إلى إدارة المراكز.",
      saveError: "تعذر إنشاء المركز. تحقق من الحقول المطلوبة وخادم API.",
      saving: "جار الإنشاء...",
    },
    steps: {
      basicInfo: "معلومات المركز الأساسية",
      subscription: "باقة الاشتراك",
      domain: "إعداد النطاق",
      branding: "الهوية واللغات",
      adminAccount: "حساب مدير المركز",
      review: "مراجعة وتأكيد",
    },
    groups: {
      centerIdentity: "هوية المركز",
      contactDetails: "بيانات التواصل",
      planSetup: "إعداد الباقة",
      domainRouting: "توجيه النطاق",
      brandSystem: "نظام الهوية",
      languageSetup: "إعداد اللغات",
      adminIdentity: "هوية المدير",
      accessSetup: "إعداد الصلاحيات",
      notificationPreferences: "تفضيلات الإشعارات",
      reviewCenter: "المركز",
      reviewSubscription: "الاشتراك",
      reviewDomain: "النطاق",
      reviewBranding: "الهوية",
      reviewAdmin: "المدير",
    },
    fields: {
      centerName: "اسم المركز",
      ownerName: "اسم المالك",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      primaryCategory: "الفئة الرئيسية",
      servicesOffered: "الخدمات المقدمة",
      customServiceName: "اسم الخدمة المخصصة",
      subscriptionPlan: "باقة الاشتراك",
      startDate: "تاريخ البداية",
      expiryDate: "تاريخ الانتهاء",
      autoRenewal: "التجديد التلقائي",
      customDomain: "النطاق المخصص",
      subdomain: "خيار النطاق الفرعي",
      dnsStatus: "حالة توثيق DNS",
      logoUpload: "شعار المركز",
      primaryColor: "اللون الأساسي",
      secondaryColor: "اللون الثانوي",
      defaultLanguage: "اللغة الافتراضية",
      enabledLanguages: "اللغات المفعلة",
      adminName: "الاسم الكامل للمدير",
      adminEmail: "بريد المدير",
      mobileNumber: "رقم الجوال",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      permissionsPreset: "نموذج الصلاحيات",
      allowWhatsappNotifications: "السماح بإشعارات واتساب",
      allowEmailNotifications: "السماح بإشعارات البريد الإلكتروني",
      twoFactorAuthentication: "المصادقة الثنائية",
      accountStatus: "حالة الحساب",
    },
    validation: {
      invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا.",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
      requiredField: "مطلوب",
    },
    dateParts: {
      day: "اليوم",
      month: "الشهر",
      year: "السنة",
    },
    placeholders: {
      centerName: "مركز نوفا ليزر",
      ownerName: "مايا كوهين",
      phone: "+972 50 000 0000",
      email: "owner@example.com",
      customDomain: "center-domain.com",
      subdomain: "nova.royalcare.app",
      customServiceName: "أدخل اسم الخدمة",
      adminName: "مدير المركز",
      adminEmail: "admin@center-domain.com",
      mobileNumber: "+972 50 000 0000",
      password: "إنشاء كلمة مرور مؤقتة",
      confirmPassword: "إعادة كتابة كلمة المرور المؤقتة",
      startDate: "يوم/شهر/سنة",
      expiryDate: "يوم/شهر/سنة",
    },
    mockValues: {
      startDate: "26/04/2026",
      expiryDate: "26/05/2026",
    },
    primaryCategories: {
      medicalCenter: "مركز طبي",
      beautyCenter: "مركز تجميل",
      wellnessCenter: "مركز عافية",
      multiSpecialtyCenter: "مركز متعدد التخصصات",
      other: "أخرى",
    },
    offeredServices: {
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
    plans: {
      trial: "تجربة",
      starter: "البداية",
      professional: "الاحترافية",
      enterprise: "المؤسسات",
    },
    dnsStatuses: {
      pending: "قيد الانتظار",
      verified: "موثق",
      failed: "فشل",
    },
    languageNames: {
      ar: "العربية",
      he: "العبرية",
      en: "الإنجليزية",
    },
    permissionPresets: {
      fullAccess: "صلاحيات كاملة",
      standardManagement: "إدارة قياسية",
      limitedAccess: "صلاحيات محدودة",
      customPermissions: "صلاحيات مخصصة",
    },
    accountStatuses: {
      active: "نشط",
      pendingActivation: "بانتظار التفعيل",
    },
  },
  he: {
    brand: {
      name: "רויקאר",
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
      title: "הוספת מרכז חדש",
      subtitle: "יצירת מרכז חדש עם מינוי, דומיין, מיתוג וגישת מנהל.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    wizard: {
      pageEyebrow: "אשף הקמת מרכז",
      pageTitle: "הוספת מרכז חדש",
      pageSubtitle: "הכנת פרופיל המרכז, המינוי, הדומיין, המיתוג, השפות וחשבון המנהל הראשון.",
      progress: "שלב",
      backToCenters: "חזרה למרכזים",
      previous: "הקודם",
      next: "הבא",
      confirm: "אישור המרכז",
      createCenter: "יצירת מרכז",
      saveDraft: "שמירת טיוטה",
      mockNotice: "ממשק בלבד. הערכים הם דוגמאות ולא נשמרים כרגע.",
      enabled: "פעיל",
      disabled: "כבוי",
      enabledLanguageSummary: "ערבית, עברית, אנגלית",
      noLanguagesSelected: "לא נבחרו שפות",
      chooseLogo: "בחירת לוגו",
      selectedLogo: "קובץ נבחר",
      noLogoSelected: "לא נבחר לוגו",
      logoPreviewAlt: "תצוגה מקדימה של לוגו המרכז",
      datePickerHint: "בחרו יום, חודש ושנה. הערך נשמר בפורמט YYYY-MM-DD.",
      uploadHint: "בחרו קובץ תמונה. התצוגה מקומית בלבד ולא נשלחת עדיין.",
      reviewHint: "בדקו את הגדרות הדוגמה לפני חיבור עתידי לשרת.",
      reviewWarning: "יש לבדוק את כל המידע בקפידה לפני יצירת המרכז.",
      saveSuccess: "המרכז נוצר בהצלחה. עוברים לניהול המרכזים.",
      saveError: "לא ניתן ליצור את המרכז. בדקו את שדות החובה ואת שרת ה-API.",
      saving: "יוצר...",
    },
    steps: {
      basicInfo: "פרטי מרכז בסיסיים",
      subscription: "תוכנית מינוי",
      domain: "הגדרת דומיין",
      branding: "מיתוג ושפות",
      adminAccount: "חשבון מנהל מרכז",
      review: "סקירה ואישור",
    },
    groups: {
      centerIdentity: "זהות המרכז",
      contactDetails: "פרטי קשר",
      planSetup: "הגדרת תוכנית",
      domainRouting: "ניתוב דומיין",
      brandSystem: "מערכת מיתוג",
      languageSetup: "הגדרת שפות",
      adminIdentity: "זהות מנהל",
      accessSetup: "הגדרת הרשאות",
      notificationPreferences: "העדפות התראות",
      reviewCenter: "מרכז",
      reviewSubscription: "מינוי",
      reviewDomain: "דומיין",
      reviewBranding: "מיתוג",
      reviewAdmin: "מנהל",
    },
    fields: {
      centerName: "שם המרכז",
      ownerName: "שם הבעלים",
      phone: "טלפון",
      email: "אימייל",
      primaryCategory: "קטגוריה ראשית",
      servicesOffered: "שירותים מוצעים",
      customServiceName: "שם שירות מותאם",
      subscriptionPlan: "תוכנית מינוי",
      startDate: "תאריך התחלה",
      expiryDate: "תאריך סיום",
      autoRenewal: "חידוש אוטומטי",
      customDomain: "דומיין מותאם",
      subdomain: "אפשרות תת דומיין",
      dnsStatus: "סטטוס אימות DNS",
      logoUpload: "לוגו המרכז",
      primaryColor: "צבע ראשי",
      secondaryColor: "צבע משני",
      defaultLanguage: "שפת ברירת מחדל",
      enabledLanguages: "שפות פעילות",
      adminName: "שם מלא של מנהל",
      adminEmail: "אימייל מנהל",
      mobileNumber: "מספר נייד",
      password: "סיסמה",
      confirmPassword: "אימות סיסמה",
      permissionsPreset: "תבנית הרשאות",
      allowWhatsappNotifications: "אפשר התראות WhatsApp",
      allowEmailNotifications: "אפשר התראות אימייל",
      twoFactorAuthentication: "אימות דו-שלבי",
      accountStatus: "סטטוס חשבון",
    },
    validation: {
      invalidEmail: "יש להזין כתובת אימייל תקינה.",
      passwordMismatch: "הסיסמאות אינן תואמות.",
      requiredField: "שדה חובה",
    },
    dateParts: {
      day: "יום",
      month: "חודש",
      year: "שנה",
    },
    placeholders: {
      centerName: "מרכז נובה לייזר",
      ownerName: "מאיה כהן",
      phone: "+972 50 000 0000",
      email: "owner@example.com",
      customDomain: "center-domain.com",
      subdomain: "nova.royalcare.app",
      customServiceName: "הזנת שם השירות",
      adminName: "מנהל המרכז",
      adminEmail: "admin@center-domain.com",
      mobileNumber: "+972 50 000 0000",
      password: "יצירת סיסמה זמנית",
      confirmPassword: "הקלדת הסיסמה הזמנית שוב",
      startDate: "יום/חודש/שנה",
      expiryDate: "יום/חודש/שנה",
    },
    mockValues: {
      startDate: "26/04/2026",
      expiryDate: "26/05/2026",
    },
    primaryCategories: {
      medicalCenter: "מרכז רפואי",
      beautyCenter: "מרכז יופי",
      wellnessCenter: "מרכז בריאות",
      multiSpecialtyCenter: "מרכז רב-תחומי",
      other: "אחר",
    },
    offeredServices: {
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
    plans: {
      trial: "ניסיון",
      starter: "מתחילים",
      professional: "מקצועי",
      enterprise: "ארגוני",
    },
    dnsStatuses: {
      pending: "ממתין",
      verified: "מאומת",
      failed: "נכשל",
    },
    languageNames: {
      ar: "ערבית",
      he: "עברית",
      en: "אנגלית",
    },
    permissionPresets: {
      fullAccess: "גישה מלאה",
      standardManagement: "ניהול רגיל",
      limitedAccess: "גישה מוגבלת",
      customPermissions: "הרשאות מותאמות",
    },
    accountStatuses: {
      active: "פעיל",
      pendingActivation: "ממתין להפעלה",
    },
  },
};
