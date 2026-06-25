"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { RoyalCareLogo } from "@/components/brand/RoyalCareLogo";
import { buttonClassName, primaryButtonClassName } from "@/components/ui/button-styles";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminSettingsDictionaries } from "@/i18n/dictionaries/super-admin-settings";
import { formatDate } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import { FAVICON_EVENT } from "@/components/brand/GlobalFavicon";
import {
  getSystemSettings,
  updateSystemSettings,
  uploadPublicImage,
  UploadFailedError,
  type SystemSetting,
} from "@/lib/api/system-settings";
import { writeWhatsAppDefaultCode, writeWhatsAppSupportPhone } from "@/lib/whatsapp";
import {
  currencyOptions,
  dateFormatOptions,
  initialToggleSettings,
  languageOptions,
  platformSettings,
  timezoneOptions,
} from "./settings-data";
import { FeaturedServicesSection } from "./FeaturedServicesSection";

type Dictionary = (typeof superAdminSettingsDictionaries)["en"];
type ToggleKey = keyof typeof initialToggleSettings;

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-[#24364f]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextField({
  label,
  suffix,
  type = "text",
  value,
}: {
  label: string;
  suffix?: string;
  type?: "number" | "text";
  value: string | number;
}) {
  return (
    <FieldShell label={label}>
      <div className="flex min-w-0 items-center rounded-md border border-[#E5E7EB] bg-white focus-within:border-[#0B2D5C] focus-within:ring-3 focus-within:ring-[#0B2D5C]/12">
        <input
          className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm text-[#132238] outline-none"
          defaultValue={value}
          type={type}
        />
        {suffix ? (
          <span className="shrink-0 px-3 text-xs font-semibold text-[#66758a]">{suffix}</span>
        ) : null}
      </div>
    </FieldShell>
  );
}

function SelectField({
  label,
  options,
  renderOption,
  value,
}: {
  label: string;
  options: readonly string[];
  renderOption?: (option: string) => string;
  value: string;
}) {
  return (
    <FieldShell label={label}>
      <select
        className="h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
        defaultValue={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderOption ? renderOption(option) : option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</div>
    </div>
  );
}

function ToggleField({
  dictionary,
  label,
  onChange,
  value,
}: {
  dictionary: Dictionary;
  label: string;
  onChange: (checked: boolean) => void;
  value: boolean;
}) {
  return (
    <ToggleSwitch
      checked={value}
      className="w-full"
      label={label}
      offLabel={dictionary.values.disabled}
      onChange={onChange}
      onLabel={dictionary.values.enabled}
    />
  );
}

function ColorField({ label, value }: { label: string; value: string }) {
  return (
    <FieldShell label={label}>
      <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
        <input
          aria-label={label}
          className="h-8 w-10 shrink-0 rounded border border-[#E5E7EB] bg-transparent"
          defaultValue={value}
          type="color"
        />
        <input
          className="h-8 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#24364f] outline-none"
          defaultValue={value}
        />
      </div>
    </FieldShell>
  );
}

function SupportedLanguages({
  dictionary,
}: {
  dictionary: Dictionary;
}) {
  return (
    <div className="min-w-0 md:col-span-2">
      <p className="text-sm font-medium text-[#24364f]">{dictionary.fields.supportedLanguages}</p>
      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        {platformSettings.supportedLanguages.map((language) => (
          <span
            className="inline-flex min-h-9 items-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#0B2D5C]"
            key={language}
          >
            {dictionary.languages[language]}
          </span>
        ))}
      </div>
    </div>
  );
}

function WhatsAppSettingsSection({ dictionary }: { dictionary: Dictionary }) {
  const [code, setCode] = useState<"970" | "972">("970");
  const [supportPhone, setSupportPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getSystemSettings()
      .then((res) => {
        const codeEntry = res.settings.find((s) => s.key === "whatsapp_default_country_code");
        const phoneEntry = res.settings.find((s) => s.key === "whatsapp_support_phone");
        const resolved: "970" | "972" = codeEntry?.value === "972" ? "972" : "970";
        const phone = phoneEntry?.value ?? "";
        setCode(resolved);
        writeWhatsAppDefaultCode(resolved);
        setSupportPhone(phone);
        writeWhatsAppSupportPhone(phone);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  function normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    return digits.startsWith("0") ? digits.slice(1) : digits;
  }

  function validatePhone(value: string): string | null {
    const normalized = normalizePhone(value);
    if (!normalized) return null;
    if (normalized.length < 7 || normalized.length > 10) {
      return dictionary.values.whatsappPhoneError;
    }
    return null;
  }

  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setSupportPhone(raw);
    setPhoneError(validatePhone(raw));
  }

  function showFeedback(ok: boolean, msg: string) {
    setFeedback({ ok, msg });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  }

  async function handleSave() {
    const err = validatePhone(supportPhone);
    if (err) {
      setPhoneError(err);
      return;
    }
    setSaving(true);
    try {
      const digits = normalizePhone(supportPhone);
      await updateSystemSettings([
        { key: "whatsapp_default_country_code", value: code },
        { key: "whatsapp_support_phone", value: digits },
      ]);
      writeWhatsAppDefaultCode(code);
      writeWhatsAppSupportPhone(digits);
      showFeedback(true, dictionary.values.whatsappSaveSuccess);
    } catch {
      showFeedback(false, dictionary.values.whatsappSaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{dictionary.sections.whatsapp}</h3>
      </div>
      <div className="min-w-0 space-y-5 p-5">

        {/* Country code */}
        <div>
          <p className="text-sm font-medium text-[#24364f]">{dictionary.fields.whatsappCountryCode}</p>
          <p className="mt-1 text-xs text-[#66758a]">{dictionary.values.whatsappDescription}</p>
          {loaded ? (
            <div className="mt-3 flex flex-col gap-2">
              {(["970", "972"] as const).map((val) => (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition hover:bg-[#F8FAFC] ${
                    code === val
                      ? "border-[#0B2D5C] bg-[#0B2D5C]/5"
                      : "border-[#E5E7EB]"
                  }`}
                  key={val}
                >
                  <input
                    checked={code === val}
                    className="h-4 w-4 accent-[#0B2D5C]"
                    onChange={() => setCode(val)}
                    type="radio"
                    value={val}
                  />
                  <span className="text-sm font-semibold text-[#0B2D5C]">
                    {val === "970" ? dictionary.values.whatsapp970 : dictionary.values.whatsapp972}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-3 h-24 animate-pulse rounded-md bg-[#F8FAFC]" />
          )}
        </div>

        {/* Support phone */}
        <div>
          <label className="block text-sm font-medium text-[#24364f]">
            {dictionary.fields.whatsappSupportPhone}
          </label>
          <input
            className={`mt-1.5 h-11 w-full min-w-0 rounded-md border px-3 text-sm text-[#132238] outline-none transition focus:ring-2 focus:ring-[#0B2D5C]/12 ${
              phoneError
                ? "border-rose-400 focus:border-rose-400"
                : "border-[#E5E7EB] focus:border-[#0B2D5C]"
            }`}
            dir="ltr"
            disabled={!loaded}
            inputMode="tel"
            onChange={handlePhoneChange}
            placeholder={dictionary.values.whatsappSupportPhonePlaceholder}
            type="tel"
            value={supportPhone}
          />
          {phoneError ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{phoneError}</p>
          ) : (
            <p className="mt-1 text-xs text-[#66758a]">{dictionary.values.whatsappPhoneHelper}</p>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            className={primaryButtonClassName("w-auto")}
            disabled={!loaded || saving || phoneError !== null}
            onClick={() => void handleSave()}
            type="button"
          >
            {saving ? "…" : dictionary.actions.saveSettings}
          </button>
          {feedback && (
            <span
              className={`text-sm font-medium ${feedback.ok ? "text-emerald-600" : "text-rose-600"}`}
            >
              {feedback.msg}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

const publicAppearanceKeys = [
  "public_site_name",
  "public_logo_url",
  "public_favicon_url",
  "public_hero_image_url",
  "public_footer_logo_url",
  "public_support_phone",
  "public_support_whatsapp",
  "public_sales_whatsapp",
  "public_support_email",
  "public_facebook_url",
  "public_instagram_url",
  "public_whatsapp_url",
  "public_youtube_url",
  "public_tiktok_url",
  "public_hero_title_ar",
  "public_hero_title_en",
  "public_hero_title_he",
  "public_hero_subtitle_ar",
  "public_hero_subtitle_en",
  "public_hero_subtitle_he",
  "public_owner_cta_text_ar",
  "public_owner_cta_text_en",
  "public_owner_cta_text_he",
  "public_patient_cta_text_ar",
  "public_patient_cta_text_en",
  "public_patient_cta_text_he",
] as const;

type PublicAppearanceKey = (typeof publicAppearanceKeys)[number];
type PublicAppearanceValues = Record<PublicAppearanceKey, string>;

const emptyPublicAppearance = Object.fromEntries(
  publicAppearanceKeys.map((key) => [key, ""]),
) as PublicAppearanceValues;

const publicUrlKeys = new Set<PublicAppearanceKey>([
  "public_logo_url",
  "public_favicon_url",
  "public_hero_image_url",
  "public_footer_logo_url",
  "public_facebook_url",
  "public_instagram_url",
  "public_whatsapp_url",
  "public_youtube_url",
  "public_tiktok_url",
]);

const publicAppearanceCopy = {
  en: {
    title: "Public Website Appearance",
    intro:
      "Control the public RoyalCare landing page branding, contact information, social links, and CTA text.",
    cards: {
      brand: "Branding",
      contact: "Contact & WhatsApp",
      social: "Social Links",
      landing: "Landing Texts",
    },
    fields: {
      public_site_name: "Site name",
      public_logo_url: "Logo",
      public_favicon_url: "Favicon",
      public_hero_image_url: "Hero image",
      public_footer_logo_url: "Footer logo",
      public_support_phone: "Support phone",
      public_support_whatsapp: "Support WhatsApp",
      public_sales_whatsapp: "Sales WhatsApp for Pricing",
      public_support_email: "Support email",
      public_facebook_url: "Facebook URL",
      public_instagram_url: "Instagram URL",
      public_whatsapp_url: "WhatsApp URL",
      public_youtube_url: "YouTube URL",
      public_tiktok_url: "TikTok URL",
      public_hero_title_ar: "Hero title - Arabic",
      public_hero_title_en: "Hero title - English",
      public_hero_title_he: "Hero title - Hebrew",
      public_hero_subtitle_ar: "Hero subtitle - Arabic",
      public_hero_subtitle_en: "Hero subtitle - English",
      public_hero_subtitle_he: "Hero subtitle - Hebrew",
      public_owner_cta_text_ar: "Owner CTA - Arabic",
      public_owner_cta_text_en: "Owner CTA - English",
      public_owner_cta_text_he: "Owner CTA - Hebrew",
      public_patient_cta_text_ar: "Patient CTA - Arabic",
      public_patient_cta_text_en: "Patient CTA - English",
      public_patient_cta_text_he: "Patient CTA - Hebrew",
    },
    save: "Save Public Website Appearance",
    saved: "Public website settings saved.",
    error: "Could not save public website settings.",
    loading: "Loading public settings...",
    helper: "Leave a field empty to use the current default public page text.",
  },
  ar: {
    title: "مظهر الموقع العام",
    intro:
      "تحكم بعلامة RoyalCare العامة وبيانات التواصل وروابط الشبكات ونصوص صفحة الهبوط.",
    cards: {
      brand: "العلامة التجارية",
      contact: "التواصل وواتساب",
      social: "روابط التواصل",
      landing: "نصوص صفحة الهبوط",
    },
    fields: {
      public_site_name: "اسم الموقع",
      public_logo_url: "الشعار",
      public_favicon_url: "الأيقونة",
      public_hero_image_url: "صورة الهيرو الرئيسية",
      public_footer_logo_url: "شعار الفوتر",
      public_support_phone: "هاتف الدعم",
      public_support_whatsapp: "واتساب الدعم",
      public_sales_whatsapp: "واتساب المبيعات للأسعار",
      public_support_email: "بريد الدعم",
      public_facebook_url: "رابط فيسبوك",
      public_instagram_url: "رابط إنستغرام",
      public_whatsapp_url: "رابط واتساب",
      public_youtube_url: "رابط يوتيوب",
      public_tiktok_url: "رابط تيك توك",
      public_hero_title_ar: "عنوان البطل - عربي",
      public_hero_title_en: "عنوان البطل - إنجليزي",
      public_hero_title_he: "عنوان البطل - عبري",
      public_hero_subtitle_ar: "وصف البطل - عربي",
      public_hero_subtitle_en: "وصف البطل - إنجليزي",
      public_hero_subtitle_he: "وصف البطل - عبري",
      public_owner_cta_text_ar: "زر أصحاب المراكز - عربي",
      public_owner_cta_text_en: "زر أصحاب المراكز - إنجليزي",
      public_owner_cta_text_he: "زر أصحاب المراكز - عبري",
      public_patient_cta_text_ar: "زر المرضى - عربي",
      public_patient_cta_text_en: "زر المرضى - إنجليزي",
      public_patient_cta_text_he: "زر المرضى - عبري",
    },
    save: "حفظ مظهر الموقع العام",
    saved: "تم حفظ إعدادات الموقع العام.",
    error: "تعذر حفظ إعدادات الموقع العام.",
    loading: "جاري تحميل إعدادات الموقع العام...",
    helper: "اترك الحقل فارغاً لاستخدام النص الافتراضي الحالي في الموقع العام.",
  },
  he: {
    title: "מראה האתר הציבורי",
    intro:
      "שליטה במיתוג הציבורי של RoyalCare, פרטי קשר, קישורים חברתיים וטקסטים בדף הנחיתה.",
    cards: {
      brand: "מיתוג",
      contact: "קשר ו-WhatsApp",
      social: "קישורים חברתיים",
      landing: "טקסטים לדף נחיתה",
    },
    fields: {
      public_site_name: "שם האתר",
      public_logo_url: "לוגו",
      public_favicon_url: "אייקון",
      public_hero_image_url: "תמונת פתיח",
      public_footer_logo_url: "לוגו תחתון",
      public_support_phone: "טלפון תמיכה",
      public_support_whatsapp: "WhatsApp תמיכה",
      public_sales_whatsapp: "וואטסאפ מכירות למחירים",
      public_support_email: "אימייל תמיכה",
      public_facebook_url: "קישור Facebook",
      public_instagram_url: "קישור Instagram",
      public_whatsapp_url: "קישור WhatsApp",
      public_youtube_url: "קישור YouTube",
      public_tiktok_url: "קישור TikTok",
      public_hero_title_ar: "כותרת פתיח - ערבית",
      public_hero_title_en: "כותרת פתיח - אנגלית",
      public_hero_title_he: "כותרת פתיח - עברית",
      public_hero_subtitle_ar: "תיאור פתיח - ערבית",
      public_hero_subtitle_en: "תיאור פתיח - אנגלית",
      public_hero_subtitle_he: "תיאור פתיח - עברית",
      public_owner_cta_text_ar: "CTA לבעלי מרכזים - ערבית",
      public_owner_cta_text_en: "CTA לבעלי מרכזים - אנגלית",
      public_owner_cta_text_he: "CTA לבעלי מרכזים - עברית",
      public_patient_cta_text_ar: "CTA למטופלים - ערבית",
      public_patient_cta_text_en: "CTA למטופלים - אנגלית",
      public_patient_cta_text_he: "CTA למטופלים - עברית",
    },
    save: "שמירת מראה האתר הציבורי",
    saved: "הגדרות האתר הציבורי נשמרו.",
    error: "לא ניתן לשמור את הגדרות האתר הציבורי.",
    loading: "טוען הגדרות ציבוריות...",
    helper: "השאר שדה ריק כדי להשתמש בברירת המחדל הנוכחית באתר הציבורי.",
  },
} satisfies Record<
  "en" | "ar" | "he",
  {
    title: string;
    intro: string;
    cards: Record<"brand" | "contact" | "social" | "landing", string>;
    fields: Record<PublicAppearanceKey, string>;
    save: string;
    saved: string;
    error: string;
    loading: string;
    helper: string;
  }
>;

const publicAppearanceUxCopy = {
  en: {
    sectionHelper: "These settings appear on /centers and the public RoyalCare website.",
    unchanged: "No changes to save",
    dirty: "Unsaved changes",
    uploadButton: "Upload image",
    uploadHelper: "Image upload will be connected in the next phase.",
    useImageUrl: "Use image URL",
    noImage: "No image selected",
    livePreview: "Live preview",
    logoPreview: "Logo preview",
    heroPreview: "Hero image preview",
    footerPreview: "Footer social preview",
    languageNames: { ar: "Arabic", en: "English", he: "Hebrew" },
    homeTitle: "Homepage title",
    homeSubtitle: "Homepage description",
    ownerCta: "Center owner button",
    patientCta: "Patient booking button",
  },
  ar: {
    sectionHelper: "هذه الإعدادات تظهر في صفحة /centers والموقع العام.",
    unchanged: "لا توجد تغييرات للحفظ",
    dirty: "تغييرات غير محفوظة",
    uploadButton: "رفع صورة",
    uploadHelper: "رفع الصور سيتم ربطه في المرحلة التالية.",
    useImageUrl: "استخدام رابط صورة",
    noImage: "لا توجد صورة مختارة",
    livePreview: "معاينة مباشرة",
    logoPreview: "معاينة الشعار",
    heroPreview: "معاينة صورة الهيرو",
    footerPreview: "معاينة الفوتر وروابط التواصل",
    languageNames: { ar: "العربية", en: "English", he: "עברית" },
    homeTitle: "عنوان الصفحة الرئيسية",
    homeSubtitle: "وصف الصفحة الرئيسية",
    ownerCta: "زر أصحاب المراكز",
    patientCta: "زر المرضى",
  },
  he: {
    sectionHelper: "הגדרות אלה מופיעות ב-/centers ובאתר הציבורי.",
    unchanged: "אין שינויים לשמירה",
    dirty: "יש שינויים שלא נשמרו",
    uploadButton: "העלאת תמונה",
    uploadHelper: "העלאת תמונות תחובר בשלב הבא.",
    useImageUrl: "שימוש בקישור תמונה",
    noImage: "לא נבחרה תמונה",
    livePreview: "תצוגה מקדימה",
    logoPreview: "תצוגת לוגו",
    heroPreview: "תצוגת תמונת פתיח",
    footerPreview: "תצוגת פוטר ורשתות",
    languageNames: { ar: "العربية", en: "English", he: "עברית" },
    homeTitle: "כותרת דף הבית",
    homeSubtitle: "תיאור דף הבית",
    ownerCta: "כפתור לבעלי מרכזים",
    patientCta: "כפתור למטופלים",
  },
} satisfies Record<
  "en" | "ar" | "he",
  {
    sectionHelper: string;
    unchanged: string;
    dirty: string;
    uploadButton: string;
    uploadHelper: string;
    useImageUrl: string;
    noImage: string;
    livePreview: string;
    logoPreview: string;
    heroPreview: string;
    footerPreview: string;
    languageNames: Record<"ar" | "en" | "he", string>;
    homeTitle: string;
    homeSubtitle: string;
    ownerCta: string;
    patientCta: string;
  }
>;

const imageFieldHints: Record<string, Record<string, string>> = {
  public_logo_url: {
    en: "Recommended: 300×120 px, transparent PNG or SVG. Shown in the navbar and footer.",
    ar: "المقاس المفضل: 300×120 بكسل، خلفية شفافة PNG أو SVG. يظهر في النافبار والفوتر.",
    he: "מומלץ: 300×120 פיקסל, PNG או SVG שקוף. מוצג בסרגל הניווט ובכותרת התחתית.",
  },
  public_favicon_url: {
    en: "Recommended: 512×512 px, square PNG or SVG. Shown only in the browser tab.",
    ar: "المقاس المفضل: 512×512 بكسل، صورة مربعة PNG أو SVG. يظهر فقط في تبويب المتصفح.",
    he: "מומלץ: 512×512 פיקסל, PNG או SVG מרובע. מוצג רק בכרטיסיית הדפדפן.",
  },
  public_hero_image_url: {
    en: "Recommended: 1920×900 px, high-quality landscape image.",
    ar: "المقاس المفضل: 1920×900 بكسل، صورة أفقية عالية الجودة.",
    he: "מומלץ: 1920×900 פיקסל, תמונה אופקית באיכות גבוהה.",
  },
  public_footer_logo_url: {
    en: "Recommended: 300×120 px, transparent PNG or SVG.",
    ar: "المقاس المفضل: 300×120 بكسل، خلفية شفافة PNG أو SVG.",
    he: "מומלץ: 300×120 פיקסל, PNG או SVG שקוף.",
  },
};

const publicAppearanceFieldHelp: Partial<
  Record<
    PublicAppearanceKey,
    Record<"en" | "ar" | "he", { helper: string; hint: string }>
  >
> = {
  public_sales_whatsapp: {
    en: {
      helper: "Used by pricing plan WhatsApp CTA buttons.",
      hint: "Enter international format without + or spaces, e.g. 972593667773",
    },
    ar: {
      helper: "يستخدم هذا الرقم في أزرار طلب الباقات في صفحة الأسعار.",
      hint: "أدخل الرقم بصيغة دولية بدون + أو مسافات، مثال: 972593667773",
    },
    he: {
      helper: "משמש בכפתורי וואטסאפ של חבילות המחירים.",
      hint: "הזן מספר בינלאומי ללא + או רווחים, לדוגמה: 972593667773",
    },
  },
};

const imageActionCopy = {
  en: {
    uploading: "Uploading...",
    clearImage: "Clear image",
    uploadError: "Image upload failed. Check the file type and size.",
    uploadHelper: "You can upload up to 8MB. Images are optimized automatically.",
    autoSaved: "Image uploaded and saved.",
    autoSaveFallback: "Image uploaded. Save settings to keep changes.",
  },
  ar: {
    uploading: "جاري الرفع...",
    clearImage: "مسح الصورة",
    uploadError: "تعذر رفع الصورة. تحقق من نوع الملف وحجمه.",
    uploadHelper: "يمكنك رفع صورة حتى 8MB، وسيتم ضغطها تلقائيًا.",
    autoSaved: "تم رفع الصورة وحفظها",
    autoSaveFallback: "تم الرفع. اضغط حفظ لتثبيت التغيير.",
  },
  he: {
    uploading: "מעלה...",
    clearImage: "ניקוי תמונה",
    uploadError: "העלאת התמונה נכשלה. בדקו את סוג וגודל הקובץ.",
    uploadHelper: "ניתן להעלות עד 8MB. התמונות יעובדו אוטומטית.",
    autoSaved: "התמונה הועלתה ונשמרה.",
    autoSaveFallback: "הועלה. שמרו ידנית כדי לשמור.",
  },
} satisfies Record<
  "en" | "ar" | "he",
  {
    uploading: string;
    clearImage: string;
    uploadError: string;
    uploadHelper: string;
    autoSaved: string;
    autoSaveFallback: string;
  }
>;

const publicAppearanceSaveCopy = {
  en: {
    uploadSuccess: "Image uploaded. Do not forget to save changes.",
    cancelChanges: "Cancel changes",
  },
  ar: {
    uploadSuccess: "تم رفع الصورة، لا تنس حفظ التغييرات",
    cancelChanges: "إلغاء التغييرات",
  },
  he: {
    uploadSuccess: "התמונה הועלתה. אל תשכחו לשמור את השינויים.",
    cancelChanges: "ביטול שינויים",
  },
} satisfies Record<
  "en" | "ar" | "he",
  { uploadSuccess: string; cancelChanges: string }
>;

type PublicAppearanceCard = "brand" | "contact" | "social" | "landing" | "seo";

function PublicAppearanceSection({
  cards = ["brand", "contact", "social", "landing"],
  showPreview = true,
}: {
  cards?: PublicAppearanceCard[];
  showPreview?: boolean;
}) {
  const { locale } = useLanguage();
  const copy = publicAppearanceCopy[locale];
  const ux = publicAppearanceUxCopy[locale];
  const imageCopy = imageActionCopy[locale];
  const saveCopy = publicAppearanceSaveCopy[locale];
  const [values, setValues] = useState<PublicAppearanceValues>(emptyPublicAppearance);
  const [savedValues, setSavedValues] = useState<PublicAppearanceValues>(emptyPublicAppearance);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<PublicAppearanceKey | null>(null);
  const [uploadNoticeKey, setUploadNoticeKey] = useState<PublicAppearanceKey | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(savedValues);

  useEffect(() => {
    let cancelled = false;
    void getSystemSettings()
      .then((res) => {
        if (cancelled) return;
        const next = { ...emptyPublicAppearance };
        for (const setting of res.settings) {
          if (publicAppearanceKeys.includes(setting.key as PublicAppearanceKey)) {
            next[setting.key as PublicAppearanceKey] = setting.value ?? "";
          }
        }
        setValues(next);
        setSavedValues(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(key: PublicAppearanceKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleCancelChanges() {
    setValues(savedValues);
    setFeedback(null);
    setUploadNoticeKey(null);
  }

  function normalizePublicValue(key: PublicAppearanceKey): string | null {
    const value = values[key].trim();
    if (!value) return null;
    // Relative paths (e.g. uploaded /uploads/branding/…) must not have https:// prepended.
    if (value.startsWith("/")) return value;
    if (publicUrlKeys.has(key) && !/^https?:\/\//i.test(value)) {
      if (key === "public_whatsapp_url" && /^[+\d\s()-]+$/.test(value)) {
        return `https://wa.me/${value.replace(/\D/g, "")}`;
      }
      return `https://${value}`;
    }
    return value;
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    const payload: SystemSetting[] = publicAppearanceKeys.map((key) => ({
      key,
      value: normalizePublicValue(key),
    }));
    try {
      await updateSystemSettings(payload);
      setFeedback({ ok: true, msg: copy.saved });
      setSavedValues(values);
      setUploadNoticeKey(null);
      const savedFavicon = payload.find((p) => p.key === "public_favicon_url")?.value?.trim();
      if (savedFavicon) {
        const href = savedFavicon.includes("?")
          ? `${savedFavicon}&v=${Date.now()}`
          : `${savedFavicon}?v=${Date.now()}`;
        window.dispatchEvent(new CustomEvent(FAVICON_EVENT, { detail: { href } }));
      }
    } catch {
      setFeedback({ ok: false, msg: copy.error });
    } finally {
      setSaving(false);
    }
  }

  function imageUploadType(key: PublicAppearanceKey): string {
    if (key === "public_hero_image_url") return "hero";
    if (key === "public_favicon_url") return "favicon";
    return "logo";
  }

  async function handleImageUpload(
    key: PublicAppearanceKey,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingKey(key);
    setFeedback(null);
    try {
      const result = await uploadPublicImage(file, imageUploadType(key));
      const url = result.url;
      setField(key, url);

      // Auto-save immediately so the image survives a page refresh.
      try {
        await updateSystemSettings([{ key, value: url }]);
        setSavedValues((prev) => ({ ...prev, [key]: url }));
        setUploadNoticeKey(null);
        setFeedback({ ok: true, msg: imageCopy.autoSaved });
        if (key === "public_favicon_url") {
          const href = url.includes("?") ? `${url}&v=${Date.now()}` : `${url}?v=${Date.now()}`;
          window.dispatchEvent(new CustomEvent(FAVICON_EVENT, { detail: { href } }));
        }
      } catch {
        // Upload succeeded but auto-save failed — prompt manual save.
        setUploadNoticeKey(key);
      }
    } catch (err) {
      if (err instanceof UploadFailedError) {
        const code = err.code ? ` [${err.code}]` : "";
        const detail = err.details ? `: ${err.details}` : "";
        setFeedback({ ok: false, msg: imageCopy.uploadError + code + detail });
      } else {
        setFeedback({ ok: false, msg: imageCopy.uploadError });
      }
    } finally {
      setUploadingKey(null);
    }
  }

  function input(
    key: PublicAppearanceKey,
    label: string,
    type: "text" | "url" | "email" | "tel" = "text",
  ) {
    const help = publicAppearanceFieldHelp[key]?.[locale];
    return (
      <FieldShell label={label}>
        <input
          className="h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
          dir={type === "tel" || type === "url" || type === "email" ? "ltr" : undefined}
          disabled={!loaded || saving}
          onChange={(event) => setField(key, event.target.value)}
          type={type}
          value={values[key]}
        />
        {help ? (
          <div className="mt-2 space-y-1">
            <p className="text-xs leading-5 text-[#66758a]">{help.helper}</p>
            <p className="text-xs font-semibold leading-5 text-[#0B2D5C]">{help.hint}</p>
          </div>
        ) : null}
      </FieldShell>
    );
  }

  function textarea(key: PublicAppearanceKey, label: string) {
    return (
      <FieldShell label={label}>
        <textarea
          className="min-h-24 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
          disabled={!loaded || saving}
          onChange={(event) => setField(key, event.target.value)}
          value={values[key]}
        />
      </FieldShell>
    );
  }

  function accordion(title: string, children: ReactNode, defaultOpen = false) {
    return (
      <details
        className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm open:shadow-[0_12px_30px_rgba(11,45,92,0.05)]"
        open={defaultOpen}
      >
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#F8FAFC]">
          {title}
        </summary>
        <div className="border-t border-[#E5E7EB] p-4">{children}</div>
      </details>
    );
  }

  function imageField(key: PublicAppearanceKey, label: string) {
    const value = values[key].trim();
    const isUploading = uploadingKey === key;
    const inputId = `public-appearance-${key}`;
    return (
      <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#C8A45D]/60 bg-white">
            {value ? (
              <img alt={label} className="h-full w-full object-contain" src={value} />
            ) : (
              <span className="px-3 text-center text-xs font-semibold text-[#66758a]">
                {ux.noImage}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0B2D5C]">{label}</p>
            {imageFieldHints[key]?.[locale] ? (
              <p className="mt-0.5 text-xs font-semibold leading-5 text-[#66758a]">
                {imageFieldHints[key][locale]}
              </p>
            ) : null}
            <p className="mt-0.5 text-xs leading-5 text-[#66758a]">
              {imageCopy.uploadHelper}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                disabled={!loaded || saving || Boolean(uploadingKey)}
                id={inputId}
                onChange={(event) => void handleImageUpload(key, event)}
                type="file"
              />
              <label
                className={buttonClassName(
                  "secondary",
                  "sm",
                  !loaded || saving || Boolean(uploadingKey)
                    ? "pointer-events-none opacity-60"
                    : "cursor-pointer",
                )}
                htmlFor={inputId}
              >
                {isUploading ? imageCopy.uploading : ux.uploadButton}
              </label>
              {value ? (
                <button
                  className={buttonClassName("secondary", "sm")}
                  disabled={!loaded || saving || Boolean(uploadingKey)}
                  onClick={() => {
                    setField(key, "");
                    setUploadNoticeKey(null);
                  }}
                  type="button"
                >
                  {imageCopy.clearImage}
                </button>
              ) : null}
            </div>
            {uploadNoticeKey === key ? (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                {imageCopy.autoSaveFallback}
              </p>
            ) : null}
          </div>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-[#0B2D5C]">
            {ux.useImageUrl}
          </summary>
          <div className="mt-3">
            {input(key, label, "url")}
          </div>
        </details>
      </div>
    );
  }

  function languageFields(code: "ar" | "en" | "he") {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <h4 className="text-sm font-black text-[#0B2D5C]">
          {ux.languageNames[code]}
        </h4>
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {input(`public_hero_title_${code}`, ux.homeTitle)}
          {input(`public_owner_cta_text_${code}`, ux.ownerCta)}
          {textarea(`public_hero_subtitle_${code}`, ux.homeSubtitle)}
          {input(`public_patient_cta_text_${code}`, ux.patientCta)}
        </div>
      </div>
    );
  }

  const hasCard = (card: PublicAppearanceCard) => cards.includes(card);
  const formColumnClass = showPreview
    ? "grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]"
    : "grid min-w-0 grid-cols-1 gap-4";

  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)] xl:col-span-2">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{copy.title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#66758a]">{copy.intro}</p>
        <p className="mt-1 text-xs leading-5 text-[#66758a]">{ux.sectionHelper}</p>
      </div>
      <div className="space-y-4 p-4 pb-24 sm:p-5">
        {!loaded ? <p className="text-sm text-[#66758a]">{copy.loading}</p> : null}
        <p className="text-xs leading-5 text-[#66758a]">{copy.helper}</p>
        {feedback && !feedback.ok ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {feedback.msg}
          </div>
        ) : null}

        <div className={formColumnClass}>
          <div className="space-y-4">
            {hasCard("brand") ? accordion(
              copy.cards.brand,
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                {input("public_site_name", copy.fields.public_site_name)}
                {imageField("public_logo_url", copy.fields.public_logo_url)}
                {imageField("public_favicon_url", copy.fields.public_favicon_url)}
                {imageField("public_hero_image_url", copy.fields.public_hero_image_url)}
                {imageField("public_footer_logo_url", copy.fields.public_footer_logo_url)}
              </div>,
              true,
            ) : null}

            {hasCard("contact") ? accordion(
              copy.cards.contact,
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                {input("public_support_phone", copy.fields.public_support_phone, "tel")}
                {input("public_support_whatsapp", copy.fields.public_support_whatsapp, "tel")}
                {input("public_sales_whatsapp", copy.fields.public_sales_whatsapp, "tel")}
                {input("public_support_email", copy.fields.public_support_email, "email")}
                {input("public_whatsapp_url", copy.fields.public_whatsapp_url, "url")}
              </div>,
              true,
            ) : null}

            {hasCard("social") ? accordion(
              copy.cards.social,
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                {input("public_facebook_url", copy.fields.public_facebook_url, "url")}
                {input("public_instagram_url", copy.fields.public_instagram_url, "url")}
                {input("public_youtube_url", copy.fields.public_youtube_url, "url")}
                {input("public_tiktok_url", copy.fields.public_tiktok_url, "url")}
              </div>,
              true,
            ) : null}

            {hasCard("landing") ? accordion(
              copy.cards.landing,
              <div className="space-y-4">
                {languageFields("ar")}
                {languageFields("en")}
                {languageFields("he")}
              </div>,
              true,
            ) : null}

            {hasCard("seo") ? accordion(
              "SEO",
              <div className="space-y-4">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  {imageField("public_favicon_url", copy.fields.public_favicon_url)}
                </div>
                <div className="rounded-lg border border-dashed border-[#C8A45D]/50 bg-[#FDFAF5] px-4 py-3 text-sm leading-6 text-[#66758a]">
                  {locale === "ar"
                    ? "لا توجد حقول بيانات وصفية عامة متصلة حالياً. سيتم عرضها هنا عند إضافتها إلى إعدادات المنصة."
                    : locale === "he"
                      ? "אין כרגע שדות מטא ציבוריים מחוברים. הם יוצגו כאן לאחר הוספתם להגדרות המערכת."
                      : "No public metadata fields are connected yet. They will appear here when added to platform settings."}
                </div>
              </div>,
              true,
            ) : null}
          </div>

          {showPreview ? <aside className="min-w-0 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 xl:sticky xl:top-24 xl:self-start">
            <h4 className="text-sm font-black text-[#0B2D5C]">{ux.livePreview}</h4>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-[#66758a]">{ux.logoPreview}</p>
                <div className="mt-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-[#C8A45D]/50 bg-white">
                  {values.public_logo_url.trim() ? (
                    <img alt={ux.logoPreview} className="max-h-16 max-w-full object-contain" src={values.public_logo_url.trim()} />
                  ) : (
                    <span className="text-xs font-semibold text-[#66758a]">{ux.noImage}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[#66758a]">{ux.heroPreview}</p>
                <div className="mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#C8A45D]/50 bg-white">
                  {values.public_hero_image_url.trim() ? (
                    <img alt={ux.heroPreview} className="h-full w-full object-cover" src={values.public_hero_image_url.trim()} />
                  ) : (
                    <span className="text-xs font-semibold text-[#66758a]">{ux.noImage}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[#66758a]">{ux.footerPreview}</p>
                <div className="mt-2 flex flex-wrap gap-2 rounded-lg bg-[#071F3F] p-3">
                  {(["public_facebook_url", "public_instagram_url", "public_whatsapp_url", "public_youtube_url", "public_tiktok_url"] as const).map((key) => (
                    values[key].trim() ? (
                      <span
                        aria-label={copy.fields[key]}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0B2D5C] ring-1 ring-white/20"
                        key={key}
                      />
                    ) : null
                  ))}
                </div>
              </div>
            </div>
          </aside> : null}
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(11,45,92,0.08)] backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
            <div className="min-w-0 text-start sm:text-end">
              <p className={`text-sm font-bold ${hasChanges ? "text-amber-700" : "text-[#66758a]"}`}>
                {hasChanges ? ux.dirty : ux.unchanged}
              </p>
              {feedback ? (
                <p
                  className={`mt-1 text-sm font-semibold ${feedback.ok ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {feedback.msg}
                </p>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
                disabled={!loaded || saving || !hasChanges}
                onClick={handleCancelChanges}
                type="button"
              >
                {saveCopy.cancelChanges}
              </button>
              <button
                className={primaryButtonClassName("w-full sm:w-auto")}
                disabled={!loaded || saving || !hasChanges}
                onClick={() => void handleSave()}
                type="button"
              >
                {saving ? "..." : copy.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const settingsTabs = [
  "publicWebsite",
  "contactSales",
  "socialMedia",
  "seo",
  "notifications",
  "system",
] as const;

type SettingsTab = (typeof settingsTabs)[number];

const settingsTabCopy = {
  en: {
    publicWebsite: { label: "Public Website", subtitle: "Branding, homepage assets, and public content." },
    contactSales: { label: "Contact & Sales", subtitle: "Support, sales WhatsApp, and public contact links." },
    socialMedia: { label: "Social Media", subtitle: "Public social profile links." },
    seo: { label: "SEO", subtitle: "Favicon and public metadata settings." },
    notifications: { label: "Notifications", subtitle: "Email, WhatsApp, and alert defaults." },
    system: { label: "System", subtitle: "Platform defaults, security, domains, and maintenance." },
  },
  ar: {
    publicWebsite: { label: "الموقع العام", subtitle: "الهوية والصور ونصوص الصفحة العامة." },
    contactSales: { label: "التواصل والمبيعات", subtitle: "الدعم وواتساب المبيعات وروابط التواصل العامة." },
    socialMedia: { label: "التواصل الاجتماعي", subtitle: "روابط الحسابات العامة." },
    seo: { label: "SEO", subtitle: "الأيقونة وبيانات الظهور العامة." },
    notifications: { label: "الإشعارات", subtitle: "إعدادات البريد وواتساب والتنبيهات." },
    system: { label: "النظام", subtitle: "افتراضيات المنصة والأمان والنطاقات والصيانة." },
  },
  he: {
    publicWebsite: { label: "אתר ציבורי", subtitle: "מיתוג, תמונות וטקסטים ציבוריים." },
    contactSales: { label: "קשר ומכירות", subtitle: "תמיכה, וואטסאפ מכירות וקישורי קשר." },
    socialMedia: { label: "רשתות חברתיות", subtitle: "קישורים לפרופילים ציבוריים." },
    seo: { label: "SEO", subtitle: "אייקון והגדרות מטא ציבוריות." },
    notifications: { label: "התראות", subtitle: "ברירות מחדל לאימייל, WhatsApp והתראות." },
    system: { label: "מערכת", subtitle: "ברירות מחדל, אבטחה, דומיינים ותחזוקה." },
  },
} satisfies Record<
  "en" | "ar" | "he",
  Record<SettingsTab, { label: string; subtitle: string }>
>;

function SettingsTabNavigation({
  activeTab,
  labels,
  onChange,
}: {
  activeTab: SettingsTab;
  labels: Record<SettingsTab, { label: string; subtitle: string }>;
  onChange: (tab: SettingsTab) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6" role="tablist">
        {settingsTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              aria-selected={isActive}
              className={`min-w-0 rounded-md border px-3 py-3 text-start transition ${
                isActive
                  ? "border-[#0B2D5C] bg-[#0B2D5C] text-white shadow-sm"
                  : "border-transparent bg-white text-[#24364f] hover:border-[#E5E7EB] hover:bg-[#F8FAFC]"
              }`}
              key={tab}
              onClick={() => onChange(tab)}
              role="tab"
              type="button"
            >
              <span className="block truncate text-sm font-black">{labels[tab].label}</span>
              <span
                className={`mt-1 block line-clamp-2 text-xs leading-5 ${
                  isActive ? "text-white/80" : "text-[#66758a]"
                }`}
              >
                {labels[tab].subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SuperAdminSettingsPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminSettingsDictionaries[locale];
  const tabLabels = settingsTabCopy[locale];
  const [activeTab, setActiveTab] = useState<SettingsTab>("publicWebsite");
  const [toggles, setToggles] = useState(initialToggleSettings);

  function setToggle(key: ToggleKey, value: boolean) {
    setToggles((current) => ({ ...current, [key]: value }));
  }

  return (
    <SuperAdminLayout activeNav="settings" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <SettingsTabNavigation activeTab={activeTab} labels={tabLabels} onChange={setActiveTab} />

        {activeTab === "publicWebsite" ? (
          <div className="grid min-w-0 grid-cols-1 gap-5">
            <PublicAppearanceSection cards={["brand", "landing"]} showPreview />
            <FeaturedServicesSection />
          </div>
        ) : null}

        {activeTab === "contactSales" ? (
          <PublicAppearanceSection cards={["contact"]} showPreview={false} />
        ) : null}

        {activeTab === "socialMedia" ? (
          <PublicAppearanceSection cards={["social"]} showPreview={false} />
        ) : null}

        {activeTab === "seo" ? (
          <PublicAppearanceSection cards={["seo"]} showPreview={false} />
        ) : null}

        {activeTab === "notifications" ? (
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <Section title={dictionary.sections.notifications}>
              {([
                ["emailNotifications", dictionary.fields.emailNotifications],
                ["whatsappNotifications", dictionary.fields.whatsappNotifications],
                ["systemAlerts", dictionary.fields.systemAlerts],
                ["paymentAlerts", dictionary.fields.paymentAlerts],
                ["subscriptionAlerts", dictionary.fields.subscriptionAlerts],
              ] as const).map(([key, label]) => (
                <ToggleField
                  dictionary={dictionary}
                  key={key}
                  label={label}
                  onChange={(value) => setToggle(key, value)}
                  value={toggles[key]}
                />
              ))}
            </Section>

            <WhatsAppSettingsSection dictionary={dictionary} />
          </div>
        ) : null}

        {activeTab === "system" ? (
          <div className="space-y-5">
            <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] xl:flex-row xl:items-center xl:justify-between">
              <p className="max-w-3xl text-sm leading-6 text-[#66758a]">{dictionary.values.uiOnly}</p>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                <button className={primaryButtonClassName("w-full sm:w-auto")} type="button">
                  {dictionary.actions.saveSettings}
                </button>
                <button className={buttonClassName("secondary", "md", "w-full sm:w-auto")} type="button">
                  {dictionary.actions.resetToDefault}
                </button>
                <button
                  className={buttonClassName("warning", "md", "w-full sm:w-auto")}
                  onClick={() => setToggle("backupNowRequested", true)}
                  type="button"
                >
                  {dictionary.actions.backupNow}
                </button>
              </div>
            </section>

            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
              <Section title={dictionary.sections.general}>
                <TextField label={dictionary.fields.platformName} value={platformSettings.platformName} />
                <SelectField
                  label={dictionary.fields.defaultLanguage}
                  options={languageOptions}
                  renderOption={(option) => dictionary.languages[option as keyof typeof dictionary.languages]}
                  value={platformSettings.defaultLanguage}
                />
                <SupportedLanguages dictionary={dictionary} />
                <SelectField label={dictionary.fields.defaultCurrency} options={currencyOptions} value={platformSettings.defaultCurrency} />
                <SelectField label={dictionary.fields.timezone} options={timezoneOptions} value={platformSettings.timezone} />
                <SelectField label={dictionary.fields.dateFormat} options={dateFormatOptions} value={platformSettings.dateFormat} />
              </Section>

              <Section title={dictionary.sections.branding}>
                <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
                  <p className="text-xs font-medium text-[#66758a]">{dictionary.fields.platformLogo}</p>
                  <div className="mt-3 flex min-w-0 items-center gap-3">
                    <RoyalCareLogo className="h-14 w-14 shrink-0 rounded-md border border-[#E5E7EB] bg-white" variant="mark" />
                    <p className="min-w-0 break-words text-sm font-semibold text-[#24364f]">{dictionary.values.logoPreview}</p>
                  </div>
                </div>
                <ColorField label={dictionary.fields.primaryColor} value={platformSettings.primaryColor} />
                <ColorField label={dictionary.fields.secondaryColor} value={platformSettings.secondaryColor} />
                <TextField label={dictionary.fields.emailBranding} value={platformSettings.emailBranding} />
                <ToggleField
                  dictionary={dictionary}
                  label={dictionary.fields.loginPageBranding}
                  onChange={(value) => setToggle("loginPageBranding", value)}
                  value={toggles.loginPageBranding}
                />
              </Section>

              <Section title={dictionary.sections.security}>
                <ToggleField
                  dictionary={dictionary}
                  label={dictionary.fields.twoFactorDefault}
                  onChange={(value) => setToggle("twoFactorDefault", value)}
                  value={toggles.twoFactorDefault}
                />
                <ReadOnlyField label={dictionary.fields.passwordPolicy} value={dictionary.values.strongPasswordPolicy} />
                <TextField label={dictionary.fields.sessionTimeout} suffix={dictionary.values.minutes} type="number" value={platformSettings.sessionTimeout} />
                <TextField label={dictionary.fields.loginAttemptLimit} type="number" value={platformSettings.loginAttemptLimit} />
                <ToggleField
                  dictionary={dictionary}
                  label={dictionary.fields.forcePasswordReset}
                  onChange={(value) => setToggle("forcePasswordReset", value)}
                  value={toggles.forcePasswordReset}
                />
              </Section>

              <Section title={dictionary.sections.subscriptionDefaults}>
                <TextField label={dictionary.fields.defaultTrialDuration} suffix={dictionary.values.days} type="number" value={platformSettings.defaultTrialDuration} />
                <TextField label={dictionary.fields.gracePeriod} suffix={dictionary.values.days} type="number" value={platformSettings.gracePeriod} />
                <ReadOnlyField label={dictionary.fields.autoSuspensionRules} value={dictionary.values.afterGracePeriod} />
              </Section>

              <Section title={dictionary.sections.domainDefaults}>
                <TextField label={dictionary.fields.defaultSubdomainPattern} value={platformSettings.defaultSubdomainPattern} />
                <ToggleField
                  dictionary={dictionary}
                  label={dictionary.fields.sslAutoRenewal}
                  onChange={(value) => setToggle("sslAutoRenewal", value)}
                  value={toggles.sslAutoRenewal}
                />
                <ReadOnlyField label={dictionary.fields.dnsVerificationRules} value={dictionary.values.aCnameTxt} />
              </Section>

              <Section title={dictionary.sections.backupHealth}>
                <ReadOnlyField label={dictionary.fields.lastBackup} value={formatDate(platformSettings.lastBackup, locale)} />
                <ReadOnlyField label={dictionary.fields.backupFrequency} value={dictionary.values.daily} />
                <ReadOnlyField label={dictionary.fields.systemStatus} value={dictionary.values.operational} />
                <ReadOnlyField label={dictionary.fields.databaseHealth} value={dictionary.values.healthy} />
                <ReadOnlyField
                  label={dictionary.actions.backupNow}
                  value={toggles.backupNowRequested ? dictionary.values.enabled : dictionary.values.disabled}
                />
              </Section>
            </div>
          </div>
        ) : null}
      </div>
    </SuperAdminLayout>
  );
}
