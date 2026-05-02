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
    menu: string;
    close: string;
    language: string;
    logout: string;
    loggingOut: string;
  };
  nav: {
    dashboard: string;
    patients: string;
    appointments: string;
    services: string;
    staff: string;
    billing: string;
    reports: string;
    settings: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    subtitle: string;
    currentUser: string;
    role: string;
    centerStatus: string;
    loading: string;
    sessionExpired: string;
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
    editPatient: string;
    detailsTitle: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    loading: string;
    fullName: string;
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
    invalidDuration: string;
    invalidPrice: string;
    invalidCurrency: string;
    durationUnitMinutes: string;
    durationUnitHours: string;
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
    password: string;
    passwordOptional: string;
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
  };
  billing: {
    title: string;
    subtitle: string;
    addInvoice: string;
    invoiceTitle: string;
    searchPlaceholder: string;
    filterAllStatuses: string;
    emptyTitle: string;
    emptyBody: string;
    loading: string;
    loadError: string;
    patient: string;
    service: string;
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
    invalidPaymentDate: string;
    creditBalance: string;
    useCredit: string;
    creditAmount: string;
    creditApplied: string;
    noCreditAvailable: string;
    insufficientCredit: string;
    creditAdded: string;
    overpaymentCreditNotice: string;
    creditSourceOverpayment: string;
    creditSourceManual: string;
    creditSourceAdjustment: string;
    creditUsageLabel: string;
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
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    loading: string;
    loadError: string;
    patient: string;
    service: string;
    provider: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: string;
    status: string;
    notes: string;
    internalNotes: string;
    cancellationReason: string;
    reminderSent: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    submit: string;
    update: string;
    saved: string;
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
      menu: "Menu",
      close: "Close",
      language: "Language",
      logout: "Logout",
      loggingOut: "Logging out...",
    },
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      appointments: "Appointments",
      services: "Services",
      staff: "Staff",
      billing: "Billing",
      reports: "Reports",
      settings: "Settings",
    },
    dashboard: {
      eyebrow: "Center workspace",
      title: "Dashboard",
      subtitle: "Your private center control panel.",
      currentUser: "Current User",
      role: "Role",
      centerStatus: "Center Status",
      loading: "Loading dashboard...",
      sessionExpired: "Please log in again.",
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
      editPatient: "Edit Patient",
      detailsTitle: "Patient Details",
      searchPlaceholder: "Search by patient name or phone",
      emptyTitle: "No patients yet",
      emptyBody: "Create the first patient record for this center.",
      noResultsTitle: "No matching patients",
      noResultsBody: "Try another name or phone number.",
      loading: "Loading patients...",
      fullName: "Full Name",
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
      invalidDuration: "Enter a valid duration.",
      invalidPrice: "Enter a valid price.",
      invalidCurrency: "Enter a valid currency code.",
      durationUnitMinutes: "Minutes",
      durationUnitHours: "Hours",
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
    },
    billing: {
      title: "Billing",
      subtitle: "Manage manual invoices and payment records for this center.",
      addInvoice: "Add Invoice",
      invoiceTitle: "Invoice Details",
      searchPlaceholder: "Search by patient name or phone",
      filterAllStatuses: "All Statuses",
      emptyTitle: "No invoices yet",
      emptyBody: "Create the first invoice for this center.",
      loading: "Loading invoices...",
      loadError: "Invoices could not be loaded. Please try again.",
      patient: "Patient",
      service: "Service",
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
      overpaymentError: "Payment would exceed the invoice total.",
      invalidPaymentDate: "Enter a valid payment date.",
      creditBalance: "Credit Balance",
      useCredit: "Use Credit",
      creditAmount: "Credit Amount",
      creditApplied: "Credit applied successfully.",
      noCreditAvailable: "This patient has no available credit.",
      insufficientCredit: "Insufficient credit balance.",
      creditAdded: "Credit added to patient account.",
      overpaymentCreditNotice: "Overpayment stored as patient credit.",
      creditSourceOverpayment: "From overpayment",
      creditSourceManual: "Manual adjustment",
      creditSourceAdjustment: "Adjustment",
      creditUsageLabel: "Credit used",
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
      emptyTitle: "No appointments yet",
      emptyBody: "Create the first appointment for this center.",
      noResultsTitle: "No matching appointments",
      noResultsBody: "Try another patient, status, date, or provider.",
      loading: "Loading appointments...",
      loadError: "Appointments could not be loaded. Please try again.",
      patient: "Patient",
      service: "Service",
      provider: "Provider",
      appointmentDate: "Appointment Date",
      startTime: "Start Time",
      endTime: "End Time",
      durationMinutes: "Duration",
      status: "Status",
      notes: "Notes",
      internalNotes: "Internal Notes",
      cancellationReason: "Cancellation Reason",
      reminderSent: "Reminder Sent",
      createdAt: "Created",
      updatedAt: "Updated",
      createdBy: "Created By",
      submit: "Create Appointment",
      update: "Update Appointment",
      saved: "Appointment saved.",
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
    shell: { menu: "القائمة", close: "إغلاق", language: "اللغة", logout: "تسجيل الخروج", loggingOut: "جار تسجيل الخروج..." },
    nav: { dashboard: "لوحة التحكم", patients: "المرضى", appointments: "المواعيد", services: "الخدمات", staff: "الطاقم", billing: "الفوترة", reports: "التقارير", settings: "الإعدادات" },
    dashboard: { eyebrow: "مساحة عمل المركز", title: "لوحة التحكم", subtitle: "لوحة التحكم الخاصة بالمركز.", currentUser: "المستخدم الحالي", role: "الدور", centerStatus: "حالة المركز", loading: "جار تحميل لوحة التحكم...", sessionExpired: "يرجى تسجيل الدخول مرة أخرى." },
    cards: { patients: "المرضى", appointments: "المواعيد", services: "الخدمات", staff: "مستخدمو الطاقم" },
    common: { cancel: "إلغاء", close: "إغلاق", save: "حفظ", saving: "جار الحفظ...", search: "بحث", view: "عرض", edit: "تعديل", archive: "أرشفة", activate: "تفعيل", actions: "الإجراءات", notAvailable: "غير متاح" },
    patients: { title: "المرضى", subtitle: "إدارة سجلات المرضى الخاصة بهذا المركز فقط.", addPatient: "إضافة مريض", editPatient: "تعديل مريض", detailsTitle: "تفاصيل المريض", searchPlaceholder: "ابحث باسم المريض أو رقم الهاتف", emptyTitle: "لا توجد سجلات مرضى بعد", emptyBody: "أنشئ أول سجل مريض لهذا المركز.", noResultsTitle: "لا توجد نتائج مطابقة", noResultsBody: "جرّب اسمًا أو رقم هاتف آخر.", loading: "جار تحميل المرضى...", fullName: "الاسم الكامل", phone: "الهاتف", email: "البريد الإلكتروني", gender: "الجنس", dateOfBirth: "تاريخ الميلاد", nationalId: "رقم الهوية", notes: "ملاحظات", status: "الحالة", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء مريض", update: "تحديث المريض", fieldRequired: "هذا الحقل مطلوب.", invalidPhone: "أدخل رقم هاتف صالحًا.", duplicatePhone: "يوجد مريض بهذا الهاتف بالفعل.", loadError: "تعذر تحميل المرضى. يرجى المحاولة مرة أخرى.", saved: "تم حفظ المريض.", archived: "تمت أرشفة المريض.", activated: "تم تفعيل المريض.", notFound: "المريض غير موجود." },
    services: { title: "الخدمات", subtitle: "إدارة خدمات المركز والمدة والأسعار وحالة التفعيل.", addService: "إضافة خدمة", editService: "تعديل خدمة", detailsTitle: "تفاصيل الخدمة", searchPlaceholder: "ابحث باسم الخدمة", filterAll: "الكل", filterActive: "نشطة", filterArchived: "مؤرشفة", emptyTitle: "لا توجد خدمات بعد", emptyBody: "أنشئ أول خدمة لهذا المركز.", noResultsTitle: "لا توجد خدمات مطابقة", noResultsBody: "جرّب اسم خدمة آخر.", loading: "جار تحميل الخدمات...", loadError: "تعذر تحميل الخدمات. يرجى المحاولة مرة أخرى.", nameEn: "الاسم بالإنجليزية", nameAr: "الاسم بالعربية", nameHe: "الاسم بالعبرية", descriptionEn: "الوصف بالإنجليزية", descriptionAr: "الوصف بالعربية", descriptionHe: "الوصف بالعبرية", durationMinutes: "المدة", price: "السعر", currency: "العملة", status: "الحالة", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء خدمة", update: "تحديث الخدمة", saved: "تم حفظ الخدمة.", archived: "تمت أرشفة الخدمة.", activated: "تم تفعيل الخدمة.", notFound: "الخدمة غير موجودة.", optional: "اختياري", fieldRequired: "هذا الحقل مطلوب.", invalidDuration: "أدخل مدة صالحة.", invalidPrice: "أدخل سعرًا صالحًا.", invalidCurrency: "أدخل رمز عملة صالحًا.", durationUnitMinutes: "دقيقة", durationUnitHours: "ساعة" },
    staff: { title: "الطاقم", subtitle: "إدارة مستخدمي الطاقم والأدوار وحالة الوصول.", addStaff: "إضافة موظف", editStaff: "تعديل موظف", detailsTitle: "تفاصيل الموظف", searchPlaceholder: "ابحث بالاسم أو البريد الإلكتروني", filterAllRoles: "كل الأدوار", filterAllStatuses: "كل الحالات", emptyTitle: "لا يوجد مستخدمو طاقم بعد", emptyBody: "أنشئ أول مستخدم طاقم لهذا المركز.", noResultsTitle: "لا يوجد طاقم مطابق", noResultsBody: "جرّب اسمًا أو بريدًا أو دورًا أو حالة أخرى.", loading: "جار تحميل الطاقم...", loadError: "تعذر تحميل الطاقم. يرجى المحاولة مرة أخرى.", fullName: "الاسم الكامل", email: "البريد الإلكتروني", password: "كلمة المرور", passwordOptional: "اختيارية عند التعديل", role: "الدور", status: "الحالة", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء موظف", update: "تحديث الموظف", saved: "تم حفظ الموظف.", activated: "تم تفعيل الموظف.", deactivated: "تم إلغاء تفعيل الموظف.", notFound: "الموظف غير موجود.", fieldRequired: "هذا الحقل مطلوب.", invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا للموظف.", duplicateEmail: "يوجد مستخدم بهذا البريد بالفعل.", invalidPassword: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." },
    billing: { title: "الفوترة", subtitle: "إدارة الفواتير اليدوية وسجلات الدفع لهذا المركز.", addInvoice: "إضافة فاتورة", invoiceTitle: "تفاصيل الفاتورة", searchPlaceholder: "ابحث باسم المريض أو رقم الهاتف", filterAllStatuses: "كل الحالات", emptyTitle: "لا توجد فواتير بعد", emptyBody: "أنشئ أول فاتورة لهذا المركز.", loading: "جار تحميل الفواتير...", loadError: "تعذر تحميل الفواتير. يرجى المحاولة مرة أخرى.", patient: "المريض", service: "الخدمة", provider: "المقدم", providerOptional: "اختياري", noProvider: "بدون مقدم", selectPatient: "اختر مريضًا", selectService: "اختر خدمة", amount: "المبلغ", currency: "العملة", status: "الحالة", notes: "ملاحظات", notesOptional: "اختياري", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", submit: "إنشاء فاتورة", markedPaid: "تم تحديد الفاتورة كمدفوعة.", cancelled: "تم إلغاء الفاتورة.", notFound: "الفاتورة غير موجودة.", fieldRequired: "هذا الحقل مطلوب.", invalidAmount: "أدخل مبلغًا صالحًا أكبر من الصفر.", markAsPaid: "تحديد كمدفوع", cancelInvoice: "إلغاء الفاتورة", reopenInvoice: "إعادة فتح الفاتورة", reopened: "تمت إعادة فتح الفاتورة كمعلقة.", addPayment: "إضافة دفعة", paymentHistory: "سجل الدفعات", paymentMethod: "طريقة الدفع", paymentDate: "تاريخ الدفع", paymentNotes: "ملاحظات", paymentNotesOptional: "اختياري", methodCash: "نقدي", methodBankTransfer: "تحويل بنكي", methodCheck: "شيك", methodOther: "أخرى", paymentAdded: "تم تسجيل الدفعة بنجاح.", noPayments: "لا توجد دفعات مسجلة بعد.", invoiceTotal: "إجمالي الفاتورة", paidAmount: "المدفوع", balanceDue: "الرصيد المستحق", paymentBy: "بواسطة", overpaymentError: "الدفعة ستتجاوز إجمالي الفاتورة.", invalidPaymentDate: "أدخل تاريخ دفع صالحًا.", creditBalance: "الرصيد الائتماني", useCredit: "استخدام الرصيد", creditAmount: "مبلغ الرصيد", creditApplied: "تم تطبيق الرصيد بنجاح.", noCreditAvailable: "لا يوجد رصيد ائتماني متاح لهذا المريض.", insufficientCredit: "رصيد ائتماني غير كافٍ.", creditAdded: "تمت إضافة رصيد لحساب المريض.", overpaymentCreditNotice: "تم حفظ الدفع الزائد كرصيد للمريض.", creditSourceOverpayment: "من دفع زائد", creditSourceManual: "تعديل يدوي", creditSourceAdjustment: "تعديل", creditUsageLabel: "رصيد مستخدم" },
    appointments: { title: "المواعيد", subtitle: "جدولة المواعيد ومتابعتها لهذا المركز.", addAppointment: "إضافة موعد", editAppointment: "تعديل موعد", detailsTitle: "تفاصيل الموعد", searchPlaceholder: "ابحث باسم المريض أو رقم الهاتف", filterAll: "كل الحالات", today: "اليوم", upcoming: "القادمة", dateFilter: "التاريخ", providerFilter: "المقدم", allProviders: "كل المقدمين", emptyTitle: "لا توجد مواعيد بعد", emptyBody: "أنشئ أول موعد لهذا المركز.", noResultsTitle: "لا توجد مواعيد مطابقة", noResultsBody: "جرّب مريضًا أو حالة أو تاريخًا أو مقدمًا آخر.", loading: "جار تحميل المواعيد...", loadError: "تعذر تحميل المواعيد. حاول مرة أخرى.", patient: "المريض", service: "الخدمة", provider: "المقدم", appointmentDate: "تاريخ الموعد", startTime: "وقت البداية", endTime: "وقت النهاية", durationMinutes: "المدة", status: "الحالة", notes: "ملاحظات", internalNotes: "ملاحظات داخلية", cancellationReason: "سبب الإلغاء", reminderSent: "تم إرسال التذكير", createdAt: "تاريخ الإنشاء", updatedAt: "آخر تحديث", createdBy: "أنشئ بواسطة", submit: "إنشاء موعد", update: "تحديث الموعد", saved: "تم حفظ الموعد.", cancelled: "تم إلغاء الموعد.", statusUpdated: "تم تحديث حالة الموعد.", notFound: "الموعد غير موجود.", fieldRequired: "هذا الحقل مطلوب.", invalidDate: "اختر تاريخ موعد صالحًا.", invalidTime: "اختر وقتًا صالحًا.", invalidDuration: "أدخل مدة صالحة.", overlap: "هذا الموعد يتداخل مع حجز آخر.", cancelAppointment: "إلغاء الموعد", confirmCancel: "تأكيد الإلغاء", changeStatus: "تغيير الحالة", conflictTitle: "تم اكتشاف تعارض في الموعد", conflictMessage: "يرجى اختيار وقت مختلف", conflictPatient: "المريض", conflictService: "الخدمة", conflictProvider: "المقدم", conflictDate: "التاريخ", conflictStart: "وقت البداية", conflictEnd: "وقت النهاية" },
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
    shell: { menu: "תפריט", close: "סגירה", language: "שפה", logout: "התנתקות", loggingOut: "מתנתק..." },
    nav: { dashboard: "לוח בקרה", patients: "מטופלים", appointments: "תורים", services: "שירותים", staff: "צוות", billing: "חיוב", reports: "דוחות", settings: "הגדרות" },
    dashboard: { eyebrow: "סביבת העבודה של המרכז", title: "לוח בקרה", subtitle: "לוח הבקרה הפרטי של המרכז.", currentUser: "משתמש נוכחי", role: "תפקיד", centerStatus: "סטטוס המרכז", loading: "טוען את לוח הבקרה...", sessionExpired: "יש להתחבר מחדש." },
    cards: { patients: "מטופלים", appointments: "תורים", services: "שירותים", staff: "משתמשי צוות" },
    common: { cancel: "ביטול", close: "סגירה", save: "שמירה", saving: "שומר...", search: "חיפוש", view: "צפייה", edit: "עריכה", archive: "ארכוב", activate: "הפעלה", actions: "פעולות", notAvailable: "לא זמין" },
    patients: { title: "מטופלים", subtitle: "ניהול רשומות מטופלים של המרכז הזה בלבד.", addPatient: "הוספת מטופל", editPatient: "עריכת מטופל", detailsTitle: "פרטי מטופל", searchPlaceholder: "חיפוש לפי שם מטופל או טלפון", emptyTitle: "עדיין אין מטופלים", emptyBody: "צרו את רשומת המטופל הראשונה של המרכז.", noResultsTitle: "לא נמצאו מטופלים תואמים", noResultsBody: "נסו שם או מספר טלפון אחר.", loading: "טוען מטופלים...", fullName: "שם מלא", phone: "טלפון", email: "אימייל", gender: "מין", dateOfBirth: "תאריך לידה", nationalId: "מספר זהות", notes: "הערות", status: "סטטוס", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת מטופל", update: "עדכון מטופל", fieldRequired: "שדה זה חובה.", invalidPhone: "הזינו מספר טלפון תקין.", duplicatePhone: "כבר קיים מטופל עם מספר הטלפון הזה.", loadError: "לא ניתן לטעון מטופלים. נסו שוב.", saved: "המטופל נשמר.", archived: "המטופל הועבר לארכיון.", activated: "המטופל הופעל.", notFound: "המטופל לא נמצא." },
    services: { title: "שירותים", subtitle: "ניהול שירותי המרכז, משך השירות, מחירים וסטטוס פעילות.", addService: "הוספת שירות", editService: "עריכת שירות", detailsTitle: "פרטי שירות", searchPlaceholder: "חיפוש לפי שם שירות", filterAll: "הכול", filterActive: "פעילים", filterArchived: "בארכיון", emptyTitle: "עדיין אין שירותים", emptyBody: "צרו את השירות הראשון של המרכז.", noResultsTitle: "לא נמצאו שירותים תואמים", noResultsBody: "נסו שם שירות אחר.", loading: "טוען שירותים...", loadError: "לא ניתן לטעון שירותים. נסו שוב.", nameEn: "שם באנגלית", nameAr: "שם בערבית", nameHe: "שם בעברית", descriptionEn: "תיאור באנגלית", descriptionAr: "תיאור בערבית", descriptionHe: "תיאור בעברית", durationMinutes: "משך", price: "מחיר", currency: "מטבע", status: "סטטוס", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת שירות", update: "עדכון שירות", saved: "השירות נשמר.", archived: "השירות הועבר לארכיון.", activated: "השירות הופעל.", notFound: "השירות לא נמצא.", optional: "אופציונלי", fieldRequired: "שדה זה חובה.", invalidDuration: "הזינו משך תקין.", invalidPrice: "הזינו מחיר תקין.", invalidCurrency: "הזינו קוד מטבע תקין.", durationUnitMinutes: "דקות", durationUnitHours: "שעות" },
    staff: { title: "צוות", subtitle: "ניהול משתמשי צוות, תפקידים וסטטוס גישה.", addStaff: "הוספת איש צוות", editStaff: "עריכת איש צוות", detailsTitle: "פרטי איש צוות", searchPlaceholder: "חיפוש לפי שם או אימייל", filterAllRoles: "כל התפקידים", filterAllStatuses: "כל הסטטוסים", emptyTitle: "עדיין אין משתמשי צוות", emptyBody: "צרו את משתמש הצוות הראשון של המרכז.", noResultsTitle: "לא נמצא צוות תואם", noResultsBody: "נסו שם, אימייל, תפקיד או סטטוס אחר.", loading: "טוען צוות...", loadError: "לא ניתן לטעון צוות. נסו שוב.", fullName: "שם מלא", email: "אימייל", password: "סיסמה", passwordOptional: "אופציונלי בעריכה", role: "תפקיד", status: "סטטוס", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת איש צוות", update: "עדכון איש צוות", saved: "איש הצוות נשמר.", activated: "איש הצוות הופעל.", deactivated: "איש הצוות הושבת.", notFound: "איש הצוות לא נמצא.", fieldRequired: "שדה זה חובה.", invalidEmail: "הזינו אימייל צוות תקין.", duplicateEmail: "כבר קיים משתמש עם האימייל הזה.", invalidPassword: "הסיסמה חייבת לכלול לפחות 8 תווים." },
    billing: { title: "חיוב", subtitle: "ניהול חשבוניות ידניות ורשומות תשלום של המרכז.", addInvoice: "הוספת חשבונית", invoiceTitle: "פרטי חשבונית", searchPlaceholder: "חיפוש לפי שם מטופל או טלפון", filterAllStatuses: "כל הסטטוסים", emptyTitle: "אין עדיין חשבוניות", emptyBody: "צרו את החשבונית הראשונה של המרכז.", loading: "טוען חשבוניות...", loadError: "לא ניתן לטעון חשבוניות. נסו שוב.", patient: "מטופל", service: "שירות", provider: "מטפל", providerOptional: "אופציונלי", noProvider: "ללא מטפל", selectPatient: "בחרו מטופל", selectService: "בחרו שירות", amount: "סכום", currency: "מטבע", status: "סטטוס", notes: "הערות", notesOptional: "אופציונלי", createdAt: "נוצר", updatedAt: "עודכן", submit: "יצירת חשבונית", markedPaid: "החשבונית סומנה כשולמה.", cancelled: "החשבונית בוטלה.", notFound: "החשבונית לא נמצאה.", fieldRequired: "שדה זה חובה.", invalidAmount: "הזינו סכום תקין גדול מאפס.", markAsPaid: "סמן כשולם", cancelInvoice: "ביטול חשבונית", reopenInvoice: "פתיחה מחדש", reopened: "החשבונית נפתחה מחדש כממתינה.", addPayment: "הוספת תשלום", paymentHistory: "היסטוריית תשלומים", paymentMethod: "אמצעי תשלום", paymentDate: "תאריך תשלום", paymentNotes: "הערות", paymentNotesOptional: "אופציונלי", methodCash: "מזומן", methodBankTransfer: "העברה בנקאית", methodCheck: "המחאה", methodOther: "אחר", paymentAdded: "התשלום נרשם בהצלחה.", noPayments: "עדיין לא נרשמו תשלומים.", invoiceTotal: "סך החשבונית", paidAmount: "שולם", balanceDue: "יתרה לתשלום", paymentBy: "על ידי", overpaymentError: "התשלום יחרוג מסכום החשבונית.", invalidPaymentDate: "הזינו תאריך תשלום תקין." },
    appointments: { title: "תורים", subtitle: "תזמון, עדכון ומעקב אחר תורי המרכז.", addAppointment: "הוספת תור", editAppointment: "עריכת תור", detailsTitle: "פרטי תור", searchPlaceholder: "חיפוש לפי שם מטופל או טלפון", filterAll: "כל הסטטוסים", today: "היום", upcoming: "קרובים", dateFilter: "תאריך", providerFilter: "מטפל", allProviders: "כל המטפלים", emptyTitle: "אין עדיין תורים", emptyBody: "צרו את התור הראשון למרכז הזה.", noResultsTitle: "לא נמצאו תורים תואמים", noResultsBody: "נסו מטופל, סטטוס, תאריך או מטפל אחר.", loading: "טוען תורים...", loadError: "לא ניתן לטעון תורים. נסו שוב.", patient: "מטופל", service: "שירות", provider: "מטפל", appointmentDate: "תאריך התור", startTime: "שעת התחלה", endTime: "שעת סיום", durationMinutes: "משך", status: "סטטוס", notes: "הערות", internalNotes: "הערות פנימיות", cancellationReason: "סיבת ביטול", reminderSent: "נשלחה תזכורת", createdAt: "נוצר", updatedAt: "עודכן", createdBy: "נוצר על ידי", submit: "יצירת תור", update: "עדכון תור", saved: "התור נשמר.", cancelled: "התור בוטל.", statusUpdated: "סטטוס התור עודכן.", notFound: "התור לא נמצא.", fieldRequired: "שדה זה חובה.", invalidDate: "בחרו תאריך תור תקין.", invalidTime: "בחרו שעה תקינה.", invalidDuration: "הזינו משך תקין.", overlap: "התור הזה חופף לתור אחר.", cancelAppointment: "ביטול תור", confirmCancel: "אישור ביטול", changeStatus: "שינוי סטטוס", conflictTitle: "זוהתה התנגשות בתורים", conflictMessage: "נא לבחור שעה אחרת", conflictPatient: "מטופל", conflictService: "שירות", conflictProvider: "מטפל", conflictDate: "תאריך", conflictStart: "שעת התחלה", conflictEnd: "שעת סיום" },
    serviceStatuses: { ACTIVE: "פעיל", ARCHIVED: "בארכיון" },
    staffStatuses: { ACTIVE: "פעיל", INACTIVE: "לא פעיל" },
    billingStatuses: { PENDING: "ממתין", PARTIAL: "שולם חלקית", PAID: "שולם", CANCELLED: "בוטל" },
    appointmentStatuses: { SCHEDULED: "מתוזמן", CONFIRMED: "מאושר", IN_PROGRESS: "בטיפול", COMPLETED: "הושלם", CANCELLED: "בוטל", NO_SHOW: "לא הגיע" },
    placeholders: { appointments: { title: "תורים", description: "ניהול התורים זמין כעת." }, staff: { title: "צוות", description: "כלי הצוות יורחבו במודול עתידי." }, billing: { title: "חיוב", description: "מידע חיוב ידני יופיע כאן. אין תשלומים מקוונים." }, reports: { title: "דוחות", description: "דוחות תפעוליים יתווספו בהמשך." }, settings: { title: "הגדרות", description: "הגדרות המרכז יתווספו במודול עתידי." } },
    comingSoon: "בקרוב",
    patientStatuses: { ACTIVE: "פעיל", INACTIVE: "לא פעיל", ARCHIVED: "בארכיון" },
    patientGenders: { MALE: "זכר", FEMALE: "נקבה", OTHER: "אחר", UNKNOWN: "לא צוין" },
    roles: { CENTER_OWNER: "בעלי המרכז", CENTER_MANAGER: "מנהל המרכז", DOCTOR: "רופא", RECEPTIONIST: "קבלה", ACCOUNTANT: "הנהלת חשבונות", STAFF: "צוות" },
    statuses: { TRIAL: "ניסיון", ACTIVE: "פעיל", PAST_DUE: "באיחור בתשלום", SUSPENDED: "מושעה", CANCELLED: "מבוטל", ARCHIVED: "בארכיון" },
  },
};
