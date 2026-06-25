"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { CenterBranch, CenterBranchPayload } from "@/lib/api/center-public-profile";
import { UploadFailedError } from "@/lib/api/system-settings";

export type PublicProfileBranding = {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
  publicDescriptionAr?: string | null;
  publicDescriptionEn?: string | null;
  publicDescriptionHe?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  cityHe?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  addressHe?: string | null;
  globalWhatsappPhone?: string | null;
  whatsappPhone?: string | null;
};

type Props = {
  branding: PublicProfileBranding | null;
  onLoad: () => Promise<PublicProfileBranding | null>;
  onSave: (data: PublicProfileBranding) => Promise<void>;
  onUploadImage: (file: File, type: string) => Promise<{ url: string }>;
  onLoadBranches?: () => Promise<CenterBranch[]>;
  onCreateBranch?: (data: CenterBranchPayload) => Promise<CenterBranch>;
  onUpdateBranch?: (id: string, data: CenterBranchPayload) => Promise<CenterBranch>;
  onDeleteBranch?: (id: string) => Promise<CenterBranch>;
  onReorderBranches?: (branches: Array<{ id: string; sortOrder: number }>) => Promise<CenterBranch[]>;
};

const copy = {
  en: {
    title: "Public Profile",
    logoImage: "Center Logo",
    logoHint: "Recommended: 300×120 px, transparent PNG or SVG. Shown on center cards and profile.",
    coverImage: "Cover Image",
    coverHint: "Recommended: 1920×900 px, landscape banner.",
    cardImage: "Card Image",
    cardHint: "Recommended: 1200×600 px, used on the centers directory card.",
    imageHelper: "PNG, JPG, WebP, SVG — up to 8 MB, optimized automatically.",
    uploadBtn: "Upload Image",
    uploading: "Uploading…",
    uploaded: "Image uploaded.",
    uploadError: "Upload failed.",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    descriptionHe: "Description (Hebrew)",
    cityEn: "City (English)",
    cityAr: "City (Arabic)",
    cityHe: "City (Hebrew)",
    addressEn: "Address (English)",
    addressAr: "Address (Arabic)",
    addressHe: "Address (Hebrew)",
    globalWhatsapp: "Primary center WhatsApp",
    whatsapp: "Website WhatsApp (optional)",
    whatsappFallbackHelper: "If left empty, the primary center WhatsApp will be used.",
    whatsappHelper: "Optional website override. International format e.g. 970598000000",
    save: "Save Public Profile",
    saving: "Saving…",
    saved: "Saved.",
    saveError: "Save failed. Please try again.",
    loading: "Loading…",
    loadError: "Could not load the center's public profile.",
    retry: "Retry",
    currentImage: "Current image:",
    clearImage: "Remove",
    chars: (n: number, max: number) => `${n}/${max}`,
  },
  ar: {
    title: "الملف العام",
    logoImage: "شعار المركز",
    logoHint: "المقاس المفضل: 300×120 بكسل، خلفية شفافة PNG أو SVG. يظهر في بطاقة المركز وصفحته.",
    coverImage: "صورة الغلاف",
    coverHint: "المقاس المفضل: 1920×900 بكسل، صورة أفقية.",
    cardImage: "صورة البطاقة",
    cardHint: "المقاس المفضل: 1200×600 بكسل، تُستخدم في بطاقة المركز.",
    imageHelper: "PNG، JPG، WebP، SVG — حتى 8 ميغابايت، تُحسَّن تلقائياً.",
    uploadBtn: "رفع صورة",
    uploading: "جارٍ الرفع…",
    uploaded: "تم رفع الصورة.",
    uploadError: "فشل الرفع.",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    descriptionHe: "الوصف (عبري)",
    cityEn: "المدينة (إنجليزي)",
    cityAr: "المدينة (عربي)",
    cityHe: "المدينة (عبري)",
    addressEn: "العنوان (إنجليزي)",
    addressAr: "العنوان (عربي)",
    addressHe: "العنوان (عبري)",
    globalWhatsapp: "واتساب المركز الأساسي",
    whatsapp: "واتساب الموقع (اختياري)",
    whatsappFallbackHelper: "في حال تركه فارغًا سيتم استخدام رقم واتساب المركز الأساسي.",
    whatsappHelper: "اختياري للموقع فقط. صيغة دولية مثل 970598000000",
    save: "حفظ الملف العام",
    saving: "جارٍ الحفظ…",
    saved: "تم الحفظ.",
    saveError: "فشل الحفظ. حاول مرة أخرى.",
    loading: "جارٍ التحميل…",
    loadError: "تعذر تحميل الملف العام للمركز.",
    retry: "إعادة المحاولة",
    currentImage: "الصورة الحالية:",
    clearImage: "إزالة",
    chars: (n: number, max: number) => `${n}/${max}`,
  },
  he: {
    title: "פרופיל ציבורי",
    logoImage: "לוגו המרכז",
    logoHint: "מומלץ: 300×120 פיקסל, PNG או SVG שקוף. מוצג בכרטיס המרכז ובפרופיל.",
    coverImage: "תמונת כיסוי",
    coverHint: "מומלץ: 1920×900 פיקסל, תמונה רחבה.",
    cardImage: "תמונת כרטיס",
    cardHint: "מומלץ: 1200×600 פיקסל, מוצגת בכרטיס המרכז.",
    imageHelper: "PNG, JPG, WebP, SVG — עד 8 MB, מותאם אוטומטית.",
    uploadBtn: "העלה תמונה",
    uploading: "מעלה…",
    uploaded: "התמונה הועלתה.",
    uploadError: "ההעלאה נכשלה.",
    descriptionEn: "תיאור (אנגלית)",
    descriptionAr: "תיאור (ערבית)",
    descriptionHe: "תיאור (עברית)",
    cityEn: "עיר (אנגלית)",
    cityAr: "עיר (ערבית)",
    cityHe: "עיר (עברית)",
    addressEn: "כתובת (אנגלית)",
    addressAr: "כתובת (ערבית)",
    addressHe: "כתובת (עברית)",
    globalWhatsapp: "WhatsApp מרכזי",
    whatsapp: "WhatsApp לאתר (אופציונלי)",
    whatsappFallbackHelper: "אם השדה יישאר ריק, ייעשה שימוש ב-WhatsApp המרכזי.",
    whatsappHelper: "אופציונלי לאתר בלבד. פורמט בינלאומי למשל 970598000000",
    save: "שמור פרופיל ציבורי",
    saving: "שומר…",
    saved: "נשמר.",
    saveError: "השמירה נכשלה. נסה שנית.",
    loading: "טוען…",
    loadError: "לא ניתן לטעון את הפרופיל הציבורי של המרכז.",
    retry: "נסה שנית",
    currentImage: "תמונה נוכחית:",
    clearImage: "הסר",
    chars: (n: number, max: number) => `${n}/${max}`,
  },
} as const;

