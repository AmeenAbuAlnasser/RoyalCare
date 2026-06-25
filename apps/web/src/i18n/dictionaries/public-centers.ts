import type { SupportedLocale } from "../locales";
import type { PublicCenterType } from "@/lib/api/public-centers";

type PublicCentersDictionary = {
  meta: {
    directoryTitle: string;
    directoryDescription: string;
  };
  directory: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: string;
    loadError: string;
    viewCenter: string;
    servicesLabel: string;
    noServices: string;
  };
  landing: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    primaryCta: string;
    secondaryCta: string;
    registerMessage: string;
    heroHighlights: string[];
    stats: {
      centers: string;
      patients: string;
      bookings: string;
      services: string;
    };
    pricingPreviewEyebrow: string;
    pricingPreviewTitle: string;
    pricingPreviewSubtitle: string;
    pricingPreviewFullDetails: string;
    pricingPreviewWhatsappCta: string;
    whyRoyalCareTitle: string;
    whyRoyalCareSubtitle: string;
    whyRoyalCareBenefits: Array<{ title: string; description: string }>;
    featuredCentersTitle: string;
    featuredCentersSubtitle: string;
    clearSearch: string;
    emptySearchTitle: string;
    emptySearchBody: string;
    ratingLabel: string;
    cityFallback: string;
    servicesCount: string;
    nextAvailable: string;
    nextAvailableValue: string;
    nextAvailableToday: string;
    nextAvailableSoon: string;
    bookCta: string;
    whyEyebrow: string;
    whyTitle: string;
    whySubtitle: string;
    ownerFeatures: Array<{ title: string; description: string }>;
    testimonialsEyebrow: string;
    testimonialsTitle: string;
    testimonials: Array<{ quote: string; name: string; city: string; rating: number }>;
    faqEyebrow: string;
    faqTitle: string;
    faq: Array<{ question: string; answer: string }>;
    footerTagline: string;
    footerWhatsApp: string;
    footerWhatsAppMessage: string;
    footerBrowse: string;
    copyright: string;
    exploreCta: string;
    heroStatPatientsLabel: string;
    heroStatCentersLabel: string;
    heroStatRatingLabel: string;
    heroStatBookingLabel: string;
    howItWorksEyebrow: string;
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    howItWorksSteps: Array<{ icon: string; title: string; description: string }>;
    trustedNumbersEyebrow: string;
    trustedNumbersTitle: string;
  };
  profile: {
    servicesTitle: string;
    servicesEmpty: string;
    contactWhatsApp: string;
    bookAppointment: string;
    comingSoon: string;
    requestConsultation: string;
    consultationMessage: (centerName: string) => string;
    aboutTitle: string;
    servicesCountLabel: string;
    networkBadge: string;
    bookingHint: string;
    backToDirectory: string;
    duration: (minutes: number) => string;
    price: (amount: string, currency: string) => string;
    notFound: string;
    notFoundBody: string;
    loadError: string;
    availableToday: string;
    shareButton: string;
    detailsTitle: string;
    cityLabel: string;
    addressLabel: string;
    whatsappLabel: string;
    reviewsTitle: string;
    faqTitle: string;
    faq: Array<{ question: string; answer: string }>;
    reviews: Array<{ name: string; city: string; rating: number; comment: string }>;
    stickyBookCta: string;
    bookServiceCta: string;
    galleryTitle: string;
    mapTitle: string;
    noLocation: string;
    callButton?: string;
    contactTitle?: string;
    workingHoursTitle?: string;
    noWorkingHours?: string;
    socialTitle?: string;
    mapLink?: string;
  };
  booking: {
    title: string;
    subtitle: string;
    backToProfile: string;
    selectServiceTitle: string;
    selectProviderTitle: string;
    anyProvider: string;
    selectDateTitle: string;
    selectTimeTitle: string;
    patientInfoTitle: string;
    patientNameLabel: string;
    patientNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    noSlotsForDate: string;
    errorSelectService: string;
    errorSelectDate: string;
    errorSelectTime: string;
    errorName: string;
    errorPhone: string;
    submitButton: string;
    successTitle: string;
    successSubtitle: string;
    successCenterLabel: string;
    successServiceLabel: string;
    successDateLabel: string;
    successTimeLabel: string;
    successWhatsApp: string;
    backToCenter: string;
    loadError: string;
    noServices: string;
    slotBooked: string;
    slotCenterClosed: string;
    slotOutsideWorkingHours: string;
    slotPastTime: string;
    slotPendingRequest: string;
    slotProviderOnLeave: string;
    slotProviderUnavailable: string;
    slotUnavailableError: string;
    whatsAppBookingMessage: (params: {
      centerName: string;
      service: string;
      date: string;
      time: string;
      name: string;
      phone: string;
      notes: string;
    }) => string;
  };
  centerTypes: Record<PublicCenterType, string>;
  nav: {
    language: string;
    topMessage: string;
    whatsapp: string;
    supportEmail: string;
    menu: string;
    closeMenu: string;
    home: string;
    pricing: string;
    centers: string;
    howItWorks: string;
    features: string;
    faq: string;
    contact: string;
    login: string;
    openCenter: string;
  };
  footer: {
    description: string;
    social: {
      facebook: string;
      instagram: string;
      whatsapp: string;
      youtube: string;
    };
    centersTitle: string;
    centersLinks: string[];
    ownersTitle: string;
    ownersLinks: string[];
    infoTitle: string;
    infoLinks: string[];
    newsletterTitle: string;
    newsletterPlaceholder: string;
    newsletterSubmit: string;
    copyright: string;
    rights: string;
    badges: string[];
  };
  marketing: {
    whyEyebrow: string;
    whyTitle: string;
    whySubtitle: string;
    features: Array<{ title: string; description: string }>;
    statsEyebrow: string;
    platformValues: Array<{ title: string; description: string }>;
    partnerEyebrow: string;
    partnerQuestion: string;
    partnerSubtitle: string;
    joinCta: string;
    demoCta: string;
    joinMessage: string;
    demoMessage: string;
  };
};

