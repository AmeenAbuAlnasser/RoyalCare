# RoyalCare - Changelog

## 2026-04-27

Fixed services/api PostgreSQL connection source.

Root cause:
- `services/api/.env` contained the correct Docker PostgreSQL URL, but the NestJS API did not load `.env`.
- `PrismaService` fell back to an old hardcoded connection string using password `royalcare`, causing PostgreSQL password authentication failures for user `royalcare`.

Changed:
- Added an explicit API database URL loader at `services/api/src/common/config/database-url.ts`.
- API database URL loading order is now:
  1. `services/api/.env`
  2. root `.env`
  3. `packages/database/.env`
  4. existing `process.env.DATABASE_URL`
  5. required local Docker fallback
- `PrismaService` now uses the explicit loader and rejects any URL other than the required local Docker URL.
- Updated `packages/database/.env.example` to remove the stale `postgres:postgres` example.

Verified:
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `POST /api/v1/centers` succeeded against Docker PostgreSQL and created a real center record without password authentication errors.

Fixed likely React maximum update depth loop sources in Super Admin shell/create flow.

Changed:
- Removed the redundant `router.refresh()` immediately after `router.push("/super-admin/centers")` in the Add New Center success handler.
- Hardened `LanguageProvider` so selecting the current locale is a no-op and document/localStorage/cookie persistence only writes when values actually changed.

Reason:
- The create success path could trigger App Router refresh work while navigation was already in progress.
- The global language provider was doing persistence writes on every locale effect run even when the browser state already matched.

Verified:
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.
- `npm.cmd run build` compiles successfully, then fails in this Windows environment with `spawn EPERM`.
- `npm.cmd run dev` and `npx.cmd next dev --webpack` fail before serving with the same Windows `spawn EPERM`.

Debugged Add New Center submit preflight behavior.

Changed:
- Create Center now reports exact frontend validation blockers instead of showing the generic API error before a request is attempted.
- Added temporary `TODO(debug)` console logs for Create Center submit verification:
  - validation blockers
  - payload before submit
  - configured API base URL
  - API URL
  - API response/error
- API client now supports `NEXT_PUBLIC_API_URL`, then `NEXT_PUBLIC_ROYALCARE_API_URL`, then `http://localhost:3001/api/v1`.
- API client now displays readable backend response messages, including nested NestJS validation response bodies.

Verified:
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.

Connected Add New Center Wizard to real PostgreSQL-backed center creation.

Changed:
- Added `POST /api/v1/centers` as an alias for real center creation, while keeping `POST /api/v1/super-admin/centers`.
- Expanded center creation to write `Center`, `BrandingSettings`, `Subscription`, optional `Domain`, center admin `User`, center admin `Role`, and `UserRole` in one Prisma transaction.
- Added backend validation for center name, owner/admin email, subscription plan, default language, enabled languages, and default-language inclusion.
- Connected Step 6 Review + Confirm in `/super-admin/centers/new` to the real API instead of mock save behavior.
- Added a web API client for Super Admin center list, create, and detail requests.
- Updated `/super-admin/centers` to prefer API-backed centers and link View actions to real center ids.
- Updated `/super-admin/centers/[id]` to fetch a real center by id before falling back to existing mock detail records.

Verified:
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `npm.cmd test -- --runInBand` passes in `services/api`.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.
- `npm.cmd run db:validate` passes in `packages/database`.
- `npm.cmd run build` in `apps/web` compiles successfully, then fails during the Next.js TypeScript phase with Windows `spawn EPERM`; direct TypeScript and ESLint checks pass.

Started real database-backed Super Admin core backend foundation.

Changed:
- Updated Prisma Client generation to the standard `prisma-client-js` runtime path.
- Improved core indexes for User, Center, and Subscription lookup patterns.
- Added `User.deletedAt` for future soft-delete-safe user lifecycle handling.
- Added API database infrastructure through a shared NestJS `DatabaseModule` and lazy `PrismaService`.

Added:
- Centers API controller, service, and DTOs.
- Users API controller, service, and DTOs.
- Subscriptions API controllers, service, and DTOs.
- Shared API pagination helper.

Implemented API foundation:
- `GET /api/v1/super-admin/centers`
- `POST /api/v1/super-admin/centers`
- `GET /api/v1/super-admin/centers/:centerId`
- `GET /api/v1/super-admin/users`
- `POST /api/v1/super-admin/users`
- `GET /api/v1/super-admin/users/:userId`
- `POST /api/v1/super-admin/users/:userId/center-roles`
- `GET /api/v1/super-admin/subscriptions`
- `POST /api/v1/super-admin/subscriptions`
- `GET /api/v1/super-admin/subscriptions/:subscriptionId`
- `GET /api/v1/super-admin/centers/:centerId/subscription`

Notes:
- Existing Super Admin UI routes were not changed.
- Auth, permission guards, and production tenant request context are still pending before exposing these endpoints as secured production APIs.

