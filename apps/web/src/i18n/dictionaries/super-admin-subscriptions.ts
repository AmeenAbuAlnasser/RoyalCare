import type { SupportedLocale } from "../locales";

type SuperAdminSubscriptionsDictionary = {
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
    table: string;
    mobileList: string;
    expiringSoon: string;
    revenueSnapshot: string;
  };
  stats: {
    activeSubscriptions: string;
    trialSubscriptions: string;
    expiringSoon: string;
    expiredSubscriptions: string;
    suspendedSubscriptions: string;
    monthlyRevenue: string;
  };
  centersAtRisk: {
    sectionTitle: string;
    total: string;
    noSubscription: string;
    expired: string;
    suspended: string;
    gracePeriod: string;
    viewCenters: string;
  };
  revenue: {
    mrr: string;
    arr: string;
    pendingPayments: string;
    failedRenewals: string;
  };
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    status: string;
    autoRenewal: string;
    planType: string;
    dateRange: string;
    all: string;
    on: string;
    off: string;
    days7: string;
    days14: string;
    days30: string;
    expiringSoon: string;
    expired: string;
    missingWhatsAppPhone: string;
  };
  table: {
    centerName: string;
    owner: string;
    subscriptionPlan: string;
    billingCycle: string;
    startDate: string;
    expiryDate: string;
    daysRemaining: string;
    autoRenewal: string;
    paymentStatus: string;
    monthlyValue: string;
    status: string;
    actions: string;
  };
  actions: {
    view: string;
    edit: string;
    renew: string;
    upgradePlan: string;
    suspend: string;
    cancel: string;
    invoiceHistory: string;
    sendWhatsApp: string;
    addPhone: string;
  };
  whatsapp: {
    modalTitle: string;
    phoneLabel: string;
    messageLabel: string;
    copyButton: string;
    copiedHint: string;
    openButton970: string;
    openButton972: string;
    tryBothHint: string;
    noPhone: string;
    cancel: string;
    expiringMessage: (centerName: string, days: number) => string;
    expiredMessage: (centerName: string) => string;
  };
  statuses: {
    active: string;
    trial: string;
    trialing: string;
    expired: string;
    suspended: string;
    cancelled: string;
    pastDue: string;
    expiringSoon: string;
    overdue: string;
  };
  plans: {
    basic: string;
    standard: string;
    premium: string;
    enterprise: string;
    trial: string;
    starter: string;
    professional: string;
  };
  billingCycles: {
    monthly: string;
    yearly: string;
    custom: string;
  };
  paymentStatuses: {
    paid: string;
    pending: string;
    failed: string;
  };
  lifecycle: {
    daysRemainingLabel: string;
    expiresIn: (days: number) => string;
    expiredDaysAgo: (days: number) => string;
    expiredToday: string;
    expiresToday: string;
  };
  automation: {
    title: string;
    subtitle: string;
    nextRun: string;
    lastRun: string;
    lastRunBy: string;
    status: string;
    success: string;
    failed: string;
    neverRun: string;
    runNow: string;
    running: string;
    scanned: string;
    expiringWithin7: string;
    expiredToday: string;
    notificationsSent: string;
    suspendedSkipped: string;
    requireAttention: (count: number) => string;
    expiredTodaySummary: (count: number) => string;
    checkedSummary: (count: number) => string;
    updatedExpiredSummary: (count: number) => string;
    skippedSuspendedSummary: (count: number) => string;
    noActionSummary: string;
    updatedExpired: string;
    notificationsCreated: string;
    auditLogsCreated: string;
    skippedSuspended: string;
    duplicateNotificationsSkipped: string;
    runSuccess: string;
    runError: string;
    loadError: string;
  };
  editModal: {
    title: string;
    centerLabel: string;
    statusLabel: string;
    planLabel: string;
    planPlaceholder: string;
    startDateLabel: string;
    endDateLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    notificationPhoneLabel: string;
    notificationPhonePlaceholder: string;
    notificationLanguageLabel: string;
    save: string;
    cancel: string;
    saving: string;
    successMessage: string;
    errorMessage: string;
    dateOrderError: string;
  };
  loadingState: {
    loading: string;
    error: string;
    retry: string;
    empty: string;
    noResults: string;
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
  values: {
    enabled: string;
    disabled: string;
    expiringHint: string;
    mobileHint: string;
    missingWhatsAppPhone: string;
    renewSuccess: string;
    suspendSuccess: string;
    actionError: string;
    renewing: string;
    suspending: string;
  };
};

