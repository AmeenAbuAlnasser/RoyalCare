"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TenantMarketingInjector } from "@/components/marketing/TenantMarketingInjector";
import { AdminState } from "@/components/ui/admin-surfaces";
import { useLanguage } from "@/i18n/LanguageProvider";
import { publicCentersDictionaries } from "@/i18n/dictionaries/public-centers";
import type { SupportedLocale } from "@/i18n/locales";
import {
  getPublicCenter,
  getPublicCenterOffers,
  type PublicCenterDetail,
  type PublicOffer,
  type PublicServiceFull,
} from "@/lib/api/public-centers";
import {
  createPublicBookingRequest,
  getPublicAvailability,
  type AvailabilitySlot,
  type BookingRequestError,
} from "@/lib/api/public-booking";
import { trackMarketingEvent } from "@/lib/marketing/track-event";
import { trackCenterEvent } from "@/lib/marketing/track-center-event";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";
import {
  FAVICON_EVENT,
  type FaviconUpdateDetail,
} from "@/components/brand/GlobalFavicon";
import { SmartContactWidget } from "@/components/center/SmartContactWidget";

type Dictionary = (typeof publicCentersDictionaries)["en"];

type BookingConfirmation = {
  centerName: string;
  serviceName: string;
  date: string;
  time: string;
  patientName: string;
  phone: string;
  patientArea: string;
  notes: string;
};

const simpleRequestCopy = {
  en: {
    intro:
      "Leave your details and we will contact you to confirm the appointment.",
    selectedService: "Selected service",
    noService: "The center will help you choose the right service.",
  },
  ar: {
    intro: "اترك بياناتك وسنتواصل معك لتأكيد الموعد.",
    selectedService: "الخدمة المختارة",
    noService: "سيساعدك المركز في اختيار الخدمة المناسبة.",
  },
  he: {
    intro: "השאירו פרטים וניצור איתכם קשר לאישור התור.",
    selectedService: "שירות נבחר",
    noService: "המרכז יעזור לכם לבחור את השירות המתאים.",
  },
} as const;

const patientAreaOptions = [
  "جنين",
  "قباطية",
  "يعبد",
  "طولكرم",
  "نابلس",
  "رام الله",
  "الداخل",
  "أخرى",
] as const;

const patientAreaCopy = {
  en: {
    label: "City / Area (optional)",
    placeholder: "Choose or type city / area",
    manualPlaceholder: "Type city / area",
    tooLong: "City / area must be 120 characters or fewer.",
  },
  ar: {
    label: "المدينة / المنطقة (اختياري)",
    placeholder: "اختر أو اكتب المدينة / المنطقة",
    manualPlaceholder: "اكتب المدينة / المنطقة",
    tooLong: "يجب ألا تتجاوز المدينة / المنطقة 120 حرفًا.",
  },
  he: {
    label: "עיר / אזור (אופציונלי)",
    placeholder: "בחרו או הקלידו עיר / אזור",
    manualPlaceholder: "הקלידו עיר / אזור",
    tooLong: "עיר / אזור חייבים להיות עד 120 תווים.",
  },
} as const;

