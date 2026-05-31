"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

// ─── Module-level brand state ─────────────────────────────────────────────────
// Persists across component mount/unmount cycles within the same browser tab.
// SPA navigation between /tenant/* pages unmounts and remounts CenterAdminShell,
// causing a brief "loading" window where centerId/centerName are null.  This
// state lets TenantFaviconManager re-apply the last known center branding
// immediately — before the new session fetch completes — so the tab never
// reverts to "RoyalCare" during that gap.
let tenantBrandState: {
  centerId: string;
  favicon: string | null;
  title: string;
} | null = null;

function applyTenantTitle(title: string) {
  if (typeof document !== "undefined") document.title = title;
}

// ─── Debug helpers ────────────────────────────────────────────────────────────
// Enable by running in browser console:  localStorage.setItem("debug:favicon","1")

function faviconLog(label: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("debug:favicon") !== "1") return;
    const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>("link"))
      .filter((el) => /icon/i.test(el.rel))
      .map((el) => `  [${el.id || "no-id"}] rel="${el.rel}" → "…${el.href.slice(-55)}"`);
    console.log(
      `[TenantFavicon] ${label}`,
      { pathname: window.location.pathname, ...data },
      links.length ? "\n" + links.join("\n") : "",
    );
  } catch { /* never let logging crash the app */ }
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

// These IDs match GlobalFavicon's managed set so both systems write the same nodes.
const MANAGED = [
  { id: "rc-fav-icon",      rel: "icon" },
  { id: "rc-fav-shortcut",  rel: "shortcut icon" },
  { id: "rc-fav-apple",     rel: "apple-touch-icon" },
] as const;

/**
 * Writes `href` to EVERY icon-related <link> in <head> in-place (no removal).
 *
 * Two-pass strategy:
 *  1. Update all existing elements (including Next.js SSR-generated ones that have
 *     no special ID). Updating href in-place is safe — it avoids the React fiber
 *     null-parentNode crash that occurs when we remove/re-append tracked nodes.
 *  2. Ensure our managed IDs exist and are appended AFTER the Next.js elements so
 *     browsers that pick the last matching <link> always see the correct favicon.
 */
function writeAllIconLinks(href: string) {
  if (typeof document === "undefined") return;

  faviconLog("before-write", { href: `…${href.slice(-55)}` });

  // Pass 1 — update every existing icon link in-place.
  const all = Array.from(document.head.querySelectorAll<HTMLLinkElement>("link"));
  for (const el of all) {
    const rel = (el.rel ?? "").toLowerCase();
    if (rel === "icon" || rel === "shortcut icon" || rel === "apple-touch-icon") {
      el.href = href;
    }
  }

  // Pass 2 — ensure managed nodes exist (appended last → browser preference).
  for (const { id, rel } of MANAGED) {
    let el = document.getElementById(id) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.id = id;
      el.rel = rel;
      el.type = "image/png";
      document.head.appendChild(el);
    }
    el.href = href;
  }

  faviconLog("after-write", { href: `…${href.slice(-55)}` });
}

async function convertToPng(href: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), 4000);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timer);
      try {
        const S = 512;
        const canvas = document.createElement("canvas");
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext("2d");
        if (!ctx || !img.naturalWidth || !img.naturalHeight) { resolve(null); return; }
        ctx.clearRect(0, 0, S, S);
        const scale = Math.min(S / img.naturalWidth, S / img.naturalHeight);
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        ctx.drawImage(img, Math.round((S - w) / 2), Math.round((S - h) / 2), w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = href;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * TenantFaviconManager — mounted inside CenterAdminShell for every /tenant/* page.
 *
 * Owns both the browser-tab TITLE and the FAVICON while the user is inside the
 * tenant admin area.  Does NOT use the GlobalFavicon event system, so it is
 * immune to timing races between page mount/unmount cycles.
 *
 * Rules:
 * - Rendered in BOTH the loading branch and the loaded branch of CenterAdminShell
 *   so it is always active, even during the session-fetch window on route changes.
 * - When centerId + centerName are present (session loaded): writes module-level
 *   tenantBrandState and applies title + favicon immediately.
 * - When centerId is null (session still loading): reads tenantBrandState and
 *   re-applies the last known title + favicon so the tab never reverts to "RoyalCare".
 * - Favicon: raw URL applied synchronously; upgraded to PNG in background.
 * - Cleanup: NEVER restores platform title/favicon while still inside /tenant/*.
 */
export function TenantFaviconManager({
  centerId,
  centerName,
  logoUrl,
}: {
  centerId: string | null;
  centerName: string | null;
  logoUrl: string | null;
}) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.pathname.startsWith("/tenant")) return;

    // ── Debug log (dev only) ──────────────────────────────────────────────────
    if (process.env.NODE_ENV === "development") {
      const faviconHref =
        document.querySelector<HTMLLinkElement>("link[rel='icon']")?.href ?? null;
      console.log("[TenantBrand]", {
        pathname,
        currentTitle: document.title,
        faviconHref: faviconHref ? `…${faviconHref.slice(-60)}` : null,
        tenantBranding: tenantBrandState
          ? { centerId: tenantBrandState.centerId, title: tenantBrandState.title }
          : null,
      });
    }

    faviconLog("effect-run", { centerId, centerName, logoUrl, pathname });

    // ── Title management ──────────────────────────────────────────────────────
    if (centerId && centerName) {
      // Session is loaded: record authoritative state and apply title.
      const title = `${centerName} | Dashboard`;
      tenantBrandState = { centerId, favicon: logoUrl, title };
      applyTenantTitle(title);
      faviconLog("applied-title", { title });
    } else if (tenantBrandState) {
      // Session still loading (route transition). Re-apply cached title so the
      // tab never reverts to "RoyalCare" during the brief re-mount window.
      applyTenantTitle(tenantBrandState.title);
      faviconLog("reapplied-cached-title", { title: tenantBrandState.title });
    }

    // ── Favicon management ────────────────────────────────────────────────────
    // Use the current logoUrl; fall back to the cached favicon so a center with
    // a logo still shows it even when the loading branch renders this component.
    const faviconSrc = logoUrl ?? tenantBrandState?.favicon ?? null;

    if (!faviconSrc) {
      faviconLog("skip-no-favicon", { pathname });
      return;
    }

    // Step 1: Apply raw URL synchronously (eliminates visible flicker).
    writeAllIconLinks(faviconSrc);
    faviconLog("applied-raw", { faviconSrc });

    // Step 2: Upgrade to a square 512×512 PNG in the background.
    let alive = true;
    void convertToPng(faviconSrc).then((png) => {
      if (!alive) return;
      if (!png) return;
      if (!window.location.pathname.startsWith("/tenant")) return;
      writeAllIconLinks(png);
      faviconLog("applied-png");
    });

    return () => {
      alive = false;

      // ── Cleanup guard ──────────────────────────────────────────────────────
      // window.location.pathname is already the DESTINATION when cleanup fires
      // (Next.js calls pushState before React unmounts the previous effects).
      if (window.location.pathname.startsWith("/tenant")) {
        // Still inside /tenant/* — do NOT touch title or favicon.
        faviconLog("cleanup-stay-tenant", { current: window.location.pathname });
        return;
      }

      // Left /tenant/*. GlobalFavicon will restore the platform favicon.
      // We intentionally leave document.title as-is; navigating to a non-tenant
      // page that has its own metadata will overwrite it naturally.
      faviconLog("cleanup-left-tenant", { current: window.location.pathname });
    };
  }, [centerId, centerName, logoUrl, pathname]);

  return null;
}
