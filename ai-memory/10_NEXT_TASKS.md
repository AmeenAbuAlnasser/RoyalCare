# RoyalCare - Next Tasks

Last updated: 2026-04-27
Status: Add New Center Wizard connected to real PostgreSQL-backed center creation

## 1. Immediate Confirmation Tasks

These should be answered before major implementation.

Business:
- Confirm MVP feature list.
- Confirm target launch date or development phase goals.
- Confirm first supported center type/template.
- Confirm subscription plans and pricing model.
- Confirm whether online payments are included in v1.
- Confirm whether RoyalCare handles domain purchase or only domain mapping.

Technical:
- Choose package manager.
- Choose monorepo tooling.
- Choose hosting provider.
- Choose authentication strategy.
- Choose file storage provider.
- Choose notification providers.
- Choose backup strategy.

Product:
- Confirm customer portal scope.
- Confirm appointment booking rules.
- Confirm session data required for each industry.
- Confirm page builder block types.
- Confirm admin UI library/design system.

## 2. Recommended MVP Scope - Draft

Recommended MVP:
- Super Admin login
- Center management
- Subscription status management, manual if payment provider not ready
- Domain mapping records, manual verification if automation not ready
- Center admin login
- Center settings and branding
- Services management
- Staff management
- Customers management
- Appointments management
- Basic sessions
- Basic dynamic pages
- Public center website from template
- Customer portal login and appointment view/request
- Basic email notifications
- Permissions and roles
- Audit log for important actions

Out of MVP unless confirmed:
- Full drag-and-drop page builder
- Online payments
- Complex treatment packages
- Native mobile app
- Automated domain purchasing
- Advanced analytics
- AI features

## 3. Technical Setup Tasks

Completed:
- Create monorepo folders:
  - `apps/web`
  - `apps/mobile`
  - `services/api`
  - `packages/database`
  - `packages/shared`
  - `packages/ui`
- Initialize Next.js web app in `apps/web` with:
  - TypeScript
  - Tailwind CSS
  - App Router
  - ESLint
  - `src/` directory
  - `@/*` import alias
- Prepare web route groups:
  - `src/app/(public)`
  - `src/app/(super-admin)`
  - `src/app/(center-admin)`
  - `src/app/(portal)`
- Prepare web feature folders:
  - `src/features/public-site`
  - `src/features/super-admin`
  - `src/features/center-admin`
  - `src/features/customer-portal`
  - `src/features/auth`
  - `src/features/tenancy`
- Remove generated demo homepage content and demo assets.
- Verify web lint passes.
- Initialize NestJS API in `services/api` with:
  - TypeScript
  - REST-ready architecture
  - ESLint
  - Global API prefix `api/v1`
  - Health endpoint
- Prepare backend module folders:
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
- Prepare common backend folders for future guards, decorators, filters, interceptors, DTOs, and pipes.
- Verify backend lint, build, unit test, and e2e test commands pass.
- Initialize Prisma/PostgreSQL database package in `packages/database`.
- Prepare database package structure:
  - `prisma/schema.prisma`
  - `prisma/migrations`
  - `prisma/seeds`
  - `src/client`
  - `src/tenant`
  - `src/backup`
  - `src/types`
- Add tenant scope helper using `centerId`.
- Verify Prisma validation and TypeScript typecheck pass.
- Create Phase 1 Prisma foundation models:
  - User
  - Role
  - Permission
  - UserRole
  - RolePermission
  - Center
  - Subscription
  - Domain
- Verify Prisma format, validation, and TypeScript typecheck pass after Phase 1 schema.
- Create Phase 2 Prisma business models:
  - Customer
  - Service
  - Appointment
  - Session
  - Notification
  - DynamicPage
  - BrandingSettings
- Verify Prisma format, validation, and TypeScript typecheck pass after Phase 2 schema.
- Connect initial Super Admin core backend modules to Prisma:
  - Centers
  - Users
  - Subscriptions
- Add shared API `DatabaseModule` and `PrismaService`.
- Add CRUD-ready controller/service/DTO structure for Centers, Users, and Subscriptions.
- Verify database package generation/typecheck and API lint/build/tests pass.
- Create first visible UI screen:
  - Super Admin Login at `/super-admin/login`
