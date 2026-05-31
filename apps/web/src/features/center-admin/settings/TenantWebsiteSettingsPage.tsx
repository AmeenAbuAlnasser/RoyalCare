"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AdminCard, AdminSectionHeader, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  getTenantCenterPublicProfile,
  updateTenantCenterPublicProfile,
  uploadTenantCenterPublicImage,
  type CenterPublicProfileData,
} from "@/lib/api/center-public-profile";
import { UploadFailedError } from "@/lib/api/system-settings";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type Copy = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  save: string;
  saving: string;
  saved: string;
  saveError: string;
  noChanges: string;
  unsaved: string;
  upload: string;
  uploading: string;
  uploaded: string;
  uploadError: string;
  clear: string;
  preview: string;
  previewHint: string;
  helper: string;
  sections: {
    branding: string;
    brandingHint: string;
    content: string;
    contentHint: string;
    contact: string;
    contactHint: string;
    business: string;
    businessHint: string;
  };
  fields: Record<keyof WebsiteForm, string>;
  langs: Record<"ar" | "en" | "he", string>;
  imageHint: string;
};

type WebsiteForm = {
  addressAr: string;
  addressEn: string;
  addressHe: string;
  coverImageUrl: string;
  email: string;
  facebookUrl: string;
  fullDescriptionAr: string;
  fullDescriptionEn: string;
  fullDescriptionHe: string;
  googleMapsUrl: string;
  instagramUrl: string;
  logoUrl: string;
  phone: string;
  primaryColor: string;
  publicDescriptionAr: string;
  publicDescriptionEn: string;
  publicDescriptionHe: string;
  secondaryColor: string;
  sloganAr: string;
  sloganEn: string;
  sloganHe: string;
  tiktokUrl: string;
  whatsappPhone: string;
  workingHoursAr: string;
  workingHoursEn: string;
  workingHoursHe: string;
};

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

type WebsiteBuilderSettings = {
  order: WebsiteSectionKey[];
  visibility: Record<WebsiteSectionKey, boolean>;
};

const emptyForm: WebsiteForm = {
  addressAr: "",
  addressEn: "",
  addressHe: "",
  coverImageUrl: "",
  email: "",
  facebookUrl: "",
  fullDescriptionAr: "",
  fullDescriptionEn: "",
  fullDescriptionHe: "",
  googleMapsUrl: "",
  instagramUrl: "",
  logoUrl: "",
  phone: "",
  primaryColor: "#0B2D5C",
  publicDescriptionAr: "",
  publicDescriptionEn: "",
  publicDescriptionHe: "",
  secondaryColor: "#C8A45D",
  sloganAr: "",
  sloganEn: "",
  sloganHe: "",
  tiktokUrl: "",
  whatsappPhone: "",
  workingHoursAr: "",
  workingHoursEn: "",
  workingHoursHe: "",
};

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

function normalizeBuilder(data: Partial<CenterPublicProfileData> | null | undefined): WebsiteBuilderSettings {
  const incomingOrder = Array.isArray(data?.websiteSectionOrder)
    ? data.websiteSectionOrder.filter((key): key is WebsiteSectionKey =>
        defaultWebsiteSectionOrder.includes(key as WebsiteSectionKey),
      )
    : [];
  const order = [
    ...incomingOrder,
    ...defaultWebsiteSectionOrder.filter((key) => !incomingOrder.includes(key)),
  ];
  const rawVisibility =
    data?.websiteSectionVisibility && typeof data.websiteSectionVisibility === "object"
      ? data.websiteSectionVisibility
      : {};
  return {
    order,
    visibility: {
      ...defaultWebsiteSectionVisibility,
      ...Object.fromEntries(
        Object.entries(rawVisibility).filter(([key]) =>
          defaultWebsiteSectionOrder.includes(key as WebsiteSectionKey),
        ),
      ),
    },
  };
}

const builderCopy: Record<
  SupportedLocale,
  {
    hidden: string;
    sectionHint: string;
    sectionTitle: string;
    shown: string;
    labels: Record<WebsiteSectionKey, string>;
  }
