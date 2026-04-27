# RoyalCare - Architecture

Last updated: 2026-04-26
Status: System-wide multilingual i18n architecture defined

## 1. Architecture Goal

RoyalCare should be a clean, scalable, multi-tenant SaaS platform with strong separation between the RoyalCare Super Admin, each center's admin panel, public center websites, and customer portals.

The architecture must support:
- Multiple centers on one platform
- Custom domains per center
- Center-specific branding and modules
- Full system multilingual i18n
- RTL for Arabic and Hebrew
- LTR for English
- Appointments and sessions
- Customer portal
- Future React Native mobile app
- Strong permissions and auditability
- Backup and restore workflows

## 2. Planned Technology Stack

Frontend Web:
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- ESLint

Backend API:
- NestJS
- TypeScript
- REST API architecture
- ESLint

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
- `apps/web` contains the initialized Next.js web application.
- `apps/mobile` exists as the future React Native Expo location.
- `services/api` contains the initialized NestJS backend API application.
- `packages/database` contains the initialized Prisma/PostgreSQL database package.
- `packages/shared` exists for shared TypeScript contracts, constants, and validation schemas.
- `packages/ui` exists for shared UI components.

Web app baseline:
- Location: `apps/web`
- Initialized with `create-next-app@16.2.4`
- Uses Next.js `16.2.4`
- Uses React `19.2.4`
- Uses TypeScript
- Uses Tailwind CSS
- Uses App Router
- Uses ESLint
- Uses `src/` directory
- Uses import alias `@/*`
- Super Admin pages now share a reusable shell component at `apps/web/src/features/super-admin/layout/SuperAdminLayout.tsx`
- Global language state is provided by `apps/web/src/i18n/LanguageProvider.tsx`
- Initial locale is resolved server-side from the `royalcare_locale` cookie in `apps/web/src/app/layout.tsx` before UI renders.

API baseline:
- Location: `services/api`
- Initialized with `@nestjs/cli@11.0.21`
- Uses NestJS `11.x`
- Uses TypeScript
- Uses REST architecture
- Uses ESLint
- Uses global API prefix `api/v1`
- Default port constant is `3001`
- CORS is enabled for future web and mobile clients
- Health check endpoint exists at `GET /api/v1/health`

Database package baseline:
- Location: `packages/database`
- Package name: `@royalcare/database`
- Prisma ORM initialized
- PostgreSQL datasource initialized
- Prisma config exists at `packages/database/prisma.config.ts`
- Prisma schema exists at `packages/database/prisma/schema.prisma`
- Migration folder prepared at `packages/database/prisma/migrations`
- Seed folder prepared at `packages/database/prisma/seeds`
- TypeScript package structure prepared under `packages/database/src`
- Tenant scope helper prepared with `centerId`
- Full RoyalCare schema models are intentionally not created yet

No mobile, shared package, or UI package framework scaffolding has been generated yet.

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

Prepared routing groups:

```text
src/app/(public)
src/app/(super-admin)
src/app/(center-admin)
src/app/(portal)
```

Domain-based tenant resolution should determine which center is being viewed for public websites and customer portals.

Prepared web structure:

```text
apps/web/src/
  app/
    (public)/
    (super-admin)/
    (center-admin)/
    (portal)/
  components/
    data-display/
    forms/
    layout/
    navigation/
  config/
  features/
    auth/
    center-admin/
    customer-portal/
    public-site/
    super-admin/
      layout/
    tenancy/
  hooks/
  i18n/
  lib/
    api/
    auth/
    tenancy/
  providers/
  styles/
  types/
```

The generated demo homepage was removed. Feature pages have not been built yet.

Needs Confirmation:
- Whether Super Admin and Center Admin should live in the same Next.js app or separate apps.
- Whether public websites should be rendered from the same Next.js app or isolated for caching/security.

### 4.2 API Application

The NestJS API should own business logic and data access.

