// Platform marketing event tracking.
// Fires events for RoyalCare platform pages only (/, /centers, /features, /pricing, /contact, /open-center, /auth/*).
// Never fires on /c/* (center websites) or /tenant/* (tenant admin).

type PlatformMarketingWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  snaptr?: (...args: unknown[]) => void;
  ttq?: {
    page?: () => void;
    track?: (eventName: string, payload?: Record<string, unknown>) => void;
  };
};

export type PlatformEventName =
  | "ViewLanding"
  | "ViewCentersDirectory"
  | "ViewPricing"
  | "ViewFeatures"
  | "ViewContact"
  | "OpenCenterWebsite"
  | "OpenCenterSignup"
  | "StartSubscription"
  | "SubmitLead"
  | "ContactSales"
  | "LoginAttempt"
  | "PricingPlanWhatsAppClick";

export function trackPlatformEvent(
  eventName: PlatformEventName,
  payload: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  // Safety guard: never fire platform tracking inside center or tenant routes.
  const pathname = window.location.pathname;
  if (
    pathname.startsWith("/c/") ||
    pathname.startsWith("/tenant/") ||
    pathname.startsWith("/super-admin/")
  ) {
    return;
  }

  const win = window as PlatformMarketingWindow;

  // Each provider is isolated — a blocked or broken pixel never interrupts UX.
  try {
    win.fbq?.("trackCustom", eventName, payload);
  } catch { /* ignore */ }

  try {
    win.ttq?.track?.(eventName, payload);
  } catch { /* ignore */ }

  try {
    win.gtag?.("event", eventName, payload);
  } catch { /* ignore */ }

  try {
    win.snaptr?.("track", eventName, payload);
  } catch { /* ignore */ }
}