- Verify web lint and production build pass after login page.
- Create first Super Admin Dashboard layout at `/super-admin/dashboard`.
- Add reusable dashboard UI component, mock data file, locale config, and dashboard translation dictionary.
- Verify web lint and production build pass after dashboard page.
- Create Super Admin Centers Management UI at `/super-admin/centers`.
- Add mock center data and English/Arabic/Hebrew dictionary for Centers Management.
- Verify web lint and production build pass after Centers page.
- Create Super Admin Add New Center wizard at `/super-admin/centers/new`.
- Add English/Arabic/Hebrew dictionary for the Add New Center wizard.
- Link the Centers Management "Add New Center" action to the wizard route.
- Verify web lint and production build pass after Add New Center wizard.
- Improve Add New Center wizard Step 4 Branding + Languages with controlled logo preview, color pickers, default language selector, and enabled language checkboxes.
- Verify web lint and production build pass after Step 4 improvements.
- Build Add New Center wizard Step 5 Center Admin Account with admin identity fields, permission presets, notification/security toggles, account status, and validation UI.
- Verify web lint and production build pass after Step 5 improvements.
- Build Add New Center wizard Step 6 Review + Confirm with full summary, logo preview, warning box, and final Create Center action.
- Verify web lint and production build pass after Step 6 improvements.
- Build Super Admin Center Details page at `/super-admin/centers/[id]`.
- Add mock detail data, activity timeline, internal notes UI, and English/Arabic/Hebrew dictionary.
- Link Centers Management `View` action to the Center Details route.
- Verify web lint and production build pass after Center Details page.
- Build Super Admin Subscriptions Management page at `/super-admin/subscriptions`.
- Add summary cards, search/filters, desktop table, mobile cards with actions menu, expiring-soon section, and revenue snapshot.
- Add English/Arabic/Hebrew dictionary for Subscriptions Management.
- Link the shared Super Admin sidebar Subscriptions item to `/super-admin/subscriptions`.
- Verify web lint and production build pass after Subscriptions Management page.
- Build Super Admin Subscription Details page at `/super-admin/subscriptions/[id]`.
- Add id-keyed mock subscription details, payment history, renewal history, billing information, internal notes, and translated not-found state.
- Link Subscriptions Management `View` action to the matching Subscription Details route.
- Verify web lint and production build pass after Subscription Details page.
- Build Super Admin Domains Management page at `/super-admin/domains`.
- Add summary cards, search/filters, desktop table, mobile cards with actions menu, pending verification, SSL expiry warning, and domain health overview.
- Add English/Arabic/Hebrew dictionary for Domains Management.
- Link the shared Super Admin sidebar Domains item to `/super-admin/domains`.
- Verify web lint and production build pass after Domains Management page.
- Build Super Admin Domain Details page at `/super-admin/domains/[id]`.
- Add id-keyed mock domain details, DNS instructions, SSL certificate info, activity timeline, internal notes, and translated not-found state.
- Link Domains Management `View` action to the matching Domain Details route.
- Verify web lint and production build pass after Domain Details page.
- Build Super Admin Plans Management page at `/super-admin/plans`.
- Add summary cards, Add New Plan button, search/filters, plan cards, mobile actions menu, featured badges, and plan comparison preview.
- Add English/Arabic/Hebrew dictionary for Plans Management.
- Link the shared Super Admin sidebar Plans item to `/super-admin/plans`.
- Verify web lint and production build pass after Plans Management page.
- Build Super Admin Plan Details page at `/super-admin/plans/[id]`.
- Add id-keyed mock plan details, included features, current subscribers, upgrade paths, internal notes, and translated not-found state.
- Link Plans Management `View Plan` action to the matching Plan Details route.
- Verify web lint and production build pass after Plan Details page.
- Build Super Admin Users Management page at `/super-admin/users`.
- Add summary cards, Add New User button, search/filters, desktop table, mobile cards with actions menu, and Roles Preview.
- Add English/Arabic/Hebrew dictionary for Users Management.
- Link the shared Super Admin sidebar Users item to `/super-admin/users`.
- Prepare Users Management `View` action links for `/super-admin/users/[id]`.
- Verify web lint and production build pass after Users Management page.
- Build Super Admin User Details page at `/super-admin/users/[id]`.
- Add id-keyed mock user details, permissions summary, activity timeline, responsibilities, internal notes, and translated not-found state.
- Link Users Management `View` action to the matching User Details route.
- Verify web lint, production build, and dynamic route smoke checks after User Details page.
- Build Super Admin Notifications Management page at `/super-admin/notifications`.
- Add summary cards, filters, notifications table, mobile notification cards, action menu, and templates preview.
- Link the shared Super Admin sidebar Notifications item to `/super-admin/notifications`.
- Verify web lint, production build, route smoke test, and locale direction checks after Notifications page.
- Build Super Admin Settings Management page at `/super-admin/settings`.
- Add general platform, branding, security, notification, subscription default, domain default, backup, and system health settings panels.
- Link the shared Super Admin sidebar Settings item to `/super-admin/settings`.
- Verify web lint, production build, route smoke test, and locale direction checks after Settings page.
- Connect Add New Center wizard Step 6 Create Center action to the real API.
- Create full initial center setup transaction for `Center`, `BrandingSettings`, `Subscription`, optional `Domain`, center admin `User`, center admin `Role`, and `UserRole`.
- Add API-backed fetch behavior for Super Admin Centers Management and Center Details.

