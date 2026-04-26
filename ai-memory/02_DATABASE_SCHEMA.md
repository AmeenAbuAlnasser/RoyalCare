# RoyalCare - Database Schema

Last updated: 2026-04-26
Status: Phase 2 Prisma business foundation implemented

## 1. Database Strategy

Database:
- PostgreSQL

ORM:
- Prisma

Initialized location:
- `packages/database`
- Prisma schema: `packages/database/prisma/schema.prisma`
- Prisma config: `packages/database/prisma.config.ts`
- Migrations folder: `packages/database/prisma/migrations`
- Seeds folder: `packages/database/prisma/seeds`
- TypeScript helpers: `packages/database/src`

Current implementation status:
- Prisma has been initialized correctly.
- PostgreSQL datasource is configured.
- Phase 1 foundation models are implemented.
- Phase 2 business foundation models are implemented.
- Payments, medical diagnosis details, staff scheduling, file assets, audit logs, module tables, and dedicated page-block tables are intentionally not created yet.

Multi-tenancy:
- Shared database
- Shared schema
- Tenant isolation using `centerId`

Rule:
- Every center-owned table must include `centerId` unless there is a documented reason not to.
- Every query for tenant-owned data must be scoped by trusted `centerId`.
- The database package exposes a tenant scope helper with `TENANT_ID_FIELD = 'centerId'`.

## 2. Global vs Tenant-Owned Data

Global RoyalCare data:
- Platform admins
- Subscription plans
- Centers
- Domains
- Industry templates
- Global module definitions
- Global permissions
- Global audit events
- Backup jobs

Tenant-owned center data:
- Center users/staff
- Customers
- Appointments
- Sessions
- Services
- Pages
- Branding
- Notification templates
- Files
- Center settings

## 3. Core Models - Draft

Implemented models:
- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `Center`
- `Subscription`
- `Domain`
- `Customer`
- `Service`
- `Appointment`
- `Session`
- `Notification`
- `DynamicPage`
- `BrandingSettings`

Not implemented yet:
- Payments
- Medical diagnosis details
- Staff scheduling
- File assets
- Audit Logs
- Module tables
- Dedicated page blocks

### 3.0 Phase 1 Implementation Notes

Primary key strategy:
- UUID string primary keys using PostgreSQL `uuid`.

Timestamp strategy:
- Implemented models include `createdAt`.
- Mutable business records include `updatedAt`.
- Access and lifecycle timestamps are included where needed, such as `lastLoginAt`, `activatedAt`, `suspendedAt`, `cancelledAt`, `assignedAt`, `revokedAt`, `verifiedAt`, and subscription period fields.

Tenant strategy:
- `Center` is the tenant.
- Tenant-scoped role assignments use `UserRole.centerId`.
- Center-owned roles can use `Role.centerId`.
- `Subscription` and `Domain` are always center-owned and require `centerId`.

RBAC strategy:
- `Permission` defines atomic permission keys.
- `Role` groups permissions and can be platform-level, center-level, or customer-level.
- `RolePermission` is the explicit role-permission join table.
- `UserRole` is the explicit user-role assignment table, optionally scoped to `centerId`.

Subscription control:
- `Subscription` includes `status`, `billingInterval`, `currentPeriodStart`, `currentPeriodEnd`, `trialEndsAt`, `expiresAt`, `cancelAt`, and `cancelledAt`.
- Indexes support lookup by center/status, expiry, and period end.

Domain control:
- `Domain.hostname` is globally unique.
- Domains are center-owned.
- Domain verification and activation timestamps are included.
- `isPrimary` is included; enforcing only one primary domain per center may require application logic or a future database-level partial index.

Known Prisma/PostgreSQL limitation:
- Some uniqueness rules involving nullable `centerId`, such as global platform role uniqueness, may require application-level enforcement or a future raw SQL partial unique index.

Needs Confirmation:
- Whether platform roles and center role templates should be separate tables later.
- Whether subscriptions need a separate `SubscriptionPlan` table in Phase 2.
- Whether domain primary uniqueness should be enforced with raw SQL partial indexes.

