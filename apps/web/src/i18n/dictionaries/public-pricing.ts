import type { SupportedLocale } from "../locales";

type PublicPricingDictionary = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  plans: {
    popular: string;
    perYear: string;
    contactPricing: string;
    customPricing: string;
    getStarted: string;
    contactUs: string;
    featuresHeading: string;
    included: string;
    notIncluded: string;
    viewAllFeatures: string;
    showLessFeatures: string;
  };
  why: {
    title: string;
    benefits: Array<{ title: string; description: string }>;
  };
  finalCta: {
    title: string;
    subtitle: string;
    whatsapp: string;
    openCenter: string;
    whatsappMessage: string;
  };
  loading: string;
  loadError: string;
  noPlans: string;
  whatsapp: {
    greeting: string;
    wantOffer: string;
    wantContact: string;
    price: string;
    perYear: string;
    centerName: string;
    city: string;
    centerType: string;
    thanks: string;
    placeholder: string;
  };
};

const en: PublicPricingDictionary = {
  meta: {
    title: "Pricing - RoyalCare",
    description:
      "Simple, transparent annual pricing for laser centers, clinics, and wellness businesses on the RoyalCare platform.",
  },
  hero: {
    eyebrow: "Simple pricing",
    title: "Choose the right plan for your center",
    subtitle:
      "All plans include a full-featured website, online booking, patient management, and billing. No hidden fees.",
  },
  plans: {
    popular: "Most Popular",
    perYear: "/ year",
    contactPricing: "Contact Us",
    customPricing: "Custom Pricing",
    getStarted: "Get Started",
    contactUs: "Contact Us",
    featuresHeading: "What's included",
    included: "Included",
    notIncluded: "Not included",
    viewAllFeatures: "View all features",
    showLessFeatures: "Show fewer features",
  },
  why: {
    title: "Why RoyalCare?",
    benefits: [
      {
        title: "Professional Website",
        description: "Launch a polished clinic website with your services, branding, and contact paths.",
      },
      {
        title: "Online Booking 24/7",
        description: "Let patients request appointments from your public page at any time.",
      },
      {
        title: "Patients Management",
        description: "Keep patient records, contact details, notes, and care history organized.",
      },
      {
        title: "Appointments Management",
        description: "Manage bookings, providers, schedules, and daily clinic flow in one place.",
      },
      {
        title: "Multilingual AR/EN/HE",
        description: "Serve Arabic, English, and Hebrew audiences with a first-class experience.",
      },
      {
        title: "Reports & Analytics",
        description: "Understand bookings, revenue, services, and performance with clear reports.",
      },
    ],
  },
  finalCta: {
    title: "Ready to launch your center?",
    subtitle: "Talk to RoyalCare and choose the plan that fits your clinic, center, or wellness business.",
    whatsapp: "WhatsApp",
    openCenter: "Open Center",
    whatsappMessage: "Hello, I would like to launch my center with RoyalCare.",
  },
  loading: "Loading plans...",
  loadError: "Could not load pricing. Please try again.",
  noPlans: "No plans available.",
  whatsapp: {
    greeting: "Hi,",
    wantOffer: "I'm interested in the",
    wantContact: "I'd like to get more information about",
    price: "Price:",
    perYear: "per year",
    centerName: "Center name:",
    city: "City:",
    centerType: "Center type:",
    thanks: "Thank you.",
    placeholder: "....................",
  },
};

