# RoyalCare - Current Status

Last updated: 2026-05-28

Latest Smart Follow-up context fix: follow-up cards now load treatment context from the same patient/service pair, including both appointment `notes` and `internalNotes`. Clinical notes prioritize the latest `COMPLETED` appointment, then the latest `CONFIRMED` appointment, then the latest non-cancelled appointment with notes. Follow-up cards now distinguish no previous treatment from a treatment with no notes, show internal-notes and non-completed-session badges, include appointment status metadata, and keep provider names in the treatment timeline.

Latest follow-up UX polish: appointment notes now use clearer treatment/staff terminology across create, edit, detail, and follow-up context surfaces. `/tenant/follow-ups` cards were simplified into a medical workflow layout with patient identity, service/session, status badges, muted due-date metadata, a cleaner "last treatment session" block, compact treatment metadata chips, treatment/internal staff note labels, a softer connected vertical treatment timeline, contextual suggested-next-action hints, overdue card highlighting, and a stronger green patient WhatsApp CTA.

Latest follow-up urgency update: `/tenant/follow-ups` cards now show a dynamic remaining-time badge in the header, computed from `dueDate` on the client. Future follow-ups show blue remaining-time text, due-today follow-ups show a green "today" badge, and overdue follow-ups show a soft red overdue badge with Arabic/English/Hebrew phrasing.

Latest Center Website Builder v1 update: Center Admin `/tenant/settings/website` now includes a Section Builder card backed by `BrandingSettings.websiteSectionOrder` and `BrandingSettings.websiteSectionVisibility`. Admins can toggle and drag/drop homepage sections for Hero, About, Services, Reviews, Before/After, Team, Offers, Gallery, Contact, Working hours, and Social links. The public `/c/[slug]` homepage renders sections from the saved order, hides disabled/empty sections with no placeholders, and center website nav/footer items follow the same visibility plus available-data rules. Migration `20260526090000_add_website_builder_settings` was added and applied locally.

Latest stabilization QA pass: Full integration QA across all routes completed on 2026-05-26. Two production bugs found and fixed: (1) `tenant-analytics.ts` was missing the `NEXT_PUBLIC_ROYALCARE_API_URL` fallback — fixed by importing `API_BASE_URL` from `super-admin-centers`; (2) `tenant-domains.ts` used a local `API_BASE` constant — standardized to the same shared import. All 19 tenant API routes return `401`. Typechecks clean. Data isolation verified. No platform navbar leakage on public center pages. Tenant dashboard branding (title + favicon) is stable across SPA navigation after the `(center-admin)/layout.tsx` + `useLayoutEffect` fixes applied earlier in this session.

Latest QA Demo Data seed: `packages/database/prisma/seeds/qa-center.seed.ts` is implemented and verified. Running it with `DATABASE_URL` set seeds the `qa-recovery-1779095621868` center with all Center Website Builder content: BrandingSettings (purple brand, full EN/AR/HE text, social links, maps URL, working hours), 5 services, 6 gallery images, 5 reviews (all published), 4 before/after cases, 4 team members, and 3 offers with expiry dates. The script uses the `PrismaPg` adapter pattern matching the rest of the project. A `seed:qa` npm script is available in `packages/database/package.json`. All 8 public center routes are now seeded and ready for manual visual verification.

Latest Smart Contact Widget update: A floating Smart Contact Widget v1 is now live on all `/c/[slug]` pages and the booking page. The widget is a shared component at `apps/web/src/components/center/SmartContactWidget.tsx`. It shows up to 5 actions — WhatsApp, Phone, Book Now, Google Maps, and Messenger — auto-hiding any whose branding field is absent. Center `primaryColor` drives the Book Now and toggle button colors. The widget is fixed bottom-right, `z-50`, iPhone-safe-area-aware, and closes on outside-click or Escape. Book Now is hidden on the booking page via `showBook={false}` since the form is already a booking flow. Two new `CenterWebsiteEventType` values `CLICK_MAP` and `CLICK_MESSENGER` were added to the Prisma schema and backend validation. TypeScript passed clean.

Latest Center Website Analytics update: Center Website Analytics Dashboard v1 is complete. `CenterWebsiteEvent` stores center-scoped visitor events with `centerId`, `eventType` (14-value enum), `source` (6-value enum), `sessionId`, `page`, and `extraData`. The public fire-and-forget endpoint `POST /api/v1/public/centers/:slug/track` receives browser events with no authentication; the tenant dashboard endpoint `GET /api/v1/tenant/marketing/analytics` returns 11 metric cards, 6 traffic sources, daily visitor/booking sparklines, top pages, and top services for the last 30 days, gated by `reports:view`. Client-side tracking fires `VIEW_CENTER_WEBSITE` (once per session via sessionStorage dedup), `VIEW_BOOKING_PAGE`, `CLICK_BOOK_NOW`, `CLICK_WHATSAPP`, `CLICK_PHONE`, `VIEW_GALLERY`, `VIEW_REVIEWS`, `VIEW_BEFORE_AFTER`, `VIEW_OFFERS`, `VIEW_CONTACT`, `VIEW_SERVICES`, `SELECT_SERVICE` (with extraData), and `COMPLETE_BOOKING` from center public pages and the booking page. The Center Admin `/tenant/marketing` dashboard shows loading skeleton, empty state (`tone="neutral"`), error state with refresh, and EN/AR/HE + RTL support. `websiteAnalytics` nav item was added to `CenterAdminShell`. Booking page was fixed to use the center-branded `BookingNavbar` instead of the RoyalCare platform `PublicHeader`. TypeScript passed with no errors after fixing `tone="neutral"` and using a structural `Copy` interface instead of `as const` literal types.

Latest Center Before / After update: Center Website Builder now includes Before / After Gallery v1 for transformation-based centers. `CenterBeforeAfter` stores center-scoped localized titles/descriptions, category, before/after image URLs, publish state, and sort order. Tenant admins manage cases at `/tenant/settings/before-after`; tenant APIs are `GET/POST/PATCH/DELETE /api/v1/tenant/before-after` plus `POST /api/v1/tenant/before-after/upload`. Public center websites load `GET /api/v1/public/centers/:slug/before-after`, which resolves slug to center id and returns only published cases. `/c/[slug]` shows a "Real Results" / "نتائج حقيقية" section only when data exists, `/c/[slug]/before-after` is available, and center nav/footer include Before / After only when published cases exist. QA Recovery was seeded with 3 published cases and returned exactly 3; Jenin Care and the empty QA center returned no public cases.

Latest Center Reviews update: Center Website Builder now includes Reviews / Testimonials v1. `CenterReview` stores center-scoped customer name, 1-5 rating, localized AR/EN/HE comments, publish state, and sort order. Tenant admins manage reviews at `/tenant/settings/reviews`; tenant APIs are `GET/POST/PATCH/DELETE /api/v1/tenant/reviews` and are scoped by session `centerId`. Public center websites load `GET /api/v1/public/centers/:slug/reviews`, which resolves slug to center id and returns only published reviews. `/c/[slug]` shows a Reviews section only when published reviews exist, `/c/[slug]/reviews` is available, and center nav/footer include Reviews only when public reviews exist. QA Recovery was seeded with 3 reviews, one unpublished, and the public endpoint returned only 2; Jenin Care and the empty QA center returned no public reviews.

Latest generic center website verification: gallery and favicon behavior was verified as generic and center-scoped, not hardcoded to QA Recovery or Jenin Care. Source search found no hardcoded QA/Jenin slugs in app/API code. Public gallery loading resolves `centerSlug` to `centerId` and reads `CenterGalleryImage` rows by that id. QA Recovery returned 4 images and its own logo, Jenin Care returned 1 image and a different logo, and a new local `qa-empty-generic-center` with no logo/gallery returned empty gallery data, `branding: null`, and `200` public pages with platform favicon fallback.

Latest center website gallery/fav icon update: public center websites now consume the center-scoped public gallery endpoint. `/c/[slug]` shows a Gallery section when images exist, `/c/[slug]/gallery` is available, and center website nav/footer show Gallery only for centers with gallery images. QA Recovery returned 4 public gallery images while Jenin Care returned only its own gallery data. Center favicon handling was hardened so center pages keep the center logo favicon across `/c/*` subpage navigation and only restore the RoyalCare platform favicon after leaving center website routes.

Latest tenant gallery update: `/tenant/settings/gallery` now handles gallery load failures inline instead of surfacing a generic failed-load state. The frontend gallery API client preserves HTTP status/details, the page shows localized session-expired, permission-denied, or general error messaging with a Retry action, and the backend `GET /api/v1/tenant/center-gallery` was verified to return center-scoped items for an authenticated tenant session while unauthenticated access returns `401`.

Latest center website independence update: independent center website pages no longer promote the RoyalCare network or cross-center browsing. `/c/[slug]`, `/c/[slug]/about`, `/c/[slug]/services`, and `/c/[slug]/contact` remove All centers / Back to directory links, use only the current center navbar items, and show a neutral official-center badge instead of the RoyalCare network badge. `/centers` remains unchanged as the platform directory, and `/c/[slug]/book` still works.

Latest tenant website settings update: `/tenant/settings/website` now shows the center public website URL near the top of the page, built from the current browser origin plus `/c/[centerSlug]`. Center Admins can open the public website in a new tab or copy the link, with EN/AR/HE labels, RTL-safe layout, and no custom-domain support yet.

Latest center website builder routing update: RoyalCare public surfaces are now explicitly split between platform marketing pages (`/`, `/centers`, `/features`, `/pricing`) and independent center websites. Center website routes now include `/c/[slug]`, `/c/[slug]/about`, `/c/[slug]/services`, and `/c/[slug]/contact`; these pages share the public-safe center profile response, use the center-specific navbar/logo/colors, include Book Now and configured WhatsApp CTAs, support EN/AR/HE + RTL, and keep `/centers` as a platform-directory page with the platform navbar. Custom domains/subdomains remain future work.

Latest center website navigation update: `/c/[slug]` now uses a dedicated center website navbar instead of the main RoyalCare platform navbar. The center navbar shows center logo/name, Home, Services, About, Contact, and Book Now; uses center branding colors where available; includes a small All centers link outside the main nav; supports mobile menu, EN/AR/HE, and RTL; and preserves `ViewCenter`, `StartBooking`, and `WhatsAppClick`. `/centers`, `/c/[slug]/book`, `/tenant/*`, and `/super-admin/*` remain on their existing navigation/shells.

Latest center public website update: `/c/[slug]` now renders Center Public Website Homepage v1 from public-safe center website settings. The page includes hero logo/cover/name/slogan, short description, Book Now/WhatsApp/Call CTAs, about text, featured services, working hours, contact details, social links, and Google Maps link when configured. It preserves `ViewCenter`, `StartBooking`, and `WhatsAppClick`, keeps `/c/[slug]/book` working, supports EN/AR/HE + RTL, and falls back gracefully when logo, cover, slogan, description, hours, or contact fields are missing. `GET /api/v1/public/centers/:slug` now includes the website settings fields from `BrandingSettings` while keeping private/admin fields and Meta CAPI token out of the public payload.

Latest center website settings update: Center Admins now have `/tenant/settings/website` as the first CMS/settings layer for future full center websites. The page reuses the existing tenant settings shell and `settings:view` permission, stores data in center-scoped `BrandingSettings`, supports EN/AR/HE + RTL, and includes branding images, primary/secondary colors, localized short/full descriptions, localized slogans, contact details, localized addresses, Google Maps URL, localized working-hours text, Facebook/Instagram/TikTok links, and a live preview card. The existing `GET/PATCH /api/v1/tenant/public-profile` and `POST /api/v1/tenant/public-profile/upload-image` flow was extended in place and now enforces `settings:view` for tenant access. Migration `20260525110000_add_center_website_settings` has been applied locally.

