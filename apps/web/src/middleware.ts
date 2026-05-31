import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin, platform, and static paths that must NEVER be rewritten.
// Checked first — before host parsing, before any network call.
const SKIP_PREFIXES = [
  "/tenant/",
  "/super-admin/",
  "/api/",
  "/_next/",
  "/uploads/",
  "/c/",
  "/icons/",
];

const SKIP_EXACT = new Set([
  "/tenant",
  "/super-admin",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

function isAdminOrStaticPath(pathname: string): boolean {
  if (SKIP_EXACT.has(pathname)) return true;
  return SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Platform hostnames — requests from these are never custom-domain rewritten.
const PLATFORM_HOSTNAMES = new Set([
  "localhost",
  "royalcare.app",
  "www.royalcare.app",
]);

function isPlatformHost(host: string): boolean {
  if (!host) return true;
  if (PLATFORM_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".royalcare.app")) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Path guard — synchronous, zero cost. Admin/static routes always pass through.
  if (isAdminOrStaticPath(pathname)) return NextResponse.next();

  // 2. Host guard — skip platform domains.
  const hostHeader = request.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0].toLowerCase();
  if (isPlatformHost(host)) return NextResponse.next();

  // 3. Custom domain lookup — only runs for non-platform, non-admin requests.
  const apiBase =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001/api/v1";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `${apiBase}/public/domain-lookup?host=${encodeURIComponent(host)}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { slug?: string | null };
      if (data.slug) {
        const url = request.nextUrl.clone();
        const suffix = pathname === "/" ? "" : pathname;
        url.pathname = `/c/${data.slug}${suffix}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // Lookup failed (network error, timeout, bad JSON) — pass through silently.
  }

  return NextResponse.next();
}

export const config = {
  // Matcher excludes admin paths, static assets, and Next.js internals at the
  // framework level. The isAdminOrStaticPath() guard inside the function is a
  // second line of defence for anything the regex misses.
  matcher: [
    "/((?!tenant|super-admin|api|_next|uploads|icons|favicon\\.ico|robots\\.txt|sitemap\\.xml|c/).*)",
  ],
};
