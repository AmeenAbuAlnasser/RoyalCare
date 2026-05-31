"use client";

import { useEffect } from "react";
import { royalCareBrand } from "@/config/brand";
import {
  getPublicSystemSettings,
  type SystemSetting,
} from "@/lib/api/system-settings";

// Stable element IDs for platform / center favicons.
// TenantFaviconManager uses these same IDs so both systems write the same nodes.
const MANAGED: Array<{ id: string; rel: string }> = [
  { id: "rc-fav-icon",     rel: "icon" },
  { id: "rc-fav-shortcut", rel: "shortcut icon" },
  { id: "rc-fav-apple",    rel: "apple-touch-icon" },
];

export const FAVICON_EVENT = "royalcare:favicon-updated";
const FALLBACK_ICON = royalCareBrand.logo.mark;
type FaviconScope = "center" | "platform" | "tenant";

export type FaviconUpdateDetail = {
  href?: string | null;
  scope?: FaviconScope;
};

// ─── Debug helpers ────────────────────────────────────────────────────────────
function faviconLog(label: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("debug:favicon") !== "1") return;
    const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>("link"))
      .filter((el) => /icon/i.test(el.rel))
      .map((el) => `  [${el.id || "no-id"}] rel="${el.rel}" → "…${el.href.slice(-55)}"`);
    console.log(
      `[GlobalFavicon] ${label}`,
      { pathname: window.location.pathname, ...data },
      links.length ? "\n" + links.join("\n") : "",
    );
  } catch { /* never let logging crash the app */ }
}

// ─── Module-level persistence ─────────────────────────────────────────────────
// Survives HMR remounts within the same browser tab so the center/platform href
// is immediately available when the effect re-runs without waiting for async events.
// NOTE: tenant href is intentionally absent — TenantFaviconManager owns that scope.
let _modCenterHref: string | null = null;
let _modPlatformHref: string | null = null;

function withVersion(href: string, version?: string | null) {
  const cacheValue = encodeURIComponent(version ?? String(Date.now()));
  return href.includes("?") ? `${href}&v=${cacheValue}` : `${href}?v=${cacheValue}`;
}

function resolvePublicFavicon(settings: SystemSetting[]) {
  const favicon = settings.find((s) => s.key === "public_favicon_url");
  const raw = favicon?.value?.trim();
  if (!raw) return withVersion(FALLBACK_ICON, "default");
  return withVersion(raw, favicon?.updatedAt);
}

function isTenantRoute() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/tenant");
}

function isCenterRoute() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/c/");
}