type CopyLocale = keyof typeof copy;
type FieldErrors = Record<string, string>;
type SettingsSection =
  | "profile"
  | "identity"
  | "branches"
  | "hours"
  | "links"
  | "seo"
  | "site";
type LocaleTab = "ar" | "en" | "he";

const branchCopy = {
  en: {
    title: "Branches and Addresses",
    intro: "Use branches when the center has more than one location or contact number. Public pages prefer active branches and keep the old fields as fallback.",
    add: "Add Branch",
    branchName: "Branch name",
    cityAr: "City (Arabic)",
    cityEn: "City (English)",
    cityHe: "City (Hebrew)",
    addressAr: "Address (Arabic)",
    addressEn: "Address (English)",
    addressHe: "Address (Hebrew)",
    phone: "Phone",
    whatsapp: "WhatsApp",
    mapsUrl: "Google Maps URL",
    hoursAr: "Working hours (Arabic)",
    hoursEn: "Working hours (English)",
    hoursHe: "Working hours (Hebrew)",
    main: "Main branch",
    notMain: "Regular branch",
    active: "Active",
    inactiveStatus: "Inactive",
    save: "Save branch",
    saved: "Branch saved.",
    remove: "Deactivate",
    empty: "No branches yet.",
    loadError: "Could not load branches.",
    saveError: "Branch save failed.",
    inactive: "Inactive",
    moveUp: "Up",
    moveDown: "Down",
  },
  ar: {
    title: "الفروع والعناوين",
    intro: "استخدم الفروع عندما يكون للمركز أكثر من موقع أو رقم تواصل. الصفحات العامة تفضّل الفروع النشطة وتبقي الحقول القديمة كبديل.",
    add: "إضافة فرع",
    branchName: "اسم الفرع",
    cityAr: "المدينة (عربي)",
    cityEn: "المدينة (إنجليزي)",
    cityHe: "المدينة (عبري)",
    addressAr: "العنوان (عربي)",
    addressEn: "العنوان (إنجليزي)",
    addressHe: "العنوان (عبري)",
    phone: "رقم الهاتف",
    whatsapp: "واتساب",
    mapsUrl: "رابط Google Maps",
    hoursAr: "ساعات العمل (عربي)",
    hoursEn: "ساعات العمل (إنجليزي)",
    hoursHe: "ساعات العمل (عبري)",
    main: "الفرع الرئيسي",
    notMain: "فرع عادي",
    active: "نشط",
    inactiveStatus: "غير نشط",
    save: "حفظ الفرع",
    saved: "تم حفظ الفرع.",
    remove: "تعطيل",
    empty: "لا توجد فروع بعد.",
    loadError: "تعذر تحميل الفروع.",
    saveError: "فشل حفظ الفرع.",
    inactive: "غير نشط",
    moveUp: "أعلى",
    moveDown: "أسفل",
  },
  he: {
    title: "סניפים וכתובות",
    intro: "השתמשו בסניפים כאשר למרכז יש יותר ממיקום או מספר קשר אחד. האתר הציבורי יעדיף סניפים פעילים וישמור את השדות הישנים כגיבוי.",
    add: "הוסף סניף",
    branchName: "שם הסניף",
    cityAr: "עיר (ערבית)",
    cityEn: "עיר (אנגלית)",
    cityHe: "עיר (עברית)",
    addressAr: "כתובת (ערבית)",
    addressEn: "כתובת (אנגלית)",
    addressHe: "כתובת (עברית)",
    phone: "טלפון",
    whatsapp: "WhatsApp",
    mapsUrl: "קישור Google Maps",
    hoursAr: "שעות פעילות (ערבית)",
    hoursEn: "שעות פעילות (אנגלית)",
    hoursHe: "שעות פעילות (עברית)",
    main: "סניף ראשי",
    notMain: "סניף רגיל",
    active: "פעיל",
    inactiveStatus: "לא פעיל",
    save: "שמור סניף",
    saved: "הסניף נשמר.",
    remove: "השבת",
    empty: "אין סניפים עדיין.",
    loadError: "לא ניתן לטעון סניפים.",
    saveError: "שמירת הסניף נכשלה.",
    inactive: "לא פעיל",
    moveUp: "למעלה",
    moveDown: "למטה",
  },
} as const;

type BranchDraft = CenterBranch & { isNew?: boolean; saveState?: "idle" | "saving" | "saved" | "error"; errors?: FieldErrors };

