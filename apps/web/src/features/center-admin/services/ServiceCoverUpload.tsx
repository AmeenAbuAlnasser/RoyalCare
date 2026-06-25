"use client";

import { useRef, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { uploadTenantCenterPublicImage } from "@/lib/api/center-public-profile";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
const MAX_BYTES = 5 * 1024 * 1024;

const copy = {
  en: {
    label: "Service cover image",
    helper:
      "Recommended size: 1200 × 900 px, horizontal image, 4:3 ratio. Avoid vertical images or images with too much text.",
    drop: "Drag & drop or click to upload",
    formats: "JPG, PNG or WebP · up to 5MB",
    replace: "Replace",
    remove: "Remove",
    uploading: "Uploading…",
    errorType: "Only JPG, PNG, and WebP images are allowed.",
    errorSize: "Image must be 5 MB or smaller.",
    errorUpload: "Upload failed. Please try again.",
    altLabel: "Image description (alt text)",
    altPlaceholder: "e.g. Laser hair removal session",
  },
  ar: {
    label: "صورة غلاف الخدمة",
    helper:
      "لأفضل نتيجة، استخدم صورة أفقية واضحة بمقاس 1200 × 900 بكسل بنسبة 4:3. تجنب الصور الطولية أو الصور التي تحتوي على نصوص كثيرة.",
    drop: "اسحب وأفلت أو انقر للرفع",
    formats: "JPG أو PNG أو WebP · حتى 5 ميجابايت",
    replace: "استبدال",
    remove: "إزالة",
    uploading: "جارٍ الرفع…",
    errorType: "يُسمح فقط بصور JPG وPNG وWebP.",
    errorSize: "يجب أن تكون الصورة 5 ميجابايت أو أقل.",
    errorUpload: "فشل الرفع. يرجى المحاولة مرة أخرى.",
    altLabel: "وصف الصورة (نص بديل)",
    altPlaceholder: "مثال: جلسة إزالة الشعر بالليزر",
  },
  he: {
    label: "תמונת שער לשירות",
    helper:
      "גודל מומלץ: 1200×900 פיקסלים, תמונה אופקית ביחס 4:3. מומלץ להימנע מתמונות אנכיות או עם הרבה טקסט.",
    drop: "גררו ושחררו או לחצו להעלאה",
    formats: "JPG, PNG או WebP · עד 5MB",
    replace: "החלפה",
    remove: "הסרה",
    uploading: "מעלה…",
    errorType: "ניתן להעלות רק תמונות JPG, PNG ו-WebP.",
    errorSize: "התמונה חייבת להיות 5MB או פחות.",
    errorUpload: "ההעלאה נכשלה. נסו שוב.",
    altLabel: "תיאור התמונה (טקסט חלופי)",
    altPlaceholder: "לדוגמה: טיפול הסרת שיער בלייזר",
  },
} as const;

export function ServiceCoverUpload({
  value,
  alt,
  onChange,
  onAltChange,
  locale,
  disabled,
}: {
  value: string | null;
  alt: string;
  onChange: (url: string | null) => void;
  onAltChange: (alt: string) => void;
  locale: SupportedLocale;
  disabled?: boolean;
}) {
  const t = copy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedSrc = value || null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      setError(t.errorType);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t.errorSize);
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadTenantCenterPublicImage(file, "serviceCover");
      onChange(url);
    } catch {
      setError(t.errorUpload);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-w-0">
      <span className="text-sm font-semibold text-[#24364f]">{t.label}</span>

      {resolvedSrc ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EEF2F7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={alt || t.label}
              className="h-full w-full object-cover"
              src={resolvedSrc}
            />
            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
                {t.uploading}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#0B2D5C] bg-white px-3 text-xs font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C] hover:text-white disabled:opacity-60"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {t.replace}
            </button>
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              disabled={disabled || isUploading}
              onClick={() => {
                onChange(null);
                setError(null);
              }}
              type="button"
            >
              {t.remove}
            </button>
          </div>
        </div>
      ) : (
        <button
          className={`mt-2 flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            isDragging
              ? "border-[#C8A45D] bg-[#FBF7EF]"
              : "border-[#D8DEE8] bg-[#F8FAFC] hover:border-[#0B2D5C]/40"
          } disabled:opacity-60`}
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFile(event.dataTransfer.files?.[0]);
          }}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-8 w-8 text-[#9AA5B4]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            viewBox="0 0 24 24"
          >
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L21 14M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
          <span className="text-sm font-semibold text-[#40516a]">
            {isUploading ? t.uploading : t.drop}
          </span>
          <span className="text-[11px] text-[#9AA5B4]">{t.formats}</span>
        </button>
      )}

      <input
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-[#66758a]">{t.helper}</p>
      )}

      {resolvedSrc ? (
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-[#66758a]">
            {t.altLabel}
          </span>
          <input
            className="mt-1 min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
            disabled={disabled}
            onChange={(event) => onAltChange(event.target.value)}
            placeholder={t.altPlaceholder}
            value={alt}
          />
        </label>
      ) : null}
    </div>
  );
}