const en: PublicCentersDictionary = {
  meta: {
    directoryTitle: "RoyalCare — Find a Care Center",
    directoryDescription: "Browse active RoyalCare partner centers and find the right care for you.",
  },
  directory: {
    eyebrow: "RoyalCare Network",
    title: "Find a Care Center",
    subtitle: "Browse our network of active partner centers.",
    empty: "No centers are available right now.",
    loadError: "Could not load centers. Please try again.",
    viewCenter: "View Center",
    servicesLabel: "Services",
    noServices: "Services coming soon.",
  },
  landing: {
    heroEyebrow: "RoyalCare Marketplace",
    heroTitle: "Book the best care and beauty services with ease",
    heroSubtitle:
      "Discover trusted clinics and wellness centers, compare services, and request appointments from one modern platform.",
    searchPlaceholder: "Search center, service, or city",
    primaryCta: "Book now",
    secondaryCta: "Register your center",
    registerMessage:
      "Hello, I own a clinic or center and I want to join RoyalCare.",
    heroHighlights: [
      "Verified centers",
      "Fast booking requests",
      "Arabic, Hebrew, and English",
      "Patient-friendly experience",
    ],
    stats: {
      centers: "Centers",
      patients: "Patients",
      bookings: "Bookings",
      services: "Services",
    },
    pricingPreviewEyebrow: "Pricing",
    pricingPreviewTitle: "Pricing Plans",
    pricingPreviewSubtitle:
      "A quick look at RoyalCare packages. Visit the pricing page for the full feature comparison.",
    pricingPreviewFullDetails: "View Full Pricing",
    pricingPreviewWhatsappCta: "Request via WhatsApp",
    whyRoyalCareTitle: "Why RoyalCare",
    whyRoyalCareSubtitle:
      "Everything a modern clinic needs to launch online, manage work, and turn interest into real conversations.",
    whyRoyalCareBenefits: [
      {
        title: "Professional clinic website",
        description: "Launch a branded public website for your center without a custom build.",
      },
      {
        title: "Online booking 24/7",
        description: "Let patients request appointments any time from your public page.",
      },
      {
        title: "Patients and appointments management",
        description: "Keep patient records, bookings, services, and schedules organized.",
      },
      {
        title: "Multilingual AR/EN/HE",
        description: "Serve Arabic, English, and Hebrew audiences from one platform.",
      },
      {
        title: "Reports and analytics",
        description: "Track activity, bookings, revenue, and center performance clearly.",
      },
      {
        title: "WhatsApp sales/support flow",
        description: "Route pricing, sales, and support requests into fast WhatsApp conversations.",
      },
    ],
    featuredCentersTitle: "Featured centers",
    featuredCentersSubtitle:
      "Browse active RoyalCare partner centers and open the center page to request your next appointment.",
    clearSearch: "Clear search",
    emptySearchTitle: "No matching centers",
    emptySearchBody: "Try searching by another center name, service, or city.",
    ratingLabel: "Rating",
    cityFallback: "Local care center",
    servicesCount: "Services",
    nextAvailable: "Next available",
    nextAvailableValue: "Today",
    nextAvailableToday: "Available today",
    nextAvailableSoon: "Available soon",
    bookCta: "View and book",
    whyEyebrow: "For center owners",
    whyTitle: "A complete operating system for modern centers",
    whySubtitle:
      "RoyalCare gives clinics and wellness teams the tools to manage daily work, grow online, and keep patients informed.",
    ownerFeatures: [
      {
        title: "Patient management",
        description: "Organize records, history, credit, and follow-up data.",
      },
      {
        title: "Appointments",
        description: "Manage bookings, staff schedules, and availability.",
      },
      {
        title: "Invoices",
        description: "Create invoices, payments, credits, and billing history.",
      },
      {
        title: "Reminders",
        description: "Keep patients and teams updated with notifications.",
      },
      {
        title: "Patient portal",
        description: "Give patients a clear place to view their care details.",
      },
      {
        title: "Reports",
        description: "Track revenue, invoices, services, and top patients.",
      },
    ],
    testimonialsEyebrow: "What teams say",
    testimonialsTitle: "Built for centers that care about operations",
    testimonials: [
      { name: "Sara K.", city: "Ramallah", rating: 5, quote: "RoyalCare made booking and patient follow-up feel organized from the very first week." },
      { name: "Ahmad M.", city: "Nablus", rating: 5, quote: "Patients find services faster and our staff handles fewer manual calls." },
      { name: "Lena R.", city: "Haifa", rating: 5, quote: "The multilingual support helps our team serve every patient with real confidence." },
      { name: "Omar T.", city: "Jerusalem", rating: 5, quote: "Booking is now simple and fast. I found the right center in minutes." },
      { name: "Maya S.", city: "Tel Aviv", rating: 4, quote: "The portal is clean and I always know my appointment details at a glance." },
      { name: "Rania H.", city: "Jenin", rating: 5, quote: "The Arabic interface made everything accessible for our patients." },
    ],
    faqEyebrow: "FAQ",
    faqTitle: "How RoyalCare works",
    faq: [
      {
        question: "How does booking work?",
        answer:
          "Patients choose a center, service, date, and available time. The center receives the request and confirms it with the patient.",
      },
      {
        question: "How does center registration work?",
        answer:
          "Center owners contact RoyalCare, choose a package, and get a public page plus an admin system for daily operations.",
      },
    ],
    footerTagline: "Modern care, beauty, and wellness booking.",
    footerWhatsApp: "WhatsApp",
    footerWhatsAppMessage: "Hello, I would like to contact RoyalCare.",
    footerBrowse: "Browse centers",
    copyright: "© 2026 RoyalCare. All rights reserved.",
    exploreCta: "Explore Centers",
    heroStatPatientsLabel: "Visitors",
    heroStatCentersLabel: "Medical Centers",
    heroStatRatingLabel: "Rating",
    heroStatBookingLabel: "Booking",
    howItWorksEyebrow: "How it works",
    howItWorksTitle: "Book your appointment in 3 simple steps",
    howItWorksSubtitle: "A fast, clear experience designed for you.",
    howItWorksSteps: [
      { icon: "🩺", title: "Choose a service", description: "Browse and find the right care for your needs." },
      { icon: "🏥", title: "Choose a center", description: "Explore verified centers near you." },
      { icon: "📅", title: "Book your appointment", description: "Send your booking request in minutes." },
    ],
    trustedNumbersEyebrow: "By the numbers",
    trustedNumbersTitle: "Thousands trust RoyalCare",
  },
  profile: {
    servicesTitle: "Our Services",
    servicesEmpty: "No services available at this time.",
    contactWhatsApp: "Contact on WhatsApp",
    bookAppointment: "Book Appointment Now",
    comingSoon: "Coming Soon",
    requestConsultation: "Request Consultation",
    consultationMessage: (name) =>
      `Hello, I would like to request a consultation at ${name}`,
    aboutTitle: "About",
    servicesCountLabel: "Services",
    networkBadge: "Part of RoyalCare Network",
    bookingHint: "Book appointments in less than a minute",
    backToDirectory: "← All Centers",
    duration: (m) => `${m} min`,
    price: (amount, currency) => `${currency} ${amount}`,
    notFound: "Center Not Found",
    notFoundBody: "This center is not available or has been removed.",
    loadError: "Could not load center details. Please try again.",
    availableToday: "Available for booking today",
    shareButton: "Share",
    detailsTitle: "Center Details",
    cityLabel: "City",
    addressLabel: "Address",
    whatsappLabel: "WhatsApp",
    reviewsTitle: "Visitor Reviews",
    faqTitle: "Frequently Asked Questions",
    faq: [
      { question: "Do I need an appointment?", answer: "Yes. Send a booking request through our platform and the center will confirm your appointment via WhatsApp." },
      { question: "How is payment handled?", answer: "Payment is arranged directly with the center at the time of your appointment. RoyalCare does not process payments." },
      { question: "How do I cancel my appointment?", answer: "Contact the center directly via WhatsApp to reschedule or cancel your appointment." },
    ],
    reviews: [
      { name: "Sara K.", city: "Ramallah", rating: 5, comment: "Professional and warm service. I found exactly what I needed and the booking process was effortless." },
      { name: "Ahmad M.", city: "Nablus", rating: 5, comment: "Excellent experience from start to finish. Highly recommend this center." },
      { name: "Lena R.", city: "Haifa", rating: 4, comment: "Great center with helpful staff. Booking through RoyalCare was very convenient." },
    ],
    stickyBookCta: "Book Now",
    bookServiceCta: "Book",
    galleryTitle: "Center Gallery",
    mapTitle: "Location",
    noLocation: "Location not set",
    callButton: "Call",
    contactTitle: "Contact",
    workingHoursTitle: "Working Hours",
    noWorkingHours: "Working hours are not set yet.",
    socialTitle: "Social Links",
    mapLink: "Open map",
  },
  booking: {
    title: "Book an Appointment",
    subtitle: "Fill in the details below and we'll confirm your request via WhatsApp.",
    backToProfile: "← Back to Center",
    selectServiceTitle: "Select a Service",
    selectProviderTitle: "Choose Provider",
    anyProvider: "Any available provider",
    selectDateTitle: "Choose a Date",
    selectTimeTitle: "Available Time Slots",
    patientInfoTitle: "Your Information",
    patientNameLabel: "Full Name",
    patientNamePlaceholder: "Enter your full name",
    phoneLabel: "Phone Number",
    phonePlaceholder: "e.g. 0501234567",
    notesLabel: "Notes (Optional)",
    notesPlaceholder: "Any additional details or special requests",
    noSlotsForDate: "No available slots for the selected date.",
    errorSelectService: "Please select a service.",
    errorSelectDate: "Please select a date.",
    errorSelectTime: "Please select a time slot.",
    errorName: "Please enter your full name.",
    errorPhone: "Please enter a valid phone number.",
    submitButton: "Send Booking Request",
    successTitle: "Request Sent!",
    successSubtitle:
      "Your appointment request has been sent. We'll contact you shortly to confirm.",
    successCenterLabel: "Center",
    successServiceLabel: "Service",
    successDateLabel: "Date",
    successTimeLabel: "Time",
    successWhatsApp: "Follow Up on WhatsApp",
    backToCenter: "Back to Center",
    loadError: "Could not load center. Please try again.",
    noServices: "No services available at this center.",
    slotBooked: "Booked",
    slotCenterClosed: "Center closed",
    slotOutsideWorkingHours: "Unavailable",
    slotPastTime: "Past time",
    slotPendingRequest: "Pending request",
    slotProviderOnLeave: "Provider on leave",
    slotProviderUnavailable: "Provider unavailable",
    slotUnavailableError: "This time slot was just taken. Please choose another time.",
    whatsAppBookingMessage: ({ centerName, service, date, time, name, phone, notes }) =>
      `Hello, I'd like to book an appointment:\n\nCenter: ${centerName}\nService: ${service}\nDate: ${date}\nTime: ${time}\nName: ${name}\nPhone: ${phone}${notes ? `\nNotes: ${notes}` : ""}`,
  },
  centerTypes: {
    LASER: "Laser Center",
    PHYSIOTHERAPY: "Physiotherapy",
    HIJAMA: "Hijama Center",
    BEAUTY: "Beauty Clinic",
    WELLNESS: "Wellness Center",
    MULTI_SPECIALTY: "Multi-Specialty",
  },
  nav: {
    language: "Language",
    topMessage: "RoyalCare helps you manage your center and grow bookings",
    whatsapp: "WhatsApp",
    supportEmail: "support@royalcare.app",
    menu: "Menu",
    closeMenu: "Close menu",
    home: "Home",
    pricing: "Pricing",
    centers: "Centers",
    howItWorks: "How it works",
    features: "Features",
    faq: "FAQ",
    contact: "Contact",
    login: "Login",
    openCenter: "Open Your Center",
  },
  footer: {
    description:
      "An integrated platform for booking and managing care and beauty centers.",
    social: {
      facebook: "Facebook",
      instagram: "Instagram",
      whatsapp: "WhatsApp",
      youtube: "YouTube",
    },
    centersTitle: "Centers",
    centersLinks: ["Find a center", "Services", "Cities"],
    ownersTitle: "For doctors and centers",
    ownersLinks: ["Open your center", "Features", "Pricing"],
    infoTitle: "Information",
    infoLinks: ["Privacy policy", "Terms", "Support", "Contact us"],
    newsletterTitle: "Subscribe to the newsletter",
    newsletterPlaceholder: "Email address",
    newsletterSubmit: "Subscribe",
    copyright: "© RoyalCare 2026",
    rights: "All rights reserved",
    badges: ["PCI", "SSL", "Visa", "Mastercard"],
  },
  marketing: {
    whyEyebrow: "Powered by RoyalCare",
    whyTitle: "Everything your center needs",
    whySubtitle:
      "Smart tools to run, grow, and delight patients — all in one platform.",
    features: [
      {
        title: "Smart Appointments",
        description:
          "Manage bookings with automated reminders and conflict detection.",
      },
      {
        title: "Billing",
        description:
          "Digital invoices, payment tracking, and full billing history.",
      },
      {
        title: "Patient Management",
        description:
          "Complete patient records and health profiles in one place.",
      },
      {
        title: "Reports",
        description:
          "Live analytics on revenue, visits, and center performance.",
      },
      {
        title: "Public Profile",
        description: "A branded public page your patients can find and share.",
      },
      {
        title: "Notifications",
        description:
          "Instant alerts for appointments, payments, and activity.",
      },
    ],
    statsEyebrow: "Platform Features",
    platformValues: [
      {
        title: "Smart Appointment Management",
        description: "Automated bookings, reminders, and conflict detection.",
      },
      {
        title: "Live Reports",
        description: "Real-time analytics on revenue, visits, and performance.",
      },
      {
        title: "Multi-Language Support",
        description: "Full Arabic, Hebrew, and English interface.",
      },
      {
        title: "Public Center Pages",
        description: "Branded profiles visible to all your patients online.",
      },
    ],
    partnerEyebrow: "For Clinics & Centers",
    partnerQuestion: "Own a clinic or center?",
    partnerSubtitle:
      "Join the RoyalCare network and get everything you need to manage and grow your practice.",
    joinCta: "Start with your center today",
    demoCta: "Request Free Demo",
    joinMessage:
      "Hello, I own a clinic/center and I'm interested in joining the RoyalCare platform.",
    demoMessage:
      "Hello, I would like to request a demo of the RoyalCare platform for my clinic/center.",
  },
};