Verified:
- `npm run db:format` passes in `packages/database`.
- `npm run db:validate` passes in `packages/database`.
- `npm run db:generate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.
- `npm run lint` passes in `services/api`.
- `npm run build` passes in `services/api`.
- `npm test -- --runInBand` passes in `services/api`.
- `npm run test:e2e` passes in `services/api`.

Built Super Admin Settings Management page.

Added:
- Route `/super-admin/settings`.
- Settings Management page component.
- Mock global platform settings data.
- English, Arabic, and Hebrew dictionary for Settings Management.

Includes:
- General Platform Settings for platform name, default language, supported languages, currency, timezone, and date format.
- Branding Settings for platform logo, primary color, secondary color, email branding, and login page branding.
- Security Settings for two-factor default, password policy, session timeout, login attempt limits, and force password reset.
- Notification Settings for email, WhatsApp, system, payment, and subscription alerts.
- Subscription Defaults for trial duration, grace period, and auto suspension rules.
- Domain Defaults for subdomain pattern, SSL auto renewal, and DNS verification rules.
- Backup & System Health for last backup, backup frequency, system status, database health, and backup-now state.

Changed:
- Super Admin sidebar Settings item now links to `/super-admin/settings`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/settings` returned `200 OK` on the built Next.js server.
- Production route checks confirmed `royalcare_locale=ar`, `royalcare_locale=he`, and `royalcare_locale=en` render the expected `lang` and `dir` values.

Built Super Admin Notifications Management page.

Added:
- Route `/super-admin/notifications`.
- Notifications Management page component.
- Mock notification summary, notification rows, filters, and template preview data.
- English, Arabic, and Hebrew dictionary for Notifications Management.

Includes:
- Summary cards for total notifications, unread, critical, and sent today.
- Search and filters for all, unread, critical, system, subscription, domain, payment, and support.
- Desktop notifications table with title, message, type, priority, related center, created date, read/unread status, and actions.
- Mobile notification cards using the shared bottom-sheet action menu.
- Notification Templates Preview for subscription expiring, domain verification failed, payment failed, and new center created.

Changed:
- Super Admin sidebar Notifications item now links to `/super-admin/notifications`.
- Shared action menu gained read and archive icons for notification row actions.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/notifications` returned `200 OK` on the built Next.js server.
- Production route checks confirmed `royalcare_locale=ar`, `royalcare_locale=he`, and `royalcare_locale=en` render the expected `lang` and `dir` values.

Fixed mobile Super Admin action menu overflow.

Changed:
- Updated shared `SuperAdminActionMenu` so desktop keeps the compact dropdown while mobile opens a fixed bottom sheet / slide-up action panel.
- Mobile action sheets now use a screen-safe fixed overlay, rounded top panel, touch-friendly item height, and safe-area bottom padding.
- Destructive actions are visually separated and remain clearly red.
- Users, Centers, Subscriptions, Domains, and Plans inherit the fixed mobile behavior from the shared component.
- Updated permanent UI rules so this becomes the RoyalCare responsive action standard.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Redesigned Super Admin row action menus.

Added:
- Shared `SuperAdminActionMenu` component for premium compact row actions.
- Inline action icons for view, edit, reset password, suspend, delete, renew, verify, invoice, duplicate, activate, and related menu actions.

Changed:
- Users, Centers, Subscriptions, Domains, and Plans now use one compact vertical-dot row action trigger.
- Replaced old large `Actions` buttons, stacked dropdown buttons, and inline desktop button clusters with a consistent enterprise-style dropdown.
- Delete/cancel actions now appear as clearly red destructive menu items.
- Updated permanent UI rules so this shared action menu is the Super Admin standard.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin User Details page.

Added:
- Dynamic route `/super-admin/users/[id]`.
- User Details page component.
- Id-keyed mock user details data for users `1` through `5`.
- Mock activity timeline data per user id.
- English, Arabic, and Hebrew dictionary for User Details.

Includes:
- User Overview with profile avatar, full name, email, mobile number, role, department, status, created date, last login, last activity, and two-factor authentication status.
- Permissions Summary with assigned role, direct permissions, access level, and restricted areas.
- Quick Actions for edit, reset password, suspend, activate, force logout, and delete.
- Activity Timeline with user created, password reset, role changed, last login, and permission updated events.
- Assigned Responsibilities and private Internal Notes sections.
- Translated not-found state for invalid ids.

Changed:
- Users Management `View` actions now open the matching `/super-admin/users/{id}` details route.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/users/1`, `/super-admin/users/2`, `/super-admin/users/3`, and `/super-admin/users/999` returned `200 OK` on the local Next.js dev server.
- Dynamic content checks confirmed ids `1`, `2`, and `3` render Sara Levi, Amir Haddad, and Maya Cohen respectively; id `999` renders `User not found`.
- Production route checks confirmed `royalcare_locale=ar` renders `<html lang="ar" dir="rtl">`, `royalcare_locale=he` renders `<html lang="he" dir="rtl">`, and `royalcare_locale=en` renders `<html lang="en" dir="ltr">`.

Built Super Admin Users Management page.

Added:
- Route `/super-admin/users`.
- Users Management page component.
- Mock RoyalCare platform user data.
- English, Arabic, and Hebrew dictionary for Users Management.

Includes:
- Summary cards for total users, active users, pending users, and suspended users.
- Add New User primary action.
- Search and filters for name/email/role, role, status, and last login.
- Desktop Users table with user name, email, role, department, status, last login, created date, and actions.
- Mobile user cards with one structured `Actions` menu per user.
- Roles Preview block for Super Admin, Support, Sales, Finance, and Viewer.