> = {
  en: {
    hidden: "Hidden",
    sectionHint: "Choose which homepage sections appear and drag them into the order visitors should see.",
    sectionTitle: "Homepage sections",
    shown: "Shown",
    labels: {
      about: "About",
      beforeAfter: "Before / After",
      contact: "Contact",
      gallery: "Gallery",
      hero: "Hero",
      offers: "Offers",
      reviews: "Reviews",
      services: "Services",
      socialLinks: "Social links",
      team: "Team",
      workingHours: "Working hours",
    },
  },
  ar: {
    hidden: "مخفي",
    sectionHint: "اختر أقسام الصفحة الرئيسية واسحبها لترتيب الظهور للزوار.",
    sectionTitle: "أقسام الصفحة الرئيسية",
    shown: "ظاهر",
    labels: {
      about: "عن المركز",
      beforeAfter: "قبل وبعد",
      contact: "التواصل",
      gallery: "معرض الصور",
      hero: "الهيرو",
      offers: "العروض",
      reviews: "التقييمات",
      services: "الخدمات",
      socialLinks: "روابط التواصل",
      team: "الفريق",
      workingHours: "ساعات العمل",
    },
  },
  he: {
    hidden: "מוסתר",
    sectionHint: "בחרו אילו אזורי דף הבית יוצגו וגררו אותם לסדר הרצוי למבקרים.",
    sectionTitle: "אזורי דף הבית",
    shown: "מוצג",
    labels: {
      about: "אודות",
      beforeAfter: "לפני / אחרי",
      contact: "יצירת קשר",
      gallery: "גלריה",
      hero: "הירו",
      offers: "מבצעים",
      reviews: "ביקורות",
      services: "שירותים",
      socialLinks: "קישורים חברתיים",
      team: "צוות",
      workingHours: "שעות פעילות",
    },
  },
};