Prepared modules:
- AuthModule
- TenancyModule
- CentersModule
- SubscriptionsModule
- DomainsModule
- AppointmentsModule
- CustomersModule
- HealthModule
- NotificationsModule
- PermissionsModule
- ServicesModule
- SessionsModule
- UsersModule

Planned but not scaffolded yet:
- StaffModule
- PagesModule
- TemplatesModule
- BrandingModule
- FilesModule
- AuditLogModule
- BackupsModule

Prepared API structure:

```text
services/api/src/
  common/
    constants/
    decorators/
    dto/
    filters/
    guards/
    interceptors/
    interfaces/
    pipes/
  config/
  modules/
    appointments/
    auth/
    centers/
    customers/
    domains/
    health/
    notifications/
    permissions/
    services/
    sessions/
    subscriptions/
    tenancy/
    users/
```

API design should be mobile-ready. Avoid exposing web-only assumptions in core endpoints.

Database and Prisma are intentionally not connected yet.

### 4.3 Database

PostgreSQL with Prisma.

Multi-tenancy strategy:
- Shared database
- Shared schema
- Tenant isolation using `centerId` on center-owned records
- Global RoyalCare records do not use `centerId`

Every query for tenant-owned data must be scoped by `centerId` from trusted context, not from arbitrary user input.

Current database package structure:

```text
packages/database/
  prisma/
    schema.prisma
    migrations/
    seeds/
  src/
    backup/
    client/
    seeds/
    tenant/
    types/
  prisma.config.ts
  package.json
  tsconfig.json
```

Current schema status:
- Prisma and PostgreSQL are initialized.
- No final application models exist yet.
- The schema file documents the planned domains and tenant-isolation rule.
- `DATABASE_URL` is configured through environment variables.

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
- Fully responsive pages by default across desktop, tablet, and mobile
- No unwanted horizontal page scroll
- Strong form validation
- Reusable data tables, filters, drawers, modals, and form sections
- Avoid unnecessary visual complexity

Permanent responsive requirements:
- Every new page must fit the viewport without page-level horizontal scrolling.
- Tables may scroll horizontally only inside their own table container.
- Grid and flex layouts must use `min-width: 0`, `max-width: 100%`, and `minmax(0, ...)` tracks where needed to prevent overflow from long translated labels, domain names, action buttons, badges, or tables.
- Mobile layouts must stack content cleanly and keep action buttons usable.
- Tablet layouts should use 2-column card grids where appropriate.
- Desktop layouts may use multi-column compositions where useful.

Super Admin layout architecture:
- All Super Admin pages must use `SuperAdminLayout`.
- `SuperAdminLayout` owns the shared RoyalCare sidebar, top header, language switcher, account/profile area, mobile/tablet drawer, branding, and RTL/LTR behavior.
- Super Admin feature pages must not create custom page-specific navbars, sidebars, headers, or language switchers.
- Super Admin page components should provide page content and the active navigation key only.
- Arabic and Hebrew use RTL with sidebar/drawer on the right.
- English uses LTR with sidebar/drawer on the left.
- Desktop uses a persistent sidebar.
- Mobile/tablet uses a menu button and drawer.

Recommended frontend layers:
- Route-level pages
- Feature modules
- Shared app shells/layouts by system area, starting with `SuperAdminLayout`
- API clients
- Shared UI primitives
- Shared validation schemas where practical
- Auth/session provider
- Tenant/center context provider
- Locale/direction provider
- Translation provider
- Language switcher integrated with user profile/settings
- Global language provider initialized from a server-readable locale cookie, with `localStorage` used only as a browser-side mirror during the current UI phase

## 9. Internationalization

Languages:
- Arabic
- Hebrew
- English

Requirements:
- Full system i18n applies to:
  - Public Website
  - Super Admin Panel
  - Center Admin Panel
  - Customer Portal
- Arabic and Hebrew use RTL direction.
- English uses LTR direction.
- Language switching must be available from user profile/settings.
- Public center websites may also expose a public language switcher when multiple languages are enabled for that center.
- UI text must not be hardcoded in components.
- Translation files must be organized by locale and namespace.
- Locale, direction, and translation loading must be part of the app shell/provider architecture.
- Backend APIs should return stable codes/enums where possible; frontend translates user-facing labels.
- Database content that is managed by centers should support multilingual fields where needed.