const settingsUxCopy = {
  en: {
    advanced: "Advanced settings",
    branchDetails: "Edit details",
    branchSummary: "Branch summary",
    collapsedHint: "Open a branch only when you need to edit its full details.",
    emptyValue: "Not set",
    langs: { ar: "العربية", en: "English", he: "עברית" },
    less: "Hide details",
    seoHint: "SEO has a dedicated page so metadata stays out of the daily settings form.",
    seoOpen: "Open SEO",
    siteHint: "Homepage sections, ordering, and visibility are managed in Website settings.",
    siteOpen: "Open website settings",
    sections: {
      branches: "Branches",
      hours: "Working hours",
      identity: "Visual identity",
      links: "Links & social",
      profile: "Public profile",
      seo: "SEO",
      site: "Website settings",
    },
    sectionDescriptions: {
      branches: "Manage locations as compact cards with full details on demand.",
      hours: "Keep fallback working-hours copy for the public profile.",
      identity: "Logo, cover, and card images used across public pages.",
      links: "Fallback WhatsApp and contact links for the public profile.",
      profile: "Core public copy and fallback location text.",
      seo: "Search metadata lives in the SEO workspace.",
      site: "Control homepage sections from the website builder workspace.",
    },
  },
  ar: {
    advanced: "إعدادات متقدمة",
    branchDetails: "تعديل التفاصيل",
    branchSummary: "ملخص الفرع",
    collapsedHint: "افتح الفرع فقط عند الحاجة لتعديل التفاصيل الكاملة.",
    emptyValue: "غير محدد",
    langs: { ar: "العربية", en: "English", he: "עברית" },
    less: "إخفاء التفاصيل",
    seoHint: "إعدادات SEO لها صفحة مستقلة حتى لا تزحم نموذج الإعدادات اليومية.",
    seoOpen: "فتح SEO",
    siteHint: "ترتيب أقسام الموقع وظهورها يدار من إعدادات الموقع.",
    siteOpen: "فتح إعدادات الموقع",
    sections: {
      branches: "الفروع",
      hours: "أوقات العمل",
      identity: "الهوية البصرية",
      links: "الروابط والسوشال",
      profile: "الملف العام",
      seo: "SEO",
      site: "إعدادات الموقع",
    },
    sectionDescriptions: {
      branches: "إدارة المواقع كبطاقات مختصرة مع التفاصيل عند الحاجة.",
      hours: "نص احتياطي لأوقات العمل في الملف العام.",
      identity: "الشعار والغلاف وصورة البطاقة المستخدمة في الصفحات العامة.",
      links: "روابط التواصل الأساسية للملف العام.",
      profile: "النصوص العامة ومعلومات الموقع الاحتياطية.",
      seo: "بيانات البحث موجودة في مساحة SEO المخصصة.",
      site: "تحكم بأقسام الصفحة الرئيسية من إعدادات الموقع.",
    },
  },
  he: {
    advanced: "הגדרות מתקדמות",
    branchDetails: "עריכת פרטים",
    branchSummary: "תקציר סניף",
    collapsedHint: "פתחו סניף רק כשצריך לערוך את כל הפרטים.",
    emptyValue: "לא הוגדר",
    langs: { ar: "العربية", en: "English", he: "עברית" },
    less: "הסתר פרטים",
    seoHint: "הגדרות SEO נמצאות בעמוד ייעודי כדי לא להעמיס על ההגדרות היומיומיות.",
    seoOpen: "פתח SEO",
    siteHint: "סדר אזורי האתר והנראות שלהם מנוהלים בהגדרות האתר.",
    siteOpen: "פתח הגדרות אתר",
    sections: {
      branches: "סניפים",
      hours: "שעות פעילות",
      identity: "זהות חזותית",
      links: "קישורים וחברתי",
      profile: "פרופיל ציבורי",
      seo: "SEO",
      site: "הגדרות אתר",
    },
    sectionDescriptions: {
      branches: "ניהול מיקומים ככרטיסים קצרים עם פרטים מלאים לפי צורך.",
      hours: "טקסט שעות פעילות חלופי לפרופיל הציבורי.",
      identity: "לוגו, תמונת כיסוי ותמונת כרטיס לעמודים הציבוריים.",
      links: "קישורי קשר בסיסיים לפרופיל הציבורי.",
      profile: "טקסט ציבורי ומידע מיקום חלופי.",
      seo: "מטא-דאטה לחיפוש נמצא באזור SEO ייעודי.",
      site: "שליטה באזורי דף הבית דרך הגדרות האתר.",
    },
  },
} as const;

function emptyBranchDraft(sortOrder: number): BranchDraft {
  return {
    id: `new-${Date.now()}`,
    name: "",
    cityAr: null,
    cityEn: null,
    cityHe: null,
    addressAr: null,
    addressEn: null,
    addressHe: null,
    phone: null,
    whatsapp: null,
    mapsUrl: null,
    workingHoursTextAr: null,
    workingHoursTextEn: null,
    workingHoursTextHe: null,
    isMain: false,
    isActive: true,
    sortOrder,
    isNew: true,
    saveState: "idle",
  };
}

function toBranchPayload(branch: BranchDraft): CenterBranchPayload {
  return {
    name: branch.name.trim(),
    cityAr: branch.cityAr?.trim() || null,
    cityEn: branch.cityEn?.trim() || null,
    cityHe: branch.cityHe?.trim() || null,
    addressAr: branch.addressAr?.trim() || null,
    addressEn: branch.addressEn?.trim() || null,
    addressHe: branch.addressHe?.trim() || null,
    phone: branch.phone?.trim() || null,
    whatsapp: branch.whatsapp?.trim() || null,
    mapsUrl: branch.mapsUrl?.trim() || null,
    workingHoursTextAr: branch.workingHoursTextAr?.trim() || null,
    workingHoursTextEn: branch.workingHoursTextEn?.trim() || null,
    workingHoursTextHe: branch.workingHoursTextHe?.trim() || null,
    isMain: branch.isMain,
    isActive: branch.isActive,
    sortOrder: branch.sortOrder,
  };
}

