"use client";

import { useEffect, useRef, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  getTenantSeo,
  uploadTenantOgImage,
  upsertTenantSeo,
  type TenantSeoPayload,
  type TenantSeoSettings,
} from "@/lib/api/tenant-seo";
import { CenterAdminShell } from "../layout/CenterAdminShell";

// ─── Copy ─────────────────────────────────────────────────────────────────────

const copy = {
  en: {
    title: "SEO & Open Graph",
    subtitle: "Control how your center appears in search engines and social media previews.",
    seoSection: "Search Engine Optimization",
    ogSection: "Open Graph / Social Preview",
    seoTitleEn: "SEO Title (EN)",
    seoTitleAr: "SEO Title (AR)",
    seoTitleHe: "SEO Title (HE)",
    seoDescEn: "Meta Description (EN)",
    seoDescAr: "Meta Description (AR)",
    seoDescHe: "Meta Description (HE)",
    keywordsEn: "Keywords (EN)",
    keywordsAr: "Keywords (AR)",
    keywordsHe: "Keywords (HE)",
    keywordsHint: "Comma-separated keywords, e.g. laser clinic, hair removal, Tel Aviv",
    ogTitleEn: "OG Title (EN)",
    ogTitleAr: "OG Title (AR)",
    ogTitleHe: "OG Title (HE)",
    ogDescEn: "OG Description (EN)",
    ogDescAr: "OG Description (AR)",
    ogDescHe: "OG Description (HE)",
    ogImage: "OG Image",
    ogImageHint: "Recommended: 1200 × 630 px · Landscape · JPG / PNG / WebP · Max 8 MB",
    ogImageUpload: "Upload Image",
    ogImageUploading: "Uploading…",
    ogImageRemove: "Remove Image",
    loading: "Loading SEO settings…",
    loadError: "Could not load SEO settings. Please try again.",
    save: "Save Settings",
    saving: "Saving…",
    saveSuccess: "SEO settings saved.",
    saveError: "Could not save. Please try again.",
    seoTitleHint: "Ideal length: 50–60 characters.",
    seoDescHint: "Ideal length: 120–160 characters.",
    ogTitleHint: "Defaults to SEO title if left empty.",
    ogDescHint: "Defaults to SEO description if left empty.",
  },
  ar: {
    title: "SEO والمعاينة الاجتماعية",
    subtitle: "تحكم في كيفية ظهور مركزك في محركات البحث ومعاينات وسائل التواصل الاجتماعي.",
    seoSection: "تحسين محركات البحث",
    ogSection: "البطاقة الاجتماعية (Open Graph)",
    seoTitleEn: "عنوان SEO (EN)",
    seoTitleAr: "عنوان SEO (AR)",
    seoTitleHe: "عنوان SEO (HE)",
    seoDescEn: "الوصف التعريفي (EN)",
    seoDescAr: "الوصف التعريفي (AR)",
    seoDescHe: "الوصف التعريفي (HE)",
    keywordsEn: "الكلمات المفتاحية (EN)",
    keywordsAr: "الكلمات المفتاحية (AR)",
    keywordsHe: "الكلمات المفتاحية (HE)",
    keywordsHint: "كلمات مفصولة بفاصلة، مثال: عيادة ليزر، إزالة الشعر، تل أبيب",
    ogTitleEn: "عنوان OG (EN)",
    ogTitleAr: "عنوان OG (AR)",
    ogTitleHe: "عنوان OG (HE)",
    ogDescEn: "وصف OG (EN)",
    ogDescAr: "وصف OG (AR)",
    ogDescHe: "وصف OG (HE)",
    ogImage: "صورة OG",
    ogImageHint: "مقترح: ١٢٠٠ × ٦٣٠ بكسل · أفقي · JPG / PNG / WebP · الحد الأقصى ٨ ميغابايت",
    ogImageUpload: "رفع صورة",
    ogImageUploading: "جار الرفع…",
    ogImageRemove: "إزالة الصورة",
    loading: "جار تحميل إعدادات SEO…",
    loadError: "تعذر تحميل الإعدادات. يرجى المحاولة مرة أخرى.",
    save: "حفظ الإعدادات",
    saving: "جار الحفظ…",
    saveSuccess: "تم حفظ إعدادات SEO.",
    saveError: "تعذر الحفظ. يرجى المحاولة مرة أخرى.",
    seoTitleHint: "الطول المثالي: ٥٠–٦٠ حرفًا.",
    seoDescHint: "الطول المثالي: ١٢٠–١٦٠ حرفًا.",
    ogTitleHint: "يستخدم عنوان SEO عند الترك فارغًا.",
    ogDescHint: "يستخدم وصف SEO عند الترك فارغًا.",
  },
  he: {
    title: "SEO ותצוגה מקדימה חברתית",
    subtitle: "שלוט באיך המרכז שלך מופיע במנועי חיפוש וברשתות חברתיות.",
    seoSection: "קידום אתרים (SEO)",
    ogSection: "כרטיס Open Graph / מדיה חברתית",
    seoTitleEn: "כותרת SEO (EN)",
    seoTitleAr: "כותרת SEO (AR)",
    seoTitleHe: "כותרת SEO (HE)",
    seoDescEn: "תיאור מטא (EN)",
    seoDescAr: "תיאור מטא (AR)",
    seoDescHe: "תיאור מטא (HE)",
    keywordsEn: "מילות מפתח (EN)",
    keywordsAr: "מילות מפתח (AR)",
    keywordsHe: "מילות מפתח (HE)",
    keywordsHint: "מילות מפתח מופרדות בפסיק, לדוגמה: קליניקת לייזר, הסרת שיער, תל אביב",
    ogTitleEn: "כותרת OG (EN)",
    ogTitleAr: "כותרת OG (AR)",
    ogTitleHe: "כותרת OG (HE)",
    ogDescEn: "תיאור OG (EN)",
    ogDescAr: "תיאור OG (AR)",
    ogDescHe: "תיאור OG (HE)",
    ogImage: "תמונת OG",
    ogImageHint: "מומלץ: 1200 × 630 פיקסל · לרוחב · JPG / PNG / WebP · מקסימום 8 MB",
    ogImageUpload: "העלה תמונה",
    ogImageUploading: "מעלה…",
    ogImageRemove: "הסר תמונה",
    loading: "טוען הגדרות SEO…",
    loadError: "לא ניתן לטעון הגדרות. נסה שוב.",
    save: "שמור הגדרות",
    saving: "שומר…",
    saveSuccess: "הגדרות SEO נשמרו.",
    saveError: "לא ניתן לשמור. נסה שוב.",
    seoTitleHint: "אורך אידיאלי: 50–60 תווים.",
    seoDescHint: "אורך אידיאלי: 120–160 תווים.",
    ogTitleHint: "ברירת המחדל: כותרת SEO אם ריק.",
    ogDescHint: "ברירת המחדל: תיאור SEO אם ריק.",
  },
} as const;