Latest marketing tracking update: Backend-only Meta Conversion API v1 is wired to successful public booking creation with Meta Pixel/CAPI deduplication. `POST /api/v1/public/centers/:slug/booking-requests` creates the booking request first, returns `trackingEventId=booking_<bookingRequestId>`, sends server-side `CompleteBooking` with the same `event_id`, and the browser `CompleteBooking` passes that id to Meta Pixel as `eventID`. `/tenant/settings/marketing` manages Meta/TikTok/Snap/GA4/GTM/custom scripts and the Meta CAPI token behind the existing `settings:view` gate; the raw CAPI token is no longer echoed back in settings responses and is represented by a saved/hidden state. The page includes Test Tracking buttons for Meta Pixel, TikTok Pixel, GA4, Snap Pixel, and backend-only Meta CAPI using `TestMarketingEvent`. Server-side Meta CAPI `CompleteBooking` and `TestMarketingEvent` attempts now write center-scoped `MarketingTrackingLog` rows as `SUCCESS`, `FAILED`, or `SKIPPED`; `/tenant/settings/marketing` shows those safe recent logs with provider, event, status, message, event id, and created date. Migration `20260524120000_add_marketing_tracking_logs` has been applied locally and `prisma migrate status` is clean. Log writes are best-effort: if the table is missing or unavailable, booking still succeeds and the logs endpoint returns a safe unavailable fallback. Public booking UX was hardened after this tracking work and rechecked on 2026-05-25: `/c/[slug]/book` now has localized field/API error mapping, stronger slot-loading and submit-disabled states, double-submit prevention, stale slot refresh handling, alert rendering for submit failures, and preserved `BookingFailed`/`CompleteBooking` events. The center-scoped `metaConversionApiToken` remains absent from public APIs and web clients. Phone/name user data is SHA-256 hashed before sending, provider failures only warn without raw PII or token logs, and missing pixel/token silently skips.

Latest public appearance update: Super Admin `/super-admin/settings` Public Website Appearance now has a tighter 70/30 desktop form/preview layout, compact image fields, desktop-only sticky preview, clear buttons, collapsed URL inputs, and real image uploads for logo, favicon, hero, and footer logo. The protected upload endpoint is `POST /api/v1/admin/uploads/public-image`, accepts PNG/JPG/WebP/SVG up to 2MB, stores files in `apps/web/public/uploads/branding/`, and returns `/uploads/branding/...` URLs for the existing public settings flow.

Latest public branding rendering update: Public navbar and footer now use the shared `BrandLogo` component so uploaded logos render with fixed mobile/desktop heights, max-width constraints, `object-contain`, loading skeleton, and initials fallback. This prevents square, wide, tall, transparent, and SVG logo uploads from stretching or wrapping the brand name.

Latest Public Appearance UX update: The `/super-admin/settings` Public Website Appearance save controls now sit in a grouped sticky bottom bar inside the section. Status and save feedback stay together, Cancel/Save actions stay together, image upload success shows an inline “save changes” reminder near the image field, and save errors also appear near the top of the section instead of drifting to page edges.

Latest favicon fix: Uploaded `public_favicon_url` now propagates from admin settings to public settings with `updatedAt`, root metadata uses the uploaded favicon with a version query, and the single root `GlobalFavicon` fetches public settings after hydration to append `icon`, `shortcut icon`, and `apple-touch-icon` links last in `<head>`. Headless checks confirmed `/centers`, `/c/jenin-care`, `/tenant/settings`, and `/super-admin/settings` request the uploaded `/uploads/branding/...webp?v=...` favicon.

Latest schedule management update: Center Admins now have `/tenant/schedule` for Schedule Management v1. The page exposes center weekly working hours, closed days/holidays, provider weekly hours, and provider leave with EN/AR/HE labels and mobile-friendly layouts. Backend tenant schedule endpoints are available under `GET/PATCH/POST/DELETE /api/v1/tenant/schedule...`, scoped by session `centerId`, protected by `settings:view`, and feed the existing `ScheduleService` used by public booking and appointment availability.

Latest booking request notification update: Public booking submissions now create `BOOKING_REQUEST_CREATED` Center Admin in-app notifications with EN/AR/HE content and `actionUrl: "/tenant/booking-requests"`. Tenant notifications now expose a small SSE stream at `GET /api/v1/tenant/notifications/stream`; the tenant shell listens to that stream, refreshes unread notification and pending booking badges through the existing notification APIs, keeps polling as fallback, listens for same-browser public booking events, and shows a localized new-booking toast that links to Booking Requests. Live API QA created booking request `3601301e-c45a-4c2a-8449-f2e2b37fb258`, verified notification `b024a445-3e08-4b32-a2f9-5878a41ecc5a`, and confirmed the tenant pending booking count returned `1`.

Latest tenant security hardening update: Tenant APIs received an isolation/RBAC hardening pass. Tenant mutations for patients, services, appointments, invoices, payments, credit usage, and manual credit now perform the write itself with `centerId` in the mutation filter instead of relying only on a prior scoped read. Tenant password change now revalidates the active center role assignment before updating the user password. Live HTTP QA created two isolated QA centers and confirmed cross-center patient, service, appointment, and invoice reads/writes return `404`, while same-center access and tenant financial reports still return `200`.

Latest audit business-name localization update: User-entered business names are no longer treated as translatable UI text. Patients already store real localized full names through `fullNameAr`, `fullNameEn`, and `fullNameHe`; centers now store nullable `nameAr`, `nameEn`, and `nameHe` with `name` as the fallback/default. Super Admin center create/edit forms now expose Arabic, Hebrew, and English center name fields. Tenant billing audit metadata now snapshots patient and center localized names from the database, and the Super Admin Audit Logs business summary selects the current language snapshot with fallback to the default name while keeping UUIDs in Technical details only.

Latest tenant audit hardening update: Appointment to Invoice to Payment audit coverage now includes explicit `TENANT_CREDIT_CREATED` rows when an overpayment creates new patient credit. Tenant invoices now have nullable unique `invoiceNumber` values generated from `TenantInvoiceNumberCounter` in `INV-YYYY-000001` format, with existing local invoices backfilled. Tenant billing audit actions now carry invoice number, patient id/name, EN/AR/HE patient name metadata, center id/name, EN/AR/HE center name metadata, and relevant amount fields. Existing tenant billing audit rows were backfilled from their invoice ids so old rows also have invoice numbers plus patient/center business metadata; final local verification found 0 matching audit rows missing invoice numbers. Super Admin Audit Logs maps invoice creation, payment addition, credit creation, credit usage, and invoice cancellation targets from that billing metadata so the target card shows the patient or invoice instead of an unspecified placeholder. Super Admin Audit Logs now also localizes tenant billing and subscription invoice audit action labels in English, Arabic, and Hebrew while preserving raw action codes for filtering. The audit-log dictionary was hardened with clean Arabic/Hebrew Unicode labels, localized unknown actor/target/center fallbacks, billing detail labels, metadata labels, technical-detail labels, and current-language to English to raw-code fallback behavior. Billing audit cards now prefer invoice numbers, patient names, center names, and business amounts as primary values while keeping UUID identifiers in collapsed Technical details when friendly values exist. Tenant billing audit actions render through a custom business summary instead of the generic target/center grid, preventing duplicated patient/target and center rows.

Latest tenant financial reports update: Center Admin `/tenant/reports` now shows API-backed financial reports with cards for selected-period revenue, paid invoices, pending invoices, overdue invoices, total patient credit, and average invoice value. The page includes filters for Today, Last 7 days, This month, and Custom range plus charts for revenue by day, payment status, service, and top patients by spending. The backend endpoint is `GET /api/v1/tenant/reports/financial`, requires `reports:view`, derives `centerId` from the tenant session, excludes cancelled invoices, and includes both payments and patient credit usage tied to the same filtered non-cancelled invoice dataset.

Latest subscription billing update: Subscription Billing Phase 1 + 2 is complete and final QA passed. Manual subscription invoices now support Super Admin create/list/mark-paid/cancel/search, tenant read-only invoice visibility, race-safe yearly invoice numbering through `SubscriptionInvoiceNumberCounter`, unpaid past-due invoice sync to `OVERDUE`, audited PDF invoice downloads in AR/EN/HE, and Super Admin dashboard subscription financial KPIs including total revenue, paid/pending/overdue invoices, MRR, and revenue by plan. This is still manual/direct billing only; no payment gateway was added.

Latest Subscription Billing QA: Final runtime QA passed on 2026-05-17. Tests covered create invoice, auto invoice number, mark paid, cancel, overdue sync, PDF downloads, audit logs, tenant read-only invoice access, expired/suspended tenant access rules, and `subscriptionBilling` dashboard KPI consistency against direct database counts/aggregates. AR, EN, and HE PDF invoices generated as valid one-page PDFs with readable invoice numbers and totals.

Known Subscription Billing production risk: PDF generation depends on Chrome/Chromium being available to the API process through `CHROME_PATH` or a standard installation path. Production deploys must verify the executable path before enabling invoice PDF downloads.

Recommended next module: Tenant Financial Reports or final hardening of the Appointment → Invoice → Payment workflow.

MVP closure report - RoyalCare Subscription System:
- Completed features: shared subscription lifecycle classification, Super Admin subscription filters/actions/details, dashboard KPI alignment, tenant subscription access control, renewal request flow, manual WhatsApp flow with phone fallback and attempt logging, Super Admin and tenant notifications, audit logs, subscription timeline, daily lifecycle automation job, lifecycle job monitoring card, and clickable dashboard KPI navigation.
- QA summary: subscription lifecycle counts and filters match; impossible status/day badge contradictions were removed; dashboard KPI cards navigate to exact lifecycle filters; tenant `ACTIVE` and `EXPIRING_SOON` centers keep write access; tenant `EXPIRED` and `SUSPENDED` centers are blocked from business writes while dashboard, notifications, logout, and renewal request remain available; same-session access updates after Super Admin renewal; manual WhatsApp logs appear in timelines; notification read/read-all and tenant badge flows were verified during regression.
- Commands run during final subscription QA passes: API `npm.cmd run lint`, API `npm.cmd run build`, API `npm.cmd test -- --runInBand`, web `npm.cmd run lint`, web `npx.cmd tsc --noEmit`, and web `npm.cmd run build`.
- Known limitations: there is no real payment gateway yet, WhatsApp is still a manual flow without WhatsApp Business API automation, the cron scheduler depends on the API process being up, and timezone/date boundaries must be monitored in production.
- Production checklist before launch: confirm database backup/restore, verify required environment variables, verify lifecycle cron execution at 02:00 server time, confirm Super Admin permissions and seeded platform roles, configure the support WhatsApp number, seed tenant/platform permissions, and run the lifecycle job once after deploy.
- Recommended next module: Billing / subscription invoices / payments, so manual subscription lifecycle can connect to actual billing records before adding any real payment gateway.

Latest tenant subscription restriction QA: Live tenant API checks confirmed `ACTIVE` and `EXPIRING_SOON` centers can reach normal validation for business writes, while `EXPIRED` and `SUSPENDED` centers are blocked by `TenantSubscriptionAccessMiddleware` with stable subscription error codes. Tenant dashboard, auth refresh, notifications, and renewal requests remain available. Direct tenant appointment/invoice/payment UI paths now disable blocked writes with localized restriction messaging.

Latest Subscription Automation UX update: `/super-admin/subscriptions` now presents the lifecycle job card with Super Admin-friendly summaries: last/next run, success/failure tone, total subscriptions checked, expired updated, notifications created, suspended skipped, duplicate notifications skipped, and EN/AR/HE readable summary lines. Technical job identifiers remain hidden from the UI.

Latest lifecycle job monitoring update: `/super-admin/subscriptions` now includes a Subscription Automation card backed by persisted `SubscriptionLifecycleJobRun` records and `GET /api/v1/super-admin/subscriptions/lifecycle-job/status`; Super Admins can run the lifecycle job manually from the UI.

Latest cron update: Subscription lifecycle automation now runs daily at 02:00 server time, updates expired `ACTIVE`/`TRIALING` subscriptions to `EXPIRED`, creates deduped Super Admin and Center Admin lifecycle notifications, and logs automatic status changes as SYSTEM audit events.

Latest lifecycle filter update: Super Admin dashboard subscription lifecycle cards now link with `?lifecycle=` only, and `/super-admin/subscriptions` filters by the backend-returned `item.lifecycle` exactly. Old lifecycle-card params `status=`, `filter=`, `expiringSoon=true`, and `expired=true` are no longer emitted by the web client.

Latest lifecycle badge consistency update: Super Admin subscription list rows, mobile cards, expiring-soon cards, and subscription details status badge now render from one shared lifecycle presentation object containing lifecycle, days remaining, label, and color. Live contradiction scan found zero invalid combinations.

Latest subscription KPI alignment update: Super Admin dashboard subscription KPI cards now use the shared lifecycle helper to classify all subscriptions exactly once across Total, Active, Trialing, Expiring Soon, Expired, Suspended, Cancelled, and optional Unknown. Current live distribution check is total 21 and lifecycle sum 21.