function ImageUploadField({
  label,
  hint,
  helper,
  currentUrl,
  uploadLabel,
  uploadingLabel,
  uploadedLabel,
  errorLabel,
  clearLabel,
  onUpload,
  onClear,
}: {
  label: string;
  hint: string;
  helper: string;
  currentUrl: string | null | undefined;
  uploadLabel: string;
  uploadingLabel: string;
  uploadedLabel: string;
  errorLabel: string;
  clearLabel: string;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");
    try {
      await onUpload(file);
      setStatus("done");
    } catch (err) {
      const msg =
        err instanceof UploadFailedError
          ? (err.details ?? err.message)
          : errorLabel;
      setErrorMsg(msg);
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="col-span-full min-w-0">
      <p className="text-sm font-medium text-[#24364f]">{label}</p>
      <p className="mt-0.5 text-xs text-[#66758a]">{hint}</p>

      {currentUrl && (
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
          <img
            alt=""
            className="h-16 max-w-[200px] rounded-md border border-[#E5E7EB] object-contain bg-[#F8FAFC]"
            src={currentUrl}
          />
          <button
            className="text-xs font-medium text-[#B42318] underline-offset-2 hover:underline"
            onClick={onClear}
            type="button"
          >
            {clearLabel}
          </button>
        </div>
      )}

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
        <input
          accept="image/*"
          className="sr-only"
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
          {status === "uploading" ? uploadingLabel : uploadLabel}
        </button>
        {status === "done" && (
          <span className="text-xs font-medium text-emerald-700">{uploadedLabel}</span>
        )}
        {status === "error" && (
          <span className="text-xs font-medium text-[#B42318]">{errorMsg || errorLabel}</span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-[#9AABB8]">{helper}</p>
    </div>
  );
}

function TextareaField({
  label,
  value,
  maxLen,
  dir,
  charsLabel,
  onChange,
  error,
}: {
  label: string;
  value: string;
  maxLen: number;
  dir: "ltr" | "rtl";
  charsLabel: (n: number, max: number) => string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="col-span-full min-w-0 sm:col-span-1">
      <label className="block min-w-0">
        <span className="text-sm font-medium text-[#24364f]">{label}</span>
        <textarea
          className={`mt-2 min-h-[90px] w-full min-w-0 resize-y rounded-md border px-3 py-2.5 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12 ${error ? "border-[#B42318]" : "border-[#E5E7EB]"}`}
          dir={dir}
          maxLength={maxLen}
          onChange={(e) => onChange(e.target.value)}
          value={value}
        />
        <div className="flex min-w-0 items-center justify-between">
          {error ? (
            <p className="text-xs font-medium text-[#B42318]">{error}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-[#9AABB8]">{charsLabel(value.length, maxLen)}</p>
        </div>
      </label>
    </div>
  );
}

function InputField({
  label,
  value,
  dir,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="col-span-full min-w-0 sm:col-span-1">
      <label className="block min-w-0">
        <span className="text-sm font-medium text-[#24364f]">{label}</span>
        <input
          className={`mt-2 h-11 w-full min-w-0 rounded-md border px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12 ${error ? "border-[#B42318]" : "border-[#E5E7EB]"}`}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {error && <p className="mt-1 text-xs font-medium text-[#B42318]">{error}</p>}
      </label>
    </div>
  );
}

function SectionButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-w-0 rounded-xl border px-4 py-3 text-start transition ${
        active
          ? "border-[#0B2D5C] bg-[#F2F7FF] shadow-sm"
          : "border-[#E5E7EB] bg-white hover:border-[#C8D6E8] hover:bg-[#F8FAFC]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block truncate text-sm font-black text-[#0B2D5C]">
        {label}
      </span>
      <span className="mt-1 line-clamp-2 text-xs leading-5 text-[#66758a]">
        {description}
      </span>
    </button>
  );
}

function LanguageTabs({
  active,
  labels,
  onChange,
}: {
  active: LocaleTab;
  labels: Record<LocaleTab, string>;
  onChange: (lang: LocaleTab) => void;
}) {
  const tabs: LocaleTab[] = ["ar", "en", "he"];

  return (
    <div className="inline-flex max-w-full min-w-0 rounded-lg border border-[#DDE6F2] bg-[#F8FAFC] p-1">
      {tabs.map((tab) => (
        <button
          className={`min-h-9 rounded-md px-3 text-sm font-bold transition ${
            active === tab
              ? "bg-white text-[#0B2D5C] shadow-sm"
              : "text-[#66758a] hover:text-[#0B2D5C]"
          }`}
          key={tab}
          onClick={() => onChange(tab)}
          type="button"
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}

export function CenterPublicProfileSection({
  branding: initialBranding,
  onLoad,
  onSave,
  onUploadImage,
  onLoadBranches,
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
  onReorderBranches,
}: Props) {
  const { locale } = useLanguage();
  const c = copy[(locale as CopyLocale) ?? "en"] ?? copy.en;
  const bc = branchCopy[(locale as CopyLocale) ?? "en"] ?? branchCopy.en;
  const ux = settingsUxCopy[(locale as CopyLocale) ?? "en"] ?? settingsUxCopy.en;

  // Start as "loading" immediately when branding must be fetched, avoiding a flash of the empty form.
  const [loadStatus, setLoadStatus] = useState<"loading" | "done" | "error">(
    initialBranding === null ? "loading" : "done",
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [branches, setBranches] = useState<BranchDraft[]>([]);
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [activeLang, setActiveLang] = useState<LocaleTab>(
    locale === "en" || locale === "he" ? locale : "ar",
  );
  const [expandedBranchIds, setExpandedBranchIds] = useState<Record<string, boolean>>({});
  const [branchLoadStatus, setBranchLoadStatus] = useState<"idle" | "loading" | "done" | "error">(
    onLoadBranches ? "loading" : "idle",
  );

  const [logoUrl, setLogoUrl] = useState(initialBranding?.logoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialBranding?.coverImageUrl ?? "");
  const [cardImageUrl, setCardImageUrl] = useState(initialBranding?.cardImageUrl ?? "");
  const [descEn, setDescEn] = useState(initialBranding?.publicDescriptionEn ?? "");
  const [descAr, setDescAr] = useState(initialBranding?.publicDescriptionAr ?? "");
  const [descHe, setDescHe] = useState(initialBranding?.publicDescriptionHe ?? "");
  const [cityEn, setCityEn] = useState(initialBranding?.cityEn ?? "");
  const [cityAr, setCityAr] = useState(initialBranding?.cityAr ?? "");
  const [cityHe, setCityHe] = useState(initialBranding?.cityHe ?? "");
  const [addressEn, setAddressEn] = useState(initialBranding?.addressEn ?? "");
  const [addressAr, setAddressAr] = useState(initialBranding?.addressAr ?? "");
  const [addressHe, setAddressHe] = useState(initialBranding?.addressHe ?? "");
  const [globalWhatsapp, setGlobalWhatsapp] = useState(initialBranding?.globalWhatsappPhone ?? "");
  const [whatsapp, setWhatsapp] = useState(initialBranding?.whatsappPhone ?? "");

  const sectionOrder: SettingsSection[] = [
    "profile",
    "identity",
    "branches",
    "hours",
    "links",
    "seo",
    "site",
  ];

  function applyBranding(b: PublicProfileBranding | null) {
    if (!b) return;
    setLogoUrl(b.logoUrl ?? "");
    setCoverImageUrl(b.coverImageUrl ?? "");
    setCardImageUrl(b.cardImageUrl ?? "");
    setDescEn(b.publicDescriptionEn ?? "");
    setDescAr(b.publicDescriptionAr ?? "");
    setDescHe(b.publicDescriptionHe ?? "");
    setCityEn(b.cityEn ?? "");
    setCityAr(b.cityAr ?? "");
    setCityHe(b.cityHe ?? "");
    setAddressEn(b.addressEn ?? "");
    setAddressAr(b.addressAr ?? "");
    setAddressHe(b.addressHe ?? "");
    setGlobalWhatsapp(b.globalWhatsappPhone ?? "");
    setWhatsapp(b.whatsappPhone ?? "");
  }

  function runLoad() {
    setLoadStatus("loading");
    onLoad()
      .then((b) => {
        // b is null when the center has no branding record yet — that is valid; show the empty form.
        applyBranding(b);
        setLoadStatus("done");
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[CenterPublicProfileSection] onLoad failed:", err);
        }
        setLoadStatus("error");
      });
  }

  function runBranchLoad() {
    if (!onLoadBranches) return;
    setBranchLoadStatus("loading");
    onLoadBranches()
      .then((rows) => {
        setBranches(rows.map((row) => ({ ...row, saveState: "idle" })));
        setBranchLoadStatus("done");
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[CenterPublicProfileSection] branch load failed:", err);
        }
        setBranchLoadStatus("error");
      });
  }

  useEffect(() => {
    if (initialBranding !== null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runLoad();
  }, []);

  useEffect(() => {
    runBranchLoad();
  }, []);

  function updateBranchDraft(id: string, patch: Partial<BranchDraft>) {
    setBranches((current) =>
      current.map((branch) => {
        if (branch.id !== id) return branch;
        const next = { ...branch, ...patch, saveState: "idle" as const };
        if (patch.isMain === true) {
          return { ...next, isActive: true };
        }
        return next;
      }).map((branch) => (patch.isMain === true && branch.id !== id ? { ...branch, isMain: false } : branch)),
    );
  }

  function addBranchDraft() {
    const draft = emptyBranchDraft(
      branches.length ? Math.max(...branches.map((b) => b.sortOrder)) + 1 : 0,
    );
    setBranches((current) => [
      ...current,
      draft,
    ]);
    setExpandedBranchIds((current) => ({ ...current, [draft.id]: true }));
  }

  async function saveBranch(branch: BranchDraft) {
    if (!onCreateBranch || !onUpdateBranch) return;
    setBranches((current) =>
      current.map((item) =>
        item.id === branch.id ? { ...item, saveState: "saving", errors: {} } : item,
      ),
    );
    try {
      const payload = toBranchPayload(branch);
      const saved = branch.isNew
        ? await onCreateBranch(payload)
        : await onUpdateBranch(branch.id, payload);
      setBranches((current) =>
        current
          .filter((item) => item.id !== branch.id || !branch.isNew)
          .map((item) => {
            if (item.id === branch.id) return { ...saved, saveState: "saved" as const };
            return saved.isMain ? { ...item, isMain: false, saveState: "idle" as const } : item;
          })
          .concat(branch.isNew ? [{ ...saved, saveState: "saved" as const }] : []),
      );
    } catch (err) {
      const typedErr = err as { errors?: FieldErrors };
      setBranches((current) =>
        current.map((item) =>
          item.id === branch.id
            ? { ...item, saveState: "error", errors: typedErr.errors ?? {} }
            : item,
        ),
      );
    }
  }

  async function deactivateBranch(branch: BranchDraft) {
    if (branch.isNew) {
      setBranches((current) => current.filter((item) => item.id !== branch.id));
      return;
    }
    if (!onDeleteBranch) return;
    const saved = await onDeleteBranch(branch.id);
    setBranches((current) =>
      current.map((item) =>
        item.id === branch.id ? { ...saved, saveState: "idle" } : item,
      ),
    );
  }

  async function moveBranch(index: number, direction: -1 | 1) {
    const next = [...branches];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const reordered = next.map((branch, idx) => ({ ...branch, sortOrder: idx }));
    setBranches(reordered);
    if (onReorderBranches) {
      const saved = await onReorderBranches(
        reordered.filter((branch) => !branch.isNew).map((branch) => ({ id: branch.id, sortOrder: branch.sortOrder })),
      );
      setBranches((current) => {
        const draftRows = current.filter((branch) => branch.isNew);
        return [...saved.map((row) => ({ ...row, saveState: "idle" as const })), ...draftRows];
      });
    }
  }

  async function handleSave() {
    setSaveStatus("saving");
    setFieldErrors({});
    try {
      await onSave({
        logoUrl: logoUrl || null,
        coverImageUrl: coverImageUrl || null,
        cardImageUrl: cardImageUrl || null,
        publicDescriptionEn: descEn || null,
        publicDescriptionAr: descAr || null,
        publicDescriptionHe: descHe || null,
        cityEn: cityEn || null,
        cityAr: cityAr || null,
        cityHe: cityHe || null,
        addressEn: addressEn || null,
        addressAr: addressAr || null,
        addressHe: addressHe || null,
        whatsappPhone: whatsapp || null,
      });
      setSaveStatus("saved");
    } catch (err) {
      const typedErr = err as { errors?: FieldErrors };
      if (typedErr.errors) setFieldErrors(typedErr.errors);
      setSaveStatus("error");
    }
  }

  function fallback(value: string | null | undefined) {
    return value?.trim() || ux.emptyValue;
  }

  function branchCity(branch: BranchDraft) {
    if (activeLang === "ar") return fallback(branch.cityAr);
    if (activeLang === "he") return fallback(branch.cityHe);
    return fallback(branch.cityEn);
  }

  function renderLocalizedProfileFields() {
    if (activeLang === "ar") {
      return (
        <>
          <TextareaField
            charsLabel={c.chars}
            dir="rtl"
            error={fieldErrors.publicDescriptionAr}
            label={c.descriptionAr}
            maxLen={800}
            onChange={setDescAr}
            value={descAr}
          />
          <InputField
            dir="rtl"
            error={fieldErrors.cityAr}
            label={c.cityAr}
            onChange={setCityAr}
            value={cityAr}
          />
          <InputField
            dir="rtl"
            error={fieldErrors.addressAr}
            label={c.addressAr}
            onChange={setAddressAr}
            value={addressAr}
          />
        </>
      );
    }

    if (activeLang === "he") {
      return (
        <>
          <TextareaField
            charsLabel={c.chars}
            dir="rtl"
            error={fieldErrors.publicDescriptionHe}
            label={c.descriptionHe}
            maxLen={800}
            onChange={setDescHe}
            value={descHe}
          />
          <InputField
            dir="rtl"
            error={fieldErrors.cityHe}
            label={c.cityHe}
            onChange={setCityHe}
            value={cityHe}
          />
          <InputField
            dir="rtl"
            error={fieldErrors.addressHe}
            label={c.addressHe}
            onChange={setAddressHe}
            value={addressHe}
          />
        </>
      );
    }

    return (
      <>
        <TextareaField
          charsLabel={c.chars}
          dir="ltr"
          error={fieldErrors.publicDescriptionEn}
          label={c.descriptionEn}
          maxLen={800}
          onChange={setDescEn}
          value={descEn}
        />
        <InputField
          dir="ltr"
          error={fieldErrors.cityEn}
          label={c.cityEn}
          onChange={setCityEn}
          value={cityEn}
        />
        <InputField
          dir="ltr"
          error={fieldErrors.addressEn}
          label={c.addressEn}
          onChange={setAddressEn}
          value={addressEn}
        />
      </>
    );
  }

  function renderBranchLocalizedFields(branch: BranchDraft) {
    if (activeLang === "ar") {
      return (
        <>
          <InputField
            dir="rtl"
            error={branch.errors?.cityAr}
            label={bc.cityAr}
            onChange={(value) => updateBranchDraft(branch.id, { cityAr: value })}
            value={branch.cityAr ?? ""}
          />
          <InputField
            dir="rtl"
            error={branch.errors?.addressAr}
            label={bc.addressAr}
            onChange={(value) => updateBranchDraft(branch.id, { addressAr: value })}
            value={branch.addressAr ?? ""}
          />
          <TextareaField
            charsLabel={c.chars}
            dir="rtl"
            error={branch.errors?.workingHoursTextAr}
            label={bc.hoursAr}
            maxLen={800}
            onChange={(value) => updateBranchDraft(branch.id, { workingHoursTextAr: value })}
            value={branch.workingHoursTextAr ?? ""}
          />
        </>
      );
    }

    if (activeLang === "he") {
      return (
        <>
          <InputField
            dir="rtl"
            error={branch.errors?.cityHe}
            label={bc.cityHe}
            onChange={(value) => updateBranchDraft(branch.id, { cityHe: value })}
            value={branch.cityHe ?? ""}
          />
          <InputField
            dir="rtl"
            error={branch.errors?.addressHe}
            label={bc.addressHe}
            onChange={(value) => updateBranchDraft(branch.id, { addressHe: value })}
            value={branch.addressHe ?? ""}
          />
          <TextareaField
            charsLabel={c.chars}
            dir="rtl"
            error={branch.errors?.workingHoursTextHe}
            label={bc.hoursHe}
            maxLen={800}
            onChange={(value) => updateBranchDraft(branch.id, { workingHoursTextHe: value })}
            value={branch.workingHoursTextHe ?? ""}
          />
        </>
      );
    }

    return (
      <>
        <InputField
          dir="ltr"
          error={branch.errors?.cityEn}
          label={bc.cityEn}
          onChange={(value) => updateBranchDraft(branch.id, { cityEn: value })}
          value={branch.cityEn ?? ""}
        />
        <InputField
          dir="ltr"
          error={branch.errors?.addressEn}
          label={bc.addressEn}
          onChange={(value) => updateBranchDraft(branch.id, { addressEn: value })}
          value={branch.addressEn ?? ""}
        />
        <TextareaField
          charsLabel={c.chars}
          dir="ltr"
          error={branch.errors?.workingHoursTextEn}
          label={bc.hoursEn}
          maxLen={800}
          onChange={(value) => updateBranchDraft(branch.id, { workingHoursTextEn: value })}
          value={branch.workingHoursTextEn ?? ""}
        />
      </>
    );
  }

  if (loadStatus === "loading") {
    return (
      <p className="py-8 text-center text-sm text-[#66758a]">{c.loading}</p>
    );
  }

  if (loadStatus === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm font-medium text-[#B42318]">{c.loadError}</p>
        <button
          className={buttonClassName("secondary", "sm")}
          onClick={runLoad}
          type="button"
        >
          {c.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sectionOrder.map((section) => (
          <SectionButton
            active={activeSection === section}
            description={ux.sectionDescriptions[section]}
            key={section}
            label={ux.sections[section]}
            onClick={() => setActiveSection(section)}
          />
        ))}
      </div>

      <section className="min-w-0 rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-[#EEF2F7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-black text-[#0B2D5C]">
              {ux.sections[activeSection]}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#66758a]">
              {ux.sectionDescriptions[activeSection]}
            </p>
          </div>
          {(activeSection === "profile" || activeSection === "branches" || activeSection === "hours") && (
            <LanguageTabs active={activeLang} labels={ux.langs} onChange={setActiveLang} />
          )}
        </div>

        <div className="p-4 sm:p-5">
          {activeSection === "profile" && (
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              {renderLocalizedProfileFields()}
            </div>
          )}

          {activeSection === "identity" && (
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
              <ImageUploadField
                clearLabel={c.clearImage}
                currentUrl={logoUrl || null}
                errorLabel={c.uploadError}
                helper={c.imageHelper}
                hint={c.logoHint}
                label={c.logoImage}
                onClear={() => setLogoUrl("")}
                onUpload={async (file) => {
                  const { url } = await onUploadImage(file, "logo");
                  setLogoUrl(url);
                }}
                uploadLabel={c.uploadBtn}
                uploadedLabel={c.uploaded}
                uploadingLabel={c.uploading}
              />
              <ImageUploadField
                clearLabel={c.clearImage}
                currentUrl={coverImageUrl || null}
                errorLabel={c.uploadError}
                helper={c.imageHelper}
                hint={c.coverHint}
                label={c.coverImage}
                onClear={() => setCoverImageUrl("")}
                onUpload={async (file) => {
                  const { url } = await onUploadImage(file, "cover");
                  setCoverImageUrl(url);
                }}
                uploadLabel={c.uploadBtn}
                uploadedLabel={c.uploaded}
                uploadingLabel={c.uploading}
              />
              <ImageUploadField
                clearLabel={c.clearImage}
                currentUrl={cardImageUrl || null}
                errorLabel={c.uploadError}
                helper={c.imageHelper}
                hint={c.cardHint}
                label={c.cardImage}
                onClear={() => setCardImageUrl("")}
                onUpload={async (file) => {
                  const { url } = await onUploadImage(file, "card");
                  setCardImageUrl(url);
                }}
                uploadLabel={c.uploadBtn}
                uploadedLabel={c.uploaded}
                uploadingLabel={c.uploading}
              />
            </div>
          )}

          {activeSection === "links" && (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                <p className="text-sm font-medium text-[#24364f]">{c.globalWhatsapp}</p>
                <p className="mt-1 text-sm font-semibold text-[#0B2D5C]" dir="ltr">
                  {globalWhatsapp || ux.emptyValue}
                </p>
              </div>
              <InputField
                dir="ltr"
                error={fieldErrors.whatsappPhone}
                label={c.whatsapp}
                onChange={setWhatsapp}
                placeholder={c.whatsappHelper}
                value={whatsapp}
              />
              <p className="col-span-full text-xs font-medium text-[#66758a]">
                {c.whatsappFallbackHelper}
              </p>
            </div>
          )}

          {activeSection === "hours" && (
            <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#66758a]">
              {ux.sectionDescriptions.hours}
            </div>
          )}

          {activeSection === "seo" && (
            <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#66758a]">{ux.seoHint}</p>
              <a className={buttonClassName("secondary", "sm")} href="/tenant/settings/seo">
                {ux.seoOpen}
              </a>
            </div>
          )}

          {activeSection === "site" && (
            <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#66758a]">{ux.siteHint}</p>
              <a className={buttonClassName("secondary", "sm")} href="/tenant/settings/website">
                {ux.siteOpen}
              </a>
            </div>
          )}

          {activeSection === "branches" && onLoadBranches && (
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <p className="max-w-3xl text-sm leading-6 text-[#66758a]">{ux.collapsedHint}</p>
                {onCreateBranch && (
                  <button className={buttonClassName("secondary", "sm")} onClick={addBranchDraft} type="button">
                    {bc.add}
                  </button>
                )}
              </div>

          {branchLoadStatus === "loading" && (
            <p className="mt-5 text-sm text-[#66758a]">{c.loading}</p>
          )}
          {branchLoadStatus === "error" && (
            <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-[#B42318]">{bc.loadError}</p>
              <button className={buttonClassName("secondary", "sm")} onClick={runBranchLoad} type="button">
                {c.retry}
              </button>
            </div>
          )}
          {branchLoadStatus !== "loading" && branchLoadStatus !== "error" && branches.length === 0 && (
            <p className="mt-5 rounded-md border border-dashed border-[#CBD5E1] bg-white px-4 py-5 text-sm text-[#66758a]">
              {bc.empty}
            </p>
          )}

              <div className="mt-5 space-y-3">
            {branches.map((branch, index) => (
              <article
                    className={`min-w-0 rounded-xl border bg-white shadow-sm ${
                  branch.isMain ? "border-[#C8A45D]" : "border-[#E5E7EB]"
                } ${branch.isActive ? "" : "opacity-70"}`}
                key={branch.id}
              >
                    <div className="flex min-w-0 flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-[#94A3B8]">{bc.branchName}</p>
                          <p className="mt-1 truncate text-sm font-black text-[#0B2D5C]">
                            {fallback(branch.name)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-[#94A3B8]">{activeLang === "ar" ? bc.cityAr : activeLang === "he" ? bc.cityHe : bc.cityEn}</p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#24364f]">{branchCity(branch)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-[#94A3B8]">{bc.phone}</p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#24364f]" dir="ltr">
                            {fallback(branch.phone)}
                          </p>
                        </div>
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            branch.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {branch.isActive ? bc.active : bc.inactiveStatus}
                          </span>
                          {branch.isMain && (
                            <span className="rounded-full bg-[#FFF7E6] px-2.5 py-1 text-xs font-bold text-[#8A5A00]">
                              {bc.main}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <button
                          className={buttonClassName("secondary", "sm")}
                          disabled={index === 0}
                          onClick={() => void moveBranch(index, -1)}
                          type="button"
                        >
                          {bc.moveUp}
                        </button>
                        <button
                          className={buttonClassName("secondary", "sm")}
                          disabled={index === branches.length - 1}
                          onClick={() => void moveBranch(index, 1)}
                          type="button"
                        >
                          {bc.moveDown}
                        </button>
                        <button
                          className={buttonClassName("secondary", "sm")}
                          onClick={() =>
                            setExpandedBranchIds((current) => ({
                              ...current,
                              [branch.id]: !current[branch.id],
                            }))
                          }
                          type="button"
                        >
                          {expandedBranchIds[branch.id] ? ux.less : ux.branchDetails}
                        </button>
                      </div>
                    </div>

                    {expandedBranchIds[branch.id] && (
                      <div className="border-t border-[#EEF2F7] bg-[#FBFDFF] p-4">
                        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <InputField
                            error={branch.errors?.name}
                            label={bc.branchName}
                            onChange={(value) => updateBranchDraft(branch.id, { name: value })}
                            value={branch.name}
                          />
                          <InputField
                            dir="ltr"
                            error={branch.errors?.phone}
                            label={bc.phone}
                            onChange={(value) => updateBranchDraft(branch.id, { phone: value })}
                            value={branch.phone ?? ""}
                          />
                          <InputField
                            dir="ltr"
                            error={branch.errors?.whatsapp}
                            label={bc.whatsapp}
                            onChange={(value) => updateBranchDraft(branch.id, { whatsapp: value })}
                            value={branch.whatsapp ?? ""}
                          />
                          {renderBranchLocalizedFields(branch)}
                        </div>

                        <details className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-3">
                          <summary className="cursor-pointer text-sm font-black text-[#0B2D5C]">
                            {ux.advanced}
                          </summary>
                          <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                            <InputField
                              dir="ltr"
                              error={branch.errors?.mapsUrl}
                              label={bc.mapsUrl}
                              onChange={(value) => updateBranchDraft(branch.id, { mapsUrl: value })}
                              value={branch.mapsUrl ?? ""}
                            />
                            <div className="col-span-full flex min-w-0 flex-wrap items-center gap-4">
                              <ToggleSwitch
                                checked={branch.isMain}
                                label={bc.main}
                                offLabel={bc.notMain}
                                onChange={(checked) => updateBranchDraft(branch.id, { isMain: checked })}
                                onLabel={bc.main}
                              />
                              <ToggleSwitch
                                checked={branch.isActive}
                                label={bc.active}
                                offLabel={bc.inactiveStatus}
                                onChange={(checked) => updateBranchDraft(branch.id, { isActive: checked })}
                                onLabel={bc.active}
                              />
                            </div>
                          </div>
                        </details>

                        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3 border-t border-[#EEF2F6] pt-4">
                          <button
                            className={buttonClassName("primary", "sm")}
                            disabled={branch.saveState === "saving" || !onCreateBranch || !onUpdateBranch}
                            onClick={() => void saveBranch(branch)}
                            type="button"
                          >
                            {branch.saveState === "saving" ? c.saving : bc.save}
                          </button>
                          <button
                            className={buttonClassName("secondary", "sm")}
                            disabled={!onDeleteBranch && !branch.isNew}
                            onClick={() => void deactivateBranch(branch)}
                            type="button"
                          >
                            {bc.remove}
                          </button>
                          {branch.saveState === "saved" && (
                            <span className="text-sm font-medium text-emerald-700">{bc.saved}</span>
                          )}
                          {branch.saveState === "error" && !Object.keys(branch.errors ?? {}).length && (
                            <span className="text-sm font-medium text-[#B42318]">{bc.saveError}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Save row */}
      <div className="flex min-w-0 flex-wrap items-center gap-3 border-t border-[#E5E7EB] pt-4">
        <button
          className={buttonClassName("primary", "md")}
          disabled={saveStatus === "saving"}
          onClick={handleSave}
          type="button"
        >
          {saveStatus === "saving" ? c.saving : c.save}
        </button>
        {saveStatus === "saved" && (
          <span className="text-sm font-medium text-emerald-700">{c.saved}</span>
        )}
        {saveStatus === "error" && !Object.keys(fieldErrors).length && (
          <span className="text-sm font-medium text-[#B42318]">{c.saveError}</span>
        )}
      </div>
    </div>
  );
}
