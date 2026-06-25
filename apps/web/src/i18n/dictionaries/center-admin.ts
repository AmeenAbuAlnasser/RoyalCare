import type { SupportedLocale } from "../locales";

type CenterRoleKey =
  | "CENTER_OWNER"
  | "CENTER_MANAGER"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "ACCOUNTANT"
  | "STAFF";

type CenterStatusKey =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "ARCHIVED";

type CenterAdminDictionary = {
  brand: {
    console: string;
    name: string;
  };
  languages: Record<SupportedLocale, string>;
  login: {
    blockedCenter: string;
    centerNotFound: string;
    email: string;
    error: string;
    password: string;
    submit: string;
    submitting: string;
    subtitle: string;
    title: string;
  };
  shell: {
    accessDeniedBody: string;
    accessDeniedTitle: string;
    menu: string;
    close: string;
    language: string;
    logout: string;
    loggingOut: string;
    navGroups: {
      dailyOps: string;
      admin: string;
      marketing: string;
      content: string;
    };
  };
  nav: {
    dashboard: string;
    patients: string;
    appointments: string;
    bookingRequests: string;
    followUps: string;
    services: string;
    staff: string;
    billing: string;
    expenses: string;
    reports: string;
    notifications: string;
    schedule: string;
    settings: string;
    permissions: string;
    gallery: string;
    reviews: string;
    beforeAfter: string;
    team: string;
    offers: string;
    seo: string;
    domain: string;
    website: string;
    marketing: string;
    websiteAnalytics: string;
  };
  schedule: {
    addClosedDay: string;
    addLeave: string;
    centerHours: string;
    closed: string;
    closedDays: string;
    date: string;
    delete: string;
    endTime: string;
    helper: string;
    invalidRange: string;
    leave: string;
    loadError: string;
    noClosedDays: string;
    noLeave: string;
    noProviders: string;
    open: string;
    providerHours: string;
    providerLeave: string;
    providerSelect: string;
    reason: string;
    save: string;
    saved: string;
    startTime: string;
    subtitle: string;
    title: string;
  };
  bookingRequests: {
    title: string;
    subtitle: string;
    loading: string;
    loadError: string;
    empty: string;
    emptyBody: string;
    filterAll: string;
    filterPending: string;
    filterAccepted: string;
    filterRejected: string;
    fullName: string;
    phone: string;
    service: string;
    requestedDate: string;
    requestedTime: string;
    notes: string;
    status: string;
    statusPending: string;
    statusAccepted: string;
    statusRejected: string;
    createdAt: string;
    accept: string;
    reject: string;
    accepting: string;
    rejecting: string;
    contactWhatsApp: string;
    acceptSuccess: string;
    rejectSuccess: string;
    errorAlreadyProcessed: string;
    errorGeneric: string;
    pendingCount: (n: number) => string;
    openAppointment: string;
    linkedAppointmentUnavailable: string;
    patientConflictMessage: (patientName: string) => string;
    existingPatient: string;
    bookingPatient: string;
    linkToExistingPatient: string;
    createNewPatient: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    subtitle: string;
    currentUser: string;
    role: string;
    centerStatus: string;
    loading: string;
    loadError: string;
    sessionExpired: string;
    alerts: string;
    appointmentsToday: string;
    appointmentsTodayHelper: string;
    completedToday: string;
    completedTodayHelper: string;
    noAlerts: string;
    noShowToday: string;
    noShowTodayHelper: string;
    patientsWithCredit: string;
    pendingInvoices: string;
    quickActions: string;
    recentAppointments: string;
    recentInvoices: string;
    revenueSnapshot: string;
    todayActivity: string;
    upcomingAppointmentSoon: string;
    upcomingNextTwoHours: string;
    upcomingNextTwoHoursHelper: string;
    viewDetails: string;
    subscription: {
      title: string;
      plan: string;
      status: string;
      endDate: string;
      remainingDays: (days: number) => string;
      oneDayRemaining: string;
      expiresToday: string;
      expiredSince: (days: number) => string;
      suspended: string;
      noSubscription: string;
    };
  };
  subscriptionNotice: {
    activeTitle: string;
    expiringSoonTitle: string;
    expiringSoonBody: (days: number) => string;
    expiredTitle: string;
    expiredBody: string;
    suspendedTitle: string;
    suspendedBody: string;
    contactSupport: string;
  };
  subscriptionBanner: {
    expiringTitle: (days: number) => string;
    expiresTodayTitle: string;
    expiredTitle: string;
    gracePeriodTitle: (days: number) => string;
    suspendedTitle: string;
    contactAdmin: string;
    renewButton: string;
    contactAdminButton: string;
    whatsappExpiringMessage: (centerName: string, days: number) => string;
    whatsappExpiringTodayMessage: (centerName: string) => string;
    whatsappExpiredMessage: (centerName: string) => string;
    whatsappGracePeriodMessage: (centerName: string, days: number) => string;
    whatsappSuspendedMessage: (centerName: string) => string;
  };
  subscriptionRenewal: {
    title: string;
    subtitle: string;
    notePlaceholder: string;
    submitButton: string;
    submittingButton: string;
    cancelButton: string;
    successTitle: string;
    successBody: string;
    duplicateTitle: string;
    duplicateBody: string;
    errorTitle: string;
    errorBody: string;
  };
  cards: {
    patients: string;
    appointments: string;
    services: string;
    staff: string;
  };
  common: {
    cancel: string;
    close: string;
    save: string;
    saving: string;
    search: string;
    view: string;
    edit: string;
    archive: string;
    activate: string;
    actions: string;
    notAvailable: string;
  };
  patients: {
    title: string;
    subtitle: string;
    addPatient: string;
    addFirstPatient: string;
    editPatient: string;
    detailsTitle: string;
    searchPlaceholder: string;
    totalPatients: string;
    activePatients: string;
    archivedPatients: string;
    newPatientsThisMonth: string;
    filters: string;
    allGenders: string;
    allStatuses: string;
    archiveFilter: string;
    allArchiveStates: string;
    activeOnly: string;
    archivedOnly: string;
    hasUpcomingAppointment: string;
    hasReceivables: string;
    unavailableFilter: string;
    filterAll: string;
    filterYes: string;
    filterNo: string;
    treatmentPlansCount: string;
    overdueSessionsCount: string;
    lastSession: string;
    appointmentsCount: string;
    nextSession: string;
    outstandingBalance: string;
    upcomingAppointmentsCount: string;
    noData: string;
    quickActions: string;
    createAppointment: string;
    createTreatmentPlan: string;
    createInvoice: string;
    unavailableAction: string;
    moreActions: string;
    paginationSummary: (shown: number, total: number) => string;
    paginationPrepared: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    loading: string;
    fullName: string;
    fullNameAr: string;
    fullNameHe: string;
    fullNameEn: string;
    namesOptionalHint: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    nationalId: string;
    notes: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    submit: string;
    update: string;
    fieldRequired: string;
    invalidPhone: string;
    duplicatePhone: string;
    loadError: string;
    saved: string;
    archived: string;
    activated: string;
    notFound: string;
    deletePatient: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteConfirmButton: string;
    deleteBlocked: string;
    deleteBlockedTooltip: string;
    deleteBlockedWithCounts: (counts: { appointments: number; invoices: number; payments: number; followUps: number; creditTransactions: number }) => string;
    deleted: string;
    patientPortal: {
      title: string;
      generate: string;
      generating: string;
      copyLink: string;
      copied: string;
      openPortal: string;
      shareWhatsApp: string;
      error: string;
    };
  };
  services: {
    title: string;
    subtitle: string;
    addService: string;
    editService: string;
    detailsTitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterActive: string;
    filterArchived: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    loading: string;
    loadError: string;
    nameEn: string;
    nameAr: string;
    nameHe: string;
    descriptionEn: string;
    descriptionAr: string;
    descriptionHe: string;
    bufferMinutes: string;
    durationMinutes: string;
    price: string;
    currency: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    submit: string;
    update: string;
    saved: string;
    archived: string;
    activated: string;
    notFound: string;
    optional: string;
    fieldRequired: string;
    invalidBuffer: string;
    invalidDuration: string;
    invalidPrice: string;
    invalidCurrency: string;
    durationUnitMinutes: string;
    durationUnitHours: string;
    enableFollowUpPlan: string;
    followUpSettings: string;
    followUpDescription: string;
    followUp: {
      none: string;
      sessionBasedPlan: string;
      sessionBasedHelper: string;
      recurring: string;
      recurringHelper: string;
    };
    recurringIntervalLabel?: string;
    recurringUnitDay?: string;
    recurringUnitWeek?: string;
    recurringUnitMonth?: string;
    recurringUnitYear?: string;
    autoWhatsappReminderEnabled?: string;
    autoReminderDaysBefore?: string;
    defaultIntervalDays: string;
    planType: string;
    fixedInterval: string;
    sessionPlan: string;
    createNextReminderAutomatically: string;
    totalRecommendedSessions: string;
    totalSessionsSummary: (count: number) => string;
    totalSessionsCalculated: string;
    whatsappMessageArabic: string;
    whatsappMessageHebrew: string;
    whatsappMessageEnglish: string;
    sessionsFrom: string;
    sessionsTo: string;
    intervalDays: string;
    addRule: string;
    removeRule: string;
    followUpRuleHelper: string;
    treatmentPhases: string;
    treatmentPlanTemplates?: string;
    treatmentPlanTemplatesHelper?: string;
    addTreatmentTemplate?: string;
    noTreatmentTemplates?: string;
    treatmentTemplateTitle?: (index: number) => string;
    defaultTreatmentTemplate?: string;
    activeTreatmentTemplate?: string;
    sortOrder?: string;
    templateUsesDefaultInterval?: string;
    deleteTreatmentTemplate?: string;
    treatmentTemplateSelect?: string;
    treatmentTemplateOverrideHint?: string;
    phaseTitle: (index: number) => string;
    reminderAfterDays: (days: number) => string;
    previewSessionLine: (session: number, days: number) => string;
    planPreview: string;
    laserPreset: string;
    hijamaPreset: string;
    skincarePreset: string;
    applyPreset: string;
    editPhase: string;
    deletePhase: string;
    planCalcExplanation: string;
    planPreviewPhaseLabel: (from: number, to: number, days: number) => string;
    overlappingRanges: string;
    uncoveredSessions: (range: string) => string;
    invalidIntervals: string;
    invalidRangeOrder: string;
    firstPhaseMustStartAtOne: string;
    noGapsAllowed: string;
    deleteService: string;
    deleteServiceConfirmTitle: string;
    deleteServiceConfirmBody: string;
    deleteServiceConfirmButton: string;
    deleteServiceBlocked: string;
    deleteServiceBlockedTooltip: string;
    deleted: string;
    followUpBadge: string;
    noFollowUpBadge: string;
    sessionBasedPlanLabel: string;
    recurringContinuousLabel: string;
    templateCountBadge: (count: number) => string;
    defaultTemplateSummary: (name: string, sessions: number) => string;
    totalSessionsBadge: (count: number) => string;
    intervalDaysBadge: (days: number) => string;
    followUpAutoHint: string;
  };
  staff: {
    title: string;
    subtitle: string;
    addStaff: string;
    editStaff: string;
    detailsTitle: string;
    searchPlaceholder: string;
    filterAllRoles: string;
    filterAllStatuses: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    loading: string;
    loadError: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    passwordOptional: string;
    providerEnabled: string;
    providerEnabledHelper: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    submit: string;
    update: string;
    saved: string;
    activated: string;
    deactivated: string;
    notFound: string;
    fieldRequired: string;
    invalidEmail: string;
    duplicateEmail: string;
    invalidPassword: string;
    permissionsTitle: string;
    centerLabel: string;
  };
  billing: {
    title: string;
    subtitle: string;
    addInvoice: string;
    invoiceTitle: string;
    searchPlaceholder: string;
    filterAllStatuses: string;
    filterAll: string;
    emptyTitle: string;
    emptyBody: string;
    emptyPendingTitle: string;
    emptyPendingBody: string;
    emptyPartialTitle: string;
    emptyPartialBody: string;
    emptyPaidTitle: string;
    emptyPaidBody: string;
    emptyCancelledTitle: string;
    emptyCancelledBody: string;
    loading: string;
    loadError: string;
    patient: string;
    service: string;
    customService: string;
    customServiceName: string;
    customServiceDuration: string;
    customServicePrice: string;
    saveCustomService: string;
    customServiceBadge: string;
    provider: string;
    providerOptional: string;
    noProvider: string;
    selectPatient: string;
    selectService: string;
    amount: string;
    currency: string;
    status: string;
    notes: string;
    notesOptional: string;
    createdAt: string;
    updatedAt: string;
    submit: string;
    markedPaid: string;
    invoiceFullyPaid: string;
    cancelled: string;
    notFound: string;
    fieldRequired: string;
    invalidAmount: string;
    markAsPaid: string;
    cancelInvoice: string;
    reopenInvoice: string;
    reopened: string;
    addPayment: string;
    paymentHistory: string;
    paymentMethod: string;
    paymentDate: string;
    paymentNotes: string;
    paymentNotesOptional: string;
    methodCash: string;
    methodBankTransfer: string;
    methodCheck: string;
    methodOther: string;
    paymentAdded: string;
    noPayments: string;
    invoiceTotal: string;
    paidAmount: string;
    balanceDue: string;
    paymentBy: string;
    overpaymentError: string;
    overpaymentCreditHint: string;
    invalidPaymentDate: string;
    creditBalance: string;
    useCredit: string;
    creditAmount: string;
    creditApplied: string;
    noCreditAvailable: string;
    insufficientCredit: string;
    noCreditDue: string;
    creditAdded: string;
    overpaymentCreditNotice: string;
    creditSourceOverpayment: string;
    creditSourceManual: string;
    creditSourceAdjustment: string;
    creditUsageLabel: string;
    invoiceTotalDesc: string;
    paidAmountDesc: string;
    balanceDueDesc: string;
    balanceDueTooltip: string;
    creditBalanceDesc: string;
    statusPaidDesc: string;
    statusPartialDesc: string;
    statusPendingDesc: string;
  };
  appointments: {
    title: string;
    subtitle: string;
    addAppointment: string;
    editAppointment: string;
    detailsTitle: string;
    searchPlaceholder: string;
    filterAll: string;
    today: string;
    upcoming: string;
    dateFilter: string;
    providerFilter: string;
    allProviders: string;
    allBranches: string;
    branch: string;
    chooseBranch: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    loading: string;
    loadError: string;
    patient: string;
    service: string;
    customService: string;
    customServiceName: string;
    customServiceDuration: string;
    customServiceDurationPlaceholder: string;
    customServiceDurationHelper: string;
    customServicePrice: string;
    customServicePricePlaceholder: string;
    customServicePriceHelper: string;
    saveCustomService: string;
    customServiceBadge: string;
    provider: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: string;
    durationMinutesPlaceholder: string;
    durationMinutesHelper: string;
    status: string;
    notes: string;
    notesHelper: string;
    internalNotes: string;
    internalNotesHelper: string;
    cancellationReason: string;
    reminderSent: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    submit: string;
    update: string;
    saved: string;
    saveError: string;
    cancelled: string;
    statusUpdated: string;
    notFound: string;
    fieldRequired: string;
    invalidDate: string;
    invalidTime: string;
    invalidDuration: string;
    overlap: string;
    cancelAppointment: string;
    confirmCancel: string;
    changeStatus: string;
    conflictTitle: string;
    conflictMessage: string;
    conflictPatient: string;
    conflictService: string;
    conflictProvider: string;
    conflictDate: string;
    conflictStart: string;
    conflictEnd: string;
    startsInMinutes: string;
    inProgressNow: string;
    endOfDayError: string;
    invoiceSection: string;
    noInvoice: string;
    noInvoiceBody: string;
    createInvoice: string;
    openInvoice: string;
    invoiceCreated: string;
    noServicePrice: string;
    invoiceUnpaid: string;
    viewInvoice: string;
    invoiceRequiresCompleted: string;
    invoiceFullyPaid: string;
    needsInvoiceBadge: string;
    bookingRequestDetails: string;
    bookingRequester: string;
    bookingRequesterPhone: string;
    bookingRequestNotes: string;
    requestedBy: (name: string) => string;
    slotBooked: string;
    currentAppointmentSlot: string;
    loadingSlots: string;
    noSlots: string;
    selectServiceAndDate: string;
    enterDurationToSeeSlots: string;
    calendarView: string;
    listView: string;
    dayView: string;
    weekView: string;
    calendarToday: string;
    calendarPrev: string;
    calendarNext: string;
    reminderSection: string;
    lastReminderSent: string;
    reminderCountLabel: string;
    sendReminderNow: string;
    reminderSentSuccess: string;
    reminderNotSentYet: string;
    reminder24hSentLabel: string;
    reminder2hSentLabel: string;
    openWhatsApp: string;
    copyMessage: string;
    reminderSending: string;
    reminderHelperText: string;
    followUpCreatedAfterCompletionHelper: string;
    followUpPlanLockedHelper: string;
    followUpActiveInService: string;
    editServiceFollowUp: string;
    savedServiceBadge: string;
    followUpPlanActive: string;
    followUpUpcoming: string;
    followUpDue: (date: string) => string;
    followUpMissing: string;
    followUpBooked: string;
    followUpCompleted: string;
    followUpContacted: string;
    followUpMissed: string;
    followUpCancelled: string;
    reactivateAppointment: string;
    reactivateConfirm: string;
    reactivated: string;
    invoiceBlockedCancelled: string;
    followUpPlanExists: string;
    followUpPlanNone: string;
    followUpPlanSection: string;
    viewInFollowUps: string;
    followUpPlanLoading: string;
    followUpSession: (n: number) => string;
    followUpPlanNoRecord: string;
    followUpRecurringBadge: string;
    followUpNextDue: string;
    followUpLastCompleted: string;
    followUpPhaseHeader: (phase: number, days: number) => string;
    followUpPhaseTitle: (phase: number) => string;
    followUpPhaseSubtitle: (from: number, to: number, days: number) => string;
    followUpNextSessionBadge: string;
    followUpRelativeToday: string;
    followUpRelativeOverdue: (days: number) => string;
    followUpRelativeRemaining: (days: number) => string;
    reminderMessagesSection: string;
    followUpEvery: string;
    followUpIntervalDay: (n: number) => string;
    followUpIntervalWeek: (n: number) => string;
    followUpIntervalMonth: (n: number) => string;
    followUpIntervalYear: (n: number) => string;
  };
  reports: {
    title: string;
    subtitle: string;
    loading: string;
    loadError: string;
    todayRevenue: string;
    revenueThisMonth: string;
    paidInvoices: string;
    pendingInvoices: string;
    overdueInvoices: string;
    averageInvoiceValue: string;
    totalPaid: string;
    outstanding: string;
    patientCredit: string;
    cancelledInvoices: string;
    appointmentsToday: string;
    // period filter UI
    periodToday: string;
    periodLast7Days: string;
    periodWeek: string;
    periodMonth: string;
    periodCustom: string;
    filterFrom: string;
    filterTo: string;
    applyFilter: string;
    // generic period-agnostic card labels
    revenue: string;
    appointments: string;
    revenueByDay: string;
    revenueByPaymentStatus: string;
    revenueByService: string;
    noChartData: string;
    viewSessions: string;
    statusPaid: string;
    statusPending: string;
    statusPartial: string;
    statusOverdue: string;
    // top patients section
    topPatientsTitle: string;
    topPatientsEmpty: string;
    topPatientsTotalPaid: string;
    topPatientsVisits: string;
    topPatientsCredit: string;
    topPatientsVip: string;
    receivablesSectionTitle: string;
    receivablesSectionHelper: string;
    receivablesDetailsTitle: string;
    totalReceivables: string;
    patientsWithDebt: string;
    unpaidInvoices: string;
    partiallyPaidInvoices: string;
    highestDebt: string;
    invoiceCountIncluded: string;
    noFinancialDataInRange: string;
    selectedDateRange: string;
    openReceivablesOnly: string;
    overdueOnly: string;
    receivablesByPaymentStatus: string;
    topPatientsByDebt: string;
    revenueVsReceivables: string;
    revenueLabel: string;
    receivablesLabel: string;
    patient: string;
    phone: string;
    service: string;
    invoiceTotal: string;
    paidAmount: string;
    remainingAmount: string;
    paymentStatus: string;
    lastPayment: string;
    dueDate: string;
    notRecorded: string;
    noReceivablesData: string;
    todayOverviewTitle: string;
    appointmentsTodayTotal: string;
    appointmentsTodayCompleted: string;
    appointmentsTodayUpcoming: string;
    delayedFollowUps: string;
    newPatientsThisMonth: string;
    activeTreatmentPlans: string;
    revenueInsightsTitle: string;
    appointmentAnalyticsTitle: string;
    totalInPeriod: string;
    noShowCount: string;
    cancellationRate: string;
    noShowRate: string;
    topProvidersTitle: string;
    viewFullReceivables: string;
    hideFullReceivables: string;
    topDebtorsTitle: string;
    completedWithoutInvoiceTitle: string;
    completedWithoutInvoiceAlert: (count: number) => string;
    completedWithoutInvoiceEmpty: string;
    showAllUnbilled: string;
    showPeriodUnbilled: string;
  };
  profile: {
    title: string;
    subtitle: string;
    center: string;
    memberSince: string;
    permissionsTitle: string;
    noPermissions: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    updatePassword: string;
    updating: string;
    passwordUpdated: string;
    passwordMismatch: string;
    passwordTooShort: string;
    wrongPassword: string;
    loadError: string;
  };
  permissionLabels: {
    patientsView: string;
    patientsCreate: string;
    patientsUpdate: string;
    patientsStatus: string;
    staffView: string;
    staffCreate: string;
    staffUpdate: string;
    staffActivate: string;
    servicesView: string;
    servicesCreate: string;
    servicesUpdate: string;
    servicesArchive: string;
    servicesActivate: string;
    appointmentsView: string;
    appointmentsCreate: string;
    appointmentsUpdate: string;
    appointmentsCancel: string;
    appointmentsStatusUpdate: string;
    billingView: string;
    billingCreate: string;
    billingUpdate: string;
    billingMarkPaid: string;
    paymentsView: string;
    paymentsCreate: string;
    expensesView: string;
    expensesCreate: string;
    expensesEdit: string;
    expensesDelete: string;
    expensesReports: string;
    reportsView: string;
    settingsView: string;
    permissionsView: string;
    permissionsUpdate: string;
  };
  rolePermissions: {
    title: string;
    subtitle: string;
    selectRole: string;
    ownerProtected: string;
    savePermissions: string;
    saving: string;
    saved: string;
    loadError: string;
    paymentsSection: string;
  };
  serviceStatuses: Record<"ACTIVE" | "ARCHIVED", string>;
  staffStatuses: Record<"ACTIVE" | "INACTIVE", string>;
  billingStatuses: Record<"PENDING" | "PARTIAL" | "PAID" | "CANCELLED", string>;
  appointmentStatuses: Record<
    | "SCHEDULED"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW",
    string
  >;
  notifications: {
    title: string;
    subtitle: string;
    navLabel: string;
    loading: string;
    loadError: string;
    markAsRead: string;
    markingRead: string;
    markedRead: string;
    viewAll: string;
    filterAll: string;
    filterUnread: string;
    emptyTitle: string;
    emptyBody: string;
    emptyUnreadTitle: string;
    emptyUnreadBody: string;
    unreadCount: (n: number) => string;
    typeExpiring: string;
    typeExpired: string;
    typeBookingRequest: string;
    newBookingToast: string;
    openBookingRequests: string;
    statusPending: string;
    statusSent: string;
    statusFailed: string;
    widgetTitle: string;
    widgetNoUnread: string;
    corruptedFallback: string;
  };
  gallery: {
    title: string;
    subtitle: string;
    uploadButton: string;
    uploadingText: string;
    deleteButton: string;
    emptyTitle: string;
    emptyBody: string;
    loadError: string;
    uploadError: string;
    maxImages: string;
    recommendedSize: string;
    moveUp: string;
    moveDown: string;
  };
  marketing: {
    cancel: string;
    clearToken: string;
    fields: Record<
      | "customBodyScript"
      | "customHeadScript"
      | "ga4Id"
      | "gtmId"
      | "metaConversionApiToken"
      | "metaPixelId"
      | "snapPixelId"
      | "tiktokPixelId",
      string
    >;
    helper: string;
    logProviders: Record<"GA4" | "META_CAPI" | "META_PIXEL" | "SNAP" | "TIKTOK", string>;
    logsEmpty: string;
    logsError: string;
    logsRefresh: string;
    logsRefreshing: string;
    logsSection: string;
    logsSubtitle: string;
    logStatuses: Record<"FAILED" | "SKIPPED" | "SUCCESS", string>;
    loading: string;
    loadError: string;
    noChanges: string;
    optional: string;
    pixelSection: string;
    pixelSubtitle: string;
    save: string;
    saved: string;
    saveError: string;
    saving: string;
    scriptPlaceholder: string;
    scriptSection: string;
    scriptSubtitle: string;
    subtitle: string;
    scriptWarning: string;
    title: string;
    testClientError: string;
    testGa4: string;
    testGa4Success: string;
    testMetaCapi: string;
    testMetaCapiError: string;
    testMetaCapiSuccess: string;
    testMetaPixel: string;
    testMetaPixelSuccess: string;
    testSection: string;
    testSnapPixel: string;
    testSnapSuccess: string;
    testSubtitle: string;
    testTikTokPixel: string;
    testTikTokSuccess: string;
    tokenHelper: string;
    tokenPlaceholder: string;
    tokenSaved: string;
    unsaved: string;
  };
  placeholders: Record<
    "appointments" | "staff" | "billing" | "reports" | "settings",
    { title: string; description: string }
  >;
  comingSoon: string;
  patientStatuses: Record<"ACTIVE" | "INACTIVE" | "ARCHIVED", string>;
  patientGenders: Record<"MALE" | "FEMALE" | "OTHER" | "UNKNOWN", string>;
  roles: Record<CenterRoleKey, string>;
  statuses: Record<CenterStatusKey, string>;
};

