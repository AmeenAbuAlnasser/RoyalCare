"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  getPublicCenterMarketingSettings,
  type PublicMarketingSettings,
} from "@/lib/api/public-centers";

const emptySettings: PublicMarketingSettings = {
  customBodyScript: null,
  customHeadScript: null,
  ga4Id: null,
  gtmId: null,
  metaPixelId: null,
  snapPixelId: null,
  tiktokPixelId: null,
};

function clean(value?: string | null) {
  return value?.trim() || null;
}

export function TenantMarketingInjector({ slug }: { slug: string }) {
  const [settings, setSettings] = useState<PublicMarketingSettings>(emptySettings);

  useEffect(() => {
    let cancelled = false;
    getPublicCenterMarketingSettings(slug)
      .then((response) => {
        if (!cancelled) setSettings(response);
      })
      .catch(() => {
        if (!cancelled) setSettings(emptySettings);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const metaPixelId = clean(settings.metaPixelId);
  const tiktokPixelId = clean(settings.tiktokPixelId);
  const snapPixelId = clean(settings.snapPixelId);
  const ga4Id = clean(settings.ga4Id);
  const gtmId = clean(settings.gtmId);
  const customHeadScript = clean(settings.customHeadScript);
  const customBodyScript = clean(settings.customBodyScript);

  // Tenant marketing scripts are allowed only on public center journeys.
  // Do not mount this injector in /centers, /tenant, or /super-admin shells.
  const isAllowedPublicCenterRoute =
    typeof window === "undefined" || window.location.pathname.startsWith(`/c/${slug}`);

  if (!isAllowedPublicCenterRoute) return null;

  return (
    <>
      {metaPixelId ? (
        <Script
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
`,
          }}
          id={`tenant-meta-pixel-${metaPixelId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {tiktokPixelId ? (
        <Script
          dangerouslySetInnerHTML={{
            __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
  ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
  var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${tiktokPixelId}');
  ttq.page();
}(window, document, 'ttq');
`,
          }}
          id={`tenant-tiktok-pixel-${tiktokPixelId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {ga4Id ? (
        <>
          <Script
            id={`tenant-ga4-src-${ga4Id}`}
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`}
            strategy="afterInteractive"
          />
          <Script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4Id}');
`,
            }}
            id={`tenant-ga4-config-${ga4Id}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}

      {gtmId ? (
        <Script
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
`,
          }}
          id={`tenant-gtm-head-${gtmId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {snapPixelId ? (
        <Script
          dangerouslySetInnerHTML={{
            __html: `
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?
a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];
var s='script';r=t.createElement(s);r.async=!0;r.src=n;
var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})
(window,document,'https://sc-static.net/scevent.min.js');
snaptr('init', '${snapPixelId}');
snaptr('track', 'PAGE_VIEW');
`,
          }}
          id={`tenant-snap-pixel-${snapPixelId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {customHeadScript ? (
        // Custom scripts come only from the public-safe tenant marketing endpoint.
        // The server-side Meta Conversion API token is intentionally excluded.
        <Script
          dangerouslySetInnerHTML={{ __html: customHeadScript }}
          id="tenant-custom-head-script"
          strategy="afterInteractive"
        />
      ) : null}

      {customBodyScript ? (
        // Custom scripts come only from the public-safe tenant marketing endpoint.
        // The server-side Meta Conversion API token is intentionally excluded.
        <Script
          dangerouslySetInnerHTML={{ __html: customBodyScript }}
          id="tenant-custom-body-script"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
