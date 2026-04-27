# RoyalCare - Decisions Log

Last updated: 2026-04-26
Status: Initial decisions log

This file records architectural and product decisions. Future agents must append new decisions here instead of silently changing direction.

## Decision Format

Use this format:

```text
## YYYY-MM-DD - Decision Title

Decision:
- What was decided.

Reason:
- Why this direction was chosen.

Impact:
- What this affects.

Needs Confirmation:
- Any remaining uncertainty.
```

## 2026-04-26 - Project Initialized as RoyalCare

Decision:
- The project name is RoyalCare.
- RoyalCare is a multi-tenant SaaS platform for laser centers, physiotherapy clinics, hijama centers, beauty clinics, and wellness centers.

Reason:
- This defines the parent platform and its initial target industries.

Impact:
- All architecture, database, UI, and permission decisions should support multi-center SaaS behavior.

## 2026-04-26 - Three System Levels

Decision:
- RoyalCare has three system levels:
  - Super Admin
  - Center Owner Admin Panel
  - Customer Portal

Reason:
- The platform must support RoyalCare operations, center operations, and end-customer self-service.

Impact:
- Permissions, routing, UI, and API design must clearly separate these levels.

## 2026-04-26 - Planned Technology Stack

Decision:
- Frontend Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Future Mobile: React Native Expo

Reason:
- This stack supports scalable TypeScript development across web, backend, and future mobile.

Impact:
- Repository structure, API contracts, database schema, and shared types should align with TypeScript-first development.

Needs Confirmation:
- Package manager.
- Monorepo tooling.
- Hosting provider.

## 2026-04-26 - Tenant Isolation by centerId

Decision:
- Tenant isolation will use `centerId` on tenant-owned records.

Reason:
- RoyalCare manages many centers in one platform. A shared database/shared schema model is practical and scalable for this SaaS stage.

Impact:
- Every tenant-owned table must include `centerId`.
- Every tenant-owned query must be scoped by trusted `centerId`.
- Cross-tenant access tests are required for sensitive modules.

## 2026-04-26 - Multi-Language and RTL Are First-Class Requirements

Decision:
- Arabic, Hebrew, and English are supported languages.
- Arabic and Hebrew require RTL support.
- English requires LTR support.
- i18n applies to the Public Website, Super Admin Panel, Center Admin Panel, and Customer Portal.
- User-facing UI text must come from translation dictionaries, not hardcoded component strings.
- Language switching must be available from user profile/settings for authenticated experiences.

Reason:
- The platform targets centers and customers who may use RTL languages.
- Retrofitting i18n later would require expensive rewrites across routing, layouts, forms, validation, status labels, and content management.

Impact:
- UI layout, content model, routing, templates, and translations must support RTL from the beginning.
- Web app architecture needs locale/direction providers and translation namespaces.
- Database content for center-managed public content should support `ar`, `he`, and `en`.
- Admin panels must be designed with logical spacing and mirrored navigation behavior.

Needs Confirmation:
- Default language per center.
- Whether every center must provide all three languages.
- Preferred i18n library and URL strategy.

## 2026-04-26 - Admin UI Must Stay Simple and Practical

Decision:
- RoyalCare admin interfaces should be simple, responsive, operational, and avoid unnecessary complexity.

Reason:
- Center owners and staff need daily-use workflows, not decorative UI.

Impact:
- Prefer clear tables, forms, filters, and dashboards over complex visual experiences.

## 2026-04-26 - REST API Recommended for Initial Build

Decision:
- REST is the recommended initial API style.

Reason:
- REST is simple, predictable, mobile-friendly, and works well with NestJS OpenAPI documentation.

Impact:
- API planning uses `/api/v1` REST endpoints.

Needs Confirmation:
- Whether the user specifically wants GraphQL.

## 2026-04-26 - Database Package Initialized Before Final Schema

Decision:
- Prisma/PostgreSQL was initialized inside `packages/database`.
- The full RoyalCare schema was not created yet.
- The database package owns Prisma schema, migrations, seeds, TypeScript helpers, and tenant-scope helpers.

Reason:
- The project needs a correct production-ready database foundation before committing to final model fields.
- The user explicitly requested Prisma initialization and architecture preparation without a full final schema.

Impact:
- Future schema work should happen in `packages/database/prisma/schema.prisma`.
- Tenant-owned models must include `centerId`.
- Database helpers and seed scripts should live under `packages/database/src`.