Changed:
- Super Admin sidebar Users item now links to `/super-admin/users`.
- User `View` actions are prepared to link to `/super-admin/users/{id}` for the future details page.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Plan Details page.

Added:
- Dynamic route `/super-admin/plans/[id]`.
- Plan Details page component.
- Id-keyed mock plan details data for plans `1` through `4`.
- English, Arabic, and Hebrew dictionary for Plan Details.

Includes:
- Plan Overview with plan name, monthly/yearly price, trial duration, setup fee, featured status, active status, created date, and last updated date.
- Included Features with users, branches, appointments, customers, storage, modules, notification channels, API access, custom domain support, and support level.
- Quick Actions for edit, duplicate, activate/deactivate, mark featured, and delete.
- Current Subscribers block with subscriber count, recent subscribers, and revenue contribution.
- Upgrade Paths block with lower plan, higher plan, and recommended upgrade path.
- Internal Super Admin notes section.
- Translated not-found state for invalid ids.

Changed:
- Plans Management `View Plan` action now links to `/super-admin/plans/{id}`.
- Plans mock ids now use route-friendly ids `1` through `4`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Plans Management page.

Added:
- Route `/super-admin/plans`.
- Plans Management page component.
- Mock plan data for Trial, Starter, Professional, and Enterprise plans.
- English, Arabic, and Hebrew dictionary for Plans Management.

Includes:
- Summary cards for total plans, active plans, most popular plan, and highest revenue plan.
- Add New Plan button.
- Search and filters for active, inactive, trial-enabled, and popular plans.
- Plan cards with pricing, trial duration, user/branch limits, modules, support level, status, and featured badges.
- Mobile-safe `Actions` menu per plan.
- Plan Comparison Preview table.

Changed:
- Super Admin sidebar Plans item now links to `/super-admin/plans`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Domain Details page.

Added:
- Dynamic route `/super-admin/domains/[id]`.
- Domain Details page component.
- Id-keyed mock domain details data for domains `1` through `5`.
- Mock domain activity timeline data per domain id.
- English, Arabic, and Hebrew dictionary for Domain Details.

Includes:
- Domain Overview with domain, center, owner, type, verification, DNS, SSL, dates, and status.
- DNS Instructions with A record, CNAME, and TXT verification record.
- Verification Actions for verify, DNS recheck, SSL renewal, suspend, and delete.
- SSL Certificate Info with provider, issued date, expiry date, auto renew, and certificate status.
- Domain Activity Timeline.
- Internal Super Admin notes section.
- Translated not-found state for invalid ids.

Changed:
- Domains Management `View` action now links to `/super-admin/domains/{id}`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Domains Management page.

Added:
- Route `/super-admin/domains`.
- Domains Management page component.
- Mock domain data for custom domains and subdomains.
- English, Arabic, and Hebrew dictionary for Domains Management.

Includes:
- Summary cards for total, verified, pending, failed, and SSL-expiring domains.
- Search and filters for verification status, suspended domains, SSL expiring soon, and domain/center/owner search.
- Desktop domains management table.
- Mobile domain cards with one structured `Actions` menu per domain.
- Pending Verification highlighted section.
- SSL Expiry Warning section.
- Domain Health Overview with healthy, warning, and critical counts.

Changed:
- Super Admin sidebar Domains item now links to `/super-admin/domains`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Subscription Details page.

Added:
- Dynamic route `/super-admin/subscriptions/[id]`.
- Subscription Details page component.
- Id-keyed mock subscription details data for subscriptions `1` through `5`.
- Mock payment history and renewal history data per subscription id.
- English, Arabic, and Hebrew dictionary for Subscription Details.

Includes:
- Subscription Overview with center, logo mark, owner, plan, billing cycle, price, dates, auto renewal, status, payment status, and renewal dates.
- Quick Actions for renewal, upgrade, downgrade, suspend, cancel, invoice generation, and invoice history.
- Payment History with desktop table and mobile cards.
- Renewal History timeline.
- Billing Information section.
- Internal Super Admin notes section.
- Translated not-found state for invalid ids.

Changed:
- Subscriptions Management `View` action now links to `/super-admin/subscriptions/{id}`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Subscriptions Management page.

Added:
- Route `/super-admin/subscriptions`.
- Subscriptions Management page component.
- Mock subscription data, revenue snapshot data, and expiring-soon data.
- English, Arabic, and Hebrew dictionary for Subscriptions Management.

Includes:
- Summary cards for active, trial, expiring soon, expired, and monthly revenue.
- Search and filters for status, auto renewal, plan type, date range, and center/owner/domain search.
- Desktop subscriptions management table.
- Mobile subscription cards with one structured `Actions` menu per subscription.
- Expiring Soon highlighted section.
- Revenue Snapshot section for MRR, ARR, pending payments, and failed renewals.

Changed:
- Super Admin sidebar Subscriptions item now links to `/super-admin/subscriptions`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Improved Centers Management mobile action buttons.