Latest lifecycle alignment update: Super Admin dashboard expiring-soon KPIs and `/super-admin/subscriptions?filter=EXPIRING_SOON` now share the same backend lifecycle definition: `ACTIVE`/`TRIALING`, 0-7 days remaining, and not suspended, cancelled, or expired.

Latest dashboard navigation update: Super Admin dashboard overview cards now click through to Centers, Users, and dashboard analytics, and subscription KPI cards navigate to `/super-admin/subscriptions` with active, expiring soon, expired, and suspended filters pre-applied.

Latest QA regression update: Subscription + notifications regression on 2026-05-14 fixed two production issues: Super Admin subscription API routes now require platform permissions, and WhatsApp opens/copies launched from `/super-admin/subscriptions` now create manual WhatsApp logs that surface in subscription timelines.

Latest notifications update: Super Admin now has targeted in-app subscription lifecycle notifications, unread bell preview, read/read-all APIs, and category filters on `/super-admin/notifications`.
Notification bell refresh now uses 30-second polling plus the `super-admin-notifications-updated` browser event, so read/read-all and subscription updates refresh the badge without a page reload.

Latest subscription UX update: Super Admin subscription overview desktop and mobile action menus now use one shared lifecycle action availability helper, so ACTIVE/TRIALING/EXPIRING_SOON expose View, Renew, Suspend, and WhatsApp while EXPIRED/SUSPENDED/CANCELLED expose View, Renew, and WhatsApp.
Status: Phase 7 (Subscription Lifecycle) complete — subscription KPIs, lifecycle computation, expiring/expired/suspended detection, tenant subscription notice banner, super-admin subscriptions page now API-connected with edit modal, and subscription KPI section on super-admin dashboard all implemented and passing TypeScript checks

## 1. What Exists Now

The project currently has AI memory/documentation files, a clean monorepo folder structure, the main web application scaffolded, the backend API scaffolded, and the database package initialized.

Files initialized:
- `ai-memory/00_PROJECT_OVERVIEW.md`
- `ai-memory/01_ARCHITECTURE.md`
- `ai-memory/02_DATABASE_SCHEMA.md`
- `ai-memory/03_BUSINESS_RULES.md`
- `ai-memory/04_API_MAP.md`
- `ai-memory/05_UI_UX_RULES.md`
- `ai-memory/06_PERMISSIONS.md`
- `ai-memory/07_DECISIONS_LOG.md`
- `ai-memory/08_CHANGELOG.md`
- `ai-memory/09_CURRENT_STATUS.md`
- `ai-memory/10_NEXT_TASKS.md`
- `CLAUDE.md`
- `AGENTS.md`
- `README.md`

Monorepo folders initialized:
- `apps/web`
- `apps/mobile`
- `services/api`
- `packages/database`
- `packages/shared`
- `packages/ui`

Placeholder files:
- `.gitkeep` files were added inside empty app/service/package folders so the structure can be preserved before framework scaffolding.

