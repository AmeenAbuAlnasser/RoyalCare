// Center website analytics tracking — fires to our own backend, NOT to ad pixels.
// Completely separate from trackMarketingEvent (which fires to Meta/TikTok/GA4).
// Only active on /c/[slug] routes; never fires on /tenant/* or platform pages.

export type CenterEventType =
  | 'VIEW_CENTER_WEBSITE'
  | 'VIEW_BOOKING_PAGE'
  | 'CLICK_BOOK_NOW'
  | 'CLICK_WHATSAPP'
  | 'CLICK_PHONE'
  | 'CLICK_MAP'
  | 'CLICK_MESSENGER'
  | 'VIEW_GALLERY'
  | 'VIEW_REVIEWS'
  | 'VIEW_BEFORE_AFTER'
  | 'VIEW_OFFERS'
  | 'SELECT_OFFER'
  | 'COMPLETE_BOOKING'
  | 'VIEW_CONTACT'
  | 'VIEW_SERVICES'
  | 'SELECT_SERVICE';

export type CenterTrafficSource =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'GOOGLE'
  | 'DIRECT'
  | 'UNKNOWN';

type TrackOptions = {
  page?: string;
  extraData?: Record<string, unknown>;
};

const SESSION_KEY_PREFIX = 'rc_csid_';
const HOME_FIRED_PREFIX = 'rc_home_';

function detectSource(): CenterTrafficSource {
  if (typeof window === 'undefined') return 'UNKNOWN';

  // UTM source takes priority.
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = (params.get('utm_source') ?? '').toLowerCase();
    if (utm.includes('facebook') || utm.includes('fb')) return 'FACEBOOK';
    if (utm.includes('instagram') || utm.includes('ig')) return 'INSTAGRAM';
    if (utm.includes('tiktok')) return 'TIKTOK';
    if (utm.includes('google')) return 'GOOGLE';
  } catch {
    // ignore
  }

  // Fall back to referrer.
  const ref = (document.referrer ?? '').toLowerCase();
  if (!ref) return 'DIRECT';
  if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'FACEBOOK';
  if (ref.includes('instagram.com')) return 'INSTAGRAM';
  if (ref.includes('tiktok.com')) return 'TIKTOK';
  if (ref.includes('google.') || ref.includes('bing.com') || ref.includes('yahoo.com')) return 'GOOGLE';
  return 'UNKNOWN';
}

function getSessionId(slug: string): string {
  const key = `${SESSION_KEY_PREFIX}${slug}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return 'unknown';
  }
}

// Returns true on the first call per slug per browser session — used to fire
// VIEW_CENTER_WEBSITE only once per session so homepage counts aren't inflated.
function markHomeViewed(slug: string): boolean {
  const key = `${HOME_FIRED_PREFIX}${slug}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

const apiBase =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1')
    : 'http://localhost:3001/api/v1';

export function trackCenterEvent(
  slug: string,
  eventType: CenterEventType,
  options: TrackOptions = {},
): void {
  if (typeof window === 'undefined') return;

  // Enforce once-per-session deduplication for homepage views.
  if (eventType === 'VIEW_CENTER_WEBSITE') {
    if (!markHomeViewed(slug)) return;
  }

  const sessionId = getSessionId(slug);
  const source = detectSource();

  const body = JSON.stringify({
    eventType,
    source,
    sessionId,
    page: options.page ?? null,
    extraData: options.extraData ?? null,
  });

  // Fire-and-forget — never block UX on analytics.
  try {
    void fetch(`${apiBase}/public/centers/${encodeURIComponent(slug)}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Swallow all errors — analytics must never affect UX.
  }
}