export const superAdminSubscriptionsDictionaries: Record<
  SupportedLocale,
  SuperAdminSubscriptionsDictionary
> = {
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
      eyebrow: "Revenue operations",
      title: "Subscriptions Management",
      subtitle: "Manage center plans, renewals, payment status, and subscription risk.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: {
      summary: "Subscription Summary",
      searchFilters: "Search + Filters",
      table: "Subscriptions Table",
      mobileList: "Subscriptions",
      expiringSoon: "Expiring Soon",
      revenueSnapshot: "Revenue Snapshot",
    },
    stats: {
      activeSubscriptions: "Total Active Subscriptions",
      trialSubscriptions: "Trial Subscriptions",
      expiringSoon: "Expiring Soon",
      expiredSubscriptions: "Expired Subscriptions",
      suspendedSubscriptions: "Suspended",
      monthlyRevenue: "Monthly Revenue",
    },
    centersAtRisk: {
      sectionTitle: "Centers Needing Attention",
      total: "Centers at Risk",
      noSubscription: "No subscription",
      expired: "Expired",
      suspended: "Suspended",
      gracePeriod: "Grace period",
      viewCenters: "View centers",
    },
    revenue: {
      mrr: "MRR",
      arr: "ARR",
      pendingPayments: "Pending Payments",
      failedRenewals: "Failed Renewals",
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder: "Search by center, owner, or plan",
      status: "Last run status",
      autoRenewal: "Auto Renewal",
      planType: "Plan Type",
      dateRange: "Date Range",
      all: "All",
      on: "ON",
      off: "OFF",
      days7: "Next 7 days",
      days14: "Next 14 days",
      days30: "Next 30 days",
      expiringSoon: "Expiring Soon",
      expired: "Expired",
      missingWhatsAppPhone: "Missing WhatsApp Phone",
    },
    table: {
      centerName: "Center Name",
      owner: "Owner",
      subscriptionPlan: "Subscription Plan",
      billingCycle: "Billing Cycle",
      startDate: "Start Date",
      expiryDate: "Expiry Date",
      daysRemaining: "Days Left",
      autoRenewal: "Auto Renewal",
      paymentStatus: "Payment Status",
      monthlyValue: "Monthly Value",
      status: "Status",
      actions: "Actions",
    },
    actions: {
      view: "View",
      edit: "Edit",
      renew: "Renew",
      upgradePlan: "Upgrade Plan",
      suspend: "Suspend",
      cancel: "Cancel",
      invoiceHistory: "Invoice History",
      sendWhatsApp: "Send WhatsApp",
      addPhone: "Add Phone",
    },
    whatsapp: {
      modalTitle: "Send via WhatsApp",
      phoneLabel: "Phone Number",
      messageLabel: "Message (editable)",
      copyButton: "Copy Message",
      copiedHint: "Copied!",
      openButton970: "Open WhatsApp +970",
      openButton972: "Open WhatsApp +972",
      tryBothHint: "Try +970 first; if the number doesn't open, try +972.",
      noPhone: "No WhatsApp number for this center. Add a number to the center or set a support number in Settings.",
      cancel: "Cancel",
      expiringMessage: (centerName: string, days: number) =>
        `Hello ${centerName}, your RoyalCare subscription expires in ${days} day${days === 1 ? "" : "s"}. Please renew to avoid service interruption.`,
      expiredMessage: (centerName: string) =>
        `Hello ${centerName}, your RoyalCare subscription has expired. Please contact us to renew and reactivate your service.`,
    },
    statuses: {
      active: "Active",
      trial: "Trial",
      trialing: "Trialing",
      expired: "Expired",
      suspended: "Suspended",
      cancelled: "Cancelled",
      pastDue: "Past Due",
      expiringSoon: "Expiring Soon",
      overdue: "Overdue",
    },
    plans: {
      basic: "Basic",
      standard: "Standard",
      premium: "Premium",
      enterprise: "Enterprise",
      trial: "Trial",
      starter: "Starter",
      professional: "Professional",
    },
    billingCycles: {
      monthly: "Monthly",
      yearly: "Yearly",
      custom: "Custom",
    },
    paymentStatuses: {
      paid: "Paid",
      pending: "Pending",
      failed: "Failed",
    },
    lifecycle: {
      daysRemainingLabel: "Days remaining",
      expiresIn: (days: number) => `Expires in ${days} day${days === 1 ? "" : "s"}`,
      expiredDaysAgo: (days: number) => `Expired ${days} day${days === 1 ? "" : "s"} ago`,
      expiredToday: "Expired today",
      expiresToday: "Expires today",
    },
    automation: {
      title: "Subscription Automation",
      subtitle: "Daily lifecycle job runs at 02:00 server time and keeps expiration, notifications, and audit logs in sync.",
      nextRun: "Next run",
      lastRun: "Last run",
      lastRunBy: "Triggered by",
      status: "Status",
      success: "Success",
      failed: "Failed",
      neverRun: "Not run yet",
      runNow: "Check subscriptions now",
      running: "Running...",
      scanned: "Total subscriptions checked",
      expiringWithin7: "Expiring within 7 days",
      expiredToday: "Expired today",
      notificationsSent: "Notifications sent",
      suspendedSkipped: "Suspended skipped",
      requireAttention: (count: number) =>
        `${count} subscription${count === 1 ? "" : "s"} due for renewal`,
      expiredTodaySummary: (count: number) =>
        `${count} subscription${count === 1 ? "" : "s"} expired today`,
      checkedSummary: (count: number) =>
        `${count} subscription${count === 1 ? "" : "s"} checked successfully.`,
      updatedExpiredSummary: (count: number) =>
        `${count} expired subscription${count === 1 ? "" : "s"} updated.`,
      skippedSuspendedSummary: (count: number) =>
        `${count} suspended subscription${count === 1 ? "" : "s"} skipped.`,
      noActionSummary: "No new actions are required.",
      updatedExpired: "Expired updated",
      notificationsCreated: "Notifications created",
      auditLogsCreated: "Audit logs",
      skippedSuspended: "Skipped suspended",
      duplicateNotificationsSkipped: "Duplicate notifications skipped",
      runSuccess: "Lifecycle job completed successfully.",
      runError: "Lifecycle job failed. Please try again.",
      loadError: "Could not load lifecycle job status.",
    },
    editModal: {
      title: "Edit Subscription",
      centerLabel: "Center",
      statusLabel: "Status",
      planLabel: "Plan Name",
      planPlaceholder: "e.g. Basic, Standard, Premium",
      startDateLabel: "Start Date",
      endDateLabel: "End Date",
      notesLabel: "Notes",
      notesPlaceholder: "Internal billing notes",
      notificationPhoneLabel: "Notification Phone",
      notificationPhonePlaceholder: "+966 5X XXX XXXX",
      notificationLanguageLabel: "Notification Language",
      save: "Save Changes",
      cancel: "Cancel",
      saving: "Saving…",
      successMessage: "Subscription updated successfully.",
      errorMessage: "Failed to update subscription. Please try again.",
      dateOrderError: "End date must be on or after the start date.",
    },
    loadingState: {
      loading: "Loading subscriptions…",
      error: "Failed to load subscriptions.",
      retry: "Try Again",
      empty: "No subscriptions found.",
      noResults: "No subscriptions match your filters.",
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
    values: {
      enabled: "Enabled",
      disabled: "Disabled",
      expiringHint: "Highlighted subscriptions need renewal attention within 7, 14, or 30 days.",
      mobileHint: "Mobile uses cards with one Actions menu per subscription.",
      missingWhatsAppPhone: "Missing WhatsApp phone",
      renewSuccess: "Subscription renewed for 30 days.",
      suspendSuccess: "Subscription suspended successfully.",
      actionError: "Subscription action failed. Please try again.",
      renewing: "Renewing...",
      suspending: "Suspending...",
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
      eyebrow: "إدارة الإيرادات",
      title: "إدارة الاشتراكات",
      subtitle: "إدارة باقات المراكز والتجديدات وحالة الدفع ومخاطر الاشتراك.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    sections: {
      summary: "ملخص الاشتراكات",
      searchFilters: "البحث والفلاتر",
      table: "جدول الاشتراكات",
      mobileList: "الاشتراكات",
      expiringSoon: "تنتهي قريبا",
      revenueSnapshot: "ملخص الإيرادات",
    },
    stats: {
      activeSubscriptions: "إجمالي الاشتراكات النشطة",
      trialSubscriptions: "اشتراكات التجربة",
      expiringSoon: "تنتهي قريبا",
      expiredSubscriptions: "الاشتراكات المنتهية",
      suspendedSubscriptions: "موقوفة",
      monthlyRevenue: "الإيراد الشهري",
    },
    centersAtRisk: {
      sectionTitle: "مراكز تحتاج متابعة",
      total: "مراكز في خطر",
      noSubscription: "بدون اشتراك",
      expired: "منتهية",
      suspended: "موقوفة",
      gracePeriod: "فترة سماح",
      viewCenters: "عرض المراكز",
    },
    revenue: {
      mrr: "الإيراد الشهري المتكرر",
      arr: "الإيراد السنوي المتكرر",
      pendingPayments: "مدفوعات معلقة",
      failedRenewals: "تجديدات فاشلة",
    },
    filters: {
      searchLabel: "بحث",
      searchPlaceholder: "ابحث حسب المركز أو المالك أو الباقة",
      status: "حالة آخر فحص",
      autoRenewal: "التجديد التلقائي",
      planType: "نوع الباقة",
      dateRange: "نطاق التاريخ",
      all: "الكل",
      on: "مفعل",
      off: "غير مفعل",
      days7: "خلال 7 أيام",
      days14: "خلال 14 يوما",
      days30: "خلال 30 يوما",
      expiringSoon: "تنتهي قريباً",
      expired: "منتهية",
      missingWhatsAppPhone: "رقم واتساب مفقود",
    },
    table: {
      centerName: "اسم المركز",
      owner: "المالك",
      subscriptionPlan: "باقة الاشتراك",
      billingCycle: "دورة الفوترة",
      startDate: "تاريخ البداية",
      expiryDate: "تاريخ الانتهاء",
      daysRemaining: "الأيام المتبقية",
      autoRenewal: "التجديد التلقائي",
      paymentStatus: "حالة الدفع",
      monthlyValue: "القيمة الشهرية",
      status: "الحالة",
      actions: "الإجراءات",
    },
    actions: {
      view: "عرض",
      edit: "تعديل",
      renew: "تجديد",
      upgradePlan: "ترقية الباقة",
      suspend: "إيقاف",
      cancel: "إلغاء",
      invoiceHistory: "سجل الفواتير",
      sendWhatsApp: "إرسال واتساب",
      addPhone: "إضافة رقم",
    },
    whatsapp: {
      modalTitle: "إرسال عبر واتساب",
      phoneLabel: "رقم الهاتف",
      messageLabel: "الرسالة (قابلة للتعديل)",
      copyButton: "نسخ الرسالة",
      copiedHint: "تم النسخ!",
      openButton970: "فتح واتساب +970",
      openButton972: "فتح واتساب +972",
      tryBothHint: "جرّب +970 أولاً؛ إذا لم يفتح الرقم، جرّب +972.",
      noPhone: "لا يوجد رقم واتساب. أضف رقم للمركز أو رقم دعم من الإعدادات.",
      cancel: "إلغاء",
      expiringMessage: (centerName: string, days: number) =>
        `مرحبًا ${centerName}، اشتراكك في RoyalCare سينتهي خلال ${days} ${days === 1 ? "يوم" : "أيام"}. يرجى التجديد لتجنب توقف الخدمة.`,
      expiredMessage: (centerName: string) =>
        `مرحبًا ${centerName}، اشتراكك في RoyalCare منتهي حاليًا. يرجى التواصل معنا لتجديد الاشتراك وإعادة تفعيل الخدمة.`,
    },
    statuses: {
      active: "نشط",
      trial: "تجربة",
      trialing: "في التجربة",
      expired: "منتهي",
      suspended: "موقوف",
      cancelled: "ملغي",
      pastDue: "متأخر الدفع",
      expiringSoon: "ينتهي قريباً",
      overdue: "متأخر",
    },
    plans: {
      basic: "أساسي",
      standard: "معياري",
      premium: "مميز",
      enterprise: "مؤسسي",
      trial: "تجربة",
      starter: "البداية",
      professional: "الاحترافية",
    },
    billingCycles: {
      monthly: "شهري",
      yearly: "سنوي",
      custom: "مخصص",
    },
    paymentStatuses: {
      paid: "مدفوع",
      pending: "معلق",
      failed: "فشل",
    },
    lifecycle: {
      daysRemainingLabel: "الأيام المتبقية",
      expiresIn: (days: number) => `ينتهي خلال ${days} ${days === 1 ? "يوم" : "أيام"}`,
      expiredDaysAgo: (days: number) => `انتهى منذ ${days} ${days === 1 ? "يوم" : "أيام"}`,
      expiredToday: "انتهى اليوم",
      expiresToday: "ينتهي اليوم",
    },
    automation: {
      title: "أتمتة الاشتراكات",
      subtitle: "تعمل مهمة دورة حياة الاشتراك يوميًا الساعة 02:00 وتحافظ على تزامن الانتهاء والإشعارات وسجلات التدقيق.",
      nextRun: "التشغيل التالي",
      lastRun: "آخر تشغيل",
      lastRunBy: "تم التشغيل بواسطة",
      status: "الحالة",
      success: "ناجح",
      failed: "فشل",
      neverRun: "لم يتم التشغيل بعد",
      runNow: "فحص الاشتراكات الآن",
      running: "جارٍ التشغيل...",
      scanned: "إجمالي الاشتراكات التي تم فحصها",
      expiringWithin7: "تنتهي خلال 7 أيام",
      expiredToday: "انتهت اليوم",
      notificationsSent: "الإشعارات المرسلة",
      suspendedSkipped: "الموقوفة التي تم تخطيها",
      requireAttention: (count: number) =>
        `${count} ${count === 1 ? "اشتراك يحتاج تجديداً" : "اشتراكات تحتاج تجديداً"}`,
      expiredTodaySummary: (count: number) =>
        `${count} اشتراك انتهى اليوم`,
      checkedSummary: (count: number) =>
        `تم فحص ${count} اشتراك بنجاح.`,
      updatedExpiredSummary: (count: number) =>
        `تم تحديث ${count} اشتراك منتهي.`,
      skippedSuspendedSummary: (count: number) =>
        `تم تخطي ${count} اشتراك موقوف.`,
      noActionSummary: "لا توجد إجراءات جديدة مطلوبة.",
      updatedExpired: "تم تحديث المنتهية",
      notificationsCreated: "الإشعارات المنشأة",
      auditLogsCreated: "سجلات التدقيق",
      skippedSuspended: "تم تخطي الموقوفة",
      duplicateNotificationsSkipped: "إشعارات مكررة تم تخطيها",
      runSuccess: "اكتملت مهمة دورة حياة الاشتراك بنجاح.",
      runError: "فشل تشغيل مهمة دورة حياة الاشتراك. يرجى المحاولة مرة أخرى.",
      loadError: "تعذر تحميل حالة مهمة دورة حياة الاشتراك.",
    },
    editModal: {
      title: "تعديل الاشتراك",
      centerLabel: "المركز",
      statusLabel: "الحالة",
      planLabel: "اسم الباقة",
      planPlaceholder: "مثال: أساسي، معياري، مميز",
      startDateLabel: "تاريخ البداية",
      endDateLabel: "تاريخ الانتهاء",
      notesLabel: "ملاحظات",
      notesPlaceholder: "ملاحظات فوترة داخلية",
      notificationPhoneLabel: "هاتف الإشعارات",
      notificationPhonePlaceholder: "+966 5X XXX XXXX",
      notificationLanguageLabel: "لغة الإشعارات",
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      saving: "جارٍ الحفظ…",
      successMessage: "تم تحديث الاشتراك بنجاح.",
      errorMessage: "فشل تحديث الاشتراك. يرجى المحاولة مجدداً.",
      dateOrderError: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية أو مساوياً له.",
    },
    loadingState: {
      loading: "جارٍ تحميل الاشتراكات…",
      error: "فشل تحميل الاشتراكات.",
      retry: "إعادة المحاولة",
      empty: "لا توجد اشتراكات.",
      noResults: "لا توجد اشتراكات تطابق الفلاتر.",
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
    values: {
      enabled: "مفعل",
      disabled: "غير مفعل",
      expiringHint: "الاشتراكات المميزة تحتاج متابعة تجديد خلال 7 أو 14 أو 30 يوما.",
      mobileHint: "في الجوال تظهر الاشتراكات كبطاقات مع قائمة إجراءات واحدة لكل اشتراك.",
      missingWhatsAppPhone: "رقم واتساب مفقود",
      renewSuccess: "تم تجديد الاشتراك لمدة 30 يومًا.",
      suspendSuccess: "تم إيقاف الاشتراك بنجاح.",
      actionError: "تعذر تنفيذ إجراء الاشتراك. يرجى المحاولة مرة أخرى.",
      renewing: "جارٍ التجديد...",
      suspending: "جارٍ الإيقاف...",
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
      eyebrow: "ניהול הכנסות",
      title: "ניהול מינויים",
      subtitle: "ניהול תוכניות מרכזים, חידושים, סטטוס תשלום וסיכוני מינוי.",
      language: "שפה",
      account: "מנהל מערכת",
    },
    sections: {
      summary: "סיכום מינויים",
      searchFilters: "חיפוש וסינון",
      table: "טבלת מינויים",
      mobileList: "מינויים",
      expiringSoon: "מסתיימים בקרוב",
      revenueSnapshot: "תמונת הכנסות",
    },
    stats: {
      activeSubscriptions: "סך מינויים פעילים",
      trialSubscriptions: "מינויי ניסיון",
      expiringSoon: "מסתיימים בקרוב",
      expiredSubscriptions: "מינויים שפג תוקפם",
      suspendedSubscriptions: "מושהים",
      monthlyRevenue: "הכנסה חודשית",
    },
    centersAtRisk: {
      sectionTitle: "מרכזים הדורשים טיפול",
      total: "מרכזים בסיכון",
      noSubscription: "ללא מינוי",
      expired: "פג תוקף",
      suspended: "מושהה",
      gracePeriod: "תקופת חסד",
      viewCenters: "הצג מרכזים",
    },
    revenue: {
      mrr: "MRR",
      arr: "ARR",
      pendingPayments: "תשלומים ממתינים",
      failedRenewals: "חידושים שנכשלו",
    },
    filters: {
      searchLabel: "חיפוש",
      searchPlaceholder: "חיפוש לפי מרכז, בעלים או תוכנית",
      status: "סטטוס הרצה אחרונה",
      autoRenewal: "חידוש אוטומטי",
      planType: "סוג תוכנית",
      dateRange: "טווח תאריכים",
      all: "הכל",
      on: "פעיל",
      off: "כבוי",
      days7: "7 ימים הקרובים",
      days14: "14 ימים הקרובים",
      days30: "30 ימים הקרובים",
      expiringSoon: "מסתיימים בקרוב",
      expired: "פג תוקף",
      missingWhatsAppPhone: "חסר מספר וואטסאפ",
    },
    table: {
      centerName: "שם המרכז",
      owner: "בעלים",
      subscriptionPlan: "תוכנית מינוי",
      billingCycle: "מחזור חיוב",
      startDate: "תאריך התחלה",
      expiryDate: "תאריך סיום",
      daysRemaining: "ימים שנותרו",
      autoRenewal: "חידוש אוטומטי",
      paymentStatus: "סטטוס תשלום",
      monthlyValue: "ערך חודשי",
      status: "סטטוס",
      actions: "פעולות",
    },
    actions: {
      view: "צפייה",
      edit: "עריכה",
      renew: "חידוש",
      upgradePlan: "שדרוג תוכנית",
      suspend: "השהיה",
      cancel: "ביטול",
      invoiceHistory: "היסטוריית חשבוניות",
      sendWhatsApp: "שליחת וואטסאפ",
      addPhone: "הוספת מספר",
    },
    whatsapp: {
      modalTitle: "שלח דרך וואטסאפ",
      phoneLabel: "מספר טלפון",
      messageLabel: "הודעה (ניתנת לעריכה)",
      copyButton: "העתק הודעה",
      copiedHint: "הועתק!",
      openButton970: "פתח וואטסאפ +970",
      openButton972: "פתח וואטסאפ +972",
      tryBothHint: "נסה +970 תחילה; אם המספר לא נפתח, נסה +972.",
      noPhone: "אין מספר WhatsApp. הוסף מספר למרכז או הגדר מספר תמיכה בהגדרות.",
      cancel: "ביטול",
      expiringMessage: (centerName: string, days: number) =>
        `שלום ${centerName}, המינוי שלך ב-RoyalCare יפוג בעוד ${days} ${days === 1 ? "יום" : "ימים"}. אנא חדש כדי למנוע הפסקת שירות.`,
      expiredMessage: (centerName: string) =>
        `שלום ${centerName}, המינוי שלך ב-RoyalCare פג תוקפו. אנא צור קשר לחידוש המינוי והפעלת השירות מחדש.`,
    },
    statuses: {
      active: "פעיל",
      trial: "ניסיון",
      trialing: "בניסיון",
      expired: "פג תוקף",
      suspended: "מושהה",
      cancelled: "בוטל",
      pastDue: "תשלום באיחור",
      expiringSoon: "מסתיים בקרוב",
      overdue: "באיחור",
    },
    plans: {
      basic: "בסיסי",
      standard: "סטנדרטי",
      premium: "פרמיום",
      enterprise: "ארגוני",
      trial: "ניסיון",
      starter: "מתחילים",
      professional: "מקצועי",
    },
    billingCycles: {
      monthly: "חודשי",
      yearly: "שנתי",
      custom: "מותאם",
    },
    paymentStatuses: {
      paid: "שולם",
      pending: "ממתין",
      failed: "נכשל",
    },
    lifecycle: {
      daysRemainingLabel: "ימים שנותרו",
      expiresIn: (days: number) => `מסתיים בעוד ${days} ${days === 1 ? "יום" : "ימים"}`,
      expiredDaysAgo: (days: number) => `פג לפני ${days} ${days === 1 ? "יום" : "ימים"}`,
      expiredToday: "פג היום",
      expiresToday: "מסתיים היום",
    },
    automation: {
      title: "אוטומציית מינויים",
      subtitle: "משימת מחזור החיים רצה בכל יום ב-02:00 ומסנכרנת תפוגה, התראות ויומן ביקורת.",
      nextRun: "הרצה הבאה",
      lastRun: "הרצה אחרונה",
      lastRunBy: "הופעל על ידי",
      status: "סטטוס",
      success: "הצליח",
      failed: "נכשל",
      neverRun: "עדיין לא רץ",
      runNow: "בדוק מינויים עכשיו",
      running: "מריץ...",
      scanned: "סך המינויים שנבדקו",
      expiringWithin7: "מסתיימים בתוך 7 ימים",
      expiredToday: "פגו היום",
      notificationsSent: "התראות שנשלחו",
      suspendedSkipped: "מושהים שדולגו",
      requireAttention: (count: number) =>
        `${count} מינוי${count === 1 ? "" : "ים"} לחידוש`,
      expiredTodaySummary: (count: number) =>
        `${count} מינויים פגו היום`,
      checkedSummary: (count: number) =>
        `${count} מינויים נבדקו בהצלחה.`,
      updatedExpiredSummary: (count: number) =>
        `${count} מינויים שפגו עודכנו.`,
      skippedSuspendedSummary: (count: number) =>
        `${count} מינויים מושעים דולגו.`,
      noActionSummary: "אין פעולות חדשות נדרשות.",
      updatedExpired: "עודכנו לפג תוקף",
      notificationsCreated: "התראות שנוצרו",
      auditLogsCreated: "רשומות ביקורת",
      skippedSuspended: "דולגו מושהים",
      duplicateNotificationsSkipped: "התראות כפולות דולגו",
      runSuccess: "משימת מחזור החיים הושלמה בהצלחה.",
      runError: "הרצת משימת מחזור החיים נכשלה. נסה שוב.",
      loadError: "לא ניתן לטעון את סטטוס משימת מחזור החיים.",
    },
    editModal: {
      title: "עריכת מינוי",
      centerLabel: "מרכז",
      statusLabel: "סטטוס",
      planLabel: "שם תוכנית",
      planPlaceholder: "לדוגמה: בסיסי, סטנדרטי, פרמיום",
      startDateLabel: "תאריך התחלה",
      endDateLabel: "תאריך סיום",
      notesLabel: "הערות",
      notesPlaceholder: "הערות חיוב פנימיות",
      notificationPhoneLabel: "טלפון להתראות",
      notificationPhonePlaceholder: "+966 5X XXX XXXX",
      notificationLanguageLabel: "שפת ההתראות",
      save: "שמור שינויים",
      cancel: "ביטול",
      saving: "שומר…",
      successMessage: "המינוי עודכן בהצלחה.",
      errorMessage: "עדכון המינוי נכשל. נסה שנית.",
      dateOrderError: "תאריך הסיום חייב להיות שווה לתאריך ההתחלה או מאוחר ממנו.",
    },
    loadingState: {
      loading: "טוען מינויים…",
      error: "טעינת המינויים נכשלה.",
      retry: "נסה שנית",
      empty: "לא נמצאו מינויים.",
      noResults: "אין מינויים התואמים את הסינון.",
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
    values: {
      enabled: "פעיל",
      disabled: "כבוי",
      expiringHint: "מינויים מסומנים דורשים טיפול חידוש בתוך 7, 14 או 30 ימים.",
      mobileHint: "במובייל המינויים מוצגים ככרטיסים עם תפריט פעולות אחד לכל מינוי.",
      missingWhatsAppPhone: "חסר מספר וואטסאפ",
      renewSuccess: "המינוי חודש ל-30 ימים.",
      suspendSuccess: "המינוי הושהה בהצלחה.",
      actionError: "פעולת המינוי נכשלה. נסה שוב.",
      renewing: "מחדש...",
      suspending: "משהה...",
    },
  },
};
