"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
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
  whatsappPhone?: string | null;
};

type Props = {
  branding: PublicProfileBranding | null;
  onLoad: () => Promise<PublicProfileBranding | null>;
  onSave: (data: PublicProfileBranding) => Promise<void>;
  onUploadImage: (file: File, type: string) => Promise<{ url: string }>;
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
    whatsapp: "WhatsApp Phone",
    whatsappHelper: "International format e.g. 970598000000",
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
    whatsapp: "رقم واتساب",
    whatsappHelper: "صيغة دولية مثل 970598000000",
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
    whatsapp: "טלפון WhatsApp",
    whatsappHelper: "פורמט בינלאומי למשל 970598000000",
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

type FieldErrors = Record<string, string>;

export function CenterPublicProfileSection({ branding: initialBranding, onLoad, onSave, onUploadImage }: Props) {
  const { locale } = useLanguage();
  const c = copy[(locale as CopyLocale) ?? "en"] ?? copy.en;

  // Start as "loading" immediately when branding must be fetched, avoiding a flash of the empty form.
  const [loadStatus, setLoadStatus] = useState<"loading" | "done" | "error">(
    initialBranding === null ? "loading" : "done",
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
  const [whatsapp, setWhatsapp] = useState(initialBranding?.whatsappPhone ?? "");

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

  useEffect(() => {
    if (initialBranding !== null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runLoad();
  }, []);

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
      {/* Images */}
      <div className="grid min-w-0 grid-cols-1 gap-4">
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

      {/* Descriptions */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextareaField
          charsLabel={c.chars}
          dir="ltr"
          error={fieldErrors.publicDescriptionEn}
          label={c.descriptionEn}
          maxLen={800}
          onChange={setDescEn}
          value={descEn}
        />
        <TextareaField
          charsLabel={c.chars}
          dir="rtl"
          error={fieldErrors.publicDescriptionAr}
          label={c.descriptionAr}
          maxLen={800}
          onChange={setDescAr}
          value={descAr}
        />
        <TextareaField
          charsLabel={c.chars}
          dir="rtl"
          error={fieldErrors.publicDescriptionHe}
          label={c.descriptionHe}
          maxLen={800}
          onChange={setDescHe}
          value={descHe}
        />
      </div>

      {/* City */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InputField
          dir="ltr"
          error={fieldErrors.cityEn}
          label={c.cityEn}
          onChange={setCityEn}
          value={cityEn}
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
          error={fieldErrors.cityHe}
          label={c.cityHe}
          onChange={setCityHe}
          value={cityHe}
        />
      </div>

      {/* Address */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InputField
          dir="ltr"
          error={fieldErrors.addressEn}
          label={c.addressEn}
          onChange={setAddressEn}
          value={addressEn}
        />
        <InputField
          dir="rtl"
          error={fieldErrors.addressAr}
          label={c.addressAr}
          onChange={setAddressAr}
          value={addressAr}
        />
        <InputField
          dir="rtl"
          error={fieldErrors.addressHe}
          label={c.addressHe}
          onChange={setAddressHe}
          value={addressHe}
        />
      </div>

      {/* WhatsApp */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          dir="ltr"
          error={fieldErrors.whatsappPhone}
          label={c.whatsapp}
          onChange={setWhatsapp}
          placeholder={c.whatsappHelper}
          value={whatsapp}
        />
      </div>

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
