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
    subscriptionManagement: string;
    staffUsers: string;
    centerLoginAccess: string;
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
    updatedDate: string;
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
    fullName: string;
    role: string;
    temporaryPassword: string;
    centerSlug: string;
    dedicatedLoginUrl: string;
  };
  actions: {
    backToCenters: string;
    editCenter: string;
    renewSubscription: string;
    suspendCenter: string;
    activateCenter: string;
    deactivateCenter: string;
    deleteCenter: string;
    loginAsCenterAdmin: string;
    resetAdminPassword: string;
    forceAdminPasswordChange: string;
    sendWelcomeEmail: string;
    saveNotes: string;
    saveChanges: string;
    cancelEdit: string;
    addStaffUser: string;
    editStaffUser: string;
    activateStaffUser: string;
    deactivateStaffUser: string;
    resetStaffPassword: string;
    copyLoginLink: string;
    openLoginPage: string;
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
  manualPlans: {
    basic: string;
    standard: string;
    premium: string;
    enterprise: string;
  };
  subscriptionStatuses: {
    trial: string;
    active: string;
    expired: string;
    overdue: string;
    cancelled: string;
  };
  staffRoles: {
    centerOwner: string;
    centerManager: string;
    doctor: string;
    receptionist: string;
    accountant: string;
    staff: string;
  };
  staffStatuses: {
    invited: string;
    active: string;
    inactive: string;
    suspended: string;
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
    loadingTitle: string;
    errorTitle: string;
    errorDescription: string;
    notFoundTitle: string;
    notFoundDescription: string;
    editTitle: string;
    editHelper: string;
    saving: string;
    updateSuccess: string;
    updateError: string;
    notesLoading: string;
    notesEmpty: string;
    notesSaving: string;
    noteSaveError: string;
    statusReason: string;
    statusReasonPlaceholder: string;
    statusSaving: string;
    statusError: string;
    updateSubscription: string;
    subscriptionSaving: string;
    subscriptionError: string;
    expiringSoon: string;
    expired: string;
    overdue: string;
    billingNotes: string;
    nextRenewalDate: string;
    staffLoading: string;
    staffEmpty: string;
    staffSaveError: string;
    staffSaving: string;
    staffSaved: string;
    staffResetSuccess: string;
    staffResetConfirmTitle: string;
    staffResetConfirmDescription: string;
    staffResetGeneratedTitle: string;
    staffResetGeneratedDescription: string;
    newTemporaryPassword: string;
    copyTemporaryPassword: string;
    temporaryPasswordCopied: string;
    staffFormTitle: string;
    loginLinkCopied: string;
    loginLinkUnavailable: string;
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
      subscriptionManagement: "Subscription Management",
      staffUsers: "Center Staff Users",
      centerLoginAccess: "Center Login Access",
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
      updatedDate: "Updated Date",
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
      fullName: "Full Name",
      role: "Role",
      temporaryPassword: "Temporary Password",
      centerSlug: "Center Slug",
      dedicatedLoginUrl: "Dedicated Login URL",
    },
    actions: {
      backToCenters: "Back to Centers",
      editCenter: "Edit Center",
      renewSubscription: "Renew Subscription",
      suspendCenter: "Suspend Center",
      activateCenter: "Activate Center",
      deactivateCenter: "Deactivate Center",
      deleteCenter: "Delete Center",
      loginAsCenterAdmin: "Login as Center Admin",
      resetAdminPassword: "Reset Admin Password",
      forceAdminPasswordChange: "Force Password Change",
      sendWelcomeEmail: "Send Welcome Email",
      saveNotes: "Save Notes",
      saveChanges: "Save Changes",
      cancelEdit: "Cancel",
      addStaffUser: "Add Staff User",
      editStaffUser: "Edit Staff User",
      activateStaffUser: "Activate",
      deactivateStaffUser: "Deactivate",
      resetStaffPassword: "Reset Password",
      copyLoginLink: "Copy Login Link",
      openLoginPage: "Open Login Page",
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
    manualPlans: {
      basic: "Basic",
      standard: "Standard",
      premium: "Premium",
      enterprise: "Enterprise",
    },
    subscriptionStatuses: {
      trial: "Trial",
      active: "Active",
      expired: "Expired",
      overdue: "Overdue",
      cancelled: "Cancelled",
    },
    staffRoles: {
      centerOwner: "Center Owner",
      centerManager: "Center Manager",
      doctor: "Doctor",
      receptionist: "Receptionist",
      accountant: "Accountant",
      staff: "Staff",
    },
    staffStatuses: {
      invited: "Invited",
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
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
      placeholder:
        "Add internal notes about this center. These notes are visible only to RoyalCare admins.",
      helper: "Private Super Admin notes are saved for this center only.",
    },
    values: {
      enabled: "Enabled",
      disabled: "Disabled",
      noLogo: "No logo uploaded",
      futureAction: "Future action",
      loadingTitle: "Loading center details...",
      errorTitle: "Center details could not be loaded",
      errorDescription: "Try again in a moment or return to Centers Management.",
      notFoundTitle: "Center not found",
      notFoundDescription:
        "This center was not found. Return to Centers Management and choose an existing center.",
      editTitle: "Edit center",
      editHelper: "Update center, admin, subscription, and domain details.",
      saving: "Saving...",
      updateSuccess: "Center updated successfully.",
      updateError: "Review the highlighted fields and try again.",
      notesLoading: "Loading notes...",
      notesEmpty: "No internal notes yet.",
      notesSaving: "Saving...",
      noteSaveError: "Enter a note before saving.",
      statusReason: "Reason",
      statusReasonPlaceholder: "Add a clear reason for this status change.",
      statusSaving: "Updating status...",
      statusError: "Review the status action and try again.",
      updateSubscription: "Update Subscription",
      subscriptionSaving: "Saving subscription...",
      subscriptionError: "Review the subscription fields and try again.",
      expiringSoon: "Expiring soon",
      expired: "Expired",
      overdue: "Overdue",
      billingNotes: "Billing Notes",
      nextRenewalDate: "Next Renewal Date",
      staffLoading: "Loading staff users...",
      staffEmpty: "No staff users yet.",
      staffSaveError: "Review the staff fields and try again.",
      staffSaving: "Saving staff user...",
      staffSaved: "Staff user saved.",
      staffResetSuccess: "Temporary password was reset.",
      staffResetConfirmTitle: "Reset staff password?",
      staffResetConfirmDescription:
        "A new temporary password will replace the current staff password.",
      staffResetGeneratedTitle: "Temporary Password Generated",
      staffResetGeneratedDescription:
        "Share this temporary password with the staff user through a secure channel.",
      newTemporaryPassword: "New Password",
      copyTemporaryPassword: "Copy",
      temporaryPasswordCopied: "Copied",
      staffFormTitle: "Staff user details",
      loginLinkCopied: "Login link copied successfully",
      loginLinkUnavailable: "Login link is unavailable because this center has no slug.",
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
      subscriptionManagement: "إدارة الاشتراك",
      staffUsers: "مستخدمو طاقم المركز",
      centerLoginAccess: "رابط دخول المركز",
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
      updatedDate: "تاريخ التحديث",
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
      fullName: "الاسم الكامل",
      role: "الدور",
      temporaryPassword: "كلمة المرور المؤقتة",
      centerSlug: "معرّف رابط المركز",
      dedicatedLoginUrl: "رابط الدخول المخصص",
    },
    actions: {
      backToCenters: "العودة إلى المراكز",
      editCenter: "تعديل المركز",
      renewSubscription: "تجديد الاشتراك",
      suspendCenter: "إيقاف المركز",
      activateCenter: "تفعيل المركز",
      deactivateCenter: "إلغاء تفعيل المركز",
      deleteCenter: "حذف المركز",
      loginAsCenterAdmin: "الدخول كمدير المركز",
      resetAdminPassword: "إعادة تعيين كلمة مرور المدير",
      forceAdminPasswordChange: "فرض تغيير كلمة المرور",
      sendWelcomeEmail: "إرسال بريد الترحيب",
      saveNotes: "حفظ الملاحظات",
      saveChanges: "حفظ التغييرات",
      cancelEdit: "إلغاء",
      addStaffUser: "إضافة موظف",
      editStaffUser: "تعديل الموظف",
      activateStaffUser: "تفعيل",
      deactivateStaffUser: "إلغاء التفعيل",
      resetStaffPassword: "إعادة تعيين كلمة المرور",
      copyLoginLink: "نسخ رابط الدخول",
      openLoginPage: "فتح صفحة الدخول",
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
    manualPlans: {
      basic: "أساسي",
      standard: "قياسي",
      premium: "مميز",
      enterprise: "مؤسسات",
    },
    subscriptionStatuses: {
      trial: "تجربة",
      active: "نشط",
      expired: "منتهي",
      overdue: "متأخر",
      cancelled: "ملغى",
    },
    staffRoles: {
      centerOwner: "مالك المركز",
      centerManager: "مدير المركز",
      doctor: "طبيب",
      receptionist: "موظف استقبال",
      accountant: "محاسب",
      staff: "موظف",
    },
    staffStatuses: {
      invited: "مدعو",
      active: "نشط",
      inactive: "غير نشط",
      suspended: "موقوف",
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
      placeholder:
        "أضف ملاحظات داخلية عن هذا المركز. هذه الملاحظات تظهر فقط لمديري رويال كير.",
      helper: "واجهة فقط. لا يتم حفظ الملاحظات حاليا.",
    },
    values: {
      enabled: "مفعل",
      disabled: "غير مفعل",
      noLogo: "لم يتم رفع شعار",
      futureAction: "إجراء مستقبلي",
      loadingTitle: "جار تحميل تفاصيل المركز...",
      errorTitle: "تعذر تحميل تفاصيل المركز",
      errorDescription:
        "حاول مرة أخرى بعد قليل أو ارجع إلى إدارة المراكز.",
      notFoundTitle: "المركز غير موجود",
      notFoundDescription:
        "لم يتم العثور على هذا المركز. ارجع إلى إدارة المراكز واختر مركزا موجودا.",
      editTitle: "تعديل المركز",
      editHelper: "حدّث بيانات المركز والمدير والاشتراك والنطاق.",
      saving: "جار الحفظ...",
      updateSuccess: "تم تحديث المركز بنجاح.",
      updateError: "راجع الحقول المحددة ثم حاول مرة أخرى.",
      notesLoading: "جار تحميل الملاحظات...",
      notesEmpty: "لا توجد ملاحظات داخلية بعد.",
      notesSaving: "جار الحفظ...",
      noteSaveError: "أدخل الملاحظة قبل الحفظ.",
      statusReason: "السبب",
      statusReasonPlaceholder: "أضف سببًا واضحًا لهذا التغيير.",
      statusSaving: "جار تحديث الحالة...",
      statusError: "راجع إجراء الحالة ثم حاول مرة أخرى.",
      updateSubscription: "تحديث الاشتراك",
      subscriptionSaving: "جار حفظ الاشتراك...",
      subscriptionError: "راجع حقول الاشتراك ثم حاول مرة أخرى.",
      expiringSoon: "ينتهي قريبًا",
      expired: "منتهي",
      overdue: "متأخر",
      billingNotes: "ملاحظات الفوترة",
      nextRenewalDate: "تاريخ التجديد القادم",
      staffLoading: "جار تحميل مستخدمي الطاقم...",
      staffEmpty: "لا يوجد مستخدمو طاقم بعد.",
      staffSaveError: "راجع حقول الموظف ثم حاول مرة أخرى.",
      staffSaving: "جار حفظ مستخدم الطاقم...",
      staffSaved: "تم حفظ مستخدم الطاقم.",
      staffResetSuccess: "تمت إعادة تعيين كلمة المرور المؤقتة.",
      staffResetConfirmTitle: "إعادة تعيين كلمة مرور الموظف؟",
      staffResetConfirmDescription:
        "سيتم استبدال كلمة مرور الموظف الحالية بكلمة مرور مؤقتة جديدة.",
      staffResetGeneratedTitle: "تم إنشاء كلمة مرور مؤقتة",
      staffResetGeneratedDescription:
        "شارك كلمة المرور المؤقتة مع الموظف عبر قناة آمنة.",
      newTemporaryPassword: "كلمة المرور الجديدة",
      copyTemporaryPassword: "نسخ",
      temporaryPasswordCopied: "تم النسخ",
      staffFormTitle: "بيانات مستخدم الطاقم",
      loginLinkCopied: "تم نسخ رابط الدخول بنجاح",
      loginLinkUnavailable: "رابط الدخول غير متاح لأن هذا المركز لا يملك معرّف رابط.",
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
      subscriptionManagement: "ניהול מינוי",
      staffUsers: "משתמשי צוות המרכז",
      centerLoginAccess: "גישת כניסה למרכז",
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
      updatedDate: "תאריך עדכון",
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
      fullName: "שם מלא",
      role: "תפקיד",
      temporaryPassword: "סיסמה זמנית",
      centerSlug: "מזהה קישור המרכז",
      dedicatedLoginUrl: "קישור כניסה ייעודי",
    },
    actions: {
      backToCenters: "חזרה למרכזים",
      editCenter: "עריכת מרכז",
      renewSubscription: "חידוש מינוי",
      suspendCenter: "השהיית מרכז",
      activateCenter: "הפעלת מרכז",
      deactivateCenter: "השבתת מרכז",
      deleteCenter: "מחיקת מרכז",
      loginAsCenterAdmin: "כניסה כמנהל המרכז",
      resetAdminPassword: "איפוס סיסמת מנהל",
      forceAdminPasswordChange: "חובת שינוי סיסמה",
      sendWelcomeEmail: "שליחת אימייל ברוכים הבאים",
      saveNotes: "שמירת הערות",
      saveChanges: "שמירת שינויים",
      cancelEdit: "ביטול",
      addStaffUser: "הוספת איש צוות",
      editStaffUser: "עריכת איש צוות",
      activateStaffUser: "הפעלה",
      deactivateStaffUser: "השבתה",
      resetStaffPassword: "איפוס סיסמה",
      copyLoginLink: "העתקת קישור כניסה",
      openLoginPage: "פתיחת דף כניסה",
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
    manualPlans: {
      basic: "בסיסי",
      standard: "סטנדרטי",
      premium: "פרימיום",
      enterprise: "ארגוני",
    },
    subscriptionStatuses: {
      trial: "ניסיון",
      active: "פעיל",
      expired: "פג תוקף",
      overdue: "באיחור",
      cancelled: "מבוטל",
    },
    staffRoles: {
      centerOwner: "בעלי המרכז",
      centerManager: "מנהל המרכז",
      doctor: "רופא",
      receptionist: "קבלה",
      accountant: "חשבונות",
      staff: "צוות",
    },
    staffStatuses: {
      invited: "הוזמן",
      active: "פעיל",
      inactive: "לא פעיל",
      suspended: "מושהה",
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
      placeholder:
        "הוספת הערות פנימיות על המרכז. ההערות גלויות רק למנהלי RoyalCare.",
      helper: "ממשק בלבד. ההערות לא נשמרות כרגע.",
    },
    values: {
      enabled: "פעיל",
      disabled: "כבוי",
      noLogo: "לא הועלה לוגו",
      futureAction: "פעולה עתידית",
      loadingTitle: "טוען פרטי מרכז...",
      errorTitle: "לא ניתן לטעון את פרטי המרכז",
      errorDescription:
        "נסו שוב בעוד רגע או חזרו לניהול המרכזים.",
      notFoundTitle: "המרכז לא נמצא",
      notFoundDescription:
        "המרכז הזה לא נמצא. חזרו לניהול המרכזים ובחרו מרכז קיים.",
      editTitle: "עריכת מרכז",
      editHelper: "עדכון פרטי המרכז, המנהל, המינוי והדומיין.",
      saving: "שומר...",
      updateSuccess: "המרכז עודכן בהצלחה.",
      updateError: "בדקו את השדות המסומנים ונסו שוב.",
      notesLoading: "טוען הערות...",
      notesEmpty: "אין עדיין הערות פנימיות.",
      notesSaving: "שומר...",
      noteSaveError: "יש להזין הערה לפני שמירה.",
      statusReason: "סיבה",
      statusReasonPlaceholder: "הוסיפו סיבה ברורה לשינוי הסטטוס.",
      statusSaving: "מעדכן סטטוס...",
      statusError: "בדקו את פעולת הסטטוס ונסו שוב.",
      updateSubscription: "עדכון מינוי",
      subscriptionSaving: "שומר מינוי...",
      subscriptionError: "בדקו את שדות המינוי ונסו שוב.",
      expiringSoon: "מסתיים בקרוב",
      expired: "פג תוקף",
      overdue: "באיחור",
      billingNotes: "הערות חיוב",
      nextRenewalDate: "תאריך חידוש הבא",
      staffLoading: "טוען משתמשי צוות...",
      staffEmpty: "אין עדיין משתמשי צוות.",
      staffSaveError: "בדקו את שדות איש הצוות ונסו שוב.",
      staffSaving: "שומר משתמש צוות...",
      staffSaved: "משתמש הצוות נשמר.",
      staffResetSuccess: "הסיסמה הזמנית אופסה.",
      staffResetConfirmTitle: "לאפס סיסמת איש צוות?",
      staffResetConfirmDescription:
        "סיסמת איש הצוות הנוכחית תוחלף בסיסמה זמנית חדשה.",
      staffResetGeneratedTitle: "נוצרה סיסמה זמנית",
      staffResetGeneratedDescription:
        "יש לשתף את הסיסמה הזמנית עם איש הצוות בערוץ מאובטח.",
      newTemporaryPassword: "סיסמה חדשה",
      copyTemporaryPassword: "העתקה",
      temporaryPasswordCopied: "הועתק",
      staffFormTitle: "פרטי משתמש צוות",
      loginLinkCopied: "קישור הכניסה הועתק בהצלחה",
      loginLinkUnavailable: "קישור הכניסה אינו זמין כי למרכז אין מזהה קישור.",
    },
  },
};



