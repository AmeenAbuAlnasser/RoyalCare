"use client";

import { useEffect, useState } from "react";
import { getPublicPlatformTrackingConfig, type PublicPlatformConfig } from "@/lib/api/platform-tracking";

// Module-level set persists across HMR remounts and soft navigations.
// Tracking pixel scripts are designed to live for the full browser session —
// removing and re-appending them resets internal pixel state and, more
// critically, can leave React's internal comment-node boundaries without a
// parent when the pixel's own insertBefore calls mutate nearby DOM nodes.
// Strategy: inject once, never remove, rely on the route guard to prevent
// injection on non-platform pages.
const injectedIds = new Set<string>();

function clean(value?: string | null): string | null {
  return value?.trim() || null;
}

function isPlatformRoute(): boolean {
  if (typeof window === "undefined") return true;
  const { pathname } = window.location;
  // Never inject platform tracking on center websites or tenant/super-admin panels.
  if (pathname.startsWith("/c/")) return false;
  if (pathname.startsWith("/tenant/")) return false;
  if (pathname.startsWith("/super-admin/")) return false;
  return true;
}

function addInlineScript(id: string, code: string): void {
  if (injectedIds.has(id)) return;
  injectedIds.add(id); // mark first — prevents double-inject on strict-mode double-effect
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.textContent = code;
  document.head.appendChild(script);
}

function addSrcScript(id: string, src: string): void {
  if (injectedIds.has(id)) return;
  injectedIds.add(id);
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function PlatformMarketingInjector() {
  const [config, setConfig] = useState<PublicPlatformConfig>(null);

  useEffect(() => {
    if (!isPlatformRoute()) return;

    let cancelled = false;
    getPublicPlatformTrackingConfig()
      .then((response) => {
        if (!cancelled) setConfig(response.config);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isPlatformRoute() || !config) return;

    const metaPixelId   = clean(config.metaPixelId);
    const tiktokPixelId = clean(config.tiktokPixelId);
    const snapPixelId   = clean(config.snapPixelId);
    const ga4Id         = clean(config.ga4Id);
    const gtmId         = clean(config.gtmId);

    if (metaPixelId) {
      addInlineScript(
        `platform-meta-pixel-${metaPixelId}`,
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
        `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
        `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
        `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
        `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
        `fbq('init','${metaPixelId}');fbq('track','PageView');`,
      );
    }

    if (tiktokPixelId) {
      addInlineScript(
        `platform-tiktok-pixel-${tiktokPixelId}`,
        `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];` +
        `ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];` +
        `ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};` +
        `for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);` +
        `ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};` +
        `ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";` +
        `ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;` +
        `ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;` +
        `o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};` +
        `ttq.load('${tiktokPixelId}');ttq.page()}(window,document,'ttq');`,
      );
    }

    if (ga4Id) {
      addSrcScript(
        `platform-ga4-src-${ga4Id}`,
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`,
      );
      addInlineScript(
        `platform-ga4-config-${ga4Id}`,
        `window.dataLayer=window.dataLayer||[];` +
        `function gtag(){dataLayer.push(arguments);}` +
        `gtag('js',new Date());gtag('config','${ga4Id}');`,
      );
    }

    if (gtmId) {
      addInlineScript(
        `platform-gtm-head-${gtmId}`,
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':` +
        `new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],` +
        `j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
        `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;` +
        `f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
      );
    }

    if (snapPixelId) {
      addInlineScript(
        `platform-snap-pixel-${snapPixelId}`,
        `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?` +
        `a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];` +
        `var s='script',r=t.createElement(s);r.async=!0;r.src=n;` +
        `var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);}` +
        `)(window,document,'https://sc-static.net/scevent.min.js');` +
        `snaptr('init','${snapPixelId}');snaptr('track','PAGE_VIEW');`,
      );
    }

    // No cleanup return — scripts persist for the browser session lifetime.
    // Removing and re-appending script nodes during React reconciliation is what
    // causes the "Cannot read properties of null (reading 'removeChild')" error:
    // pixel scripts internally call parentNode.insertBefore which leaves React's
    // comment-node boundaries without a parent if the original node is then removed.
  }, [config]);

  // Renders no DOM — all injection is via useEffect to stay outside React's fiber tree.
  return null;
}