Next:
1. Confirm local/hosted PostgreSQL environment.
2. Create first Prisma migration for Phase 1 and Phase 2 models.
3. Add seed data for:
   - Platform owner role
   - Platform admin role
   - Center owner role
   - Default Phase 1 permissions
4. Add global validation pipe and DTO validation decorators before public API use.
5. Implement backend auth, tenancy guard, permission guard, module guard, and subscription guard.
6. Add OpenAPI docs for implemented Centers, Users, and Subscriptions endpoints.
7. Add integration tests for center creation, subscription creation, and center admin user linking after a PostgreSQL test database is available.
8. Add shared TypeScript package setup in `packages/shared`.
9. Add shared UI package setup in `packages/ui`.
10. Add root-level lint/build scripts once workspaces are configured.
11. Add environment variable strategy across apps/services/packages.
12. Add Docker Compose for local PostgreSQL if useful.
13. Add basic CI checks.
14. Prepare React Native Expo app in `apps/mobile` when mobile work begins.
15. Connect Super Admin Login to the future authentication flow after backend auth is implemented.
16. Replace Super Admin Dashboard mock data with API-backed data after backend modules are secured.
17. Replace Super Admin Centers mock data with API-backed data after Centers API auth/permissions are implemented.
18. Replace Super Admin Center Details mock data with API-backed data after Centers, Subscriptions, Domains, Branding, and Users APIs are secured.
19. Replace Super Admin Subscriptions mock data with API-backed data after Subscriptions and Payments APIs are implemented.
20. Replace Super Admin Subscription Details mock data with API-backed data after Subscriptions, Payments, Invoices, and Billing APIs are implemented.
21. Replace Super Admin Domains mock data with API-backed data after Domains and DNS verification APIs are implemented.
22. Replace Super Admin Domain Details mock data with API-backed data after Domains, DNS verification, and SSL management APIs are implemented.
23. Replace Super Admin Plans mock data with API-backed data after Plans and Modules APIs are implemented.
24. Replace Super Admin Plan Details mock data with API-backed data after Plans, Modules, and Subscriptions APIs are implemented.
25. Replace Super Admin Users mock data with API-backed data after Users and Permissions APIs are secured.
26. Replace Super Admin User Details mock data with API-backed data after Users, Roles, Permissions, Activity Log, and Admin Notes APIs are implemented.
27. Replace Super Admin Notifications mock data with API-backed data after Notifications, Activity Log, and delivery-channel APIs are implemented.
28. Replace Super Admin Settings mock data with API-backed data after Platform Settings, Branding, Security, Notifications, Domains, Backups, and Health APIs are implemented.
29. Add proper authenticated Super Admin protection around the center creation flow.
30. Add integration tests for the real Add New Center creation transaction with PostgreSQL.

Needs Confirmation:
- Whether Docker should be used locally.

## 4. Backend Foundation Tasks

Completed:
- Create PrismaService and initial database module.
- Create CentersModule controller/service/DTO foundation.
- Create UsersModule controller/service/DTO foundation.
- Create SubscriptionsModule controller/service/DTO foundation.
- Create CRUD-ready foundation for:
  - Create center
  - View center
  - List centers
  - Create subscription
  - Link center admin user

1. Create AuthModule.
2. Create TenancyModule.
3. Add global validation pipe.
4. Create RolesPermissionsModule.
5. Harden tenant-safe data access patterns.
6. Create guards:
   - Auth guard
   - Tenant guard
   - Permission guard
   - Module guard
   - Subscription guard
7. Add global validation pipe.
8. Add OpenAPI docs.
9. Add audit logging service.

## 5. Database Tasks

Completed:
- Phase 1 foundation models:
  - User
  - Role
  - Permission
  - UserRole
  - RolePermission
  - Center
  - Subscription
  - Domain