Changed:
- Mobile row actions now use one compact `Actions` button instead of showing View, Edit, Suspend, Renew Subscription, and Delete as a messy stacked cluster.
- Tapping the mobile `Actions` button expands a structured equal-width action menu.
- Delete appears last and uses the shared danger button style.
- Desktop keeps the normal inline table action layout.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Fixed Center Details dynamic loading by route id.

Root cause:
- The Center Details page used a fallback center object when the route id was not found.
- Since only id `1` existed in mock data, `/super-admin/centers/2`, `/3`, and later ids all displayed Nova Laser Center.

Changed:
- Added distinct mock Center Details records for ids `1` through `5`.
- `/super-admin/centers/1` now shows Nova Laser Center.
- `/super-admin/centers/2` now shows Al Noor Hijama.
- `/super-admin/centers/3` now shows Balance Physio.
- `/super-admin/centers/4` now shows Glow Beauty Clinic.
- `/super-admin/centers/5` now shows Wellness House.
- Removed the silent fallback-to-Nova behavior.
- Added a translated not-found state for unknown ids.
- Kept the Centers Management `View` action mapped to the correct row id.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Center Details page.

Added:
- Dynamic route `/super-admin/centers/[id]`.
- Center Details page component for managing one center tenant.
- Mock center detail data and activity timeline data.
- English, Arabic, and Hebrew dictionary for Center Details.

Includes:
- Center Overview card with logo, owner, center type, services, status, subscription, domain, and created date.
- Quick Actions section with Edit, Renew Subscription, Suspend, Activate, Delete, and Login as Center Admin buttons.
- Center Admin Information section.
- Branding + Languages section with logo preview, colors, default language, and enabled languages.
- Activity Timeline with mock center events.
- Internal Super Admin Notes section.

Changed:
- Centers Management `View` action now links to `/super-admin/centers/{id}`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Add New Center wizard Step 6: Review + Confirm.

Changed:
- Created a full Review + Confirm summary for Center Basic Info, Subscription Plan, Domain Setup, Branding + Languages, and Center Admin Account.
- Review now shows controlled wizard values from previous steps instead of only placeholder text.
- Added logo preview and selected logo file name to the Branding + Languages review section.
- Added a translated warning box: `Please review all information carefully before creating the center.`
- Added a strong final `Create Center` primary action on the final wizard step.
- Kept the flow UI-only with no backend creation call.
- Added English, Arabic, and Hebrew copy for Create Center, no-logo state, and the review warning.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Fixed Auto Renewal control in the Add New Center wizard.

Added:
- Shared `ToggleSwitch` component for compact boolean form controls.

Changed:
- Replaced the Auto Renewal full-width browser checkbox card with the shared toggle switch.
- Auto Renewal is now controlled by wizard state and visibly switches between enabled and disabled states.
- The review step now reflects the current Auto Renewal state.
- Existing wizard boolean controls now use the same toggle style for consistency.
- Documented the permanent toggle rule in UI/UX memory.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

## 2026-04-26

Improved Add New Center wizard center classification structure.

Changed:
- Replaced the single Center Type select in Step 1 with a Primary Category single-select.
- Added Services Offered as multi-select checkboxes.
- Added Other service support with a conditional custom service name field.
- Added English, Arabic, and Hebrew dictionary entries for primary categories and offered services.
- Review step now summarizes the selected primary category and services offered.
- Kept the wizard UI-only, responsive, and inside the shared `SuperAdminLayout`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Add New Center wizard Step 5: Center Admin Account.

Changed:
- Added controlled UI state for the center admin account step.
- Step 5 now includes Admin Full Name, Admin Email, Mobile Number, Password, Confirm Password, Permissions Preset, notification toggles, two-factor authentication toggle, and Account Status.
- Added permission preset options: Full Access, Standard Management, Limited Access, and Custom Permissions.
- Added account status options: Active and Pending Activation.
- Added lightweight validation UI for email format and password match.
- Added required field indicators for the required Step 5 fields.
- Review step now includes the selected admin account values, permissions preset, account status, and notification/security toggles.
- Added English, Arabic, and Hebrew dictionary entries for all Step 5 fields, validation messages, presets, toggles, and statuses.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Improved Add New Center wizard Step 4: Branding + Languages.

Changed:
- Step 4 now keeps controlled UI state for primary color, secondary color, default language, and enabled languages.
- Center logo upload remains UI-only but now works as a clear image picker with local preview and selected file name.
- Enabled language checkboxes are ordered Arabic, Hebrew, English and update wizard state.
- Default language selector updates wizard state without resetting global app language.
- Branding review now reflects selected colors, default language, and enabled languages.
- Added translated empty-state copy for the case where no enabled languages are selected.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Fixed hydration mismatch from locale-dependent number and currency formatting.

Root cause:
- Dashboard stat cards used `Intl.NumberFormat` with compact currency during client rendering.
- Server and browser ICU/bidi behavior can format the same Arabic currency value differently, for example `US$ 42.8 ألف` on the server and `42.8 ألف US$` on the client.
- React treated that text difference as a hydration mismatch.

Added:
- `apps/web/src/i18n/formatters.ts`

