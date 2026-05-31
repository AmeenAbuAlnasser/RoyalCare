"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supportedLocales, type SupportedLocale } from "@/i18n/locales";
import { trackPlatformEvent } from "@/lib/marketing/platform-track";
import { submitCenterLead } from "@/lib/api/center-leads";
import type { ApiRequestError } from "@/lib/api/super-admin-centers";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PublicHeader } from "../centers/PublicHeader";
import { PublicFooter } from "../centers/PublicFooter";

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const localeLabels: Record<SupportedLocale, string> = { en: "EN", ar: "ع", he: "ע" };

const d = {
  en: {
    hero: {
      eyebrow: "Open Your Center",
      title: "Join RoyalCare Network",
      subtitle:
        "Register your center on RoyalCare and start managing appointments, patients, and services with a professional all-in-one platform.",
    },
    form: {
      title: "Center Registration Request",
      subtitle: "Fill in your details and our team will contact you within 24 hours.",
      centerName: "Center Name",
      centerNamePlaceholder: "e.g. Al-Noor Laser Center",
      ownerName: "Owner Full Name",
      ownerNamePlaceholder: "e.g. Mohammed Al-Ahmad",
      phone: "Phone Number",
      phonePlaceholder: "+970 59 xxx xxxx",
      whatsapp: "WhatsApp Number",
      whatsappPlaceholder: "+970 59 xxx xxxx (if different)",
      city: "City",
      cityPlaceholder: "e.g. Ramallah, Gaza, Nablus...",
      businessType: "Business Type",
      businessTypePlaceholder: "Select your center type",
      notes: "Notes (optional)",
      notesPlaceholder: "Any additional info about your center...",
      submit: "Send Registration Request",
      submitting: "Sending...",
    },
    businessTypes: {
      LASER: "Laser Center",
      PHYSIOTHERAPY: "Physiotherapy Center",
      HIJAMA: "Hijama Center",
      BEAUTY: "Beauty & Cosmetics Center",
      WELLNESS: "Wellness Center",
      MULTI_SPECIALTY: "Multi-specialty Center",
    },
    success: {
      title: "Request Received!",
      message:
        "Thank you for your interest in joining RoyalCare. Our team will contact you within 24 hours to discuss next steps.",
      back: "Back to Home",
    },
    errors: {
      centerName: "Center name is required.",
      ownerName: "Owner name is required.",
      phone: "Phone number is required.",
      generic: "Something went wrong. Please try again.",
    },
    required: "Required",
    backToHome: "Back to Home",
  },
  ar: {
    hero: {
      eyebrow: "افتح مركزك",
      title: "انضم إلى شبكة RoyalCare",
      subtitle:
        "سجّل مركزك على RoyalCare وابدأ بإدارة المواعيد والمرضى والخدمات من خلال منصة متكاملة احترافية.",
    },
    form: {
      title: "طلب تسجيل مركز",
      subtitle: "أدخل بياناتك وسيتواصل معك فريقنا خلال 24 ساعة.",
      centerName: "اسم المركز",
      centerNamePlaceholder: "مثال: مركز النور للليزر",
      ownerName: "الاسم الكامل للمالك",
      ownerNamePlaceholder: "مثال: محمد الأحمد",
      phone: "رقم الهاتف",
      phonePlaceholder: "+970 59 xxx xxxx",
      whatsapp: "رقم واتساب",
      whatsappPlaceholder: "+970 59 xxx xxxx (إذا كان مختلفاً)",
      city: "المدينة",
      cityPlaceholder: "مثال: رام الله، غزة، نابلس...",
      businessType: "نوع النشاط",
      businessTypePlaceholder: "اختر نوع مركزك",
      notes: "ملاحظات (اختياري)",
      notesPlaceholder: "أي معلومات إضافية عن مركزك...",
      submit: "إرسال طلب التسجيل",
      submitting: "جارٍ الإرسال...",
    },
    businessTypes: {
      LASER: "مركز ليزر",
      PHYSIOTHERAPY: "مركز علاج طبيعي",
      HIJAMA: "مركز حجامة",
      BEAUTY: "مركز تجميل وعناية",
      WELLNESS: "مركز عافية وصحة",
      MULTI_SPECIALTY: "مركز متعدد التخصصات",
    },
    success: {
      title: "تم استلام طلبك!",
      message:
        "شكراً لاهتمامك بالانضمام إلى RoyalCare. سيتواصل معك فريقنا خلال 24 ساعة لمناقشة الخطوات القادمة.",
      back: "العودة إلى الرئيسية",
    },
    errors: {
      centerName: "اسم المركز مطلوب.",
      ownerName: "اسم المالك مطلوب.",
      phone: "رقم الهاتف مطلوب.",
      generic: "حدث خطأ، يرجى المحاولة مرة أخرى.",
    },
    required: "مطلوب",
    backToHome: "العودة إلى الرئيسية",
  },
  he: {
    hero: {
      eyebrow: "פתח את המרכז שלך",
      title: "הצטרף לרשת RoyalCare",
      subtitle:
        "הרשם את המרכז שלך ב-RoyalCare והתחל לנהל תורים, מטופלים ושירותים עם פלטפורמה מקצועית שלמה.",
    },
    form: {
      title: "בקשת רישום מרכז",
      subtitle: "מלא את הפרטים שלך וצוות שלנו יצור איתך קשר תוך 24 שעות.",
      centerName: "שם המרכז",
      centerNamePlaceholder: "למשל: מרכז לייזר אל-נור",
      ownerName: "שם מלא של הבעלים",
      ownerNamePlaceholder: "למשל: מוחמד אל-אחמד",
      phone: "מספר טלפון",
      phonePlaceholder: "+972 59 xxx xxxx",
      whatsapp: "מספר וואטסאפ",
      whatsappPlaceholder: "+972 59 xxx xxxx (אם שונה)",
      city: "עיר",
      cityPlaceholder: "למשל: ירושלים, חיפה, נצרת...",
      businessType: "סוג העסק",
      businessTypePlaceholder: "בחר את סוג המרכז שלך",
      notes: "הערות (אופציונלי)",
      notesPlaceholder: "מידע נוסף על המרכז שלך...",
      submit: "שלח בקשת רישום",
      submitting: "שולח...",
    },
    businessTypes: {
      LASER: "מרכז לייזר",
      PHYSIOTHERAPY: "מרכז פיזיותרפיה",
      HIJAMA: "מרכז חיג'אמה",
      BEAUTY: "מרכז יופי וקוסמטיקה",
      WELLNESS: "מרכז וולנס ובריאות",
      MULTI_SPECIALTY: "מרכז רב-תחומי",
    },
    success: {
      title: "הבקשה התקבלה!",
      message:
        "תודה על עניינך בהצטרפות ל-RoyalCare. הצוות שלנו יצור איתך קשר תוך 24 שעות לדיון בשלבים הבאים.",
      back: "חזרה לדף הבית",
    },
    errors: {
      centerName: "שם המרכז הוא שדה חובה.",
      ownerName: "שם הבעלים הוא שדה חובה.",
      phone: "מספר הטלפון הוא שדה חובה.",
      generic: "אירעה שגיאה, אנא נסה שוב.",
    },
    required: "חובה",
    backToHome: "חזרה לדף הבית",
  },
} as const;

