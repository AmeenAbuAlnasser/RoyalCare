# RoyalCare - Architecture

Last updated: 2026-04-26
Status: Monorepo folder structure initialized

## 1. Architecture Goal

RoyalCare should be a clean, scalable, multi-tenant SaaS platform with strong separation between the RoyalCare Super Admin, each center's admin panel, public center websites, and customer portals.

The architecture must support:
- Multiple centers on one platform
- Custom domains per center
- Center-specific branding and modules
- Multi-language and RTL
- Appointments and sessions
- Customer portal
- Future React Native mobile app
- Strong permissions and auditability
- Backup and restore workflows

## 2. Planned Technology Stack

Frontend Web:
- Next.js
- TypeScript

Backend API:
- NestJS
- TypeScript

Database:
- PostgreSQL
- Prisma ORM

Future Mobile:
- React Native Expo

Needs Confirmation:
- Package manager: npm, pnpm, yarn, or bun.
- Monorepo tooling: Turborepo, Nx, or simple workspace.
- Deployment provider.
- Authentication provider.
- File storage provider.
- Email/SMS/WhatsApp notification providers.

## 3. Repository Structure

The project uses a production-ready monorepo layout with separate top-level areas for frontend apps, backend services, and shared packages.

```text
RoyalCare/
  apps/
    web/
      # Next.js app for Super Admin, Center Admin, Customer Portal, and public websites
    mobile/
      # Future React Native Expo app
  services/
    api/
      # NestJS backend API service
  packages/
    database/
      # Prisma schema, migrations, generated client setup, seeds, and database utilities
    shared/
      # Shared TypeScript types, constants, validation schemas
    ui/
      # Shared UI components for web and future compatible primitives where practical
  ai-memory/
    # Long-term project memory
  README.md
  AGENTS.md
  CLAUDE.md
```

Current folder status:
- `apps/web` exists as the future Next.js frontend location.
- `apps/mobile` exists as the future React Native Expo location.
- `services/api` exists as the future NestJS backend API location.
- `packages/database` exists as the future Prisma/PostgreSQL package location.
- `packages/shared` exists for shared TypeScript contracts, constants, and validation schemas.
- `packages/ui` exists for shared UI components.

No dependencies have been installed yet. No framework scaffolding has been generated yet.

Needs Confirmation:
- Whether to use npm, pnpm, yarn, or bun workspaces.
- Whether to use Turborepo, Nx, or simple package-manager workspaces.
- Whether `packages/database` should own all Prisma files or only export database client utilities while migrations live elsewhere. Current recommendation: keep Prisma schema, migrations, seeds, and database client setup in `packages/database`.

## 4. High-Level System Components

### 4.1 Web Application

The Next.js app should serve:
- Super Admin dashboard
- Center Owner Admin Panel
- Customer Portal
- Public center websites

Recommended routing groups:

```text
/super-admin
/admin
/portal
/(public-site)
```

Domain-based tenant resolution should determine which center is being viewed for public websites and customer portals.

Needs Confirmation:
- Whether Super Admin and Center Admin should live in the same Next.js app or separate apps.
- Whether public websites should be rendered from the same Next.js app or isolated for caching/security.

### 4.2 API Application

The NestJS API should own business logic and data access.

Suggested modules:
- AuthModule
- TenancyModule
- CentersModule
- SubscriptionsModule
- DomainsModule
- UsersModule
- RolesPermissionsModule
- CustomersModule
- ServicesModule
- StaffModule
- AppointmentsModule
- SessionsModule
- PagesModule
- TemplatesModule
- BrandingModule
- NotificationsModule
- FilesModule
- AuditLogModule
- BackupsModule

API design should be mobile-ready. Avoid exposing web-only assumptions in core endpoints.

### 4.3 Database

PostgreSQL with Prisma.

Multi-tenancy strategy:
- Shared database
- Shared schema
- Tenant isolation using `centerId` on center-owned records
- Global RoyalCare records do not use `centerId`