const copy: Record<SupportedLocale, Copy> = {
  en: {
    title: "Website Settings",
    subtitle: "Prepare your center website content, branding, and contact details.",
    loading: "Loading website settings...",
    loadError: "Could not load website settings. Please try again.",
    save: "Save website settings",
    saving: "Saving...",
    saved: "Website settings saved.",
    saveError: "Could not save website settings. Please check the fields and try again.",
    noChanges: "No unsaved changes.",
    unsaved: "You have unsaved changes.",
    upload: "Upload image",
    uploading: "Uploading...",
    uploaded: "Image uploaded. Save to keep it.",
    uploadError: "Image upload failed.",
    clear: "Clear",
    preview: "Live preview",
    previewHint: "This is a draft preview. Public website pages will use these settings later.",
    helper: "These settings belong to this center only and are the foundation for future public website pages.",
    sections: {
      branding: "Branding",
      brandingHint: "Logo, hero image, and brand colors used by your public website.",
      content: "Center content",
      contentHint: "Localized website copy for Arabic, English, and Hebrew.",
      contact: "Contact",
      contactHint: "Public contact details and address shown to visitors.",
      business: "Business info",
      businessHint: "Working hours text and social links for the website footer/profile.",
    },
    fields: {
      addressAr: "Address Arabic",
      addressEn: "Address English",
      addressHe: "Address Hebrew",
      coverImageUrl: "Cover / hero image",
      email: "Email",
      facebookUrl: "Facebook URL",
      fullDescriptionAr: "Full description Arabic",
      fullDescriptionEn: "Full description English",
      fullDescriptionHe: "Full description Hebrew",
      googleMapsUrl: "Google Maps URL",
      instagramUrl: "Instagram URL",
      logoUrl: "Center logo",
      phone: "Phone",
      primaryColor: "Primary color",
      publicDescriptionAr: "Short description Arabic",
      publicDescriptionEn: "Short description English",
      publicDescriptionHe: "Short description Hebrew",
      secondaryColor: "Secondary color",
      sloganAr: "Slogan Arabic",
      sloganEn: "Slogan English",
      sloganHe: "Slogan Hebrew",
      tiktokUrl: "TikTok URL",
      whatsappPhone: "WhatsApp",
      workingHoursAr: "Working hours Arabic",
      workingHoursEn: "Working hours English",
      workingHoursHe: "Working hours Hebrew",
    },
    langs: { ar: "Arabic", en: "English", he: "Hebrew" },
    imageHint: "PNG, JPG, WebP, or SVG. Images are optimized automatically.",
  },
  ar: {
    title: "إعدادات الموقع",
    subtitle: "جهّز محتوى وهوية وتواصل موقع مركزك.",
    loading: "جار تحميل إعدادات الموقع...",
    loadError: "تعذر تحميل إعدادات الموقع. يرجى المحاولة مرة أخرى.",
    save: "حفظ إعدادات الموقع",
    saving: "جار الحفظ...",
    saved: "تم حفظ إعدادات الموقع.",
    saveError: "تعذر حفظ إعدادات الموقع. تحقق من الحقول وحاول مرة أخرى.",
    noChanges: "لا توجد تغييرات غير محفوظة.",
    unsaved: "لديك تغييرات غير محفوظة.",
    upload: "رفع صورة",
    uploading: "جار الرفع...",
    uploaded: "تم رفع الصورة. احفظ التغييرات لتثبيتها.",
    uploadError: "فشل رفع الصورة.",
    clear: "مسح",
    preview: "معاينة مباشرة",
    previewHint: "هذه معاينة أولية. صفحات الموقع العامة ستستخدم هذه الإعدادات لاحقاً.",
    helper: "هذه الإعدادات خاصة بهذا المركز وهي أساس صفحات الموقع العامة القادمة.",
    sections: {
      branding: "الهوية والعلامة",
      brandingHint: "الشعار وصورة الهيرو وألوان العلامة في موقعك العام.",
      content: "محتوى المركز",
      contentHint: "نصوص الموقع بالعربية والإنجليزية والعبرية.",
      contact: "التواصل",
      contactHint: "بيانات التواصل والعنوان التي تظهر للزوار.",
      business: "معلومات العمل",
      businessHint: "نص ساعات العمل وروابط التواصل الاجتماعي.",
    },
    fields: {
      addressAr: "العنوان بالعربية",
      addressEn: "العنوان بالإنجليزية",
      addressHe: "العنوان بالعبرية",
      coverImageUrl: "صورة الغلاف / الهيرو",
      email: "البريد الإلكتروني",
      facebookUrl: "رابط فيسبوك",
      fullDescriptionAr: "الوصف الكامل بالعربية",
      fullDescriptionEn: "الوصف الكامل بالإنجليزية",
      fullDescriptionHe: "الوصف الكامل بالعبرية",
      googleMapsUrl: "رابط خرائط Google",
      instagramUrl: "رابط إنستغرام",
      logoUrl: "شعار المركز",
      phone: "الهاتف",
      primaryColor: "اللون الأساسي",
      publicDescriptionAr: "الوصف المختصر بالعربية",
      publicDescriptionEn: "الوصف المختصر بالإنجليزية",
      publicDescriptionHe: "الوصف المختصر بالعبرية",
      secondaryColor: "اللون الثانوي",
      sloganAr: "الشعار النصي بالعربية",
      sloganEn: "الشعار النصي بالإنجليزية",
      sloganHe: "الشعار النصي بالعبرية",
      tiktokUrl: "رابط تيك توك",
      whatsappPhone: "واتساب",
      workingHoursAr: "ساعات العمل بالعربية",
      workingHoursEn: "ساعات العمل بالإنجليزية",
      workingHoursHe: "ساعات العمل بالعبرية",
    },
    langs: { ar: "العربية", en: "English", he: "עברית" },
    imageHint: "PNG أو JPG أو WebP أو SVG. يتم تحسين الصور تلقائياً.",
  },
  he: {
    title: "הגדרות אתר",
    subtitle: "הכינו את תוכן האתר, המיתוג ופרטי הקשר של המרכז.",
    loading: "טוען הגדרות אתר...",
    loadError: "לא ניתן לטעון את הגדרות האתר. נסו שוב.",
    save: "שמור הגדרות אתר",
    saving: "שומר...",
    saved: "הגדרות האתר נשמרו.",
    saveError: "לא ניתן לשמור את הגדרות האתר. בדקו את השדות ונסו שוב.",
    noChanges: "אין שינויים שלא נשמרו.",
    unsaved: "יש שינויים שלא נשמרו.",
    upload: "העלאת תמונה",
    uploading: "מעלה...",
    uploaded: "התמונה הועלתה. שמרו כדי להשאיר אותה.",
    uploadError: "העלאת התמונה נכשלה.",
    clear: "נקה",
    preview: "תצוגה מקדימה",
    previewHint: "זו תצוגת טיוטה. עמודי האתר הציבוריים ישתמשו בהגדרות האלה בהמשך.",
    helper: "ההגדרות שייכות למרכז הזה בלבד ומהוות בסיס לעמודי האתר הציבוריים העתידיים.",
    sections: {
      branding: "מיתוג",
      brandingHint: "לוגו, תמונת הירו וצבעי מותג לאתר הציבורי.",
      content: "תוכן המרכז",
      contentHint: "טקסטים מקומיים לערבית, אנגלית ועברית.",
      contact: "יצירת קשר",
      contactHint: "פרטי קשר וכתובת שיוצגו למבקרים.",
      business: "מידע עסקי",
      businessHint: "שעות פעילות וקישורים חברתיים לאתר.",
    },
    fields: {
      addressAr: "כתובת בערבית",
      addressEn: "כתובת באנגלית",
      addressHe: "כתובת בעברית",
      coverImageUrl: "תמונת כיסוי / הירו",
      email: "אימייל",
      facebookUrl: "קישור Facebook",
      fullDescriptionAr: "תיאור מלא בערבית",
      fullDescriptionEn: "תיאור מלא באנגלית",
      fullDescriptionHe: "תיאור מלא בעברית",
      googleMapsUrl: "קישור Google Maps",
      instagramUrl: "קישור Instagram",
      logoUrl: "לוגו המרכז",
      phone: "טלפון",
      primaryColor: "צבע ראשי",
      publicDescriptionAr: "תיאור קצר בערבית",
      publicDescriptionEn: "תיאור קצר באנגלית",
      publicDescriptionHe: "תיאור קצר בעברית",
      secondaryColor: "צבע משני",
      sloganAr: "סלוגן בערבית",
      sloganEn: "סלוגן באנגלית",
      sloganHe: "סלוגן בעברית",
      tiktokUrl: "קישור TikTok",
      whatsappPhone: "WhatsApp",
      workingHoursAr: "שעות פעילות בערבית",
      workingHoursEn: "שעות פעילות באנגלית",
      workingHoursHe: "שעות פעילות בעברית",
    },
    langs: { ar: "العربية", en: "English", he: "עברית" },
    imageHint: "PNG, JPG, WebP או SVG. התמונות עוברות אופטימיזציה אוטומטית.",
  },
};

