# RoyalCare - Changelog

## 2026-04-26

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
