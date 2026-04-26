# RoyalCare - Next Tasks

Last updated: 2026-04-26
Status: Web scaffold created; backend/database scaffolding pending

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

Next:
1. Choose package manager.
2. Choose monorepo tooling.
3. Add root workspace configuration.
4. Scaffold NestJS API with TypeScript in `services/api`.
5. Add Prisma/PostgreSQL setup in `packages/database`.
6. Add shared TypeScript package setup in `packages/shared`.
7. Add shared UI package setup in `packages/ui`.
8. Add root-level lint/build scripts once workspaces are configured.
9. Create initial Prisma schema.
10. Add environment variable structure.
11. Add Docker Compose for local PostgreSQL if useful.
12. Add basic CI checks.
13. Prepare React Native Expo app in `apps/mobile` when mobile work begins.

Needs Confirmation:
- Whether Docker should be used locally.

## 4. Backend Foundation Tasks

1. Create AuthModule.
2. Create TenancyModule.
3. Create CentersModule.
4. Create RolesPermissionsModule.
5. Create PrismaService and tenant-safe data access patterns.
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

1. Create Prisma models for:
   - Center
   - Domain
   - SubscriptionPlan
   - CenterSubscription
   - ModuleDefinition
   - CenterModule
   - User
   - CenterUser
   - Role
   - Permission
   - RolePermission
   - Customer
   - Service
   - StaffMember
   - Appointment
   - Session
   - Page
   - PageBlock
   - BrandingSettings
   - NotificationTemplate
   - FileAsset
   - AuditLog
2. Add indexes for tenant queries.
3. Add seed data for:
   - Super Admin role
   - Default permissions
   - Default modules
   - Default templates
4. Add migration.

## 6. Frontend Foundation Tasks

1. Create app shell.
2. Add auth pages.
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

Recommended:
- Backend unit tests for services/guards
- API integration tests for key endpoints
- Frontend smoke tests for core workflows

## 9. Documentation Maintenance Tasks

Future agents must:
- Update `09_CURRENT_STATUS.md` after meaningful progress.
- Add decisions to `07_DECISIONS_LOG.md`.
- Add user-visible changes to `08_CHANGELOG.md`.
- Keep API changes reflected in `04_API_MAP.md`.
- Keep schema changes reflected in `02_DATABASE_SCHEMA.md`.