Changed:
- Dashboard numbers, signed changes, percentages, and compact money now use deterministic RoyalCare formatting utilities.
- Centers Management stats and dates now use the same shared deterministic formatting layer.
- Removed direct `Intl.NumberFormat` and `Intl.DateTimeFormat` usage from current Super Admin rendered values.
- Formatting is now controlled by the selected app locale only, not browser or operating-system locale.
- Documented that future hydration-sensitive number, currency, percent, and date text must use the shared formatter.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `rg` finds no direct `Intl`, `NumberFormat`, `DateTimeFormat`, or `toLocaleString` usage in `apps/web/src`.
- Server-rendered Arabic `/super-admin/dashboard` now outputs `42.8 ألف US$`.
- Server-rendered English `/super-admin/dashboard` now outputs `US$ 42.8K`.
- Server-rendered Hebrew `/super-admin/dashboard` now outputs `‎US$ 42.8K`.

Fixed Super Admin language flicker on page navigation.

Root cause:
- Language persistence was previously resolved from browser `localStorage` after hydration.
- The server-rendered page could start in English/LTR before the client provider switched to saved Arabic or Hebrew.

Changed:
- Added server-readable locale cookie support using `royalcare_locale`.
- Updated the Next.js root layout to read the saved locale cookie before rendering UI.
- Root layout now applies `<html lang>` and `<html dir>` from the saved locale on the first server render.
- `LanguageProvider` now receives the server-resolved `initialLocale`.
- Removed first-render dependency on `localStorage`; `localStorage` is now only a browser-side mirror.
- Locale changes persist to both the `royalcare_locale` cookie and `royalcare.locale` localStorage key.
- Super Admin Login, Dashboard, Centers, and Add New Center Wizard all use the global provider state.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- Server-rendered `/super-admin/dashboard` with `royalcare_locale=ar` returns `<html lang="ar" dir="rtl">`.
- Server-rendered `/super-admin/centers` with `royalcare_locale=he` returns `<html lang="he" dir="rtl">`.
- Server-rendered `/super-admin/centers/new` with `royalcare_locale=ar` returns `<html lang="ar" dir="rtl">`.
- Server-rendered `/super-admin/login` with `royalcare_locale=he` returns `<html lang="he" dir="rtl">`.

Added global Super Admin language persistence.

Root cause:
- Dashboard, Centers, and Add New Center Wizard each kept their own page-level locale state initialized to English.
- Navigating between pages remounted a new component and reset the locale.

Added:
- `apps/web/src/i18n/LanguageProvider.tsx`
- App-wide `LanguageProvider` wrapping the Next.js root layout.

Changed:
- Selected language is stored in browser `localStorage` under `royalcare.locale`.
- `LanguageProvider` updates document `lang` and `dir` globally.
- `SuperAdminLayout` now reads and updates language through `useLanguage()`.
- Dashboard now reads global language state instead of local page state.
- Centers Management now reads global language state instead of local page state.
- Add New Center Wizard now reads global language state instead of local page state.
- Super Admin Login now reads global language state and renders English, Arabic, or Hebrew copy from the saved locale.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/centers` returns `200 OK` locally.
- `/super-admin/centers/new` returns `200 OK` locally.
- `/super-admin/login` returns `200 OK` locally.

Added Back to Centers action to the Add New Center wizard.

Changed:
- Added a top-header secondary button linking from `/super-admin/centers/new` back to `/super-admin/centers`.
- Added translations:
  - English: `Back to Centers`
  - Arabic: `العودة إلى المراكز`
  - Hebrew: `חזרה למרכזים`
- Button uses the shared secondary button style.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Created reusable custom DateField for Add New Center wizard date fields.

Root cause:
- Native `input type="date"` displays its visible value using browser/OS locale, which can show Arabic-style dates even when the RoyalCare app language is English.

Added:
- `apps/web/src/components/forms/DateField.tsx`

Changed:
- Start Date and Expiry Date now use the reusable `DateField` component.
- Visible date display is controlled by RoyalCare app locale, not browser/OS locale.
- Internal date value remains `YYYY-MM-DD`.
- English displays `YYYY-MM-DD`.
- Arabic and Hebrew use RTL-friendly day/month/year display.
- Date picker UI uses simple day/month/year selects with translated labels.
- Added translated day/month/year labels and updated date helper text in the wizard dictionary.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Restored native date picker fields in the Add New Center wizard.

Changed:
- Start Date and Expiry Date now use native `input type="date"` controls again.
- Removed the plain-text date-input approach from the visible wizard UI.
- Added localized helper text for date fields while keeping browser-native date picker behavior.
- Documented that future wizard date fields must use native date controls, not fake text placeholders.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Fixed Add New Center primary action link contrast on `/super-admin/centers`.

Root cause:
- The Add New Center action is a Next.js `Link`, rendered as an anchor.
- The global `a { color: inherit; }` rule was outside Tailwind's cascade layers, so it could override utility text color on link-like buttons in Tailwind v4.
- This caused the shared primary style's `text-white` to be unreliable for anchor buttons.

Changed:
- Moved the global anchor reset into `@layer base` so Tailwind utility classes win correctly.
- Added `primaryButtonClassName` to the shared button style utility.
- Updated the Centers Management Add New Center link to use `primaryButtonClassName`.
- Reconfirmed no matching primary action uses a dark navy background with dark text.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers` returns `200 OK` locally.