const websiteLinkCopy: Record<
  SupportedLocale,
  {
    copiedLink: string;
    copyFailed: string;
    copyLink: string;
    hint: string;
    openWebsite: string;
    title: string;
    urlLabel: string;
  }
> = {
  en: {
    copiedLink: "Website link copied.",
    copyFailed: "Could not copy the link. Please copy it manually.",
    copyLink: "Copy link",
    hint: "Share this link with visitors. Custom domains are not connected yet.",
    openWebsite: "Open website",
    title: "Public website link",
    urlLabel: "Website URL",
  },
  ar: {
    copiedLink: "تم نسخ رابط الموقع.",
    copyFailed: "تعذر نسخ الرابط. يمكنك نسخه يدويًا.",
    copyLink: "نسخ الرابط",
    hint: "يمكنك مشاركة هذا الرابط مع الزوار. النطاقات الخاصة لم يتم ربطها بعد.",
    openWebsite: "فتح الموقع",
    title: "رابط الموقع العام",
    urlLabel: "رابط الموقع",
  },
  he: {
    copiedLink: "קישור האתר הועתק.",
    copyFailed: "לא ניתן להעתיק את הקישור. אפשר להעתיק אותו ידנית.",
    copyLink: "העתק קישור",
    hint: "אפשר לשתף את הקישור הזה עם מבקרים. דומיינים מותאמים עדיין לא חוברו.",
    openWebsite: "פתח אתר",
    title: "קישור לאתר הציבורי",
    urlLabel: "כתובת האתר",
  },
};