function imageToPngFavicon(href: string) {
  return new Promise<string | null>((resolve) => {
    if (typeof window === "undefined") { resolve(null); return; }
    const image = new Image();
    const timer = window.setTimeout(() => resolve(null), 5000);
    image.crossOrigin = "anonymous";
    image.onload = () => {
      clearTimeout(timer);
      try {
        const S = 512;
        const canvas = document.createElement("canvas");
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext("2d");
        if (!ctx || !image.naturalWidth || !image.naturalHeight) { resolve(null); return; }
        ctx.clearRect(0, 0, S, S);
        const scale = Math.min(S / image.naturalWidth, S / image.naturalHeight);
        const w = Math.round(image.naturalWidth * scale);
        const h = Math.round(image.naturalHeight * scale);
        ctx.drawImage(image, Math.round((S - w) / 2), Math.round((S - h) / 2), w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(null); }
    };
    image.onerror = () => { clearTimeout(timer); resolve(null); };
    image.src = href;
  });
}

/**
 * Apply `href` to the platform/center favicon managed nodes.
 * Updates existing elements in-place — never removes or re-appends them.
 * Removal would orphan React fiber nodes and cause "Cannot read properties of
 * null (reading 'removeChild')" crashes during soft navigation.
 */
export function applyFavicon(href: string) {
  if (typeof document === "undefined") return;
  for (const { id, rel } of MANAGED) {
    const existing = document.getElementById(id) as HTMLLinkElement | null;
    if (existing) {
      existing.href = href;
      continue;
    }
    try {
      const link = document.createElement("link");
      link.id = id;
      link.rel = rel;
      link.type = "image/png";
      link.href = href;
      document.head.appendChild(link);
    } catch { /* head unavailable during SSR edge cases */ }
  }
}

// ─── GlobalFavicon ────────────────────────────────────────────────────────────
/**
 * GlobalFavicon handles favicons for:
 *   /            platform favicon (from system settings)
 *   /centers     platform favicon
 *   /super-admin platform favicon
 *   /c/*         public center logo (via FAVICON_EVENT scope="center")
 *
 * /tenant/* is intentionally excluded — TenantFaviconManager owns that scope
 * and is mounted directly inside CenterAdminShell. This prevents the event-timing
 * race where GlobalFavicon's stale tenantSourceHref could apply the wrong favicon.
 */
export function GlobalFavicon() {
  useEffect(() => {
    let cancelled = false;

    // Restore from module-level cache so HMR remounts don't lose center/platform state.
    let platformHref = _modPlatformHref ?? withVersion(FALLBACK_ICON, "default");
    let centerSourceHref: string | null = _modCenterHref;

    // On remount: immediately reapply the correct favicon for center routes without
    // waiting for the FAVICON_EVENT to re-fire from CenterProfilePage.
    if (isCenterRoute() && centerSourceHref) {
      applyFavicon(centerSourceHref);
      void imageToPngFavicon(centerSourceHref).then((png) => {
        if (!cancelled && png) applyFavicon(png);
      });
    }

    void getPublicSystemSettings()
      .then(({ settings }) => {
        platformHref = resolvePublicFavicon(settings);
        _modPlatformHref = platformHref;
        // Apply platform favicon only on non-tenant, non-center routes.
        // /tenant/* is owned by TenantFaviconManager — never touch it here.
        if (!cancelled && !isTenantRoute() && !isCenterRoute()) {
          faviconLog("platform-applied-from-settings");
          applyFavicon(platformHref);
        }
      })
      .catch(() => { /* keep SSR metadata favicon if API is unreachable */ });

    function restorePlatformFavicon() {
      centerSourceHref = null;
      _modCenterHref = null;
      faviconLog("platform-restored");
      applyFavicon(platformHref);
    }

    async function applyCenterFavicon(href: string | null | undefined) {
      centerSourceHref = href?.trim() || null;
      _modCenterHref = centerSourceHref;
      if (!isCenterRoute()) { applyFavicon(platformHref); return; }
      if (!centerSourceHref) { applyFavicon(platformHref); return; }
      faviconLog("center-applying-raw", { href: `…${centerSourceHref.slice(-55)}` });
      applyFavicon(centerSourceHref);
      const png = await imageToPngFavicon(centerSourceHref);
      if (cancelled) return;
      if (png) { faviconLog("center-applied-png"); applyFavicon(png); }
    }

    function onUpdate(event: Event) {
      const detail = (event as CustomEvent<FaviconUpdateDetail>).detail;

      if (detail?.scope === "tenant") {
        // /tenant/* is managed by TenantFaviconManager — ignore these events here.
        faviconLog("ignored-tenant-event");
        return;
      }

      if (detail?.scope === "center") {
        void applyCenterFavicon(detail.href);
        return;
      }

      // No scope = platform favicon update from SuperAdmin settings page.
      const href = detail?.href?.trim();
      if (href) {
        platformHref = href;
        _modPlatformHref = href;
        if (!isTenantRoute() && !isCenterRoute()) applyFavicon(platformHref);
      }
    }

    // Intercept pushState/replaceState so we detect Next.js client navigations.
    const originalPushState    = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("royalcare:route-changed"));
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("royalcare:route-changed"));
      return result;
    };

    function onRouteChanged() {
      faviconLog("route-changed");
      if (isTenantRoute()) {
        // TenantFaviconManager owns /tenant/* — GlobalFavicon does nothing here.
        // Applying platformHref would cause a RoyalCare flash on every tenant
        // navigation before TenantFaviconManager's next effect cycle runs.
        return;
      }
      if (isCenterRoute()) {
        if (centerSourceHref) {
          void applyCenterFavicon(centerSourceHref);
        }
        // If centerSourceHref is null, CenterProfilePage will fire the event.
        return;
      }
      restorePlatformFavicon();
    }

    window.addEventListener(FAVICON_EVENT, onUpdate);
    window.addEventListener("popstate", onRouteChanged);
    window.addEventListener("royalcare:route-changed", onRouteChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(FAVICON_EVENT, onUpdate);
      window.removeEventListener("popstate", onRouteChanged);
      window.removeEventListener("royalcare:route-changed", onRouteChanged);
      window.history.pushState    = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