Fixed Add New Center wizard language consistency and logo upload UI.

Changed:
- Replaced native date inputs with text-style date fields so visible placeholders are controlled by the selected language.
- Added localized date placeholders:
  - English: `yyyy-mm-dd`
  - Arabic: `يوم/شهر/سنة`
  - Hebrew: `יום/חודש/שנה`
- Added localized mock review dates.
- Replaced the static logo upload placeholder with a working image file picker.
- Logo picker accepts image files, shows the selected file name, and displays a local preview without backend upload.
- Added localized logo upload button, selected-file label, preview alt text, and helper text.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Fixed Super Admin button contrast and shared button styling.

Added:
- Shared button style utility at `apps/web/src/components/ui/button-styles.ts`.

Changed:
- Login primary submit button now uses the shared primary button style.
- Centers Management Add New Center link now uses the shared primary style.
- Centers filters now use shared primary/secondary styles.
- Centers row actions now use shared secondary, warning, and danger styles.
- Dashboard section actions now use the shared ghost style.
- Add New Center wizard footer controls now use shared secondary, warning, and primary styles.
- Shared layout mobile menu button now uses the shared secondary icon style.

Button standards:
- Primary: navy background with white text.
- Secondary: white/light background with navy text and proper border.
- Danger: red background with white text.
- Warning: gold background with navy text.
- Success: green background with white text.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Created the Super Admin Add New Center Wizard.

Added:
- Route: `/super-admin/centers/new`
- Wizard route file
- Add New Center wizard component
- English, Arabic, and Hebrew wizard translation dictionary

Includes:
- Center Basic Info
- Subscription Plan
- Domain Setup
- Branding + Languages
- Center Admin Account
- Review + Confirm

Changed:
- Wizard uses the shared `SuperAdminLayout`.
- Existing Centers Management "Add New Center" action now links to `/super-admin/centers/new`.
- Wizard is UI-only with mock placeholders and no backend submission.
- Responsive structure follows the permanent RoyalCare rules: no unwanted page overflow, contained layouts, mobile stacking, tablet-friendly grids.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Improved Super Admin sidebar hover and active menu styling.

Changed:
- Updated shared `SuperAdminLayout` navigation styling.
- Removed harsh white hover blocks from sidebar items.
- Hover now uses subtle navy background with a soft gold logical start-border.
- Active item now uses a stronger navy surface, clear gold logical start-border, and semibold white text.
- Increased item height/spacing slightly for better readability.
- Documented sidebar hover, active, and future sidebar input styling rules in UI memory.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Added permanent responsive and shared Super Admin layout rules.

Changed:
- Created reusable `SuperAdminLayout` for Super Admin pages.
- Refactored `/super-admin/dashboard` to use `SuperAdminLayout`.
- Refactored `/super-admin/centers` to use `SuperAdminLayout`.
- Documented that all future pages must be responsive by default across desktop, tablet, and mobile.
- Documented that tables may scroll only inside their own containers.
- Documented that Super Admin pages must not create page-specific navbars, sidebars, headers, language switchers, or profile header controls.
- Documented RTL/LTR drawer and sidebar direction rules for Arabic, Hebrew, and English.
- Updated agent guidance in `AGENTS.md` and `CLAUDE.md`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/centers` returns `200 OK` locally.

Improved the Super Admin Centers Management UI and responsive quality.

Changed:
- Strengthened the RoyalCare-branded sidebar with larger navigation text, more spacing, and a clearer gold-accent active item.
- Replaced the mobile/tablet horizontal navigation strip with a direction-aware drawer.
- Drawer opens from the right for Arabic/Hebrew and from the left for English.
- Improved the heading command area so it feels more useful and less empty while staying simple.
- Updated cards to 1 column on mobile, 2 columns on tablet, and 4 columns on desktop.
- Made search and filters stack/wrap cleanly on smaller screens.
- Added `min-width: 0`, `max-width: 100%`, and `minmax(0, ...)` constraints through the Centers page shell, cards, filters, and table section.
- Kept the large centers table scrollable only inside the table container.
- Added translated drawer menu/close labels for English, Arabic, and Hebrew.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers` returns `200 OK` locally.
- `/super-admin/dashboard` returns `200 OK` locally.

Fixed unwanted horizontal overflow in the Super Admin Dashboard responsive layout.

Root cause:
- The recent centers table uses a required minimum table width for readable columns.
- Its parent dashboard grid/section chain did not consistently use `min-width: 0`, so the table's minimum content width could force the page wider than the viewport on mobile/tablet widths.