Recommended locale codes:
- `ar`
- `he`
- `en`

Recommended direction map:

```text
ar -> rtl
he -> rtl
en -> ltr
```

Recommended web translation structure:

```text
apps/web/src/i18n/
  config.ts
  routing.ts
  dictionaries/
    ar/
      common.json
      auth.json
      super-admin.json
      center-admin.json
      portal.json
      public-site.json
      validation.json
    he/
      common.json
      auth.json
      super-admin.json
      center-admin.json
      portal.json
      public-site.json
      validation.json
    en/
      common.json
      auth.json
      super-admin.json
      center-admin.json
      portal.json
      public-site.json
      validation.json
```

Recommended namespaces:
- `common`
- `auth`
- `super-admin`
- `center-admin`
- `portal`
- `public-site`
- `validation`
- `notifications`
- `errors`

Language preference hierarchy:
1. Authenticated user profile setting.
2. Center default language for center-scoped experiences.
3. Browser `Accept-Language`, when appropriate.
4. Platform fallback: English.

Admin language switching:
- Super Admin users choose language from their own user profile/settings.
- Center Admin users choose language from their own user profile/settings.
- The selected language should persist per user.
- Language changes must update both `lang` and `dir` attributes.
- Current Super Admin UI stores selected language in the `royalcare_locale` cookie so the Next.js root layout can render the correct locale and direction before hydration.
- Current Super Admin UI also mirrors selected language in `localStorage` under `royalcare.locale` for browser-side continuity, but `localStorage` must not be the first-render source of truth.
- Super Admin pages must use `useLanguage()` from `LanguageProvider` instead of page-level locale state.
- `apps/web/src/app/layout.tsx` reads `royalcare_locale`, validates it against supported locales, applies `<html lang>` and `<html dir>`, and passes the resolved value into `LanguageProvider`.
- `LanguageProvider` updates the document `lang` and `dir` attributes globally after locale changes.
- Super Admin translated content must be rendered from the provider's `initialLocale`; pages must not briefly render English while waiting for hydration.
- Future authenticated implementation should migrate persistence from local-only storage to the user's profile/settings while keeping the same provider API where practical.

Customer Portal language switching:
- Customers choose language from profile/settings.
- If no customer preference exists, use center default language.

Public Website language behavior:
- Use center enabled languages.
- Use center default language when no explicit locale is selected.
- Do not expose languages that are disabled for the center.

Database multilingual content:
- Phase 2 Prisma schema uses JSON multilingual fields for services, dynamic pages, notifications, and branding language settings.
- JSON translation objects should use stable keys: `ar`, `he`, `en`.
- Future high-query multilingual content may move to translation tables if needed.

Implementation guardrails:
- No hardcoded user-facing UI text in React components.
- Form labels, validation messages, buttons, navigation, empty states, statuses, and errors must come from translation dictionaries.
- Shared components must accept translated labels from callers or use translation keys.
- Hydration-sensitive number, percent, currency, and date display must use deterministic RoyalCare formatting utilities, not direct `Intl.NumberFormat`, `Intl.DateTimeFormat`, or `toLocaleString()` calls inside React rendering.
- Current deterministic formatting utility lives at `apps/web/src/i18n/formatters.ts` and formats output from the selected app locale only.
- Avoid physical CSS directions such as `left` and `right` in reusable UI; prefer logical properties and `start`/`end` naming.
- Icons that imply direction must mirror under RTL.
- Tests or review checks should flag obvious hardcoded UI strings once i18n tooling is installed.

Needs Confirmation:
- Default language per center.
- Whether each page/service can have all three translations.
- Whether automatic fallback language is allowed.
- Preferred i18n library for Next.js.
- Whether URLs should include locale prefixes for all app areas or only public websites.

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