type Lang = keyof typeof copy;

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyPayload: TenantSeoPayload = {
  seoTitleAr: null,
  seoTitleEn: null,
  seoTitleHe: null,
  seoDescriptionAr: null,
  seoDescriptionEn: null,
  seoDescriptionHe: null,
  keywordsAr: null,
  keywordsEn: null,
  keywordsHe: null,
  ogTitleAr: null,
  ogTitleEn: null,
  ogTitleHe: null,
  ogDescriptionAr: null,
  ogDescriptionEn: null,
  ogDescriptionHe: null,
  ogImageUrl: null,
};

function settingsToPayload(s: TenantSeoSettings): TenantSeoPayload {
  return {
    seoTitleAr: s.seoTitleAr,
    seoTitleEn: s.seoTitleEn,
    seoTitleHe: s.seoTitleHe,
    seoDescriptionAr: s.seoDescriptionAr,
    seoDescriptionEn: s.seoDescriptionEn,
    seoDescriptionHe: s.seoDescriptionHe,
    keywordsAr: s.keywordsAr,
    keywordsEn: s.keywordsEn,
    keywordsHe: s.keywordsHe,
    ogTitleAr: s.ogTitleAr,
    ogTitleEn: s.ogTitleEn,
    ogTitleHe: s.ogTitleHe,
    ogDescriptionAr: s.ogDescriptionAr,
    ogDescriptionEn: s.ogDescriptionEn,
    ogDescriptionHe: s.ogDescriptionHe,
    ogImageUrl: s.ogImageUrl,
  };
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  dir,
  hint,
  label,
  maxLength,
  multiline,
  onChange,
  value,
}: {
  dir?: "ltr" | "rtl";
  hint?: string;
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChange: (v: string | null) => void;
  value: string | null;
}) {
  const base =
    "w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-sm text-[#132238] placeholder-gray-400 outline-none transition focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20";
  const currentLen = (value ?? "").length;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[#24364f]">{label}</label>
        {maxLength ? (
          <span
            className={`shrink-0 text-xs ${currentLen > maxLength * 0.9 ? "text-amber-600" : "text-gray-400"}`}
          >
            {currentLen}/{maxLength}
          </span>
        ) : null}
      </div>
      {multiline ? (
        <textarea
          className={`${base} resize-none`}
          dir={dir}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value || null)}
          rows={3}
          value={value ?? ""}
        />
      ) : (
        <input
          className={base}
          dir={dir}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value || null)}
          type="text"
          value={value ?? ""}
        />
      )}
      {hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

// ─── OG image upload ──────────────────────────────────────────────────────────

function OgImageUpload({
  hint,
  label,
  onRemove,
  onUpload,
  removeLabel,
  uploadLabel,
  uploadingLabel,
  value,
}: {
  hint: string;
  label: string;
  onRemove: () => void;
  onUpload: (url: string) => void;
  removeLabel: string;
  uploadLabel: string;
  uploadingLabel: string;
  value: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const result = await uploadTenantOgImage(file);
      onUpload(result.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#24364f]">{label}</label>
      {value ? (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start">
          {/* Preview constrained to a fixed width so it never expands to full card */}
          <div
            className="w-full shrink-0 overflow-hidden rounded-lg border border-[#D8DEE8] bg-gray-50 sm:w-56"
            style={{ aspectRatio: "1200/630" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="OG preview" className="h-full w-full object-cover" src={value} />
          </div>
          <button
            className={buttonClassName("danger", "sm")}
            onClick={onRemove}
            type="button"
          >
            {removeLabel}
          </button>
        </div>
      ) : (
        <>
          <button
            className={buttonClassName("secondary", "sm", "self-start")}
            disabled={uploading}
            onClick={() => ref.current?.click()}
            type="button"
          >
            {uploading ? uploadingLabel : uploadLabel}
          </button>
          <input
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
            ref={ref}
            type="file"
          />
        </>
      )}
      <p className="text-xs text-gray-400">{hint}</p>
      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-[#E5E7EB] pb-2 text-xs font-semibold uppercase tracking-widest text-[#C8A45D]">
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TenantSeoPage() {
  const { locale } = useLanguage();
  const t = copy[locale as Lang] ?? copy.en;

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [form, setForm] = useState<TenantSeoPayload>(emptyPayload);
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [saveMessage, setSaveMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getTenantSeo()
      .then(({ item }) => {
        if (item) setForm(settingsToPayload(item));
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, []);

  function set(key: keyof TenantSeoPayload, value: string | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaveState("saving");
    setSaveMessage(null);
    try {
      await upsertTenantSeo(form);
      setSaveMessage({ tone: "success", text: t.saveSuccess });
    } catch (err) {
      setSaveMessage({
        tone: "error",
        text: err instanceof Error ? err.message : t.saveError,
      });
    } finally {
      setSaveState("idle");
    }
  }

  return (
    <CenterAdminShell
      activeNav="seo"
      requiredPermission="settings:view"
      subtitle={() => t.subtitle}
      title={() => t.title}
    >
      {() => (
        <>
          {loadState === "loading" && (
            <AdminState className="mt-5" loading title={t.loading} />
          )}
          {loadState === "error" && (
            <AdminState className="mt-5" title={t.loadError} tone="error" />
          )}

          {loadState === "ready" && (
            <div className="mt-5 space-y-5">
              {/* SEO section */}
              <AdminCard className="p-4 sm:p-5">
                <div className="space-y-5">
                  <SectionLabel>{t.seoSection}</SectionLabel>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      dir="rtl"
                      hint={t.seoTitleHint}
                      label={t.seoTitleAr}
                      maxLength={160}
                      onChange={(v) => set("seoTitleAr", v)}
                      value={form.seoTitleAr}
                    />
                    <Field
                      hint={t.seoTitleHint}
                      label={t.seoTitleEn}
                      maxLength={160}
                      onChange={(v) => set("seoTitleEn", v)}
                      value={form.seoTitleEn}
                    />
                    <Field
                      dir="rtl"
                      hint={t.seoTitleHint}
                      label={t.seoTitleHe}
                      maxLength={160}
                      onChange={(v) => set("seoTitleHe", v)}
                      value={form.seoTitleHe}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      dir="rtl"
                      hint={t.seoDescHint}
                      label={t.seoDescAr}
                      maxLength={320}
                      multiline
                      onChange={(v) => set("seoDescriptionAr", v)}
                      value={form.seoDescriptionAr}
                    />
                    <Field
                      hint={t.seoDescHint}
                      label={t.seoDescEn}
                      maxLength={320}
                      multiline
                      onChange={(v) => set("seoDescriptionEn", v)}
                      value={form.seoDescriptionEn}
                    />
                    <Field
                      dir="rtl"
                      hint={t.seoDescHint}
                      label={t.seoDescHe}
                      maxLength={320}
                      multiline
                      onChange={(v) => set("seoDescriptionHe", v)}
                      value={form.seoDescriptionHe}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      dir="rtl"
                      hint={t.keywordsHint}
                      label={t.keywordsAr}
                      maxLength={500}
                      onChange={(v) => set("keywordsAr", v)}
                      value={form.keywordsAr}
                    />
                    <Field
                      hint={t.keywordsHint}
                      label={t.keywordsEn}
                      maxLength={500}
                      onChange={(v) => set("keywordsEn", v)}
                      value={form.keywordsEn}
                    />
                    <Field
                      dir="rtl"
                      hint={t.keywordsHint}
                      label={t.keywordsHe}
                      maxLength={500}
                      onChange={(v) => set("keywordsHe", v)}
                      value={form.keywordsHe}
                    />
                  </div>
                </div>
              </AdminCard>

              {/* Open Graph section */}
              <AdminCard className="p-4 sm:p-5">
                <div className="space-y-4">
                  <SectionLabel>{t.ogSection}</SectionLabel>

                  <OgImageUpload
                    hint={t.ogImageHint}
                    label={t.ogImage}
                    onRemove={() => set("ogImageUrl", null)}
                    onUpload={(url) => set("ogImageUrl", url)}
                    removeLabel={t.ogImageRemove}
                    uploadLabel={t.ogImageUpload}
                    uploadingLabel={t.ogImageUploading}
                    value={form.ogImageUrl}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      dir="rtl"
                      hint={t.ogTitleHint}
                      label={t.ogTitleAr}
                      maxLength={160}
                      onChange={(v) => set("ogTitleAr", v)}
                      value={form.ogTitleAr}
                    />
                    <Field
                      hint={t.ogTitleHint}
                      label={t.ogTitleEn}
                      maxLength={160}
                      onChange={(v) => set("ogTitleEn", v)}
                      value={form.ogTitleEn}
                    />
                    <Field
                      dir="rtl"
                      hint={t.ogTitleHint}
                      label={t.ogTitleHe}
                      maxLength={160}
                      onChange={(v) => set("ogTitleHe", v)}
                      value={form.ogTitleHe}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      dir="rtl"
                      hint={t.ogDescHint}
                      label={t.ogDescAr}
                      maxLength={320}
                      multiline
                      onChange={(v) => set("ogDescriptionAr", v)}
                      value={form.ogDescriptionAr}
                    />
                    <Field
                      hint={t.ogDescHint}
                      label={t.ogDescEn}
                      maxLength={320}
                      multiline
                      onChange={(v) => set("ogDescriptionEn", v)}
                      value={form.ogDescriptionEn}
                    />
                    <Field
                      dir="rtl"
                      hint={t.ogDescHint}
                      label={t.ogDescHe}
                      maxLength={320}
                      multiline
                      onChange={(v) => set("ogDescriptionHe", v)}
                      value={form.ogDescriptionHe}
                    />
                  </div>
                </div>
              </AdminCard>

              {/* Save row */}
              <div className="flex min-w-0 items-center justify-between gap-4">
                {saveMessage ? (
                  <p
                    className={`min-w-0 break-words text-sm font-semibold ${
                      saveMessage.tone === "success" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {saveMessage.text}
                  </p>
                ) : (
                  <span />
                )}
                <button
                  className={buttonClassName("primary", "md")}
                  disabled={saveState === "saving"}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {saveState === "saving" ? t.saving : t.save}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </CenterAdminShell>
  );
}
