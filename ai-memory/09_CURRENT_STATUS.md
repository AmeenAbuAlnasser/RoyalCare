# RoyalCare - Current Status

Last updated: 2026-04-27
Status: Add New Center Wizard connected to real PostgreSQL-backed center creation

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
  - Status: UI-only, backend data not connected
- Super Admin Center Details
  - Route: `/super-admin/centers/[id]`
  - Example: `/super-admin/centers/1`
  - File: `apps/web/src/app/(super-admin)/super-admin/centers/[id]/page.tsx`
  - Component: `apps/web/src/features/super-admin/centers/details/SuperAdminCenterDetailsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes center overview, quick actions, admin information, branding/languages, activity timeline, and internal notes.
  - Dynamic mock loading is based on route id:
    - `/super-admin/centers/1` -> Nova Laser Center
    - `/super-admin/centers/2` -> Al Noor Hijama
    - `/super-admin/centers/3` -> Balance Physio
    - `/super-admin/centers/4` -> Glow Beauty Clinic
    - `/super-admin/centers/5` -> Wellness House
  - Unknown ids show a translated not-found state instead of falling back to a different center.
- Super Admin Subscriptions Management
  - Route: `/super-admin/subscriptions`
  - File: `apps/web/src/app/(super-admin)/super-admin/subscriptions/page.tsx`
  - Component: `apps/web/src/features/super-admin/subscriptions/SuperAdminSubscriptionsPage.tsx`
  - Status: UI-only, backend data not connected
  - Includes summary cards, search/filters, desktop table, mobile cards with actions menu, expiring-soon section, and revenue snapshot.
  - Uses English, Arabic, and Hebrew dictionaries with shared Super Admin layout.
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
- `POST /api/v1/centers` and `POST /api/v1/super-admin/centers` now create a complete initial center setup transaction with validation, branding, subscription, optional domain, and admin assignment.

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
  - Service
  - Appointment
  - Session
  - Notification
  - Dynamic Page
  - Branding Settings
Deferred models:
  - Payment
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
- Temporary `TODO(debug)` console logs are present around Create Center submit for payload, API URL, and response/error verification.
- Add New Center success navigation now uses `router.push("/super-admin/centers")` without an immediate `router.refresh()` to avoid App Router update loops.
- Global language persistence now avoids redundant state, document, localStorage, and cookie writes when the selected locale is unchanged.
- Super Admin Centers Management now fetches API-backed centers when the API is available.
- Super Admin Center Details now fetches real center records by route id when the API is available.
- Future mobile folder prepared at `apps/mobile`

Backend:
- NestJS app scaffolded at `services/api`
- Shared Prisma database service added
- Super Admin Centers, Users, and Subscriptions modules have controller/service/DTO structure
- First real database-backed foundation endpoints implemented
- Center creation endpoint now creates related branding, subscription, optional domain, admin user, admin role, and role assignment records in one transaction
- API Prisma connection now explicitly loads the Docker PostgreSQL URL from `services/api/.env` first and rejects stale credentials.
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
- Designed conceptually
- Not implemented

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
- Payment provider
- Online payment requirements
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

## 6. Risk Notes

Important risks:
- Tenant isolation mistakes can expose customer data between centers.
- RTL support is much harder if added late.
- Subscription/module checks must be backend-enforced, not only hidden in UI.
- Page builder scope can grow too large if not constrained.
- Appointment rules can become complex quickly if staff availability, recurring sessions, and cancellation policies are all included at once.