const branchSelectCopy = {
  en: {
    title: "Choose branch",
    required: "Choose branch",
    error: "Choose branch",
    map: "View map",
    phone: "Phone",
    whatsapp: "WhatsApp",
  },
  ar: {
    title: "اختر الفرع",
    required: "اختر الفرع",
    error: "اختر الفرع",
    phone: "الهاتف",
    whatsapp: "واتساب",
  },
  he: {
    title: "בחר סניף",
    required: "בחר סניף",
    error: "בחר סניף",
    phone: "טלפון",
    whatsapp: "וואטסאפ",
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveLocalizedName(
  center: Pick<PublicCenterDetail, "name" | "nameAr" | "nameEn" | "nameHe">,
  _locale: SupportedLocale,
): string {
  void _locale;
  return center.name || center.nameEn || center.nameAr || center.nameHe || "";
}

function resolveServiceName(
  service: PublicServiceFull,
  _locale: SupportedLocale,
): string {
  void _locale;
  return service.nameEn || service.nameAr || service.nameHe;
}

function resolveBranchCity(
  branch: PublicCenterDetail["branches"][number],
  locale: SupportedLocale,
) {
  if (locale === "ar") return branch.cityAr || branch.cityEn || branch.cityHe;
  if (locale === "he") return branch.cityHe || branch.cityEn || branch.cityAr;
  return branch.cityEn || branch.cityAr || branch.cityHe;
}

function resolveBranchAddress(
  branch: PublicCenterDetail["branches"][number],
  locale: SupportedLocale,
) {
  const localized =
    locale === "ar"
      ? branch.addressAr
      : locale === "he"
        ? branch.addressHe
        : branch.addressEn;
  return (
    localized ||
    branch.addressAr ||
    branch.addressEn ||
    branch.addressHe ||
    resolveBranchCity(branch, locale) ||
    ""
  );
}

function getBranchMapLabel(locale: SupportedLocale) {
  if (locale === "ar") return "عرض على الخريطة";
  if (locale === "he") return "הצג במפה";
  return "View map";
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMaxDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string, locale: SupportedLocale): string {
  if (!dateStr) return "";
  try {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const date = new Date(y, mo - 1, d);
    const localeTag =
      locale === "ar" ? "ar-SA" : locale === "he" ? "he-IL" : "en-US";
    return date.toLocaleDateString(localeTag, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDisplayTime(timeStr: string, locale: SupportedLocale): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  try {
    const date = new Date();
    date.setHours(h, m, 0, 0);
    const localeTag =
      locale === "ar" ? "ar-SA" : locale === "he" ? "he-IL" : "en-US";
    return date.toLocaleTimeString(localeTag, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr;
  }
}

function buildWhatsAppHref(
  message: string,
  phone?: string | null,
): string | null {
  if (!phone) return null;
  const normalized = normalizeForWhatsApp(phone, readWhatsAppDefaultCode());
  if (!/^\d{7,15}$/.test(normalized)) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

const WA_ICON = (
  <svg
    aria-hidden="true"
    className="h-4 w-4 shrink-0"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ─── Center website navbar (no RoyalCare platform header) ────────────────────

const centerWebsiteLabels = {
  en: {
    home: "Home",
    services: "Services",
    contact: "Contact",
    backToCenter: "Back to center",
  },
  ar: {
    home: "الرئيسية",
    services: "الخدمات",
    contact: "التواصل",
    backToCenter: "العودة للمركز",
  },
  he: {
    home: "בית",
    services: "שירותים",
    contact: "יצירת קשר",
    backToCenter: "חזרה למרכז",
  },
} as const;

function BookingNavbar({
  center,
  slug,
  locale,
}: {
  center: PublicCenterDetail | null;
  slug: string;
  locale: SupportedLocale;
}) {
  const isRtl = locale === "ar" || locale === "he";
  const labels = centerWebsiteLabels[locale];
  const primaryColor = center?.branding?.primaryColor ?? "#0B2D5C";
  const displayName = center ? resolveLocalizedName(center, locale) : "";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  const baseHref = `/c/${slug}`;

  return (
    <nav
      className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(11,45,92,0.06)]"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo + Name */}
        <Link
          className="flex min-w-0 shrink-0 items-center gap-2.5"
          href={baseHref}
        >
          {center?.branding?.logoUrl ? (
            <img
              alt={displayName}
              className="h-9 w-9 shrink-0 rounded-lg border-2 border-[#E5E7EB] object-contain"
              src={center.branding.logoUrl}
            />
          ) : displayName ? (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {initials || "?"}
            </div>
          ) : (
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-[#E5E7EB]" />
          )}
          {displayName ? (
            <span className="max-w-[150px] truncate text-sm font-bold text-[#0B2D5C] sm:max-w-[240px]">
              {displayName}
            </span>
          ) : (
            <div className="h-4 w-28 animate-pulse rounded bg-[#E5E7EB]" />
          )}
        </Link>

        <div className="flex-1" />

        {/* Desktop nav links */}
        <div className="hidden items-center gap-0.5 sm:flex">
          {(
            [
              { href: baseHref, label: labels.home },
              { href: `${baseHref}/services`, label: labels.services },
              { href: `${baseHref}/contact`, label: labels.contact },
            ] as { href: string; label: string }[]
          ).map(({ href, label }) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#526176] transition hover:bg-[#F1F5F9] hover:text-[#0B2D5C]"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Back to center — mobile & desktop CTA */}
        <Link
          className="ms-2 inline-flex min-h-9 shrink-0 items-center rounded-xl border-2 border-[#0B2D5C] bg-[#0B2D5C] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B2D5C]/90 sm:px-4 sm:text-sm"
          href={baseHref}
        >
          {labels.backToCenter}
        </Link>
      </div>
    </nav>
  );
}

// ─── Small UI primitives ──────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p
      className="mt-1.5 text-xs font-semibold leading-5 text-red-600"
      role="alert"
    >
      {msg}
    </p>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-6 shadow-[0_6px_20px_rgba(11,45,92,0.06)] sm:px-6">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#66758a]">
      {children}
    </h2>
  );
}

// ─── Center summary card ──────────────────────────────────────────────────────

function CenterSummaryCard({
  center,
  d,
  locale,
}: {
  center: PublicCenterDetail;
  d: Dictionary;
  locale: SupportedLocale;
}) {
  const name = resolveLocalizedName(center, locale);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-4">
      {center.branding?.logoUrl ? (
        <img
          alt={name}
          className="h-14 w-14 shrink-0 rounded-xl border border-[#E5E7EB] object-contain shadow-sm"
          src={center.branding.logoUrl}
        />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
          style={{
            backgroundColor: center.branding?.primaryColor ?? "#0B2D5C",
          }}
        >
          {initials || "?"}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-[#0B2D5C]">{name}</p>
        <p className="mt-0.5 text-xs text-[#66758a]">
          {center.services.length} {d.directory.servicesLabel}
        </p>
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({
  confirmation,
  locale,
  slug,
  d,
  whatsappPhone,
}: {
  confirmation: BookingConfirmation;
  locale: SupportedLocale;
  slug: string;
  d: Dictionary;
  whatsappPhone: string | null;
}) {
  const followUpMessage =
    confirmation.date && confirmation.time
      ? `Hello, I sent a booking request for ${confirmation.serviceName} on ${confirmation.date} at ${confirmation.time}. Could you please confirm my appointment?\n\nName: ${confirmation.patientName}\nPhone: ${confirmation.phone}${confirmation.patientArea ? `\nCity / Area: ${confirmation.patientArea}` : ""}`
      : `Hello, I sent a booking request for ${confirmation.serviceName || confirmation.centerName}. Could you please contact me to confirm the appointment?\n\nName: ${confirmation.patientName}\nPhone: ${confirmation.phone}${confirmation.patientArea ? `\nCity / Area: ${confirmation.patientArea}` : ""}`;
  const waHref = buildWhatsAppHref(followUpMessage, whatsappPhone);

  return (
    <SectionCard>
      <div className="flex flex-col items-center py-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            aria-hidden="true"
            className="h-8 w-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#0B2D5C]">
          {d.booking.successTitle}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#66758a]">
          {d.booking.successSubtitle}
        </p>

        <div className="mt-6 w-full max-w-sm rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-start">
          <dl className="space-y-2.5">
            {[
              {
                label: d.booking.successCenterLabel,
                value: confirmation.centerName,
              },
              {
                label: d.booking.successServiceLabel,
                value: confirmation.serviceName,
              },
              {
                label: patientAreaCopy[locale].label,
                value: confirmation.patientArea,
              },
              { label: d.booking.successDateLabel, value: confirmation.date },
              { label: d.booking.successTimeLabel, value: confirmation.time },
            ]
              .filter(({ value }) => Boolean(value))
              .map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-semibold text-[#66758a]">
                    {label}
                  </dt>
                  <dd className="min-w-0 break-words text-xs font-medium text-[#0B2D5C]">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {waHref && (
            <a
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
              href={waHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              {WA_ICON}
              {d.booking.successWhatsApp}
            </a>
          )}
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#0B2D5C] bg-transparent px-5 py-2.5 text-sm font-bold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/5 sm:w-auto"
            href={`/c/${slug}`}
          >
            {d.booking.backToCenter}
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main booking form ────────────────────────────────────────────────────────

const offerModeLabels = {
  en: {
    switchToService: "Choose a specific service instead",
    hideServiceList: "Hide service list",
  },
  ar: {
    switchToService: "اختر خدمة بدلاً من العرض",
    hideServiceList: "إخفاء قائمة الخدمات",
  },
  he: {
    switchToService: "בחר שירות ספציפי במקום",
    hideServiceList: "הסתר רשימת שירותים",
  },
} as const;

function BookingForm({
  center,
  slug,
  locale,
  d,
  offer,
  initialServiceId,
}: {
  center: PublicCenterDetail;
  slug: string;
  locale: SupportedLocale;
  d: Dictionary;
  offer: PublicOffer | null;
  initialServiceId?: string;
}) {
  const isOfferBooking = Boolean(offer);
  const isSimpleRequest =
    center.branding?.publicBookingMode !== "DIRECT_BOOKING";
  const centerName = resolveLocalizedName(center, locale);
  const today = getTodayString();
  const maxDate = getMaxDateString();
  const srCopy = simpleRequestCopy[locale];
  const branchCopy = branchSelectCopy[locale];
  const activeBranches = center.branches ?? [];
  const shouldChooseBranch = isSimpleRequest && activeBranches.length > 1;

  // In offer mode the service list is hidden by default; user can reveal it manually.
  const [showServiceList, setShowServiceList] = useState(false);

  const [selectedServiceIdx, setSelectedServiceIdx] = useState<number | null>(
    () => {
      if (!initialServiceId || isOfferBooking) return null;
      const idx = center.services.findIndex((s) => s.id === initialServiceId);
      return idx >= 0 ? idx : null;
    },
  );

  // Fire SelectService tracking once when a service is preselected via URL param.
  useEffect(() => {
    if (!initialServiceId || isOfferBooking) return;
    const idx = center.services.findIndex((s) => s.id === initialServiceId);
    if (idx === -1) return;
    const service = center.services[idx];
    const name = resolveServiceName(service, locale);
    trackMarketingEvent("SelectService", {
      centerName,
      centerSlug: slug,
      serviceId: service.id,
      serviceName: name,
    });
    trackCenterEvent(slug, "SELECT_SERVICE", {
      page: "/book",
      extraData: { serviceId: service.id, serviceName: name },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(() =>
    activeBranches.length === 1 ? activeBranches[0].id : "",
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [patientArea, setPatientArea] = useState("");
  const [manualPatientArea, setManualPatientArea] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(
    null,
  );

  type AvailabilityState = {
    status: "idle" | "loading" | "ready" | "error";
    slots: AvailabilitySlot[];
  };
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
    slots: [],
  });
  // Incrementing this forces an availability re-fetch without changing service/date.
  const [availabilityKey, setAvailabilityKey] = useState(0);
  // In offer mode we fetch slots even without a service selected (using first service as proxy).
  const canFetchSlots =
    !isSimpleRequest &&
    (selectedServiceIdx !== null ||
      (isOfferBooking && center.services.length > 0));
  const isSlotsLoading =
    canFetchSlots && Boolean(selectedDate) && availability.status === "loading";

  const slotUnavailableLabel = (reason?: string) => {
    switch (reason) {
      case "CENTER_CLOSED":
        return d.booking.slotCenterClosed;
      case "OUTSIDE_WORKING_HOURS":
        return d.booking.slotOutsideWorkingHours;
      case "PAST_TIME":
        return d.booking.slotPastTime;
      case "PENDING_REQUEST":
        return d.booking.slotPendingRequest;
      case "PROVIDER_ON_LEAVE":
        return d.booking.slotProviderOnLeave;
      case "PROVIDER_UNAVAILABLE":
        return d.booking.slotProviderUnavailable;
      case "BOOKED":
      default:
        return d.booking.slotBooked;
    }
  };

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // Fetch slot availability whenever service or date changes.
  // In offer mode: use first service as availability proxy when no service is selected.
  useEffect(() => {
    let cancelled = false;

    const effectiveServiceIdx =
      selectedServiceIdx !== null
        ? selectedServiceIdx
        : isOfferBooking && center.services.length > 0
          ? 0
          : null;

    if (effectiveServiceIdx === null || !selectedDate) {
      queueMicrotask(() => {
        if (!cancelled) setAvailability({ status: "idle", slots: [] });
      });
      return () => {
        cancelled = true;
      };
    }
    const service = center.services[effectiveServiceIdx];
    queueMicrotask(() => {
      if (!cancelled)
        setAvailability((prev) => ({ ...prev, status: "loading" }));
    });
    getPublicAvailability(
      slug,
      service.id,
      selectedDate,
      selectedProviderId || undefined,
    )
      .then((data) => {
        if (cancelled) return;
        setAvailability({ status: "ready", slots: data.slots });
        // Clear selected time if it is no longer available.
        setSelectedTime((prev) => {
          const found = data.slots.find((s) => s.time === prev);
          return found?.available ? prev : "";
        });
      })
      .catch(() => {
        if (cancelled) return;
        setAvailability({ status: "error", slots: [] });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedServiceIdx,
    selectedProviderId,
    selectedDate,
    availabilityKey,
    isOfferBooking,
  ]);

  function handleDateChange(val: string) {
    setSelectedDate(val);
    setSelectedTime("");
    clearError("date");
    clearError("time");
    if (val) {
      trackMarketingEvent("SelectDateTime", {
        centerName,
        centerSlug: slug,
        requestedDate: val,
        requestedTime: null,
        source: "date",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    const newErrors: Record<string, string> = {};
    if (!isSimpleRequest && !isOfferBooking && selectedServiceIdx === null)
      newErrors.service = d.booking.errorSelectService;
    if (!isSimpleRequest && !selectedDate)
      newErrors.date = d.booking.errorSelectDate;
    if (!isSimpleRequest && !isOfferBooking && !selectedTime)
      newErrors.time = d.booking.errorSelectTime;
    if (!isSimpleRequest && !isOfferBooking && isSlotsLoading)
      newErrors.time = d.booking.errorSelectTime;
    if (shouldChooseBranch && !selectedBranchId)
      newErrors.branch = branchCopy.error;
    if (!patientName.trim()) newErrors.name = d.booking.errorName;
    if (!/^\d{7,15}$/.test(phone.replace(/[\s\-().+]/g, "")))
      newErrors.phone = d.booking.errorPhone;
    const resolvedPatientArea =
      patientArea === "أخرى"
        ? manualPatientArea.trim() || patientArea
        : patientArea.trim();
    if (resolvedPatientArea.length > 120) {
      newErrors.patientArea = patientAreaCopy[locale].tooLong;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      trackMarketingEvent("BookingFailed", {
        centerName,
        centerSlug: slug,
        fields: Object.keys(newErrors),
        reason: "validation",
      });
      return;
    }

    const service =
      selectedServiceIdx !== null ? center.services[selectedServiceIdx] : null;
    const serviceName = service ? resolveServiceName(service, locale) : "";
    const displayDate = isSimpleRequest
      ? ""
      : formatDisplayDate(selectedDate, locale);
    const displayTime = isSimpleRequest
      ? ""
      : selectedTime
        ? formatDisplayTime(selectedTime, locale)
        : "";
    const trimmedNotes = notes.trim();
    const whatsAppNotes = [
      resolvedPatientArea
        ? `${patientAreaCopy[locale].label}: ${resolvedPatientArea}`
        : "",
      trimmedNotes,
    ]
      .filter(Boolean)
      .join("\n");

    const payload = {
      fullName: patientName.trim(),
      phone: phone.trim(),
      patientArea: resolvedPatientArea || undefined,
      branchId: selectedBranchId || undefined,
      providerId: isSimpleRequest ? undefined : selectedProviderId || undefined,
      serviceId: service?.id || undefined,
      notes: trimmedNotes || undefined,
      requestedDate: isSimpleRequest ? undefined : selectedDate,
      requestedTime: isSimpleRequest ? undefined : selectedTime || undefined,
      offerId: offer?.id || undefined,
      offerTitle: offer
        ? ((locale === "ar"
            ? offer.titleAr
            : locale === "he"
              ? offer.titleHe
              : offer.titleEn) ??
          offer.titleEn ??
          undefined)
        : undefined,
      offerPrice: offer?.newPrice ?? offer?.oldPrice ?? undefined,
      offerCurrency: offer?.currency || undefined,
    };

    trackMarketingEvent("SubmitBookingAttempt", {
      centerName,
      centerSlug: slug,
      requestedDate: selectedDate,
      requestedTime: selectedTime,
      serviceName,
    });

    setSubmitting(true);
    try {
      const createdBooking = await createPublicBookingRequest(slug, payload);
      const bookingUpdatePayload = JSON.stringify({
        bookingRequestId: createdBooking.bookingRequestId ?? null,
        fullName: patientName.trim(),
        slug,
      });
      window.localStorage.setItem(
        "royalcare.tenant-booking-request-created",
        bookingUpdatePayload,
      );
      window.dispatchEvent(new Event("tenant-booking-request-created"));

      // Optional WhatsApp notification
      const message = d.booking.whatsAppBookingMessage({
        centerName,
        service: serviceName,
        date: displayDate,
        time: displayTime,
        name: patientName.trim(),
        phone: phone.trim(),
        notes: whatsAppNotes,
      });
      const waHref = buildWhatsAppHref(message, center.branding?.whatsappPhone);
      if (waHref) {
        trackMarketingEvent("WhatsAppClick", {
          centerName,
          centerSlug: slug,
          source: "booking_submit_followup",
        });
        window.open(waHref, "_blank", "noopener,noreferrer");
      }

      trackMarketingEvent("CompleteBooking", {
        centerName,
        centerSlug: slug,
        event_id: createdBooking.trackingEventId,
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        serviceName,
        ...(offer?.id ? { offerId: offer.id } : {}),
      });
      trackCenterEvent(slug, "COMPLETE_BOOKING", {
        page: "/book",
        extraData: { serviceName },
      });

      setConfirmation({
        centerName,
        serviceName,
        date: displayDate,
        time: displayTime,
        patientName: patientName.trim(),
        phone: phone.trim(),
        patientArea: resolvedPatientArea,
        notes: trimmedNotes,
      });
    } catch (err: unknown) {
      const apiErr = err as BookingRequestError;
      // Slot was taken between the user picking a time and submitting.
      if (apiErr?.code === "SLOT_UNAVAILABLE") {
        setSelectedTime("");
        setSubmitError(d.booking.slotUnavailableError);
        setAvailabilityKey((k) => k + 1); // force re-fetch so UI shows current state
        trackMarketingEvent("BookingFailed", {
          centerName,
          centerSlug: slug,
          reason: "slot_unavailable",
          requestedDate: selectedDate,
          requestedTime: selectedTime,
          serviceName,
        });
        setSubmitting(false);
        return;
      }

      if (apiErr?.errors && Object.keys(apiErr.errors).length > 0) {
        const mapped: Record<string, string> = {};
        if (apiErr.errors.fullName) mapped.name = d.booking.errorName;
        if (apiErr.errors.phone) mapped.phone = d.booking.errorPhone;
        if (apiErr.errors.patientArea)
          mapped.patientArea = patientAreaCopy[locale].tooLong;
        if (apiErr.errors.branchId) mapped.branch = branchCopy.error;
        if (apiErr.errors.serviceId)
          mapped.service = d.booking.errorSelectService;
        if (apiErr.errors.providerId)
          mapped.service = d.booking.errorSelectService;
        if (apiErr.errors.requestedDate)
          mapped.date = d.booking.errorSelectDate;
        if (apiErr.errors.requestedTime)
          mapped.time = d.booking.errorSelectTime;
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          trackMarketingEvent("BookingFailed", {
            centerName,
            centerSlug: slug,
            fields: Object.keys(mapped),
            reason: apiErr.code ?? "field_validation",
            requestedDate: selectedDate,
            requestedTime: selectedTime,
            serviceName,
          });
        } else {
          setSubmitError(apiErr.message || d.booking.loadError);
          trackMarketingEvent("BookingFailed", {
            centerName,
            centerSlug: slug,
            reason: apiErr.code ?? "api_error",
            requestedDate: selectedDate,
            requestedTime: selectedTime,
            serviceName,
          });
        }
      } else {
        setSubmitError(d.booking.loadError);
        trackMarketingEvent("BookingFailed", {
          centerName,
          centerSlug: slug,
          reason: apiErr?.code ?? "api_error",
          requestedDate: selectedDate,
          requestedTime: selectedTime,
          serviceName,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <SuccessState
        confirmation={confirmation}
        d={d}
        locale={locale}
        slug={slug}
        whatsappPhone={center.branding?.whatsappPhone ?? null}
      />
    );
  }

  if (!isSimpleRequest && center.services.length === 0 && !isOfferBooking) {
    return <AdminState title={d.booking.noServices} tone="warning" />;
  }

  const oml = offerModeLabels[locale];

  return (
    <form
      aria-busy={submitting}
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit}
    >
      {isSimpleRequest ? (
        <SectionCard>
          <p className="text-sm font-semibold leading-6 text-[#0B2D5C]">
            {srCopy.intro}
          </p>
          {selectedServiceIdx !== null ? (
            <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#66758a]">
                {srCopy.selectedService}
              </p>
              <p className="mt-1 text-sm font-bold text-[#0B2D5C]">
                {resolveServiceName(
                  center.services[selectedServiceIdx],
                  locale,
                )}
              </p>
            </div>
          ) : !offer ? (
            <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#66758a]">
              {srCopy.noService}
            </p>
          ) : null}
        </SectionCard>
      ) : null}
      {/* 1 — Service (hidden in offer mode unless user toggles) */}
      {!isSimpleRequest && (!isOfferBooking || showServiceList) ? (
        <SectionCard>
          <SectionTitle>{d.booking.selectServiceTitle}</SectionTitle>
          <div className="space-y-2.5">
            {center.services.map((service, i) => {
              const name = resolveServiceName(service, locale);
              const selected = selectedServiceIdx === i;
              return (
                <button
                  className={`flex min-h-20 w-full min-w-0 items-start gap-3.5 rounded-xl border-2 px-4 py-3.5 text-start transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    selected
                      ? "border-[#0B2D5C] bg-[#0B2D5C]/5"
                      : "border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#0B2D5C]/30"
                  }`}
                  disabled={submitting}
                  key={i}
                  onClick={() => {
                    setSelectedServiceIdx(i);
                    setSelectedTime("");
                    clearError("service");
                    clearError("time");
                    trackMarketingEvent("SelectService", {
                      centerName,
                      centerSlug: slug,
                      serviceId: service.id,
                      serviceName: name,
                    });
                    trackCenterEvent(slug, "SELECT_SERVICE", {
                      page: "/book",
                      extraData: { serviceId: service.id, serviceName: name },
                    });
                  }}
                  type="button"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected
                        ? "border-[#0B2D5C] bg-[#0B2D5C]"
                        : "border-[#C8CDD4] bg-white"
                    }`}
                  >
                    {selected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-[#0B2D5C]">
                      {name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {service.durationMinutes != null && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-xs font-medium text-[#526176]">
                          <svg
                            aria-hidden="true"
                            className="h-3 w-3 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path
                              d="M12 6v6l4 2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {service.durationMinutes} min
                        </span>
                      )}
                      {service.price != null && (
                        <span
                          className="inline-flex items-center rounded-full border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-2 py-0.5 text-xs font-semibold text-[#7A5C20]"
                          dir="ltr"
                        >
                          {service.currency} {service.price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <FieldError msg={errors.service} />
          {isOfferBooking && (
            <button
              className="mt-3 text-xs font-semibold text-[#526176] underline underline-offset-2 hover:text-[#0B2D5C]"
              onClick={() => setShowServiceList(false)}
              type="button"
            >
              {oml.hideServiceList}
            </button>
          )}
        </SectionCard>
      ) : !isSimpleRequest ? (
        /* Offer mode: service list hidden — show toggle link */
        <button
          className="w-full rounded-xl border border-dashed border-[#C8CDD4] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#526176] transition hover:border-[#0B2D5C]/40 hover:text-[#0B2D5C]"
          onClick={() => setShowServiceList(true)}
          type="button"
        >
          {oml.switchToService}
        </button>
      ) : null}

      {!isSimpleRequest &&
        selectedServiceIdx !== null &&
        center.providers.length > 0 && (
          <SectionCard>
            <SectionTitle>{d.booking.selectProviderTitle}</SectionTitle>
            <select
              className="min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm font-medium text-[#0B2D5C] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              onChange={(event) => {
                setSelectedProviderId(event.target.value);
                setSelectedTime("");
                clearError("time");
              }}
              value={selectedProviderId}
            >
              <option value="">{d.booking.anyProvider}</option>
              {center.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </SectionCard>
        )}

      {/* 2 — Date */}
      {!isSimpleRequest ? (
        <SectionCard>
          <SectionTitle>{d.booking.selectDateTitle}</SectionTitle>
          <input
            className="min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm font-medium text-[#0B2D5C] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            disabled={submitting}
            max={maxDate}
            min={today}
            onChange={(e) => handleDateChange(e.target.value)}
            type="date"
            value={selectedDate}
          />
          <FieldError msg={errors.date} />
        </SectionCard>
      ) : null}

      {/* 3 — Time slots (requires date; in offer mode shows without service selection) */}
      {!isSimpleRequest &&
        (selectedServiceIdx !== null || isOfferBooking) &&
        selectedDate && (
          <SectionCard>
            <SectionTitle>{d.booking.selectTimeTitle}</SectionTitle>

            {/* Loading skeleton */}
            {(availability.status === "idle" ||
              availability.status === "loading") && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    className="h-12 animate-pulse rounded-xl bg-[#E5E7EB]"
                    key={i}
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {availability.status === "error" && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {d.booking.loadError}
              </p>
            )}

            {/* No slots */}
            {availability.status === "ready" &&
              availability.slots.length === 0 && (
                <p className="text-sm text-[#66758a]">
                  {d.booking.noSlotsForDate}
                </p>
              )}

            {/* Slot grid */}
            {availability.status === "ready" &&
              availability.slots.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {availability.slots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    const isBooked = !slot.available;
                    return (
                      <button
                        className={`min-h-12 rounded-xl border-2 px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 ${
                          isBooked
                            ? "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#B0BAC9]"
                            : isSelected
                              ? "border-[#0B2D5C] bg-[#0B2D5C] text-white"
                              : "border-[#E5E7EB] bg-[#F8FAFC] text-[#0B2D5C] hover:border-[#0B2D5C]/40"
                        }`}
                        disabled={isBooked || submitting}
                        aria-disabled={isBooked || submitting}
                        key={slot.time}
                        onClick={() => {
                          if (submitting) return;
                          setSelectedTime(slot.time);
                          clearError("time");
                          trackMarketingEvent("SelectDateTime", {
                            centerName,
                            centerSlug: slug,
                            requestedDate: selectedDate,
                            requestedTime: slot.time,
                            source: "time_slot",
                          });
                        }}
                        type="button"
                      >
                        <span className="block">
                          {formatDisplayTime(slot.time, locale)}
                        </span>
                        {isBooked && (
                          <span className="mt-0.5 block text-[10px] font-normal">
                            {slotUnavailableLabel(slot.reason)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

            <FieldError msg={errors.time} />
          </SectionCard>
        )}

      {/* 4 — Patient info */}
      {shouldChooseBranch ? (
        <SectionCard>
          <SectionTitle>{branchCopy.title}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeBranches.map((branch) => {
              const selected = selectedBranchId === branch.id;
              const city = resolveBranchCity(branch, locale);
              const address = resolveBranchAddress(branch, locale);
              const hasAddress = Boolean(
                branch.addressAr || branch.addressEn || branch.addressHe,
              );
              return (
                <div
                  className={`flex min-h-[190px] flex-col justify-between rounded-xl border-2 px-4 py-3.5 text-start shadow-sm transition duration-200 ${
                    submitting
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  } ${
                    selected
                      ? "border-[#0B2D5C] bg-white shadow-md ring-2 ring-[#0B2D5C]/10"
                      : "border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#0B2D5C]/35 hover:bg-white hover:shadow-md"
                  }`}
                  key={branch.id}
                  onClick={() => {
                    if (submitting) return;
                    setSelectedBranchId(branch.id);
                    clearError("branch");
                  }}
                  onKeyDown={(event) => {
                    if (submitting) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedBranchId(branch.id);
                      clearError("branch");
                    }
                  }}
                  role="button"
                  tabIndex={submitting ? -1 : 0}
                >
                  <span className="block min-w-0">
                    <span className="flex min-w-0 items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-bold leading-5 text-[#0B2D5C]">
                        {branch.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          selected
                            ? "border-[#0B2D5C] bg-[#0B2D5C]"
                            : "border-[#C8CDD4] bg-white"
                        }`}
                      >
                        {selected ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </span>
                    </span>
                    {city ? (
                      <span className="mt-1.5 block truncate text-xs font-medium leading-5 text-[#66758a]">
                        {city}
                      </span>
                    ) : null}
                    <span className="mt-1.5 block min-h-10">
                      {address && (hasAddress || !city) ? (
                        <span className="line-clamp-2 text-sm font-semibold leading-5 text-[#0B2D5C]">
                          {address}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="mt-3 block">
                    <span className="flex min-h-6 flex-wrap items-center gap-1.5">
                      {branch.phone ? (
                        <span className="inline-flex min-h-6 items-center rounded-full border border-[#E5E7EB] bg-white px-2 text-[10px] font-semibold leading-none text-[#526176]">
                          {branchCopy.phone}:{" "}
                          <span className="ms-1" dir="ltr">
                            {branch.phone}
                          </span>
                        </span>
                      ) : null}
                      {branch.whatsapp ? (
                        <span className="inline-flex min-h-6 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold leading-none text-emerald-700">
                          {branchCopy.whatsapp}:{" "}
                          <span className="ms-1" dir="ltr">
                            {branch.whatsapp}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-3 flex min-h-7 items-center">
                      {branch.mapsUrl ? (
                        <a
                          className="inline-flex min-h-7 items-center justify-center rounded-lg border border-[#0B2D5C]/15 bg-white px-2.5 text-[11px] font-bold text-[#0B2D5C] transition hover:border-[#0B2D5C]/35 hover:bg-[#0B2D5C]/5"
                          href={branch.mapsUrl}
                          onClick={(event) => event.stopPropagation()}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {getBranchMapLabel(locale)}
                        </a>
                      ) : null}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <FieldError msg={errors.branch} />
        </SectionCard>
      ) : null}

      <SectionCard>
        <SectionTitle>{d.booking.patientInfoTitle}</SectionTitle>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              className="mb-1.5 block text-xs font-bold text-[#0B2D5C]"
              htmlFor="booking-name"
            >
              {d.booking.patientNameLabel}
              <span className="ms-1 text-red-500">*</span>
            </label>
            <input
              className="min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0B2D5C] placeholder-[#9AA5B4] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              id="booking-name"
              onChange={(e) => {
                setPatientName(e.target.value);
                clearError("name");
              }}
              placeholder={d.booking.patientNamePlaceholder}
              type="text"
              value={patientName}
            />
            <FieldError msg={errors.name} />
          </div>

          {/* Phone */}
          <div>
            <label
              className="mb-1.5 block text-xs font-bold text-[#0B2D5C]"
              htmlFor="booking-phone"
            >
              {d.booking.phoneLabel}
              <span className="ms-1 text-red-500">*</span>
            </label>
            <input
              className="min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0B2D5C] placeholder-[#9AA5B4] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              dir="ltr"
              id="booking-phone"
              inputMode="tel"
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("phone");
              }}
              placeholder={d.booking.phonePlaceholder}
              type="tel"
              value={phone}
            />
            <FieldError msg={errors.phone} />
          </div>

          {/* City / area */}
          <div>
            <label
              className="mb-1.5 block text-xs font-bold text-[#0B2D5C]"
              htmlFor="booking-patient-area"
            >
              {patientAreaCopy[locale].label}
            </label>
            <input
              className="min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0B2D5C] placeholder-[#9AA5B4] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              id="booking-patient-area"
              list="booking-patient-area-options"
              onChange={(e) => {
                setPatientArea(e.target.value);
                clearError("patientArea");
              }}
              placeholder={patientAreaCopy[locale].placeholder}
              type="text"
              value={patientArea}
            />
            <datalist id="booking-patient-area-options">
              {patientAreaOptions.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
            {patientArea === "أخرى" ? (
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#0B2D5C] placeholder-[#9AA5B4] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitting}
                onChange={(e) => {
                  setManualPatientArea(e.target.value);
                  clearError("patientArea");
                }}
                placeholder={patientAreaCopy[locale].manualPlaceholder}
                type="text"
                value={manualPatientArea}
              />
            ) : null}
            <FieldError msg={errors.patientArea} />
          </div>

          {/* Notes */}
          <div>
            <label
              className="mb-1.5 block text-xs font-bold text-[#0B2D5C]"
              htmlFor="booking-notes"
            >
              {d.booking.notesLabel}
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0B2D5C] placeholder-[#9AA5B4] focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/15 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              id="booking-notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder={d.booking.notesPlaceholder}
              rows={3}
              value={notes}
            />
          </div>
        </div>
      </SectionCard>

      {/* 5 — Submit */}
      {submitError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}
      <button
        className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#0B2D5C] bg-[#0B2D5C] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B2D5C]/90 focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/25 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting || isSlotsLoading}
        type="submit"
      >
        {submitting ? (
          <svg
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              fill="currentColor"
            />
          </svg>
        ) : (
          WA_ICON
        )}
        {d.booking.submitButton}
      </button>
    </form>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

const offerSectionLabels = {
  en: {
    selectedOffer: "Selected Offer",
    validUntil: "Valid until",
    remove: "Remove",
    was: "was",
  },
  ar: {
    selectedOffer: "العرض المختار",
    validUntil: "صالح حتى",
    remove: "إزالة",
    was: "كان",
  },
  he: {
    selectedOffer: "המבצע שנבחר",
    validUntil: "בתוקף עד",
    remove: "הסר",
    was: "היה",
  },
} as const;

function resolveOfferTitle(
  offer: PublicOffer,
  locale: SupportedLocale,
): string {
  if (locale === "ar")
    return offer.titleAr || offer.titleEn || offer.titleHe || "";
  if (locale === "he")
    return offer.titleHe || offer.titleEn || offer.titleAr || "";
  return offer.titleEn || offer.titleAr || offer.titleHe || "";
}

function resolveOfferBadge(
  offer: PublicOffer,
  locale: SupportedLocale,
): string {
  if (locale === "ar")
    return offer.badgeAr || offer.badgeEn || offer.badgeHe || "";
  if (locale === "he")
    return offer.badgeHe || offer.badgeEn || offer.badgeAr || "";
  return offer.badgeEn || offer.badgeAr || offer.badgeHe || "";
}

function OfferSummaryCard({
  offer,
  locale,
  primaryColor,
  onRemove,
}: {
  offer: PublicOffer;
  locale: SupportedLocale;
  primaryColor: string;
  onRemove: () => void;
}) {
  const ol = offerSectionLabels[locale];
  const title = resolveOfferTitle(offer, locale);
  const badge = resolveOfferBadge(offer, locale);
  const endsAt = offer.endsAt ? new Date(offer.endsAt) : null;
  const newPriceNum = offer.newPrice ? parseFloat(offer.newPrice) : null;
  const oldPriceNum = offer.oldPrice ? parseFloat(offer.oldPrice) : null;

  return (
    <div
      className="flex min-w-0 items-start gap-3 rounded-xl border-2 bg-white p-4"
      style={{ borderColor: primaryColor }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: `${primaryColor}15` }}
      >
        🎁
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-bold uppercase tracking-wide"
          style={{ color: primaryColor }}
        >
          {ol.selectedOffer}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-[#0B2D5C]">
          {title || "—"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {badge ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {badge}
            </span>
          ) : null}
          {newPriceNum != null && !Number.isNaN(newPriceNum) ? (
            <span
              className="text-xs font-black"
              style={{ color: primaryColor }}
              dir="ltr"
            >
              {newPriceNum.toLocaleString()} {offer.currency}
            </span>
          ) : null}
          {oldPriceNum != null && !Number.isNaN(oldPriceNum) ? (
            <span className="text-xs text-[#8A94A6] line-through" dir="ltr">
              {ol.was} {oldPriceNum.toLocaleString()} {offer.currency}
            </span>
          ) : null}
          {endsAt ? (
            <span className="text-[10px] text-[#9AA5B4]">
              {ol.validUntil} {endsAt.toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
      <button
        aria-label={ol.remove}
        className="shrink-0 rounded-lg p-1 text-[#9AA5B4] transition hover:bg-[#F3F4F6] hover:text-[#526176]"
        onClick={onRemove}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function BookingContent({
  center,
  slug,
  locale,
  d,
  offer,
  onRemoveOffer,
  serviceId,
}: {
  center: PublicCenterDetail;
  slug: string;
  locale: SupportedLocale;
  d: Dictionary;
  offer: PublicOffer | null;
  onRemoveOffer: () => void;
  serviceId?: string;
}) {
  const primaryColor = center.branding?.primaryColor ?? "#0B2D5C";
  return (
    <>
      <SectionCard>
        <CenterSummaryCard center={center} d={d} locale={locale} />
        <div className="mt-4 border-t border-[#E5E7EB] pt-4">
          <h1 className="text-lg font-bold text-[#0B2D5C]">
            {d.booking.title}
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#66758a]">
            {d.booking.subtitle}
          </p>
        </div>
      </SectionCard>

      {offer ? (
        <OfferSummaryCard
          locale={locale}
          offer={offer}
          onRemove={onRemoveOffer}
          primaryColor={primaryColor}
        />
      ) : null}

      <BookingForm
        center={center}
        d={d}
        initialServiceId={serviceId}
        locale={locale}
        offer={offer}
        slug={slug}
      />
    </>
  );
}

export function BookingPage({
  slug,
  offerId: initialOfferId,
  serviceId: initialServiceId,
}: {
  slug: string;
  offerId?: string;
  serviceId?: string;
}) {
  const { locale, direction } = useLanguage();
  const d = publicCentersDictionaries[locale as SupportedLocale];
  const [center, setCenter] = useState<PublicCenterDetail | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "not-found" | "error"
  >("loading");
  const [resolvedOffer, setResolvedOffer] = useState<PublicOffer | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      if (!cancelled) setStatus("loading");
      const data = await getPublicCenter(slug);
      if (cancelled) return;
      setCenter(data);
      setStatus("ready");
      trackMarketingEvent("ViewBookingPage", {
        centerName: resolveLocalizedName(data, locale as SupportedLocale),
        centerSlug: data.slug,
      });
      trackCenterEvent(data.slug, "VIEW_BOOKING_PAGE", { page: "/book" });
      trackMarketingEvent("StartBooking", {
        centerName: resolveLocalizedName(data, locale as SupportedLocale),
        centerSlug: data.slug,
        source: initialOfferId
          ? "offer_card"
          : initialServiceId
            ? "service_card"
            : "booking_page_load",
        ...(initialOfferId ? { offerId: initialOfferId } : {}),
        ...(initialServiceId && !initialOfferId
          ? { serviceId: initialServiceId }
          : {}),
      });

      if (initialOfferId) {
        try {
          const { data: offersList } = await getPublicCenterOffers(slug);
          if (cancelled) return;
          const found = offersList.find((o) => o.id === initialOfferId) ?? null;
          setResolvedOffer(found);
        } catch {
          // Offer not critical — continue without it
        }
      }
    };

    void loadAll().catch((err: unknown) => {
      if (cancelled) return;
      const isNotFound =
        err instanceof Error && err.message.toLowerCase().includes("not found");
      setStatus(isNotFound ? "not-found" : "error");
    });

    return () => {
      cancelled = true;
    };
  }, [locale, slug, initialOfferId, initialServiceId]);

  // Sync browser tab title + center favicon when center loads.
  useEffect(() => {
    if (!center) return;
    const displayName = resolveLocalizedName(center, locale as SupportedLocale);
    document.title = `${displayName} — Book Appointment`;
    const logoUrl = center.branding?.logoUrl?.trim() || null;
    window.dispatchEvent(
      new CustomEvent<FaviconUpdateDetail>(FAVICON_EVENT, {
        detail: { href: logoUrl, scope: "center" },
      }),
    );
    // GlobalFavicon restores the platform icon when navigation leaves /c/*.
    // Clearing here can race with center subpage navigation and briefly restore
    // the RoyalCare favicon over the center logo.
  }, [center, locale]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir={direction} lang={locale}>
      <TenantMarketingInjector slug={slug} />
      <BookingNavbar
        center={center}
        locale={locale as SupportedLocale}
        slug={slug}
      />

      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          className="mb-6 inline-flex items-center text-sm font-medium text-[#0B2D5C] opacity-70 hover:opacity-100"
          href={`/c/${slug}`}
        >
          {d.booking.backToProfile}
        </Link>

        <div className="space-y-5">
          {status === "loading" ? (
            <>
              <div className="animate-pulse rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-[#E5E7EB]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-[#E5E7EB]" />
                    <div className="h-3 w-1/3 rounded bg-[#E5E7EB]" />
                  </div>
                </div>
              </div>
              <div className="h-48 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white" />
            </>
          ) : status === "not-found" ? (
            <AdminState
              body={d.profile.notFoundBody}
              className="mt-10"
              title={d.profile.notFound}
              tone="warning"
            />
          ) : status === "error" ? (
            <AdminState
              className="mt-10"
              title={d.booking.loadError}
              tone="error"
            />
          ) : center ? (
            <BookingContent
              center={center}
              d={d}
              locale={locale as SupportedLocale}
              offer={resolvedOffer}
              onRemoveOffer={() => {
                setResolvedOffer(null);
              }}
              serviceId={initialServiceId}
              slug={slug}
            />
          ) : null}
        </div>
      </main>

      {center && status === "ready" ? (
        <SmartContactWidget
          center={center}
          locale={locale as SupportedLocale}
          page="book"
          primaryColor={center.branding?.primaryColor || "#0B2D5C"}
          showBook={false}
        />
      ) : null}
    </div>
  );
}