const ar: PublicCentersDictionary = {
  meta: {
    directoryTitle: "رويال كير — ابحث عن مركز رعاية",
    directoryDescription: "تصفح مراكز رويال كير الشريكة النشطة وابحث عن الرعاية المناسبة لك.",
  },
  directory: {
    eyebrow: "شبكة رويال كير",
    title: "ابحث عن مركز رعاية",
    subtitle: "تصفح شبكة مراكزنا الشريكة النشطة.",
    empty: "لا توجد مراكز متاحة حالياً.",
    loadError: "تعذر تحميل المراكز. يرجى المحاولة مرة أخرى.",
    viewCenter: "عرض المركز",
    servicesLabel: "الخدمات",
    noServices: "الخدمات قادمة قريباً.",
  },
  landing: {
    heroEyebrow: "سوق RoyalCare",
    heroTitle: "احجز أفضل خدمات الرعاية والجمال بسهولة",
    heroSubtitle:
      "اكتشف مراكز وعيادات موثوقة، قارن الخدمات، واطلب موعدك من منصة واحدة بتجربة واضحة وسريعة.",
    searchPlaceholder: "ابحث عن مركز / خدمة / مدينة",
    primaryCta: "احجز الآن",
    secondaryCta: "سجّل مركزك",
    registerMessage:
      "مرحباً، أمتلك عيادة أو مركزاً وأرغب بالانضمام إلى RoyalCare.",
    heroHighlights: [
      "مراكز موثوقة",
      "طلبات حجز سريعة",
      "عربي وعبري وإنجليزي",
      "تجربة مريحة للمرضى",
    ],
    stats: {
      centers: "عدد المراكز",
      patients: "عدد المرضى",
      bookings: "عدد الحجوزات",
      services: "عدد الخدمات",
    },
    pricingPreviewEyebrow: "الأسعار",
    pricingPreviewTitle: "الباقات والأسعار",
    pricingPreviewSubtitle:
      "نظرة سريعة على باقات RoyalCare. افتح صفحة الأسعار لعرض المقارنة الكاملة.",
    pricingPreviewFullDetails: "عرض جميع التفاصيل",
    pricingPreviewWhatsappCta: "اطلب عبر واتساب",
    whyRoyalCareTitle: "لماذا RoyalCare",
    whyRoyalCareSubtitle:
      "كل ما يحتاجه المركز الحديث للظهور أونلاين، وتنظيم العمل، وتحويل الاهتمام إلى تواصل فعلي.",
    whyRoyalCareBenefits: [
      {
        title: "موقع احترافي للمركز",
        description: "أطلق موقعاً عاماً بهوية مركزك بدون بناء مخصص من الصفر.",
      },
      {
        title: "حجز أونلاين 24/7",
        description: "اسمح للمرضى بطلب المواعيد في أي وقت من صفحة المركز.",
      },
      {
        title: "إدارة المرضى والمواعيد",
        description: "نظم سجلات المرضى والحجوزات والخدمات والجداول في مكان واحد.",
      },
      {
        title: "دعم عربي/إنجليزي/عبري",
        description: "اخدم جمهورك بثلاث لغات من منصة واحدة.",
      },
      {
        title: "تقارير وتحليلات",
        description: "تابع النشاط والحجوزات والإيرادات وأداء المركز بوضوح.",
      },
      {
        title: "تدفق واتساب للمبيعات والدعم",
        description: "حوّل طلبات الأسعار والمبيعات والدعم إلى محادثات واتساب سريعة.",
      },
    ],
    featuredCentersTitle: "مراكز مميزة",
    featuredCentersSubtitle:
      "تصفح مراكز RoyalCare النشطة وافتح صفحة المركز لطلب موعدك القادم.",
    clearSearch: "مسح البحث",
    emptySearchTitle: "لا توجد مراكز مطابقة",
    emptySearchBody: "جرّب البحث باسم مركز أو خدمة أو مدينة أخرى.",
    ratingLabel: "التقييم",
    cityFallback: "مركز رعاية محلي",
    servicesCount: "الخدمات",
    nextAvailable: "أقرب موعد",
    nextAvailableValue: "اليوم",
    nextAvailableToday: "أقرب موعد اليوم",
    nextAvailableSoon: "متاح قريبًا",
    bookCta: "عرض وحجز",
    whyEyebrow: "لأصحاب المراكز",
    whyTitle: "نظام تشغيل متكامل للمراكز الحديثة",
    whySubtitle:
      "RoyalCare يمنح العيادات ومراكز الرعاية أدوات لإدارة العمل اليومي، النمو أونلاين، وإبقاء المرضى على اطلاع.",
    ownerFeatures: [
      {
        title: "إدارة المرضى",
        description: "نظم الملفات، السجل، الرصيد، وبيانات المتابعة.",
      },
      {
        title: "المواعيد",
        description: "أدر الحجوزات، جداول الموظفين، والتوفر.",
      },
      {
        title: "الفواتير",
        description: "أنشئ الفواتير، الدفعات، الأرصدة، وسجل الفوترة.",
      },
      {
        title: "التذكيرات",
        description: "أبقِ المرضى والفريق على اطلاع عبر الإشعارات.",
      },
      {
        title: "بوابة المرضى",
        description: "امنح المرضى مكاناً واضحاً لمتابعة تفاصيل الرعاية.",
      },
      {
        title: "تقارير",
        description: "تابع الإيرادات، الفواتير، الخدمات، وأفضل المرضى.",
      },
    ],
    testimonialsEyebrow: "آراء تجريبية",
    testimonialsTitle: "مصمم للمراكز التي تهتم بالتشغيل",
    testimonials: [
      { name: "سارة خ.", city: "رام الله", rating: 5, quote: "جعل رويال كير الحجوزات ومتابعة المرضى منظمة من الأسبوع الأول تماماً." },
      { name: "أحمد م.", city: "نابلس", rating: 5, quote: "يجد الزوار الخدمات بسرعة والفريق يتعامل مع مكالمات يدوية أقل." },
      { name: "لينا ر.", city: "حيفا", rating: 5, quote: "الدعم متعدد اللغات يساعدنا على خدمة كل زائر بثقة أكبر." },
      { name: "عمر ت.", city: "القدس", rating: 5, quote: "الحجز الآن بسيط وسريع، وجدت المركز المناسب في دقائق." },
      { name: "مايا س.", city: "تل أبيب", rating: 4, quote: "البوابة واضحة وأعرف دائماً تفاصيل موعدي للوهلة الأولى." },
      { name: "رانيا ه.", city: "جنين", rating: 5, quote: "الواجهة العربية جعلت كل شيء في متناول زوارنا بسهولة تامة." },
    ],
    faqEyebrow: "الأسئلة الشائعة",
    faqTitle: "كيف يعمل RoyalCare؟",
    faq: [
      {
        question: "كيف يعمل الحجز؟",
        answer:
          "يختار المريض المركز والخدمة والتاريخ والوقت المتاح، ثم يستلم المركز الطلب ويؤكده مع المريض.",
      },
      {
        question: "كيف يتم تسجيل المركز؟",
        answer:
          "يتواصل مالك المركز مع RoyalCare، يختار الباقة المناسبة، ويحصل على صفحة عامة ونظام إدارة للتشغيل اليومي.",
      },
    ],
    footerTagline: "حجز حديث لخدمات الرعاية والجمال والعافية.",
    footerWhatsApp: "واتساب",
    footerWhatsAppMessage: "مرحباً، أود التواصل مع RoyalCare.",
    footerBrowse: "تصفح المراكز",
    copyright: "© 2026 RoyalCare. جميع الحقوق محفوظة.",
    exploreCta: "استكشف المراكز",
    heroStatPatientsLabel: "زائر",
    heroStatCentersLabel: "مركز طبي",
    heroStatRatingLabel: "تقييم",
    heroStatBookingLabel: "حجز",
    howItWorksEyebrow: "كيف يعمل",
    howItWorksTitle: "احجز موعدك في 3 خطوات بسيطة",
    howItWorksSubtitle: "تجربة سريعة وواضحة مصممة لراحتك.",
    howItWorksSteps: [
      { icon: "🩺", title: "اختر الخدمة", description: "ابحث عن الخدمة المناسبة لاحتياجاتك." },
      { icon: "🏥", title: "اختر المركز", description: "استكشف المراكز الموثوقة القريبة منك." },
      { icon: "📅", title: "احجز موعدك", description: "أرسل طلب الحجز بسهولة خلال دقائق." },
    ],
    trustedNumbersEyebrow: "بالأرقام",
    trustedNumbersTitle: "آلاف يثقون برويال كير",
  },
  profile: {
    servicesTitle: "خدماتنا",
    servicesEmpty: "لا توجد خدمات متاحة حالياً.",
    contactWhatsApp: "تواصل عبر واتساب",
    bookAppointment: "احجز موعداً الآن",
    comingSoon: "قريباً",
    requestConsultation: "طلب استشارة",
    consultationMessage: (name) =>
      `مرحباً، أود طلب استشارة في ${name}`,
    aboutTitle: "عن المركز",
    servicesCountLabel: "خدمة",
    networkBadge: "ضمن شبكة RoyalCare",
    bookingHint: "احجز موعد خلال أقل من دقيقة",
    backToDirectory: "→ جميع المراكز",
    duration: (m) => `${m} دقيقة`,
    price: (amount, currency) => `${amount} ${currency}`,
    notFound: "المركز غير موجود",
    notFoundBody: "هذا المركز غير متاح أو تم إزالته.",
    loadError: "تعذر تحميل تفاصيل المركز. يرجى المحاولة مرة أخرى.",
    availableToday: "متاح للحجز اليوم",
    shareButton: "مشاركة",
    detailsTitle: "تفاصيل المركز",
    cityLabel: "المدينة",
    addressLabel: "العنوان",
    whatsappLabel: "واتساب",
    reviewsTitle: "آراء الزوار",
    faqTitle: "الأسئلة الشائعة",
    faq: [
      { question: "هل أحتاج إلى موعد مسبق؟", answer: "نعم. أرسل طلب حجز عبر المنصة وسيؤكد المركز موعدك عبر واتساب." },
      { question: "كيف يتم الدفع؟", answer: "يتم الدفع مباشرة مع المركز عند الحضور. رويال كير لا تعالج المدفوعات." },
      { question: "كيف ألغي موعدي؟", answer: "تواصل مع المركز مباشرة عبر واتساب لإعادة الجدولة أو الإلغاء." },
    ],
    reviews: [
      { name: "سارة خ.", city: "رام الله", rating: 5, comment: "خدمة احترافية ودافئة. وجدت ما أحتاجه بالضبط وعملية الحجز كانت سلسة للغاية." },
      { name: "أحمد م.", city: "نابلس", rating: 5, comment: "تجربة ممتازة من البداية للنهاية. أنصح بهذا المركز بشدة." },
      { name: "لينا ر.", city: "حيفا", rating: 4, comment: "مركز رائع بطاقم متعاون. الحجز عبر رويال كير كان مريحاً جداً." },
    ],
    stickyBookCta: "احجز الآن",
    bookServiceCta: "احجز",
    galleryTitle: "صور المركز",
    mapTitle: "موقع المركز",
    noLocation: "لم يتم تحديد الموقع",
  },
  booking: {
    title: "احجز موعداً",
    subtitle: "أدخل التفاصيل أدناه وسنتواصل معك عبر واتساب للتأكيد.",
    backToProfile: "→ العودة إلى المركز",
    selectServiceTitle: "اختر خدمة",
    selectProviderTitle: "اختر مقدم الخدمة",
    anyProvider: "أي مقدم متاح",
    selectDateTitle: "اختر تاريخاً",
    selectTimeTitle: "الأوقات المتاحة",
    patientInfoTitle: "معلوماتك",
    patientNameLabel: "الاسم الكامل",
    patientNamePlaceholder: "أدخل اسمك الكامل",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "مثال: 0501234567",
    notesLabel: "ملاحظات (اختياري)",
    notesPlaceholder: "أي تفاصيل إضافية أو طلبات خاصة",
    noSlotsForDate: "لا توجد مواعيد متاحة في التاريخ المحدد.",
    errorSelectService: "يرجى اختيار خدمة.",
    errorSelectDate: "يرجى اختيار تاريخ.",
    errorSelectTime: "يرجى اختيار وقت.",
    errorName: "يرجى إدخال اسمك الكامل.",
    errorPhone: "يرجى إدخال رقم هاتف صحيح.",
    submitButton: "إرسال طلب الحجز",
    successTitle: "تم إرسال الطلب!",
    successSubtitle: "تم إرسال طلب موعدك. سنتواصل معك قريباً للتأكيد.",
    successCenterLabel: "المركز",
    successServiceLabel: "الخدمة",
    successDateLabel: "التاريخ",
    successTimeLabel: "الوقت",
    successWhatsApp: "تابع عبر واتساب",
    backToCenter: "العودة إلى المركز",
    loadError: "تعذر تحميل المركز. يرجى المحاولة مرة أخرى.",
    noServices: "لا توجد خدمات متاحة في هذا المركز.",
    slotBooked: "محجوز",
    slotCenterClosed: "المركز مغلق",
    slotOutsideWorkingHours: "خارج ساعات العمل",
    slotPastTime: "وقت سابق",
    slotPendingRequest: "طلب قيد الانتظار",
    slotProviderOnLeave: "المقدم في إجازة",
    slotProviderUnavailable: "المقدم غير متاح",
    slotUnavailableError: "هذا الوقت تم حجزه للتو. يرجى اختيار وقت آخر.",
    whatsAppBookingMessage: ({ centerName, service, date, time, name, phone, notes }) =>
      `مرحباً، أود حجز موعد:\n\nالمركز: ${centerName}\nالخدمة: ${service}\nالتاريخ: ${date}\nالوقت: ${time}\nالاسم: ${name}\nالهاتف: ${phone}${notes ? `\nملاحظات: ${notes}` : ""}`,
  },
  centerTypes: {
    LASER: "مركز ليزر",
    PHYSIOTHERAPY: "علاج طبيعي",
    HIJAMA: "مركز حجامة",
    BEAUTY: "عيادة تجميل",
    WELLNESS: "مركز صحة",
    MULTI_SPECIALTY: "تخصصات متعددة",
  },
  nav: {
    language: "اللغة",
    topMessage: "منصة RoyalCare تساعدك على إدارة مركزك وزيادة حجوزاتك",
    whatsapp: "واتساب",
    supportEmail: "support@royalcare.app",
    menu: "القائمة",
    closeMenu: "إغلاق القائمة",
    home: "الرئيسية",
    pricing: "الأسعار",
    centers: "المراكز",
    howItWorks: "كيف تعمل",
    features: "المميزات",
    faq: "الأسئلة الشائعة",
    contact: "تواصل معنا",
    login: "تسجيل الدخول",
    openCenter: "افتح مركزك",
  },
  footer: {
    description: "منصة متكاملة لحجز وإدارة مراكز العناية والجمال.",
    social: {
      facebook: "فيسبوك",
      instagram: "إنستغرام",
      whatsapp: "واتساب",
      youtube: "يوتيوب",
    },
    centersTitle: "المراكز",
    centersLinks: ["ابحث عن مركز", "الخدمات", "المدن"],
    ownersTitle: "للأطباء والمراكز",
    ownersLinks: ["افتح مركزك", "المميزات", "الأسعار"],
    infoTitle: "معلومات",
    infoLinks: ["سياسة الخصوصية", "الشروط", "الدعم", "تواصل معنا"],
    newsletterTitle: "اشترك بالنشرة البريدية",
    newsletterPlaceholder: "البريد الإلكتروني",
    newsletterSubmit: "اشتراك",
    copyright: "© RoyalCare 2026",
    rights: "جميع الحقوق محفوظة",
    badges: ["PCI", "SSL", "Visa", "Mastercard"],
  },
  marketing: {
    whyEyebrow: "مدعوم برويال كير",
    whyTitle: "كل ما يحتاجه مركزك",
    whySubtitle:
      "أدوات ذكية للتشغيل والنمو وإسعاد المرضى — في منصة واحدة.",
    features: [
      {
        title: "المواعيد الذكية",
        description:
          "أدر الحجوزات مع تنبيهات تلقائية وكشف التعارضات.",
      },
      {
        title: "الفوترة",
        description: "فواتير رقمية وتتبع المدفوعات وسجل فوترة كامل.",
      },
      {
        title: "إدارة المرضى",
        description: "سجلات المرضى الكاملة والملفات الصحية في مكان واحد.",
      },
      {
        title: "التقارير",
        description:
          "تحليلات مباشرة للإيرادات والزيارات وأداء المركز.",
      },
      {
        title: "الملف العام",
        description: "صفحة علامتك التجارية التي يجدها مرضاك ويشاركونها.",
      },
      {
        title: "الإشعارات",
        description: "تنبيهات فورية للمواعيد والمدفوعات والنشاط.",
      },
    ],
    statsEyebrow: "مزايا المنصة",
    platformValues: [
      {
        title: "إدارة المواعيد الذكية",
        description: "حجوزات آلية وتنبيهات وكشف التعارضات.",
      },
      {
        title: "تقارير مباشرة",
        description: "تحليلات لحظية للإيرادات والزيارات والأداء.",
      },
      {
        title: "دعم متعدد اللغات",
        description: "واجهة كاملة بالعربية والعبرية والإنجليزية.",
      },
      {
        title: "صفحات المراكز العامة",
        description: "ملفات تعريفية مخصصة مرئية لجميع مرضاك.",
      },
    ],
    partnerEyebrow: "للعيادات والمراكز",
    partnerQuestion: "هل تمتلك عيادة أو مركزاً؟",
    partnerSubtitle:
      "انضم إلى شبكة رويال كير واحصل على كل ما تحتاجه لإدارة ممارستك وتنميتها.",
    joinCta: "ابدأ مع مركزك اليوم",
    demoCta: "طلب عرض مجاني",
    joinMessage:
      "مرحباً، أمتلك عيادة/مركزاً وأنا مهتم بالانضمام إلى منصة رويال كير.",
    demoMessage:
      "مرحباً، أود طلب عرض تجريبي لمنصة رويال كير لعيادتي/مركزي.",
  },
};