### 3.0.1 Phase 2 Implementation Notes

Tenant strategy:
- Every Phase 2 model includes required `centerId`.
- Every Phase 2 model has a relation to `Center`.
- Customer, service, appointment, session, notification, dynamic page, and branding records are all center-owned.

Multilingual strategy:
- `Service.name` and `Service.description` use JSON to support `ar`, `he`, and `en`.
- `DynamicPage.title`, `DynamicPage.content`, `DynamicPage.seoTitle`, and `DynamicPage.seoDescription` use JSON for multilingual website content.
- `Notification.title` and `Notification.body` use JSON for multilingual message content.
- `BrandingSettings.defaultLanguage` uses `SupportedLanguage`.
- `BrandingSettings.enabledLanguages` uses JSON so centers can enable combinations of `ar`, `he`, and `en` without adding a join table yet.

Business scope:
- Customer identity, service catalog, booking records, session records, notifications, dynamic pages, and branding settings are now represented.
- Payments are not included.
- Medical diagnosis details are not included.
- Staff scheduling is not included yet.

### 3.1 Center

Purpose:
- Represents a subscribed center/clinic/wellness business.

Fields:
- `id`
- `name`
- `slug`
- `centerType`
- `status`
- `primaryLanguage`
- `timezone`
- `createdAt`
- `updatedAt`

Relationships:
- Has many domains
- Has many subscriptions
- Has many user role assignments
- Has many center-scoped roles
- Has many customers
- Has many appointments
- Has branding settings
- Has enabled modules

Statuses:
- `trial`
- `active`
- `past_due`
- `suspended`
- `cancelled`

Needs Confirmation:
- Whether one legal company can own multiple centers.
- Whether branch support is needed in v1.

### 3.2 Domain

Purpose:
- Maps a custom domain or RoyalCare subdomain to a center.

Fields:
- `id`
- `centerId`
- `hostname`
- `type`
- `status`
- `isPrimary`
- `verificationToken`
- `verifiedAt`
- `createdAt`
- `updatedAt`

Types:
- `custom`
- `subdomain`

Statuses:
- `pending`
- `verified`
- `active`
- `failed`
- `disabled`

### 3.3 SubscriptionPlan

Purpose:
- Defines RoyalCare plans and allowed features.

Implementation status:
- Not implemented in Phase 1.
- Phase 1 uses `Subscription.planCode` and `Subscription.planName`.
- A dedicated plan table can be added later when pricing/feature limits are confirmed.

Fields:
- `id`
- `name`
- `code`
- `price`
- `currency`
- `billingInterval`
- `limits`
- `features`
- `isActive`
- `createdAt`
- `updatedAt`

Needs Confirmation:
- Billing intervals.
- Currency.
- Whether pricing differs by country or center type.

### 3.4 Subscription

Purpose:
- Tracks current and historical subscription state for a center.

Fields:
- `id`
- `centerId`
- `planCode`
- `planName`
- `status`
- `billingInterval`
- `currentPeriodStart`
- `currentPeriodEnd`
- `trialEndsAt`
- `expiresAt`
- `cancelAt`
- `cancelledAt`
- `externalProvider`
- `externalSubscriptionId`
- `metadata`
- `createdAt`
- `updatedAt`

Needs Confirmation:
- Payment provider.
- Whether manual/offline subscriptions are supported.

### 3.5 ModuleDefinition

Purpose:
- Global catalog of optional modules.

Fields:
- `id`
- `code`
- `name`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

Example modules:
- `appointments`
- `sessions`
- `customer_portal`
- `pages_builder`
- `notifications`
- `laser_package`
- `physio_package`
- `hijama_package`
- `beauty_package`

### 3.6 CenterModule

Purpose:
- Enables or disables modules per center.

Fields:
- `id`
- `centerId`
- `moduleId`
- `isEnabled`
- `enabledAt`
- `disabledAt`
- `settings`

### 3.7 User

Purpose:
- Represents platform users, center admins, staff, and possibly customers if customer auth is unified.