function normalizeForm(data: Partial<CenterPublicProfileData> | null | undefined): WebsiteForm {
  return {
    ...emptyForm,
    addressAr: data?.addressAr ?? "",
    addressEn: data?.addressEn ?? "",
    addressHe: data?.addressHe ?? "",
    coverImageUrl: data?.coverImageUrl ?? "",
    email: data?.email ?? "",
    facebookUrl: data?.facebookUrl ?? "",
    fullDescriptionAr: data?.fullDescriptionAr ?? "",
    fullDescriptionEn: data?.fullDescriptionEn ?? "",
    fullDescriptionHe: data?.fullDescriptionHe ?? "",
    googleMapsUrl: data?.googleMapsUrl ?? "",
    instagramUrl: data?.instagramUrl ?? "",
    logoUrl: data?.logoUrl ?? "",
    phone: data?.phone ?? "",
    primaryColor: data?.primaryColor ?? emptyForm.primaryColor,
    publicDescriptionAr: data?.publicDescriptionAr ?? "",
    publicDescriptionEn: data?.publicDescriptionEn ?? "",
    publicDescriptionHe: data?.publicDescriptionHe ?? "",
    secondaryColor: data?.secondaryColor ?? emptyForm.secondaryColor,
    sloganAr: data?.sloganAr ?? "",
    sloganEn: data?.sloganEn ?? "",
    sloganHe: data?.sloganHe ?? "",
    tiktokUrl: data?.tiktokUrl ?? "",
    whatsappPhone: data?.whatsappPhone ?? "",
    workingHoursAr: data?.workingHoursAr ?? "",
    workingHoursEn: data?.workingHoursEn ?? "",
    workingHoursHe: data?.workingHoursHe ?? "",
  };
}

function toPayload(form: WebsiteForm, builder?: WebsiteBuilderSettings): CenterPublicProfileData {
  const payload = Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value.trim() || null]),
  ) as CenterPublicProfileData;
  if (builder) {
    payload.websiteSectionOrder = builder.order;
    payload.websiteSectionVisibility = builder.visibility;
  }
  return payload;
}

function localizedValue(form: WebsiteForm, locale: SupportedLocale, key: "address" | "fullDescription" | "publicDescription" | "slogan" | "workingHours") {
  const suffix = locale === "ar" ? "Ar" : locale === "he" ? "He" : "En";
  const fallback = locale === "en" ? "Ar" : "En";
  return (
    form[`${key}${suffix}` as keyof WebsiteForm] ||
    form[`${key}${fallback}` as keyof WebsiteForm] ||
    form[`${key}Ar` as keyof WebsiteForm] ||
    ""
  );
}