const he: PublicCentersDictionary = {
  meta: {
    directoryTitle: "RoyalCare — מצא מרכז טיפולי",
    directoryDescription: "עיין במרכזי השותפים הפעילים של RoyalCare ומצא את הטיפול המתאים לך.",
  },
  directory: {
    eyebrow: "רשת RoyalCare",
    title: "מצא מרכז טיפולי",
    subtitle: "עיין ברשת מרכזי השותפים הפעילים שלנו.",
    empty: "אין מרכזים זמינים כרגע.",
    loadError: "לא ניתן לטעון את המרכזים. נסה שוב.",
    viewCenter: "צפה במרכז",
    servicesLabel: "שירותים",
    noServices: "שירותים בקרוב.",
  },
  landing: {
    heroEyebrow: "שוק RoyalCare",
    heroTitle: "קבעו בקלות את שירותי הטיפול והיופי הטובים ביותר",
    heroSubtitle:
      "גלו מרכזים וקליניקות אמינים, השוו שירותים ובקשו תור מפלטפורמה מודרנית אחת.",
    searchPlaceholder: "חיפוש מרכז / שירות / עיר",
    primaryCta: "קבעו עכשיו",
    secondaryCta: "רשמו את המרכז שלכם",
    registerMessage:
      "שלום, יש לי קליניקה או מרכז ואני רוצה להצטרף ל-RoyalCare.",
    heroHighlights: [
      "מרכזים מאומתים",
      "בקשות תור מהירות",
      "עברית, ערבית ואנגלית",
      "חוויה נוחה למטופלים",
    ],
    stats: {
      centers: "מספר מרכזים",
      patients: "מספר מטופלים",
      bookings: "מספר הזמנות",
      services: "מספר שירותים",
    },
    pricingPreviewEyebrow: "מחירים",
    pricingPreviewTitle: "חבילות ומחירים",
    pricingPreviewSubtitle:
      "מבט קצר על חבילות RoyalCare. עמוד המחירים מציג את ההשוואה המלאה.",
    pricingPreviewFullDetails: "הצג את כל המחירים",
    pricingPreviewWhatsappCta: "בקש בוואטסאפ",
    whyRoyalCareTitle: "למה RoyalCare",
    whyRoyalCareSubtitle:
      "כל מה שמרפאה מודרנית צריכה כדי להופיע אונליין, לנהל עבודה ולהפוך עניין לשיחות אמיתיות.",
    whyRoyalCareBenefits: [
      {
        title: "אתר מקצועי למרפאה",
        description: "השיקו אתר ציבורי ממותג למרכז שלכם בלי פיתוח מותאם מאפס.",
      },
      {
        title: "הזמנה אונליין 24/7",
        description: "אפשרו למטופלים לבקש תורים בכל שעה מדף המרכז.",
      },
      {
        title: "ניהול מטופלים ותורים",
        description: "רכזו רשומות מטופלים, הזמנות, שירותים ולוחות זמנים במקום אחד.",
      },
      {
        title: "ריבוי שפות AR/EN/HE",
        description: "שרתו קהלים בערבית, אנגלית ועברית מתוך מערכת אחת.",
      },
      {
        title: "דוחות ואנליטיקה",
        description: "עקבו בבירור אחר פעילות, הזמנות, הכנסות וביצועי המרכז.",
      },
      {
        title: "תהליך WhatsApp למכירות ותמיכה",
        description: "נתבו בקשות מחיר, מכירות ותמיכה לשיחות WhatsApp מהירות.",
      },
    ],
    featuredCentersTitle: "מרכזים מומלצים",
    featuredCentersSubtitle:
      "עיינו במרכזי RoyalCare הפעילים ופתחו את דף המרכז כדי לבקש את התור הבא שלכם.",
    clearSearch: "נקה חיפוש",
    emptySearchTitle: "לא נמצאו מרכזים מתאימים",
    emptySearchBody: "נסו לחפש שם מרכז, שירות או עיר אחרים.",
    ratingLabel: "דירוג",
    cityFallback: "מרכז טיפולי מקומי",
    servicesCount: "שירותים",
    nextAvailable: "הזמינות הקרובה",
    nextAvailableValue: "היום",
    nextAvailableToday: "זמין היום",
    nextAvailableSoon: "זמין בקרוב",
    bookCta: "צפייה וקביעה",
    whyEyebrow: "לבעלי מרכזים",
    whyTitle: "מערכת תפעול מלאה למרכזים מודרניים",
    whySubtitle:
      "RoyalCare מעניקה לקליניקות ולמרכזי טיפול כלים לניהול העבודה היומית, צמיחה אונליין ועדכון המטופלים.",
    ownerFeatures: [
      {
        title: "ניהול מטופלים",
        description: "ארגון תיקים, היסטוריה, יתרות ונתוני מעקב.",
      },
      {
        title: "תורים",
        description: "ניהול הזמנות, לוחות צוות וזמינות.",
      },
      {
        title: "חשבוניות",
        description: "יצירת חשבוניות, תשלומים, זיכויים והיסטוריית חיוב.",
      },
      {
        title: "תזכורות",
        description: "עדכונים למטופלים ולצוות באמצעות התראות.",
      },
      {
        title: "פורטל מטופלים",
        description: "מקום ברור למטופלים לצפות בפרטי הטיפול שלהם.",
      },
      {
        title: "דוחות",
        description: "מעקב אחר הכנסות, חשבוניות, שירותים ומטופלים מובילים.",
      },
    ],
    testimonialsEyebrow: "חוות דעת לדוגמה",
    testimonialsTitle: "נבנה למרכזים שמקפידים על תפעול",
    testimonials: [
      { name: "שרה כ.", city: "רמאללה", rating: 5, quote: "RoyalCare הפכה את התורים ומעקב המבקרים למסודרים מהשבוע הראשון ממש." },
      { name: "אחמד מ.", city: "שכם", rating: 5, quote: "מבקרים מוצאים שירותים מהר יותר ולצוות יש פחות שיחות ידניות." },
      { name: "לנה ר.", city: "חיפה", rating: 5, quote: "התמיכה הרב-לשונית עוזרת לנו לשרת כל מבקר בביטחון רב יותר." },
      { name: "עומר ט.", city: "ירושלים", rating: 5, quote: "הקביעה עכשיו פשוטה ומהירה, מצאתי את המרכז הנכון תוך דקות." },
      { name: "מאיה ס.", city: "תל אביב", rating: 4, quote: "הפורטל ברור ואני תמיד יודע את פרטי התור שלי במבט אחד." },
      { name: "רניה ח.", city: "ג׳נין", rating: 5, quote: "הממשק העברי הפך הכל נגיש למבקרים שלנו בקלות." },
    ],
    faqEyebrow: "שאלות נפוצות",
    faqTitle: "איך RoyalCare עובד?",
    faq: [
      {
        question: "איך עובד תהליך קביעת התור?",
        answer:
          "המטופל בוחר מרכז, שירות, תאריך ושעה זמינה. המרכז מקבל את הבקשה ומאשר אותה מול המטופל.",
      },
      {
        question: "איך רושמים מרכז?",
        answer:
          "בעל המרכז יוצר קשר עם RoyalCare, בוחר חבילה, ומקבל דף ציבורי ומערכת ניהול לתפעול יומי.",
      },
    ],
    footerTagline: "קביעת תורים מודרנית לטיפול, יופי ו-wellness.",
    footerWhatsApp: "ווטסאפ",
    footerWhatsAppMessage: "שלום, אני רוצה ליצור קשר עם RoyalCare.",
    footerBrowse: "עיון במרכזים",
    copyright: "© 2026 RoyalCare. כל הזכויות שמורות.",
    exploreCta: "גלו מרכזים",
    heroStatPatientsLabel: "מבקרים",
    heroStatCentersLabel: "מרכזים",
    heroStatRatingLabel: "דירוג",
    heroStatBookingLabel: "הזמנות",
    howItWorksEyebrow: "איך זה עובד",
    howItWorksTitle: "קבע תור ב-3 צעדים פשוטים",
    howItWorksSubtitle: "חוויה מהירה וברורה שנועדה עבורך.",
    howItWorksSteps: [
      { icon: "🩺", title: "בחר שירות", description: "חפש את השירות המתאים לצרכים שלך." },
      { icon: "🏥", title: "בחר מרכז", description: "גלה מרכזים מאומתים קרובים אליך." },
      { icon: "📅", title: "קבע תור", description: "שלח את בקשת התור שלך תוך דקות." },
    ],
    trustedNumbersEyebrow: "במספרים",
    trustedNumbersTitle: "אלפים סומכים על RoyalCare",
  },
  profile: {
    servicesTitle: "השירותים שלנו",
    servicesEmpty: "אין שירותים זמינים כרגע.",
    contactWhatsApp: "צור קשר בווטסאפ",
    bookAppointment: "קבע תור עכשיו",
    comingSoon: "בקרוב",
    requestConsultation: "בקש ייעוץ",
    consultationMessage: (name) =>
      `שלום, אני מעוניין לבקש ייעוץ ב-${name}`,
    aboutTitle: "אודות",
    servicesCountLabel: "שירותים",
    networkBadge: "חלק מרשת RoyalCare",
    bookingHint: "קבע תור בפחות מדקה",
    backToDirectory: "→ כל המרכזים",
    duration: (m) => `${m} דק'`,
    price: (amount, currency) => `${currency} ${amount}`,
    notFound: "המרכז לא נמצא",
    notFoundBody: "מרכז זה אינו זמין או הוסר.",
    loadError: "לא ניתן לטעון פרטי המרכז. נסה שוב.",
    availableToday: "זמין להזמנה היום",
    shareButton: "שתף",
    detailsTitle: "פרטי המרכז",
    cityLabel: "עיר",
    addressLabel: "כתובת",
    whatsappLabel: "ווטסאפ",
    reviewsTitle: "ביקורות מבקרים",
    faqTitle: "שאלות נפוצות",
    faq: [
      { question: "האם אני צריך תור מראש?", answer: "כן. שלח בקשת תור דרך הפלטפורמה והמרכז יאשר את התור שלך בווטסאפ." },
      { question: "איך מתבצע התשלום?", answer: "התשלום נעשה ישירות עם המרכז בעת ביקורך. RoyalCare אינה מעבדת תשלומים." },
      { question: "איך מבטלים תור?", answer: "צור קשר עם המרכז ישירות דרך ווטסאפ כדי לדחות או לבטל את התור." },
    ],
    reviews: [
      { name: "שרה כ.", city: "רמאללה", rating: 5, comment: "שירות מקצועי וחם. מצאתי בדיוק מה שחיפשתי ותהליך הקביעה היה פשוט מאוד." },
      { name: "אחמד מ.", city: "שכם", rating: 5, comment: "חוויה מצוינת מתחילה ועד סוף. ממליץ בחום על המרכז הזה." },
      { name: "לנה ר.", city: "חיפה", rating: 4, comment: "מרכז נהדר עם צוות מסייע. הקביעה דרך RoyalCare הייתה נוחה מאוד." },
    ],
    stickyBookCta: "קבע תור",
    bookServiceCta: "קבע",
    galleryTitle: "גלריית המרכז",
    mapTitle: "מיקום",
    noLocation: "מיקום לא הוגדר",
  },
  booking: {
    title: "קבע תור",
    subtitle: "מלא את הפרטים למטה ונאשר את הבקשה שלך בווטסאפ.",
    backToProfile: "← חזרה למרכז",
    selectServiceTitle: "בחר שירות",
    selectProviderTitle: "בחר מטפל",
    anyProvider: "כל מטפל זמין",
    selectDateTitle: "בחר תאריך",
    selectTimeTitle: "שעות פנויות",
    patientInfoTitle: "הפרטים שלך",
    patientNameLabel: "שם מלא",
    patientNamePlaceholder: "הכנס את שמך המלא",
    phoneLabel: "מספר טלפון",
    phonePlaceholder: "לדוגמה: 0501234567",
    notesLabel: "הערות (אופציונלי)",
    notesPlaceholder: "פרטים נוספים או בקשות מיוחדות",
    noSlotsForDate: "אין שעות פנויות בתאריך הנבחר.",
    errorSelectService: "אנא בחר שירות.",
    errorSelectDate: "אנא בחר תאריך.",
    errorSelectTime: "אנא בחר שעה.",
    errorName: "אנא הכנס את שמך המלא.",
    errorPhone: "אנא הכנס מספר טלפון תקין.",
    submitButton: "שלח בקשת תור",
    successTitle: "הבקשה נשלחה!",
    successSubtitle: "בקשת התור שלך נשלחה. ניצור איתך קשר בקרוב לאישור.",
    successCenterLabel: "מרכז",
    successServiceLabel: "שירות",
    successDateLabel: "תאריך",
    successTimeLabel: "שעה",
    successWhatsApp: "עקוב בווטסאפ",
    backToCenter: "חזרה למרכז",
    loadError: "לא ניתן לטעון את המרכז. נסה שוב.",
    noServices: "אין שירותים זמינים במרכז זה.",
    slotBooked: "תפוס",
    slotCenterClosed: "המרכז סגור",
    slotOutsideWorkingHours: "מחוץ לשעות הפעילות",
    slotPastTime: "שעה שעברה",
    slotPendingRequest: "בקשה ממתינה",
    slotProviderOnLeave: "המטפל בחופשה",
    slotProviderUnavailable: "המטפל אינו זמין",
    slotUnavailableError: "השעה הזו נתפסה זה עתה. אנא בחר שעה אחרת.",
    whatsAppBookingMessage: ({ centerName, service, date, time, name, phone, notes }) =>
      `שלום, אני מעוניין לקבוע תור:\n\nמרכז: ${centerName}\nשירות: ${service}\nתאריך: ${date}\nשעה: ${time}\nשם: ${name}\nטלפון: ${phone}${notes ? `\nהערות: ${notes}` : ""}`,
  },
  centerTypes: {
    LASER: "מרכז לייזר",
    PHYSIOTHERAPY: "פיזיותרפיה",
    HIJAMA: "מרכז חיג'אמה",
    BEAUTY: "מרכז יופי",
    WELLNESS: "מרכז בריאות",
    MULTI_SPECIALTY: "רב-תחומי",
  },
  nav: {
    language: "שפה",
    topMessage: "RoyalCare עוזרת לכם לנהל את המרכז ולהגדיל הזמנות",
    whatsapp: "ווטסאפ",
    supportEmail: "support@royalcare.app",
    menu: "תפריט",
    closeMenu: "סגור תפריט",
    home: "בית",
    pricing: "מחירים",
    centers: "מרכזים",
    howItWorks: "איך זה עובד",
    features: "תכונות",
    faq: "שאלות נפוצות",
    contact: "צור קשר",
    login: "כניסה",
    openCenter: "פתחו את המרכז",
  },
  footer: {
    description: "פלטפורמה מלאה להזמנה וניהול של מרכזי טיפוח ויופי.",
    social: {
      facebook: "פייסבוק",
      instagram: "אינסטגרם",
      whatsapp: "ווטסאפ",
      youtube: "יוטיוב",
    },
    centersTitle: "מרכזים",
    centersLinks: ["חיפוש מרכז", "שירותים", "ערים"],
    ownersTitle: "לרופאים ומרכזים",
    ownersLinks: ["פתחו את המרכז", "תכונות", "מחירים"],
    infoTitle: "מידע",
    infoLinks: ["מדיניות פרטיות", "תנאים", "תמיכה", "צור קשר"],
    newsletterTitle: "הירשמו לניוזלטר",
    newsletterPlaceholder: "כתובת אימייל",
    newsletterSubmit: "הרשמה",
    copyright: "© RoyalCare 2026",
    rights: "כל הזכויות שמורות",
    badges: ["PCI", "SSL", "Visa", "Mastercard"],
  },
  marketing: {
    whyEyebrow: "מופעל על ידי RoyalCare",
    whyTitle: "כל מה שהמרכז שלך צריך",
    whySubtitle:
      "כלים חכמים לניהול, צמיחה ושביעות רצון המטופלים — בפלטפורמה אחת.",
    features: [
      {
        title: "תורים חכמים",
        description:
          "נהל הזמנות עם תזכורות אוטומטיות וזיהוי התנגשויות.",
      },
      {
        title: "חיוב",
        description:
          "חשבוניות דיגיטליות, מעקב תשלומים והיסטוריית חיוב מלאה.",
      },
      {
        title: "ניהול מטופלים",
        description: "תיקי מטופלים מלאים וספרי היסטוריה רפואית במקום אחד.",
      },
      {
        title: "דוחות",
        description:
          "אנליטיקה חיה על הכנסות, ביקורים וביצועי המרכז.",
      },
      {
        title: "פרופיל ציבורי",
        description: "דף מותג שהמטופלים שלך יכולים למצוא ולשתף.",
      },
      {
        title: "התראות",
        description: "התראות מיידיות לתורים, תשלומים ופעילות.",
      },
    ],
    statsEyebrow: "יתרונות הפלטפורמה",
    platformValues: [
      {
        title: "ניהול תורים חכם",
        description: "הזמנות אוטומטיות, תזכורות וזיהוי התנגשויות.",
      },
      {
        title: "דוחות חיים",
        description: "אנליטיקה בזמן אמת על הכנסות, ביקורים וביצועים.",
      },
      {
        title: "תמיכה רב-לשונית",
        description: "ממשק מלא בערבית, עברית ואנגלית.",
      },
      {
        title: "דפי מרכז ציבוריים",
        description: "פרופילים ממותגים הנראים לכל המטופלים שלך.",
      },
    ],
    partnerEyebrow: "לקליניקות ומרכזים",
    partnerQuestion: "יש לך קליניקה או מרכז?",
    partnerSubtitle:
      "הצטרף לרשת RoyalCare וקבל את כל מה שצריך לנהל ולהגדיל את הפרקטיקה שלך.",
    joinCta: "התחל עם המרכז שלך היום",
    demoCta: "בקש הדגמה חינמית",
    joinMessage:
      "שלום, יש לי קליניקה/מרכז ואני מעוניין להצטרף לפלטפורמת RoyalCare.",
    demoMessage:
      "שלום, אני מעוניין לבקש הדגמה של פלטפורמת RoyalCare עבור הקליניקה/מרכז שלי.",
  },
};

export const publicCentersDictionaries: Record<SupportedLocale, PublicCentersDictionary> = {
  en,
  ar,
  he,
};
