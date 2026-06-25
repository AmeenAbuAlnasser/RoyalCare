"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { TenantMarketingInjector } from "@/components/marketing/TenantMarketingInjector";
import { AdminState } from "@/components/ui/admin-surfaces";
import { BeforeAfterPair } from "@/components/ui/before-after-pair";
import { useLanguage } from "@/i18n/LanguageProvider";
import { publicCentersDictionaries } from "@/i18n/dictionaries/public-centers";
import type { SupportedLocale } from "@/i18n/locales";
import {
  getPublicCenter,
  getPublicCenterBeforeAfter,
  getPublicCenterGallery,
  getPublicCenterReviews,
  getPublicCenterTeam,
  getPublicCenterOffers,
  type PublicCenterDetail,
  type PublicCenterBeforeAfter,
  type PublicBeforeAfterCategory,
  type PublicGalleryImage,
  type PublicCenterReview,
  type PublicServiceFull,
  type PublicTeamMember,
  type PublicOffer,
  type PublicCenterBranch,
} from "@/lib/api/public-centers";
import { trackMarketingEvent } from "@/lib/marketing/track-event";
import { trackCenterEvent } from "@/lib/marketing/track-center-event";
import type { CenterEventType } from "@/lib/marketing/track-center-event";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";
import { FAVICON_EVENT, type FaviconUpdateDetail } from "@/components/brand/GlobalFavicon";
import { SmartContactWidget } from "@/components/center/SmartContactWidget";

type Dictionary = (typeof publicCentersDictionaries)["en"];
type CenterWebsitePageKind = "about" | "before-after" | "contact" | "gallery" | "home" | "offers" | "reviews" | "services" | "team";
type WebsiteSectionKey =
  | "hero"
  | "about"
  | "services"
  | "reviews"
  | "beforeAfter"
  | "team"
  | "offers"
  | "gallery"
  | "contact"
  | "workingHours"
  | "socialLinks";

const defaultWebsiteSectionOrder: WebsiteSectionKey[] = [
  "hero",
  "about",
  "services",
  "gallery",
  "beforeAfter",
  "reviews",
  "team",
  "offers",
  "workingHours",
  "contact",
  "socialLinks",
];

const defaultWebsiteSectionVisibility: Record<WebsiteSectionKey, boolean> = {
  about: true,
  beforeAfter: true,
  contact: true,
  gallery: true,
  hero: true,
  offers: true,
  reviews: true,
  services: true,
  socialLinks: true,
  team: true,
  workingHours: true,
};

const fallbackLabels = {
  en: {
    aboutNav: "About",
    bookNow: "Book Now",
    branchMain: "Main branch",
    branchesTitle: "Branches & Contact",
    callButton: "Call",
    contactTitle: "Contact",
    homeNav: "Home",
    mapLink: "Open map",
    menu: "Menu",
    noWorkingHours: "Working hours are not set yet.",
    servicesNav: "Services",
    socialTitle: "Social Links",
    workingHoursTitle: "Working Hours",
  },
  ar: {
    callButton: "اتصال",
    contactTitle: "التواصل",
    mapLink: "فتح الخريطة",
    noWorkingHours: "لم يتم تحديد ساعات العمل بعد.",
    socialTitle: "روابط التواصل",
    workingHoursTitle: "ساعات العمل",
  },
  he: {
    callButton: "התקשר",
    contactTitle: "יצירת קשר",
    mapLink: "פתח מפה",
    noWorkingHours: "שעות הפעילות עדיין לא הוגדרו.",
    socialTitle: "קישורים חברתיים",
    workingHoursTitle: "שעות פעילות",
  },
} as const;

const centerNavLabels = {
  en: {
    about: "About",
    bookNow: "Book Now",
    contact: "Contact",
    home: "Home",
    menu: "Menu",
    services: "Services",
  },
  ar: {
    about: "عن المركز",
    bookNow: "احجز الآن",
    contact: "التواصل",
    home: "الرئيسية",
    menu: "القائمة",
    services: "الخدمات",
  },
  he: {
    about: "אודות",
    bookNow: "קבע תור",
    contact: "יצירת קשר",
    home: "בית",
    menu: "תפריט",
    services: "שירותים",
  },
} as const;

void fallbackLabels;
void centerNavLabels;

const centerWebsiteLabels = {
  en: {
    about: "About",
    aboutIntro: "Learn more about the center, its approach, and the information visitors need before booking.",
    bookNow: "Book Now",
    branchMain: "Main branch",
    branchesTitle: "Branches & Contact",
    callButton: "Call",
    centerInfo: "Center Info",
    contact: "Contact",
    contactIntro: "Reach the center directly or send a booking request online.",
    contactTitle: "Contact",
    email: "Email",
    fullDescriptionEmpty: "Full center description is not available yet.",
    home: "Home",
    mapLink: "Open map",
    menu: "Menu",
    noContact: "Contact details are not available yet.",
    noWorkingHours: "Working hours are not set yet.",
    officialBadge: "Official center website",
    services: "Services",
    servicesIntro: "Browse the active public services available at this center.",
    socialTitle: "Social Links",
    whatsapp: "WhatsApp",
    copyright: "All rights reserved.",
    more: "More",
    quickLinks: "Quick Links",
    workingHoursTitle: "Working Hours",
  },
  ar: {
    about: "عن المركز",
    aboutIntro: "تعرّف على المركز وخدماته والمعلومات التي يحتاجها الزائر قبل الحجز.",
    bookNow: "احجز الآن",
    branchMain: "الفرع الرئيسي",
    branchesTitle: "الفروع والتواصل",
    callButton: "اتصال",
    centerInfo: "معلومات المركز",
    contact: "التواصل",
    contactIntro: "تواصل مع المركز مباشرة أو أرسل طلب حجز عبر الموقع.",
    contactTitle: "التواصل",
    email: "البريد الإلكتروني",
    fullDescriptionEmpty: "الوصف الكامل للمركز غير متوفر بعد.",
    home: "الرئيسية",
    mapLink: "فتح الخريطة",
    menu: "القائمة",
    noContact: "معلومات التواصل غير متوفرة بعد.",
    noWorkingHours: "لم يتم تحديد ساعات العمل بعد.",
    officialBadge: "الموقع الرسمي للمركز",
    services: "الخدمات",
    servicesIntro: "تصفح الخدمات العامة النشطة المتاحة في هذا المركز.",
    copyright: "جميع الحقوق محفوظة.",
    more: "المزيد",
    quickLinks: "روابط سريعة",
    socialTitle: "روابط التواصل",
    whatsapp: "واتساب",
    workingHoursTitle: "ساعات العمل",
  },
  he: {
    about: "אודות",
    aboutIntro: "הכירו את המרכז, השירותים והמידע החשוב לפני קביעת תור.",
    bookNow: "קבע תור",
    branchMain: "סניף ראשי",
    branchesTitle: "סניפים ויצירת קשר",
    callButton: "התקשר",
    centerInfo: "מידע על המרכז",
    contact: "יצירת קשר",
    contactIntro: "צרו קשר עם המרכז ישירות או שלחו בקשת תור דרך האתר.",
    contactTitle: "יצירת קשר",
    email: "אימייל",
    fullDescriptionEmpty: "תיאור מלא של המרכז עדיין לא זמין.",
    home: "בית",
    mapLink: "פתח מפה",
    menu: "תפריט",
    noContact: "פרטי קשר עדיין לא זמינים.",
    noWorkingHours: "שעות הפעילות עדיין לא הוגדרו.",
    officialBadge: "האתר הרשמי של המרכז",
    services: "שירותים",
    servicesIntro: "עיינו בכל השירותים הציבוריים הפעילים של המרכז.",
    copyright: "כל הזכויות שמורות.",
    more: "עוד",
    quickLinks: "קישורים מהירים",
    socialTitle: "קישורים חברתיים",
    whatsapp: "וואטסאפ",
    workingHoursTitle: "שעות פעילות",
  },
} as const;

type CenterWebsiteLabels = (typeof centerWebsiteLabels)[keyof typeof centerWebsiteLabels];

const WA_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const beforeAfterLabels = {
  en: {
    all: "All",
    after: "After",
    before: "Before",
    beforeAfter: "Before / After",
    bookCta: "Book your consultation",
    categories: {
      DENTAL: "Dental",
      HAIR: "Hair",
      LASER: "Laser",
      OTHER: "Other",
      SKIN: "Skin",
    },
    intro: "Explore real transformation cases shared by the center.",
    title: "Real Results",
  },
  ar: {
    all: "الكل",
    after: "بعد",
    before: "قبل",
    beforeAfter: "قبل وبعد",
    bookCta: "احجز استشارتك",
    categories: {
      DENTAL: "أسنان",
      HAIR: "شعر",
      LASER: "ليزر",
      OTHER: "أخرى",
      SKIN: "بشرة",
    },
    intro: "شاهد حالات نتائج حقيقية يعرضها المركز.",
    title: "نتائج حقيقية",
  },
  he: {
    all: "הכל",
    after: "אחרי",
    before: "לפני",
    beforeAfter: "לפני / אחרי",
    bookCta: "קבעו ייעוץ",
    categories: {
      DENTAL: "שיניים",
      HAIR: "שיער",
      LASER: "לייזר",
      OTHER: "אחר",
      SKIN: "עור",
    },
    intro: "צפו במקרי תוצאה אמיתיים שהמרכז מציג.",
    title: "תוצאות אמיתיות",
  },
} as const;

const teamLabels = {
  en: {
    bookCta: "Book your consultation",
    intro: "Meet the professionals dedicated to your care.",
    team: "Our Team",
    years: (n: number) => `${n} year${n === 1 ? "" : "s"} experience`,
  },
  ar: {
    bookCta: "احجز استشارتك",
    intro: "تعرّف على المختصين المكرسين لرعايتك.",
    team: "فريقنا",
    years: (n: number) => `${n} سنة خبرة`,
  },
  he: {
    bookCta: "קבעו ייעוץ",
    intro: "הכירו את המקצוענים שמחויבים לטפל בכם.",
    team: "הצוות שלנו",
    years: (n: number) => `${n} שנ${n === 1 ? "ה" : "ות"} ניסיון`,
  },
} as const;

const offersLabels = {
  en: {
    bookCta: "Book this offer",
    endsAt: "Offer ends",
    intro: "Exclusive deals and packages available at this center.",
    offers: "Offers & Packages",
    validUntil: "Valid until",
    whatsappCta: "Ask via WhatsApp",
  },
  ar: {
    bookCta: "احجز هذا العرض",
    endsAt: "العرض ينتهي",
    intro: "صفقات وباقات حصرية متاحة في هذا المركز.",
    offers: "العروض والباقات",
    validUntil: "صالح حتى",
    whatsappCta: "استفسر عبر واتساب",
  },
  he: {
    bookCta: "הזמינו מבצע זה",
    endsAt: "המבצע מסתיים",
    intro: "עסקאות וחבילות בלעדיות הזמינות במרכז זה.",
    offers: "מבצעים וחבילות",
    validUntil: "בתוקף עד",
    whatsappCta: "שאלו דרך WhatsApp",
  },
} as const;

const PHONE_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
  </svg>
);