const ar: PublicPricingDictionary = {
  meta: {
    title: "الأسعار - RoyalCare",
    description:
      "أسعار سنوية واضحة وبسيطة لمراكز الليزر والعيادات ومراكز العافية على منصة RoyalCare.",
  },
  hero: {
    eyebrow: "أسعار واضحة",
    title: "اختر الباقة المناسبة لمركزك",
    subtitle:
      "تشمل جميع الباقات موقعا إلكترونيا متكاملا، وحجزا أونلاين، وإدارة مرضى، وفواتير. بدون رسوم مخفية.",
  },
  plans: {
    popular: "الأكثر شيوعا",
    perYear: "/ سنة",
    contactPricing: "تواصل معنا",
    customPricing: "تسعير مخصص",
    getStarted: "ابدأ الآن",
    contactUs: "تواصل معنا",
    featuresHeading: "ما يشمله الاشتراك",
    included: "مشمول",
    notIncluded: "غير مشمول",
    viewAllFeatures: "عرض جميع المميزات",
    showLessFeatures: "عرض أقل",
  },
  why: {
    title: "لماذا RoyalCare؟",
    benefits: [
      {
        title: "موقع احترافي",
        description: "أطلق موقعا أنيقا لمركزك يعرض الخدمات والهوية وطرق التواصل.",
      },
      {
        title: "حجز أونلاين 24/7",
        description: "اسمح للمرضى بطلب المواعيد من صفحة المركز في أي وقت.",
      },
      {
        title: "إدارة المرضى",
        description: "نظم بيانات المرضى والتواصل والملاحظات وسجل الرعاية.",
      },
      {
        title: "إدارة المواعيد",
        description: "أدر الحجوزات والمزودين والجداول وسير العمل اليومي من مكان واحد.",
      },
      {
        title: "متعدد اللغات AR/EN/HE",
        description: "اخدم جمهورك بالعربية والإنجليزية والعبرية بتجربة واضحة.",
      },
      {
        title: "تقارير وتحليلات",
        description: "افهم الحجوزات والإيرادات والخدمات والأداء من خلال تقارير واضحة.",
      },
    ],
  },
  finalCta: {
    title: "جاهز لإطلاق مركزك؟",
    subtitle: "تحدث مع RoyalCare واختر الباقة المناسبة لعيادتك أو مركزك.",
    whatsapp: "واتساب",
    openCenter: "افتح مركزك",
    whatsappMessage: "مرحبا، أرغب بإطلاق مركزي عبر RoyalCare.",
  },
  loading: "جاري تحميل الباقات...",
  loadError: "تعذر تحميل الأسعار. يرجى المحاولة مرة أخرى.",
  noPlans: "لا توجد باقات متاحة.",
  whatsapp: {
    greeting: "مرحبا،",
    wantOffer: "أرغب بالحصول على عرض للباقة",
    wantContact: "أرغب بالتواصل بخصوص باقة",
    price: "السعر:",
    perYear: "سنويا",
    centerName: "اسم المركز:",
    city: "المدينة:",
    centerType: "نوع المركز:",
    thanks: "شكرا.",
    placeholder: "....................",
  },
};

const he: PublicPricingDictionary = {
  meta: {
    title: "מחירים - RoyalCare",
    description:
      "תמחור שנתי פשוט ושקוף למרכזי לייזר, קליניקות ועסקי בריאות בפלטפורמת RoyalCare.",
  },
  hero: {
    eyebrow: "תמחור פשוט",
    title: "בחר את התוכנית הנכונה למרכז שלך",
    subtitle:
      "כל התוכניות כוללות אתר מלא, הזמנה אונליין, ניהול מטופלים וחיוב. ללא עמלות נסתרות.",
  },
  plans: {
    popular: "הכי פופולרי",
    perYear: "/ שנה",
    contactPricing: "צור קשר",
    customPricing: "תמחור מותאם",
    getStarted: "התחל עכשיו",
    contactUs: "צור קשר",
    featuresHeading: "מה כלול",
    included: "כלול",
    notIncluded: "לא כלול",
    viewAllFeatures: "הצג את כל התכונות",
    showLessFeatures: "הצג פחות",
  },
  why: {
    title: "למה RoyalCare?",
    benefits: [
      {
        title: "אתר מקצועי",
        description: "השיקו אתר מרפאה מלוטש עם שירותים, מיתוג ודרכי קשר.",
      },
      {
        title: "הזמנה אונליין 24/7",
        description: "אפשרו למטופלים לבקש תורים מדף המרכז בכל שעה.",
      },
      {
        title: "ניהול מטופלים",
        description: "רכזו פרטי מטופלים, קשר, הערות והיסטוריית טיפול.",
      },
      {
        title: "ניהול תורים",
        description: "נהלו הזמנות, מטפלים, לוחות זמנים וזרימת עבודה יומית במקום אחד.",
      },
      {
        title: "ריבוי שפות AR/EN/HE",
        description: "שרתו קהלים בערבית, אנגלית ועברית בחוויה ברורה.",
      },
      {
        title: "דוחות ואנליטיקה",
        description: "הבינו הזמנות, הכנסות, שירותים וביצועים דרך דוחות ברורים.",
      },
    ],
  },
  finalCta: {
    title: "מוכן להשיק את המרכז שלך?",
    subtitle: "דברו עם RoyalCare ובחרו את החבילה שמתאימה למרפאה או למרכז שלכם.",
    whatsapp: "WhatsApp",
    openCenter: "פתח מרכז",
    whatsappMessage: "שלום, אני רוצה להשיק את המרכז שלי עם RoyalCare.",
  },
  loading: "טוען תוכניות...",
  loadError: "לא ניתן לטעון תמחור. נסה שוב.",
  noPlans: "אין תוכניות זמינות.",
  whatsapp: {
    greeting: "שלום,",
    wantOffer: "אני מעוניין/ת בתוכנית",
    wantContact: "אני מעוניין/ת לקבל מידע על",
    price: "מחיר:",
    perYear: "לשנה",
    centerName: "שם המרכז:",
    city: "עיר:",
    centerType: "סוג מרכז:",
    thanks: "תודה.",
    placeholder: "....................",
  },
};

export const publicPricingDictionaries: Record<SupportedLocale, PublicPricingDictionary> = {
  en,
  ar,
  he,
};