Needs Confirmation:
- Final MVP data model fields.
- PostgreSQL hosting/local development strategy.
- Backup retention and restore process.

## 2026-04-26 - Phase 1 Prisma Foundation Models

Decision:
- The first production-ready Prisma foundation includes only:
  - `User`
  - `Role`
  - `Permission`
  - `UserRole`
  - `RolePermission`
  - `Center`
  - `Subscription`
  - `Domain`
- Customer, appointment, service, session, notification, dynamic page, branding, and audit models are deferred.

Reason:
- Identity, RBAC, tenant lifecycle, subscription control, and custom domains are the foundation for every later RoyalCare feature.
- Building these first reduces migration risk before adding operational center data.

Impact:
- Backend auth, tenancy, permissions, subscription, and domain modules can now be implemented against a stable Phase 1 schema.
- Future tenant-owned tables must reference `Center` through `centerId`.

Needs Confirmation:
- Whether a dedicated `SubscriptionPlan` table should be added before billing integration.
- Whether domain primary uniqueness should use application logic or a PostgreSQL partial unique index.
- Whether platform role uniqueness should be enforced through application logic or raw SQL partial indexes.

## 2026-04-26 - Phase 2 Business Prisma Models

Decision:
- Added Phase 2 business models:
  - `Customer`
  - `Service`
  - `Appointment`
  - `Session`
  - `Notification`
  - `DynamicPage`
  - `BrandingSettings`
- Payments, medical diagnosis details, staff scheduling, audit logs, file assets, and dedicated page blocks remain deferred.

Reason:
- RoyalCare needs tenant-owned operational data after the identity/RBAC/center foundation.
- The selected models support first center workflows without overcomplicating healthcare-specific or payment details too early.

Impact:
- Center admin, customer portal, public website pages, service catalog, appointments, sessions, notifications, and branding can now be built against a concrete schema foundation.
- Every Phase 2 business model is linked to `Center` through `centerId`.

Needs Confirmation:
- Exact appointment approval/cancellation rules.
- Whether staff assignment is required before MVP.
- Whether reusable notification templates should be added.
- Whether advanced page blocks should become a separate table.

## 2026-04-26 - System-Wide i18n Architecture

Decision:
- RoyalCare will use a production-ready translation architecture across all user-facing surfaces:
  - Public Website
  - Super Admin Panel
  - Center Admin Panel
  - Customer Portal
- Required locales are `ar`, `he`, and `en`.
- Direction mapping is `ar -> rtl`, `he -> rtl`, `en -> ltr`.
- Translation files will be organized by locale and namespace.
- Language switching will be managed through user profile/settings for authenticated areas.
- Public websites will use center enabled languages and center default language.

Reason:
- Multilingual behavior affects routing, layouts, validation, content, navigation, notifications, and database content.
- Establishing the architecture now avoids a future rebuild.

Impact:
- Future UI components should not include hardcoded user-facing strings.
- App shells must set `lang` and `dir` from active locale.
- Admin layouts must use logical CSS properties and support mirrored RTL navigation.
- Translation dictionaries should include namespaces such as `common`, `auth`, `super-admin`, `center-admin`, `portal`, `public-site`, `validation`, and `errors`.

Needs Confirmation:
- Preferred Next.js i18n library.
- Whether locale prefixes are required in URLs for admin panels or only public websites.
- Whether incomplete center translations should fall back to center default language or English.

## 2026-04-26 - Official RoyalCare Branding System

Decision:
- The uploaded RoyalCare logo is the official platform logo.
- The official RoyalCare platform colors are:
  - Royal Navy Blue `#0B2D5C`
  - Luxury Gold `#C8A45D`
  - Soft White `#F8FAFC`
  - Neutral Gray `#E5E7EB`
- The Super Admin Login and Super Admin Dashboard now use this branding system.

Reason:
- RoyalCare needs a consistent, premium, medical SaaS visual identity before more screens are built.
- Applying the brand system early prevents inconsistent colors and logo usage across future admin, portal, and public surfaces.

Impact:
- Future platform UI should reuse these brand tokens.
- Royal Navy should be the primary action/sidebar/header color.
- Luxury Gold should remain an accent color.
- Cards, language switchers, and profile controls should use Soft White/white surfaces with Neutral Gray borders.

Needs Confirmation:
- Whether center admin surfaces should keep RoyalCare platform branding or blend RoyalCare structure with center brand colors.