const EMAIL_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <rect height="16" rx="2" ry="2" width="20" x="2" y="4" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
);

const LOCATION_ICON = (
  <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const FB_ICON = (
  <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.03 4.388 11.03 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.103 24 18.103 24 12.073z" />
  </svg>
);

const IG_ICON = (
  <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TT_ICON = (
  <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.77a4.85 4.85 0 01-1-.08z" />
  </svg>
);

function resolveLocalizedName(
  center: Pick<PublicCenterDetail, "name" | "nameAr" | "nameEn" | "nameHe">,
  _locale: SupportedLocale,
): string {
  return center.name || center.nameEn || center.nameAr || center.nameHe || "";
}

function resolveServiceFields(
  service: PublicServiceFull,
  locale: SupportedLocale,
): { description: string | null; name: string } {
  if (locale === "ar") {
    return {
      description: service.descriptionAr || service.descriptionEn || null,
      name: service.nameEn || service.nameAr || service.nameHe,
    };
  }
  if (locale === "he") {
    return {
      description: service.descriptionHe || service.descriptionEn || null,
      name: service.nameEn || service.nameAr || service.nameHe,
    };
  }
  return {
    description: service.descriptionEn || service.descriptionAr || service.descriptionHe || null,
    name: service.nameEn || service.nameAr || service.nameHe,
  };
}

function localizedBrandingValue(
  branding: PublicCenterDetail["branding"],
  locale: SupportedLocale,
  key: "address" | "fullDescription" | "publicDescription" | "slogan" | "workingHours",
) {
  if (!branding) return "";
  const suffix = locale === "ar" ? "Ar" : locale === "he" ? "He" : "En";
  const fallback = locale === "en" ? "Ar" : "En";
  return (
    branding[`${key}${suffix}` as keyof typeof branding] ||
    branding[`${key}${fallback}` as keyof typeof branding] ||
    branding[`${key}Ar` as keyof typeof branding] ||
    ""
  ) as string;
}

function localizedBranchValue(
  branch: PublicCenterBranch,
  locale: SupportedLocale,
  key: "address" | "city" | "workingHoursText",
) {
  const suffix = locale === "ar" ? "Ar" : locale === "he" ? "He" : "En";
  const fallback = locale === "en" ? "Ar" : "En";
  return (
    branch[`${key}${suffix}` as keyof PublicCenterBranch] ||
    branch[`${key}${fallback}` as keyof PublicCenterBranch] ||
    branch[`${key}Ar` as keyof PublicCenterBranch] ||
    branch[`${key}En` as keyof PublicCenterBranch] ||
    branch[`${key}He` as keyof PublicCenterBranch] ||
    ""
  ) as string;
}

function getPublicBranches(center: PublicCenterDetail): PublicCenterBranch[] {
  return Array.isArray(center.branches) ? center.branches : [];
}

function getWebsiteSectionOrder(branding: PublicCenterDetail["branding"]): WebsiteSectionKey[] {
  const incoming = Array.isArray(branding?.websiteSectionOrder)
    ? branding.websiteSectionOrder.filter((key): key is WebsiteSectionKey =>
        defaultWebsiteSectionOrder.includes(key as WebsiteSectionKey),
      )
    : [];
  return [
    ...incoming,
    ...defaultWebsiteSectionOrder.filter((key) => !incoming.includes(key)),
  ];
}

function isWebsiteSectionVisible(
  branding: PublicCenterDetail["branding"],
  key: WebsiteSectionKey,
) {
  const visibility = branding?.websiteSectionVisibility;
  if (!visibility || typeof visibility !== "object") return defaultWebsiteSectionVisibility[key];
  return visibility[key] !== false;
}

function buildWhatsAppHref(message: string, phone?: string | null): string | null {
  const normalized = normalizeForWhatsApp(phone ?? "", readWhatsAppDefaultCode());
  if (!/^\d{7,15}$/.test(normalized)) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function BranchesContactSection({
  center,
  displayName,
  labels,
  locale,
  source,
}: {
  center: PublicCenterDetail;
  displayName: string;
  labels: CenterWebsiteLabels;
  locale: SupportedLocale;
  source: string;
}) {
  const branches = getPublicBranches(center);
  if (branches.length === 0) return null;

  return (
    <Section title={labels.branchesTitle}>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {branches.map((branch) => {
          const city = localizedBranchValue(branch, locale, "city");
          const address = localizedBranchValue(branch, locale, "address");
          const workingHours = localizedBranchValue(branch, locale, "workingHoursText");
          const branchWhatsApp = branch.whatsapp || center.branding?.whatsappPhone || null;
          const phone = branch.phone || branchWhatsApp;
          const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
          const whatsAppHref = buildWhatsAppHref(
            `${displayName} - ${branch.name}`,
            branchWhatsApp,
          );

          return (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm"
              key={branch.id}
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-[#0B2D5C]">{branch.name}</h3>
                  {city ? <p className="mt-1 text-sm font-semibold text-[#526176]">{city}</p> : null}
                </div>
                {branch.isMain ? (
                  <span className="rounded-full bg-[#FFF7E6] px-2.5 py-1 text-xs font-bold text-[#8A5A00]">
                    {labels.branchMain}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2 text-sm leading-6 text-[#526176]">
                {address ? (
                  <div className="flex min-w-0 items-start gap-2">
                    {LOCATION_ICON}
                    <span>{address}</span>
                  </div>
                ) : null}
                {phone ? (
                  <a
                    className="flex min-w-0 items-center gap-2 transition hover:text-[#0B2D5C]"
                    dir="ltr"
                    href={callHref ?? "#"}
                    onClick={() => trackCenterEvent(center.slug, "CLICK_PHONE", { page: source })}
                  >
                    {PHONE_ICON}
                    <span>{phone}</span>
                  </a>
                ) : null}
                {workingHours ? (
                  <p className="whitespace-pre-line border-t border-[#EEF2F6] pt-2">{workingHours}</p>
                ) : null}
              </div>

              <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                {whatsAppHref ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
                    href={whatsAppHref}
                    onClick={() => {
                      trackMarketingEvent("WhatsAppClick", {
                        branchId: branch.id,
                        centerName: displayName,
                        centerSlug: center.slug,
                        source,
                      });
                      trackCenterEvent(center.slug, "CLICK_WHATSAPP", { page: source });
                    }}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {WA_ICON}
                    <span>{labels.whatsapp}</span>
                  </a>
                ) : null}
                {branch.mapsUrl ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs font-black text-[#0B2D5C] transition hover:border-[#C8A45D]"
                    href={branch.mapsUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {labels.mapLink} ↗
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function CenterWebsiteNavbar({
  activePage,
  beforeAfterItems,
  center,
  displayName,
  galleryImages,
  locale,
  offers,
  primaryColor,
  reviews,
  teamMembers,
  onBook,
}: {
  activePage: CenterWebsitePageKind;
  beforeAfterItems: PublicCenterBeforeAfter[];
  center: PublicCenterDetail;
  displayName: string;
  galleryImages: PublicGalleryImage[];
  locale: SupportedLocale;
  offers: PublicOffer[];
  primaryColor: string;
  reviews: PublicCenterReview[];
  teamMembers: PublicTeamMember[];
  onBook: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(99);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  const labels = centerWebsiteLabels[locale];
  const baseHref = `/c/${center.slug}`;
  const isRtl = locale === "ar" || locale === "he";
  const branding = center.branding;

  const navItems = [
    { href: baseHref, key: "home" as const, label: labels.home },
    ...(isWebsiteSectionVisible(branding, "services")
      ? [{ href: `${baseHref}/services`, key: "services" as const, label: labels.services }]
      : []),
    ...(isWebsiteSectionVisible(branding, "gallery") && galleryImages.length > 0
      ? [{ href: `${baseHref}/gallery`, key: "gallery" as const, label: publicCentersDictionaries[locale].profile.galleryTitle }]
      : []),
    ...(isWebsiteSectionVisible(branding, "reviews") && reviews.length > 0
      ? [{ href: `${baseHref}/reviews`, key: "reviews" as const, label: publicCentersDictionaries[locale].profile.reviewsTitle }]
      : []),
    ...(isWebsiteSectionVisible(branding, "beforeAfter") && beforeAfterItems.length > 0
      ? [{ href: `${baseHref}/before-after`, key: "before-after" as const, label: beforeAfterLabels[locale].beforeAfter }]
      : []),
    ...(isWebsiteSectionVisible(branding, "team") && teamMembers.length > 0
      ? [{ href: `${baseHref}/team`, key: "team" as const, label: teamLabels[locale].team }]
      : []),
    ...(isWebsiteSectionVisible(branding, "offers") && offers.length > 0
      ? [{ href: `${baseHref}/offers`, key: "offers" as const, label: offersLabels[locale].offers }]
      : []),
    ...(isWebsiteSectionVisible(branding, "about")
      ? [{ href: `${baseHref}/about`, key: "about" as const, label: labels.about }]
      : []),
    ...(isWebsiteSectionVisible(branding, "contact")
      ? [{ href: `${baseHref}/contact`, key: "contact" as const, label: labels.contact }]
      : []),
  ];

  // Measure how many nav items fit the available desktop nav container width.
  // The hidden ruler div mirrors item text so widths match the real items exactly.
  useEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;

    function measure() {
      const cont = navContainerRef.current;
      const ruler = measureRef.current;
      if (!cont || !ruler) return;

      const availW = cont.offsetWidth;
      const moreW = 84; // "More ▾" button estimated width + gap
      const rulerItems = Array.from(ruler.children) as HTMLElement[];

      let usedW = 0;
      let count = 0;

      for (let i = 0; i < rulerItems.length; i++) {
        const w = rulerItems[i].offsetWidth + 4; // 4 px gap
        const isLast = i === rulerItems.length - 1;
        if (usedW + w + (isLast ? 0 : moreW) > availW) break;
        usedW += w;
        count = i + 1;
      }

      setVisibleCount(Math.max(count, 1));
    }

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    measure();
    return () => ro.disconnect();
  }, [navItems.length, locale]);

  // Close More dropdown on outside click / Escape
  useEffect(() => {
    if (!moreOpen) return;
    function onOutside(e: MouseEvent) {
      if (moreWrapRef.current && !moreWrapRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const visibleItems = navItems.slice(0, visibleCount);
  const hiddenItems = navItems.slice(visibleCount);

  function linkClass(key: string) {
    const active = activePage === key;
    return `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#C8A45D]/20 ${
      active ? "bg-[#EEF2FF] text-[#0B2D5C]" : "text-[#526176] hover:bg-[#F8FAFC] hover:text-[#0B2D5C]"
    }`;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 shadow-[0_8px_28px_rgba(11,45,92,0.08)] backdrop-blur-xl">
      {/* Desktop: 3-column grid — logo | nav | cta. RTL mirrors automatically via dir. */}
      <div
        className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Col 1 — Logo + center name */}
        <Link
          className="flex min-w-0 max-w-[150px] shrink items-center gap-2 sm:max-w-[180px] lg:max-w-[210px]"
          href={baseHref}
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm sm:h-10 sm:w-10">
            {center.branding?.logoUrl ? (
              <img alt={displayName} className="h-full w-full object-contain" src={center.branding.logoUrl} />
            ) : (
              <span className="text-sm font-black" style={{ color: primaryColor }}>
                {initials(displayName) || "RC"}
              </span>
            )}
          </span>
          <span
            className="min-w-0 truncate text-[13px] font-black leading-tight text-[#0B2D5C] sm:text-sm"
            title={displayName}
          >
            {displayName}
          </span>
        </Link>

        {/* Col 2 — Nav links (desktop only, centered within the available space) */}
        <div className="relative hidden min-w-0 lg:flex lg:justify-center" ref={navContainerRef}>
          {/* Hidden ruler: mirrors item text so we can measure real widths */}
          <div
            aria-hidden="true"
            className="pointer-events-none invisible absolute inset-0 flex items-center gap-1"
            ref={measureRef}
          >
            {navItems.map((item) => (
              <span
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold"
                key={item.href}
              >
                {item.label}
              </span>
            ))}
          </div>

          {/* Actual nav */}
          <nav className="flex min-w-0 items-center gap-1">
            {visibleItems.map((item) => (
              <Link
                aria-current={activePage === item.key ? "page" : undefined}
                className={linkClass(item.key)}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}

            {hiddenItems.length > 0 && (
              <div className="relative" ref={moreWrapRef}>
                <button
                  aria-expanded={moreOpen}
                  className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-[#526176] transition hover:bg-[#F8FAFC] hover:text-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#C8A45D]/20"
                  onClick={() => setMoreOpen((v) => !v)}
                  type="button"
                >
                  {labels.more}
                  <svg
                    aria-hidden="true"
                    className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {moreOpen && (
                  <div
                    className={`absolute top-[calc(100%+6px)] min-w-[160px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-xl ${
                      isRtl ? "left-0" : "right-0"
                    }`}
                  >
                    {hiddenItems.map((item) => (
                      <Link
                        aria-current={activePage === item.key ? "page" : undefined}
                        className={`block px-4 py-2.5 text-sm font-bold ${
                          activePage === item.key
                            ? "bg-[#EEF2FF] text-[#0B2D5C]"
                            : "text-[#526176] hover:bg-[#F8FAFC] hover:text-[#0B2D5C]"
                        }`}
                        href={item.href}
                        key={item.href}
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Col 3 — CTA + hamburger */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Hairline separator visible only when the Book Now button is present */}
          <span className="hidden h-6 w-px bg-[#E5E7EB] lg:block" />
          <Link
            className="hidden min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-5 py-2 text-sm font-black text-white shadow-sm transition hover:opacity-90 hover:shadow-md lg:inline-flex"
            href={`/c/${center.slug}/book`}
            onClick={onBook}
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
          >
            {labels.bookNow}
            <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: isRtl ? "scaleX(-1)" : undefined }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          <button
            aria-expanded={mobileOpen}
            aria-label={labels.menu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#0B2D5C] shadow-sm transition hover:border-[#C8A45D]/60 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            type="button"
          >
            {mobileOpen ? (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div
          className="border-t border-[#E5E7EB] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="mx-auto flex max-w-6xl flex-col">
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  aria-current={activePage === item.key ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 text-sm font-bold ${
                    activePage === item.key
                      ? "bg-[#EEF2FF] text-[#0B2D5C]"
                      : "text-[#526176] hover:bg-[#F8FAFC] hover:text-[#0B2D5C]"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-[#E5E7EB] pt-3">
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 px-4 py-2 text-sm font-black text-white"
                href={`/c/${center.slug}/book`}
                onClick={() => { setMobileOpen(false); onBook(); }}
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              >
                {labels.bookNow}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Section({
  children,
  intro,
  title,
}: {
  children: ReactNode;
  intro?: string;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.055)] sm:p-6">
      <h2 className="text-lg font-black text-[#0B2D5C]">{title}</h2>
      {intro ? <p className="mt-2 text-sm leading-6 text-[#66758a]">{intro}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CenterCtaRow({
  callHref,
  center,
  displayName,
  labels,
  primaryColor,
  source,
  whatsAppHref,
}: {
  callHref: string | null;
  center: PublicCenterDetail;
  displayName: string;
  labels: (typeof centerWebsiteLabels)[SupportedLocale];
  primaryColor: string;
  source: string;
  whatsAppHref: string | null;
}) {
  function trackStartBooking() {
    trackMarketingEvent("StartBooking", {
      centerName: displayName,
      centerSlug: center.slug,
      source,
    });
  }

  function trackWhatsApp() {
    trackMarketingEvent("WhatsAppClick", {
      centerName: displayName,
      centerSlug: center.slug,
      source,
    });
    trackCenterEvent(center.slug, 'CLICK_WHATSAPP');
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link
        className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90"
        href={`/c/${center.slug}/book`}
        onClick={trackStartBooking}
        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
      >
        {labels.bookNow}
      </Link>
      {whatsAppHref ? (
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-500 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
          href={whatsAppHref}
          onClick={trackWhatsApp}
          rel="noopener noreferrer"
          target="_blank"
        >
          {WA_ICON}
          {labels.whatsapp}
        </a>
      ) : null}
      {callHref ? (
        <a
          className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#0B2D5C] shadow-sm transition hover:border-[#C8A45D]"
          dir="ltr"
          href={callHref}
        >
          {labels.callButton}
        </a>
      ) : null}
    </div>
  );
}

type ServiceCategory = "body" | "dental" | "general" | "hair" | "laser" | "skin";

function detectServiceCategory(nameEn: string, nameAr: string, nameHe: string): ServiceCategory {
  const text = `${nameEn} ${nameAr} ${nameHe}`.toLowerCase();
  if (/laser|ليزر|לייזר/.test(text)) return "laser";
  if (/hair|شعر|שיער|haircut|تساقط/.test(text)) return "hair";
  if (/skin|peel|facial|acne|scar|dermato|جلد|بشرة|تقشير|وجه|עור|פנים/.test(text)) return "skin";
  if (/dental|tooth|teeth|أسنان|שיניים/.test(text)) return "dental";
  if (/body|contouring|wrap|slim|weight|جسم|رشاقة|גוף|הרזיה/.test(text)) return "body";
  return "general";
}

function ServiceCategoryIcon({ category, className, style }: { category: ServiceCategory; className?: string; style?: React.CSSProperties }) {
  const props = { className, fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.6, style, viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" };
  if (category === "laser") return (
    <svg {...props}>
      <path d="M12 3v2M12 19v2M3 12H1M23 12h-2M5.636 5.636 4.222 4.222M19.778 19.778l-1.414-1.414M5.636 18.364l-1.414 1.414M19.778 4.222l-1.414 1.414" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v1M12 15v1M8 12h1M15 12h1" />
    </svg>
  );
  if (category === "skin") return (
    <svg {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="M9 8c0-1.657 1.343-3 3-3s3 1.343 3 3" />
      <path d="M10 10.5c.5.5 1.5.5 2 0" />
      <circle cx="10" cy="8.5" r=".5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="8.5" r=".5" fill="currentColor" stroke="none" />
      <path d="M7.5 13C5 14.5 4 17 4 20h16c0-3-1-5.5-3.5-7" />
      <path d="M9 20c0-1.5.5-3 3-3s3 1.5 3 3" strokeDasharray="2 1.5" />
    </svg>
  );
  if (category === "hair") return (
    <svg {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.5 6 20 12 8.5 18" />
      <path d="M8.5 6c4 1.5 4 3 4 6s0 4.5-4 6" />
    </svg>
  );
  if (category === "dental") return (
    <svg {...props}>
      <path d="M9 3C7 3 5 4.5 5 7c0 2 .5 3.5 1 5s1 3 1 5c0 1.5.5 2 1.5 2s1.5-1 2-3c.3-1.2.5-2 1.5-2s1.2.8 1.5 2c.5 2 1 3 2 3s1.5-.5 1.5-2c0-2 .5-3.5 1-5s1-3 1-5c0-2.5-2-4-4-4-1 0-1.8.4-2.5 1C11.8 3.4 11 3 9 3Z" />
    </svg>
  );
  if (category === "body") return (
    <svg {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  return (
    <svg {...props}>
      <path d="M12 2v20M2 12h20" strokeWidth={2} />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "11,45,92";
  return `${r},${g},${b}`;
}

function ServiceCard({
  d,
  locale,
  primaryColor,
  service,
  slug,
}: {
  d: Dictionary;
  locale: SupportedLocale;
  primaryColor: string;
  service: PublicServiceFull;
  slug: string;
}) {
  const fields = resolveServiceFields(service, locale);
  const category = detectServiceCategory(service.nameEn, service.nameAr, service.nameHe);
  const rgb = hexToRgb(primaryColor);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(0,0,0,0.15)]">

      {/* Banner — real cover image when available, elegant category fallback otherwise */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {service.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={service.coverImageAlt || fields.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            decoding="async"
            loading="lazy"
            src={service.coverImageUrl}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(${rgb},0.18) 100%)` }}
          >
            {/* Decorative rings */}
            <div
              className="absolute -end-6 -top-6 h-24 w-24 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, rgba(${rgb},0.6) 0%, transparent 70%)` }}
            />
            <div
              className="absolute -bottom-4 -start-4 h-16 w-16 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle, rgba(${rgb},0.5) 0%, transparent 70%)` }}
            />

            {/* Icon container — glass pill */}
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
              style={{ backgroundColor: `rgba(${rgb},0.12)`, backdropFilter: "blur(12px)" }}
            >
              <ServiceCategoryIcon
                category={category}
                className="h-7 w-7 sm:h-9 sm:w-9"
                style={{ color: primaryColor }}
              />
            </div>
          </div>
        )}

        {/* Duration badge */}
        {service.durationMinutes != null ? (
          <span className="absolute end-3 top-3 rounded-full border border-white/60 bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-[#374151] shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-xs">
            {d.profile.duration(service.durationMinutes)}
          </span>
        ) : null}

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-3 sm:gap-2 sm:px-4 sm:pt-4">
        <h3 className="text-sm font-black leading-tight text-[#0B2D5C] sm:text-base sm:leading-snug">{fields.name}</h3>
        {fields.description ? (
          <p className="line-clamp-2 text-xs leading-5 text-[#6B7280] sm:line-clamp-3 sm:text-sm sm:leading-6">{fields.description}</p>
        ) : null}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        {service.price ? (
          <div className="mb-2 flex items-baseline gap-1 sm:mb-3">
            <span className="text-base font-black sm:text-lg" style={{ color: primaryColor }}>{service.price}</span>
            <span className="text-[10px] text-[#9CA3AF] sm:text-xs">{service.currency}</span>
          </div>
        ) : null}
        <Link
          className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 sm:min-h-10 sm:text-sm"
          href={`/c/${slug}/book?serviceId=${service.id}`}
          onClick={() => trackMarketingEvent("StartBooking", { serviceName: fields.name, serviceId: service.id, source: "service_card" })}
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(${rgb},0.72) 100%)` }}
        >
          <span>{d.profile.bookServiceCta}</span>
          <svg aria-hidden="true" className="h-3 w-3 shrink-0 opacity-90" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: (locale === "ar" || locale === "he") ? "scaleX(-1)" : undefined }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function GalleryGrid({
  displayName,
  images,
}: {
  displayName: string;
  images: PublicGalleryImage[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <figure
          className="group min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(11,45,92,0.07)]"
          key={image.id}
        >
          <div className="aspect-[4/3] overflow-hidden bg-[#F8FAFC]">
              <img
                alt={`${displayName} gallery ${index + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                decoding="async"
                loading={index < 3 ? "eager" : "lazy"}
                src={image.imageUrl}
              />
          </div>
        </figure>
      ))}
    </div>
  );
}

function localizedReviewComment(review: PublicCenterReview, locale: SupportedLocale) {
  if (locale === "ar") return review.commentAr || review.commentEn || review.commentHe || "";
  if (locale === "he") return review.commentHe || review.commentEn || review.commentAr || "";
  return review.commentEn || review.commentAr || review.commentHe || "";
}

function ReviewStars({ rating }: { rating: number }) {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span aria-label={`${safeRating} / 5`} className="text-sm tracking-wide text-[#C8A45D]">
      {"★".repeat(safeRating)}
      <span className="text-[#D8DEE8]">{"★".repeat(5 - safeRating)}</span>
    </span>
  );
}

function ReviewsGrid({
  locale,
  reviews,
}: {
  locale: SupportedLocale;
  reviews: PublicCenterReview[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {reviews.map((review) => (
        <article
          className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-5 shadow-sm"
          key={review.id}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-sm font-black text-[#0B2D5C]">
              {review.customerName}
            </h3>
            <ReviewStars rating={review.rating} />
          </div>
          <p className="mt-3 text-sm leading-7 text-[#526176]">
            {localizedReviewComment(review, locale)}
          </p>
        </article>
      ))}
    </div>
  );
}

function localizedBeforeAfterFields(item: PublicCenterBeforeAfter, locale: SupportedLocale) {
  if (locale === "ar") {
    return {
      description: item.descriptionAr || item.descriptionEn || item.descriptionHe || "",
      title: item.titleAr || item.titleEn || item.titleHe || beforeAfterLabels.ar.title,
    };
  }
  if (locale === "he") {
    return {
      description: item.descriptionHe || item.descriptionEn || item.descriptionAr || "",
      title: item.titleHe || item.titleEn || item.titleAr || beforeAfterLabels.he.title,
    };
  }
  return {
    description: item.descriptionEn || item.descriptionAr || item.descriptionHe || "",
    title: item.titleEn || item.titleAr || item.titleHe || beforeAfterLabels.en.title,
  };
}

function BeforeAfterCompareCard({
  item,
  locale,
}: {
  item: PublicCenterBeforeAfter;
  locale: SupportedLocale;
}) {
  const fields = localizedBeforeAfterFields(item, locale);
  const labels = beforeAfterLabels[locale];

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_4px_16px_rgba(11,45,92,0.07)]">
      <BeforeAfterPair
        afterImageUrl={item.afterImageUrl}
        afterLabel={labels.after}
        beforeImageUrl={item.beforeImageUrl}
        beforeLabel={labels.before}
        enableLightbox
        title={fields.title}
      />
      <div className="px-1 pb-1 pt-4">
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-black leading-6 text-[#0B2D5C]">{fields.title}</h3>
          <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#526176]">
            {labels.categories[item.category]}
          </span>
        </div>
        {fields.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#526176]">{fields.description}</p>
        ) : null}
      </div>
    </article>
  );
}

function BeforeAfterGrid({
  items,
  locale,
}: {
  items: PublicCenterBeforeAfter[];
  locale: SupportedLocale;
}) {
  const labels = beforeAfterLabels[locale];
  const [activeCategory, setActiveCategory] = useState<PublicBeforeAfterCategory | "ALL">("ALL");
  const categories = useMemo(() => {
    const found = Array.from(new Set(items.map((item) => item.category)));
    return found.length > 0 ? found : (["LASER", "SKIN", "DENTAL", "HAIR"] as PublicBeforeAfterCategory[]);
  }, [items]);
  const filteredItems =
    activeCategory === "ALL"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          className={`min-h-10 rounded-full px-4 py-2 text-sm font-black transition ${
            activeCategory === "ALL"
              ? "bg-[#0B2D5C] text-white"
              : "border border-[#E5E7EB] bg-white text-[#526176] hover:border-[#C8A45D]"
          }`}
          onClick={() => setActiveCategory("ALL")}
          type="button"
        >
          {labels.all}
        </button>
        {categories.map((category) => (
          <button
            className={`min-h-10 rounded-full px-4 py-2 text-sm font-black transition ${
              activeCategory === category
                ? "bg-[#0B2D5C] text-white"
                : "border border-[#E5E7EB] bg-white text-[#526176] hover:border-[#C8A45D]"
            }`}
            key={category}
            onClick={() => setActiveCategory(category)}
            type="button"
          >
            {labels.categories[category]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredItems.map((item) => (
          <BeforeAfterCompareCard item={item} key={item.id} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function CenterHomepage({
  beforeAfterItems,
  center,
  d,
  galleryImages,
  locale,
  offers,
  reviews,
  teamMembers,
}: {
  beforeAfterItems: PublicCenterBeforeAfter[];
  center: PublicCenterDetail;
  d: Dictionary;
  galleryImages: PublicGalleryImage[];
  locale: SupportedLocale;
  offers: PublicOffer[];
  reviews: PublicCenterReview[];
  teamMembers: PublicTeamMember[];
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const slogan = localizedBrandingValue(branding, locale, "slogan");
  const shortDescription = localizedBrandingValue(branding, locale, "publicDescription");
  const fullDescription = localizedBrandingValue(branding, locale, "fullDescription");
  const address = localizedBrandingValue(branding, locale, "address");
  const workingHours = localizedBrandingValue(branding, locale, "workingHours");
  const branches = getPublicBranches(center);
  const hasBranches = branches.length > 0;
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const rgb = hexToRgb(primaryColor);
  const isRtl = locale === "ar" || locale === "he";
  const homepageSocialLinks = [
    { href: branding?.facebookUrl, icon: FB_ICON, label: "Facebook" },
    { href: branding?.instagramUrl, icon: IG_ICON, label: "Instagram" },
    { href: branding?.tiktokUrl, icon: TT_ICON, label: "TikTok" },
  ].filter((l): l is { href: string; icon: ReactElement; label: string } => typeof l.href === "string" && l.href.length > 0);

  const canRender = (key: WebsiteSectionKey) => isWebsiteSectionVisible(branding, key);
  const homepageSections: Partial<Record<WebsiteSectionKey, ReactNode>> = {
    hero: canRender("hero") ? (
      <section id="home" className="relative min-h-[520px] scroll-mt-24 overflow-hidden rounded-3xl bg-[#0B2D5C] shadow-[0_18px_44px_rgba(11,45,92,0.18)]">
        {branding?.coverImageUrl ? (
          <img alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" fetchPriority="high" src={branding?.coverImageUrl ?? ""} />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="relative flex min-h-[520px] flex-col justify-end p-5 text-white sm:p-8 lg:p-10">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white shadow-xl">
              {branding?.logoUrl ? (
                <img alt={displayName} className="h-full w-full object-contain" src={branding?.logoUrl ?? ""} />
              ) : (
                <span className="text-xl font-black" style={{ color: primaryColor }}>
                  {initials(displayName) || "RC"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{displayName}</h1>
              {slogan ? <p className="mt-3 max-w-2xl text-lg font-semibold text-white/88">{slogan}</p> : null}
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/84 sm:text-lg">
            {shortDescription || d.profile.bookingHint}
          </p>
          <div className="mt-7">
            <CenterCtaRow
              callHref={callHref}
              center={center}
              displayName={displayName}
              labels={labels}
              primaryColor={primaryColor}
              source="hero_cta"
              whatsAppHref={whatsAppHref}
            />
          </div>
        </div>
      </section>
    ) : null,
    about: canRender("about") && fullDescription ? (
      <div id="about" className="scroll-mt-24">
        <Section title={d.profile.aboutTitle}>
          <p className="whitespace-pre-line text-sm leading-7 text-[#526176]">{fullDescription}</p>
        </Section>
      </div>
    ) : null,
    services: canRender("services") && center.services.length > 0 ? (
      <div id="services" className="scroll-mt-24">
        <Section title={d.profile.servicesTitle}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {center.services.slice(0, 6).map((service) => (
              <ServiceCard d={d} key={service.id} locale={locale} primaryColor={primaryColor} service={service} slug={center.slug} />
            ))}
          </div>
        </Section>
      </div>
    ) : null,
    gallery: canRender("gallery") && galleryImages.length > 0 ? (
      <div id="gallery" className="scroll-mt-24">
        <Section title={d.profile.galleryTitle}>
          <GalleryGrid displayName={displayName} images={galleryImages.slice(0, 6)} />
          {galleryImages.length > 6 ? (
            <div className="mt-5">
              <Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5" href={`/c/${center.slug}/gallery`}>
                {d.profile.galleryTitle}
              </Link>
            </div>
          ) : null}
        </Section>
      </div>
    ) : null,
    beforeAfter: canRender("beforeAfter") && beforeAfterItems.length > 0 ? (
      <div id="before-after" className="scroll-mt-24">
        <Section intro={beforeAfterLabels[locale].intro} title={beforeAfterLabels[locale].title}>
          <BeforeAfterGrid items={beforeAfterItems.slice(0, 4)} locale={locale} />
          {beforeAfterItems.length > 4 ? (
            <div className="mt-5">
              <Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5" href={`/c/${center.slug}/before-after`}>
                {beforeAfterLabels[locale].beforeAfter}
              </Link>
            </div>
          ) : null}
        </Section>
      </div>
    ) : null,
    reviews: canRender("reviews") && reviews.length > 0 ? (
      <div id="reviews" className="scroll-mt-24">
        <Section title={d.profile.reviewsTitle}>
          <ReviewsGrid locale={locale} reviews={reviews.slice(0, 3)} />
          {reviews.length > 3 ? (
            <div className="mt-5">
              <Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5" href={`/c/${center.slug}/reviews`}>
                {d.profile.reviewsTitle}
              </Link>
            </div>
          ) : null}
        </Section>
      </div>
    ) : null,
    team: canRender("team") && teamMembers.length > 0 ? (
      <div id="team" className="scroll-mt-24">
        <Section intro={teamLabels[locale].intro} title={teamLabels[locale].team}>
          <TeamGrid locale={locale} members={teamMembers.slice(0, 6)} primaryColor={primaryColor} />
        </Section>
      </div>
    ) : null,
    offers: canRender("offers") && offers.length > 0 ? (
      <div id="offers" className="scroll-mt-24">
        <Section intro={offersLabels[locale].intro} title={offersLabels[locale].offers}>
          <OffersGrid centerName={displayName} locale={locale} offers={offers.slice(0, 4)} primaryColor={primaryColor} slug={center.slug} whatsappPhone={branding?.whatsappPhone} />
        </Section>
      </div>
    ) : null,
    workingHours: canRender("workingHours") && hasBranches ? (
      <div id="working-hours" className="scroll-mt-24">
        <BranchesContactSection
          center={center}
          displayName={displayName}
          labels={labels}
          locale={locale}
          source="homepage_branches"
        />
      </div>
    ) : canRender("workingHours") && (workingHours || address || branding?.googleMapsUrl) ? (
      <div id="working-hours" className="scroll-mt-24">
        <Section title={labels.workingHoursTitle}>
          <div className="space-y-4">
            {workingHours ? <p className="whitespace-pre-line text-sm leading-7 text-[#526176]">{workingHours}</p> : null}
            {address ? <div className="flex items-start gap-2 text-sm text-[#526176]">{LOCATION_ICON}<span>{address}</span></div> : null}
            {branding?.googleMapsUrl ? (
              <a className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0B2D5C] transition hover:border-[#C8A45D]" href={branding.googleMapsUrl} rel="noopener noreferrer" target="_blank">
                {labels.mapLink}
              </a>
            ) : null}
          </div>
        </Section>
      </div>
    ) : null,
    contact: canRender("contact") && (phone || whatsAppHref) ? (
      <div id="contact" className="scroll-mt-24">
        <Section title={labels.bookNow}>
          <div className="flex flex-col gap-3">
            <Link
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-md transition hover:shadow-lg hover:brightness-105"
              href={`/c/${center.slug}/book`}
              onClick={() => trackMarketingEvent("StartBooking", { centerName: displayName, centerSlug: center.slug, source: "homepage_contact" })}
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(${rgb},0.78) 100%)` }}
            >
              <span>{labels.bookNow}</span>
            </Link>
            <div className="flex gap-3">
              {whatsAppHref ? (
                <a className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-500 hover:text-white" href={whatsAppHref} onClick={() => { trackMarketingEvent("WhatsAppClick", { centerName: displayName, centerSlug: center.slug, source: "homepage_contact" }); trackCenterEvent(center.slug, 'CLICK_WHATSAPP'); }} rel="noopener noreferrer" target="_blank">
                  {WA_ICON}<span className="truncate">{labels.whatsapp}</span>
                </a>
              ) : null}
              {callHref ? (
                <a className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-black text-[#0B2D5C] transition hover:border-[#C8A45D]" dir="ltr" href={callHref} onClick={() => trackCenterEvent(center.slug, 'CLICK_PHONE')}>
                  {PHONE_ICON}<span className="truncate">{labels.callButton}</span>
                </a>
              ) : null}
            </div>
          </div>
        </Section>
      </div>
    ) : null,
    socialLinks: canRender("socialLinks") && homepageSocialLinks.length > 0 ? (
      <div id="social-links" className="scroll-mt-24">
        <Section title={labels.socialTitle}>
          <div className="flex flex-wrap gap-2">
            {homepageSocialLinks.map((link) => (
              <a aria-label={link.label} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#526176] shadow-sm transition hover:border-[#C8A45D] hover:text-[#0B2D5C] hover:shadow-md" href={link.href} key={link.label} rel="noopener noreferrer" target="_blank">
                {link.icon}
              </a>
            ))}
          </div>
        </Section>
      </div>
    ) : null,
  };

  const orderedSections = getWebsiteSectionOrder(branding)
    .map((key) => [key, homepageSections[key]] as const)
    .filter(([, node]) => Boolean(node));

  return (
    <>
      {orderedSections.map(([key, node]) => (
        <div key={key}>{node}</div>
      ))}
      <div
        className="fixed bottom-0 start-0 end-0 z-50 border-t border-[#E5E7EB] bg-white px-4 pt-3 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
      >
        <Link
          className="flex min-h-11 w-full items-center justify-center rounded-xl border-2 px-5 py-2.5 text-sm font-bold text-white shadow-sm"
          href={`/c/${center.slug}/book`}
          onClick={() =>
            trackMarketingEvent("StartBooking", {
              centerName: displayName,
              centerSlug: center.slug,
              source: "mobile_sticky",
            })
          }
          style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
        >
          {d.profile.stickyBookCta}
        </Link>
      </div>
      {false ? (<>
      <section id="home" className="relative min-h-[520px] scroll-mt-24 overflow-hidden rounded-3xl bg-[#0B2D5C] shadow-[0_18px_44px_rgba(11,45,92,0.18)]">
        {branding?.coverImageUrl ? (
          <img alt="" className="absolute inset-0 h-full w-full object-cover" src={branding?.coverImageUrl ?? ""} />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="relative flex min-h-[520px] flex-col justify-end p-5 text-white sm:p-8 lg:p-10">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white shadow-xl">
              {branding?.logoUrl ? (
                <img alt={displayName} className="h-full w-full object-contain" src={branding?.logoUrl ?? ""} />
              ) : (
                <span className="text-xl font-black" style={{ color: primaryColor }}>
                  {initials(displayName) || "RC"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{displayName}</h1>
              {slogan ? <p className="mt-3 max-w-2xl text-lg font-semibold text-white/88">{slogan}</p> : null}
            </div>
          </div>

          {shortDescription ? (
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/84 sm:text-lg">{shortDescription}</p>
          ) : (
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/76">{d.profile.bookingHint}</p>
          )}

          <div className="mt-7">
            <CenterCtaRow
              callHref={callHref}
              center={center}
              displayName={displayName}
              labels={labels}
              primaryColor={primaryColor}
              source="hero_cta"
              whatsAppHref={whatsAppHref}
            />
          </div>
        </div>
      </section>

      {fullDescription ? (
        <div id="about" className="scroll-mt-24">
          <Section title={d.profile.aboutTitle}>
            <p className="whitespace-pre-line text-sm leading-7 text-[#526176]">{fullDescription}</p>
          </Section>
        </div>
      ) : null}

      <div id="services" className="scroll-mt-24">
        <Section title={d.profile.servicesTitle}>
          {center.services.length === 0 ? (
            <AdminState className="border-dashed" title={d.profile.servicesEmpty} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {center.services.slice(0, 6).map((service) => (
                <ServiceCard d={d} key={service.id} locale={locale} primaryColor={primaryColor} service={service} slug={center.slug} />
              ))}
            </div>
          )}
        </Section>
      </div>

      {galleryImages.length > 0 ? (
        <div id="gallery" className="scroll-mt-24">
          <Section title={d.profile.galleryTitle}>
            <GalleryGrid displayName={displayName} images={galleryImages.slice(0, 6)} />
            {galleryImages.length > 6 ? (
              <div className="mt-5">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5"
                  href={`/c/${center.slug}/gallery`}
                >
                  {d.profile.galleryTitle}
                </Link>
              </div>
            ) : null}
          </Section>
        </div>
      ) : null}

      {beforeAfterItems.length > 0 ? (
        <div id="before-after" className="scroll-mt-24">
          <Section intro={beforeAfterLabels[locale].intro} title={beforeAfterLabels[locale].title}>
            <BeforeAfterGrid items={beforeAfterItems.slice(0, 4)} locale={locale} />
            {beforeAfterItems.length > 4 ? (
              <div className="mt-5">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5"
                  href={`/c/${center.slug}/before-after`}
                >
                  {beforeAfterLabels[locale].beforeAfter}
                </Link>
              </div>
            ) : null}
          </Section>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div id="reviews" className="scroll-mt-24">
          <Section title={d.profile.reviewsTitle}>
            <ReviewsGrid locale={locale} reviews={reviews.slice(0, 3)} />
            {reviews.length > 3 ? (
              <div className="mt-5">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5"
                  href={`/c/${center.slug}/reviews`}
                >
                  {d.profile.reviewsTitle}
                </Link>
              </div>
            ) : null}
          </Section>
        </div>
      ) : null}

      {teamMembers.length > 0 ? (
        <div id="team" className="scroll-mt-24">
          <Section intro={teamLabels[locale].intro} title={teamLabels[locale].team}>
            <TeamGrid locale={locale} members={teamMembers.slice(0, 6)} primaryColor={branding?.primaryColor || "#0B2D5C"} />
            {teamMembers.length > 6 ? (
              <div className="mt-5">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5"
                  href={`/c/${center.slug}/team`}
                >
                  {teamLabels[locale].team}
                </Link>
              </div>
            ) : null}
          </Section>
        </div>
      ) : null}

      {offers.length > 0 ? (
        <div id="offers" className="scroll-mt-24">
          <Section intro={offersLabels[locale].intro} title={offersLabels[locale].offers}>
            <OffersGrid centerName={displayName} locale={locale} offers={offers.slice(0, 4)} primaryColor={branding?.primaryColor || "#0B2D5C"} slug={center.slug} whatsappPhone={branding?.whatsappPhone} />
            {offers.length > 4 ? (
              <div className="mt-5">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#0B2D5C] px-4 py-2 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5"
                  href={`/c/${center.slug}/offers`}
                >
                  {offersLabels[locale].offers}
                </Link>
              </div>
            ) : null}
          </Section>
        </div>
      ) : null}

      <div id="contact" className="grid min-w-0 scroll-mt-24 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Section title={labels.workingHoursTitle}>
          <div className="space-y-4">
            <p className="whitespace-pre-line text-sm leading-7 text-[#526176]">
              {workingHours || labels.noWorkingHours}
            </p>
            {address ? (
              <div className="flex items-start gap-2 text-sm text-[#526176]">
                {LOCATION_ICON}
                <span>{address}</span>
              </div>
            ) : null}
            {branding?.googleMapsUrl ? (
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0B2D5C] transition hover:border-[#C8A45D]"
                href={branding?.googleMapsUrl ?? "#"}
                rel="noopener noreferrer"
                target="_blank"
              >
                {labels.mapLink} ↗
              </a>
            ) : null}
          </div>
        </Section>

        <Section title={labels.bookNow}>
          <div className="flex flex-col gap-3">
            {/* Primary: Book Now */}
            <Link
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-md transition hover:shadow-lg hover:brightness-105"
              href={`/c/${center.slug}/book`}
              onClick={() => trackMarketingEvent("StartBooking", { centerName: displayName, centerSlug: center.slug, source: "homepage_contact" })}
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(${rgb},0.78) 100%)` }}
            >
              <span>{labels.bookNow}</span>
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: isRtl ? "scaleX(-1)" : undefined }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>

            {/* Secondary: WhatsApp + Call */}
            {(whatsAppHref || callHref) ? (
              <div className="flex gap-3">
                {whatsAppHref ? (
                  <a
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
                    href={whatsAppHref ?? "#"}
                    onClick={() => { trackMarketingEvent("WhatsAppClick", { centerName: displayName, centerSlug: center.slug, source: "homepage_contact" }); trackCenterEvent(center.slug, 'CLICK_WHATSAPP'); }}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {WA_ICON}
                    <span className="truncate">{labels.whatsapp}</span>
                  </a>
                ) : null}
                {callHref ? (
                  <a
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-black text-[#0B2D5C] transition hover:border-[#C8A45D]"
                    dir="ltr"
                    href={callHref ?? "#"}
                    onClick={() => trackCenterEvent(center.slug, 'CLICK_PHONE')}
                  >
                    {PHONE_ICON}
                    <span className="truncate">{labels.callButton}</span>
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* Social icons */}
            {homepageSocialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {homepageSocialLinks.map((link) => (
                  <a
                    aria-label={link.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#526176] shadow-sm transition hover:border-[#C8A45D] hover:text-[#0B2D5C] hover:shadow-md"
                    href={link.href}
                    key={link.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </Section>
      </div>

      <div
        className="fixed bottom-0 start-0 end-0 z-50 border-t border-[#E5E7EB] bg-white px-4 pt-3 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
      >
        <Link
          className="flex min-h-11 w-full items-center justify-center rounded-xl border-2 px-5 py-2.5 text-sm font-bold text-white shadow-sm"
          href={`/c/${center.slug}/book`}
          onClick={() =>
            trackMarketingEvent("StartBooking", {
              centerName: displayName,
              centerSlug: center.slug,
              source: "mobile_sticky",
            })
          }
          style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
        >
          {d.profile.stickyBookCta}
        </Link>
      </div>
      </>) : null}
    </>
  );
}

function CenterAboutBody({
  center,
  d,
  locale,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const fullDescription = localizedBrandingValue(branding, locale, "fullDescription");
  const shortDescription = localizedBrandingValue(branding, locale, "publicDescription");
  const address = localizedBrandingValue(branding, locale, "address");
  const workingHours = localizedBrandingValue(branding, locale, "workingHours");
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section intro={labels.aboutIntro} title={`${labels.about} ${displayName}`}>
        <div className="space-y-4">
          <p className="whitespace-pre-line text-sm leading-7 text-[#526176]">
            {fullDescription || shortDescription || labels.fullDescriptionEmpty}
          </p>
          <CenterCtaRow
            callHref={callHref}
            center={center}
            displayName={displayName}
            labels={labels}
            primaryColor={primaryColor}
            source="about_page"
            whatsAppHref={whatsAppHref}
          />
        </div>
      </Section>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Section title={labels.workingHoursTitle}>
          <p className="whitespace-pre-line text-sm leading-7 text-[#526176]">
            {workingHours || labels.noWorkingHours}
          </p>
        </Section>

        <Section title={labels.centerInfo}>
          <div className="space-y-3 text-sm leading-6 text-[#526176]">
            {address ? <p>{d.profile.addressLabel}: {address}</p> : null}
            {phone ? <p dir="ltr">{labels.callButton}: {phone}</p> : null}
            {branding?.email ? <p dir="ltr">{labels.email}: {branding.email}</p> : null}
            {!address && !phone && !branding?.email ? <p>{labels.noContact}</p> : null}
          </div>
        </Section>
      </div>
    </div>
  );
}

function CenterServicesBody({
  center,
  d,
  locale,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section intro={labels.servicesIntro} title={labels.services}>
        {center.services.length === 0 ? (
          <AdminState className="border-dashed" title={d.profile.servicesEmpty} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {center.services.map((service) => (
              <ServiceCard d={d} key={service.id} locale={locale} primaryColor={primaryColor} service={service} slug={center.slug} />
            ))}
          </div>
        )}
      </Section>

      <Section title={labels.bookNow}>
        <CenterCtaRow
          callHref={callHref}
          center={center}
          displayName={displayName}
          labels={labels}
          primaryColor={primaryColor}
          source="services_page"
          whatsAppHref={whatsAppHref}
        />
      </Section>
    </div>
  );
}

function CenterContactBody({
  center,
  d,
  locale,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const rgb = hexToRgb(primaryColor);
  const isRtlContact = locale === "ar" || locale === "he";
  const address = localizedBrandingValue(branding, locale, "address");
  const branches = getPublicBranches(center);
  const hasBranches = branches.length > 0;
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);
  const socialLinks = [
    { href: branding?.facebookUrl, icon: FB_ICON, label: "Facebook" },
    { href: branding?.instagramUrl, icon: IG_ICON, label: "Instagram" },
    { href: branding?.tiktokUrl, icon: TT_ICON, label: "TikTok" },
  ].filter((l): l is { href: string; icon: ReactElement; label: string } => typeof l.href === "string" && l.href.length > 0);

  function trackContact(type: string) {
    trackMarketingEvent("ContactClick", { centerName: displayName, centerSlug: center.slug, type });
    if (type === 'call') trackCenterEvent(center.slug, 'CLICK_PHONE', { page: '/contact' });
    if (type === 'whatsapp') trackCenterEvent(center.slug, 'CLICK_WHATSAPP', { page: '/contact' });
  }

  return (
    <div className="space-y-5">
      {hasBranches ? (
        <BranchesContactSection
          center={center}
          displayName={displayName}
          labels={labels}
          locale={locale}
          source="contact_page"
        />
      ) : null}
      <Section intro={labels.contactIntro} title={labels.contactTitle}>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">

          {/* Left column — contact details with icons */}
          <div className="space-y-3 text-sm">
            {!hasBranches && phone ? (
              <a
                className="flex items-center gap-3 text-[#526176] transition hover:text-[#0B2D5C]"
                dir="ltr"
                href={callHref ?? "#"}
                onClick={() => trackContact("phone")}
              >
                {PHONE_ICON}
                <span>{phone}</span>
              </a>
            ) : null}
            {!hasBranches && branding?.whatsappPhone ? (
              <a
                className="flex items-center gap-3 text-emerald-600 transition hover:text-emerald-700"
                dir="ltr"
                href={whatsAppHref ?? `https://wa.me/${branding.whatsappPhone.replace(/[^\d]/g, "")}`}
                onClick={() => trackContact("whatsapp")}
                rel="noopener noreferrer"
                target="_blank"
              >
                {WA_ICON}
                <span>{branding.whatsappPhone}</span>
              </a>
            ) : null}
            {branding?.email ? (
              <a
                className="flex items-center gap-3 text-[#526176] transition hover:text-[#0B2D5C]"
                dir="ltr"
                href={`mailto:${branding.email}`}
                onClick={() => trackContact("email")}
              >
                {EMAIL_ICON}
                <span className="break-all">{branding.email}</span>
              </a>
            ) : null}
            {!hasBranches && address ? (
              <div className="flex items-start gap-3 text-[#526176]">
                {LOCATION_ICON}
                <span>{address}</span>
              </div>
            ) : null}
            {!hasBranches && !phone && !branding?.email && !address ? (
              <p className="text-[#526176]">{labels.noContact}</p>
            ) : null}
            {!hasBranches && branding?.googleMapsUrl ? (
              <div className="pt-1">
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0B2D5C] transition hover:border-[#C8A45D]"
                  href={branding.googleMapsUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {labels.mapLink} ↗
                </a>
              </div>
            ) : null}
          </div>

          {/* Right column — booking CTAs with clear hierarchy */}
          <div className="flex flex-col gap-3">
            {/* Primary: Book Now */}
            <Link
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-md transition hover:shadow-lg hover:brightness-105"
              href={`/c/${center.slug}/book`}
              onClick={() => trackContact("book")}
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(${rgb},0.78) 100%)` }}
            >
              <span>{labels.bookNow}</span>
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: isRtlContact ? "scaleX(-1)" : undefined }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>

            {/* Secondary: WhatsApp + Call side-by-side */}
            {(whatsAppHref || callHref) ? (
              <div className="flex gap-3">
                {whatsAppHref ? (
                  <a
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
                    href={whatsAppHref}
                    onClick={() => trackContact("whatsapp_cta")}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {WA_ICON}
                    <span className="truncate">{labels.whatsapp}</span>
                  </a>
                ) : null}
                {callHref ? (
                  <a
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-black text-[#0B2D5C] transition hover:border-[#C8A45D]"
                    dir="ltr"
                    href={callHref}
                    onClick={() => trackContact("call_cta")}
                  >
                    {PHONE_ICON}
                    <span className="truncate">{labels.callButton}</span>
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {/* Social links — labeled pill buttons, hidden when no platforms configured */}
      {socialLinks.length > 0 ? (
        <Section title={labels.socialTitle}>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <a
                aria-label={link.label}
                className="flex h-11 items-center gap-2.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-sm font-bold text-[#526176] shadow-sm transition hover:border-[#C8A45D] hover:text-[#0B2D5C] hover:shadow-md"
                href={link.href}
                key={link.label}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function CenterGalleryBody({
  center,
  d,
  galleryImages,
  locale,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  galleryImages: PublicGalleryImage[];
  locale: SupportedLocale;
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section title={d.profile.galleryTitle}>
        {galleryImages.length === 0 ? (
          <AdminState className="border-dashed" title={d.profile.galleryTitle} />
        ) : (
          <GalleryGrid displayName={displayName} images={galleryImages} />
        )}
      </Section>

      <Section title={labels.bookNow}>
        <CenterCtaRow
          callHref={callHref}
          center={center}
          displayName={displayName}
          labels={labels}
          primaryColor={primaryColor}
          source="gallery_page"
          whatsAppHref={whatsAppHref}
        />
      </Section>
    </div>
  );
}

function CenterReviewsBody({
  center,
  d,
  locale,
  reviews,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
  reviews: PublicCenterReview[];
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section title={d.profile.reviewsTitle}>
        {reviews.length === 0 ? (
          <AdminState className="border-dashed" title={d.profile.reviewsTitle} />
        ) : (
          <ReviewsGrid locale={locale} reviews={reviews} />
        )}
      </Section>

      <Section title={labels.bookNow}>
        <CenterCtaRow
          callHref={callHref}
          center={center}
          displayName={displayName}
          labels={labels}
          primaryColor={primaryColor}
          source="reviews_page"
          whatsAppHref={whatsAppHref}
        />
      </Section>
    </div>
  );
}

function CenterBeforeAfterBody({
  beforeAfterItems,
  center,
  d,
  locale,
}: {
  beforeAfterItems: PublicCenterBeforeAfter[];
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section intro={beforeAfterLabels[locale].intro} title={beforeAfterLabels[locale].title}>
        {beforeAfterItems.length === 0 ? (
          <AdminState className="border-dashed" title={beforeAfterLabels[locale].title} />
        ) : (
          <BeforeAfterGrid items={beforeAfterItems} locale={locale} />
        )}
      </Section>

      <Section title={labels.bookNow}>
        <CenterCtaRow
          callHref={callHref}
          center={center}
          displayName={displayName}
          labels={labels}
          primaryColor={primaryColor}
          source="before_after_page"
          whatsAppHref={whatsAppHref}
        />
      </Section>
    </div>
  );
}

// ─── Team helpers ─────────────────────────────────────────────────────────────

function resolveTeamMemberFields(member: PublicTeamMember, locale: SupportedLocale) {
  if (locale === "ar") {
    return {
      bio: member.bioAr || member.bioEn || member.bioHe || "",
      name: member.nameEn || member.nameAr || member.nameHe || "",
      specialty: member.specialtyAr || member.specialtyEn || member.specialtyHe || "",
      title: member.titleAr || member.titleEn || member.titleHe || "",
    };
  }
  if (locale === "he") {
    return {
      bio: member.bioHe || member.bioEn || member.bioAr || "",
      name: member.nameEn || member.nameAr || member.nameHe || "",
      specialty: member.specialtyHe || member.specialtyEn || member.specialtyAr || "",
      title: member.titleHe || member.titleEn || member.titleAr || "",
    };
  }
  return {
    bio: member.bioEn || member.bioAr || member.bioHe || "",
    name: member.nameEn || member.nameAr || member.nameHe || "",
    specialty: member.specialtyEn || member.specialtyAr || member.specialtyHe || "",
    title: member.titleEn || member.titleAr || member.titleHe || "",
  };
}

function TeamGrid({
  locale,
  members,
  primaryColor,
}: {
  locale: SupportedLocale;
  members: PublicTeamMember[];
  primaryColor: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const fields = resolveTeamMemberFields(member, locale);
        const initials2 = (fields.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join("")).toUpperCase() || "?";
        return (
          <article
            className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5 text-center shadow-[0_4px_16px_rgba(11,45,92,0.07)]"
            key={member.id}
          >
            {member.photoUrl ? (
              <img
                alt={fields.name}
                className="h-20 w-20 rounded-full border-2 border-[#E5E7EB] object-cover shadow"
                decoding="async"
                loading="lazy"
                src={member.photoUrl}
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#E5E7EB] text-xl font-black text-white shadow"
                style={{ backgroundColor: primaryColor }}
              >
                {initials2}
              </div>
            )}
            <div className="min-w-0 w-full">
              <p className="break-words text-sm font-black text-[#0B2D5C]">{fields.name || "—"}</p>
              {fields.title ? (
                <p className="mt-1 break-words text-xs font-semibold text-[#C8A45D]">{fields.title}</p>
              ) : null}
              {fields.specialty ? (
                <p className="mt-1 break-words text-xs text-[#66758a]">{fields.specialty}</p>
              ) : null}
              {member.yearsExperience != null ? (
                <p className="mt-2 text-xs text-[#8A94A6]">{teamLabels[locale].years(member.yearsExperience)}</p>
              ) : null}
              {fields.bio ? (
                <p className="mt-2 line-clamp-3 text-xs leading-6 text-[#526176]">{fields.bio}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CenterTeamBody({
  center,
  d,
  locale,
  teamMembers,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
  teamMembers: PublicTeamMember[];
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section intro={teamLabels[locale].intro} title={teamLabels[locale].team}>
        {teamMembers.length === 0 ? (
          <AdminState className="border-dashed" title={teamLabels[locale].team} />
        ) : (
          <TeamGrid locale={locale} members={teamMembers} primaryColor={primaryColor} />
        )}
      </Section>

      <Section title={labels.bookNow}>
        <CenterCtaRow
          callHref={callHref}
          center={center}
          displayName={displayName}
          labels={labels}
          primaryColor={primaryColor}
          source="team_page"
          whatsAppHref={whatsAppHref}
        />
      </Section>
    </div>
  );
}

// ─── Offers helpers ───────────────────────────────────────────────────────────

function resolveOfferFields(offer: PublicOffer, locale: SupportedLocale) {
  if (locale === "ar") {
    return {
      badge: offer.badgeAr || offer.badgeEn || offer.badgeHe || "",
      description: offer.descriptionAr || offer.descriptionEn || offer.descriptionHe || "",
      title: offer.titleAr || offer.titleEn || offer.titleHe || "",
    };
  }
  if (locale === "he") {
    return {
      badge: offer.badgeHe || offer.badgeEn || offer.badgeAr || "",
      description: offer.descriptionHe || offer.descriptionEn || offer.descriptionAr || "",
      title: offer.titleHe || offer.titleEn || offer.titleAr || "",
    };
  }
  return {
    badge: offer.badgeEn || offer.badgeAr || offer.badgeHe || "",
    description: offer.descriptionEn || offer.descriptionAr || offer.descriptionHe || "",
    title: offer.titleEn || offer.titleAr || offer.titleHe || "",
  };
}

function formatPrice(price: string | null, currency: string): string {
  if (!price) return "";
  const n = parseFloat(price);
  return Number.isNaN(n) ? price : `${n.toLocaleString()} ${currency}`;
}

function OffersGrid({
  locale,
  offers,
  primaryColor,
  slug,
  centerName,
  whatsappPhone,
}: {
  locale: SupportedLocale;
  offers: PublicOffer[];
  primaryColor: string;
  slug: string;
  centerName?: string;
  whatsappPhone?: string | null;
}) {
  const ol = offersLabels[locale];
  const isRtl = locale === "ar" || locale === "he";
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
      {offers.map((offer) => {
        const fields = resolveOfferFields(offer, locale);
        const hasPrice = offer.newPrice || offer.oldPrice;
        const endsAtDate = offer.endsAt ? new Date(offer.endsAt) : null;

        const offerPageUrl = typeof window !== "undefined"
          ? `${window.location.origin}/c/${slug}/offers`
          : `/c/${slug}/offers`;
        const waMessage = [
          centerName ? `${centerName}` : "",
          fields.title ? `🎁 ${fields.title}` : "",
          offer.newPrice ? `${offer.newPrice} ${offer.currency}` : (offer.oldPrice ? `${offer.oldPrice} ${offer.currency}` : ""),
          offerPageUrl,
        ].filter(Boolean).join("\n");
        const waPhone = whatsappPhone?.replace(/[^\d+]/g, "") ?? "";
        const waHref = waPhone.length >= 7
          ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
          : null;

        return (
          <article
            className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(11,45,92,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(11,45,92,0.12)]"
            key={offer.id}
          >
            {offer.imageUrl ? (
              <div className="relative h-40 overflow-hidden bg-[#F8FAFC]">
                <img
                  alt={fields.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  decoding="async"
                  loading="lazy"
                  src={offer.imageUrl}
                />
                {fields.badge ? (
                  <span
                    className="absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-black text-white shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {fields.badge}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="relative flex h-40 items-center justify-center bg-[#F8FAFC] text-5xl">
                🎁
                {fields.badge ? (
                  <span
                    className="absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-black text-white shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {fields.badge}
                  </span>
                ) : null}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="text-sm font-black leading-snug text-[#0B2D5C]">{fields.title || "—"}</p>
              {fields.description ? (
                <p className="line-clamp-2 text-sm leading-6 text-[#526176]">{fields.description}</p>
              ) : null}
              {hasPrice ? (
                <div className="flex items-baseline gap-2">
                  {offer.newPrice ? (
                    <span className="text-base font-black" style={{ color: primaryColor }}>
                      {formatPrice(offer.newPrice, offer.currency)}
                    </span>
                  ) : null}
                  {offer.oldPrice ? (
                    <span className="text-sm text-[#8A94A6] line-through">
                      {formatPrice(offer.oldPrice, offer.currency)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {endsAtDate ? (
                <p className="text-xs text-[#8A94A6]">
                  {ol.validUntil} {endsAtDate.toLocaleDateString()}
                </p>
              ) : null}
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-black text-white transition hover:opacity-90"
                  href={`/c/${slug}/book?offerId=${offer.id}`}
                  onClick={() => {
                    trackMarketingEvent("SelectOffer", {
                      offerId: offer.id,
                      offerTitle: fields.title,
                      centerSlug: slug,
                    });
                    trackMarketingEvent("StartBooking", {
                      offerTitle: fields.title,
                      offerId: offer.id,
                      source: "offer_card",
                    });
                  }}
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                  {ol.bookCta}
                  <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: isRtl ? "scaleX(-1)" : undefined }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
                {waHref ? (
                  <a
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    href={waHref}
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={() =>
                      trackMarketingEvent("WhatsAppClick", {
                        offerTitle: fields.title,
                        centerSlug: slug,
                        source: "offer_card",
                      })
                    }
                  >
                    {WA_ICON}
                    {ol.whatsappCta}
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CenterOffersBody({
  center,
  d,
  locale,
  offers,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
  offers: PublicOffer[];
}) {
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const callHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);

  return (
    <div className="space-y-5">
      <Section intro={offersLabels[locale].intro} title={offersLabels[locale].offers}>
        {offers.length === 0 ? (
          <AdminState className="border-dashed" title={offersLabels[locale].offers} />
        ) : (
          <OffersGrid centerName={displayName} locale={locale} offers={offers} primaryColor={primaryColor} slug={center.slug} whatsappPhone={branding?.whatsappPhone} />
        )}
      </Section>

      <Section title={labels.bookNow}>
        <CenterCtaRow
          callHref={callHref}
          center={center}
          displayName={displayName}
          labels={labels}
          primaryColor={primaryColor}
          source="offers_page"
          whatsAppHref={whatsAppHref}
        />
      </Section>
    </div>
  );
}

function CenterWebsiteFooter({
  beforeAfterItems,
  center,
  d,
  galleryImages,
  locale,
  offers,
  reviews,
  teamMembers,
}: {
  beforeAfterItems: PublicCenterBeforeAfter[];
  center: PublicCenterDetail;
  d: Dictionary;
  galleryImages: PublicGalleryImage[];
  locale: SupportedLocale;
  offers: PublicOffer[];
  reviews: PublicCenterReview[];
  teamMembers: PublicTeamMember[];
}) {
  const isRtl = locale === "ar" || locale === "he";
  const labels = centerWebsiteLabels[locale];
  const displayName = resolveLocalizedName(center, locale);
  const branding = center.branding;
  const primaryColor = branding?.primaryColor || "#0B2D5C";
  const slogan = localizedBrandingValue(branding, locale, "slogan");
  const shortDescription = localizedBrandingValue(branding, locale, "publicDescription");
  const description = slogan || shortDescription;
  const workingHours = localizedBrandingValue(branding, locale, "workingHours");
  const address = localizedBrandingValue(branding, locale, "address");
  const phone = branding?.phone || branding?.whatsappPhone || null;
  const whatsAppHref = buildWhatsAppHref(d.profile.consultationMessage(displayName), branding?.whatsappPhone);
  const baseHref = `/c/${center.slug}`;
  const year = new Date().getFullYear();

  // Footer quick links — priority order, hard cap at 6 to prevent tall columns
  const footerNavItems = [
    { href: baseHref, label: labels.home },
    ...(isWebsiteSectionVisible(branding, "services")
      ? [{ href: `${baseHref}/services`, label: labels.services }]
      : []),
    ...(isWebsiteSectionVisible(branding, "gallery") && galleryImages.length > 0
      ? [{ href: `${baseHref}/gallery`, label: d.profile.galleryTitle }]
      : []),
    ...(isWebsiteSectionVisible(branding, "reviews") && reviews.length > 0
      ? [{ href: `${baseHref}/reviews`, label: d.profile.reviewsTitle }]
      : []),
    ...(isWebsiteSectionVisible(branding, "team") && teamMembers.length > 0
      ? [{ href: `${baseHref}/team`, label: teamLabels[locale].team }]
      : []),
    ...(isWebsiteSectionVisible(branding, "contact")
      ? [{ href: `${baseHref}/contact`, label: labels.contact }]
      : []),
    ...(isWebsiteSectionVisible(branding, "beforeAfter") && beforeAfterItems.length > 0
      ? [{ href: `${baseHref}/before-after`, label: beforeAfterLabels[locale].beforeAfter }]
      : []),
    ...(isWebsiteSectionVisible(branding, "offers") && offers.length > 0
      ? [{ href: `${baseHref}/offers`, label: offersLabels[locale].offers }]
      : []),
    ...(isWebsiteSectionVisible(branding, "about")
      ? [{ href: `${baseHref}/about`, label: labels.about }]
      : []),
  ].slice(0, 6);

  const socialLinks = [
    { href: branding?.facebookUrl, icon: FB_ICON, label: "Facebook" },
    { href: branding?.instagramUrl, icon: IG_ICON, label: "Instagram" },
    { href: branding?.tiktokUrl, icon: TT_ICON, label: "TikTok" },
  ].filter((l): l is { href: string; icon: ReactElement; label: string } => typeof l.href === "string" && l.href.length > 0);

  const hasContact = !!(phone || whatsAppHref || branding?.email || address || workingHours);

  return (
    <footer className="bg-[#061B35] text-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="h-1" style={{ backgroundColor: primaryColor }} />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">

        {/* Three-column grid — direction-aware: col-1 is start side */}
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-3">

          {/* Col 1 (start): Identity + description + social */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10">
                {branding?.logoUrl ? (
                  <img alt={displayName} className="h-full w-full object-contain" src={branding.logoUrl} />
                ) : (
                  <span className="text-base font-black" style={{ color: primaryColor }}>
                    {initials(displayName) || "RC"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="max-w-[180px] truncate font-black leading-snug text-white" title={displayName}>
                  {displayName}
                </p>
              </div>
            </div>
            {description ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-white/55">
                {description}
              </p>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    aria-label={link.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/25 hover:text-white"
                    href={link.href}
                    key={link.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Col 2 (middle): Quick links — max 6 */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
              {labels.quickLinks}
            </p>
            <ul className="space-y-2">
              {footerNavItems.map((item) => (
                <li key={item.href}>
                  <Link className="text-sm text-white/60 transition hover:text-white" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 (end): Contact — hidden entirely when no data */}
          {hasContact ? (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
                {labels.contactTitle}
              </p>
              <div className="space-y-2.5 text-sm text-white/60">
                {phone ? (
                  <a
                    className="flex items-center gap-2 transition hover:text-white"
                    dir="ltr"
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  >
                    {PHONE_ICON}
                    <span>{phone}</span>
                  </a>
                ) : null}
                {whatsAppHref ? (
                  <a
                    className="flex items-center gap-2 text-emerald-400 transition hover:text-emerald-300"
                    href={whatsAppHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {WA_ICON}
                    <span>{labels.whatsapp}</span>
                  </a>
                ) : null}
                {branding?.email ? (
                  <a
                    className="flex items-center gap-2 break-all transition hover:text-white"
                    dir="ltr"
                    href={`mailto:${branding.email}`}
                  >
                    {EMAIL_ICON}
                    <span>{branding.email}</span>
                  </a>
                ) : null}
                {address ? (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{LOCATION_ICON}</span>
                    <span>{address}</span>
                  </div>
                ) : null}
                {workingHours ? (
                  <div className="mt-1 border-t border-white/10 pt-3">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/40">
                      {labels.workingHoursTitle}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{workingHours}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-5">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:gap-6">
            <p className="text-xs text-white/35">
              © {year}{" "}
              <span className="inline-block max-w-[22ch] truncate align-bottom font-semibold text-white/50" title={displayName}>
                {displayName}
              </span>
              {". "}{labels.copyright}
            </p>
            <span className="shrink-0 text-xs text-white/20">Powered by RoyalCare</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CenterWebsiteContent({
  beforeAfterItems,
  center,
  d,
  galleryImages,
  locale,
  offers,
  page,
  reviews,
  teamMembers,
}: {
  beforeAfterItems: PublicCenterBeforeAfter[];
  center: PublicCenterDetail;
  d: Dictionary;
  galleryImages: PublicGalleryImage[];
  locale: SupportedLocale;
  offers: PublicOffer[];
  page: CenterWebsitePageKind;
  reviews: PublicCenterReview[];
  teamMembers: PublicTeamMember[];
}) {
  if (page === "about") return <CenterAboutBody center={center} d={d} locale={locale} />;
  if (page === "services") return <CenterServicesBody center={center} d={d} locale={locale} />;
  if (page === "contact") return <CenterContactBody center={center} d={d} locale={locale} />;
  if (page === "gallery") return <CenterGalleryBody center={center} d={d} galleryImages={galleryImages} locale={locale} />;
  if (page === "reviews") return <CenterReviewsBody center={center} d={d} locale={locale} reviews={reviews} />;
  if (page === "before-after") return <CenterBeforeAfterBody beforeAfterItems={beforeAfterItems} center={center} d={d} locale={locale} />;
  if (page === "team") return <CenterTeamBody center={center} d={d} locale={locale} teamMembers={teamMembers} />;
  if (page === "offers") return <CenterOffersBody center={center} d={d} locale={locale} offers={offers} />;
  return <CenterHomepage beforeAfterItems={beforeAfterItems} center={center} d={d} galleryImages={galleryImages} locale={locale} offers={offers} reviews={reviews} teamMembers={teamMembers} />;
}

export function CenterWebsitePage({
  page,
  slug,
}: {
  page: CenterWebsitePageKind;
  slug: string;
}) {
  const { locale, direction } = useLanguage();
  const activeLocale = locale as SupportedLocale;
  const d = publicCentersDictionaries[activeLocale];
  const [center, setCenter] = useState<PublicCenterDetail | null>(null);
  const [beforeAfterItems, setBeforeAfterItems] = useState<PublicCenterBeforeAfter[]>([]);
  const [galleryImages, setGalleryImages] = useState<PublicGalleryImage[]>([]);
  const [reviews, setReviews] = useState<PublicCenterReview[]>([]);
  const [teamMembers, setTeamMembers] = useState<PublicTeamMember[]>([]);
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [status, setStatus] = useState<"error" | "loading" | "not-found" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPublicCenter(slug),
      getPublicCenterBeforeAfter(slug).catch(() => ({ data: [] as PublicCenterBeforeAfter[] })),
      getPublicCenterGallery(slug).catch(() => ({ data: [] as PublicGalleryImage[] })),
      getPublicCenterReviews(slug).catch(() => ({ data: [] as PublicCenterReview[] })),
      getPublicCenterTeam(slug).catch(() => ({ data: [] as PublicTeamMember[] })),
      getPublicCenterOffers(slug).catch(() => ({ data: [] as PublicOffer[] })),
    ])
      .then(([centerData, beforeAfterData, galleryData, reviewData, teamData, offersData]) => {
        if (cancelled) return;
        setCenter(centerData);
        setBeforeAfterItems(beforeAfterData.data ?? []);
        setGalleryImages(galleryData.data ?? []);
        setReviews(reviewData.data ?? []);
        setTeamMembers(teamData.data ?? []);
        setOffers(offersData.data ?? []);
        setStatus("ready");
        trackMarketingEvent("ViewCenter", {
          centerName: resolveLocalizedName(centerData, activeLocale),
          centerSlug: centerData.slug,
        });
        trackCenterEvent(centerData.slug, 'VIEW_CENTER_WEBSITE', { page: '/' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const isNotFound =
          error instanceof Error && error.message.toLowerCase().includes("not found");
        setStatus(isNotFound ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [activeLocale, slug]);

  // Sync browser tab title + center favicon when center data or locale changes.
  useEffect(() => {
    if (!center) return;

    const labels = centerWebsiteLabels[activeLocale];
    const displayName = resolveLocalizedName(center, activeLocale);

    const pageSuffix: Record<CenterWebsitePageKind, string> = {
      home: "",
      about: ` — ${labels.about}`,
      services: ` — ${labels.services}`,
      gallery: ` — ${d.profile.galleryTitle}`,
      reviews: ` — ${d.profile.reviewsTitle}`,
      "before-after": ` — ${beforeAfterLabels[activeLocale].beforeAfter}`,
      team: ` — ${teamLabels[activeLocale].team}`,
      offers: ` — ${offersLabels[activeLocale].offers}`,
      contact: ` — ${labels.contact}`,
    };
    document.title = displayName + (pageSuffix[page] ?? "");

    const logoUrl = center.branding?.logoUrl?.trim() || null;
    window.dispatchEvent(
      new CustomEvent<FaviconUpdateDetail>(FAVICON_EVENT, {
        detail: { href: logoUrl, scope: "center" },
      }),
    );

    // GlobalFavicon restores the platform icon on actual route changes away
    // from /c/*; do not clear it on center subpage unmounts.
  }, [center, activeLocale, d.profile.galleryTitle, d.profile.reviewsTitle, page]);

  // Fire center analytics page-view events when the viewed page changes.
  useEffect(() => {
    if (!center || status !== 'ready') return;
    const pageEventMap: Partial<Record<typeof page, CenterEventType>> = {
      gallery: 'VIEW_GALLERY',
      reviews: 'VIEW_REVIEWS',
      'before-after': 'VIEW_BEFORE_AFTER',
      offers: 'VIEW_OFFERS',
      contact: 'VIEW_CONTACT',
      services: 'VIEW_SERVICES',
    };
    const eventType = pageEventMap[page];
    if (eventType) {
      trackCenterEvent(center.slug, eventType, { page: `/${page}` });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.slug, page, status]);

  const loadingCards = useMemo(() => [0, 1, 2], []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir={direction} lang={locale}>
      <TenantMarketingInjector slug={slug} />
      {center && status === "ready" ? (
        <CenterWebsiteNavbar
          activePage={page}
          beforeAfterItems={beforeAfterItems}
          center={center}
          displayName={resolveLocalizedName(center, activeLocale)}
          galleryImages={galleryImages}
          locale={activeLocale}
          offers={offers}
          reviews={reviews}
          teamMembers={teamMembers}
          onBook={() => {
            trackMarketingEvent("StartBooking", {
              centerName: resolveLocalizedName(center, activeLocale),
              centerSlug: center.slug,
              source: "center_nav",
            });
            trackCenterEvent(center.slug, 'CLICK_BOOK_NOW', { page: `/${page}` });
          }}
          primaryColor={center.branding?.primaryColor || "#0B2D5C"}
        />
      ) : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-5 pb-20 sm:pb-6">
          {status === "loading" ? (
            <>
              <div className="h-[520px] animate-pulse rounded-3xl bg-[#E5E7EB]" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {loadingCards.map((item) => (
                  <div className="h-44 animate-pulse rounded-2xl bg-white" key={item} />
                ))}
              </div>
            </>
          ) : status === "not-found" ? (
            <AdminState
              body={d.profile.notFoundBody}
              className="mt-10"
              title={d.profile.notFound}
              tone="warning"
            />
          ) : status === "error" ? (
            <AdminState className="mt-10" title={d.profile.loadError} tone="error" />
          ) : center ? (
            <CenterWebsiteContent
              beforeAfterItems={beforeAfterItems}
              center={center}
              d={d}
              galleryImages={galleryImages}
              locale={activeLocale}
              offers={offers}
              page={page}
              reviews={reviews}
              teamMembers={teamMembers}
            />
          ) : null}
        </div>
      </main>

      {center && status === "ready" ? (
        <CenterWebsiteFooter beforeAfterItems={beforeAfterItems} center={center} d={d} galleryImages={galleryImages} locale={activeLocale} offers={offers} reviews={reviews} teamMembers={teamMembers} />
      ) : null}

      {/* Smart Contact Widget — fixed-position, rendered only when center is ready */}
      {center && status === "ready" ? (
        <SmartContactWidget
          center={center}
          locale={activeLocale}
          page={page}
          primaryColor={center.branding?.primaryColor || "#0B2D5C"}
        />
      ) : null}
    </div>
  );
}

export function CenterProfilePage({ slug }: { slug: string }) {
  return <CenterWebsitePage page="home" slug={slug} />;
}