function Field({
  dir,
  label,
  onChange,
  type = "text",
  value,
}: {
  dir?: "ltr" | "rtl";
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-bold text-[#24364f]">{label}</span>
      <input
        className="mt-1.5 h-11 w-full min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15"
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextArea({
  dir,
  label,
  onChange,
  rows = 3,
  value,
}: {
  dir?: "ltr" | "rtl";
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-bold text-[#24364f]">{label}</span>
      <textarea
        className="mt-1.5 w-full min-w-0 resize-y rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15"
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </label>
  );
}

function ImageField({
  currentUrl,
  label,
  t,
  type,
  onChange,
}: {
  currentUrl: string;
  label: string;
  t: Copy;
  type: "cover" | "logo";
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"done" | "error" | "idle" | "uploading">("idle");
  const [message, setMessage] = useState("");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setMessage("");
    try {
      const result = await uploadTenantCenterPublicImage(file, type);
      onChange(result.url);
      setStatus("done");
      setMessage(t.uploaded);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof UploadFailedError ? (error.details ?? error.message) : t.uploadError);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {currentUrl ? (
            <img alt="" className="h-full w-full object-contain" src={currentUrl} />
          ) : (
            <span className="text-xs font-semibold text-[#9AABB8]">{label}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#0B2D5C]">{label}</p>
          <p className="mt-0.5 text-xs text-[#66758a]">{t.imageHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFile}
              ref={inputRef}
              type="file"
            />
            <button
              className={buttonClassName("secondary", "sm")}
              disabled={status === "uploading"}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {status === "uploading" ? t.uploading : t.upload}
            </button>
            {currentUrl ? (
              <button
                className={buttonClassName("ghost", "sm")}
                onClick={() => onChange("")}
                type="button"
              >
                {t.clear}
              </button>
            ) : null}
          </div>
          {message ? (
            <p className={`mt-2 text-xs font-semibold ${status === "error" ? "text-rose-700" : "text-emerald-700"}`}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PublicWebsiteLinkCard({
  centerSlug,
  locale,
}: {
  centerSlug: string;
  locale: SupportedLocale;
}) {
  const labels = websiteLinkCopy[locale] ?? websiteLinkCopy.en;
  const [copyStatus, setCopyStatus] = useState<"error" | "idle" | "success">("idle");
  const path = `/c/${centerSlug}`;
  const websiteUrl =
    typeof window === "undefined"
      ? path
      : `${window.location.origin}${path}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-[#0B2D5C]">{labels.title}</p>
          <p className="mt-1 text-sm leading-6 text-[#66758a]">{labels.hint}</p>
          <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-xs font-bold text-[#66758a]">{labels.urlLabel}</p>
            <p
              className="mt-1 break-all text-sm font-bold text-[#132238]"
              dir="ltr"
              suppressHydrationWarning
            >
              {websiteUrl}
            </p>
          </div>
          {copyStatus !== "idle" ? (
            <p
              className={`mt-2 text-xs font-semibold ${
                copyStatus === "success" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {copyStatus === "success" ? labels.copiedLink : labels.copyFailed}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <a
            className={buttonClassName("primary", "md")}
            href={path}
            rel="noopener noreferrer"
            target="_blank"
          >
            {labels.openWebsite}
          </a>
          <button
            className={buttonClassName("secondary", "md")}
            onClick={() => void handleCopy()}
            type="button"
          >
            {labels.copyLink}
          </button>
        </div>
      </div>
    </AdminCard>
  );
}

function WebsiteSectionBuilder({
  builder,
  locale,
  onChange,
}: {
  builder: WebsiteBuilderSettings;
  locale: SupportedLocale;
  onChange: (next: WebsiteBuilderSettings) => void;
}) {
  const t = builderCopy[locale] ?? builderCopy.en;
  const [dragging, setDragging] = useState<WebsiteSectionKey | null>(null);

  function updateVisibility(key: WebsiteSectionKey, visible: boolean) {
    onChange({
      ...builder,
      visibility: { ...builder.visibility, [key]: visible },
    });
  }

  function dropOn(target: WebsiteSectionKey) {
    if (!dragging || dragging === target) return;
    const next = [...builder.order];
    const fromIndex = next.indexOf(dragging);
    const toIndex = next.indexOf(target);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange({ ...builder, order: next });
    setDragging(null);
  }

  return (
    <AdminCard className="p-4 sm:p-5">
      <AdminSectionHeader subtitle={t.sectionHint} title={t.sectionTitle} />
      <div className="mt-4 grid gap-2">
        {builder.order.map((key) => {
          const visible = builder.visibility[key] !== false;
          return (
            <div
              className="flex min-w-0 cursor-grab flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 transition hover:border-[#C8A45D] sm:flex-row sm:items-center sm:justify-between"
              draggable
              key={key}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDragging(key)}
              onDrop={() => dropOn(key)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black text-[#8A94A6]">
                  =
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#0B2D5C]">{t.labels[key]}</p>
                  <p className={`text-xs font-bold ${visible ? "text-emerald-700" : "text-slate-500"}`}>
                    {visible ? t.shown : t.hidden}
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-bold text-[#0B2D5C]">
                <input
                  checked={visible}
                  onChange={(event) => updateVisibility(key, event.target.checked)}
                  type="checkbox"
                />
                {visible ? t.shown : t.hidden}
              </label>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}

function WebsitePreview({
  centerName,
  form,
  locale,
  t,
}: {
  centerName: string;
  form: WebsiteForm;
  locale: SupportedLocale;
  t: Copy;
}) {
  const slogan = localizedValue(form, locale, "slogan");
  const description = localizedValue(form, locale, "publicDescription");
  const address = localizedValue(form, locale, "address");

  return (
    <AdminCard className="sticky top-4 min-w-0 overflow-hidden p-0">
      <div
        className="h-28 bg-[#0B2D5C]"
        style={{
          backgroundColor: form.primaryColor || "#0B2D5C",
          backgroundImage: form.coverImageUrl ? `url(${form.coverImageUrl})` : undefined,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div className="p-4">
        <div className="-mt-10 flex items-end gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
            {form.logoUrl ? (
              <img alt="" className="h-full w-full object-contain" src={form.logoUrl} />
            ) : (
              <span className="text-sm font-black text-[#0B2D5C]">
                {centerName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 pb-1">
            <p className="truncate text-base font-black text-[#0B2D5C]">{centerName}</p>
            {slogan ? <p className="truncate text-xs font-semibold text-[#C8A45D]">{slogan}</p> : null}
          </div>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#526176]">
          {description || t.previewHint}
        </p>
        <div className="mt-4 space-y-2 text-xs font-semibold text-[#66758a]">
          {form.whatsappPhone ? <p dir="ltr">WhatsApp: {form.whatsappPhone}</p> : null}
          {form.phone ? <p dir="ltr">Phone: {form.phone}</p> : null}
          {address ? <p>{address}</p> : null}
        </div>
        <div className="mt-4 flex gap-2">
          <span className="h-5 w-5 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: form.primaryColor }} />
          <span className="h-5 w-5 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: form.secondaryColor }} />
        </div>
      </div>
    </AdminCard>
  );
}

export function TenantWebsiteSettingsPage() {
  const { locale } = useLanguage();
  const activeLocale = locale as SupportedLocale;
  const t = copy[activeLocale] ?? copy.en;
  const [state, setState] = useState<"error" | "loading" | "ready">("loading");
  const [form, setForm] = useState<WebsiteForm>(emptyForm);
  const [saved, setSaved] = useState<WebsiteForm>(emptyForm);
  const [builder, setBuilder] = useState<WebsiteBuilderSettings>(() => normalizeBuilder(null));
  const [savedBuilder, setSavedBuilder] = useState<WebsiteBuilderSettings>(() => normalizeBuilder(null));
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    getTenantCenterPublicProfile()
      .then((response) => {
        if (!mounted) return;
        const next = normalizeForm(response.branding);
        const nextBuilder = normalizeBuilder(response.branding);
        setForm(next);
        setSaved(next);
        setBuilder(nextBuilder);
        setSavedBuilder(nextBuilder);
        setState("ready");
      })
      .catch(() => {
        if (mounted) setState("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(toPayload(form, builder)) !== JSON.stringify(toPayload(saved, savedBuilder)),
    [builder, form, saved, savedBuilder],
  );

  const setField = (key: keyof WebsiteForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  async function handleSave() {
    setSaveState("saving");
    setMessage(null);
    try {
      const response = await updateTenantCenterPublicProfile(toPayload(form, builder));
      const next = normalizeForm(response.branding);
      const nextBuilder = normalizeBuilder(response.branding);
      setForm(next);
      setSaved(next);
      setBuilder(nextBuilder);
      setSavedBuilder(nextBuilder);
      setMessage({ tone: "success", text: t.saved });
    } catch {
      setMessage({ tone: "error", text: t.saveError });
    } finally {
      setSaveState("idle");
    }
  }

  return (
    <CenterAdminShell
      activeNav="website"
      requiredPermission="settings:view"
      subtitle={() => t.subtitle}
      title={() => t.title}
    >
      {({ session }) => {
        if (state === "loading") return <AdminState className="mt-5" loading title={t.loading} />;
        if (state === "error") return <AdminState className="mt-5" title={t.loadError} tone="error" />;

        return (
          <div className="mt-5 min-w-0 space-y-5">
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-[#0B2D5C]">
              {t.helper}
            </p>
            <PublicWebsiteLinkCard centerSlug={session.center.slug} locale={activeLocale} />
            <WebsiteSectionBuilder
              builder={builder}
              locale={activeLocale}
              onChange={(next) => {
                setBuilder(next);
                setMessage(null);
              }}
            />
            {message ? (
              <p
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  message.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {message.text}
              </p>
            ) : null}

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-5">
                <AdminCard className="p-4 sm:p-5">
                  <AdminSectionHeader subtitle={t.sections.brandingHint} title={t.sections.branding} />
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <ImageField
                      currentUrl={form.logoUrl}
                      label={t.fields.logoUrl}
                      onChange={(value) => setField("logoUrl", value)}
                      t={t}
                      type="logo"
                    />
                    <ImageField
                      currentUrl={form.coverImageUrl}
                      label={t.fields.coverImageUrl}
                      onChange={(value) => setField("coverImageUrl", value)}
                      t={t}
                      type="cover"
                    />
                    <Field label={t.fields.primaryColor} onChange={(value) => setField("primaryColor", value)} type="color" value={form.primaryColor} />
                    <Field label={t.fields.secondaryColor} onChange={(value) => setField("secondaryColor", value)} type="color" value={form.secondaryColor} />
                  </div>
                </AdminCard>

                <AdminCard className="p-4 sm:p-5">
                  <AdminSectionHeader subtitle={t.sections.contentHint} title={t.sections.content} />
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    {(["ar", "en", "he"] as const).map((lang) => {
                      const suffix = lang === "ar" ? "Ar" : lang === "he" ? "He" : "En";
                      const dir = lang === "en" ? "ltr" : "rtl";
                      return (
                        <div className="min-w-0 space-y-4 rounded-xl border border-[#E5E7EB] p-3" key={lang}>
                          <p className="text-sm font-black text-[#0B2D5C]">{t.langs[lang]}</p>
                          <Field dir={dir} label={t.fields[`slogan${suffix}` as keyof WebsiteForm]} onChange={(value) => setField(`slogan${suffix}` as keyof WebsiteForm, value)} value={form[`slogan${suffix}` as keyof WebsiteForm]} />
                          <TextArea dir={dir} label={t.fields[`publicDescription${suffix}` as keyof WebsiteForm]} onChange={(value) => setField(`publicDescription${suffix}` as keyof WebsiteForm, value)} value={form[`publicDescription${suffix}` as keyof WebsiteForm]} />
                          <TextArea dir={dir} label={t.fields[`fullDescription${suffix}` as keyof WebsiteForm]} onChange={(value) => setField(`fullDescription${suffix}` as keyof WebsiteForm, value)} rows={5} value={form[`fullDescription${suffix}` as keyof WebsiteForm]} />
                        </div>
                      );
                    })}
                  </div>
                </AdminCard>

                <AdminCard className="p-4 sm:p-5">
                  <AdminSectionHeader subtitle={t.sections.contactHint} title={t.sections.contact} />
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field dir="ltr" label={t.fields.whatsappPhone} onChange={(value) => setField("whatsappPhone", value)} value={form.whatsappPhone} />
                    <Field dir="ltr" label={t.fields.phone} onChange={(value) => setField("phone", value)} value={form.phone} />
                    <Field dir="ltr" label={t.fields.email} onChange={(value) => setField("email", value)} type="email" value={form.email} />
                    <Field dir="ltr" label={t.fields.googleMapsUrl} onChange={(value) => setField("googleMapsUrl", value)} value={form.googleMapsUrl} />
                    <TextArea dir="rtl" label={t.fields.addressAr} onChange={(value) => setField("addressAr", value)} value={form.addressAr} />
                    <TextArea dir="ltr" label={t.fields.addressEn} onChange={(value) => setField("addressEn", value)} value={form.addressEn} />
                    <TextArea dir="rtl" label={t.fields.addressHe} onChange={(value) => setField("addressHe", value)} value={form.addressHe} />
                  </div>
                </AdminCard>

                <AdminCard className="p-4 sm:p-5">
                  <AdminSectionHeader subtitle={t.sections.businessHint} title={t.sections.business} />
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TextArea dir="rtl" label={t.fields.workingHoursAr} onChange={(value) => setField("workingHoursAr", value)} value={form.workingHoursAr} />
                    <TextArea dir="ltr" label={t.fields.workingHoursEn} onChange={(value) => setField("workingHoursEn", value)} value={form.workingHoursEn} />
                    <TextArea dir="rtl" label={t.fields.workingHoursHe} onChange={(value) => setField("workingHoursHe", value)} value={form.workingHoursHe} />
                    <Field dir="ltr" label={t.fields.facebookUrl} onChange={(value) => setField("facebookUrl", value)} value={form.facebookUrl} />
                    <Field dir="ltr" label={t.fields.instagramUrl} onChange={(value) => setField("instagramUrl", value)} value={form.instagramUrl} />
                    <Field dir="ltr" label={t.fields.tiktokUrl} onChange={(value) => setField("tiktokUrl", value)} value={form.tiktokUrl} />
                  </div>
                </AdminCard>
              </div>

              <aside className="min-w-0 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-[#0B2D5C]">{t.preview}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#66758a]">{t.previewHint}</p>
                </div>
                <WebsitePreview
                  centerName={session.center.name}
                  form={form}
                  locale={activeLocale}
                  t={t}
                />
              </aside>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-10px_24px_rgba(11,45,92,0.06)] backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#66758a]">
                  {isDirty ? t.unsaved : t.noChanges}
                </p>
                <button
                  className={buttonClassName("primary", "md")}
                  disabled={!isDirty || saveState === "saving"}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {saveState === "saving" ? t.saving : t.save}
                </button>
              </div>
            </div>
          </div>
        );
      }}
    </CenterAdminShell>
  );
}