Web app initialized:
- Location: `apps/web`
- Next.js `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS
- App Router
- ESLint
- `src/` directory
- Import alias `@/*`
- Route groups prepared:
  - `src/app/(public)`
  - `src/app/(super-admin)`
  - `src/app/(center-admin)`
  - `src/app/(portal)`
- Future module folders prepared:
  - `src/features/public-site`
  - `src/features/super-admin`
  - `src/features/center-admin`
  - `src/features/customer-portal`
  - `src/features/auth`
  - `src/features/tenancy`

Implemented web screens:
- Super Admin Login
  - Route: `/super-admin/login`
  - File: `apps/web/src/app/(super-admin)/super-admin/login/page.tsx`
  - Status: UI-only, backend auth not connected
- Tenant Center Login
  - Route: `/login`
  - Dedicated route: `/c/[centerSlug]/login`
  - Fallback route: `/tenant/login`
  - File: `apps/web/src/app/(center-admin)/login/page.tsx`
  - Component: `apps/web/src/features/center-admin/login/CenterLoginPage.tsx`
  - Status: API-connected center staff login
  - Uses `POST /api/v1/auth/center/login`.
  - Dedicated login resolves safe center branding through `GET /api/v1/auth/center/resolve/:centerSlug`.
  - Dedicated login authenticates only users assigned to the resolved center slug.
  - Dedicated login applies the center default language and shows the center logo/name.
  - Does not change Super Admin login behavior.
- Tenant Center Dashboard Shell
  - Route: `/dashboard`
  - File: `apps/web/src/app/(center-admin)/dashboard/page.tsx`
  - Component: `apps/web/src/features/center-admin/dashboard/CenterDashboardPage.tsx`
  - Status: API-connected shell using current center staff session
  - Uses `GET /api/v1/auth/center/me` to load current center, user, and role.
  - Includes center name, current user, role, center status, summary placeholders, sidebar/drawer navigation, and logout.
  - Tenant sidebar uses the center's own stored `branding.logoUrl` when available and falls back to center initials when no logo is stored.
  - Supports English, Arabic, and Hebrew through `center-admin` dictionary entries.
  - Tenant dashboard sidebar, role labels, status labels, titles, cards, loading state, and logout labels are localized.
  - Tenant shell includes a provider-backed language switcher using the shared `royalcare_locale` flow.
  - Arabic and Hebrew render RTL with the tenant sidebar/drawer mirrored to the right; English renders LTR with navigation on the left.
- Tenant Patients Management
  - Route: `/dashboard/patients`
  - Details route: `/dashboard/patients/[id]`
  - Status: API-connected tenant patients foundation using real PostgreSQL data
  - Uses the authenticated center staff session; center id is not accepted from the frontend.
  - Supports patient list, search by name/phone, add patient, edit patient, basic details, activate, and archive.
  - Patient search filters loaded rows instantly while typing; no Search button or Enter key is required.
  - Patient search matches full name and phone number with trimmed, case-insensitive, partial matching.
  - Patient success notices auto-hide after 4 seconds.
  - Supports English, Arabic, and Hebrew labels with RTL layout for Arabic/Hebrew.
  - Uses `GET/POST/PATCH /api/v1/patients` tenant endpoints.
- Tenant Services Management
  - Route: `/tenant/services`
  - Create route: `/tenant/services/new`
  - Details route: `/tenant/services/[id]`
  - Edit route: `/tenant/services/[id]/edit`
  - Status: API-connected tenant services foundation using real PostgreSQL data
  - Uses the authenticated center staff session; center id is not accepted from the frontend.
  - Supports service list, live search, active/archived filter, create, details, edit, archive, and activate.
  - Supports English, Arabic, and Hebrew service names/descriptions and UI labels.
  - Only the center default-language service name is required; non-default language names and all descriptions are optional.
  - Non-default language fields are clearly marked optional in the create/edit forms.
  - Arabic and Hebrew render through the shared RTL tenant shell.
  - Uses `GET/POST/PATCH /api/v1/tenant/services` tenant endpoints.
  - Permission-aware UI hides actions based on `services.view`, `services.create`, `services.update`, `services.archive`, and `services.activate`; backend enforces the same permissions.
  - Service pricing is manual metadata only; no online payments are implemented.
- Tenant Appointments Management
  - Route: `/tenant/appointments`
  - Create route: `/tenant/appointments/new`
  - Details route: `/tenant/appointments/[id]`
  - Edit route: `/tenant/appointments/[id]/edit`
  - Status: API-connected tenant appointments foundation using real PostgreSQL data
  - Uses the authenticated center staff session; center id is not accepted from the frontend.
  - Supports appointment list, live patient search, status filter, date filter, provider filter, today/upcoming summary, create, details, edit, cancel, and status update.
  - Appointment records link same-center patient, service, provider/staff user, and creating user.
  - Backend prevents cross-center patient, service, provider, and appointment access.
  - Backend prevents overlapping appointments for the same provider and same patient; overlap errors include full `conflictDetails` (patient, service, provider, date, start, end) in the API response.
  - Backend `ensureNoOverlap` uses explicit UTC date string round-trip and an in-memory safety filter to guarantee the date comparison is timezone-safe.
  - Backend throws `conflictDetails` guaranteed non-null so the frontend alert always has data to render.
  - Overlap detected: frontend shows a styled red alert box with conflict details below the form fields instead of a simple text message.
  - Frontend `extractConflictDetails` has a fallback: if `conflictDetails` key is missing but the API message contains "conflict", a minimal placeholder object is used so the alert still renders.
  - Conflict alert is fully translated in EN, AR, and HE with RTL support.
  - Cancelled appointments remain historically visible through `CANCELLED` status and cancellation metadata.
  - Supports English, Arabic, and Hebrew labels with RTL layout for Arabic/Hebrew.
  - Uses `GET/POST/PATCH /api/v1/tenant/appointments` tenant endpoints.
  - Permission-aware UI hides or disables appointment actions based on role permissions; backend enforces the same permissions.
  - No online payments are implemented.
- Tenant Staff Management
  - Route: `/tenant/staff`
  - Create route: `/tenant/staff/new`
  - Details route: `/tenant/staff/[id]`
  - Edit route: `/tenant/staff/[id]/edit`
  - Status: API-connected tenant staff management using existing `User`, `Role`, and `UserRole` data
  - Uses the authenticated center staff session; center id is not accepted from the frontend.
  - Supports staff list, search by name/email, role filter, status filter, create, details, edit, activate, and deactivate.
  - Staff create requires full name, email, role, status, and password.
  - Staff edit supports optional password and never displays an existing password or password hash.
  - Backend hashes staff passwords with the existing scrypt password helper.
  - Staff responses never include `passwordHash`.
  - Permission-aware UI hides create/edit/status actions based on `staff.view`, `staff.create`, `staff.update`, and `staff.activate`; backend enforces the same permissions.
  - `CENTER_OWNER` and `CENTER_MANAGER` can fully manage staff; other center roles have view-only staff access in the current foundation.
  - Supports English, Arabic, and Hebrew labels with RTL layout for Arabic/Hebrew.
  - Uses `GET/POST/PATCH /api/v1/tenant/staff` tenant endpoints.
  - Appointment provider dropdown now shows only active same-center provider-capable roles: `DOCTOR`, `STAFF`, and `CENTER_MANAGER`.
  - Receptionist and accountant users no longer appear as appointment providers.
  - Provider display uses full name first and falls back to email instead of generated role/id strings.
  - No online payments are implemented.
- Tenant Billing Management (Manual Invoices + Payments)
  - Route: `/tenant/billing`
  - Create route: `/tenant/billing/new`
  - Details route: `/tenant/billing/[id]`
  - Status: API-connected tenant billing and payments module using real PostgreSQL data
  - Uses the authenticated center staff session; center id is not accepted from the frontend.
  - Supports invoice list, search by patient name/phone, status filter (PENDING/PARTIAL/PAID/CANCELLED/ALL), create, view details, mark as paid, cancel, and reopen.
  - Invoice fields: patient, service, optional provider (staff), amount, currency, notes, status, createdAt, updatedAt.
  - Creating an invoice auto-fills amount and currency from the selected service price metadata.
  - Invoice status state machine: PENDING → PARTIAL (auto) → PAID or CANCELLED; PARTIAL → PAID or CANCELLED; PAID → CANCELLED; CANCELLED → PENDING (reopen, recalculates from payments).
  - PARTIAL status is set automatically by the payment engine; never set manually.
  - When reopening a CANCELLED invoice, the backend recalculates status from existing payment aggregates (PENDING if no payments, PARTIAL if partial, PAID if fully paid).
  - Payment engine enforces no-overpayment (tolerance 0.001) and blocks payments on CANCELLED invoices.
  - Permission-aware UI: Add Invoice requires `billing.create`; Mark as Paid requires `billing.mark_paid`; Cancel Invoice requires `billing.update`; Reopen Invoice requires `billing.update`; backend enforces the same permissions.
  - Payment permissions: `payments.view` for CENTER_OWNER/CENTER_MANAGER/ACCOUNTANT/RECEPTIONIST/DOCTOR/STAFF; `payments.create` for CENTER_OWNER/CENTER_MANAGER/ACCOUNTANT/RECEPTIONIST.
  - Invoice Details page shows: status badge (PARTIAL=indigo, PENDING=amber, PAID=emerald, CANCELLED=red), action buttons, invoice fields, payment summary (invoiceTotal, paidAmount, balanceDue), Add Payment form (amount, method, date, notes), and payment history table.
  - Add Payment form is hidden when invoice is PAID or CANCELLED.
  - Supports English, Arabic, and Hebrew labels with RTL layout for Arabic/Hebrew.
  - Invoice service name resolves locale-aware from `nameEn`/`nameAr`/`nameHe`.
  - Uses `GET/POST/PATCH /api/v1/tenant/billing` and `GET/POST /api/v1/tenant/billing/:invoiceId/payments` tenant endpoints.
  - Backend `Invoice.amount` and `Payment.amount` are `Decimal @db.Decimal(12,2)`; serialized to string via format helpers for all API responses.
  - `Payment.method` enum: CASH, BANK_TRANSFER, CHECK, OTHER.
  - Payment create uses `$transaction` to atomically create the payment and update the invoice status.
  - No online payment gateway, card, checkout, Stripe, PayPal, or external provider fields are implemented.
- Super Admin Dashboard
  - Route: `/super-admin/dashboard`
  - File: `apps/web/src/app/(super-admin)/super-admin/dashboard/page.tsx`
  - Component: `apps/web/src/features/super-admin/dashboard/SuperAdminDashboard.tsx`
  - Status: UI-only, backend data not connected
  - Responsive status: desktop sidebar, mobile/tablet drawer, RTL/LTR drawer direction, 4/2/1 card grid, contained tables
- Super Admin Centers Management
  - Route: `/super-admin/centers`
  - File: `apps/web/src/app/(super-admin)/super-admin/centers/page.tsx`
  - Component: `apps/web/src/features/super-admin/centers/SuperAdminCentersPage.tsx`
  - Status: API-connected list using real PostgreSQL data
  - Fetches real centers from `GET /api/v1/centers`.
  - Shows real center name, owner/admin, type, subscription plan, expiry date, domain, status, and actions.
  - Center type labels are translated from API enums through the active English, Arabic, or Hebrew dictionary.
  - Permission-aware actions are implemented: Add New Center, Edit, Renew Subscription, and Suspend hide when the active platform user lacks the required permission.
  - Search, status filters, and stats now operate on real API rows.
  - Empty, loading, no-results, and safe API-error states are implemented without exposing generic or technical frontend crashes.
  - View actions open `/super-admin/centers/{realCenterId}`.
  - Edit actions open `/super-admin/centers/{realCenterId}?mode=edit` so the real details page loads the real center data.
  - Suspend, Renew Subscription, and Delete are prepared as safe non-mutating action handlers until real endpoints and confirmations are added.
- Super Admin Center Details
  - Route: `/super-admin/centers/[id]`
  - Example: `/super-admin/centers/{realCenterId}`
  - File: `apps/web/src/app/(super-admin)/super-admin/centers/[id]/page.tsx`
  - Component: `apps/web/src/features/super-admin/centers/details/SuperAdminCenterDetailsPage.tsx`
  - Status: API-connected details using real PostgreSQL data
  - Includes center overview, quick actions, admin information, branding/languages, activity timeline, and internal notes.
  - Fetches real details from `GET /api/v1/centers/:centerId`.
  - Shows real center info, owner/admin info, subscription, domain, branding, languages, status, created date, and updated date.
  - Shows the center default language from `Center.primaryLanguage`.
  - Includes a Center Login Access section showing the public-safe center slug and dedicated `/c/[centerSlug]/login` URL with Copy Login Link and Open Login Page actions.
  - Missing legacy slugs are handled with a safe fallback state instead of exposing internal center ids.
  - Permission-aware sections and actions are implemented for Edit Center, Status Actions, Subscription Management, and Internal Notes.
  - Includes Center Staff Users with real API-backed list, add, edit, activate/deactivate, and reset temporary password actions.
  - Staff users are center-scoped tenant users and are not platform admin users.
  - Loading, not-found, and safe API-error states are implemented without falling back to mock data or crashing the page.
  - The old `center-details-data.ts` mock dependency has been removed.
  - Activity timeline entries are derived from real center, subscription, domain, and admin timestamps returned by the API.
  - API responses use safe user and domain selections and do not expose passwords, `passwordHash`, or verification tokens.
- Super Admin Edit Center
  - Route: `/super-admin/centers/{realCenterId}?mode=edit`
  - Status: API-connected edit form using real PostgreSQL data
  - Prefills real center, owner/admin, subscription, and domain fields from `GET /api/v1/centers/:centerId`.
  - Saves changes through `PATCH /api/v1/centers/:centerId`.
  - Includes a Default Language selector for English, Arabic, and Hebrew, saved to `Center.primaryLanguage`.
  - Updating default language also keeps branding language metadata aligned when branding settings exist.
  - Shows saving state and field-level backend validation errors.
- Super Admin Center Internal Notes
  - Route surface: `/super-admin/centers/{realCenterId}` notes section
  - API: `GET /api/v1/centers/:centerId/internal-notes`
  - API: `POST /api/v1/centers/:centerId/internal-notes`
  - Status: API-connected private Super Admin notes using real PostgreSQL data
  - Notes are stored per center, returned newest first, and include safe author info.
  - Normal center details responses do not include internal notes.
- Super Admin Center Status Actions
  - API: `PATCH /api/v1/centers/:centerId/status`
  - Status: API-connected status changes using real PostgreSQL data
  - Supports `ACTIVE`, `SUSPENDED`, and `CANCELLED`; `CANCELLED` is the current deactivate-equivalent status because the schema has no `INACTIVE`.
  - Suspend and deactivate require a reason.
  - Status changes create automatic private internal notes.
  - Center Details quick actions open a reason/confirmation dialog and refresh details plus internal notes after success.
- Super Admin Manual Subscription Management
  - API: `PATCH /api/v1/centers/:centerId/subscription`
  - Status: API-connected manual subscription management using real PostgreSQL data
  - Supports manual plans `BASIC`, `STANDARD`, `PREMIUM`, and `ENTERPRISE`.
  - Supports manual statuses `TRIAL`, `ACTIVE`, `EXPIRED`, `OVERDUE`, and `CANCELLED`.
  - Supports start/end dates, optional next renewal date, and optional billing notes.
  - Center Details includes current subscription data, warning badges, and a manual update modal.
  - No online payment gateway, card, checkout, Stripe, PayPal, or external provider fields are supported.
- Super Admin Subscriptions Management
  - Route: `/super-admin/subscriptions`
  - File: `apps/web/src/app/(super-admin)/super-admin/subscriptions/page.tsx`
  - Component: `apps/web/src/features/super-admin/subscriptions/SuperAdminSubscriptionsPage.tsx`
  - Status: API-connected — loads real subscriptions from `GET /api/v1/super-admin/subscriptions`
  - Supports search by center/owner/plan, status filter (All/Active/Trialing/ExpiringSoon/Expired/Suspended/Cancelled/PastDue), and both `?expiringSoon=true` and `?expired=true` query params.
  - Shows lifecycle computed per row: `daysRemaining`, `isExpiringSoon`, `isExpired`; rows highlighted amber (expiring) or red (expired).
  - "Expiring Soon" banner section shows centers expiring within 7 days.
  - Subscription stat cards computed from live data (active/trialing/expiring/expired/suspended counts).
  - Edit modal opens per row via action menu: supports status, plan name, start/end date, billing notes, notification phone, and notification language.
  - Edit modal calls `PATCH /api/v1/centers/:centerId/subscription`.
  - EN/AR/HE + RTL fully supported.
- Super Admin Subscription Details
  - Route: `/super-admin/subscriptions/[id]`
  - Example: `/super-admin/subscriptions/1`
  - File: `apps/web/src/app/(super-admin)/super-admin/subscriptions/[id]/page.tsx`
  - Component: `apps/web/src/features/super-admin/subscriptions/details/SuperAdminSubscriptionDetailsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes subscription overview, quick actions, payment history, renewal timeline, billing information, internal notes, and translated not-found state.
  - Dynamic mock loading is based on route id:
    - `/super-admin/subscriptions/1` -> Nova Laser Center subscription
    - `/super-admin/subscriptions/2` -> Al Noor Hijama subscription
    - `/super-admin/subscriptions/3` -> Balance Physio subscription
    - `/super-admin/subscriptions/4` -> Glow Beauty Clinic subscription
    - `/super-admin/subscriptions/5` -> Wellness House subscription
- Super Admin Domains Management
  - Route: `/super-admin/domains`
  - File: `apps/web/src/app/(super-admin)/super-admin/domains/page.tsx`
  - Component: `apps/web/src/features/super-admin/domains/SuperAdminDomainsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes summary cards, search/filters, desktop table, mobile cards with actions menu, pending verification, SSL expiry warning, and domain health overview.
  - Uses English, Arabic, and Hebrew dictionaries with shared Super Admin layout.
- Super Admin Domain Details
  - Route: `/super-admin/domains/[id]`
  - Example: `/super-admin/domains/1`
  - File: `apps/web/src/app/(super-admin)/super-admin/domains/[id]/page.tsx`
  - Component: `apps/web/src/features/super-admin/domains/details/SuperAdminDomainDetailsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes domain overview, DNS instructions, verification actions, SSL certificate info, domain activity timeline, internal notes, and translated not-found state.
  - Dynamic mock loading is based on route id:
    - `/super-admin/domains/1` -> Nova Laser Center domain
    - `/super-admin/domains/2` -> Al Noor Hijama subdomain
    - `/super-admin/domains/3` -> Balance Physio domain
    - `/super-admin/domains/4` -> Glow Beauty Clinic domain
    - `/super-admin/domains/5` -> Wellness House domain
- Super Admin Plans Management
  - Route: `/super-admin/plans`
  - File: `apps/web/src/app/(super-admin)/super-admin/plans/page.tsx`
  - Component: `apps/web/src/features/super-admin/plans/SuperAdminPlansPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes summary cards, Add New Plan button, search/filters, plan cards, mobile actions menu, featured plan badges, and plan comparison preview.
  - Uses English, Arabic, and Hebrew dictionaries with shared Super Admin layout.
- Super Admin Plan Details
  - Route: `/super-admin/plans/[id]`
  - Example: `/super-admin/plans/1`
  - File: `apps/web/src/app/(super-admin)/super-admin/plans/[id]/page.tsx`
  - Component: `apps/web/src/features/super-admin/plans/details/SuperAdminPlanDetailsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes plan overview, included features, quick actions, current subscribers, upgrade paths, internal notes, and translated not-found state.
  - Dynamic mock loading is based on route id:
    - `/super-admin/plans/1` -> Trial plan
    - `/super-admin/plans/2` -> Starter plan
    - `/super-admin/plans/3` -> Professional plan
    - `/super-admin/plans/4` -> Enterprise plan
- Super Admin Users Management
  - Route: `/super-admin/users`
  - File: `apps/web/src/app/(super-admin)/super-admin/users/page.tsx`
  - Component: `apps/web/src/features/super-admin/users/SuperAdminUsersPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes summary cards, Add New User action, search/filters, desktop users table, mobile user cards with actions menu, and Roles Preview.
  - Uses English, Arabic, and Hebrew dictionaries with shared Super Admin layout.
  - View links open `/super-admin/users/[id]`.
- Super Admin User Details
  - Route: `/super-admin/users/[id]`
  - Example: `/super-admin/users/1`
  - File: `apps/web/src/app/(super-admin)/super-admin/users/[id]/page.tsx`
  - Component: `apps/web/src/features/super-admin/users/details/SuperAdminUserDetailsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes user overview, permissions summary, quick actions, activity timeline, assigned responsibilities, and internal notes.
  - Dynamic mock loading is based on route id:
    - `/super-admin/users/1` -> Sara Levi
    - `/super-admin/users/2` -> Amir Haddad
    - `/super-admin/users/3` -> Maya Cohen
    - `/super-admin/users/4` -> Dana Nasser
    - `/super-admin/users/5` -> Noam Bar
  - Unknown ids show a translated not-found state instead of falling back to a different user.
- Super Admin Notifications Management
  - Route: `/super-admin/notifications`
  - File: `apps/web/src/app/(super-admin)/super-admin/notifications/page.tsx`
  - Component: `apps/web/src/features/super-admin/notifications/SuperAdminNotificationsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes summary cards, search/filters, desktop notifications table, mobile notification cards, shared action menu, and notification templates preview.
  - Uses English, Arabic, and Hebrew dictionaries with shared Super Admin layout.
  - Mobile row actions use the shared bottom-sheet action menu.
- Super Admin Settings Management
  - Route: `/super-admin/settings`
  - File: `apps/web/src/app/(super-admin)/super-admin/settings/page.tsx`
  - Component: `apps/web/src/features/super-admin/settings/SuperAdminSettingsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes general platform settings, branding, security, notifications, subscription defaults, domain defaults, backup, and system health sections.
  - Uses English, Arabic, and Hebrew dictionaries with shared Super Admin layout.
  - Responsive behavior uses two-column desktop settings panels and stacked mobile sections.
- Super Admin Add New Center Wizard
  - Route: `/super-admin/centers/new`
  - File: `apps/web/src/app/(super-admin)/super-admin/centers/new/page.tsx`
  - Component: `apps/web/src/features/super-admin/centers/new/SuperAdminCenterWizard.tsx`
  - Status: API-connected center creation flow
  - Step 1 Center Basic Info now uses Primary Category plus multi-select Services Offered instead of a single Center Type field.
  - Services Offered supports Laser, Hijama, Physiotherapy, Occupational Therapy, Beauty, Skin Care, Massage, Nutrition, Rehabilitation, and Other with a conditional custom service name field.
  - Step 4 Branding + Languages includes UI-only logo picker/preview, controlled color pickers, default language selector, and enabled language checkboxes.
  - Step 5 Center Admin Account includes controlled admin identity fields, permissions preset, notification/security toggles, account status, and validation UI for email/password match.
  - Step 6 Review + Confirm shows a full responsive summary of all previous wizard sections, including logo preview, selected languages, notification settings, and a final Create Center primary action.
  - Create Center now calls the real API and redirects to `/super-admin/centers` after success.
  - The API creates real `Center`, `BrandingSettings`, `Subscription`, optional `Domain`, center admin `User`, center admin `Role`, and `UserRole` records.

Web i18n foundation started:
- Locale config created at `apps/web/src/i18n/locales.ts`
- Super Admin dashboard dictionary created at `apps/web/src/i18n/dictionaries/super-admin-dashboard.ts`
- Dashboard labels prepared for English, Arabic, and Hebrew

Backend API initialized:
- Location: `services/api`
- NestJS `11.x`
- TypeScript
- REST-ready architecture
- ESLint
- Global API prefix: `api/v1`
- Default port: `3001`
- Health endpoint: `GET /api/v1/health`
- Prepared modules:
  - Auth
  - Users
  - Tenancy
  - Centers
  - Subscriptions
  - Domains
  - Appointments
  - Customers
  - Services
  - Sessions
  - Notifications
  - Permissions
- Tenant context interface prepared with `centerId`
- Shared database module added with Prisma-backed `PrismaService`
- First database-backed Super Admin modules implemented:
  - Centers
  - Users
  - Subscriptions
- Implemented foundation endpoints for listing/viewing/creating centers, users, and subscriptions, plus linking a center admin user through `UserRole.centerId`.
- Implemented center update endpoints at `PATCH /api/v1/centers/:centerId` and `PATCH /api/v1/super-admin/centers/:centerId`.
- Implemented private center internal notes endpoints for Super Admin support notes.
- Implemented center status action endpoint at `PATCH /api/v1/centers/:centerId/status`.
- Implemented manual subscription update endpoint at `PATCH /api/v1/centers/:centerId/subscription`.
- `POST /api/v1/centers` and `POST /api/v1/super-admin/centers` now create a complete initial center setup transaction with validation, branding, subscription, optional domain, and admin assignment.
- Center creation rejects missing or blank admin phone with `400 Bad Request` and `errors.adminPhone`.
- Center creation rejects missing admin name, missing temporary password, invalid admin email, invalid admin phone, and short temporary password with field-specific `400 Bad Request` errors.
- Center creation returns duplicate domain conflicts as `409 Conflict` with `errors.domain`.
- Center admin temporary passwords are hashed server-side with `crypto.scrypt` before writing `User.passwordHash`.
- User API response payloads use safe user selection and do not expose `passwordHash`.

Database package initialized:
- Location: `packages/database`
- Package name: `@royalcare/database`
- Prisma ORM `7.8.0`
- PostgreSQL datasource baseline
- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Migrations folder prepared
- Seeds folder prepared
- TypeScript helpers folder prepared
- Tenant scope helper prepared with `centerId`
- Phase 1 Prisma schema foundation implemented
- Phase 2 Prisma business foundation implemented
- Prisma Client generation now uses `prisma-client-js` for API runtime compatibility
- Core lookup indexes improved for User, Center, and Subscription
- `User.deletedAt` added for future soft-delete-safe lifecycle handling
- Implemented models:
  - User
  - Role
  - Permission
  - UserRole
  - RolePermission
  - Center
  - Subscription
  - Domain
  - Customer
  - Patient
  - Service
  - Appointment
  - Session
  - Notification
  - Dynamic Page
  - Branding Settings
  - Center Internal Note
  - Invoice
  - Payment
Deferred models:
  - Online Payment gateway/provider integration
  - Medical diagnosis details
  - Staff scheduling
  - File Asset
  - Audit Log
  - Dedicated Page Block

## 2. Implementation Status

Application code:
- First RoyalCare Super Admin UI screens exist.
- The Add New Center flow has the first real frontend-to-backend persistence integration.

Frontend:
- Next.js app scaffolded at `apps/web`
- Super Admin login page built at `/super-admin/login`
- Super Admin dashboard page built at `/super-admin/dashboard`
- Super Admin dashboard responsive behavior improved for desktop, tablet, and mobile
- Super Admin centers management page built at `/super-admin/centers`
- Super Admin center details page built at `/super-admin/centers/[id]`
- Super Admin subscriptions management page built at `/super-admin/subscriptions`
- Super Admin subscription details page built at `/super-admin/subscriptions/[id]`
- Super Admin domains management page built at `/super-admin/domains`
- Super Admin domain details page built at `/super-admin/domains/[id]`
- Super Admin plans management page built at `/super-admin/plans`
- Super Admin plan details page built at `/super-admin/plans/[id]`
- Super Admin users management page built at `/super-admin/users`
- Super Admin user details page built at `/super-admin/users/[id]`
- Super Admin notifications management page built at `/super-admin/notifications`
- Super Admin settings management page built at `/super-admin/settings`
- Super Admin Add New Center wizard built at `/super-admin/centers/new`
- Add New Center wizard Step 1 now supports a single Primary Category and multiple Services Offered for multi-service centers.
- Add New Center wizard Step 4 Branding + Languages improved with controlled logo preview, colors, default language, and enabled languages.
- Add New Center wizard Step 5 Center Admin Account built with controlled fields, validation UI, permission presets, account status, and notification/security toggles.
- Add New Center wizard Step 6 Review + Confirm built with controlled state summary, translated warning box, and final Create Center action.
- Add New Center wizard Step 6 Create Center action connected to real API persistence.
- Add New Center wizard submit validation now shows exact missing/invalid fields before blocking a request.
- Add New Center wizard now requires Center Admin mobile number and shows a field-level `adminPhone` validation error before a request is sent.
- Add New Center wizard no longer logs full submit payloads or temporary passwords in the browser console.
- Add New Center wizard now blocks missing admin name, missing temporary password, invalid phone, and short password before request submission.
- Add New Center success navigation now uses `router.push("/super-admin/centers")` without an immediate `router.refresh()` to avoid App Router update loops.
- Global language persistence now avoids redundant state, document, localStorage, and cookie writes when the selected locale is unchanged.
- Super Admin Centers Management now uses API-backed centers only, with no mock row fallback for the live list.
- Super Admin Centers Management row actions now use real center ids for View/Edit and action menu state.
- Super Admin Center Details now uses real center records by route id only, with no mock fallback.
- Future mobile folder prepared at `apps/mobile`

Backend:
- NestJS app scaffolded at `services/api`
- Shared Prisma database service added
- Super Admin Centers, Users, and Subscriptions modules have controller/service/DTO structure
- First real database-backed foundation endpoints implemented
- Center creation endpoint now creates related branding, subscription, optional domain, admin user, admin role, and role assignment records in one transaction
- Center creation hashes any provided admin temporary password before saving it.
- Centers and Users API responses now exclude `passwordHash` through the shared safe user projection.
- Center update responses use the shared safe user projection and do not expose passwords, password hashes, tokens, secrets, or auth-adjacent user metadata.
- Center update accepts `primaryLanguage` for Super Admin default-language edits and keeps `BrandingSettings.defaultLanguage` aligned when present.
- Center internal note responses use the shared safe user projection for authors and do not expose passwords, password hashes, tokens, secrets, or auth-adjacent user metadata.
- Center status action responses use the shared safe center/user/domain projections and do not expose passwords, password hashes, tokens, secrets, or auth-adjacent user metadata.
- Manual subscription responses use safe center/subscription projections and do not expose auth-sensitive fields or payment-provider fields.
- API Prisma connection now explicitly loads the Docker PostgreSQL URL from `services/api/.env` first and rejects stale credentials.
- Local development expects the API to serve port `3001`; the web dev script now uses port `3002` to avoid API/web port collisions.
- Auth, permission guards, request tenant context, and production security enforcement are still pending

Database:
- Prisma schema baseline created
- Phase 1 and Phase 2 foundation models created
- Core User, Center, and Subscription schema reviewed and improved for Super Admin API readiness
- Migrations not created yet
- Migration folder prepared at `packages/database/prisma/migrations`

Authentication:
- Not implemented

Permissions:
- Platform RBAC foundation implemented for Super Admin workflows.
- Implemented roles: Super Admin, Platform Admin, Finance Admin, Support Admin, Read Only Admin.
- Implemented granular permissions include `view:centers`, `create:centers`, `edit:centers`, `suspend:centers`, `manage:subscriptions`, `view:internal_notes`, `manage:internal_notes`, `view:users`, `manage:users`, `manage:plans`, and `view:reports`.
- Permission guards currently protect implemented Centers and Super Admin Users endpoints.
- Full authentication is still pending; development requests can use `x-royalcare-super-admin-user-id`.
- Center Staff Users in Super Admin Center Details use platform permissions `view:users` and `manage:users`, while actual staff membership is tenant-scoped through `UserRole.centerId`.

Tenant isolation:
- Designed conceptually using `centerId`
- Not implemented

Deployment:
- Not configured

## 3. Confirmed Direction

Confirmed by project initialization request:
- Project name: RoyalCare
- Product type: Multi-tenant SaaS
- Target industries: laser, physiotherapy, hijama, beauty, wellness
- System levels: Super Admin, Center Owner Admin Panel, Customer Portal
- Frontend Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Future Mobile: React Native Expo
- Multi-language: Arabic, Hebrew, English
- RTL-friendly requirement
- Tenant isolation using `centerId`
- Simple practical admin UI
- Strong permissions system
- Backup system needed

## 4. Major Needs Confirmation

Business:
- MVP scope
- Launch deadline
- Pricing/plans
- Trial rules
- Manual/direct billing workflow details
- Online payments remain out of scope unless explicitly approved later
- Country/legal compliance requirements

Technical:
- Package manager
- Monorepo tooling
- Hosting provider
- Authentication strategy
- File storage provider
- Email/SMS/WhatsApp providers
- Backup frequency and retention

Product:
- Customer portal v1 scope
- Appointment booking rules
- Session fields per industry
- Page builder complexity
- Domain automation workflow
- Required templates for first release

## 5. Recommended Immediate Next Step

Before writing application code, confirm MVP scope and infrastructure choices.

Recommended first technical implementation:
1. Confirm local/hosted PostgreSQL environment.
2. Create the first Prisma migration when the PostgreSQL environment is confirmed.
3. Add seed data for platform roles and permissions.
4. Implement auth, tenancy guard, and permissions guard early.
5. Add validation pipes and OpenAPI docs for the new backend modules.

## 7. Verification

Latest verification:
- Appointment overlap API response now includes `conflictDetails` with `patientName`, `serviceNameEn/Ar/He`, `providerName`, `appointmentDate`, `startTime`, `endTime`.
- `AppointmentConflictAlert` component renders red bordered alert box with warning icon, labeled detail grid, and localized call-to-action message.
- Conflict alert uses `rtl:flex-row-reverse` for correct icon placement in Arabic and Hebrew RTL layouts.
- Conflict alert is fully translated in EN, AR, and HE using dictionary keys `conflictTitle`, `conflictMessage`, `conflictPatient`, `conflictService`, `conflictProvider`, `conflictDate`, `conflictStart`, `conflictEnd`.
- `npm run lint` passed in `apps/web` and `services/api` after conflict alert implementation.
- `npm run build` passed in `services/api` after conflict alert implementation.
- `npm run build` passed in `apps/web` after conflict alert implementation; all `/tenant/appointments*` routes compiled.
- Pre-existing `TenantServiceFormPage` build error fixed by adding `durationUnitMinutes` and `durationUnitHours` to EN, AR, and HE service dictionaries.
- Tenant Patients Search source audit confirmed typing filters locally without submitted query state, Search button, Enter key, or API requests per keystroke.
- Tenant Patients Search source audit confirmed name/phone matching uses trimmed, case-insensitive partial matching and phone separator normalization.
- Tenant Patients Search source audit confirmed localized no-results messages exist for English, Arabic, and Hebrew.
- Tenant Patients success notices auto-hide after 4 seconds on list and details screens.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after the Patients Search UX fix.
- Tenant Patients Management created a patient through `POST /api/v1/patients` and the response center matched the authenticated center session.
- Duplicate patient phone inside the same center returned `409 errors.phone`.
- The same patient phone in a different center was allowed.
- Invalid patient phone returned `400 errors.phone`.
- Blank patient name on update returned `400 errors.fullName`.
- Patient edit persisted via `PATCH /api/v1/patients/:patientId`.
- Patient archive persisted via `PATCH /api/v1/patients/:patientId/status`.
- Invalid patient status returned `400 errors.status`.
- Patient search by name/phone returned the updated patient.
- Patient refresh/list after archive returned the persisted archived patient.
- Cross-center patient details access returned `404`, confirming tenant isolation.
- Patient list/detail/create responses contained no `password`, `passwordHash`, token, secret, verification timestamps, last-login, or deleted metadata fields.
- English, Arabic, and Hebrew patient labels, statuses, genders, form text, empty/loading states, and errors exist in the tenant dashboard dictionary.
- Built `/dashboard/patients` route checks confirmed EN renders `lang="en" dir="ltr"` while AR/HE render `lang="ar|he" dir="rtl"`.
- `npm.cmd run db:format`, `npm.cmd run db:validate`, `npm.cmd run db:generate`, `npx.cmd prisma db push`, and `npm.cmd run typecheck` passed in `packages/database` after adding patients.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after adding Patients API.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after adding Patients UI.
- Tenant Services Management created a service through `POST /api/v1/tenant/services` and the response belonged to the authenticated center session.
- Tenant Services list and details returned the created service through `GET /api/v1/tenant/services` and `GET /api/v1/tenant/services/:serviceId`.
- Tenant Services update persisted through `PATCH /api/v1/tenant/services/:serviceId`.
- Tenant Services archive and activate persisted through `PATCH /api/v1/tenant/services/:serviceId/status`.
- Tenant Services invalid name returned `400 errors.nameEn`.
- Tenant Services invalid duration returned `400 errors.durationMinutes`.
- Tenant Services invalid currency returned `400 errors.currency`.
- Tenant Services staff create attempt returned `403 errors.permission` for missing `services.create`.
- Tenant Services staff archive attempt returned `403 errors.permission` for missing `services.archive`.
- Cross-center Tenant Services details access returned `404`, confirming tenant isolation.
- Tenant Services list/detail/create/update/status responses contained no `password`, `passwordHash`, token, secret, verification timestamps, last-login, or deleted metadata fields.
- Existing Patients API still returned `200` after Services changes.
- Built `/tenant/services`, `/tenant/services/new`, `/tenant/services/:id`, `/tenant/services/:id/edit`, and `/tenant/patients` routes returned `200`.
- Built `/tenant/services` route checks confirmed EN renders `lang="en" dir="ltr"` while AR/HE render `lang="ar|he" dir="rtl"`.
- `npm.cmd run db:format`, `npm.cmd run db:validate`, `npm.cmd run db:generate`, `npx.cmd prisma db push`, and `npm.cmd run typecheck` passed in `packages/database` after adding tenant services.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after adding Tenant Services API.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after adding Tenant Services UI.
- Tenant Dashboard Shell source audit found no hardcoded English sidebar/dashboard labels in the component.
- Tenant Dashboard Shell uses dictionary translations for sidebar items, dashboard title/subtitle, summary cards, current user labels, role labels, center status labels, loading text, and logout.
- Tenant Dashboard Shell has localized role labels for `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF`.
- Tenant Dashboard Shell has localized center status labels for `TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`, and `ARCHIVED`.
- Tenant Dashboard Shell RTL source check confirmed Arabic/Hebrew use `dir="rtl"` and right-side desktop/mobile navigation behavior.
- Built `/dashboard` route checks confirmed EN renders `lang="en" dir="ltr"` while AR/HE render `lang="ar|he" dir="rtl"`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after Tenant Dashboard Shell i18n/RTL fixes.
- Center staff reset password returned a generated temporary password for Super Admin operations.
- The generated temporary password worked for tenant login.
- Direct database inspection confirmed the stored staff password value is a scrypt hash and not the temporary password plaintext.
- Center Staff Reset Password UI now confirms before reset and shows the generated temporary password in a modal with Copy and Close actions.
- `POST /api/v1/auth/center/login` valid center staff login returned `201`.
- Invalid tenant password returned `401`.
- Inactive center staff user login returned `401`.
- `GET /api/v1/auth/center/me` returned `200` after login and matched the assigned center id.
- `POST /api/v1/auth/center/logout` returned `201`; `/me` returned `401` afterward.
- Wrong-center staff update attempt returned `404`, confirming staff cannot be managed through another center route.
- Tenant auth login and session responses contained no `password`, `passwordHash`, token, secret, email verification, phone verification, last login, or deleted metadata fields.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after tenant auth.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after tenant login/dashboard shell.
- `POST /api/v1/centers/:centerId/staff` created a center-scoped staff user.
- Staff duplicate email returned `409 errors.email`.
- Staff duplicate phone returned `409 errors.phone`.
- Staff invalid email returned `400 errors.email`.
- Staff invalid phone returned `400 errors.phone`.
- Staff invalid role returned `400 errors.role`.
- Staff invalid status returned `400 errors.status`.
- `PATCH /api/v1/centers/:centerId/staff/:userId` updated staff details and role.
- Staff deactivate/activate status actions persisted `INACTIVE` and `ACTIVE`.
- Staff reset temporary password returned `resetComplete: true` and did not expose `password`, `passwordHash`, token, secret, or auth metadata fields.
- Cross-center staff list did not include staff from another center, and cross-center staff update returned `404`.
- Missing center staff route returned `404`.
- English, Arabic, and Hebrew staff labels exist in the Center Details dictionary.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after Center Staff Users Management.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after Center Staff Users Management.
- Super Admin platform RBAC seeded 11 permissions and 5 roles.
- `GET /api/v1/permissions/me` returned the fallback local Super Admin with all implemented permissions.
- Finance Admin could update manual subscriptions and received `403` for center status changes.
- Support Admin could create center internal notes and received `403` for manual subscription updates.
- Read Only Admin could list centers and received `403` for center update and internal-note access.
- Centers list/details responses after RBAC changes contained no `password`, `passwordHash`, `token`, `secret`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, or `deletedAt`.
- Source audit confirmed Centers List and Center Details gate actions/sections by matching platform permission keys.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after platform RBAC.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after permission-aware Centers UI.
- `PATCH /api/v1/centers/:centerId/subscription` valid update returned `200` and persisted manual plan/status/dates/billing notes.
- Manual subscription invalid plan returned `400 errors.subscriptionPlan`.
- Manual subscription invalid status returned `400 errors.subscriptionStatus`.
- Manual subscription end date before start date returned `400 errors.subscriptionDates`.
- Manual expired subscription update persisted `EXPIRED` and past end date for warning display.
- Centers list and Center Details reflected manual subscription updates.
- Manual subscription changes created automatic private internal notes.
- Manual subscription responses contained no `password`, `passwordHash`, `token`, `secret`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, `deletedAt`, Stripe, PayPal, checkout, card, or external provider fields.
- `npm.cmd run db:format`, `npm.cmd run db:validate`, `npm.cmd run db:generate`, `npx.cmd prisma db push`, and `npm.cmd run typecheck` passed in `packages/database` after manual subscription management.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after manual subscription management.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after manual subscription management.
- `PATCH /api/v1/centers/:centerId/status` activate returned `200` and persisted `ACTIVE`.
- Suspend without reason returned `400 errors.reason`.
- Suspend with reason returned `200` and persisted `SUSPENDED`.
- Deactivate through `CANCELLED` returned `200` and persisted `CANCELLED`.
- Invalid `INACTIVE` status returned `400 errors.status`.
- Invalid center id returned `404 Center not found`.
- Centers list and Center Details reflected the updated status after refresh.
- Status changes created automatic private internal notes newest first.
- Status action responses contained no `password`, `passwordHash`, `token`, `secret`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, or `deletedAt`.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after adding Center Status Actions.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after adding Center Status Actions.
- `POST /api/v1/centers/:centerId/internal-notes` created private internal notes in PostgreSQL.
- `GET /api/v1/centers/:centerId/internal-notes` returned persisted notes newest first.
- Empty internal note creation returned `400 errors.note`.
- Internal notes for missing and malformed center ids returned `404 Center not found`.
- Normal `GET /api/v1/centers/:centerId` did not expose internal notes.
- Internal note responses contained safe author fields only and no `password`, `passwordHash`, `token`, `secret`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, or `deletedAt`.
- `npm.cmd run db:format`, `npm.cmd run db:validate`, `npm.cmd run db:generate`, `npx.cmd prisma db push`, and `npm.cmd run typecheck` passed in `packages/database` after adding Center Internal Notes.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after adding Center Internal Notes.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after adding Center Internal Notes.
- `PATCH /api/v1/centers/:centerId` valid update returned `200`, changed a real PostgreSQL center, and list/details reflected the updated center name, owner/admin email, owner/admin phone, domain, and subscription plan.
- Edit Center invalid email returned `400 errors.adminEmail`.
- Edit Center invalid phone returned `400 errors.adminPhone`.
- Edit Center duplicate email returned `409 errors.adminEmail`.
- Edit Center duplicate phone returned `409 errors.adminPhone`.
- Edit Center duplicate domain returned `409 errors.domain`.
- Edit Center blank center name returned `400 errors.centerName`.
- Edit Center missing and malformed ids returned `404 Center not found`.
- Edit Center list/detail/update responses contained no `password`, `passwordHash`, `token`, `secret`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, or `deletedAt`.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after implementing Edit Center.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after implementing Edit Center.
- `GET /api/v1/centers/:centerId` returned three different real PostgreSQL centers with matching IDs, names, owners, domains, and plans after removing the old Center Details mock dependency.
- `GET /api/v1/centers/not-a-real-center-id` returned a clean `404 Center not found` instead of a `500`.
- Serialized center list and detail responses did not include `passwordHash`, password fields, or token fields after safe domain selection.
- Source search found no remaining `center-details-data` or `centerDetailsById` usage in the Centers details flow.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after finalizing Center Details real-data integration.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after finalizing Center Details real-data integration.
- Valid create returned `201` after QA validation fixes.
- Missing admin name returned `400 errors.adminName`.
- Missing password returned `400 errors.temporaryPassword`.
- Invalid email returned `400 errors.adminEmail`.
- Invalid phone returned `400 errors.adminPhone`.
- Short password returned `400 errors.temporaryPassword`.
- Duplicate domain returned `409 errors.domain`.
- Missing center name returned `400 errors.centerName`.
- API responses did not include `passwordHash` or plaintext `TemporaryPassword123!`.
- Source search found no remaining `console.*`, `RoyalCare submit debug`, or full payload logging in the Create Center frontend API path.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api` after QA validation fixes.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after QA validation fixes.
- `POST /api/v1/centers` without `admin.phone` returned `400` with `errors.adminPhone`.
- `POST /api/v1/centers` with a unique admin phone returned `201` and created center `c382aa07-be04-444e-9618-29ba417ec2c8`.
- Duplicate phone POST still returned `409` with `errors.adminPhone`.
- The successful create response did not contain `passwordHash`.
- `npm.cmd run build` passed in `apps/web` outside the sandbox after requiring admin phone.
- `npm.cmd run lint` passed in `apps/web` after requiring admin phone.
- `npx.cmd tsc --noEmit` passed in `apps/web` after requiring admin phone.
- `npm.cmd run build` passed in `services/api` after requiring admin phone.
- `npm.cmd run lint` passed in `services/api` after requiring admin phone.
- `npm.cmd run build` passed in `apps/web` outside the sandbox after connecting Center Details to real data.
- `npm.cmd run lint` passed in `apps/web` after connecting Center Details to real data.
- `npx.cmd tsc --noEmit` passed in `apps/web` after connecting Center Details to real data.
- `npm.cmd run build` passed in `services/api` after confirming the existing center details endpoint.
- `npm.cmd run lint` passed in `services/api` after confirming the existing center details endpoint.
- Live API probe against the built NestJS API returned three real centers from `GET /api/v1/centers?pageSize=3`.
- `GET /api/v1/centers/3f30ab62-a797-4692-8797-548b9a0750d5` returned matching center `hammam` and the serialized response did not contain `passwordHash`.
- Detail probes for three different centers returned three matching, different records: `hammam`, `مركز سيرين`, and `Validation Success Test 1777319664`.
- `hashPassword("TemporaryPassword123!")` returned an `scrypt$...` hash that does not equal the plaintext password.
- Source audit found no remaining `owner: true`, `user: true`, or user response include paths that can return `passwordHash`.
- `npm.cmd run build` passed in `services/api` after password security hardening.
- `npm.cmd run lint` passed in `services/api` after password security hardening.
- `npm.cmd run lint` passed in `apps/web` after password action UI updates.
- `npx.cmd tsc --noEmit` passed in `apps/web` after password action UI updates.
- `GET /api/v1/centers?pageSize=5` returned real PostgreSQL center rows, including `8c54075c-0e2c-4ed5-8ce1-77dc109b749b` and `e809f844-574a-4b1e-8057-d07f040e2ad3`.
- `GET /api/v1/centers/e809f844-574a-4b1e-8057-d07f040e2ad3` returned the matching real center details.
- `npm.cmd run lint` passed in `apps/web` after hardening the Centers Management real-list behavior.
- `npx.cmd tsc --noEmit` passed in `apps/web` after hardening the Centers Management real-list behavior.
- `GET /api/v1/centers?pageSize=5` returned real PostgreSQL center rows.
- `GET /api/v1/centers/2f0dd844-e04d-4d41-80a6-60cbbf9b8e03` returned the matching real center.
- `npm.cmd run lint` passed in `apps/web` after connecting Centers Management to real list data.
- `npx.cmd tsc --noEmit` passed in `apps/web` after connecting Centers Management to real list data.
- `POST /api/v1/centers` succeeded against Docker PostgreSQL after the API database URL fix and created center id `cc7674a3-656e-4a01-a37f-9975b38dee96`.
- `npm.cmd run build` passed in `services/api` after the API database URL fix.
- `npm.cmd run lint` passed in `services/api` after the API database URL fix.
- `npm.cmd run lint` passed in `apps/web` after the React loop fix.
- `npx.cmd tsc --noEmit` passed in `apps/web` after the React loop fix.
- `npm.cmd run build` in `apps/web` compiled successfully, then failed during the Next.js TypeScript phase with Windows `spawn EPERM`.
- `npm.cmd run dev` and `npx.cmd next dev --webpack` failed before serving with Windows `spawn EPERM`.
- `npm.cmd run lint` passed in `apps/web` after Create Center submit debugging.
- `npx.cmd tsc --noEmit` passed in `apps/web` after Create Center submit debugging.
- `npm.cmd run build` passed in `services/api`.
- `npm.cmd run lint` passed in `services/api`.
- `npm.cmd test -- --runInBand` passed in `services/api`.
- `npm.cmd run lint` passed in `apps/web`.
- `npx.cmd tsc --noEmit` passed in `apps/web`.
- `npm.cmd run db:validate` passed in `packages/database`.
- `npm.cmd run build` in `apps/web` compiled successfully, then failed during the Next.js TypeScript phase with Windows `spawn EPERM`; direct TypeScript and ESLint checks passed.
- `npm run db:generate` passed in `packages/database`.
- `npm run typecheck` passed in `packages/database`.
- `npm run lint` passed in `services/api`.
- `npm run build` passed in `services/api`.
- `npm test -- --runInBand` passed in `services/api`.
- `npm run test:e2e` passed in `services/api`.
- `npm run lint` passed in `apps/web`.
- `npm run build` passed in `apps/web`.
- `/super-admin/notifications` returned `200 OK` on the built Next.js server.
- Production checks confirmed `/super-admin/notifications` renders the expected `lang` and `dir` values for `royalcare_locale=ar`, `royalcare_locale=he`, and `royalcare_locale=en`.
- `/super-admin/settings` returned `200 OK` on the built Next.js server.
- Production checks confirmed `/super-admin/settings` renders the expected `lang` and `dir` values for `royalcare_locale=ar`, `royalcare_locale=he`, and `royalcare_locale=en`.
- `/super-admin/users/1`, `/super-admin/users/2`, `/super-admin/users/3`, and `/super-admin/users/999` returned `200 OK` on the local Next.js dev server.
- Dynamic checks confirmed `/super-admin/users/1` shows Sara Levi, `/super-admin/users/2` shows Amir Haddad, `/super-admin/users/3` shows Maya Cohen, and `/super-admin/users/999` shows the not-found state.
- Production route checks confirmed `royalcare_locale=ar` renders `<html lang="ar" dir="rtl">`, `royalcare_locale=he` renders `<html lang="he" dir="rtl">`, and `royalcare_locale=en` renders `<html lang="en" dir="ltr">`.
- `/super-admin/dashboard` returned `200 OK` on the local Next.js dev server.
- `/super-admin/login` returned `200 OK` on the local Next.js dev server.
- `/super-admin/centers/new` returned `200 OK` on the local Next.js dev server.
- `npm run lint` passed in `services/api`.
- `npm run build` passed in `services/api`.
- `npm test` passed in `services/api`.
- `npm run test:e2e` passed in `services/api`.
- `npm run db:validate` passed in `packages/database`.
- `npm run typecheck` passed in `packages/database`.
- `npm run db:format` passed in `packages/database`.
- Centers Module i18n/RTL/date/responsive audit fixes completed for Centers List and Center Details flows.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web` after the Centers i18n/RTL audit fixes.
- SSR route checks confirmed Centers List renders EN as LTR and AR/HE as RTL, and Center Details edit route preserves AR RTL.

- Tenant Billing module: `InvoiceStatus` enum and `Invoice` model added to Prisma schema; `prisma db push` synced schema to the database; `prisma generate` regenerated the client.
- `BillingModule` registered in `app.module.ts`; API rebuild confirmed 5 new routes: `GET /api/v1/tenant/billing`, `GET /api/v1/tenant/billing/options`, `POST /api/v1/tenant/billing`, `GET /api/v1/tenant/billing/:invoiceId`, `PATCH /api/v1/tenant/billing/:invoiceId/status`.
- `GET /api/v1/tenant/billing/options` returned `401` (auth required = route alive).
- Frontend billing pages compiled: `/tenant/billing`, `/tenant/billing/[id]`, `/tenant/billing/new`.
- `npm run build` passed in `services/api` after billing module.
- `npm run lint` passed in `services/api` after billing module.
- `npx tsc --noEmit` passed in `apps/web` after billing pages (3 lint fixes applied: removed unused `router`, removed unused `_session`, removed synchronous `setIsLoading(true)` from effect body).
- `npm run lint` passed in `apps/web` after billing pages.
- `npm run build` passed in `apps/web` after billing pages.
- Tenant Payments module: `PARTIAL` added to `InvoiceStatus` enum; `PaymentMethod` enum (CASH, BANK_TRANSFER, CHECK, OTHER) and `Payment` model added to Prisma schema with back-relations on Invoice, User, Center, Patient; `prisma db push` applied with `--accept-data-loss`; `prisma generate` regenerated the client.
- `TenantPaymentService` added with `create()` (overpayment check, `$transaction` atomic payment+status update, no-CANCELLED-invoice guard) and `list()` (aggregate totals).
- Billing controller updated with `POST /api/v1/tenant/billing/:invoiceId/payments` and `GET /api/v1/tenant/billing/:invoiceId/payments`; `TenantPaymentService` registered in `BillingModule`.
- Reopen Invoice (CANCELLED→PENDING) backend: status machine extended to allow CANCELLED→PENDING; recalculates final status from payment aggregate when reopening.
- Frontend: `TenantInvoiceDetailsPage` rebuilt with payment summary bar (invoiceTotal/paidAmount/balanceDue), Add Payment form (amount, method, date, notes), and payment history table; form hidden when invoice is PAID or CANCELLED.
- Frontend: `TenantBillingPage` updated with PARTIAL status badge (indigo) in card and filter dropdown; PARTIAL invoices allow Mark as Paid and Cancel actions.
- i18n: `billingStatuses` extended with PARTIAL in EN/AR/HE; 16 payment keys added to `billing` section in EN/AR/HE.
- Frontend API client updated with `TenantPayment`, `PaymentSummary`, `CreatePaymentPayload`, `CreatePaymentResult` types and `listTenantPayments()`, `createTenantPayment()` functions.
- `billing-permissions.ts` updated with `hasPaymentPermission()` and `paymentRolePermissions` matrix.
- `npm run build` passed clean in `services/api` after payments module.
- `npx tsc --noEmit` and `npm run build` passed clean in `apps/web` after payments UI.
- Server restarted; `GET /api/v1/tenant/billing/:invoiceId/payments` returned `401` confirming routes registered.

- Patient Credit System implemented (2026-05-02):
  - Prisma schema: `Patient.creditBalance Decimal @default(0)` and new `CreditTransaction` model with `CREDIT_ADD`/`CREDIT_USE` types and `OVERPAYMENT`/`MANUAL`/`ADJUSTMENT` sources; `prisma db push` applied.
  - `TenantPaymentService.create()` updated: splits overpayment into credit, creates `CREDIT_ADD` `OVERPAYMENT` transaction, increments `Patient.creditBalance` atomically.
  - `TenantPaymentService.list()` updated: returns `creditUsages` array and `patientCreditBalance` in `PaymentSummary`.
  - `TenantCreditService` implemented: `useCredit()` applies patient credit to invoice, caps at min(balance, balanceDue), creates `CREDIT_USE` transaction, decrements `Patient.creditBalance`, recalculates invoice status.
  - `PatientCreditService` implemented: `addManualCredit()` adds manual credit with mandatory reason, creates `CREDIT_ADD` `MANUAL` transaction, increments `Patient.creditBalance`.
  - `POST /api/v1/tenant/billing/:invoiceId/use-credit` wired in `TenantBillingController` with `TenantCreditService`.
  - `POST /api/v1/patients/:patientId/credit` wired in `PatientsController` with `PatientCreditService`.
  - Both services registered in `BillingModule` and `CustomersModule` respectively.
  - Frontend API client: `UseCreditPayload`, `UseCreditResult`, `TenantCreditTransaction` types + `useTenantCredit()` function added to `tenant-billing.ts`.
  - `PaymentSummary` updated with `creditUsages: TenantCreditTransaction[]` and `patientCreditBalance: string`.
  - `billing-permissions.ts` updated with `canAddManualCredit()` helper.
  - i18n: 12 credit keys added to EN, AR, and HE `billing` sections (creditBalance, useCredit, creditAmount, creditApplied, noCreditAvailable, insufficientCredit, creditAdded, overpaymentCreditNotice, creditSourceOverpayment, creditSourceManual, creditSourceAdjustment, creditUsageLabel).
  - `TenantInvoiceDetailsPage` updated: summary bar now shows 4 cards (invoiceTotal, paidAmount, balanceDue, creditBalance in indigo); overpayment success notice shows combined paymentAdded + overpaymentCreditNotice message; "Use Credit" form section (indigo, shows only when canCreatePayment + invoice not PAID/CANCELLED + credit > 0); credit usage history sub-table in payment history section.
  - `npx tsc --noEmit` passed in `apps/web` with zero errors after credit system implementation.
  - `tsc --noEmit` passed in `services/api` with zero errors after credit system implementation.

## 6. Risk Notes

Important risks:
- Tenant isolation mistakes can expose customer data between centers.
- RTL support is much harder if added late.
- Subscription/module checks must be backend-enforced, not only hidden in UI.
- Page builder scope can grow too large if not constrained.
- Appointment rules can become complex quickly if staff availability, recurring sessions, and cancellation policies are all included at once.

## 7. Latest RBAC Fix - 2026-05-05

Tenant center RBAC now uses canonical colon permission keys across role storage, session responses, backend service checks, and frontend action gates.

Current tenant permission key list:
- `patients:view`, `patients:create`, `patients:update`, `patients:status`
- `appointments:view`, `appointments:create`, `appointments:update`, `appointments:cancel`, `appointments:status`
- `services:view`, `services:create`, `services:update`, `services:archive`, `services:status`
- `billing:view`, `billing:create`, `billing:update`, `billing:cancel`
- `payments:view`, `payments:create`
- `reports:view`
- `settings:view`
- `permissions:view`, `permissions:update`
- `staff:view`, `staff:create`, `staff:update`, `staff:status`

Notes:
- Legacy dot keys are normalized on read for compatibility with existing database rows.
- New role permission saves use colon keys.
- Tenant appointments/services/staff/billing/payments permission checks now receive `session.permissions` rather than `session.role.key`.
- `/auth/center/me` returns normalized tenant permissions.
- `/permissions/me` returns tenant permissions when a tenant center session cookie is present, and remains compatible with Super Admin platform permission lookup.
- QA commands passed: API lint, API build, web lint, web `tsc --noEmit`, and web build.
- Follow-up tenant RBAC audit aligned sidebar visibility, permission-label saves, patient/report/role-permission backend checks, and frontend action gates to the canonical module/action keys.
- Tenant frontend permission source is `GET /api/v1/permissions/me`; direct page access without the required permission renders translated Access Denied content in EN/AR/HE.
- Tenant regression QA pass on 2026-05-05 fixed the profile access gate so profile remains available to every authenticated center user even when `settings:view` is not assigned.
- Latest QA commands passed: API lint, API build, API unit tests, web lint, web `tsc --noEmit`, and web build.
- Local route smoke checks confirmed tenant sidebar pages render from the Next.js server and tenant API routes are registered/auth-gated instead of returning `500`.
- Tenant dashboard counters now load from `GET /api/v1/tenant/dashboard/stats` and count real same-center patients, appointments, services, and staff assignments instead of hardcoded zero placeholders.
- Tenant dashboard now includes useful operational sections: Today Activity, Recent Activity, Quick Actions, Revenue Snapshot, and Alerts, with EN/AR/HE labels and responsive grids.
- Super Admin Centers Management now has a strict `/api/v1/admin/centers` API surface and `/admin/centers` UI pages for listing centers, viewing center users, and activating/suspending centers.
- Super Admin can now use "Login as Center Admin" from `/admin/centers` or center details; it creates the standard tenant center session and redirects to `/tenant/dashboard`.
- The Super Admin login-as button client now resolves the Super Admin header from `/permissions/me` if local storage has not been seeded by a real Super Admin login flow yet.
- Super Admin center actions are visible without relying on tenant permission state; backend platform checks remain authoritative.
- Super Admin login-as now cleanly handles centers without an active owner/manager using `409 NO_ACTIVE_CENTER_MANAGER` and localized Add Center Manager guidance.
- `/admin/centers/:centerId` now includes a functional Add Center Manager modal that creates or assigns an active `CENTER_MANAGER` and re-enables login-as after success.
- Global web date display now uses the shared `formatDate()` helper with numeric-only output: `DD/MM/YYYY` for dates and `DD/MM/YYYY HH:mm` for values that include time. Month names are no longer used in EN/AR/HE date rendering.
- Super Admin Users Management is now API-backed: `/super-admin/users` uses real users, filters, counters, create/edit/status/reset actions, and `/super-admin/users/[id]` shows real user details with platform and center role assignments.
- Super Admin Audit Logs now persist rows for user create/update/status changes, password reset, center-role assignment, Add Center Manager, and login-as center admin. `AuditLog.actorUserId` is nullable so expected logs are not dropped when the actor header is unavailable; unresolved supplied IDs are retained in metadata.
- Super Admin Audit Logs filters distinguish actor and target users: actor filters show who performed actions, and target filters show who was affected by actions.
- Super Admin center status changes now write `CENTER_STATUS_CHANGED` audit rows with old/new status, center snapshot, and actor snapshot metadata.
- Super Admin user status changes now write `USER_STATUS_CHANGED` audit rows with old/new status plus actor and target snapshots.
- Tenant staff and Super Admin center-details staff activate/deactivate actions now write Super Admin-visible `STAFF_STATUS_CHANGED` audit rows with old/new status, actor name, target staff name/email, center name, and source metadata.
- Tenant staff status changes made during Super Admin login-as still store impersonation metadata while using the canonical `STAFF_STATUS_CHANGED` action.
- Critical Super Admin user edits and password resets now write service-level `USER_UPDATED` and `PASSWORD_RESET` audit rows with actor and target snapshots.
- Audit Logs list responses expose readable display fields for staff status changes, including Arabic status text such as `تم تغيير حالة الموظف إلى غير نشط` and fallback `غير محدد` when a display name is unavailable.
- Super Admin center-details staff password resets now write `STAFF_PASSWORD_RESET` audit rows with actor, target staff, center, and source metadata; audit metadata never stores temporary passwords or password hashes.
- Super Admin Audit Logs now render as responsive timeline cards and `GET /api/v1/super-admin/audit-logs` returns timeline-ready fields (`actionLabel`, actor/target/center display names, emails, and readable Arabic action text) while preserving existing filters.
- Super Admin Analytics Dashboard backend is now available at `GET /api/v1/super-admin/analytics/dashboard`, protected by `view:reports`, and returns center/user/appointment/billing/audit KPI groups with cancelled invoices excluded from revenue totals.
- Protected Super Admin endpoints now require an explicit platform user header; tenant sessions or missing headers do not satisfy platform permissions.
- Super Admin center status changes now write `CENTER_STATUS_CHANGED` from the shared center status service path, with center target fields and old/new status metadata visible in Audit Logs.
- Super Admin Dashboard UI now consumes `GET /api/v1/super-admin/analytics/dashboard` instead of mock data, including real KPI cards, quick stats, recent centers, billing overview, revenue by center, latest audit activity, and translated loading/empty/error states.
- Super Admin Analytics Dashboard now includes rule-based Smart Insights at `insights.alerts`, `insights.highlights`, and `insights.recommendations`, and the dashboard renders them in a compact translated section above the KPI cards.
- Super Admin Subscriptions lifecycle display now prefers backend `daysRemaining` and safely falls back to date calculation or `—`; Smart Insights no longer embeds corrupted `????` center names in Arabic alerts.
- Super Admin Subscriptions overview now includes quick filters for expiring, expired, suspended, and missing WhatsApp phone records, plus lifecycle/phone badges and row actions for details, renewal, suspension, WhatsApp, and phone editing.
- Super Admin subscription filters now use real lifecycle/status/phone response fields; the API returns safe `notificationPhone`, `ownerPhone`, and `centerPhone` values and supports `missingPhone=true`.
- Suspended subscription reporting is normalized across the Super Admin dashboard and subscriptions page: subscription `SUSPENDED`/`CANCELLED` and center `SUSPENDED`/`CANCELLED` are treated as blocked subscription states.
- Super Admin subscription details now expose a Subscription Timeline powered by `GET /api/v1/super-admin/subscriptions/:id/timeline`, combining subscription creation, audit logs, renewal requests, notifications, and manual WhatsApp logs.
# 2026-05-12 Tenant Subscription Access Control Update

- Tenant subscription access control is now enforced server-side for tenant business write routes. Expired subscriptions can keep reading dashboard/notifications/settings data but cannot create or update patients, appointments, services, staff, invoices, payments, credits, or role permissions.
- Suspended/cancelled subscriptions block tenant business writes with localized restriction errors while dashboard, notifications, logout, and renewal request stay available.
- Tenant `/permissions/me` and `/auth/center/me` include `subscriptionAccess`, and the tenant shell/list actions use it for EN/AR/HE warning banners and disabled write buttons.
- Latest QA commands passed: API lint, API build, web lint, web `tsc --noEmit`, and web build.
- 2026-05-18 RBAC UI hardening: tenant appointment list/details now hide unauthorized edit/status/invoice/payment/credit controls by session permission and reserve disabled controls for subscription write-block states.
- 2026-05-18 production recovery hardening: critical subscription, patient, appointment, invoice, payment, and credit relations now restrict parent hard deletes; tenant invoice/patient/appointment restore and status-change flows write audit rows; cancelled appointment restore clears stale cancellation fields; backup/restore runbook added at `ai-memory/11_BACKUP_RECOVERY.md`.
- 2026-05-18 user-facing UI finalization started: shared admin surface components were added and wired into Super Admin/Center Admin shells, audit logs, Super Admin dashboard errors, and tenant dashboard stat/error states for a more consistent SaaS polish layer.
- 2026-05-20 Schedule Provider Integration completed: public center profile returns active providers, public availability accepts optional `providerId`, booking requests persist selected provider, accepted booking requests create appointments for the requested provider, provider working hours/leave reasons are reflected in slots, and tenant service forms expose `bufferMinutes` with 0-240 validation.
- 2026-05-23 favicon production hardening completed: favicon uploads are converted to 512x512 PNG, the old `apps/web/src/app/favicon.ico` conflict was removed, root favicon links are appended last with `type="image/png"` and `updatedAt` cache busting, and the current public favicon is saved as `/uploads/branding/favicon-1779543890593-75a0dfcb-6845-42d7-81b9-ac93a0a6747b.png`.
- 2026-05-23 tenant sidebar branding fixed: Center Admin shell uses the authenticated center `branding.logoUrl` only, falls back to center initials on missing/broken logos, and no longer fetches or displays platform/public branding inside `/tenant/*`.
- 2026-05-23 tenant favicon override added: `/tenant/*` pages dispatch the authenticated center logo to the global favicon manager, which converts it to a 512x512 PNG data URL for tab icons and restores the RoyalCare platform favicon on public/Super Admin routes.
- 2026-05-23 tenant marketing settings module added: `/tenant/settings/marketing` stores center-scoped Meta/TikTok/Snap/GA4/GTM/custom script values with EN/AR/HE UI, `settings:view` access, and no tracking injection yet.
- 2026-05-23 tenant marketing tracking injection v1 added: saved marketing settings are injected only on `/c/[slug]`, `/c/[slug]/book`, and patient portal public journey pages; `/centers`, `/tenant/*`, and `/super-admin/*` remain clean, and `metaConversionApiToken` is never exposed publicly.
- 2026-05-23 tenant marketing tracking events v2 added: public booking now tracks `ViewBookingPage`, `SelectService`, `SelectDateTime`, `SubmitBookingAttempt`, and `BookingFailed`; patient portal loads track `PatientPortalView`; existing `CompleteBooking` and `WhatsAppClick` remain; provider failures stay isolated so tracking cannot block booking or portal UX.
- 2026-05-24 marketing tracking debug logs added: `MarketingTrackingLog` stores safe center-scoped server-side Meta CAPI attempt summaries, `GET /api/v1/tenant/settings/marketing/logs?limit=20` exposes recent rows to authenticated tenant settings users, and `/tenant/settings/marketing` renders Recent Tracking Logs with EN/AR/HE labels.
- 2026-05-24 marketing tracking logs runtime readiness completed: the tracking-log migration was applied, runtime QA confirmed empty logs before tests, `TestMarketingEvent` logging, public booking `CompleteBooking` logging, and failed Meta CAPI attempts not blocking booking; fake QA Meta settings were cleared afterward.
- 2026-05-24 public booking UX hardening completed: `/c/[slug]/book` keeps the existing marketing event flow while improving localized validation/API errors, slot loading/error states, submit disabling, double-submit prevention, stale slot refresh, and mobile touch targets.
- 2026-05-28 Smart Follow-up Treatment Plans v1 completed: tenant services now store fixed interval/session-plan follow-up settings; completed appointments auto-create idempotent patient follow-up reminders; `/tenant/follow-ups` provides filters, metrics, WhatsApp helper links, notes, and status actions; patient profiles show follow-up timelines; appointment creation can be prefilled from a follow-up and marks it booked after save.
- 2026-05-28 custom one-time appointment services completed: appointment create/edit supports catalog or custom service mode, optional save-as-future-service, custom-service badges, custom appointment billing without mandatory catalog rows, and custom service revenue grouping in tenant financial reports.
- Latest QA commands passed: Prisma format/validate/generate, API lint/build, web lint (`0` errors with existing warnings), web `tsc --noEmit`, and web build.