export type { CenterAdminDictionary, CenterRoleKey, CenterStatusKey };

export const centerAdminDictionaries: Record<
  SupportedLocale,
  CenterAdminDictionary
> = {
  en: {
    brand: { name: "RoyalCare", console: "Center Control Panel" },
    languages: {
      en: "English",
      ar: "Arabic",
      he: "Hebrew",
    },
    login: {
      blockedCenter: "This center is not active. Please contact RoyalCare support.",
      centerNotFound: "This center login page is not available.",
      title: "Center Login",
      subtitle: "Sign in with your center staff account.",
      email: "Email",
      password: "Password",
      submit: "Sign In",
      submitting: "Signing in...",
      error: "Email or password is incorrect, or this account cannot sign in.",
    },
    shell: {
      accessDeniedBody: "Your role does not have permission to open this page.",
      accessDeniedTitle: "Access denied",
      menu: "Menu",
      close: "Close",
      language: "Language",
      logout: "Logout",
      loggingOut: "Logging out...",
      navGroups: {
        dailyOps: "Daily Operations",
        admin: "Administration",
        marketing: "Marketing & Website",
        content: "Content",
      },
    },
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      appointments: "Appointments",
      bookingRequests: "Booking Requests",
      followUps: "Follow-ups",
      services: "Services",
      staff: "Staff",
      billing: "Billing",
      expenses: "Expenses",
      reports: "Reports",
      notifications: "Notifications",
      schedule: "Schedule",
      settings: "Settings",
      permissions: "Role Permissions",
      gallery: "Gallery",
      reviews: "Reviews",
      beforeAfter: "Before / After",
      team: "Team",
      offers: "Offers",
      seo: "SEO",
      domain: "Domains",
      website: "Website",
      marketing: "Marketing",
      websiteAnalytics: "Website Analytics",
    },
    schedule: {
      addClosedDay: "Add closed day",
      addLeave: "Add leave",
      centerHours: "Center Working Hours",
      closed: "Closed",
      closedDays: "Closed Days / Holidays",
      date: "Date",
      delete: "Delete",
      endTime: "End",
      helper: "These settings control public booking availability.",
      invalidRange: "End time must be after start time.",
      leave: "Leave",
      loadError: "Could not load schedule settings. Please try again.",
      noClosedDays: "No closed days yet.",
      noLeave: "No provider leave days yet.",
      noProviders: "No providers available.",
      open: "Open",
      providerHours: "Provider Working Hours",
      providerLeave: "Provider Leave",
      providerSelect: "Provider",
      reason: "Reason",
      save: "Save",
      saved: "Schedule saved.",
      startTime: "Start",
      subtitle: "Configure working hours, holidays, and provider availability.",
      title: "Schedule",
    },
    bookingRequests: {
      title: "Booking Requests",
      subtitle: "Review and manage appointment requests submitted by visitors.",
      loading: "Loading booking requests...",
      loadError: "Could not load booking requests. Please try again.",
      empty: "No booking requests yet",
      emptyBody: "When visitors request appointments, they will appear here.",
      filterAll: "All",
      filterPending: "Pending",
      filterAccepted: "Accepted",
      filterRejected: "Rejected",
      fullName: "Name",
      phone: "Phone",
      service: "Service",
      requestedDate: "Date",
      requestedTime: "Time",
      notes: "Notes",
      status: "Status",
      statusPending: "Pending",
      statusAccepted: "Accepted",
      statusRejected: "Rejected",
      createdAt: "Received",
      accept: "Accept",
      reject: "Reject",
      accepting: "Accepting...",
      rejecting: "Rejecting...",
      contactWhatsApp: "WhatsApp",
      acceptSuccess: "Request accepted and appointment created.",
      rejectSuccess: "Request rejected.",
      errorAlreadyProcessed: "This request has already been processed.",
      errorGeneric: "An error occurred. Please try again.",
      pendingCount: (n) => `${n} pending`,
      openAppointment: "Open Appointment",
      linkedAppointmentUnavailable: "Accepted, but linked appointment is unavailable.",
      patientConflictMessage: (patientName) =>
        `This phone is already linked to ${patientName}. Link to the existing patient or create a new patient?`,
      existingPatient: "Existing patient",
      bookingPatient: "Booking request",
      linkToExistingPatient: "Link to existing patient",
      createNewPatient: "Create new patient",
    },
    dashboard: {
      eyebrow: "Center workspace",
      title: "Dashboard",
      subtitle: "Your private center control panel.",
      currentUser: "Current User",
      role: "Role",
      centerStatus: "Center Status",
      loading: "Loading dashboard...",
      loadError: "Could not load dashboard stats. Please try again.",
      sessionExpired: "Please log in again.",
      alerts: "Alerts",
      appointmentsToday: "Appointments today",
      appointmentsTodayHelper: "All today's appointments, any status.",
      completedToday: "Completed today",
      completedTodayHelper: "Appointments marked completed today.",
      noAlerts: "No urgent alerts right now.",
      noShowToday: "Missed / no-show",
      noShowTodayHelper: "Past appointments not completed or marked no-show.",
      patientsWithCredit: "Patients with credit",
      pendingInvoices: "Pending invoices",
      quickActions: "Quick Actions",
      recentAppointments: "Recent Appointments",
      recentInvoices: "Recent Invoices",
      revenueSnapshot: "Revenue Snapshot",
      todayActivity: "Today Activity",
      upcomingAppointmentSoon: "Upcoming appointment soon",
      upcomingNextTwoHours: "Active & upcoming (2 h)",
      upcomingNextTwoHoursHelper: "In-progress or starting within the next 2 hours.",
      viewDetails: "View details",
      subscription: {
        title: "Subscription",
        plan: "Plan",
        status: "Status",
        endDate: "End date",
        remainingDays: (days: number) => `${days} days remaining`,
        oneDayRemaining: "One day remaining",
        expiresToday: "Expires today",
        expiredSince: (days: number) => `Expired ${days} days ago`,
        suspended: "Account suspended",
        noSubscription: "No active subscription",
      },
    },
    subscriptionNotice: {
      activeTitle: "Subscription Active",
      expiringSoonTitle: "Subscription Expiring Soon",
      expiringSoonBody: (days: number) =>
        `Your subscription expires in ${days} day${days === 1 ? "" : "s"}. Please contact support to renew.`,
      expiredTitle: "Subscription Expired",
      expiredBody: "Your subscription has expired. Some features may be limited. Please contact support.",
      suspendedTitle: "Account Suspended",
      suspendedBody: "Your account has been suspended. Please contact support to restore access.",
      contactSupport: "Contact Support",
    },
    subscriptionBanner: {
      expiringTitle: (days: number) =>
        `Your subscription expires in ${days} day${days === 1 ? "" : "s"}.`,
      expiresTodayTitle: "Your subscription expires today.",
      expiredTitle: "Your subscription has expired. Please contact administration to renew it.",
      suspendedTitle: "Your account has been suspended. Please contact the administration.",
      contactAdmin: "Contact Administration",
      renewButton: "Renew Subscription",
      contactAdminButton: "Contact Administration",
      whatsappExpiringMessage: (centerName: string, days: number) =>
        `Hello, this is ${centerName}. Our RoyalCare subscription will expire in ${days} days. Please help us renew it.`,
      whatsappExpiringTodayMessage: (centerName: string) =>
        `Hello, this is ${centerName}. Our RoyalCare subscription expires today. Please help us renew it immediately.`,
      gracePeriodTitle: (days: number) =>
        `Your subscription has expired. You have ${days} day${days === 1 ? "" : "s"} remaining in your grace period.`,
      whatsappExpiredMessage: (centerName: string) =>
        `Hello, this is ${centerName}. Our RoyalCare subscription has expired. Please help us renew and reactivate it.`,
      whatsappGracePeriodMessage: (centerName: string, days: number) =>
        `Hello, this is ${centerName}. Our RoyalCare subscription has expired and we have ${days} day${days === 1 ? "" : "s"} left in our grace period. Please help us renew it as soon as possible.`,
      whatsappSuspendedMessage: (centerName: string) =>
        `Hello, this is ${centerName}. Our RoyalCare account is currently suspended. Please help us reactivate it.`,
    },
    subscriptionRenewal: {
      title: "Request Subscription Renewal",
      subtitle: "Your request will be sent to the RoyalCare administration team.",
      notePlaceholder: "Optional note for the support team...",
      submitButton: "Send Request",
      submittingButton: "Sending...",
      cancelButton: "Cancel",
      successTitle: "Request Sent",
      successBody: "Your renewal request has been received. The administration team will contact you shortly.",
      duplicateTitle: "Request Already Submitted",
      duplicateBody: "You already submitted a renewal request in the last 24 hours. Please wait for the administration team to respond.",
      errorTitle: "Could Not Send Request",
      errorBody: "An error occurred while submitting your request. Please try again or contact support directly.",
    },
    cards: {
      patients: "Patients",
      appointments: "Appointments",
      services: "Services",
      staff: "Staff Users",
    },
    common: {
      cancel: "Cancel",
      close: "Close",
      save: "Save",
      saving: "Saving...",
      search: "Search",
      view: "View",
      edit: "Edit",
      archive: "Archive",
      activate: "Activate",
      actions: "Actions",
      notAvailable: "Not available",
    },
    patients: {
      title: "Patients",
      subtitle: "Manage patient records for this center only.",
      addPatient: "Add Patient",
      addFirstPatient: "Add First Patient",
      editPatient: "Edit Patient",
      detailsTitle: "Patient Details",
      searchPlaceholder: "Search by patient name or phone",
      totalPatients: "Total Patients",
      activePatients: "Active Patients",
      archivedPatients: "Archived Patients",
      newPatientsThisMonth: "New This Month",
      filters: "Filters",
      allGenders: "All genders",
      allStatuses: "All statuses",
      archiveFilter: "Archive state",
      allArchiveStates: "All records",
      activeOnly: "Active only",
      archivedOnly: "Archived only",
      hasUpcomingAppointment: "Has upcoming appointment",
      hasReceivables: "Has receivables",
      unavailableFilter: "Needs summary data",
      filterAll: "All",
      filterYes: "Yes",
      filterNo: "No",
      treatmentPlansCount: "Treatment plans",
      overdueSessionsCount: "Overdue sessions",
      lastSession: "Last visit",
      appointmentsCount: "Appointments",
      nextSession: "Next session",
      outstandingBalance: "Outstanding balance",
      upcomingAppointmentsCount: "Upcoming appointments",
      noData: "None",
      quickActions: "Quick actions",
      createAppointment: "Create appointment",
      createTreatmentPlan: "Create treatment plan",
      createInvoice: "Create invoice",
      unavailableAction: "This action is not available yet.",
      moreActions: "More actions",
      paginationSummary: (shown, total) => `Showing ${shown} of ${total} patients`,
      paginationPrepared: "Pagination ready for larger lists",
      emptyTitle: "No patients yet",
      emptyBody: "Create the first patient record for this center.",
      noResultsTitle: "No matching patients",
      noResultsBody: "Try another name or phone number.",
      loading: "Loading patients...",
      fullName: "Full Name",
      fullNameAr: "Arabic Name",
      fullNameHe: "Hebrew Name",
      fullNameEn: "English Name",
      namesOptionalHint: "Optional: Enter the patient's name in other languages for multilingual display.",
      phone: "Phone",
      email: "Email",
      gender: "Gender",
      dateOfBirth: "Date of Birth",
      nationalId: "National ID",
      notes: "Notes",
      status: "Status",
      createdAt: "Created",
      updatedAt: "Updated",
      submit: "Create Patient",
      update: "Update Patient",
      fieldRequired: "This field is required.",
      invalidPhone: "Enter a valid phone number.",
      duplicatePhone: "A patient with this phone already exists.",
      loadError: "Patients could not be loaded. Please try again.",
      saved: "Patient saved.",
      archived: "Patient archived.",
      activated: "Patient activated.",
      notFound: "Patient not found.",
      deletePatient: "Delete Permanently",
      deleteConfirmTitle: "Delete Patient Permanently",
      deleteConfirmBody: "Are you sure? The patient will be permanently deleted and this cannot be undone.",
      deleteConfirmButton: "Delete Permanently",
      deleteBlocked: "Cannot delete: this patient has linked appointments, invoices, or follow-ups.",
      deleteBlockedTooltip: "This patient cannot be deleted because they are linked to records such as appointments, invoices, or follow-ups. You can archive them instead.",
      deleteBlockedWithCounts: (counts) => {
        const parts: string[] = [];
        if (counts.appointments > 0) parts.push(`${counts.appointments} appointment${counts.appointments !== 1 ? "s" : ""}`);
        if (counts.invoices > 0) parts.push(`${counts.invoices} invoice${counts.invoices !== 1 ? "s" : ""}`);
        if (counts.payments > 0) parts.push(`${counts.payments} payment${counts.payments !== 1 ? "s" : ""}`);
        if (counts.followUps > 0) parts.push(`${counts.followUps} follow-up${counts.followUps !== 1 ? "s" : ""}`);
        if (counts.creditTransactions > 0) parts.push(`${counts.creditTransactions} credit transaction${counts.creditTransactions !== 1 ? "s" : ""}`);
        return `Cannot delete: linked to ${parts.join(", ")}. You can archive instead.`;
      },
      deleted: "Patient deleted permanently.",
      patientPortal: {
        title: "Patient Portal",
        generate: "Generate Patient Portal Link",
        generating: "Generating link…",
        copyLink: "Copy Link",
        copied: "Copied!",
        openPortal: "Open Portal",
        shareWhatsApp: "Share via WhatsApp",
        error: "Could not generate a portal link. Please try again.",
      },
    },
    services: {
      title: "Services",
      subtitle: "Manage center services, duration, pricing, and active status.",
      addService: "Add Service",
      editService: "Edit Service",
      detailsTitle: "Service Details",
      searchPlaceholder: "Search by service name",
      filterAll: "All",
      filterActive: "Active",
      filterArchived: "Archived",
      emptyTitle: "No services yet",
      emptyBody: "Create the first service for this center.",
      noResultsTitle: "No matching services",
      noResultsBody: "Try another service name.",
      loading: "Loading services...",
      loadError: "Services could not be loaded. Please try again.",
      nameEn: "English Name",
      nameAr: "Arabic Name",
      nameHe: "Hebrew Name",
      descriptionEn: "English Description",
      descriptionAr: "Arabic Description",
      descriptionHe: "Hebrew Description",
      bufferMinutes: "Buffer time after service (minutes)",
      durationMinutes: "Duration",
      price: "Price",
      currency: "Currency",
      status: "Status",
      createdAt: "Created",
      updatedAt: "Updated",
      submit: "Create Service",
      update: "Update Service",
      saved: "Service saved.",
      archived: "Service archived.",
      activated: "Service activated.",
      notFound: "Service not found.",
      optional: "Optional",
      fieldRequired: "This field is required.",
      invalidBuffer: "Enter a valid buffer time.",
      invalidDuration: "Enter a valid duration.",
      invalidPrice: "Enter a valid price.",
      invalidCurrency: "Enter a valid currency code.",
      durationUnitMinutes: "Minutes",
      durationUnitHours: "Hours",
      enableFollowUpPlan: "Enable follow-up plan",
      followUpSettings: "Follow-up settings",
      followUpDescription:
        "Automatically create reminders when a treatment appointment is completed.",
      followUp: {
        none: "No follow-up",
        sessionBasedPlan: "Session-count treatment plan",
        sessionBasedHelper: "Automatically completes after all sessions are completed.",
        recurring: "Continuous recurring follow-up",
        recurringHelper: "Continues sending periodic reminders without a fixed session count.",
      },
      recurringIntervalLabel: "Repeat every",
      recurringUnitDay: "Days",
      recurringUnitWeek: "Weeks",
      recurringUnitMonth: "Months",
      recurringUnitYear: "Years",
      autoWhatsappReminderEnabled: "Enable automatic WhatsApp reminder",
      autoReminderDaysBefore: "Reminder days before due date",
      defaultIntervalDays: "Reminder interval (days)",
      planType: "Plan type",
      fixedInterval: "Session-count treatment plan",
      sessionPlan: "Session-count treatment plan",
      createNextReminderAutomatically: "Create next reminder automatically",
      totalRecommendedSessions: "Total recommended sessions",
      totalSessionsSummary: (count: number) => `Total sessions: ${count} sessions`,
      totalSessionsCalculated: "Calculated automatically from treatment phases",
      whatsappMessageArabic: "WhatsApp message in Arabic",
      whatsappMessageHebrew: "WhatsApp message in Hebrew",
      whatsappMessageEnglish: "WhatsApp message in English",
      sessionsFrom: "From session",
      sessionsTo: "To session",
      intervalDays: "Interval in days",
      addRule: "Add rule",
      removeRule: "Remove rule",
      followUpRuleHelper: "Divide the plan into phases by session count and reminder interval.",
      treatmentPhases: "Treatment Phases",
      treatmentPlanTemplates: "Treatment plan templates",
      treatmentPlanTemplatesHelper:
        "Create selectable protocols for this service. Patient plans keep a snapshot of the selected template.",
      addTreatmentTemplate: "Add template",
      noTreatmentTemplates:
        "No templates yet. Add protocols such as light, standard, or intensive plans.",
      treatmentTemplateTitle: (index: number) => `Template ${index}`,
      defaultTreatmentTemplate: "Default",
      activeTreatmentTemplate: "Active",
      sortOrder: "Sort order",
      templateUsesDefaultInterval:
        "No phase rules set. The template will use its default interval.",
      deleteTreatmentTemplate: "Delete template",
      treatmentTemplateSelect: "Choose treatment plan",
      treatmentTemplateOverrideHint:
        "The selected template fills the plan, and you can still customize it for this patient.",
      phaseTitle: (index: number) => `Treatment phase ${index}`,
      reminderAfterDays: (days: number) => `Reminder after ${days} days`,
      previewSessionLine: (session: number, days: number) =>
        days === 0 ? `Session ${session} (Appointment day)` : `Session ${session} → after ${days} days`,
      planPreview: "Plan preview",
      laserPreset: "Laser 8 sessions",
      hijamaPreset: "Preventive hijama",
      skincarePreset: "Monthly skin cleaning",
      applyPreset: "Apply preset",
      editPhase: "Edit",
      deletePhase: "Delete phase",
      planCalcExplanation: "Session 1 is the appointment itself. Each subsequent session is scheduled after the phase interval.",
      planPreviewPhaseLabel: (from: number, to: number, days: number) => `Sessions ${from}–${to} · Every ${days} days`,
      overlappingRanges: "Some session ranges overlap.",
      uncoveredSessions: (range: string) =>
        `Sessions ${range} do not have a follow-up rule.`,
      invalidIntervals: "Reminder interval must be a positive number of days.",
      invalidRangeOrder: "Start session must be less than or equal to end session.",
      firstPhaseMustStartAtOne: "First phase must start at session 1.",
      noGapsAllowed: "Treatment phases must be consecutive with no gaps.",
      deleteService: "Delete Permanently",
      deleteServiceConfirmTitle: "Delete Service Permanently",
      deleteServiceConfirmBody:
        "Are you sure? This service will be permanently deleted and cannot be recovered.",
      deleteServiceConfirmButton: "Delete Permanently",
      deleteServiceBlocked:
        "Cannot delete: this service is linked to existing appointments, invoices, or booking requests.",
      deleteServiceBlockedTooltip:
        "Cannot delete this service because it is linked to appointments, invoices, or booking requests. Archive it instead.",
      deleted: "Service deleted permanently.",
      followUpBadge: "Follow-up Plan",
      noFollowUpBadge: "No Follow-up",
      sessionBasedPlanLabel: "Session-count treatment plan",
      recurringContinuousLabel: "Continuous recurring follow-up",
      templateCountBadge: (count: number) => `${count} template${count === 1 ? "" : "s"}`,
      defaultTemplateSummary: (name: string, sessions: number) => `Default: ${name} · ${sessions} sessions`,
      totalSessionsBadge: (count: number) => `${count} sessions total`,
      intervalDaysBadge: (days: number) => `Every ${days} days`,
      followUpAutoHint: "This service auto-creates a follow-up plan when an appointment is completed",
    },
    staff: {
      title: "Staff",
      subtitle: "Manage center staff users, roles, and access status.",
      addStaff: "Add Staff",
      editStaff: "Edit Staff",
      detailsTitle: "Staff Details",
      searchPlaceholder: "Search by name or email",
      filterAllRoles: "All Roles",
      filterAllStatuses: "All Statuses",
      emptyTitle: "No staff users yet",
      emptyBody: "Create the first staff user for this center.",
      noResultsTitle: "No matching staff",
      noResultsBody: "Try another name, email, role, or status.",
      loading: "Loading staff...",
      loadError: "Staff could not be loaded. Please try again.",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      passwordOptional: "Optional on edit",
      providerEnabled: "Can provide services / show in provider list",
      providerEnabledHelper:
        "When enabled, this active staff member appears in appointment provider lists regardless of role.",
      role: "Role",
      status: "Status",
      createdAt: "Created",
      updatedAt: "Updated",
      submit: "Create Staff",
      update: "Update Staff",
      saved: "Staff saved.",
      activated: "Staff activated.",
      deactivated: "Staff deactivated.",
      notFound: "Staff member not found.",
      fieldRequired: "This field is required.",
      invalidEmail: "Enter a valid staff email.",
      duplicateEmail: "A user with this email already exists.",
      invalidPassword: "Password must be at least 8 characters.",
      permissionsTitle: "Access Permissions",
      centerLabel: "Center",
      phone: "Phone",
    },
    billing: {
      title: "Billing",
      subtitle: "Manage manual invoices and payment records for this center.",
      addInvoice: "Add Invoice",
      invoiceTitle: "Invoice Details",
      searchPlaceholder: "Search by patient name or phone",
      filterAllStatuses: "All Statuses",
      filterAll: "All",
      emptyTitle: "No active invoices yet",
      emptyBody: "Create the first invoice for this center.",
      emptyPendingTitle: "No pending invoices",
      emptyPendingBody: "All invoices are fully paid or cancelled.",
      emptyPartialTitle: "No partially paid invoices",
      emptyPartialBody: "No invoices have partial payments at this time.",
      emptyPaidTitle: "No paid invoices yet",
      emptyPaidBody: "Mark an invoice as paid to see it here.",
      emptyCancelledTitle: "No cancelled invoices",
      emptyCancelledBody: "Cancelled invoices will appear here.",
      loading: "Loading invoices...",
      loadError: "Invoices could not be loaded. Please try again.",
      patient: "Patient",
      service: "Service",
      customService: "Service not in list",
      customServiceName: "Custom service name",
      customServiceDuration: "Custom service duration",
      customServicePrice: "Custom service price",
      saveCustomService: "Save as a future service",
      customServiceBadge: "Custom service",
      provider: "Provider",
      providerOptional: "Optional",
      noProvider: "No provider",
      selectPatient: "Select a patient",
      selectService: "Select a service",
      amount: "Amount",
      currency: "Currency",
      status: "Status",
      notes: "Notes",
      notesOptional: "Optional",
      createdAt: "Created",
      updatedAt: "Updated",
      submit: "Create Invoice",
      markedPaid: "Invoice marked as paid.",
      invoiceFullyPaid: "This invoice is fully paid. No new payment can be added.",
      cancelled: "Invoice cancelled.",
      notFound: "Invoice not found.",
      fieldRequired: "This field is required.",
      invalidAmount: "Enter a valid amount greater than zero.",
      markAsPaid: "Mark as Paid",
      cancelInvoice: "Cancel Invoice",
      reopenInvoice: "Reopen Invoice",
      reopened: "Invoice reopened to pending.",
      addPayment: "Add Payment",
      paymentHistory: "Payment History",
      paymentMethod: "Payment Method",
      paymentDate: "Payment Date",
      paymentNotes: "Notes",
      paymentNotesOptional: "Optional",
      methodCash: "Cash",
      methodBankTransfer: "Bank Transfer",
      methodCheck: "Check",
      methodOther: "Other",
      paymentAdded: "Payment recorded successfully.",
      noPayments: "No payments recorded yet.",
      invoiceTotal: "Invoice Total",
      paidAmount: "Paid",
      balanceDue: "Balance Due",
      paymentBy: "by",
      overpaymentError: "Payment failed. Please try again.",
      overpaymentCreditHint: "Extra amount will be saved as patient credit.",
      invalidPaymentDate: "Enter a valid payment date.",
      creditBalance: "Credit Balance",
      useCredit: "Use Credit",
      creditAmount: "Credit Amount",
      creditApplied: "Credit applied successfully.",
      noCreditAvailable: "This patient has no available credit.",
      insufficientCredit: "Insufficient credit balance.",
      noCreditDue: "No remaining invoice balance to use credit.",
      creditAdded: "Credit added to patient account.",
      overpaymentCreditNotice: "Overpayment stored as patient credit.",
      creditSourceOverpayment: "From overpayment",
      creditSourceManual: "Manual adjustment",
      creditSourceAdjustment: "Adjustment",
      creditUsageLabel: "Credit used",
      invoiceTotalDesc: "Full value of all services in this appointment.",
      paidAmountDesc: "Total amount already collected from the patient.",
      balanceDueDesc: "Amount still owed by the patient.",
      balanceDueTooltip: "Balance Due = Invoice Total − Paid",
      creditBalanceDesc: "Stored credit available for future bills or sessions.",
      statusPaidDesc: "Invoice fully collected.",
      statusPartialDesc: "Part paid — a balance remains.",
      statusPendingDesc: "No payment received yet.",
    },
    appointments: {
      title: "Appointments",
      subtitle: "Schedule, update, and follow up appointments for this center.",
      addAppointment: "Add Appointment",
      editAppointment: "Edit Appointment",
      detailsTitle: "Appointment Details",
      searchPlaceholder: "Search by patient name or phone",
      filterAll: "All Statuses",
      today: "Today",
      upcoming: "Upcoming",
      dateFilter: "Date",
      providerFilter: "Provider",
      allProviders: "All Providers",
      allBranches: "All Branches",
      branch: "Branch",
      chooseBranch: "Choose branch",
      emptyTitle: "No appointments yet",
      emptyBody: "Create the first appointment for this center.",
      noResultsTitle: "No matching appointments",
      noResultsBody: "Try another patient, status, date, or provider.",
      loading: "Loading appointments...",
      loadError: "Appointments could not be loaded. Please try again.",
      patient: "Patient",
      service: "Service",
      customService: "Service not in list",
      customServiceName: "Custom service name",
      customServiceDuration: "Session duration (min)",
      customServiceDurationPlaceholder: "e.g. 15",
      customServiceDurationHelper: "Duration is calculated in minutes",
      customServicePrice: "Service price (₪)",
      customServicePricePlaceholder: "e.g. 80",
      customServicePriceHelper: "Price is calculated in ILS (₪)",
      saveCustomService: "Save as a future service",
      customServiceBadge: "Custom service",
      provider: "Provider",
      appointmentDate: "Appointment Date",
      startTime: "Start Time",
      endTime: "End Time",
      durationMinutes: "Appointment duration (minutes)",
      durationMinutesPlaceholder: "e.g. 15",
      durationMinutesHelper: "Appointment duration is calculated in minutes.",
      status: "Status",
      notes: "Treatment Notes",
      notesHelper: "Shown in treatment history and future follow-ups.",
      internalNotes: "Internal Staff Notes",
      internalNotesHelper: "Not shown to patients or follow-up messages.",
      cancellationReason: "Cancellation Reason",
      reminderSent: "Reminder Sent",
      createdAt: "Created",
      updatedAt: "Updated",
      createdBy: "Created By",
      submit: "Create Appointment",
      update: "Update Appointment",
      saved: "Appointment saved.",
      saveError: "Could not save the appointment. Please try again.",
      cancelled: "Appointment cancelled.",
      statusUpdated: "Appointment status updated.",
      notFound: "Appointment not found.",
      fieldRequired: "This field is required.",
      invalidDate: "Select a valid appointment date.",
      invalidTime: "Select a valid time.",
      invalidDuration: "Enter a valid duration.",
      overlap: "This appointment overlaps with another booking.",
      cancelAppointment: "Cancel Appointment",
      confirmCancel: "Confirm Cancellation",
      changeStatus: "Change Status",
      conflictTitle: "Appointment conflict detected",
      conflictMessage: "Please choose a different time slot",
      conflictPatient: "Patient",
      conflictService: "Service",
      conflictProvider: "Provider",
      conflictDate: "Date",
      conflictStart: "Start time",
      conflictEnd: "End time",
      startsInMinutes: "Starts in {n} minutes",
      inProgressNow: "In progress now",
      endOfDayError: "Appointment must end before midnight.",
      invoiceSection: "Invoice",
      noInvoice: "No invoice yet",
      noInvoiceBody: "Create an invoice to track payment for this appointment.",
      createInvoice: "Create Invoice",
      openInvoice: "Open Invoice",
      invoiceCreated: "Invoice created successfully.",
      noServicePrice: "Service has no price set. Open billing to create the invoice manually.",
      invoiceUnpaid: "Unpaid",
      viewInvoice: "View Invoice",
      invoiceRequiresCompleted: "Invoice can only be created after the appointment is completed.",
      invoiceFullyPaid: "This invoice is fully paid.",
      needsInvoiceBadge: "Needs Invoice",
      bookingRequestDetails: "Booking Request Details",
      bookingRequester: "Requester",
      bookingRequesterPhone: "Requester Phone",
      bookingRequestNotes: "Request Notes",
      requestedBy: (name) => `Requested by: ${name}`,
      slotBooked: "Booked",
      currentAppointmentSlot: "Current appointment",
      loadingSlots: "Loading available times...",
      noSlots: "No available slots for this date.",
      selectServiceAndDate: "Select a service and date to see available times.",
      enterDurationToSeeSlots: "Enter session duration to see available times.",
      calendarView: "Calendar",
      listView: "List",
      dayView: "Day",
      weekView: "Week",
      calendarToday: "Today",
      calendarPrev: "Previous",
      calendarNext: "Next",
      reminderSection: "Patient Reminder",
      lastReminderSent: "Last Reminder Sent",
      reminderCountLabel: "Reminders Sent",
      sendReminderNow: "Send WhatsApp Reminder",
      reminderSentSuccess: "Reminder prepared. Open WhatsApp to send.",
      reminderNotSentYet: "No reminder sent yet.",
      reminder24hSentLabel: "24h reminder sent",
      reminder2hSentLabel: "2h reminder sent",
      openWhatsApp: "Open WhatsApp",
      copyMessage: "Copy Message",
      reminderSending: "Preparing...",
      reminderHelperText: "WhatsApp opens with a prefilled message.",
      followUpCreatedAfterCompletionHelper: "The follow-up will be created automatically after this appointment is marked completed.",
      followUpPlanLockedHelper: "Follow-up plan is only available when saving the service for future use.",
      followUpActiveInService: "Follow-up plan is enabled for this service.",
      editServiceFollowUp: "Edit follow-up settings in the service",
      savedServiceBadge: "This service is saved in the services list",
      followUpPlanActive: "Follow-up Plan Active",
      followUpUpcoming: "Upcoming Follow-up",
      followUpDue: (date: string) => `Follow-up due: ${date}`,
      followUpMissing: "Follow-up not created",
      followUpBooked: "Appointment Booked",
      followUpCompleted: "Follow-up Completed",
      followUpContacted: "Contacted",
      followUpMissed: "Follow-up Missed",
      followUpCancelled: "Follow-up Cancelled",
      reactivateAppointment: "Reactivate Appointment",
      reactivateConfirm: "Reactivate this appointment? It will be returned to Confirmed status.",
      reactivated: "Appointment reactivated successfully.",
      invoiceBlockedCancelled: "Invoice cannot be created for a cancelled appointment.",
      followUpPlanExists: "Follow-up Plan Active",
      followUpPlanNone: "No Follow-up Plan",
      followUpPlanSection: "Follow-up Plan",
      viewInFollowUps: "View in Follow-ups",
      followUpPlanLoading: "Loading plan...",
      followUpSession: (n: number) => `Session ${n}`,
      followUpPlanNoRecord: "No follow-up plan for this appointment",
      followUpRecurringBadge: "♾ Recurring",
      followUpNextDue: "Next follow-up",
      followUpLastCompleted: "Last completed",
      followUpPhaseHeader: (phase: number, days: number) => `Phase ${phase} — every ${days} days`,
      followUpPhaseTitle: (phase: number) => `Treatment Phase ${phase}`,
      followUpPhaseSubtitle: (from: number, to: number, days: number) => `Sessions ${from} → ${to} • Every ${days} days`,
      followUpNextSessionBadge: "Next Session",
      followUpRelativeToday: "Today",
      followUpRelativeOverdue: (days: number) => days === 1 ? "1 day overdue" : `${days} days overdue`,
      followUpRelativeRemaining: (days: number) => days === 1 ? "1 day left" : `${days} days left`,
      reminderMessagesSection: "Reminder Messages",
      followUpEvery: "Every",
      followUpIntervalDay: (n: number) => n === 1 ? "day" : "days",
      followUpIntervalWeek: (n: number) => n === 1 ? "week" : "weeks",
      followUpIntervalMonth: (n: number) => n === 1 ? "month" : "months",
      followUpIntervalYear: (n: number) => n === 1 ? "year" : "years",
    },
    reports: {
      title: "Financial Reports",
      subtitle: "Revenue, outstanding balances, and activity for the selected period.",
      loading: "Loading report...",
      loadError: "Failed to load data.",
      todayRevenue: "Today's Revenue",
      revenueThisMonth: "Revenue This Month",
      paidInvoices: "Paid Invoices",
      pendingInvoices: "Pending Invoices",
      overdueInvoices: "Overdue Invoices",
      averageInvoiceValue: "Average Invoice Value",
      totalPaid: "Total Collected",
      outstanding: "Outstanding Balance",
      patientCredit: "Patient Credit",
      cancelledInvoices: "Cancelled Invoices",
      appointmentsToday: "Appointments Today",
      periodToday: "Today",
      periodLast7Days: "Last 7 days",
      periodWeek: "This Week",
      periodMonth: "This Month",
      periodCustom: "Custom",
      filterFrom: "From",
      filterTo: "To",
      applyFilter: "Apply",
      revenue: "Revenue",
      appointments: "Appointments",
      revenueByDay: "Revenue by day",
      revenueByPaymentStatus: "Revenue by payment status",
      revenueByService: "Revenue by service",
      noChartData: "Not enough data for this period.",
      viewSessions: "View sessions",
      statusPaid: "Paid",
      statusPending: "Pending",
      statusPartial: "Partial",
      statusOverdue: "Overdue",
      topPatientsTitle: "Top Patients",
      topPatientsEmpty: "No data for this period.",
      topPatientsTotalPaid: "Total Paid",
      topPatientsVisits: "visits",
      topPatientsCredit: "Credit",
      topPatientsVip: "VIP",
      receivablesSectionTitle: "Outstanding Receivables",
      receivablesSectionHelper: "Shows every open balance, even when it is outside the selected period.",
      receivablesDetailsTitle: "Receivables Details",
      totalReceivables: "Total Receivables",
      patientsWithDebt: "Patients with Balances",
      unpaidInvoices: "Unpaid Invoices",
      partiallyPaidInvoices: "Partially Paid Invoices",
      highestDebt: "Highest Debt",
      invoiceCountIncluded: "Invoices in selected range",
      noFinancialDataInRange: "No financial data exists in the selected period.",
      selectedDateRange: "Selected date range",
      openReceivablesOnly: "Open receivables only",
      overdueOnly: "Overdue only",
      receivablesByPaymentStatus: "Receivables by payment status",
      topPatientsByDebt: "Top Patients by Debt",
      revenueVsReceivables: "Revenue vs Receivables",
      revenueLabel: "Revenue",
      receivablesLabel: "Receivables",
      patient: "Patient",
      phone: "Phone",
      service: "Service",
      invoiceTotal: "Invoice Total",
      paidAmount: "Paid",
      remainingAmount: "Remaining",
      paymentStatus: "Payment Status",
      lastPayment: "Last Payment",
      dueDate: "Due Date",
      notRecorded: "Not recorded",
      noReceivablesData: "No receivables match these filters.",
      todayOverviewTitle: "Today's Overview",
      appointmentsTodayTotal: "Appointments Today",
      appointmentsTodayCompleted: "Completed Today",
      appointmentsTodayUpcoming: "Upcoming Today",
      delayedFollowUps: "Delayed Follow-ups",
      newPatientsThisMonth: "New Patients This Month",
      activeTreatmentPlans: "Active Treatment Plans",
      revenueInsightsTitle: "Revenue Insights",
      appointmentAnalyticsTitle: "Appointment Analytics",
      totalInPeriod: "Total Appointments",
      noShowCount: "No-Shows",
      cancellationRate: "Cancellation Rate",
      noShowRate: "No-Show Rate",
      topProvidersTitle: "Top Providers",
      viewFullReceivables: "View Full Receivables",
      hideFullReceivables: "Hide Receivables",
      topDebtorsTitle: "Top Outstanding Balances",
      completedWithoutInvoiceTitle: "Completed Without Invoice",
      completedWithoutInvoiceAlert: (count: number) => `${count} completed session${count === 1 ? '' : 's'} without an invoice`,
      completedWithoutInvoiceEmpty: "All completed sessions have invoices.",
      showAllUnbilled: "All time — ignore date range",
      showPeriodUnbilled: "Show period only",
    },
    profile: {
      title: "My Profile",
      subtitle: "Your account information and access permissions.",
      center: "Center",
      memberSince: "Member Since",
      permissionsTitle: "Access Permissions",
      noPermissions: "No permissions assigned.",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      updatePassword: "Update Password",
      updating: "Updating...",
      passwordUpdated: "Password updated successfully.",
      passwordMismatch: "New passwords do not match.",
      passwordTooShort: "Password must be at least 8 characters.",
      wrongPassword: "Current password is incorrect.",
      loadError: "Profile could not be loaded. Please try again.",
    },
      permissionLabels: {
        patientsView: "View Patients",
        patientsCreate: "Create Patients",
        patientsUpdate: "Edit Patients",
        patientsStatus: "Update Patient Status",
        staffView: "View Staff",
      staffCreate: "Create Staff",
      staffUpdate: "Edit Staff",
      staffActivate: "Activate / Deactivate Staff",
      servicesView: "View Services",
      servicesCreate: "Create Services",
      servicesUpdate: "Edit Services",
      servicesArchive: "Archive Services",
      servicesActivate: "Activate Services",
      appointmentsView: "View Appointments",
      appointmentsCreate: "Create Appointments",
      appointmentsUpdate: "Edit Appointments",
      appointmentsCancel: "Cancel Appointments",
      appointmentsStatusUpdate: "Update Appointment Status",
      billingView: "View Invoices",
      billingCreate: "Create Invoices",
        billingUpdate: "Update Invoices",
        billingMarkPaid: "Cancel Invoices",
        paymentsView: "View Payments",
        paymentsCreate: "Record Payments",
        expensesView: "View Expenses",
        expensesCreate: "Create Expenses",
        expensesEdit: "Edit Expenses",
        expensesDelete: "Delete Expenses",
        expensesReports: "Expense Reports",
        reportsView: "View Reports",
        settingsView: "View Settings",
        permissionsView: "View Role Permissions",
        permissionsUpdate: "Update Role Permissions",
      },
    rolePermissions: {
      title: "Role Permissions",
      subtitle: "Configure which actions each role can perform in this center.",
      selectRole: "Select a role to manage its permissions.",
      ownerProtected: "The Center Owner role has full access and cannot be modified.",
      savePermissions: "Save Permissions",
      saving: "Saving...",
      saved: "Permissions saved.",
      loadError: "Permissions could not be loaded. Please try again.",
      paymentsSection: "Payments",
    },
    notifications: {
      title: "Notifications",
      subtitle: "Subscription alerts and system notifications for this center.",
      navLabel: "Notifications",
      loading: "Loading notifications...",
      loadError: "Notifications could not be loaded. Please try again.",
      markAsRead: "Mark as read",
      markingRead: "Marking...",
      markedRead: "Marked as read",
      viewAll: "View all notifications",
      filterAll: "All",
      filterUnread: "Unread",
      emptyTitle: "No notifications",
      emptyBody: "You will see subscription alerts and system notifications here.",
      emptyUnreadTitle: "No unread notifications",
      emptyUnreadBody: "All notifications have been read.",
      unreadCount: (n: number) => `${n} unread`,
      typeExpiring: "Subscription Expiring",
      typeExpired: "Subscription Expired",
      typeBookingRequest: "Booking Request",
      newBookingToast: "A new booking request just arrived.",
      openBookingRequests: "Open booking requests",
      statusPending: "Pending",
      statusSent: "Sent",
      statusFailed: "Failed",
      widgetTitle: "Notifications",
      widgetNoUnread: "No new notifications.",
      corruptedFallback: "New notification",
    },
    gallery: {
      title: "Gallery",
      subtitle: "Manage the photos displayed on your center's public profile.",
      uploadButton: "Upload Photo",
      uploadingText: "Uploading...",
      deleteButton: "Delete",
      emptyTitle: "No photos yet",
      emptyBody: "Upload photos to showcase your center on your public profile.",
      loadError: "Could not load gallery. Please try again.",
      uploadError: "Upload failed. Please check the file and try again.",
      maxImages: "Maximum 20 photos allowed.",
      recommendedSize: "Recommended: JPG or PNG, minimum 800 x 600 px.",
      moveUp: "Move up",
      moveDown: "Move down",
    },
    marketing: {
      cancel: "Cancel changes",
      clearToken: "Clear saved token",
      fields: {
        customBodyScript: "Custom Body Script",
        customHeadScript: "Custom Head Script",
        ga4Id: "GA4 ID",
        gtmId: "GTM ID",
        metaConversionApiToken: "Meta Conversion API Token",
        metaPixelId: "Meta Pixel ID",
        snapPixelId: "Snap Pixel ID",
        tiktokPixelId: "TikTok Pixel ID",
      },
      helper:
        "These values are saved for your center only. Public tracking runs only on your public center pages.",
      logProviders: {
        GA4: "GA4",
        META_CAPI: "Meta CAPI",
        META_PIXEL: "Meta Pixel",
        SNAP: "Snap Pixel",
        TIKTOK: "TikTok Pixel",
      },
      logsEmpty: "No tracking logs yet.",
      logsError: "Could not refresh tracking logs.",
      logsRefresh: "Refresh",
      logsRefreshing: "Refreshing...",
      logsSection: "Recent tracking logs",
      logsSubtitle: "Safe debug history for server-side marketing events.",
      logStatuses: {
        FAILED: "Failed",
        SKIPPED: "Skipped",
        SUCCESS: "Success",
      },
      loading: "Loading marketing settings...",
      loadError: "Could not load marketing settings. Please try again.",
      noChanges: "No unsaved changes.",
      optional: "Optional",
      pixelSection: "Tracking IDs",
      pixelSubtitle: "Store pixel and analytics identifiers used by your public booking pages.",
      save: "Save marketing settings",
      saved: "Marketing settings saved.",
      saveError: "Could not save marketing settings. Please try again.",
      saving: "Saving...",
      scriptPlaceholder: "Paste script here. It will run only on your public center pages.",
      scriptSection: "Custom Scripts",
      scriptSubtitle: "Manage custom head/body scripts for public center pages only.",
      scriptWarning: "Only paste scripts from providers you trust. Custom scripts run on public center pages and never inside the admin dashboard.",
      subtitle: "Manage center marketing pixels, server-side Meta CAPI token, and public-page scripts.",
      title: "Marketing Settings",
      testClientError: "The test event could not be sent. Check that this provider script is loaded on the public page.",
      testGa4: "Test GA4",
      testGa4Success: "GA4 test event was triggered.",
      testMetaCapi: "Test Meta CAPI",
      testMetaCapiError: "Meta CAPI test failed. Check the saved Pixel ID and token.",
      testMetaCapiSuccess: "Meta CAPI test event was sent.",
      testMetaPixel: "Test Meta Pixel",
      testMetaPixelSuccess: "Meta Pixel test event was triggered.",
      testSection: "Test Tracking",
      testSnapPixel: "Test Snap Pixel",
      testSnapSuccess: "Snap Pixel test event was triggered.",
      testSubtitle: "Send a safe TestMarketingEvent to verify saved tracking setup.",
      testTikTokPixel: "Test TikTok Pixel",
      testTikTokSuccess: "TikTok Pixel test event was triggered.",
      tokenHelper: "Stored securely for backend-only Meta Conversion API events. It is never exposed on public pages.",
      tokenPlaceholder: "Saved token is hidden. Enter a new token to replace it.",
      tokenSaved: "A Meta Conversion API token is saved and hidden.",
      unsaved: "You have unsaved changes.",
    },
    serviceStatuses: {
      ACTIVE: "Active",
      ARCHIVED: "Archived",
    },
    staffStatuses: {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
    },
    billingStatuses: {
      PENDING: "Pending",
      PARTIAL: "Partially Paid",
      PAID: "Paid",
      CANCELLED: "Cancelled",
    },
    appointmentStatuses: {
      SCHEDULED: "Scheduled",
      CONFIRMED: "Confirmed",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      NO_SHOW: "No Show",
    },
    placeholders: {
      appointments: {
        title: "Appointments",
        description: "Appointments management will be added after Services are ready.",
      },
      staff: {
        title: "Staff",
        description: "Tenant staff tools will be expanded in a future module.",
      },
      billing: {
        title: "Billing",
        description: "Manual billing information will appear here. No online payments are enabled.",
      },
      reports: {
        title: "Reports",
        description: "Operational reports will be added later.",
      },
      settings: {
        title: "Settings",
        description: "Center settings will be added in a future module.",
      },
    },
    comingSoon: "Coming soon",
    patientStatuses: {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
      ARCHIVED: "Archived",
    },
    patientGenders: {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
      UNKNOWN: "Not specified",
    },
    roles: {
      CENTER_OWNER: "Center Owner",
      CENTER_MANAGER: "Center Manager",
      DOCTOR: "Doctor",
      RECEPTIONIST: "Receptionist",
      ACCOUNTANT: "Accountant",
      STAFF: "Staff",
    },
    statuses: {
      TRIAL: "Trial",
      ACTIVE: "Active",
      PAST_DUE: "Past due",
      SUSPENDED: "Suspended",
      CANCELLED: "Cancelled",
      ARCHIVED: "Archived",
    },
  },
  ar: {
    brand: { name: "رويال كير", console: "لوحة تحكم المركز" },
    languages: { en: "الإنجليزية", ar: "العربية", he: "العبرية" },
    login: { blockedCenter: "هذا المركز غير نشط. يرجى التواصل مع دعم رويال كير.", centerNotFound: "صفحة تسجيل دخول هذا المركز غير متاحة.", title: "تسجيل دخول المركز", subtitle: "سجل الدخول باستخدام حساب طاقم المركز.", email: "البريد الإلكتروني", password: "كلمة المرور", submit: "تسجيل الدخول", submitting: "جار تسجيل الدخول...", error: "البريد الإلكتروني أو كلمة المرور غير صحيحة، أو لا يمكن لهذا الحساب تسجيل الدخول." },
    shell: { accessDeniedBody: "لا يملك دورك صلاحية فتح هذه الصفحة.", accessDeniedTitle: "تم رفض الوصول", menu: "القائمة", close: "إغلاق", language: "اللغة", logout: "تسجيل الخروج", loggingOut: "جار تسجيل الخروج...", navGroups: { dailyOps: "العمليات اليومية", admin: "الإدارة", marketing: "التسويق والموقع", content: "المحتوى" } },
    nav: { dashboard: "لوحة التحكم", patients: "المرضى", appointments: "المواعيد", bookingRequests: "طلبات الحجز", followUps: "المتابعات", services: "الخدمات", staff: "الطاقم", billing: "الفوترة", expenses: "المصاريف", reports: "التقارير", notifications: "الإشعارات", schedule: "الدوام", settings: "الإعدادات", permissions: "صلاحيات الأدوار", gallery: "معرض الصور", reviews: "التقييمات", beforeAfter: "قبل وبعد", team: "الفريق", offers: "العروض", seo: "SEO", domain: "النطاقات", website: "الموقع", marketing: "التسويق", websiteAnalytics: "تحليلات الموقع" },
    schedule: { addClosedDay: "إضافة يوم إغلاق", addLeave: "إضافة إجازة", centerHours: "دوام المركز", closed: "مغلق", closedDays: "أيام الإغلاق / العطل", date: "التاريخ", delete: "حذف", endTime: "النهاية", helper: "هذه الإعدادات تتحكم في أوقات الحجز العام.", invalidRange: "يجب أن يكون وقت النهاية بعد البداية.", leave: "إجازة", loadError: "تعذر تحميل إعدادات الدوام. يرجى المحاولة مرة أخرى.", noClosedDays: "لا توجد أيام إغلاق بعد.", noLeave: "لا توجد إجازات للمقدمين بعد.", noProviders: "لا يوجد مقدمون متاحون.", open: "مفتوح", providerHours: "دوام المقدم", providerLeave: "إجازات المقدمين", providerSelect: "المقدم", reason: "السبب", save: "حفظ", saved: "تم حفظ الدوام.", startTime: "البداية", subtitle: "إعداد دوام المركز والعطل وتوفر المقدمين.", title: "الدوام" },
    bookingRequests: { title: "طلبات الحجز", subtitle: "راجع وأدر طلبات المواعيد المقدمة من الزوار.", loading: "جار تحميل طلبات الحجز...", loadError: "تعذر تحميل طلبات الحجز. يرجى المحاولة مرة أخرى.", empty: "لا توجد طلبات حجز بعد", emptyBody: "عندما يطلب الزوار مواعيد، ستظهر هنا.", filterAll: "الكل", filterPending: "قيد الانتظار", filterAccepted: "مقبولة", filterRejected: "مرفوضة", fullName: "الاسم", phone: "الهاتف", service: "الخدمة", requestedDate: "التاريخ", requestedTime: "الوقت", notes: "ملاحظات", status: "الحالة", statusPending: "قيد الانتظار", statusAccepted: "مقبول", statusRejected: "مرفوض", createdAt: "تاريخ الاستلام", accept: "قبول", reject: "رفض", accepting: "جار القبول...", rejecting: "جار الرفض...", contactWhatsApp: "واتساب", acceptSuccess: "تم قبول الطلب وإنشاء الموعد.", rejectSuccess: "تم رفض الطلب.", errorAlreadyProcessed: "تمت معالجة هذا الطلب بالفعل.", errorGeneric: "حدث خطأ. يرجى المحاولة مرة أخرى.", pendingCount: (n: number) => `${n} قيد الانتظار`, openAppointment: "فتح الموعد", linkedAppointmentUnavailable: "مقبول، لكن الموعد المرتبط غير متاح.", patientConflictMessage: (patientName: string) => `هذا الهاتف مرتبط بالفعل بالمريض ${patientName}. هل تريد ربط الطلب بالمريض الحالي أم إنشاء مريض جديد؟`, existingPatient: "المريض الحالي", bookingPatient: "طلب الحجز", linkToExistingPatient: "ربط بالمريض الحالي", createNewPatient: "إنشاء مريض جديد" },
    dashboard: { eyebrow: "مساحة عمل المركز", title: "لوحة التحكم", subtitle: "لوحة التحكم الخاصة بالمركز.", currentUser: "المستخدم الحالي", role: "الدور", centerStatus: "حالة المركز", loading: "جار تحميل لوحة التحكم...", loadError: "تعذر تحميل إحصاءات لوحة التحكم. يرجى المحاولة مرة أخرى.", sessionExpired: "يرجى تسجيل الدخول مرة أخرى.", alerts: "التنبيهات", appointmentsToday: "مواعيد اليوم", appointmentsTodayHelper: "كل مواعيد اليوم بجميع الحالات.", completedToday: "المكتملة اليوم", completedTodayHelper: "المواعيد التي اكتملت اليوم.", noAlerts: "لا توجد تنبيهات مهمة الآن.", noShowToday: "فائتة / لم يحضر", noShowTodayHelper: "مواعيد انتهى وقتها ولم تكتمل أو تم تعليمها كـ لم يحضر.", patientsWithCredit: "مرضى لديهم رصيد", pendingInvoices: "فواتير معلقة", quickActions: "إجراءات سريعة", recentAppointments: "آخر المواعيد", recentInvoices: "آخر الفواتير", revenueSnapshot: "لمحة الإيرادات", todayActivity: "نشاط اليوم", upcomingAppointmentSoon: "موعد قريب", upcomingNextTwoHours: "المواعيد الحالية والقريبة", upcomingNextTwoHoursHelper: "المواعيد غير المكتملة الجارية الآن أو خلال الساعتين القادمتين.", viewDetails: "عرض التفاصيل", subscription: { title: "الاشتراك", plan: "الباقة", status: "الحالة", endDate: "تاريخ الانتهاء", remainingDays: (days: number) => `متبقي ${days} أيام`, oneDayRemaining: "متبقي يوم واحد", expiresToday: "ينتهي اليوم", expiredSince: (days: number) => `منتهي منذ ${days} أيام`, suspended: "الحساب موقوف", noSubscription: "لا يوجد اشتراك فعال" } },
    subscriptionNotice: { activeTitle: "الاشتراك نشط", expiringSoonTitle: "الاشتراك ينتهي قريباً", expiringSoonBody: (days: number) => `ينتهي اشتراكك خلال ${days} ${days === 1 ? "يوم" : "أيام"}. يرجى التواصل مع الدعم للتجديد.`, expiredTitle: "الاشتراك منتهي", expiredBody: "انتهى اشتراكك. قد تكون بعض الميزات محدودة. يرجى التواصل مع الدعم.", suspendedTitle: "الحساب موقوف", suspendedBody: "تم إيقاف حسابك. يرجى التواصل مع الدعم لاستعادة الوصول.", contactSupport: "التواصل مع الدعم" },
    subscriptionBanner: { expiringTitle: (days: number) => `اشتراكك ينتهي خلال ${days} أيام`, expiresTodayTitle: "اشتراكك ينتهي اليوم", expiredTitle: "انتهى اشتراكك، يرجى التواصل مع الإدارة لتجديده.", suspendedTitle: "تم إيقاف حسابك، يرجى التواصل مع الإدارة.", contactAdmin: "تواصل مع الإدارة", renewButton: "تجديد الاشتراك", contactAdminButton: "تواصل مع الإدارة", whatsappExpiringMessage: (centerName: string, days: number) => `مرحباً، أنا من مركز ${centerName}. اشتراكنا في RoyalCare سينتهي خلال ${days} أيام، نرجو المساعدة في التجديد.`, whatsappExpiringTodayMessage: (centerName: string) => `مرحباً، أنا من مركز ${centerName}. اشتراكنا في RoyalCare ينتهي اليوم، نرجو المساعدة في التجديد فوراً.`, gracePeriodTitle: (days: number) => `انتهى اشتراكك. متبقي ${days} ${days === 1 ? "يوم" : "أيام"} من فترة السماح.`, whatsappExpiredMessage: (centerName: string) => `مرحباً، أنا من مركز ${centerName}. اشتراكنا في RoyalCare منتهي حالياً، نرجو المساعدة في التجديد وإعادة التفعيل.`, whatsappGracePeriodMessage: (centerName: string, days: number) => `مرحباً، أنا من مركز ${centerName}. انتهى اشتراكنا في RoyalCare ولدينا ${days} ${days === 1 ? "يوم" : "أيام"} متبقية في فترة السماح. نرجو المساعدة في التجديد في أقرب وقت.`, whatsappSuspendedMessage: (centerName: string) => `مرحباً، أنا من مركز ${centerName}. حسابنا في RoyalCare موقوف حالياً، نرجو المساعدة في إعادة التفعيل.` },
    subscriptionRenewal: { title: "طلب تجديد الاشتراك", subtitle: "سيُرسَل طلبك إلى فريق إدارة RoyalCare.", notePlaceholder: "ملاحظة اختيارية لفريق الدعم...", submitButton: "إرسال الطلب", submittingButton: "جار الإرسال...", cancelButton: "إلغاء", successTitle: "تم إرسال الطلب", successBody: "تم استلام طلب التجديد. سيتواصل معك فريق الإدارة قريباً.", duplicateTitle: "تم إرسال الطلب مسبقاً", duplicateBody: "لقد أرسلت طلب تجديد خلال آخر 24 ساعة. يرجى انتظار رد فريق الإدارة.", errorTitle: "تعذر إرسال الطلب", errorBody: "حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى أو التواصل مع الدعم مباشرةً." },
    cards: { patients: "المرضى", appointments: "المواعيد", services: "الخدمات", staff: "مستخدمو الطاقم" },
    common: { cancel: "إلغاء", close: "إغلاق", save: "حفظ", saving: "جار الحفظ...", search: "بحث", view: "عرض", edit: "تعديل", archive: "أرشفة", activate: "تفعيل", actions: "الإجراءات", notAvailable: "غير متاح" },
    patients: { title: "المرضى", subtitle: "إدارة سجلات المرضى الخاصة بهذا المركز فقط.", addPatient: "إضافة مريض", addFirstPatient: "إضافة أول مريض", editPatient: "تعديل مريض", detailsTitle: "تفاصيل المريض", searchPlaceholder: "ابحث باسم المريض أو رقم الهاتف", totalPatients: "إجمالي المرضى", activePatients: "المرضى النشطون", archivedPatients: "المرضى المؤرشفون", newPatientsThisMonth: "مرضى جدد هذا الشهر", filters: "الفلاتر", allGenders: "كل الأجناس", allStatuses: "كل الحالات", archiveFilter: "الأرشفة", allArchiveStates: "كل السجلات", activeOnly: "النشط فقط", archivedOnly: "المؤرشف فقط", hasUpcomingAppointment: "لديه موعد قادم", hasReceivables: "لديه ذمم", unavailableFilter: "تحتاج بيانات ملخص", filterAll: "الكل", filterYes: "نعم", filterNo: "لا", treatmentPlansCount: "عدد الخطط العلاجية", overdueSessionsCount: "الجلسات المتأخرة", lastSession: "آخر زيارة", appointmentsCount: "عدد المواعيد", nextSession: "الجلسة القادمة", outstandingBalance: "الرصيد المستحق", upcomingAppointmentsCount: "المواعيد القادمة", noData: "لا يوجد", quickActions: "إجراءات سريعة", createAppointment: "إنشاء موعد", createTreatmentPlan: "إنشاء خطة علاج", createInvoice: "إنشاء فاتورة", unavailableAction: "هذا الإجراء غير متاح حاليًا.", moreActions: "إجراءات إضافية", paginationSummary: (shown, total) => `عرض ${shown} من ${total} مريض`, paginationPrepared: "جاهز للتقسيم إلى صفحات عند زيادة السجلات", emptyTitle: "لا توجد سجلات مرضى بعد", emptyBody: "أنشئ أول سجل مريض لهذا المركز.", noResultsTitle: "لا توجد نتائج مطابقة", noResultsBody: "جرّب اسمًا أو رقم هاتف آخر.", loading: "جار تحميل المرضى...", fullName: "الاسم الكامل", fullNameAr: "الاسم بالعربية", fullNameHe: "الاسم بالعبرية", fullNameEn: "الاسم بالإنجليزية", namesOptionalHint: "اختياري: أدخل اسم المريض بلغات أخرى للعرض متعدد اللغات.", phone: "الهاتف", email: "البريد الإلكتروني", gender: "الجنس", dateOfBirth: "تاريخ الميلاد", nationalId: "رقم الهوية", notes: "ملاحظات", status: "الحالة", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء مريض", update: "تحديث المريض", fieldRequired: "هذا الحقل مطلوب.", invalidPhone: "أدخل رقم هاتف صالحًا.", duplicatePhone: "يوجد مريض بهذا الهاتف بالفعل.", loadError: "تعذر تحميل المرضى. يرجى المحاولة مرة أخرى.", saved: "تم حفظ المريض.", archived: "تمت أرشفة المريض.", activated: "تم تفعيل المريض.", notFound: "المريض غير موجود.", deletePatient: "حذف نهائياً", deleteConfirmTitle: "حذف المريض نهائياً", deleteConfirmBody: "هل أنت متأكد؟ سيتم حذف المريض نهائياً ولا يمكن التراجع.", deleteConfirmButton: "حذف نهائياً", deleteBlocked: "لا يمكن الحذف: يوجد مواعيد أو فواتير أو متابعات مرتبطة بهذا المريض.", deleteBlockedTooltip: "لا يمكن حذف هذا المريض لأنه مرتبط بسجلات مثل مواعيد أو فواتير أو متابعات. يمكنك أرشفته بدلاً من ذلك.", deleteBlockedWithCounts: (counts) => { const parts = []; if (counts.appointments > 0) parts.push(`${counts.appointments} موعد`); if (counts.invoices > 0) parts.push(`${counts.invoices} فاتورة`); if (counts.payments > 0) parts.push(`${counts.payments} دفعة`); if (counts.followUps > 0) parts.push(`${counts.followUps} متابعة`); if (counts.creditTransactions > 0) parts.push(`${counts.creditTransactions} معاملة ائتمانية`); return `لا يمكن الحذف: يوجد ${parts.join(" و ")}. يمكنك أرشفته بدلاً من ذلك.`; }, deleted: "تم حذف المريض نهائياً.", patientPortal: { title: "بوابة المريض", generate: "إنشاء رابط بوابة المريض", generating: "جارٍ إنشاء الرابط…", copyLink: "نسخ الرابط", copied: "تم النسخ!", openPortal: "فتح البوابة", shareWhatsApp: "مشاركة عبر واتساب", error: "تعذّر إنشاء رابط البوابة. يرجى المحاولة مرة أخرى." } },
    services: { title: "الخدمات", subtitle: "إدارة خدمات المركز والمدة والأسعار وحالة التفعيل.", addService: "إضافة خدمة", editService: "تعديل خدمة", detailsTitle: "تفاصيل الخدمة", searchPlaceholder: "ابحث باسم الخدمة", filterAll: "الكل", filterActive: "نشطة", filterArchived: "مؤرشفة", emptyTitle: "لا توجد خدمات بعد", emptyBody: "أنشئ أول خدمة لهذا المركز.", noResultsTitle: "لا توجد خدمات مطابقة", noResultsBody: "جرّب اسم خدمة آخر.", loading: "جار تحميل الخدمات...", loadError: "تعذر تحميل الخدمات. يرجى المحاولة مرة أخرى.", nameEn: "الاسم بالإنجليزية", nameAr: "الاسم بالعربية", nameHe: "الاسم بالعبرية", descriptionEn: "الوصف بالإنجليزية", descriptionAr: "الوصف بالعربية", descriptionHe: "الوصف بالعبرية", bufferMinutes: "وقت فاصل بعد الخدمة بالدقائق", durationMinutes: "المدة", price: "السعر", currency: "العملة", status: "الحالة", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء خدمة", update: "تحديث الخدمة", saved: "تم حفظ الخدمة.", archived: "تمت أرشفة الخدمة.", activated: "تم تفعيل الخدمة.", notFound: "الخدمة غير موجودة.", optional: "اختياري", fieldRequired: "هذا الحقل مطلوب.", invalidBuffer: "أدخل وقت فصل صالحًا.", invalidDuration: "أدخل مدة صالحة.", invalidPrice: "أدخل سعرًا صالحًا.", invalidCurrency: "أدخل رمز عملة صالحًا.", durationUnitMinutes: "دقيقة", durationUnitHours: "ساعة", enableFollowUpPlan: "تفعيل خطة المتابعة", followUpSettings: "إعدادات المتابعة", followUpDescription: "إنشاء تذكيرات متابعة تلقائياً عند إكمال موعد العلاج.", followUp: { none: "بدون متابعة", sessionBasedPlan: "خطة علاج بعدد جلسات", sessionBasedHelper: "تنتهي تلقائياً بعد إكمال جميع الجلسات.", recurring: "متابعة دورية مستمرة", recurringHelper: "تستمر بإرسال تذكيرات دورية بدون عدد جلسات محدد." }, defaultIntervalDays: "التذكير بعد كل جلسة (بالأيام)", planType: "نوع الخطة", fixedInterval: "خطة علاج بعدد جلسات", sessionPlan: "خطة علاج بعدد جلسات", createNextReminderAutomatically: "إنشاء التذكير التالي تلقائياً", totalRecommendedSessions: "عدد الجلسات المقترحة", totalSessionsSummary: (count: number) => `إجمالي الجلسات: ${count} جلسات`, totalSessionsCalculated: "يتم احتسابها تلقائيًا من مراحل العلاج", whatsappMessageArabic: "رسالة واتساب بالعربية", whatsappMessageHebrew: "رسالة واتساب بالعبرية", whatsappMessageEnglish: "رسالة واتساب بالإنجليزية", sessionsFrom: "من الجلسة", sessionsTo: "إلى الجلسة", intervalDays: "إعادة المتابعة بعد (يوم)", addRule: "إضافة مرحلة علاج", removeRule: "حذف القاعدة", followUpRuleHelper: "قسّم الخطة إلى مراحل حسب عدد الجلسات وفترة التذكير.", treatmentPhases: "مراحل العلاج", phaseTitle: (index: number) => `مرحلة العلاج ${index}`, reminderAfterDays: (days: number) => `التذكير بعد ${days} يوم`, previewSessionLine: (session: number, days: number) => days === 0 ? `الجلسة ${session} (يوم الموعد)` : `الجلسة ${session} → بعد ${days} يوم`, planPreview: "معاينة الخطة", laserPreset: "بروتوكول ليزر — 8 جلسات", hijamaPreset: "حجامة وقائية", skincarePreset: "تنظيف بشرة شهري", applyPreset: "تطبيق", editPhase: "تعديل", deletePhase: "حذف المرحلة", planCalcExplanation: "الجلسة الأولى هي الموعد ذاته. تُحدد كل جلسة لاحقة بعد فترة المرحلة.", planPreviewPhaseLabel: (from: number, to: number, days: number) => `الجلسات ${from}–${to} · كل ${days} يوم`, overlappingRanges: "لا يمكن تداخل مراحل العلاج.", uncoveredSessions: (range: string) => `الجلسات ${range} لا تحتوي على قاعدة متابعة`, invalidIntervals: "قيمة إعادة المتابعة يجب أن تكون عدداً صحيحاً أكبر من صفر.", invalidRangeOrder: "رقم بداية الجلسة يجب أن يكون أقل من أو يساوي رقم النهاية.", firstPhaseMustStartAtOne: "يجب أن تبدأ أول مرحلة من الجلسة 1.", noGapsAllowed: "يجب أن تكون مراحل العلاج متسلسلة بدون فراغات.", deleteService: "حذف نهائياً", deleteServiceConfirmTitle: "حذف الخدمة نهائياً", deleteServiceConfirmBody: "هل أنت متأكد؟ سيتم حذف الخدمة نهائياً ولا يمكن التراجع.", deleteServiceConfirmButton: "حذف نهائياً", deleteServiceBlocked: "لا يمكن الحذف: هذه الخدمة مرتبطة بمواعيد أو فواتير أو طلبات حجز.", deleteServiceBlockedTooltip: "لا يمكن حذف هذه الخدمة لأنها مرتبطة بمواعيد أو فواتير أو طلبات حجز. يمكنك أرشفتها بدلاً من ذلك.", deleted: "تم حذف الخدمة نهائياً.", followUpBadge: "خطة متابعة", noFollowUpBadge: "بدون متابعة", sessionBasedPlanLabel: "خطة علاج بعدد جلسات", recurringContinuousLabel: "متابعة دورية مستمرة", templateCountBadge: (count: number) => `قوالب علاج: ${count}`, defaultTemplateSummary: (name: string, sessions: number) => `الافتراضي: ${name} · ${sessions} جلسات`, totalSessionsBadge: (count: number) => `إجمالي الجلسات: ${count}`, intervalDaysBadge: (days: number) => `التكرار: كل ${days} يوم`, followUpAutoHint: "تُنشئ هذه الخدمة خطة متابعة تلقائيًا عند اكتمال الموعد" },
    staff: { title: "الطاقم", subtitle: "إدارة مستخدمي الطاقم والأدوار وحالة الوصول.", addStaff: "إضافة موظف", editStaff: "تعديل موظف", detailsTitle: "تفاصيل الموظف", searchPlaceholder: "ابحث بالاسم أو البريد الإلكتروني", filterAllRoles: "كل الأدوار", filterAllStatuses: "كل الحالات", emptyTitle: "لا يوجد مستخدمو طاقم بعد", emptyBody: "أنشئ أول مستخدم طاقم لهذا المركز.", noResultsTitle: "لا يوجد طاقم مطابق", noResultsBody: "جرّب اسمًا أو بريدًا أو دورًا أو حالة أخرى.", loading: "جار تحميل الطاقم...", loadError: "تعذر تحميل الطاقم. يرجى المحاولة مرة أخرى.", fullName: "الاسم الكامل", email: "البريد الإلكتروني", password: "كلمة المرور", passwordOptional: "اختيارية عند التعديل", providerEnabled: "يمكنه تقديم العلاج / يظهر في قائمة المقدّمين", providerEnabledHelper: "عند التفعيل، يظهر هذا الموظف النشط في قائمة مقدّمي المواعيد بغض النظر عن دوره.", role: "الدور", status: "الحالة", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء موظف", update: "تحديث الموظف", saved: "تم حفظ الموظف.", activated: "تم تفعيل الموظف.", deactivated: "تم إلغاء تفعيل الموظف.", notFound: "الموظف غير موجود.", fieldRequired: "هذا الحقل مطلوب.", invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا للموظف.", duplicateEmail: "يوجد مستخدم بهذا البريد بالفعل.", invalidPassword: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", permissionsTitle: "صلاحيات الوصول", centerLabel: "المركز", phone: "الهاتف" },
    billing: { title: "الفوترة", subtitle: "إدارة الفواتير اليدوية وسجلات الدفع لهذا المركز.", addInvoice: "إضافة فاتورة", invoiceTitle: "تفاصيل الفاتورة", searchPlaceholder: "ابحث باسم المريض أو رقم الهاتف", filterAllStatuses: "كل الحالات", filterAll: "الكل", emptyTitle: "لا توجد فواتير نشطة بعد", emptyBody: "أنشئ أول فاتورة لهذا المركز.", emptyPendingTitle: "لا توجد فواتير معلقة", emptyPendingBody: "جميع الفواتير مدفوعة أو ملغاة.", emptyPartialTitle: "لا توجد فواتير مدفوعة جزئيًا", emptyPartialBody: "لا توجد فواتير بدفعات جزئية حاليًا.", emptyPaidTitle: "لا توجد فواتير مدفوعة بعد", emptyPaidBody: "حدد فاتورة كمدفوعة لتظهر هنا.", emptyCancelledTitle: "لا توجد فواتير ملغاة", emptyCancelledBody: "ستظهر الفواتير الملغاة هنا.", loading: "جار تحميل الفواتير...", loadError: "تعذر تحميل الفواتير. يرجى المحاولة مرة أخرى.", patient: "المريض", service: "الخدمة", customService: "خدمة غير موجودة بالقائمة", customServiceName: "اسم الخدمة المخصصة", customServiceDuration: "مدة الخدمة المخصصة", customServicePrice: "سعر الخدمة المخصصة", saveCustomService: "حفظ كخدمة مستقبلية", customServiceBadge: "خدمة مخصصة", provider: "المقدم", providerOptional: "اختياري", noProvider: "بدون مقدم", selectPatient: "اختر مريضًا", selectService: "اختر خدمة", amount: "المبلغ", currency: "العملة", status: "الحالة", notes: "ملاحظات", notesOptional: "اختياري", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء فاتورة", markedPaid: "تم تحديد الفاتورة كمدفوعة.", invoiceFullyPaid: "الفاتورة مدفوعة بالكامل، لا يمكن إضافة دفعة جديدة.", cancelled: "تم إلغاء الفاتورة.", notFound: "الفاتورة غير موجودة.", fieldRequired: "هذا الحقل مطلوب.", invalidAmount: "أدخل مبلغًا صالحًا أكبر من الصفر.", markAsPaid: "تحديد كمدفوع", cancelInvoice: "إلغاء الفاتورة", reopenInvoice: "إعادة فتح الفاتورة", reopened: "تمت إعادة فتح الفاتورة كمعلقة.", addPayment: "إضافة دفعة", paymentHistory: "سجل الدفعات", paymentMethod: "طريقة الدفع", paymentDate: "تاريخ الدفع", paymentNotes: "ملاحظات", paymentNotesOptional: "اختياري", methodCash: "نقدي", methodBankTransfer: "تحويل بنكي", methodCheck: "شيك", methodOther: "أخرى", paymentAdded: "تم تسجيل الدفعة بنجاح.", noPayments: "لا توجد دفعات مسجلة بعد.", invoiceTotal: "إجمالي الفاتورة", paidAmount: "المدفوع", balanceDue: "الرصيد المستحق", paymentBy: "بواسطة", overpaymentError: "فشل تسجيل الدفعة. يرجى المحاولة مرة أخرى.", overpaymentCreditHint: "المبلغ الزائد سيُحفظ كرصيد ائتماني للمريض.", invalidPaymentDate: "أدخل تاريخ دفع صالحًا.", creditBalance: "الرصيد الائتماني", useCredit: "استخدام الرصيد", creditAmount: "مبلغ الرصيد", creditApplied: "تم تطبيق الرصيد بنجاح.", noCreditAvailable: "لا يوجد رصيد ائتماني متاح لهذا المريض.", insufficientCredit: "رصيد ائتماني غير كافٍ.", noCreditDue: "لا يوجد مبلغ مستحق لاستخدام الرصيد.", creditAdded: "تمت إضافة رصيد لحساب المريض.", overpaymentCreditNotice: "تم حفظ الدفع الزائد كرصيد للمريض.", creditSourceOverpayment: "من دفع زائد", creditSourceManual: "تعديل يدوي", creditSourceAdjustment: "تعديل", creditUsageLabel: "رصيد مستخدم", invoiceTotalDesc: "القيمة الكاملة لجميع الخدمات والفواتير ضمن هذا الموعد.", paidAmountDesc: "إجمالي المبلغ الذي تم دفعه فعليًا من قبل المريض.", balanceDueDesc: "المبلغ المتبقي الذي يجب على المريض دفعه.", balanceDueTooltip: "الرصيد المستحق = إجمالي الفاتورة − المدفوع", creditBalanceDesc: "رصيد محفوظ للمريض يمكن استخدامه في فواتير أو جلسات مستقبلية.", statusPaidDesc: "تم تسديد كامل قيمة الفاتورة.", statusPartialDesc: "تم دفع جزء من قيمة الفاتورة ويوجد مبلغ متبقٍ.", statusPendingDesc: "لم يتم استلام أي دفعة حتى الآن." },
    reports: { title: "التقارير المالية", subtitle: "الإيرادات والأرصدة المستحقة والنشاط للفترة المحددة.", loading: "جار تحميل التقرير...", loadError: "حدث خطأ في تحميل البيانات.", todayRevenue: "إيرادات اليوم", revenueThisMonth: "إيرادات هذا الشهر", paidInvoices: "الفواتير المدفوعة", pendingInvoices: "الفواتير المعلقة", overdueInvoices: "الفواتير المتأخرة", averageInvoiceValue: "متوسط قيمة الفاتورة", totalPaid: "إجمالي المحصّل", outstanding: "الرصيد المستحق", patientCredit: "رصيد المرضى", cancelledInvoices: "الفواتير الملغاة", appointmentsToday: "مواعيد اليوم", periodToday: "اليوم", periodLast7Days: "آخر 7 أيام", periodWeek: "هذا الأسبوع", periodMonth: "هذا الشهر", periodCustom: "مخصص", filterFrom: "من", filterTo: "إلى", applyFilter: "تطبيق", revenue: "الإيرادات", appointments: "المواعيد", revenueByDay: "الإيرادات حسب اليوم", revenueByPaymentStatus: "الإيرادات حسب حالة الدفع", revenueByService: "الإيرادات حسب الخدمة", noChartData: "لا توجد بيانات كافية لهذه الفترة", viewSessions: "عرض الجلسات", statusPaid: "مدفوع", statusPending: "غير مدفوع", statusPartial: "مدفوع جزئياً", statusOverdue: "متأخر", topPatientsTitle: "أفضل المرضى", topPatientsEmpty: "لا توجد بيانات لهذه الفترة.", topPatientsTotalPaid: "إجمالي المدفوع", topPatientsVisits: "زيارة", topPatientsCredit: "الرصيد", topPatientsVip: "VIP", receivablesSectionTitle: "الذمم المستحقة", receivablesSectionHelper: "تعرض كل الأرصدة المفتوحة حتى لو كانت خارج الفترة المحددة", receivablesDetailsTitle: "تفاصيل الذمم", totalReceivables: "إجمالي الذمم المستحقة", patientsWithDebt: "عدد المرضى الذين عليهم مبالغ", unpaidInvoices: "عدد الفواتير غير المدفوعة", partiallyPaidInvoices: "عدد الفواتير المدفوعة جزئياً", highestDebt: "أعلى مديونية", invoiceCountIncluded: "فواتير ضمن الفترة المحددة", noFinancialDataInRange: "لا توجد بيانات مالية ضمن الفترة المحددة", selectedDateRange: "الفترة المحددة", openReceivablesOnly: "الذمم المفتوحة فقط", overdueOnly: "المتأخر فقط", receivablesByPaymentStatus: "الذمم حسب حالة الدفع", topPatientsByDebt: "أعلى المرضى مديونية", revenueVsReceivables: "الإيرادات مقابل الذمم", revenueLabel: "الإيرادات", receivablesLabel: "الذمم", patient: "المريض", phone: "رقم الهاتف", service: "الخدمة", invoiceTotal: "إجمالي الفاتورة", paidAmount: "المدفوع", remainingAmount: "المتبقي", paymentStatus: "حالة الدفع", lastPayment: "آخر دفعة", dueDate: "تاريخ الاستحقاق", notRecorded: "غير مسجل", noReceivablesData: "لا توجد ذمم مطابقة لهذه الفلاتر.", todayOverviewTitle: "نظرة عامة على اليوم", appointmentsTodayTotal: "مواعيد اليوم", appointmentsTodayCompleted: "المكتملة اليوم", appointmentsTodayUpcoming: "القادمة اليوم", delayedFollowUps: "متابعات متأخرة", newPatientsThisMonth: "مرضى جدد هذا الشهر", activeTreatmentPlans: "خطط علاجية نشطة", revenueInsightsTitle: "تحليل الإيرادات", appointmentAnalyticsTitle: "تحليل المواعيد", totalInPeriod: "إجمالي المواعيد", noShowCount: "غياب بدون إلغاء", cancellationRate: "معدل الإلغاء", noShowRate: "معدل الغياب", topProvidersTitle: "أفضل مقدمي الخدمة", viewFullReceivables: "عرض كل الذمم", hideFullReceivables: "إخفاء الذمم", topDebtorsTitle: "أعلى الأرصدة المستحقة", completedWithoutInvoiceTitle: "جلسات مكتملة بدون فاتورة", completedWithoutInvoiceAlert: (count: number) => `يوجد ${count} جلسات مكتملة لم يتم إنشاء فاتورة لها`, completedWithoutInvoiceEmpty: "جميع الجلسات المكتملة لديها فواتير.", showAllUnbilled: "كل الجلسات المكتملة بدون فاتورة", showPeriodUnbilled: "عرض الفترة المحددة فقط" },
    profile: { title: "ملفي الشخصي", subtitle: "معلومات حسابك وصلاحيات الوصول.", center: "المركز", memberSince: "عضو منذ", permissionsTitle: "صلاحيات الوصول", noPermissions: "لا توجد صلاحيات.", changePassword: "تغيير كلمة المرور", currentPassword: "كلمة المرور الحالية", newPassword: "كلمة المرور الجديدة", confirmPassword: "تأكيد كلمة المرور الجديدة", updatePassword: "تحديث كلمة المرور", updating: "جار التحديث...", passwordUpdated: "تم تحديث كلمة المرور بنجاح.", passwordMismatch: "كلمات المرور الجديدة غير متطابقة.", passwordTooShort: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", wrongPassword: "كلمة المرور الحالية غير صحيحة.", loadError: "تعذر تحميل الملف الشخصي. يرجى المحاولة مرة أخرى." },
    permissionLabels: { patientsView: "عرض المرضى", patientsCreate: "إضافة مرضى", patientsUpdate: "تعديل المرضى", patientsStatus: "تحديث حالة المرضى", staffView: "عرض الموظفين", staffCreate: "إضافة موظفين", staffUpdate: "تعديل الموظفين", staffActivate: "تفعيل / تعطيل الموظفين", servicesView: "عرض الخدمات", servicesCreate: "إنشاء الخدمات", servicesUpdate: "تعديل الخدمات", servicesArchive: "أرشفة الخدمات", servicesActivate: "تحديث حالة الخدمات", appointmentsView: "عرض المواعيد", appointmentsCreate: "إنشاء المواعيد", appointmentsUpdate: "تعديل المواعيد", appointmentsCancel: "إلغاء المواعيد", appointmentsStatusUpdate: "تحديث حالة المواعيد", billingView: "عرض الفواتير", billingCreate: "إنشاء الفواتير", billingUpdate: "تعديل الفواتير", billingMarkPaid: "إلغاء الفواتير", paymentsView: "عرض المدفوعات", paymentsCreate: "تسجيل المدفوعات", expensesView: "عرض المصاريف", expensesCreate: "إضافة المصاريف", expensesEdit: "تعديل المصاريف", expensesDelete: "حذف المصاريف", expensesReports: "تقارير المصاريف", reportsView: "عرض التقارير", settingsView: "عرض الإعدادات", permissionsView: "عرض صلاحيات الأدوار", permissionsUpdate: "تعديل صلاحيات الأدوار" },
    appointments: { title: "المواعيد", subtitle: "جدولة المواعيد ومتابعتها لهذا المركز.", addAppointment: "إضافة موعد", editAppointment: "تعديل موعد", detailsTitle: "تفاصيل الموعد", searchPlaceholder: "ابحث باسم المريض أو رقم الهاتف", filterAll: "كل الحالات", today: "اليوم", upcoming: "القادمة", dateFilter: "التاريخ", providerFilter: "المقدم", allProviders: "كل المقدمين", allBranches: "كل الفروع", branch: "الفرع", chooseBranch: "اختر الفرع", emptyTitle: "لا توجد مواعيد بعد", emptyBody: "أنشئ أول موعد لهذا المركز.", noResultsTitle: "لا توجد مواعيد مطابقة", noResultsBody: "جرّب مريضًا أو حالة أو تاريخًا أو مقدمًا آخر.", loading: "جار تحميل المواعيد...", loadError: "تعذر تحميل المواعيد. حاول مرة أخرى.", patient: "المريض", service: "الخدمة", customService: "خدمة غير موجودة بالقائمة", customServiceName: "اسم الخدمة المخصصة", customServiceDuration: "مدة الجلسة (دقيقة)", customServiceDurationPlaceholder: "مثال: 15", customServiceDurationHelper: "مدة الجلسة تُحسب بالدقائق", customServicePrice: "سعر الخدمة (₪)", customServicePricePlaceholder: "مثال: 80", customServicePriceHelper: "يتم احتساب السعر بالشيكل (ILS)", saveCustomService: "حفظ كخدمة مستقبلية", customServiceBadge: "خدمة مخصصة", provider: "المقدم", appointmentDate: "تاريخ الموعد", startTime: "وقت البداية", endTime: "وقت النهاية", durationMinutes: "مدة الموعد (دقيقة)", durationMinutesPlaceholder: "مثال: 15", durationMinutesHelper: "مدة الموعد تُحسب بالدقائق.", status: "الحالة", notes: "ملاحظات علاجية", notesHelper: "تظهر ضمن سجل العلاج والمتابعات القادمة.", internalNotes: "ملاحظات داخلية للطاقم", internalNotesHelper: "لا تظهر للمريض أو برسائل المتابعة.", cancellationReason: "سبب الإلغاء", reminderSent: "تم إرسال التذكير", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", createdBy: "أنشئ بواسطة", submit: "إنشاء موعد", update: "تحديث الموعد", saved: "تم حفظ الموعد.", saveError: "تعذر حفظ الموعد. يرجى المحاولة مرة أخرى.", cancelled: "تم إلغاء الموعد.", statusUpdated: "تم تحديث حالة الموعد.", notFound: "الموعد غير موجود.", fieldRequired: "هذا الحقل مطلوب.", invalidDate: "اختر تاريخ موعد صالحًا.", invalidTime: "اختر وقتًا صالحًا.", invalidDuration: "أدخل مدة صالحة.", overlap: "هذا الموعد يتداخل مع حجز آخر.", cancelAppointment: "إلغاء الموعد", confirmCancel: "تأكيد الإلغاء", changeStatus: "تغيير الحالة", conflictTitle: "تم اكتشاف تعارض في الموعد", conflictMessage: "يرجى اختيار وقت مختلف", conflictPatient: "المريض", conflictService: "الخدمة", conflictProvider: "المقدم", conflictDate: "التاريخ", conflictStart: "وقت البداية", conflictEnd: "وقت النهاية", startsInMinutes: "يبدأ بعد {n} دقيقة", inProgressNow: "قيد التنفيذ الآن", endOfDayError: "يجب أن ينتهي الموعد قبل منتصف الليل.", invoiceSection: "الفاتورة", noInvoice: "لا توجد فاتورة بعد", noInvoiceBody: "أنشئ فاتورة لتتبع الدفع لهذا الموعد.", createInvoice: "إنشاء فاتورة", openInvoice: "فتح الفاتورة", invoiceCreated: "تم إنشاء الفاتورة بنجاح.", noServicePrice: "لا يوجد سعر لهذه الخدمة. افتح الفوترة لإنشاء الفاتورة يدويًا.", invoiceUnpaid: "غير مدفوع", viewInvoice: "عرض الفاتورة", invoiceRequiresCompleted: "لا يمكن إنشاء الفاتورة إلا بعد اكتمال الموعد.", invoiceFullyPaid: "الفاتورة مدفوعة بالكامل", needsInvoiceBadge: "بحاجة فاتورة", bookingRequestDetails: "بيانات طلب الحجز", bookingRequester: "طالب الحجز", bookingRequesterPhone: "هاتف طالب الحجز", bookingRequestNotes: "ملاحظات الطلب", requestedBy: (name: string) => `طلب باسم: ${name}`, slotBooked: "محجوز", currentAppointmentSlot: "الموعد الحالي", loadingSlots: "جار تحميل الأوقات المتاحة...", noSlots: "لا توجد أوقات متاحة لهذا التاريخ.", selectServiceAndDate: "اختر خدمة وتاريخًا لعرض الأوقات المتاحة.", enterDurationToSeeSlots: "أدخل مدة الجلسة لعرض الأوقات المتاحة.", calendarView: "التقويم", listView: "القائمة", dayView: "يوم", weekView: "أسبوع", calendarToday: "اليوم", calendarPrev: "السابق", calendarNext: "التالي", reminderSection: "تذكير المريض", lastReminderSent: "آخر تذكير أُرسل", reminderCountLabel: "عدد التذكيرات", sendReminderNow: "إرسال تذكير واتساب", reminderSentSuccess: "تم تحضير التذكير. افتح واتساب للإرسال.", reminderNotSentYet: "لم يُرسل أي تذكير بعد.", reminder24hSentLabel: "تذكير 24 ساعة أُرسل", reminder2hSentLabel: "تذكير ساعتين أُرسل", openWhatsApp: "فتح واتساب", copyMessage: "نسخ الرسالة", reminderSending: "جار التحضير...", reminderHelperText: "سيتم فتح واتساب مع رسالة جاهزة.", followUpCreatedAfterCompletionHelper: "سيتم إنشاء المتابعة تلقائياً بعد تحويل الموعد إلى مكتمل.", followUpPlanLockedHelper: "خطة المتابعة متاحة فقط عند حفظ الخدمة كخدمة مستقبلية.", followUpActiveInService: "خطة المتابعة مفعلة لهذه الخدمة.", editServiceFollowUp: "تعديل إعدادات المتابعة في الخدمة", savedServiceBadge: "هذه الخدمة محفوظة ضمن الخدمات", followUpPlanActive: "خطة متابعة نشطة", followUpUpcoming: "المتابعة القادمة", followUpDue: (date: string) => `متابعة قادمة: ${date}`, followUpMissing: "لم يتم إنشاء متابعة", followUpBooked: "تم الحجز", followUpCompleted: "اكتملت المتابعة", followUpContacted: "تم التواصل", followUpMissed: "فاتت المتابعة", followUpCancelled: "ألغيت المتابعة", reactivateAppointment: "إعادة تفعيل الموعد", reactivateConfirm: "هل تريد إعادة تفعيل هذا الموعد؟ سيتم إرجاعه إلى حالة مؤكد.", reactivated: "تم إعادة تفعيل الموعد بنجاح.", invoiceBlockedCancelled: "لا يمكن إنشاء فاتورة للمواعيد الملغاة.", followUpPlanExists: "يوجد خطة متابعات", followUpPlanNone: "لا يوجد خطة متابعات", followUpPlanSection: "خطة المتابعة", viewInFollowUps: "عرض في المتابعات", followUpPlanLoading: "جار تحميل الخطة...", followUpSession: (n: number) => `الجلسة ${n}`, followUpPlanNoRecord: "لا توجد خطة متابعة لهذا الموعد", followUpRecurringBadge: "♾ متابعة دورية", followUpNextDue: "المتابعة القادمة", followUpLastCompleted: "آخر مكتملة", followUpPhaseHeader: (phase: number, days: number) => `مرحلة ${phase} — كل ${days} يوم`, followUpPhaseTitle: (phase: number) => `مرحلة العلاج ${phase}`, followUpPhaseSubtitle: (from: number, to: number, days: number) => `الجلسات ${from} → ${to} • كل ${days} يوم`, followUpNextSessionBadge: "الجلسة القادمة", followUpRelativeToday: "اليوم", followUpRelativeOverdue: (days: number) => `متأخرة ${days} ${days === 1 ? 'يوم' : 'أيام'}`, followUpRelativeRemaining: (days: number) => `متبقي ${days} ${days === 1 ? 'يوم' : 'أيام'}`, reminderMessagesSection: "رسائل التذكير", followUpEvery: "كل", followUpIntervalDay: (n: number) => n === 1 ? "يوم" : "أيام", followUpIntervalWeek: (n: number) => n === 1 ? "أسبوع" : "أسابيع", followUpIntervalMonth: (n: number) => n === 1 ? "شهر" : "أشهر", followUpIntervalYear: (n: number) => n === 1 ? "سنة" : "سنوات" },
    rolePermissions: { title: "صلاحيات الأدوار", subtitle: "حدد الإجراءات المسموح بها لكل دور في هذا المركز.", selectRole: "اختر دورًا لإدارة صلاحياته.", ownerProtected: "دور مالك المركز يملك صلاحية كاملة ولا يمكن تعديله.", savePermissions: "حفظ الصلاحيات", saving: "جار الحفظ...", saved: "تم حفظ الصلاحيات.", loadError: "تعذر تحميل الصلاحيات. يرجى المحاولة مرة أخرى.", paymentsSection: "المدفوعات" },
    notifications: { title: "الإشعارات", subtitle: "تنبيهات الاشتراك وإشعارات النظام لهذا المركز.", navLabel: "الإشعارات", loading: "جار تحميل الإشعارات...", loadError: "تعذر تحميل الإشعارات. يرجى المحاولة مرة أخرى.", markAsRead: "تحديد كمقروء", markingRead: "جار التحديد...", markedRead: "تم التحديد كمقروء", viewAll: "عرض كل الإشعارات", filterAll: "الكل", filterUnread: "غير المقروءة", emptyTitle: "لا توجد إشعارات", emptyBody: "ستظهر هنا تنبيهات الاشتراك وإشعارات النظام.", emptyUnreadTitle: "لا توجد إشعارات غير مقروءة", emptyUnreadBody: "تمت قراءة جميع الإشعارات.", unreadCount: (n: number) => `${n} غير مقروءة`, typeExpiring: "الاشتراك ينتهي قريباً", typeExpired: "الاشتراك منتهي", typeBookingRequest: "طلب حجز", newBookingToast: "طلب حجز جديد وصل الآن.", openBookingRequests: "فتح طلبات الحجز", statusPending: "معلق", statusSent: "تم الإرسال", statusFailed: "فشل", widgetTitle: "الإشعارات", widgetNoUnread: "لا توجد إشعارات جديدة.", corruptedFallback: "إشعار جديد" },
    gallery: { title: "معرض الصور", subtitle: "إدارة الصور المعروضة في الملف العام لمركزك.", uploadButton: "رفع صورة", uploadingText: "جار الرفع...", deleteButton: "حذف", emptyTitle: "لا توجد صور بعد", emptyBody: "ارفع صوراً لعرض مركزك في الصفحة العامة.", loadError: "تعذر تحميل المعرض. يرجى المحاولة مرة أخرى.", uploadError: "فشل الرفع. يرجى التحقق من الملف والمحاولة مرة أخرى.", maxImages: "الحد الأقصى 20 صورة.", recommendedSize: "موصى به: JPG أو PNG، بحد أدنى 800 × 600 بكسل.", moveUp: "تحريك للأعلى", moveDown: "تحريك للأسفل" },
    marketing: { cancel: "إلغاء التغييرات", clearToken: "مسح الرمز المحفوظ", fields: { customBodyScript: "سكريبت مخصص داخل Body", customHeadScript: "سكريبت مخصص داخل Head", ga4Id: "معرّف GA4", gtmId: "معرّف GTM", metaConversionApiToken: "رمز Meta Conversion API", metaPixelId: "معرّف Meta Pixel", snapPixelId: "معرّف Snap Pixel", tiktokPixelId: "معرّف TikTok Pixel" }, helper: "يتم حفظ هذه القيم لهذا المركز فقط. يعمل التتبع فقط على صفحات المركز العامة.", logProviders: { GA4: "GA4", META_CAPI: "Meta CAPI", META_PIXEL: "Meta Pixel", SNAP: "Snap Pixel", TIKTOK: "TikTok Pixel" }, logsEmpty: "لا توجد سجلات تتبع بعد.", logsError: "تعذر تحديث سجلات التتبع.", logsRefresh: "تحديث", logsRefreshing: "جار التحديث...", logsSection: "آخر سجلات التتبع", logsSubtitle: "سجل آمن لتصحيح أحداث التسويق من الخادم.", logStatuses: { FAILED: "فشل", SKIPPED: "تم التخطي", SUCCESS: "نجح" }, loading: "جار تحميل إعدادات التسويق...", loadError: "تعذر تحميل إعدادات التسويق. يرجى المحاولة مرة أخرى.", noChanges: "لا توجد تغييرات غير محفوظة.", optional: "اختياري", pixelSection: "معرّفات التتبع", pixelSubtitle: "احفظ معرّفات البكسل والتحليلات المستخدمة في صفحات الحجز العامة.", save: "حفظ إعدادات التسويق", saved: "تم حفظ إعدادات التسويق.", saveError: "تعذر حفظ إعدادات التسويق. يرجى المحاولة مرة أخرى.", saving: "جار الحفظ...", scriptPlaceholder: "الصق السكريبت هنا. سيتم تشغيله فقط على صفحات المركز العامة.", scriptSection: "السكريبتات المخصصة", scriptSubtitle: "إدارة سكريبتات Head و Body لصفحات المركز العامة فقط.", scriptWarning: "الصق فقط سكريبتات من مزودين تثق بهم. السكريبتات المخصصة تعمل على صفحات المركز العامة ولا تعمل داخل لوحة الإدارة.", subtitle: "إدارة بكسلات التسويق ورمز Meta CAPI الخادم وسكريبتات الصفحات العامة.", title: "إعدادات التسويق", testClientError: "تعذر إرسال حدث الاختبار. تحقق من تحميل سكريبت المزود في الصفحة العامة.", testGa4: "اختبار GA4", testGa4Success: "تم تشغيل حدث اختبار GA4.", testMetaCapi: "اختبار Meta CAPI", testMetaCapiError: "فشل اختبار Meta CAPI. تحقق من معرّف البكسل والرمز المحفوظ.", testMetaCapiSuccess: "تم إرسال حدث اختبار Meta CAPI.", testMetaPixel: "اختبار Meta Pixel", testMetaPixelSuccess: "تم تشغيل حدث اختبار Meta Pixel.", testSection: "اختبار التتبع", testSnapPixel: "اختبار Snap Pixel", testSnapSuccess: "تم تشغيل حدث اختبار Snap Pixel.", testSubtitle: "أرسل حدث TestMarketingEvent آمن للتحقق من إعدادات التتبع.", testTikTokPixel: "اختبار TikTok Pixel", testTikTokSuccess: "تم تشغيل حدث اختبار TikTok Pixel.", tokenHelper: "يُحفظ بشكل آمن لأحداث Meta Conversion API من الخادم فقط ولا يظهر في الصفحات العامة.", tokenPlaceholder: "الرمز محفوظ ومخفي. أدخل رمزاً جديداً لاستبداله.", tokenSaved: "يوجد رمز Meta Conversion API محفوظ ومخفي.", unsaved: "لديك تغييرات غير محفوظة." },
    serviceStatuses: { ACTIVE: "نشطة", ARCHIVED: "مؤرشفة" },
    staffStatuses: { ACTIVE: "نشط", INACTIVE: "غير نشط" },
    billingStatuses: { PENDING: "معلق", PARTIAL: "مدفوع جزئيًا", PAID: "مدفوع", CANCELLED: "ملغى" },
    appointmentStatuses: { SCHEDULED: "مجدول", CONFIRMED: "مؤكد", IN_PROGRESS: "قيد التنفيذ", COMPLETED: "مكتمل", CANCELLED: "ملغى", NO_SHOW: "لم يحضر" },
    placeholders: { appointments: { title: "المواعيد", description: "إدارة المواعيد أصبحت متاحة الآن." }, staff: { title: "الطاقم", description: "سيتم توسيع أدوات الطاقم في وحدة لاحقة." }, billing: { title: "الفوترة", description: "ستظهر معلومات الفوترة اليدوية هنا. لا توجد مدفوعات إلكترونية." }, reports: { title: "التقارير", description: "ستتم إضافة التقارير التشغيلية لاحقًا." }, settings: { title: "الإعدادات", description: "ستتم إضافة إعدادات المركز في وحدة لاحقة." } },
    comingSoon: "قريبًا",
    patientStatuses: { ACTIVE: "نشط", INACTIVE: "غير نشط", ARCHIVED: "مؤرشف" },
    patientGenders: { MALE: "ذكر", FEMALE: "أنثى", OTHER: "آخر", UNKNOWN: "غير محدد" },
    roles: { CENTER_OWNER: "مالك المركز", CENTER_MANAGER: "مدير المركز", DOCTOR: "طبيب", RECEPTIONIST: "موظف استقبال", ACCOUNTANT: "محاسب", STAFF: "موظف" },
    statuses: { TRIAL: "تجريبي", ACTIVE: "نشط", PAST_DUE: "متأخر الدفع", SUSPENDED: "موقوف", CANCELLED: "ملغى", ARCHIVED: "مؤرشف" },
  },
  he: {
    brand: { name: "RoyalCare", console: "לוח בקרת המרכז" },
    languages: { en: "אנגלית", ar: "ערבית", he: "עברית" },
    login: { blockedCenter: "מרכז זה אינו פעיל. יש לפנות לתמיכת RoyalCare.", centerNotFound: "דף הכניסה של מרכז זה אינו זמין.", title: "כניסה למרכז", subtitle: "התחברו באמצעות חשבון צוות המרכז.", email: "אימייל", password: "סיסמה", submit: "כניסה", submitting: "מתחבר...", error: "האימייל או הסיסמה שגויים, או שהחשבון אינו יכול להתחבר." },
    shell: { accessDeniedBody: "לתפקיד שלך אין הרשאה לפתוח עמוד זה.", accessDeniedTitle: "הגישה נדחתה", menu: "תפריט", close: "סגירה", language: "שפה", logout: "התנתקות", loggingOut: "מתנתק...", navGroups: { dailyOps: "פעולות יומיות", admin: "ניהול", marketing: "שיווק ואתר", content: "תוכן" } },
    nav: { dashboard: "לוח בקרה", patients: "מטופלים", appointments: "תורים", bookingRequests: "בקשות תור", followUps: "מעקבים", services: "שירותים", staff: "צוות", billing: "חיוב", expenses: "הוצאות", reports: "דוחות", notifications: "התראות", schedule: "לוח זמנים", settings: "הגדרות", permissions: "הרשאות תפקידים", gallery: "גלריה", reviews: "ביקורות", beforeAfter: "לפני / אחרי", team: "צוות המרכז", offers: "מבצעים", seo: "SEO", domain: "דומיינים", website: "אתר", marketing: "שיווק", websiteAnalytics: "אנליטיקת האתר" },
    schedule: { addClosedDay: "הוסף יום סגור", addLeave: "הוסף חופשה", centerHours: "שעות פעילות המרכז", closed: "סגור", closedDays: "ימי סגירה / חגים", date: "תאריך", delete: "מחיקה", endTime: "סיום", helper: "הגדרות אלה קובעות את זמינות ההזמנות הציבוריות.", invalidRange: "שעת הסיום חייבת להיות אחרי שעת ההתחלה.", leave: "חופשה", loadError: "לא ניתן לטעון הגדרות לוח זמנים. נסו שוב.", noClosedDays: "אין עדיין ימי סגירה.", noLeave: "אין עדיין ימי חופשה למטפלים.", noProviders: "אין מטפלים זמינים.", open: "פתוח", providerHours: "שעות פעילות מטפל", providerLeave: "חופשות מטפלים", providerSelect: "מטפל", reason: "סיבה", save: "שמירה", saved: "לוח הזמנים נשמר.", startTime: "התחלה", subtitle: "הגדירו שעות פעילות, חגים וזמינות מטפלים.", title: "לוח זמנים" },
    bookingRequests: { title: "בקשות תור", subtitle: "סקור ונהל בקשות לתורים שנשלחו ע\"י מבקרים.", loading: "טוען בקשות תור...", loadError: "לא ניתן לטעון בקשות תור. נסה שוב.", empty: "עוד אין בקשות תור", emptyBody: "כשמבקרים יבקשו תורים, הם יופיעו כאן.", filterAll: "הכל", filterPending: "ממתינות", filterAccepted: "מאושרות", filterRejected: "נדחות", fullName: "שם", phone: "טלפון", service: "שירות", requestedDate: "תאריך", requestedTime: "שעה", notes: "הערות", status: "סטטוס", statusPending: "ממתין", statusAccepted: "מאושר", statusRejected: "נדחה", createdAt: "התקבל", accept: "אישור", reject: "דחייה", accepting: "מאשר...", rejecting: "דוחה...", contactWhatsApp: "וואטסאפ", acceptSuccess: "הבקשה אושרה והתור נוצר.", rejectSuccess: "הבקשה נדחתה.", errorAlreadyProcessed: "בקשה זו כבר טופלה.", errorGeneric: "אירעה שגיאה. נסה שוב.", pendingCount: (n: number) => `${n} ממתינות`, openAppointment: "פתח תור", linkedAppointmentUnavailable: "אושר, אך התור המקושר אינו זמין.", patientConflictMessage: (patientName: string) => `הטלפון הזה כבר מקושר למטופל ${patientName}. לקשר למטופל הקיים או ליצור מטופל חדש?`, existingPatient: "מטופל קיים", bookingPatient: "בקשת תור", linkToExistingPatient: "קישור למטופל קיים", createNewPatient: "יצירת מטופל חדש" },
    dashboard: { eyebrow: "סביבת העבודה של המרכז", title: "לוח בקרה", subtitle: "לוח הבקרה הפרטי של המרכז.", currentUser: "משתמש נוכחי", role: "תפקיד", centerStatus: "סטטוס המרכז", loading: "טוען את לוח הבקרה...", loadError: "לא ניתן לטעון את נתוני לוח הבקרה. נסו שוב.", sessionExpired: "יש להתחבר מחדש.", alerts: "התראות", appointmentsToday: "תורים היום", appointmentsTodayHelper: "כל תורי היום בכל הסטטוסים.", completedToday: "הושלמו היום", completedTodayHelper: "תורים שהושלמו היום.", noAlerts: "אין כרגע התראות חשובות.", noShowToday: "הוחמצו / לא הגיעו", noShowTodayHelper: "תורים שעברו ולא הושלמו או סומנו כלא הגיעו.", patientsWithCredit: "מטופלים עם זיכוי", pendingInvoices: "חשבוניות ממתינות", quickActions: "פעולות מהירות", recentAppointments: "תורים אחרונים", recentInvoices: "חשבוניות אחרונות", revenueSnapshot: "תמונת הכנסות", todayActivity: "פעילות היום", upcomingAppointmentSoon: "תור קרוב", upcomingNextTwoHours: "תורים פעילים וקרובים", upcomingNextTwoHoursHelper: "תורים פעילים עכשיו או מתחילים בשעתיים הקרובות.", viewDetails: "הצג פרטים", subscription: { title: "מינוי", plan: "תוכנית", status: "סטטוס", endDate: "תאריך סיום", remainingDays: (days: number) => `נותרו ${days} ימים`, oneDayRemaining: "נותר יום אחד", expiresToday: "מסתיים היום", expiredSince: (days: number) => `פג לפני ${days} ימים`, suspended: "החשבון מושהה", noSubscription: "אין מינוי פעיל" } },
    subscriptionNotice: { activeTitle: "המינוי פעיל", expiringSoonTitle: "המינוי מסתיים בקרוב", expiringSoonBody: (days: number) => `המינוי שלך מסתיים בעוד ${days} ${days === 1 ? "יום" : "ימים"}. יש לפנות לתמיכה לחידוש.`, expiredTitle: "המינוי פג תוקף", expiredBody: "המינוי שלך פג תוקף. חלק מהתכונות עשויות להיות מוגבלות. יש לפנות לתמיכה.", suspendedTitle: "החשבון מושהה", suspendedBody: "החשבון שלך הושהה. יש לפנות לתמיכה לשחזור הגישה.", contactSupport: "פנייה לתמיכה" },
    subscriptionBanner: { expiringTitle: (days: number) => `המינוי שלך מסתיים בעוד ${days} ימים`, expiresTodayTitle: "המינוי שלך מסתיים היום", expiredTitle: "המינוי שלך פג תוקף, יש לפנות למינהל", gracePeriodTitle: (days: number) => `המינוי פג תוקף. נותרו ${days} ${days === 1 ? "יום" : "ימים"} בתקופת החסד.`, suspendedTitle: "החשבון שלך הושהה, יש לפנות למינהל", contactAdmin: "פנייה למינהל", renewButton: "חידוש מינוי", contactAdminButton: "פנייה למינהל", whatsappExpiringMessage: (centerName: string, days: number) => `שלום, אנחנו ממרכז ${centerName}. המינוי שלנו ב-RoyalCare יסתיים בעוד ${days} ימים. אנא עזרו לנו לחדש אותו.`, whatsappExpiringTodayMessage: (centerName: string) => `שלום, אנחנו ממרכז ${centerName}. המינוי שלנו ב-RoyalCare מסתיים היום. אנא עזרו לנו לחדש אותו מיידית.`, whatsappExpiredMessage: (centerName: string) => `שלום, אנחנו ממרכז ${centerName}. המינוי שלנו ב-RoyalCare פג תוקף. אנא עזרו לנו לחדש ולהפעיל מחדש.`, whatsappGracePeriodMessage: (centerName: string, days: number) => `שלום, אנחנו ממרכז ${centerName}. המינוי שלנו ב-RoyalCare פג תוקף ונותרו לנו ${days} ${days === 1 ? "יום" : "ימים"} בתקופת החסד. אנא עזרו לנו לחדש בהקדם.`, whatsappSuspendedMessage: (centerName: string) => `שלום, אנחנו ממרכז ${centerName}. החשבון שלנו ב-RoyalCare מושהה כרגע. אנא עזרו לנו להפעיל אותו מחדש.` },
    subscriptionRenewal: { title: "בקשת חידוש מינוי", subtitle: "הבקשה תישלח לצוות הניהול של RoyalCare.", notePlaceholder: "הערה אופציונלית לצוות התמיכה...", submitButton: "שלח בקשה", submittingButton: "שולח...", cancelButton: "ביטול", successTitle: "הבקשה נשלחה", successBody: "בקשת החידוש התקבלה. צוות הניהול ייצור איתך קשר בקרוב.", duplicateTitle: "הבקשה כבר הוגשה", duplicateBody: "כבר שלחת בקשת חידוש ב-24 השעות האחרונות. אנא המתן לתגובת צוות הניהול.", errorTitle: "לא ניתן לשלוח את הבקשה", errorBody: "אירעה שגיאה בעת שליחת הבקשה. נסה שוב או פנה לתמיכה ישירות." },
    cards: { patients: "מטופלים", appointments: "תורים", services: "שירותים", staff: "משתמשי צוות" },
    common: { cancel: "ביטול", close: "סגירה", save: "שמירה", saving: "שומר...", search: "חיפוש", view: "צפייה", edit: "עריכה", archive: "ארכוב", activate: "הפעלה", actions: "פעולות", notAvailable: "לא זמין" },
    patients: { title: "מטופלים", subtitle: "ניהול רשומות מטופלים של המרכז הזה בלבד.", addPatient: "הוספת מטופל", addFirstPatient: "הוספת מטופל ראשון", editPatient: "עריכת מטופל", detailsTitle: "פרטי מטופל", searchPlaceholder: "חיפוש לפי שם מטופל או טלפון", totalPatients: "סך מטופלים", activePatients: "מטופלים פעילים", archivedPatients: "מטופלים בארכיון", newPatientsThisMonth: "מטופלים חדשים החודש", filters: "מסננים", allGenders: "כל המינים", allStatuses: "כל הסטטוסים", archiveFilter: "מצב ארכיון", allArchiveStates: "כל הרשומות", activeOnly: "פעילים בלבד", archivedOnly: "בארכיון בלבד", hasUpcomingAppointment: "יש תור קרוב", hasReceivables: "יש יתרה לגבייה", unavailableFilter: "נדרש נתון סיכום", filterAll: "הכול", filterYes: "כן", filterNo: "לא", treatmentPlansCount: "תוכניות טיפול", overdueSessionsCount: "טיפולים באיחור", lastSession: "ביקור אחרון", appointmentsCount: "מספר תורים", nextSession: "הטיפול הבא", outstandingBalance: "יתרה לגבייה", upcomingAppointmentsCount: "תורים קרובים", noData: "אין", quickActions: "פעולות מהירות", createAppointment: "יצירת תור", createTreatmentPlan: "יצירת תוכנית טיפול", createInvoice: "יצירת חשבונית", unavailableAction: "פעולה זו אינה זמינה כרגע.", moreActions: "פעולות נוספות", paginationSummary: (shown, total) => `מציג ${shown} מתוך ${total} מטופלים`, paginationPrepared: "מוכן לחלוקה לעמודים ברשימות גדולות", emptyTitle: "עדיין אין מטופלים", emptyBody: "צרו את רשומת המטופל הראשונה של המרכז.", noResultsTitle: "לא נמצאו מטופלים תואמים", noResultsBody: "נסו שם או מספר טלפון אחר.", loading: "טוען מטופלים...", fullName: "שם מלא", fullNameAr: "שם בערבית", fullNameHe: "שם בעברית", fullNameEn: "שם באנגלית", namesOptionalHint: "אופציונלי: הזינו את שם המטופל בשפות נוספות לתצוגה רב-לשונית.", phone: "טלפון", email: "אימייל", gender: "מין", dateOfBirth: "תאריך לידה", nationalId: "מספר זהות", notes: "הערות", status: "סטטוס", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת מטופל", update: "עדכון מטופל", fieldRequired: "שדה זה חובה.", invalidPhone: "הזינו מספר טלפון תקין.", duplicatePhone: "כבר קיים מטופל עם מספר הטלפון הזה.", loadError: "לא ניתן לטעון מטופלים. נסו שוב.", saved: "המטופל נשמר.", archived: "המטופל הועבר לארכיון.", activated: "המטופל הופעל.", notFound: "המטופל לא נמצא.", deletePatient: "מחיקה לצמיתות", deleteConfirmTitle: "מחיקת מטופל לצמיתות", deleteConfirmBody: "האם אתה בטוח? המטופל יימחק לצמיתות ואין דרך לבטל פעולה זו.", deleteConfirmButton: "מחק לצמיתות", deleteBlocked: "לא ניתן למחוק: למטופל יש פגישות, חשבוניות או מעקבים מקושרים.", deleteBlockedTooltip: "לא ניתן למחוק מטופל זה כי הוא מקושר לרשומות כמו תורים, חשבוניות או מעקבים. ניתן להעביר אותו לארכיון במקום.", deleteBlockedWithCounts: (counts) => { const parts = []; if (counts.appointments > 0) parts.push(`${counts.appointments} תורים`); if (counts.invoices > 0) parts.push(`${counts.invoices} חשבוניות`); if (counts.payments > 0) parts.push(`${counts.payments} תשלומים`); if (counts.followUps > 0) parts.push(`${counts.followUps} מעקבים`); if (counts.creditTransactions > 0) parts.push(`${counts.creditTransactions} עסקאות זיכוי`); return `לא ניתן למחוק: מקושר ל-${parts.join(", ")}. ניתן להעביר לארכיון במקום.`; }, deleted: "המטופל נמחק לצמיתות.", patientPortal: { title: "פורטל מטופל", generate: "צור קישור לפורטל מטופל", generating: "יוצר קישור…", copyLink: "העתק קישור", copied: "הועתק!", openPortal: "פתח פורטל", shareWhatsApp: "שתף בוואטסאפ", error: "לא ניתן ליצור קישור לפורטל. נסה שוב." } },
    services: { title: "שירותים", subtitle: "ניהול שירותי המרכז, משך השירות, מחירים וסטטוס פעילות.", addService: "הוספת שירות", editService: "עריכת שירות", detailsTitle: "פרטי שירות", searchPlaceholder: "חיפוש לפי שם שירות", filterAll: "הכול", filterActive: "פעילים", filterArchived: "בארכיון", emptyTitle: "עדיין אין שירותים", emptyBody: "צרו את השירות הראשון של המרכז.", noResultsTitle: "לא נמצאו שירותים תואמים", noResultsBody: "נסו שם שירות אחר.", loading: "טוען שירותים...", loadError: "לא ניתן לטעון שירותים. נסו שוב.", nameEn: "שם באנגלית", nameAr: "שם בערבית", nameHe: "שם בעברית", descriptionEn: "תיאור באנגלית", descriptionAr: "תיאור בערבית", descriptionHe: "תיאור בעברית", bufferMinutes: "זמן מרווח אחרי השירות (דקות)", durationMinutes: "משך", price: "מחיר", currency: "מטבע", status: "סטטוס", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת שירות", update: "עדכון שירות", saved: "השירות נשמר.", archived: "השירות הועבר לארכיון.", activated: "השירות הופעל.", notFound: "השירות לא נמצא.", optional: "אופציונלי", fieldRequired: "שדה זה חובה.", invalidBuffer: "הזינו זמן מרווח תקין.", invalidDuration: "הזינו משך תקין.", invalidPrice: "הזינו מחיר תקין.", invalidCurrency: "הזינו קוד מטבע תקין.", durationUnitMinutes: "דקות", durationUnitHours: "שעות", enableFollowUpPlan: "הפעלת תוכנית מעקב", followUpSettings: "הגדרות מעקב", followUpDescription: "יצירת תזכורות מעקב אוטומטיות לאחר השלמת טיפול.", followUp: { none: "ללא מעקב", sessionBasedPlan: "תוכנית טיפול לפי מספר מפגשים", sessionBasedHelper: "מסתיימת אוטומטית לאחר השלמת כל המפגשים.", recurring: "מעקב מחזורי מתמשך", recurringHelper: "ממשיך לשלוח תזכורות תקופתיות ללא מספר מפגשים מוגדר." }, defaultIntervalDays: "מרווח תזכורת (ימים)", planType: "סוג התוכנית", fixedInterval: "תוכנית טיפול לפי מספר מפגשים", sessionPlan: "תוכנית טיפול לפי מספר מפגשים", createNextReminderAutomatically: "יצירת התזכורת הבאה אוטומטית", totalRecommendedSessions: "מספר טיפולים מומלץ", totalSessionsSummary: (count: number) => `סה״כ מפגשים: ${count}`, totalSessionsCalculated: "מחושב אוטומטית משלבי הטיפול", whatsappMessageArabic: "הודעת וואטסאפ בערבית", whatsappMessageHebrew: "הודעת וואטסאפ בעברית", whatsappMessageEnglish: "הודעת וואטסאפ באנגלית", sessionsFrom: "מטיפול מספר", sessionsTo: "עד טיפול מספר", intervalDays: "מרווח בימים", addRule: "הוספת כלל", removeRule: "מחיקת כלל", followUpRuleHelper: "חלקו את התוכנית לשלבים לפי מספר טיפולים ומרווח התזכורת.", treatmentPhases: "שלבי הטיפול", phaseTitle: (index: number) => `שלב טיפול ${index}`, reminderAfterDays: (days: number) => `תזכורת לאחר ${days} ימים`, previewSessionLine: (session: number, days: number) => days === 0 ? `טיפול ${session} (יום הפגישה)` : `טיפול ${session} → לאחר ${days} ימים`, planPreview: "תצוגה מקדימה של התוכנית", laserPreset: "לייזר 8 טיפולים", hijamaPreset: "חיג'אמה מונעת", skincarePreset: "ניקוי עור חודשי", applyPreset: "החלת תבנית", editPhase: "עריכה", deletePhase: "מחיקת שלב", planCalcExplanation: "הטיפול הראשון הוא הפגישה עצמה. כל טיפול עוקב נקבע לאחר מרווח השלב.", planPreviewPhaseLabel: (from: number, to: number, days: number) => `טיפולים ${from}–${to} · כל ${days} ימים`, overlappingRanges: "לא ניתן לחפיפה בין שלבי הטיפול.", uncoveredSessions: (range: string) => `לטיפולים ${range} אין כלל מעקב`, invalidIntervals: "ערך המרווח חייב להיות מספר שלם חיובי.", invalidRangeOrder: "מספר הטיפול הראשון חייב להיות קטן או שווה לאחרון.", firstPhaseMustStartAtOne: "השלב הראשון חייב להתחיל מטיפול 1.", noGapsAllowed: "שלבי הטיפול חייבים להיות רצופים ללא פערים.", deleteService: "מחיקה לצמיתות", deleteServiceConfirmTitle: "מחיקת השירות לצמיתות", deleteServiceConfirmBody: "האם אתה בטוח? השירות יימחק לצמיתות ולא ניתן יהיה לשחזרו.", deleteServiceConfirmButton: "מחק לצמיתות", deleteServiceBlocked: "לא ניתן למחוק: שירות זה מקושר לתורים, חשבוניות או בקשות הזמנה.", deleteServiceBlockedTooltip: "לא ניתן למחוק שירות זה כיוון שהוא מקושר לתורים, חשבוניות או בקשות הזמנה. ניתן לארכב אותו במקום.", deleted: "השירות נמחק לצמיתות.", followUpBadge: "תוכנית מעקב", noFollowUpBadge: "ללא מעקב", sessionBasedPlanLabel: "תוכנית טיפול לפי מספר מפגשים", recurringContinuousLabel: "מעקב מחזורי מתמשך", templateCountBadge: (count: number) => `${count} תבניות`, defaultTemplateSummary: (name: string, sessions: number) => `ברירת מחדל: ${name} · ${sessions} טיפולים`, totalSessionsBadge: (count: number) => `${count} טיפולים בסה"כ`, intervalDaysBadge: (days: number) => `כל ${days} ימים`, followUpAutoHint: "שירות זה יוצר תוכנית מעקב אוטומטית עם השלמת הפגישה" },
    staff: { title: "צוות", subtitle: "ניהול משתמשי צוות, תפקידים וסטטוס גישה.", addStaff: "הוספת איש צוות", editStaff: "עריכת איש צוות", detailsTitle: "פרטי איש צוות", searchPlaceholder: "חיפוש לפי שם או אימייל", filterAllRoles: "כל התפקידים", filterAllStatuses: "כל הסטטוסים", emptyTitle: "עדיין אין משתמשי צוות", emptyBody: "צרו את משתמש הצוות הראשון של המרכז.", noResultsTitle: "לא נמצא צוות תואם", noResultsBody: "נסו שם, אימייל, תפקיד או סטטוס אחר.", loading: "טוען צוות...", loadError: "לא ניתן לטעון צוות. נסו שוב.", fullName: "שם מלא", email: "אימייל", password: "סיסמה", passwordOptional: "אופציונלי בעריכה", providerEnabled: "מוצג כמטפל בתורים", providerEnabledHelper: "כאשר מופעל, איש צוות פעיל יופיע ברשימת המטפלים בתורים ללא תלות בתפקיד.", role: "תפקיד", status: "סטטוס", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת איש צוות", update: "עדכון איש צוות", saved: "איש הצוות נשמר.", activated: "איש הצוות הופעל.", deactivated: "איש הצוות הושבת.", notFound: "איש הצוות לא נמצא.", fieldRequired: "שדה זה חובה.", invalidEmail: "הזינו אימייל צוות תקין.", duplicateEmail: "כבר קיים משתמש עם האימייל הזה.", invalidPassword: "הסיסמה חייבת לכלול לפחות 8 תווים.", permissionsTitle: "הרשאות גישה", centerLabel: "מרכז", phone: "טלפון" },
    billing: { title: "חיוב", subtitle: "ניהול חשבוניות ידניות ורשומות תשלום של המרכז.", addInvoice: "הוספת חשבונית", invoiceTitle: "פרטי חשבונית", searchPlaceholder: "חיפוש לפי שם מטופל או טלפון", filterAllStatuses: "כל הסטטוסים", filterAll: "הכל", emptyTitle: "אין עדיין חשבוניות פעילות", emptyBody: "צרו את החשבונית הראשונה של המרכז.", emptyPendingTitle: "אין חשבוניות ממתינות", emptyPendingBody: "כל החשבוניות שולמו או בוטלו.", emptyPartialTitle: "אין חשבוניות בתשלום חלקי", emptyPartialBody: "אין חשבוניות עם תשלומים חלקיים כרגע.", emptyPaidTitle: "אין עדיין חשבוניות ששולמו", emptyPaidBody: "סמנו חשבונית כשולמה כדי שתופיע כאן.", emptyCancelledTitle: "אין חשבוניות מבוטלות", emptyCancelledBody: "חשבוניות מבוטלות יופיעו כאן.", loading: "טוען חשבוניות...", loadError: "לא ניתן לטעון חשבוניות. נסו שוב.", patient: "מטופל", service: "שירות", customService: "שירות שאינו ברשימה", customServiceName: "שם שירות מותאם", customServiceDuration: "משך שירות מותאם", customServicePrice: "מחיר שירות מותאם", saveCustomService: "שמירה כשירות עתידי", customServiceBadge: "שירות מותאם", provider: "מטפל", providerOptional: "אופציונלי", noProvider: "ללא מטפל", selectPatient: "בחרו מטופל", selectService: "בחרו שירות", amount: "סכום", currency: "מטבע", status: "סטטוס", notes: "הערות", notesOptional: "אופציונלי", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת חשבונית", markedPaid: "החשבונית סומנה כשולמה.", invoiceFullyPaid: "החשבונית שולמה במלואה. לא ניתן להוסיף תשלום חדש.", cancelled: "החשבונית בוטלה.", notFound: "החשבונית לא נמצאה.", fieldRequired: "שדה זה חובה.", invalidAmount: "הזינו סכום תקין גדול מאפס.", markAsPaid: "סמן כשולם", cancelInvoice: "ביטול חשבונית", reopenInvoice: "פתיחה מחדש", reopened: "החשבונית נפתחה מחדש כממתינה.", addPayment: "הוספת תשלום", paymentHistory: "היסטוריית תשלומים", paymentMethod: "אמצעי תשלום", paymentDate: "תאריך תשלום", paymentNotes: "הערות", paymentNotesOptional: "אופציונלי", methodCash: "מזומן", methodBankTransfer: "העברה בנקאית", methodCheck: "המחאה", methodOther: "אחר", paymentAdded: "התשלום נרשם בהצלחה.", noPayments: "עדיין לא נרשמו תשלומים.", invoiceTotal: "סך החשבונית", paidAmount: "שולם", balanceDue: "יתרה לתשלום", paymentBy: "על ידי", overpaymentError: "רישום התשלום נכשל. נסו שוב.", overpaymentCreditHint: "הסכום העודף ישמר כזיכוי למטופל.", invalidPaymentDate: "הזינו תאריך תשלום תקין.", creditBalance: "יתרת זיכוי", useCredit: "שימוש בזיכוי", creditAmount: "סכום זיכוי", creditApplied: "הזיכוי הוחל בהצלחה.", noCreditAvailable: "אין זיכוי זמין למטופל זה.", insufficientCredit: "יתרת הזיכוי אינה מספיקה.", noCreditDue: "אין יתרה לתשלום לשימוש בזיכוי.", creditAdded: "זיכוי נוסף לחשבון המטופל.", overpaymentCreditNotice: "תשלום עודף נשמר כזיכוי למטופל.", creditSourceOverpayment: "מתשלום עודף", creditSourceManual: "התאמה ידנית", creditSourceAdjustment: "התאמה", creditUsageLabel: "זיכוי בשימוש", invoiceTotalDesc: "הערך המלא של כל השירותים בתור זה.", paidAmountDesc: "הסכום הכולל שנגבה מהמטופל.", balanceDueDesc: "הסכום שעל המטופל עדיין לשלם.", balanceDueTooltip: "יתרה לתשלום = סך החשבונית − שולם", creditBalanceDesc: "זיכוי שמור למטופל לשימוש בחשבוניות עתידיות.", statusPaidDesc: "החשבונית נגבתה במלואה.", statusPartialDesc: "חלק שולם — ישנה יתרה.", statusPendingDesc: "טרם התקבל תשלום." },
    reports: { title: "דוחות פיננסיים", subtitle: "הכנסות, יתרות פתוחות ופעילות לתקופה שנבחרה.", loading: "טוען דוח...", loadError: "שגיאה בטעינת הנתונים.", todayRevenue: "הכנסות היום", revenueThisMonth: "הכנסות החודש", paidInvoices: "חשבוניות ששולמו", pendingInvoices: "חשבוניות ממתינות", overdueInvoices: "חשבוניות באיחור", averageInvoiceValue: "ערך חשבונית ממוצע", totalPaid: "סך הכול שנגבה", outstanding: "יתרה לגביה", patientCredit: "זיכוי מטופלים", cancelledInvoices: "חשבוניות מבוטלות", appointmentsToday: "תורים היום", periodToday: "היום", periodLast7Days: "7 הימים האחרונים", periodWeek: "השבוע", periodMonth: "החודש", periodCustom: "מותאם אישית", filterFrom: "מ-", filterTo: "עד", applyFilter: "החל", revenue: "הכנסות", appointments: "תורים", revenueByDay: "הכנסות לפי יום", revenueByPaymentStatus: "הכנסות לפי סטטוס תשלום", revenueByService: "הכנסות לפי שירות", noChartData: "אין מספיק נתונים לתקופה זו.", viewSessions: "הצג טיפולים", statusPaid: "שולם", statusPending: "לא שולם", statusPartial: "שולם חלקית", statusOverdue: "באיחור", topPatientsTitle: "מטופלים מובילים", topPatientsEmpty: "אין נתונים לתקופה זו.", topPatientsTotalPaid: "סה״כ שולם", topPatientsVisits: "ביקורים", topPatientsCredit: "זיכוי", topPatientsVip: "VIP", receivablesSectionTitle: "חובות פתוחים", receivablesSectionHelper: "מציג את כל היתרות הפתוחות גם אם הן מחוץ לתקופה שנבחרה.", receivablesDetailsTitle: "פירוט חובות", totalReceivables: "סך חובות פתוחים", patientsWithDebt: "מטופלים עם יתרה", unpaidInvoices: "חשבוניות שלא שולמו", partiallyPaidInvoices: "חשבוניות ששולמו חלקית", highestDebt: "החוב הגבוה ביותר", invoiceCountIncluded: "חשבוניות בטווח שנבחר", noFinancialDataInRange: "אין נתונים פיננסיים בטווח שנבחר.", selectedDateRange: "טווח תאריכים נבחר", openReceivablesOnly: "חובות פתוחים בלבד", overdueOnly: "באיחור בלבד", receivablesByPaymentStatus: "חובות לפי סטטוס תשלום", topPatientsByDebt: "מטופלים עם החוב הגבוה ביותר", revenueVsReceivables: "הכנסות מול חובות", revenueLabel: "הכנסות", receivablesLabel: "חובות", patient: "מטופל", phone: "טלפון", service: "שירות", invoiceTotal: "סך חשבונית", paidAmount: "שולם", remainingAmount: "נותר", paymentStatus: "סטטוס תשלום", lastPayment: "תשלום אחרון", dueDate: "תאריך יעד", notRecorded: "לא נרשם", noReceivablesData: "אין חובות התואמים לסינון.", todayOverviewTitle: "סיכום יומי", appointmentsTodayTotal: "תורים היום", appointmentsTodayCompleted: "הושלמו היום", appointmentsTodayUpcoming: "ממתינים היום", delayedFollowUps: "מעקבים מאוחרים", newPatientsThisMonth: "מטופלים חדשים החודש", activeTreatmentPlans: "תוכניות טיפול פעילות", revenueInsightsTitle: "ניתוח הכנסות", appointmentAnalyticsTitle: "ניתוח תורים", totalInPeriod: "סך תורים", noShowCount: "אי-הגעה", cancellationRate: "שיעור ביטולים", noShowRate: "שיעור אי-הגעה", topProvidersTitle: "מטפלים מובילים", viewFullReceivables: "הצג חובות מלאים", hideFullReceivables: "הסתר חובות", topDebtorsTitle: "יתרות גבוהות ביותר", completedWithoutInvoiceTitle: "טיפולים שהושלמו ללא חשבונית", completedWithoutInvoiceAlert: (count: number) => `${count} טיפולים שהושלמו ללא חשבונית עדיין`, completedWithoutInvoiceEmpty: "לכל הטיפולים שהושלמו יש חשבוניות.", showAllUnbilled: "כל הזמן — התעלם מטווח תאריכים", showPeriodUnbilled: "הצג תקופה בלבד" },
    profile: { title: "הפרופיל שלי", subtitle: "פרטי החשבון שלך והרשאות הגישה.", center: "מרכז", memberSince: "חבר מאז", permissionsTitle: "הרשאות גישה", noPermissions: "לא הוקצו הרשאות.", changePassword: "שינוי סיסמה", currentPassword: "סיסמה נוכחית", newPassword: "סיסמה חדשה", confirmPassword: "אישור סיסמה חדשה", updatePassword: "עדכון סיסמה", updating: "מעדכן...", passwordUpdated: "הסיסמה עודכנה בהצלחה.", passwordMismatch: "הסיסמאות החדשות אינן תואמות.", passwordTooShort: "הסיסמה חייבת לכלול לפחות 8 תווים.", wrongPassword: "הסיסמה הנוכחית שגויה.", loadError: "לא ניתן לטעון את הפרופיל. נסו שוב." },
    permissionLabels: { patientsView: "צפייה במטופלים", patientsCreate: "יצירת מטופלים", patientsUpdate: "עריכת מטופלים", patientsStatus: "עדכון סטטוס מטופלים", staffView: "צפייה בצוות", staffCreate: "יצירת צוות", staffUpdate: "עריכת צוות", staffActivate: "הפעלה / השבתת צוות", servicesView: "צפייה בשירותים", servicesCreate: "יצירת שירותים", servicesUpdate: "עריכת שירותים", servicesArchive: "ארכוב שירותים", servicesActivate: "עדכון סטטוס שירותים", appointmentsView: "צפייה בתורים", appointmentsCreate: "יצירת תורים", appointmentsUpdate: "עריכת תורים", appointmentsCancel: "ביטול תורים", appointmentsStatusUpdate: "עדכון סטטוס תורים", billingView: "צפייה בחשבוניות", billingCreate: "יצירת חשבוניות", billingUpdate: "עריכת חשבוניות", billingMarkPaid: "ביטול חשבוניות", paymentsView: "צפייה בתשלומים", paymentsCreate: "רישום תשלומים", expensesView: "צפייה בהוצאות", expensesCreate: "יצירת הוצאות", expensesEdit: "עריכת הוצאות", expensesDelete: "מחיקת הוצאות", expensesReports: "דוחות הוצאות", reportsView: "צפייה בדוחות", settingsView: "צפייה בהגדרות", permissionsView: "צפייה בהרשאות תפקידים", permissionsUpdate: "עריכת הרשאות תפקידים" },
    appointments: { title: "תורים", subtitle: "תזמון, עדכון ומעקב אחר תורי המרכז.", addAppointment: "הוספת תור", editAppointment: "עריכת תור", detailsTitle: "פרטי תור", searchPlaceholder: "חיפוש לפי שם מטופל או טלפון", filterAll: "כל הסטטוסים", today: "היום", upcoming: "קרובים", dateFilter: "תאריך", providerFilter: "מטפל", allProviders: "כל המטפלים", allBranches: "כל הסניפים", branch: "סניף", chooseBranch: "בחר סניף", emptyTitle: "אין עדיין תורים", emptyBody: "צרו את התור הראשון למרכז הזה.", noResultsTitle: "לא נמצאו תורים תואמים", noResultsBody: "נסו מטופל, סטטוס, תאריך או מטפל אחר.", loading: "טוען תורים...", loadError: "לא ניתן לטעון תורים. נסו שוב.", patient: "מטופל", service: "שירות", customService: "שירות שאינו ברשימה", customServiceName: "שם שירות מותאם", customServiceDuration: "משך הטיפול (דקות)", customServiceDurationPlaceholder: "לדוגמה: 15", customServiceDurationHelper: "משך הטיפול נמדד בדקות", customServicePrice: "מחיר השירות (₪)", customServicePricePlaceholder: "לדוגמה: 80", customServicePriceHelper: "המחיר מחושב בשקלים (ILS)", saveCustomService: "שמירה כשירות עתידי", customServiceBadge: "שירות מותאם", provider: "מטפל", appointmentDate: "תאריך התור", startTime: "שעת התחלה", endTime: "שעת סיום", durationMinutes: "משך התור (בדקות)", durationMinutesPlaceholder: "לדוגמה: 15", durationMinutesHelper: "משך התור מחושב בדקות.", status: "סטטוס", notes: "הערות טיפול", notesHelper: "מופיעות בהיסטוריית הטיפול ובמעקבים עתידיים.", internalNotes: "הערות פנימיות לצוות", internalNotesHelper: "לא מוצגות למטופל או בהודעות מעקב.", cancellationReason: "סיבת ביטול", reminderSent: "נשלחה תזכורת", createdAt: "נוצר", updatedAt: "עודכן", createdBy: "נוצר על ידי", submit: "יצירת תור", update: "עדכון תור", saved: "התור נשמר.", saveError: "לא ניתן לשמור את התור. נסו שוב.", cancelled: "התור בוטל.", statusUpdated: "סטטוס התור עודכן.", notFound: "התור לא נמצא.", fieldRequired: "שדה זה חובה.", invalidDate: "בחרו תאריך תור תקין.", invalidTime: "בחרו שעה תקינה.", invalidDuration: "הזינו משך תקין.", overlap: "התור הזה חופף לתור אחר.", cancelAppointment: "ביטול תור", confirmCancel: "אישור ביטול", changeStatus: "שינוי סטטוס", conflictTitle: "זוהתה התנגשות בתורים", conflictMessage: "נא לבחור שעה אחרת", conflictPatient: "מטופל", conflictService: "שירות", conflictProvider: "מטפל", conflictDate: "תאריך", conflictStart: "שעת התחלה", conflictEnd: "שעת סיום", startsInMinutes: "מתחיל בעוד {n} דקות", inProgressNow: "בתהליך כעת", endOfDayError: "התור חייב להסתיים לפני חצות.", invoiceSection: "חשבונית", noInvoice: "אין עדיין חשבונית", noInvoiceBody: "צרו חשבונית כדי לעקוב אחר התשלום לתור זה.", createInvoice: "יצירת חשבונית", openInvoice: "פתיחת חשבונית", invoiceCreated: "החשבונית נוצרה בהצלחה.", noServicePrice: "לשירות זה אין מחיר. פתחו את החיוב ליצירת חשבונית ידנית.", invoiceUnpaid: "לא שולם", viewInvoice: "צפייה בחשבונית", invoiceRequiresCompleted: "ניתן ליצור חשבונית רק לאחר השלמת התור.", invoiceFullyPaid: "החשבונית שולמה במלואה.", needsInvoiceBadge: "דרושה חשבונית", bookingRequestDetails: "פרטי בקשת התור", bookingRequester: "מבקש התור", bookingRequesterPhone: "טלפון המבקש", bookingRequestNotes: "הערות הבקשה", requestedBy: (name: string) => `נתבקש על ידי: ${name}`, slotBooked: "תפוס", currentAppointmentSlot: "התור הנוכחי", loadingSlots: "טוען שעות פנויות...", noSlots: "אין שעות פנויות לתאריך זה.", selectServiceAndDate: "בחרו שירות ותאריך לצפייה בשעות הפנויות.", enterDurationToSeeSlots: "הזינו את משך הטיפול לצפייה בשעות הפנויות.", calendarView: "לוח שנה", listView: "רשימה", dayView: "יום", weekView: "שבוע", calendarToday: "היום", calendarPrev: "הקודם", calendarNext: "הבא", reminderSection: "תזכורת למטופל", lastReminderSent: "תזכורת אחרונה נשלחה", reminderCountLabel: "תזכורות שנשלחו", sendReminderNow: "שליחת תזכורת בוואטסאפ", reminderSentSuccess: "התזכורת מוכנה. פתחו וואטסאפ לשליחה.", reminderNotSentYet: "לא נשלחה תזכורת עדיין.", reminder24hSentLabel: "תזכורת 24 שעות נשלחה", reminder2hSentLabel: "תזכורת 2 שעות נשלחה", openWhatsApp: "פתיחת וואטסאפ", copyMessage: "העתקת הודעה", reminderSending: "מכין...", reminderHelperText: "וואטסאפ נפתח עם הודעה מוכנה.", followUpCreatedAfterCompletionHelper: "המעקב ייווצר אוטומטית לאחר סימון התור כהושלם.", followUpPlanLockedHelper: "תוכנית המעקב זמינה רק בעת שמירת השירות כשירות עתידי.", followUpActiveInService: "תוכנית מעקב מופעלת עבור שירות זה.", editServiceFollowUp: "ערוך הגדרות מעקב בשירות", savedServiceBadge: "שירות זה שמור ברשימת השירותים", followUpPlanActive: "תוכנית מעקב פעילה", followUpUpcoming: "מעקב קרוב", followUpDue: (date: string) => `מעקב קרוב: ${date}`, followUpMissing: "מעקב לא נוצר", followUpBooked: "נקבע תור", followUpCompleted: "מעקב הושלם", followUpContacted: "נוצר קשר", followUpMissed: "מועד המעקב חלף", followUpCancelled: "המעקב בוטל", reactivateAppointment: "הפעל מחדש את הפגישה", reactivateConfirm: "האם ברצונך להפעיל מחדש את הפגישה? היא תוחזר לסטטוס מאושר.", reactivated: "הפגישה הופעלה מחדש בהצלחה.", invoiceBlockedCancelled: "לא ניתן ליצור חשבונית עבור פגישה מבוטלת.", followUpPlanExists: "יש תוכנית מעקב", followUpPlanNone: "אין תוכנית מעקב", followUpPlanSection: "תוכנית מעקב", viewInFollowUps: "הצג במעקבים", followUpPlanLoading: "טוען תוכנית...", followUpSession: (n: number) => `מפגש ${n}`, followUpPlanNoRecord: "אין תוכנית מעקב לתור זה", followUpRecurringBadge: "♾ מעקב מחזורי", followUpNextDue: "המעקב הבא", followUpLastCompleted: "הושלם לאחרונה", followUpPhaseHeader: (phase: number, days: number) => `שלב ${phase} — כל ${days} ימים`, followUpPhaseTitle: (phase: number) => `שלב טיפול ${phase}`, followUpPhaseSubtitle: (from: number, to: number, days: number) => `טיפולים ${from} → ${to} • כל ${days} ימים`, followUpNextSessionBadge: "הפגישה הבאה", followUpRelativeToday: "היום", followUpRelativeOverdue: (days: number) => `${days} ימים באיחור`, followUpRelativeRemaining: (days: number) => `נותרו ${days} ימים`, reminderMessagesSection: "הודעות תזכורת", followUpEvery: "כל", followUpIntervalDay: (n: number) => n === 1 ? "יום" : "ימים", followUpIntervalWeek: (n: number) => n === 1 ? "שבוע" : "שבועות", followUpIntervalMonth: (n: number) => n === 1 ? "חודש" : "חודשים", followUpIntervalYear: (n: number) => n === 1 ? "שנה" : "שנים" },
    rolePermissions: { title: "הרשאות תפקידים", subtitle: "הגדירו אילו פעולות כל תפקיד יכול לבצע במרכז זה.", selectRole: "בחרו תפקיד לניהול הרשאותיו.", ownerProtected: "לתפקיד בעלי המרכז יש גישה מלאה ואינו ניתן לשינוי.", savePermissions: "שמירת הרשאות", saving: "שומר...", saved: "ההרשאות נשמרו.", loadError: "לא ניתן לטעון הרשאות. נסו שוב.", paymentsSection: "תשלומים" },
    notifications: { title: "התראות", subtitle: "התראות מינוי והתראות מערכת עבור מרכז זה.", navLabel: "התראות", loading: "טוען התראות...", loadError: "לא ניתן לטעון התראות. נסו שוב.", markAsRead: "סמן כנקרא", markingRead: "מסמן...", markedRead: "סומן כנקרא", viewAll: "צפייה בכל ההתראות", filterAll: "הכול", filterUnread: "לא נקראו", emptyTitle: "אין התראות", emptyBody: "כאן יופיעו התראות מינוי והתראות מערכת.", emptyUnreadTitle: "אין התראות שלא נקראו", emptyUnreadBody: "כל ההתראות נקראו.", unreadCount: (n: number) => `${n} לא נקראו`, typeExpiring: "המינוי מסתיים בקרוב", typeExpired: "המינוי פג תוקף", typeBookingRequest: "בקשת תור", newBookingToast: "בקשת תור חדשה התקבלה עכשיו.", openBookingRequests: "פתח בקשות תור", statusPending: "ממתין", statusSent: "נשלח", statusFailed: "נכשל", widgetTitle: "התראות", widgetNoUnread: "אין התראות חדשות.", corruptedFallback: "התראה חדשה" },
    gallery: { title: "גלריה", subtitle: "נהלו את התמונות המוצגות בפרופיל הציבורי של המרכז.", uploadButton: "העלאת תמונה", uploadingText: "מעלה...", deleteButton: "מחיקה", emptyTitle: "אין עדיין תמונות", emptyBody: "העלו תמונות כדי להציג את המרכז שלכם בדף הציבורי.", loadError: "לא ניתן לטעון את הגלריה. נסו שוב.", uploadError: "ההעלאה נכשלה. בדקו את הקובץ ונסו שוב.", maxImages: "מותר עד 20 תמונות.", recommendedSize: "מומלץ: JPG או PNG, לפחות 800 x 600 פיקסל.", moveUp: "הזזה למעלה", moveDown: "הזזה למטה" },
    marketing: { cancel: "בטל שינויים", clearToken: "נקה אסימון שמור", fields: { customBodyScript: "סקריפט מותאם ל-Body", customHeadScript: "סקריפט מותאם ל-Head", ga4Id: "מזהה GA4", gtmId: "מזהה GTM", metaConversionApiToken: "אסימון Meta Conversion API", metaPixelId: "מזהה Meta Pixel", snapPixelId: "מזהה Snap Pixel", tiktokPixelId: "מזהה TikTok Pixel" }, helper: "הערכים נשמרים למרכז הזה בלבד. מעקב פועל רק בעמודי המרכז הציבוריים.", logProviders: { GA4: "GA4", META_CAPI: "Meta CAPI", META_PIXEL: "Meta Pixel", SNAP: "Snap Pixel", TIKTOK: "TikTok Pixel" }, logsEmpty: "אין עדיין יומני מעקב.", logsError: "לא ניתן לרענן יומני מעקב.", logsRefresh: "רענון", logsRefreshing: "מרענן...", logsSection: "יומני מעקב אחרונים", logsSubtitle: "היסטוריית בדיקה בטוחה לאירועי שיווק בצד השרת.", logStatuses: { FAILED: "נכשל", SKIPPED: "דולג", SUCCESS: "הצליח" }, loading: "טוען הגדרות שיווק...", loadError: "לא ניתן לטעון הגדרות שיווק. נסו שוב.", noChanges: "אין שינויים שלא נשמרו.", optional: "אופציונלי", pixelSection: "מזהי מעקב", pixelSubtitle: "שמרו מזהי פיקסלים ואנליטיקה שמשמשים את עמודי ההזמנה הציבוריים.", save: "שמור הגדרות שיווק", saved: "הגדרות השיווק נשמרו.", saveError: "לא ניתן לשמור הגדרות שיווק. נסו שוב.", saving: "שומר...", scriptPlaceholder: "הדביקו סקריפט כאן. הוא ירוץ רק בעמודי המרכז הציבוריים.", scriptSection: "סקריפטים מותאמים", scriptSubtitle: "ניהול סקריפטים ל-Head ול-Body עבור עמודי המרכז הציבוריים בלבד.", scriptWarning: "הדביקו רק סקריפטים מספקים שאתם סומכים עליהם. סקריפטים מותאמים רצים בעמודי המרכז הציבוריים ולא בתוך לוח הניהול.", subtitle: "ניהול פיקסלים שיווקיים, אסימון Meta CAPI בצד השרת וסקריפטים ציבוריים.", title: "הגדרות שיווק", testClientError: "לא ניתן לשלוח אירוע בדיקה. בדקו שסקריפט הספק נטען בעמוד הציבורי.", testGa4: "בדיקת GA4", testGa4Success: "אירוע בדיקת GA4 הופעל.", testMetaCapi: "בדיקת Meta CAPI", testMetaCapiError: "בדיקת Meta CAPI נכשלה. בדקו את מזהה הפיקסל והאסימון השמור.", testMetaCapiSuccess: "אירוע בדיקת Meta CAPI נשלח.", testMetaPixel: "בדיקת Meta Pixel", testMetaPixelSuccess: "אירוע בדיקת Meta Pixel הופעל.", testSection: "בדיקת מעקב", testSnapPixel: "בדיקת Snap Pixel", testSnapSuccess: "אירוע בדיקת Snap Pixel הופעל.", testSubtitle: "שלחו אירוע TestMarketingEvent בטוח כדי לבדוק את הגדרות המעקב.", testTikTokPixel: "בדיקת TikTok Pixel", testTikTokSuccess: "אירוע בדיקת TikTok Pixel הופעל.", tokenHelper: "נשמר בצורה מאובטחת לאירועי Meta Conversion API בצד השרת בלבד ואינו נחשף בעמודים ציבוריים.", tokenPlaceholder: "קיים אסימון שמור ומוסתר. הזינו אסימון חדש כדי להחליף אותו.", tokenSaved: "קיים אסימון Meta Conversion API שמור ומוסתר.", unsaved: "יש שינויים שלא נשמרו." },
    serviceStatuses: { ACTIVE: "פעיל", ARCHIVED: "בארכיון" },
    staffStatuses: { ACTIVE: "פעיל", INACTIVE: "לא פעיל" },
    billingStatuses: { PENDING: "ממתין", PARTIAL: "שולם חלקית", PAID: "שולם", CANCELLED: "בוטל" },
    appointmentStatuses: { SCHEDULED: "מתוזמן", CONFIRMED: "מאושר", IN_PROGRESS: "בטיפול", COMPLETED: "הושלם", CANCELLED: "בוטל", NO_SHOW: "לא הגיע" },
    placeholders: { appointments: { title: "תורים", description: "ניהול התורים זמין כעת." }, staff: { title: "צוות", description: "כלי הצוות יורחבו במודול עתידי." }, billing: { title: "חיוב", description: "מידע חיוב ידני יופיע כאן. אין תשלומים מקוונים." }, reports: { title: "דוחות", description: "דוחות תפעוליים יתווספו בהמשך." }, settings: { title: "הגדרות", description: "הגדרות המרכז יתווספו במודול עתידי." } },
    comingSoon: "בקרוב",
    patientStatuses: { ACTIVE: "פעיל", INACTIVE: "לא פעיל", ARCHIVED: "בארכיון" },
    patientGenders: { MALE: "זכר", FEMALE: "נקבה", OTHER: "אחר", UNKNOWN: "לא צוין" },
    roles: { CENTER_OWNER: "בעל המרכז", CENTER_MANAGER: "מנהל המרכז", DOCTOR: "רופא", RECEPTIONIST: "קבלה", ACCOUNTANT: "הנהלת חשבונות", STAFF: "צוות" },
    statuses: { TRIAL: "ניסיון", ACTIVE: "פעיל", PAST_DUE: "באיחור בתשלום", SUSPENDED: "מושעה", CANCELLED: "מבוטל", ARCHIVED: "בארכיון" },
  },
};
