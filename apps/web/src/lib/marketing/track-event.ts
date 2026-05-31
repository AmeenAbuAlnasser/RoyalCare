type MarketingPayload = Record<string, unknown> & {
  event_id?: string;
  eventId?: string;
};

type MarketingProvider = "ga4" | "meta" | "snap" | "tiktok";

type TrackMarketingOptions = {
  providers?: MarketingProvider[];
};

type MarketingWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  snaptr?: (...args: unknown[]) => void;
  ttq?: {
    page?: () => void;
    track?: (eventName: string, payload?: MarketingPayload) => void;
  };
};

const eventMap: Record<string, string> = {
  BookingFailed: "BookingFailed",
  CallClick: "CallClick",
  CompleteBooking: "CompleteBooking",
  PageView: "PageView",
  PatientPortalView: "PatientPortalView",
  SelectDateTime: "SelectDateTime",
  SelectService: "SelectService",
  StartBooking: "StartBooking",
  SubmitBookingAttempt: "SubmitBookingAttempt",
  ViewBookingPage: "ViewBookingPage",
  ViewCenter: "ViewCenter",
  WhatsAppClick: "WhatsAppClick",
};

export function trackMarketingEvent(
  eventName: keyof typeof eventMap | string,
  payload: MarketingPayload = {},
  options: TrackMarketingOptions = {},
) {
  if (typeof window === "undefined") return;

  const win = window as MarketingWindow;
  const mappedEvent = eventMap[eventName] ?? eventName;
  const eventId =
    typeof payload.event_id === "string"
      ? payload.event_id
      : typeof payload.eventId === "string"
        ? payload.eventId
        : undefined;
  const providers = options.providers
    ? new Set<MarketingProvider>(options.providers)
    : null;

  // Each provider is isolated so a broken pixel, blocked script, or ad blocker
  // never blocks booking, portal, or public page interactions.
  try {
    if (providers && !providers.has("meta")) {
      // Skip this provider for targeted test events.
    } else if (eventId) {
      win.fbq?.("trackCustom", mappedEvent, payload, { eventID: eventId });
    } else {
      win.fbq?.("trackCustom", mappedEvent, payload);
    }
  } catch {
    // Ignore provider SDK failures so booking UX is never blocked by tracking.
  }

  try {
    if (!providers || providers.has("tiktok")) {
      win.ttq?.track?.(mappedEvent, payload);
    }
  } catch {
    // Ignore provider SDK failures.
  }

  try {
    if (!providers || providers.has("ga4")) {
      win.gtag?.("event", mappedEvent, payload);
    }
  } catch {
    // Ignore provider SDK failures.
  }

  try {
    if (!providers || providers.has("snap")) {
      win.snaptr?.("track", mappedEvent, payload);
    }
  } catch {
    // Ignore provider SDK failures.
  }
}