const BUSINESS_TYPE_KEYS = [
  "LASER",
  "PHYSIOTHERAPY",
  "HIJAMA",
  "BEAUTY",
  "WELLNESS",
  "MULTI_SPECIALTY",
] as const;

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#0B2D5C]" htmlFor={id}>
        {label}
        {required && <span className="ms-1 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#E3E8EF] bg-white px-4 py-2.5 text-sm text-[#132238] placeholder-[#9BABBF] transition focus:border-[#0B2D5C]/50 focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#9BABBF]";
const errorInputClass = "border-rose-400 focus:border-rose-400 focus:ring-rose-400/10";

// ─── Main page ────────────────────────────────────────────────────────────────

export function OpenCenterPage() {
  const { locale, direction } = useLanguage();
  const dict = d[locale];
  const isRtl = direction === "rtl";

  const [centerName, setCenterName]     = useState("");
  const [ownerName, setOwnerName]       = useState("");
  const [phone, setPhone]               = useState("");
  const [whatsapp, setWhatsapp]         = useState("");
  const [city, setCity]                 = useState("");
  const [businessType, setBusinessType] = useState("");
  const [notes, setNotes]               = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [globalError, setGlobalError]   = useState("");

  // Fire OpenCenterSignup once on mount
  useEffect(() => {
    trackPlatformEvent("OpenCenterSignup");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    // Client-side validation
    const clientErrors: Record<string, string> = {};
    if (!centerName.trim()) clientErrors.centerName = dict.errors.centerName;
    if (!ownerName.trim())  clientErrors.ownerName  = dict.errors.ownerName;
    if (!phone.trim())      clientErrors.phone      = dict.errors.phone;
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCenterLead({
        centerName: centerName.trim(),
        ownerName:  ownerName.trim(),
        phone:      phone.trim(),
        whatsapp:   whatsapp.trim() || undefined,
        city:       city.trim() || undefined,
        businessType: businessType || undefined,
        notes:      notes.trim() || undefined,
      });

      trackPlatformEvent("SubmitLead", { businessType });
      setIsSuccess(true);
    } catch (err) {
      const apiErr = err as ApiRequestError;
      const details = apiErr?.details as { errors?: Record<string, string>; message?: string } | null;
      if (details?.errors && typeof details.errors === "object") {
        setErrors(details.errors);
      } else {
        setGlobalError(details?.message ?? dict.errors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col" dir={direction}>
        <PublicHeader locale={locale} />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <div className="w-full max-w-lg rounded-2xl border border-[#E3E8EF] bg-white p-8 text-center shadow-[0_8px_40px_rgba(11,45,92,0.08)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-[#0B2D5C]">{dict.success.title}</h2>
            <p className="mb-8 text-[#526176]">{dict.success.message}</p>
            <Link
              className={buttonClassName("primary", "lg", "w-full justify-center")}
              href="/centers"
            >
              {dict.success.back}
            </Link>
          </div>
        </main>
        <PublicFooter locale={locale} />
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]" dir={direction}>
      <PublicHeader locale={locale} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#071F3F] to-[#0B2D5C] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-block rounded-full bg-[#C8A45D]/18 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#D8BD7A]">
            {dict.hero.eyebrow}
          </p>
          <h1 className="mb-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            {dict.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Form card */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-[0_8px_40px_rgba(11,45,92,0.07)] sm:p-8">
          <h2 className="mb-1 text-xl font-bold text-[#0B2D5C]">{dict.form.title}</h2>
          <p className="mb-8 text-sm text-[#526176]">{dict.form.subtitle}</p>

          {globalError ? (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {globalError}
            </div>
          ) : null}

          <form className="space-y-5" noValidate onSubmit={(e) => void handleSubmit(e)}>
            {/* Row: Center Name + Business Type */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                error={errors.centerName}
                id="centerName"
                label={dict.form.centerName}
                required
              >
                <input
                  className={`${inputClass} ${errors.centerName ? errorInputClass : ""}`}
                  disabled={isSubmitting}
                  id="centerName"
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder={dict.form.centerNamePlaceholder}
                  type="text"
                  value={centerName}
                />
              </Field>

              <Field id="businessType" label={dict.form.businessType}>
                <select
                  className={`${inputClass} ${isRtl ? "text-end" : ""}`}
                  disabled={isSubmitting}
                  id="businessType"
                  onChange={(e) => setBusinessType(e.target.value)}
                  value={businessType}
                >
                  <option value="">{dict.form.businessTypePlaceholder}</option>
                  {BUSINESS_TYPE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {dict.businessTypes[key]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Owner Name */}
            <Field
              error={errors.ownerName}
              id="ownerName"
              label={dict.form.ownerName}
              required
            >
              <input
                className={`${inputClass} ${errors.ownerName ? errorInputClass : ""}`}
                disabled={isSubmitting}
                id="ownerName"
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={dict.form.ownerNamePlaceholder}
                type="text"
                value={ownerName}
              />
            </Field>

            {/* Row: Phone + WhatsApp */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                error={errors.phone}
                id="phone"
                label={dict.form.phone}
                required
              >
                <input
                  className={`${inputClass} ${errors.phone ? errorInputClass : ""} ltr`}
                  dir="ltr"
                  disabled={isSubmitting}
                  id="phone"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={dict.form.phonePlaceholder}
                  type="tel"
                  value={phone}
                />
              </Field>

              <Field id="whatsapp" label={dict.form.whatsapp}>
                <input
                  className={`${inputClass} ltr`}
                  dir="ltr"
                  disabled={isSubmitting}
                  id="whatsapp"
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={dict.form.whatsappPlaceholder}
                  type="tel"
                  value={whatsapp}
                />
              </Field>
            </div>

            {/* City */}
            <Field id="city" label={dict.form.city}>
              <input
                className={inputClass}
                disabled={isSubmitting}
                id="city"
                onChange={(e) => setCity(e.target.value)}
                placeholder={dict.form.cityPlaceholder}
                type="text"
                value={city}
              />
            </Field>

            {/* Notes */}
            <Field id="notes" label={dict.form.notes}>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                disabled={isSubmitting}
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder={dict.form.notesPlaceholder}
                rows={3}
                value={notes}
              />
            </Field>

            <button
              className={buttonClassName("warning", "lg", "w-full justify-center")}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? dict.form.submitting : dict.form.submit}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[#526176]">
          <Link className="font-semibold text-[#0B2D5C] underline-offset-2 hover:underline" href="/centers">
            {dict.backToHome}
          </Link>
        </p>
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