Changed:
- Added `min-width: 0` and `max-width: 100%` constraints through the dashboard shell, main content, grid children, section shells, cards, and table wrapper.
- Changed the dashboard content grid to use `minmax(0, ...)` tracks so nested content can shrink correctly.
- Kept horizontal scrolling scoped to the table wrapper only.
- Ensured overview cards are explicitly 1 column on mobile, 2 columns on tablet, and 4 columns on desktop.
- Tightened header wrapping and control sizing for small screens.
- Added the same width safety discipline to the Super Admin Login route.
- Added `html, body { max-width: 100%; overflow-x: hidden; }` only as a final safety net after fixing the component-level source.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/login` returns `200 OK` locally.

Improved the Super Admin Dashboard responsive layout.

Changed:
- Replaced the smaller-screen horizontal dashboard navigation with a collapsible mobile/tablet drawer.
- Kept desktop sidebar navigation visible.
- Drawer opens from the right for Arabic and Hebrew RTL layouts.
- Drawer opens from the left for English LTR layouts.
- Dashboard overview cards now follow the required responsive grid: 4 columns on desktop, 2 columns on tablet, 1 column on mobile.
- Header title, language switcher, and profile area now wrap more safely on narrow screens.
- Domain and notification preview rows stack on mobile to avoid squeezed status badges.
- Recent centers table remains horizontally scrollable only where needed.
- Added translated drawer control labels for English, Arabic, and Hebrew.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/login` returns `200 OK` locally.

Created the Super Admin Centers Management page.

Added:
- Route: `/super-admin/centers`
- Centers page route file
- Centers management component
- Mock centers data
- English, Arabic, and Hebrew translation dictionary for Centers Management

Includes:
- Page title: Centers Management
- Add New Center button
- Search bar
- Filters for Active, Trial, Expired, Suspended
- Quick stats cards
- Responsive centers table
- Actions: View, Edit, Suspend, Renew Subscription, Delete

Table columns:
- Center Name
- Owner Name
- Center Type
- Subscription Plan
- Subscription Expiry Date
- Domain
- Status
- Actions

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- UI only.
- Backend data is not connected yet.

Applied the official RoyalCare branding system across current platform UI.

Added:
- Official logo assets in `apps/web/public/brand/`.
- Brand token config in `apps/web/src/config/brand.ts`.
- Reusable `RoyalCareLogo` component in `apps/web/src/components/brand/RoyalCareLogo.tsx`.

Updated:
- Super Admin Login UI.
- Super Admin Dashboard UI.
- Global web color CSS variables.
- Sidebar colors.
- Buttons.
- Cards.
- Headers.
- Status badges.
- Language switcher.
- User profile area.

Brand colors:
- Royal Navy Blue `#0B2D5C`
- Luxury Gold `#C8A45D`
- Soft White `#F8FAFC`
- Neutral Gray `#E5E7EB`

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- Structure was not redesigned.
- Backend/auth/data integrations were not changed.

Improved Super Admin Dashboard i18n and RTL behavior.

Changed:
- Language selector now switches the dashboard between English, Arabic, and Hebrew.
- Arabic and Hebrew set RTL direction.
- English sets LTR direction.
- Desktop sidebar mirrors to the right for Arabic and Hebrew.
- Sidebar labels are translated for all three languages.
- Dashboard section titles, card labels, status badges, actions, plan names, center names, domain issue text, notification titles, and account/header text are translated.
- Numbers and currency values use `Intl.NumberFormat` with the active locale.
- Mock dashboard data now uses stable translation keys instead of embedded English UI strings.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Created the first Super Admin Dashboard layout.

Added:
- Route: `/super-admin/dashboard`
- Dashboard page file
- Reusable Super Admin dashboard component
- Mock dashboard data file for future API replacement
- Locale/direction config
- Translation dictionary for Super Admin dashboard labels in English, Arabic, and Hebrew

Dashboard sections:
- Sidebar navigation
- Top header
- Dashboard overview cards
- Quick stats
- Recent centers
- Subscription overview
- Domain management preview
- Notifications preview

Design:
- Simple practical admin layout.
- White and dark blue RoyalCare style.
- Responsive desktop, tablet, and mobile structure.
- RTL-ready through locale direction mapping.
- UI text prepared through dictionaries instead of being embedded directly in the page.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- UI only.
- Backend data is not connected yet.
- Language selector is structural only and will be wired when full i18n routing/provider work is implemented.

Defined system-wide multilingual i18n architecture.

Updated:
- `ai-memory/01_ARCHITECTURE.md`
- `ai-memory/05_UI_UX_RULES.md`
- `ai-memory/07_DECISIONS_LOG.md`

Added architecture rules:
- Required locales: Arabic, Hebrew, English.
- Direction mapping: Arabic/Hebrew RTL, English LTR.
- i18n applies to Public Website, Super Admin Panel, Center Admin Panel, and Customer Portal.
- Language switching should be available from user profile/settings for authenticated users.
- Public websites should respect center enabled languages and center default language.
- Translation files should be organized by locale and namespace.
- User-facing UI text should not be hardcoded in components.
- App shells must set `lang` and `dir` from the active locale.
- Admin layouts must use RTL-friendly logical CSS and simple mirrored layouts.

Needs Confirmation:
- Preferred Next.js i18n library.
- Locale URL strategy.
- Translation fallback behavior.

Created the first visible RoyalCare UI screen: Super Admin Login.

Added:
- Route: `/super-admin/login`
- File: `apps/web/src/app/(super-admin)/super-admin/login/page.tsx`
- Professional login page with:
  - RoyalCare logo/monogram area
  - Email field
  - Password field
  - Remember me checkbox
  - Forgot password link
  - Login button
  - Admin access note

