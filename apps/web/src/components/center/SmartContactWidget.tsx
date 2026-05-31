"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import type { PublicCenterDetail } from "@/lib/api/public-centers";
import { trackCenterEvent } from "@/lib/marketing/track-center-event";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";

// ─── Labels ──────────────────────────────────────────────────────────────────

const widgetLabels = {
  en: {
    book: "Book Now",
    call: "Call",
    close: "Close",
    directions: "Directions",
    messenger: "Message",
    open: "Contact us",
    whatsapp: "WhatsApp",
  },
  ar: {
    book: "احجز الآن",
    call: "اتصل",
    close: "إغلاق",
    directions: "الاتجاهات",
    messenger: "رسالة",
    open: "تواصل معنا",
    whatsapp: "واتساب",
  },
  he: {
    book: "קבע תור",
    call: "התקשר",
    close: "סגור",
    directions: "ניווט",
    messenger: "הודעה",
    open: "צרו קשר",
    whatsapp: "וואטסאפ",
  },
} as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

const WA_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const PHONE_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
  </svg>
);

const CALENDAR_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const MAP_PIN_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const MESSENGER_ICON = (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.087-2.242c1.09.301 2.246.464 3.444.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963L10.48 12.19l-5.373 2.773 5.905-6.272 2.74 2.772 5.344-2.772-5.905 6.272z" />
  </svg>
);

const CHAT_BUBBLE_ICON = (
  <svg aria-hidden="true" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const X_ICON = (
  <svg aria-hidden="true" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = normalizeForWhatsApp(phone, readWhatsAppDefaultCode());
  if (!/^\d{7,15}$/.test(normalized)) return null;
  return `https://wa.me/${normalized}`;
}

function extractMessengerUrl(facebookUrl: string | null | undefined): string | null {
  if (!facebookUrl) return null;
  try {
    const url = new URL(facebookUrl);
    if (!url.hostname.includes("facebook.com") && !url.hostname.includes("fb.com")) return null;
    const handle = url.pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean)[0];
    if (!handle || handle === "pages" || handle.startsWith("profile") || handle.includes(".")) return null;
    return `https://m.me/${handle}`;
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

type Action = {
  key: string;
  href: string;
  label: string;
  icon: ReactElement;
  bg: string;
  external: boolean;
  onTrack: () => void;
};

export function SmartContactWidget({
  center,
  locale,
  page,
  primaryColor,
  showBook = true,
}: {
  center: PublicCenterDetail;
  locale: SupportedLocale;
  page: string;
  primaryColor: string;
  showBook?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar" || locale === "he";
  const labels = widgetLabels[locale];
  const branding = center.branding;
  const pageParam = `/${page === "home" ? "" : page}`;

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const waHref = buildWhatsAppLink(branding?.whatsappPhone);
  const callHref = branding?.phone
    ? `tel:${branding.phone.replace(/[^\d+]/g, "")}`
    : branding?.whatsappPhone
    ? `tel:${branding.whatsappPhone.replace(/[^\d+]/g, "")}`
    : null;
  const mapUrl = branding?.googleMapsUrl ?? null;
  const messengerUrl = extractMessengerUrl(branding?.facebookUrl);

  const actions: Action[] = [
    ...(waHref
      ? [
          {
            key: "whatsapp",
            href: waHref,
            label: labels.whatsapp,
            icon: WA_ICON,
            bg: "#22C55E",
            external: true,
            onTrack: () => trackCenterEvent(center.slug, "CLICK_WHATSAPP", { page: pageParam }),
          },
        ]
      : []),
    ...(callHref
      ? [
          {
            key: "call",
            href: callHref,
            label: labels.call,
            icon: PHONE_ICON,
            bg: "#3B82F6",
            external: false,
            onTrack: () => trackCenterEvent(center.slug, "CLICK_PHONE", { page: pageParam }),
          },
        ]
      : []),
    ...(showBook
      ? [
          {
            key: "book",
            href: `/c/${center.slug}/book`,
            label: labels.book,
            icon: CALENDAR_ICON,
            bg: primaryColor,
            external: false,
            onTrack: () => trackCenterEvent(center.slug, "CLICK_BOOK_NOW", { page: pageParam }),
          },
        ]
      : []),
    ...(mapUrl
      ? [
          {
            key: "map",
            href: mapUrl,
            label: labels.directions,
            icon: MAP_PIN_ICON,
            bg: "#F59E0B",
            external: true,
            onTrack: () => trackCenterEvent(center.slug, "CLICK_MAP", { page: pageParam }),
          },
        ]
      : []),
    ...(messengerUrl
      ? [
          {
            key: "messenger",
            href: messengerUrl,
            label: labels.messenger,
            icon: MESSENGER_ICON,
            bg: "#0084FF",
            external: true,
            onTrack: () => trackCenterEvent(center.slug, "CLICK_MESSENGER", { page: pageParam }),
          },
        ]
      : []),
  ];

  if (actions.length === 0) return null;

  return (
    <div
      className="fixed right-4 z-50 flex flex-col items-end md:right-6"
      ref={widgetRef}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
    >
      {/* Action items — kept in DOM for smooth in/out animation */}
      <div
        aria-hidden={!open}
        className={`mb-3 flex flex-col items-end gap-2.5 transition-all duration-200 ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        {actions.map((action) => (
          <a
            className="flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow-lg ring-1 ring-black/10 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
            dir={isRtl ? "rtl" : "ltr"}
            href={action.href}
            key={action.key}
            onClick={() => {
              action.onTrack();
              setOpen(false);
            }}
            rel={action.external ? "noopener noreferrer" : undefined}
            style={{ backgroundColor: action.bg }}
            target={action.external ? "_blank" : undefined}
          >
            {action.icon}
            <span className="whitespace-nowrap">{action.label}</span>
          </a>
        ))}
      </div>

      {/* Toggle button */}
      <button
        aria-expanded={open}
        aria-label={open ? labels.close : labels.open}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl ring-1 ring-black/15 transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40"
        onClick={() => setOpen((v) => !v)}
        style={{ backgroundColor: primaryColor }}
        type="button"
      >
        <span className={`transition-all duration-200 ${open ? "rotate-90 scale-90" : ""}`}>
          {open ? X_ICON : CHAT_BUBBLE_ICON}
        </span>
      </button>
    </div>
  );
}