Fields:
- `id`
- `email`
- `phone`
- `passwordHash`
- `fullName`
- `status`
- `createdAt`
- `updatedAt`

Needs Confirmation:
- Whether customers share the same `User` table or have separate auth identity.
- Whether phone login is required.
- Whether passwordless login is required.

### 3.8 UserRole

Purpose:
- Connects a user to a role and optionally scopes the assignment to a center.

Fields:
- `id`
- `centerId`
- `userId`
- `roleId`
- `status`
- `assignedAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

Rules:
- A user may belong to multiple centers if explicitly supported.
- Access to center data requires an active center-scoped UserRole, except Super Admin/platform roles.

### 3.9 Role

Purpose:
- Defines roles globally or per center.

Fields:
- `id`
- `centerId` nullable
- `name`
- `code`
- `scope`
- `createdAt`
- `updatedAt`

Scopes:
- `super_admin`
- `center`
- `customer`

### 3.10 Permission

Purpose:
- Defines atomic permission keys.

Fields:
- `id`
- `key`
- `description`
- `scope`

Example keys:
- `centers.read`
- `centers.create`
- `centers.update`
- `subscriptions.manage`
- `customers.read`
- `customers.create`
- `appointments.manage`
- `pages.publish`

### 3.11 RolePermission

Purpose:
- Many-to-many relation between roles and permissions.

Fields:
- `id`
- `roleId`
- `permissionId`

### 3.12 Customer

Purpose:
- Represents an end customer of a center.

Fields:
- `id`
- `centerId`
- `userId` nullable
- `fullName`
- `email`
- `phone`
- `language`
- `notes`
- `status`
- `createdAt`
- `updatedAt`
- `archivedAt`

Rules:
- Customer data is tenant-owned.
- A customer in one center must not be visible to another center unless a future global identity feature explicitly allows it.

Needs Confirmation:
- Required customer fields by industry.
- Data privacy/regulatory requirements.
- Whether customers should be globally linked across centers or isolated per center only.

### 3.13 Service

Purpose:
- Defines services/treatments offered by a center.

Fields:
- `id`
- `centerId`
- `name` JSON translations
- `description` JSON translations
- `durationMinutes`
- `price`
- `currency`
- `category`
- `status`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `archivedAt`

Needs Confirmation:
- Whether packages/bundles are needed in v1.

### 3.14 StaffMember

Purpose:
- Represents staff who can perform services or manage appointments.

Fields:
- `id`
- `centerId`
- `userId` nullable
- `fullName`
- `title`
- `bio`
- `phone`
- `email`
- `isBookable`
- `status`
- `createdAt`
- `updatedAt`

### 3.15 Appointment

Purpose:
- Represents booking records.

Fields:
- `id`
- `centerId`
- `customerId`
- `serviceId` nullable
- `startsAt`
- `endsAt`
- `status`
- `source`
- `language`
- `notes`
- `cancelledAt`
- `completedAt`
- `createdAt`
- `updatedAt`

Statuses:
- `requested`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

Sources:
- `admin`
- `website`
- `customer_portal`
- `import`

Needs Confirmation:
- Whether appointments require approval or can be auto-confirmed.
- Cancellation rules.
- Reminder schedule.
- Staff assignment/scheduling model.

### 3.16 Session

Purpose:
- Tracks actual treatment/session history, especially for physio, laser packages, hijama, and wellness programs.

Fields:
- `id`
- `centerId`
- `customerId`
- `appointmentId` nullable
- `serviceId` nullable
- `sessionNumber`
- `status`
- `notes`
- `performedAt`
- `createdAt`
- `updatedAt`

Needs Confirmation:
- Industry-specific session fields.
- Whether session notes are visible to customers.
- Whether staff/practitioner assignment is required in Phase 3.

### 3.17 DynamicPage

Purpose:
- Dynamic website page for a center.

Fields:
- `id`
- `centerId`
- `slug`
- `title` JSON translations
- `content` JSON blocks/translations
- `status`
- `seoTitle` JSON translations
- `seoDescription` JSON translations
- `publishedAt`
- `createdAt`
- `updatedAt`
- `archivedAt`

Rules:
- Slugs are unique per center.
- Public website must only show published pages.
- Page block structure is stored in `content` JSON for now.

Needs Confirmation:
- Whether a dedicated `PageBlock` table is required later for advanced page builder editing.

### 3.18 PageBlock

Purpose:
- Structured page-builder blocks.

Implementation status:
- Not implemented in Phase 2.
- `DynamicPage.content` JSON is used for the current foundation.

Fields:
- `id`
- `centerId`
- `pageId`
- `type`
- `sortOrder`
- `content`
- `settings`
- `createdAt`
- `updatedAt`

Rules:
- Use structured JSON for block content.
- Validate block schemas per type.

### 3.19 BrandingSettings

Purpose:
- Stores center branding.

Fields:
- `id`
- `centerId`
- `logoUrl`
- `primaryColor`
- `secondaryColor`
- `accentColor`
- `defaultLanguage`
- `enabledLanguages`
- `theme`
- `createdAt`
- `updatedAt`

Rules:
- One branding settings record per center.
- `enabledLanguages` should contain supported language codes: `ar`, `he`, `en`.

### 3.20 Notification

Purpose:
- Stores notification records per center and channel.

Fields:
- `id`
- `centerId`
- `customerId`
- `recipientUserId`
- `channel`
- `status`
- `eventKey`
- `language`
- `title` JSON translations
- `body` JSON translations
- `recipientEmail`
- `recipientPhone`
- `sentAt`
- `failedAt`
- `failureReason`
- `metadata`
- `createdAt`
- `updatedAt`

Channels:
- `email`
- `sms`
- `whatsapp`
- `in_app`

Needs Confirmation:
- Whether reusable `NotificationTemplate` should be added later.
- Provider-specific delivery log fields.

### 3.21 FileAsset

Purpose:
- Tracks uploaded files.

Fields:
- `id`
- `centerId` nullable
- `uploadedByUserId`
- `storageKey`
- `publicUrl`
- `mimeType`
- `sizeBytes`
- `purpose`
- `createdAt`

Rules:
- Center-owned files should include `centerId`.
- Sensitive files should not be publicly accessible.

### 3.22 AuditLog

Purpose:
- Records important system actions.

Fields:
- `id`
- `centerId` nullable
- `actorUserId` nullable
- `scope`
- `action`
- `entityType`
- `entityId`
- `metadata`
- `ipAddress`
- `userAgent`
- `createdAt`

## 4. Translation Strategy

Options:
- Separate translation tables per entity.
- JSON field with locale keys.
- Hybrid approach.

Recommended initial approach:
- Use translation tables for major public content if strong querying is needed.
- Use JSON locale maps for smaller configurable labels/settings.

Needs Confirmation:
- Translation completeness requirements.
- Whether every center must provide Arabic, Hebrew, and English.

## 5. Indexing Requirements

Recommended indexes:
- `centerId` on all tenant-owned tables
- Unique `Domain.hostname`
- Unique `Center.slug`
- Appointment by `centerId`, `startsAt`
- Customer by `centerId`, `phone`
- Customer by `centerId`, `email`
- DynamicPage unique by `centerId`, `slug`
- Service by `centerId`, `status`
- Session by `centerId`, `performedAt`
- Notification by `centerId`, `status`
- BrandingSettings unique by `centerId`
- AuditLog by `centerId`, `createdAt`

Needs Confirmation:
- Whether customer email/phone uniqueness is required per center.

## 6. Data Isolation Rules

Mandatory:
- Center admin users can only access records for centers they belong to.
- Customer users can only access their own customer record within a center.
- Super Admin can access global records and tenant records for support/admin purposes.
- Every API must apply tenant isolation before returning data.

## 7. Migration Policy

Recommended:
- All schema changes through Prisma migrations.
- Never manually edit production database schema.
- Review tenant isolation impact for every new model.
- Add indexes during migration design, not after performance issues appear.