- Phase 2 business models:
  - Customer
  - Service
  - Appointment
  - Session
  - Notification
  - DynamicPage
- BrandingSettings
- Reviewed and improved core Super Admin models:
  - User
  - Center
  - Subscription
- Added API-compatible Prisma Client generation.

Next database tasks:
1. Create first migration after PostgreSQL environment is confirmed.
2. Add seed data for:
   - Super Admin role
   - Default permissions
   - Center Owner role
3. Add later schema only after confirmation:
   - SubscriptionPlan
   - ModuleDefinition
   - CenterModule
   - StaffMember
   - PageBlock
   - NotificationTemplate
   - FileAsset
   - AuditLog
   - Payments
   - Medical/treatment detail tables

## 6. Frontend Foundation Tasks

1. Create app shell.
2. Add remaining auth pages.
3. Add Super Admin routes.
4. Add Center Admin routes.
5. Add Customer Portal routes.
6. Add locale/direction provider.
7. Add tenant context provider.
8. Add shared components:
   - Data table
   - Form section
   - Modal
   - Drawer
   - Badge
   - Toast
   - Tabs
   - Language switcher
9. Add responsive navigation.

Completed frontend tasks:
- Super Admin login UI at `/super-admin/login`.
- Super Admin dashboard UI at `/super-admin/dashboard`.
- Super Admin centers management UI at `/super-admin/centers`.
- Super Admin subscriptions management UI at `/super-admin/subscriptions`.
- Super Admin subscription details UI at `/super-admin/subscriptions/[id]`.
- Super Admin domains management UI at `/super-admin/domains`.
- Super Admin domain details UI at `/super-admin/domains/[id]`.
- Super Admin plans management UI at `/super-admin/plans`.
- Super Admin plan details UI at `/super-admin/plans/[id]`.
- Super Admin users management UI at `/super-admin/users`.
- Super Admin user details UI at `/super-admin/users/[id]`.
- Super Admin notifications management UI at `/super-admin/notifications`.
- Super Admin settings management UI at `/super-admin/settings`.
- Super Admin Add New Center wizard UI at `/super-admin/centers/new`.
- Shared Super Admin layout used by Dashboard, Centers Management, and Add New Center wizard.

Next frontend tasks:
- Add stronger field-level disabled-state rules for Add New Center wizard before backend submission.
- Add user-facing API error details for duplicate domains, duplicate emails, and duplicate slugs.
- Decide whether center branding logo should upload immediately to storage or only after final wizard confirmation.
- Add backend-backed Super Admin Users and User Details data after auth and permissions APIs exist.
- Add backend-backed Super Admin Notifications data after notification APIs and read/archive actions exist.
- Add backend-backed Super Admin Settings data after platform settings and system health APIs exist.

## 7. First Feature Implementation Order

Recommended order:
1. Auth and users
2. Tenant resolution
3. Centers
4. Permissions
5. Subscriptions/modules
6. Domains
7. Branding/settings
8. Services/staff
9. Customers
10. Appointments
11. Sessions
12. Pages/public website
13. Customer portal
14. Notifications
15. Audit/backup

Reason:
- Tenant, auth, and permission foundations must exist before center features.

## 8. Testing Tasks

Required test focus:
- Auth behavior
- Permission checks
- Cross-tenant access blocking
- Module disabled behavior
- Subscription restricted behavior
- Appointment status transitions
- Customer portal ownership checks
- Functional UI behavior before marking any feature complete

Recommended:
- Backend unit tests for services/guards
- API integration tests for key endpoints
- Frontend smoke tests for core workflows

Permanent frontend QA checklist:
- Dynamic `[id]` pages must be tested with at least 3 ids.
- Each dynamic id must show different matching data.
- List `View` buttons must navigate to the correct details page for the clicked row.
- Edit buttons must open/edit the correct item, not the first item by accident.
- Mock details pages must use id-keyed mock data rather than one hardcoded object.
- Unknown ids must show a proper not-found or empty state.
- English, Arabic, and Hebrew must be tested after navigation.
- Desktop, tablet, and mobile widths must be tested.
- Verify no hydration errors, no unwanted horizontal overflow, and correct button contrast before completion.

## 9. Documentation Maintenance Tasks

Future agents must:
- Update `09_CURRENT_STATUS.md` after meaningful progress.
- Add decisions to `07_DECISIONS_LOG.md`.
- Add user-visible changes to `08_CHANGELOG.md`.
- Keep API changes reflected in `04_API_MAP.md`.
- Keep schema changes reflected in `02_DATABASE_SCHEMA.md`.