Design:
- Simple ERP/admin style.
- White and dark blue RoyalCare look.
- Responsive desktop and mobile layout.
- RTL-friendly form structure.

Changed:
- Removed external Google font dependency from the web root layout.
- Switched the web app to a system font stack for more reliable offline/CI production builds.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- Backend authentication is not connected yet.
- This is UI-only.

Extended the Prisma schema with Phase 2 business models.

Added models:
- `Customer`
- `Service`
- `Appointment`
- `Session`
- `Notification`
- `DynamicPage`
- `BrandingSettings`

Added enums:
- `CustomerStatus`
- `ServiceStatus`
- `AppointmentStatus`
- `AppointmentSource`
- `SessionStatus`
- `NotificationChannel`
- `NotificationStatus`
- `DynamicPageStatus`

Architecture notes:
- Every Phase 2 model includes `centerId`.
- Every Phase 2 tenant-owned model relates to `Center`.
- Customer records are isolated per center.
- Services, dynamic pages, and notifications support multilingual JSON content for `ar`, `he`, and `en`.
- Branding settings support logo URL, colors, default language, enabled languages, and theme JSON.
- Dynamic pages support per-center unique slugs.

Deferred:
- Payments
- Medical diagnosis details
- Staff scheduling
- Audit logs
- File assets
- Dedicated page block table

Verified:
- `npm run db:format` passes in `packages/database`.
- `npm run db:validate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.

Designed the Phase 1 production-ready Prisma schema foundation.

Added models:
- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `Center`
- `Subscription`
- `Domain`

Added enums:
- `UserStatus`
- `RoleStatus`
- `PermissionStatus`
- `UserRoleStatus`
- `RoleScope`
- `CenterType`
- `CenterStatus`
- `SupportedLanguage`
- `SubscriptionStatus`
- `BillingInterval`
- `DomainType`
- `DomainStatus`

Architecture notes:
- Uses UUID primary keys.
- Uses explicit RBAC join tables.
- Uses `centerId` for tenant-scoped assignments and center-owned subscription/domain records.
- Includes status fields and lifecycle timestamps.
- Supports subscription expiry/trial/cancel logic.
- Supports custom domains and RoyalCare subdomains.

Verified:
- `npm run db:format` passes in `packages/database`.
- `npm run db:validate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.

Deferred:
- Customers
- Appointments
- Services
- Sessions
- Notifications
- Dynamic Pages
- Branding Settings
- Audit Logs

Initialized the database architecture in `packages/database`.

Added:
- Prisma ORM `7.8.0`
- PostgreSQL datasource baseline
- `@royalcare/database` package metadata
- Prisma config at `packages/database/prisma.config.ts`
- Minimal Prisma schema at `packages/database/prisma/schema.prisma`
- Migration folder placeholder
- Seed folder placeholder
- TypeScript package configuration
- Tenant scope helper using `centerId`
- Database package scripts for:
  - `db:generate`
  - `db:validate`
  - `db:format`
  - `db:migrate:dev`
  - `db:migrate:deploy`
  - `db:studio`
  - `typecheck`

Verified:
- `npm run db:validate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.

Notes:
- Full RoyalCare application models were intentionally not created yet.
- Prisma schema currently contains generator/datasource configuration and planning comments only.
- npm reported `3 moderate severity vulnerabilities`; no automatic audit fix was run.

Initialized the backend API in `services/api`.

Added:
- NestJS `11.x` API scaffold generated with `@nestjs/cli@11.0.21`
- TypeScript backend setup
- REST-ready global prefix `api/v1`
- ESLint backend setup
- Clean modular API structure
- Health endpoint at `GET /api/v1/health`
- Module placeholders for:
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
- Common backend folders for constants, decorators, DTOs, filters, guards, interceptors, interfaces, and pipes
- Tenant context interface using `centerId`

Verified:
- `npm run lint` passes in `services/api`.
- `npm run build` passes in `services/api`.
- `npm test` passes in `services/api`.
- `npm run test:e2e` passes in `services/api`.

Notes:
- No database connection was added.
- No Prisma schema was created.
- Business endpoints are not implemented yet.

Initialized the main web application in `apps/web`.

Added:
- Next.js `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS
- App Router
- ESLint
- `src/` directory structure
- Import alias `@/*`
- Route-group placeholders for:
  - Public website
  - Super Admin Panel
  - Center Admin Panel
  - Customer Portal
- Feature/module placeholders for:
  - Auth
  - Tenancy
  - Public site
  - Super Admin
  - Center Admin
  - Customer Portal
- RTL-aware global CSS baseline

Removed:
- Generated demo homepage content
- Generated demo SVG assets

Verified:
- `npm run lint` passes in `apps/web`.

Notes:
- No actual RoyalCare pages or workflows were built yet.
- The web app is structure-ready for future implementation.

Initial official project memory initialization.

Added:
- Project overview
- Architecture direction
- Conceptual database schema
- Business rules
- API map
- UI/UX rules
- Permissions model
- Decisions log
- Current status
- Next tasks
- Claude guidance
- Agent guidance
- Root README

Notes:
- No application code has been generated yet.
- Many product and infrastructure details are intentionally marked as `Needs Confirmation`.