Every query for tenant-owned data must be scoped by `centerId` from trusted context, not from arbitrary user input.

### 4.4 File Storage

Expected file types:
- Center logos
- Service images
- Page images
- Staff images
- Customer attachments, if enabled
- Backup exports, if enabled

Needs Confirmation:
- Storage provider: S3-compatible, local disk, Cloudinary, Supabase Storage, etc.
- Whether medical/customer attachments are needed in v1.

### 4.5 Notifications

Notification channels may include:
- Email
- SMS
- WhatsApp
- In-app notifications

Needs Confirmation:
- Required channels for MVP.
- Provider choices.
- Whether notification templates are editable per center.

## 5. Tenant Resolution

Tenant resolution should support:
- Custom domains
- Temporary RoyalCare subdomains
- Admin panel center selection for Super Admin support

Recommended logic:
1. Read request host.
2. Match host to active domain record.
3. Resolve `centerId`.
4. Attach tenant context to request.
5. Enforce subscription/module access.
6. Enforce user permissions.

For authenticated center admin routes, the logged-in user's allowed centers must be checked against the resolved or selected center.

## 6. Security Architecture

Core security rules:
- Never trust client-provided `centerId` alone.
- Derive tenant context from domain, route, session, or Super Admin selection.
- All tenant-owned queries must be center-scoped.
- Use role-based permissions with optional fine-grained permission keys.
- Log sensitive administrative actions.
- Keep Super Admin access separate from center admin access.
- Protect customer portal data by customer ownership and `centerId`.

Recommended backend enforcement:
- Tenant guard
- Auth guard
- Permission guard
- Subscription/module guard
- Prisma query helpers or repository layer enforcing `centerId`

## 7. API Style

Recommended API style:
- REST for initial implementation
- JSON request/response
- Versioned base path, e.g. `/api/v1`
- Consistent pagination, filtering, and sorting
- DTO validation using NestJS validation pipes
- OpenAPI documentation generated from NestJS decorators

Needs Confirmation:
- Whether GraphQL is desired. Current recommendation: REST first for simplicity.

## 8. Frontend Architecture

Frontend priorities:
- Simple admin UI
- RTL support from the beginning
- Mobile-ready responsive layouts
- Strong form validation
- Reusable data tables, filters, drawers, modals, and form sections
- Avoid unnecessary visual complexity

Recommended frontend layers:
- Route-level pages
- Feature modules
- API clients
- Shared UI primitives
- Shared validation schemas where practical
- Auth/session provider
- Tenant/center context provider
- Locale/direction provider

## 9. Internationalization

Languages:
- Arabic
- Hebrew
- English

Requirements:
- Locale-aware routing or tenant-level language selection
- RTL layout support for Arabic and Hebrew
- LTR layout support for English
- Translation files organized by namespace
- Database content may need per-locale fields or translation tables

Needs Confirmation:
- Default language per center.
- Whether each page/service can have all three translations.
- Whether automatic fallback language is allowed.

## 10. Backup Architecture

Backup system should cover:
- PostgreSQL database
- Uploaded files
- Configuration exports for tenant settings

Recommended:
- Automated scheduled database backups
- Backup metadata table
- Manual backup trigger for Super Admin
- Restore process documented and tested
- Retention policy configurable

Needs Confirmation:
- Backup frequency.
- Backup retention period.
- Whether per-center export/restore is required.

## 11. Future Mobile Architecture

The API should be shaped so React Native Expo can reuse:
- Auth endpoints
- Customer portal endpoints
- Appointment endpoints
- Notification endpoints
- Profile endpoints

Avoid browser-only API assumptions. Return structured data, not server-rendered fragments.

Potential mobile apps:
- Customer app
- Center staff app
- Owner dashboard app

Needs Confirmation:
- First mobile target: customer app, staff app, or owner app.
