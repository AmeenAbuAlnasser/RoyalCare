## 2026-06-17 - Booking Request Patient Area

- `BookingRequest.patientArea String? @db.VarChar(120)` stores the optional city/area submitted from the public booking request form.
- Migration `20260617123000_add_booking_request_patient_area` adds the nullable column without requiring a full address.
- `BookingRequest.branchId String? @db.Uuid` links a public booking request to the selected `CenterBranch` when a center has branches.
- Migration `20260617124500_add_booking_request_branch` adds the nullable branch relation and `(centerId, branchId)` index.

## 2026-06-17 - Public Booking Mode

- `PublicBookingMode` enum was added with `SIMPLE_REQUEST` and `DIRECT_BOOKING`.
- `BrandingSettings.publicBookingMode PublicBookingMode @default(SIMPLE_REQUEST)` controls how each center public website collects booking requests.
- `BookingRequestSource` enum was added with `PUBLIC_WEBSITE`, `CUSTOMER_PORTAL`, and `ADMIN`.
- `BookingRequest.source BookingRequestSource @default(PUBLIC_WEBSITE)` records where a request came from.
- `BookingRequest.requestedDate` is now nullable so simple public contact requests can be stored without forcing a fake appointment date.
- Migration `20260617120000_add_public_booking_mode` adds these fields and indexes `(centerId, source)`.

## 2026-06-07 - Staff Provider Flag

- `UserRole.providerEnabled Boolean @default(false)` was added to make appointment-provider visibility explicit per center staff assignment.
- Migration `20260607130000_add_staff_provider_enabled` adds the column, backfills existing active `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, and `STAFF` assignments plus active center-owner assignments to `providerEnabled=true`, and indexes `(centerId, providerEnabled, status)`.
- Provider visibility is intentionally not derived from role alone anymore; `CENTER_OWNER` defaults to provider-capable and can be disabled later through `providerEnabled=false`.

## 2026-06-08 - Invoice Source Tracking

- `InvoiceSource` enum was added with `MANUAL`, `AUTO_APPOINTMENT`, `AUTO_FOLLOW_UP`, and `AUTO_RECALCULATION`.
- `Invoice.source InvoiceSource @default(MANUAL)` was added by migration `20260608160000_add_invoice_source`.
- Existing tenant invoices default to `MANUAL`; automatic source values are reserved for future explicit auto-billing settings.

# RoyalCare - Database Schema

Latest update 2026-06-08: Services now support reusable treatment plan templates through `ServiceTreatmentTemplate` (`serviceId`, localized names, `totalSessions`, `defaultIntervalDays`, optional `phases` JSON, default/active flags, and sort order). `Service` has many templates. `Appointment` stores the selected template id plus immutable snapshot fields (`treatmentTemplateName*`, total sessions, default interval, phases). `PatientFollowUp` stores the same patient-plan snapshot (`treatmentTemplateId`, `treatmentTemplateName*`, `planTotalSessions`, `planDefaultIntervalDays`, `planPhases`) so editing a service template later does not change existing patient plans.

Last updated: 2026-06-06
Status: Tenant auth, patients, services, appointments, staff management, manual billing, patient credit, subscription lifecycle, subscription invoices, subscription invoice numbering, localized business name storage, tenant marketing settings, marketing tracking debug logs, center website builder settings, gallery, reviews, and before/after gallery implemented

Latest public profile branch update:
- `CenterBranch` stores multiple public locations/contact rows per center with localized city/address/working-hours text, phone, WhatsApp, Google Maps URL, main/active flags, and sort order.
- `Center.branches` is the relation used by public center APIs and public profile management.
- Public center pages prefer active branches when present and keep the legacy single-address/WhatsApp fields on `BrandingSettings` as backward-compatible fallback for older centers.

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
- Prisma Client now uses the standard `prisma-client-js` generator for API runtime compatibility.
- Super Admin Centers, Users, and Subscriptions API modules now use the real Prisma schema foundation instead of mock-only architecture.
- Online payments, medical diagnosis details, staff scheduling, file assets, audit logs, module tables, and dedicated page-block tables are intentionally not created yet.

Multi-tenancy:
- Shared database
- Shared schema
- Tenant isolation using `centerId`

Rule:
- Every center-owned table must include `centerId` unless there is a documented reason not to.
- Every query for tenant-owned data must be scoped by trusted `centerId`.
- The database package exposes a tenant scope helper with `TENANT_ID_FIELD = 'centerId'`.

Latest website settings update:
- `BrandingSettings` is now the foundation for center website CMS settings.
- `CenterBranch` now supports multiple public branches/locations per center without making appointments/services/staff branch-aware yet.
- Migration `20260525110000_add_center_website_settings` adds localized full descriptions, localized slogans, phone/email, Google Maps URL, localized working-hours text, and Facebook/Instagram/TikTok links.
- Migration `20260526090000_add_website_builder_settings` adds `websiteSectionOrder` and `websiteSectionVisibility` JSON fields so each center can control homepage section order and visibility without code.
- Existing logo, cover image, primary color, secondary color, short descriptions, WhatsApp, and localized address fields remain in `BrandingSettings`.
- `CenterReview` stores center-scoped public testimonials with `customerName`, `rating`, localized comments, publish flag, and sort order. Public APIs expose only published reviews for the resolved center.
- `CenterBeforeAfter` stores center-scoped transformation cases with localized titles/descriptions, `LASER`/`SKIN`/`DENTAL`/`HAIR`/`OTHER` category, before image URL, after image URL, publish flag, and sort order. Public APIs expose only published before/after items for the resolved center.

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
- `SubscriptionInvoice`
- `SubscriptionInvoiceNumberCounter`
- `Domain`
- `Customer`
- `Patient`
- `Service`
- `Appointment`
- `Session`
- `Notification`
- `DynamicPage`
- `BrandingSettings`
- `CenterInternalNote`
- `Invoice`
- `SubscriptionLifecycleJobRun`
- `TenantMarketingSettings`
- `MarketingTrackingLog`
- `CenterGalleryImage`
- `CenterReview`

Not implemented yet:
- Online payment gateway/provider integration
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
- Soft deletion is prepared on `User.deletedAt`.

Tenant strategy:
- `Center` is the tenant.
- `Center.slug` is unique and is used for dedicated branded tenant login routes such as `/c/[centerSlug]/login`.
- `Center.primaryLanguage` is the tenant default language and drives default RTL/LTR behavior for dedicated login and tenant UI.
- Tenant-scoped role assignments use `UserRole.centerId`.
- Center-owned roles can use `Role.centerId`.
- `Subscription` and `Domain` are always center-owned and require `centerId`.
- `CenterInternalNote` is center-owned and stores private Super Admin support notes that must never be exposed to center owner/admin or customer-facing APIs.
- Center staff users are represented by `User` records assigned to center-scoped `Role` records through `UserRole.centerId`.
- Tenant Staff Management does not add a separate staff table; tenant staff users are represented by `User` records with center-scoped `UserRole.centerId` assignments and center role keys.
- Tenant staff passwords are stored only as scrypt hashes in `User.passwordHash`; `passwordHash` is never returned by staff APIs.
- `BrandingSettings.logoUrl` stores the center logo used by dedicated tenant login and the tenant sidebar; if absent, the UI falls back to center initials.
- `Patient` is a tenant-owned clinical/customer record scoped by required `centerId`.
- Patient phone numbers are unique per center through `@@unique([centerId, phone])`; the same phone can exist in another center.
- Patient lookup indexes include `centerId`, `centerId/status`, `centerId/fullName`, and `centerId/createdAt`.
- `Patient` stores localized business names as `fullNameAr`, `fullNameEn`, and `fullNameHe`; `fullName` remains the default fallback.
- `Center` stores localized business names as nullable `nameAr`, `nameEn`, and `nameHe`; `name` remains the default fallback.

RBAC strategy:
- `Permission` defines atomic permission keys.
- `Role` groups permissions and can be platform-level, center-level, or customer-level.
- `RolePermission` is the explicit role-permission join table.
- `UserRole` is the explicit user-role assignment table, optionally scoped to `centerId`.

Subscription control:
- `Subscription` includes `status`, `billingInterval`, `currentPeriodStart`, `currentPeriodEnd`, `trialEndsAt`, `expiresAt`, `cancelAt`, and `cancelledAt`.
- Manual billing fields on `Subscription` include `nextRenewalDate` and `billingNotes`.
- RoyalCare does not implement online payment gateway fields; subscription management is manual/direct billing only.
- Indexes support lookup by center/status, center/current-period-end, expiry, and period end.

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
- Whether future staff scheduling/bookability should become a dedicated `StaffMember` profile model linked to `User`.

### 3.0.1 Phase 2 Implementation Notes

Tenant strategy:
- Every Phase 2 model includes required `centerId`.
- Every Phase 2 model has a relation to `Center`.
- Customer, service, appointment, session, notification, dynamic page, and branding records are all center-owned.

Multilingual strategy:
- Tenant Services now use explicit multilingual columns: `nameEn`, `nameAr`, `nameHe`, `descriptionEn`, `descriptionAr`, and `descriptionHe`.
- Only the center default language from `Center.primaryLanguage` is required for Tenant Services; other language fields are optional and can be filled later.
- `DynamicPage.title`, `DynamicPage.content`, `DynamicPage.seoTitle`, and `DynamicPage.seoDescription` use JSON for multilingual website content.
- `Notification.title` and `Notification.body` use JSON for multilingual message content.
- `BrandingSettings.defaultLanguage` uses `SupportedLanguage`.
- `BrandingSettings.enabledLanguages` uses JSON so centers can enable combinations of `ar`, `he`, and `en` without adding a join table yet.

Business scope:
- Customer identity, service catalog, booking records, session records, notifications, dynamic pages, and branding settings are now represented.
- Patient management is now represented separately from the older conceptual Customer model for the tenant dashboard foundation.
- Payments are not included.
- Medical diagnosis details are not included.
- Appointment scheduling foundation is implemented for patient, service, provider, date/time, status, cancellation, and follow-up notes.
- Advanced staff availability/working-hours rules are not included yet.

### 3.1 Center

Purpose:
- Represents a subscribed center/clinic/wellness business.

Fields:
- `id`
- `ownerUserId` nullable
- `name`
- `nameAr` nullable
- `nameEn` nullable
- `nameHe` nullable
- `slug`
- `type`
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
- Optionally belongs to one owner/admin user through `ownerUserId`
- Has many customers
- Has many appointments
- Has branding settings
- Has enabled modules
- Has many internal Super Admin notes
- Has many tenant services
- Has many tenant patients

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

### 3.3.1 CenterInternalNote

Purpose:
- Stores private RoyalCare Super Admin notes for a center.

Fields:
- `id`
- `centerId`
- `authorId`
- `note`
- `createdAt`
- `updatedAt`

Relationships:
- Belongs to one `Center`
- Belongs to one author `User`

Rules:
- Notes are for Super Admin support/operations only.
- Notes must not be returned from center owner/admin, customer portal, or public APIs.
- API responses must select the author through `safeUserSelect` and never expose passwords, password hashes, tokens, secrets, or auth-adjacent metadata.

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
- `nextRenewalDate`
- `billingNotes`
- `cancelAt`
- `cancelledAt`
- `metadata`
- `createdAt`
- `updatedAt`

Needs Confirmation:
- Manual/direct payment collection workflow.
- Manual/offline subscriptions are currently supported; online gateway fields remain out of scope.

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
- `lastLoginAt`
- `deletedAt`
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
- `nameEn`
- `nameAr`
- `nameHe`
- `descriptionEn`
- `descriptionAr`
- `descriptionHe`
- `durationMinutes`
- `price`
- `currency`
- `isActive`
- `createdAt`
- `updatedAt`
- `archivedAt`

Rules:
- Services are private tenant ERP records by default and are not public website data until a future public-services API explicitly exposes active/published records.
- Tenant Services must always be queried through the authenticated session `centerId`.
- Only the center default language is required for service name/description; non-default languages are optional.
- Pricing is manual metadata only. No online payment gateway, checkout, card, Stripe, PayPal, or provider fields exist.

Needs Confirmation:
- Whether packages/bundles are needed in v1.

### 3.14 StaffMember

Purpose:
- Represents staff who can perform services or manage appointments.

Implementation status:
- A dedicated `StaffMember` profile table is not implemented.
- Current tenant staff management uses `User`, `Role`, and `UserRole`.
- Staff details exposed to tenant UI are safe user fields only: `id`, `fullName`, `email`, `role`, `roleName`, `status`, `assignmentStatus`, `createdAt`, and `updatedAt`.
- Staff create requires `fullName`, `email`, `role`, and password.
- Staff edit supports `fullName`, `email`, `role`, `status`, and optional password.
- Activate/deactivate uses `User.status` plus matching active/inactive `UserRole.status`; no hard delete is implemented.
- Provider-capable appointment roles are `DOCTOR`, `STAFF`, and `CENTER_MANAGER`.

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
- Represents tenant appointment booking records for Patient -> Service -> Provider/Doctor -> Time -> Status workflows.

Fields:
- `id`
- `centerId`
- `patientId`
- `serviceId`
- `staffUserId`
- `createdByUserId`
- `appointmentDate`
- `startTime`
- `endTime`
- `durationMinutes`
- `status`
- `notes`
- `internalNotes`
- `isCancelled`
- `cancellationReason`
- `reminderSent`
- `cancelledAt`
- `completedAt`
- `createdAt`
- `updatedAt`

Statuses:
- `SCHEDULED`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

Relations:
- Belongs to one `Center`.
- Belongs to one `Patient`.
- Belongs to one tenant `Service`.
- Belongs to one provider/staff `User`.
- Belongs to one creator `User`.
- May have many `Session` records later.

Indexes:
- `centerId, status`
- `centerId, appointmentDate`
- `centerId, staffUserId, appointmentDate`
- `centerId, patientId, appointmentDate`
- `serviceId`
- `createdByUserId`

Rules:
- Appointments are tenant-owned and must always be scoped by authenticated session `centerId`.
- Appointments cannot exist without patient, service, provider, and creator references.
- Cancelled appointments remain visible historically through `status = CANCELLED`, `isCancelled = true`, `cancelledAt`, and `cancellationReason`.
- No hard delete is implemented for tenant appointments.
- The database stores manual scheduling data only. No online payment fields exist.

Needs Confirmation:
- Working hours rules.
- Staff availability rules.
- Booking lead time.
- Cancellation window.
- Reminder delivery schedule.

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
- `logoUrl` is the source for center-branded tenant login and tenant shell identity.
- If `logoUrl` is null, tenant UI should use center initials rather than platform branding.

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
- `actorUserId` nullable; logs still persist when the Super Admin actor cannot be resolved
- `targetUserId` nullable
- `action`
- `metadata`
- `createdAt`

Relations:
- Optional actor user
- Optional target user
- Optional center

### 3.23 SubscriptionLifecycleJobRun

Purpose:
- Persists subscription lifecycle automation run status for Super Admin monitoring.

Fields:
- `id`
- `startedAt`
- `finishedAt`
- `triggeredBy`
- `scanned`
- `updatedExpired`
- `notificationsCreated`
- `auditLogsCreated`
- `skippedSuspended`
- `duplicateNotificationsSkipped`
- `success`
- `errorMessage`

### 3.24 CenterReview

Purpose:
- Stores public testimonials managed by each center for its independent center website.

Fields:
- `id`
- `centerId`
- `customerName`
- `rating` from 1 to 5
- `commentAr`
- `commentEn`
- `commentHe`
- `isPublished`
- `sortOrder`
- `createdAt`
- `updatedAt`

Rules:
- Tenant CRUD is scoped by authenticated session `centerId`.
- Public center website APIs resolve slug to `centerId` and return only `isPublished = true` reviews.
- Reviews must not expose phone, email, or private patient/customer identifiers publicly.

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
- User lookup by `email/status` and `phone/status`
- Unique `Domain.hostname`
- Unique `Center.slug`
- Center lookup by `slug/status`
- Appointment by `centerId, appointmentDate`
- Appointment by `centerId, staffUserId, appointmentDate`
- Appointment by `centerId, patientId, appointmentDate`
- Customer by `centerId`, `phone`
- Customer by `centerId`, `email`
- DynamicPage unique by `centerId`, `slug`
- Service by `centerId`, `status`
- Tenant Service by `centerId`, `isActive`, and localized service names
- Session by `centerId`, `performedAt`
- Notification by `centerId`, `status`
- Subscription by `centerId/status`, `centerId/currentPeriodEnd`, and `status/expiresAt`
- BrandingSettings unique by `centerId`
- CenterReview by `centerId`, `isPublished`, and `sortOrder`
- AuditLog by `centerId`, `createdAt`
- SubscriptionLifecycleJobRun by `startedAt` and `success`

Needs Confirmation:
- Whether customer email/phone uniqueness is required per center.

## 6. Data Isolation Rules

Mandatory:
- Center admin users can only access records for centers they belong to.
- Customer users can only access their own customer record within a center.
- Super Admin can access global records and tenant records for support/admin purposes.
- Every API must apply tenant isolation before returning data.
- Dedicated tenant login at `/c/[centerSlug]/login` must resolve the center by slug and then authenticate only active users assigned to that same center.
- Suspended, cancelled, and archived centers are blocked from tenant login.

## 7. Migration Policy

Recommended:
- All schema changes through Prisma migrations.
- Never manually edit production database schema.
- Review tenant isolation impact for every new model.
- Add indexes during migration design, not after performance issues appear.

## 8. Implemented Tenant Services Model

Status: Implemented for Tenant Services Management.

Fields:
- `id`
- `centerId`
- `nameEn`
- `nameAr`
- `nameHe`
- `descriptionEn`
- `descriptionAr`
- `descriptionHe`
- `durationMinutes`
- `price`
- `currency`
- `isActive`
- `createdAt`
- `updatedAt`
- `archivedAt`

Relations:
- `Service` belongs to one `Center`.
- `Center` has many services.
- Existing appointment/session relations can reference a service.

Indexes:
- `centerId`
- `centerId, isActive`
- `centerId, nameEn`
- `centerId, nameAr`
- `centerId, nameHe`

Rules:
- Services are tenant-owned and must always be scoped by authenticated session `centerId`.
- Services use manual pricing metadata only. No online payment gateway, checkout, card, Stripe, PayPal, or provider fields exist.

## 9. Implemented Invoice Model

Status: Implemented for Tenant Billing Management (manual payments only).

Prisma enum:
- `InvoiceStatus`: `PENDING`, `PAID`, `CANCELLED`

Fields:
- `id` UUID primary key
- `centerId` UUID, tenant isolation key
- `patientId` UUID, links to `Patient`
- `serviceId` UUID, links to `Service`
- `staffUserId` UUID nullable, links to staff `User`
- `amount` `Decimal @db.Decimal(12, 2)`
- `currency` `VarChar(10)`, default `ILS`
- `status` `InvoiceStatus`, default `PENDING`
- `notes` nullable text
- `createdAt` auto timestamp
- `updatedAt` auto-updated timestamp

Relations:
- `center` belongs to one `Center` with cascade delete
- `patient` belongs to one `Patient` with restrict delete
- `service` belongs to one `Service` with restrict delete
- `staff` belongs to one `User` (named relation `InvoiceStaff`) with set-null on delete, nullable

Back-relations added:
- `User.staffInvoices Invoice[] @relation("InvoiceStaff")`
- `Center.invoices Invoice[]`
- `Patient.invoices Invoice[]`
- `Service.invoices Invoice[]`

Indexes:
- `centerId`
- `centerId, status`
- `centerId, patientId`
- `centerId, createdAt`
- `serviceId`
- `staffUserId`

Status machine:
- `PENDING` → `PAID` (requires `billing.mark_paid` permission)
- `PENDING` → `CANCELLED` (requires `billing.update` permission)
- `PAID` → `CANCELLED` only (requires `billing.update` permission)
- `CANCELLED` → no transitions allowed

Amount serialization:
- Prisma returns `Decimal` objects; `formatInvoice()` calls `.toString()` on both `invoice.amount` and `service.price` before returning API JSON responses.
- Frontend receives `amount` and `service.price` as strings.

Rules:
- Invoices are tenant-owned and must always be scoped by authenticated session `centerId`.
- No online payment gateway, checkout, card, Stripe, PayPal, or provider fields exist.
- Manual payments only; status transitions are recorded manually by authorized staff.
- A cancelled invoice cannot be updated further.
- A paid invoice can only be cancelled.

## 11. Patient Credit System Models (2026-05-02)

### Patient.creditBalance
- Added `creditBalance Decimal @default(0) @db.Decimal(12,2)` to the `Patient` model.
- Holds the running credit balance for each patient within their center.
- Incremented by overpayments and manual credit additions; decremented when credit is applied to an invoice.

### CreditTransaction model
Fields:
- `id` UUID PK
- `centerId` UUID (tenant isolation — matches patient's center)
- `patientId` UUID FK → Patient
- `createdByUserId` UUID FK → User
- `amount` Decimal 12,2
- `type` CreditTransactionType enum (`CREDIT_ADD` | `CREDIT_USE`)
- `source` CreditTransactionSource enum (`OVERPAYMENT` | `MANUAL` | `ADJUSTMENT`)
- `relatedInvoiceId` UUID nullable FK → Invoice (set-null on delete)
- `notes` String nullable
- `createdAt` DateTime

Indexes: `centerId`, `(centerId, patientId)`, `(patientId, createdAt)`, `relatedInvoiceId`, `(centerId, type)`.

Rules:
- Every credit transaction is scoped by `centerId` — no cross-center credit access.
- `CREDIT_ADD` with `source: OVERPAYMENT` is created automatically when a cash payment exceeds the invoice balance due.
- `CREDIT_ADD` with `source: MANUAL` requires a non-empty `notes` reason and `billing.mark_paid` permission.
- `CREDIT_USE` with `source: OVERPAYMENT` is created when credit is applied to an unpaid invoice balance.
- `Patient.creditBalance` is always updated atomically inside a `$transaction` alongside the `CreditTransaction` record.
- Credit balance cannot go below 0.
- Credit applied to an invoice cannot exceed min(patientCreditBalance, invoiceBalanceDue).
- Credit cannot be applied to a `CANCELLED` invoice.
- Credit cannot be applied to an already fully `PAID` invoice.

## 12. Notification Targeting Update (2026-05-13)

Notification lifecycle support now includes:
- `NotificationTargetAudience` enum: `SUPER_ADMIN`, `CENTER_ADMIN`.
- `Notification.targetAudience`, default `CENTER_ADMIN`.
- Additional notification types: `SUBSCRIPTION_SUSPENDED`, `SUBSCRIPTION_RENEWED`, `TRIAL_ENDING_SOON`, `MISSING_WHATSAPP_PHONE`.

Rules:
- Tenant notification reads only return `CENTER_ADMIN` targeted notifications.
- Super Admin notification center reads only return `SUPER_ADMIN` targeted notifications.
- Read state is stored with existing `readAt` and `readByUserId` fields.

## 13. Production Delete Safety Update (2026-05-18)

Critical financial and clinical records must survive accidental parent deletes.

Referential actions hardened from cascade to restrict for:
- `Subscription.center`
- `SubscriptionInvoice.center`
- `SubscriptionInvoice.subscription`
- `Patient.center`
- `Appointment.center`
- `Invoice.center`
- `Payment.center`
- `Payment.invoice`
- `CreditTransaction.center`

Business recovery rules:
- Tenant invoices are cancelled/restored by status, not hard deleted.
- Patients are archived/restored by status, not hard deleted.
- Appointments are cancelled/restored by status and cancellation fields, not hard deleted.
- Audit logs remain append-only evidence and are not part of normal delete flows.

## 14. Schedule Provider Integration Update (2026-05-20)

Schedule and public booking schema support:
- `Service.bufferMinutes Int @default(0)` controls post-service blocking in availability calculations.
- `BookingRequest.providerId` optionally stores the requested provider for public bookings.
- `BookingRequest.provider` links to `User` with `onDelete: SetNull` so old booking requests survive provider removal.
- `ProviderWorkingHours` stores center-scoped weekly provider hours by `centerId`, `staffUserId`, and `dayOfWeek`.
- `ProviderLeaveDay` stores center-scoped provider leave days by `centerId`, `staffUserId`, and `date`.

Rules:
- Public booking may select a provider only when the provider has an active center role and active user account.
- Accepted booking requests use the selected `providerId` as the created appointment `staffUserId`; if no provider was selected, the accepting staff user remains the provider fallback.
- Availability uses provider hours and leave when `providerId` is supplied.

## 15. Tenant Marketing Settings (2026-05-23)

Added `TenantMarketingSettings` as a center-scoped one-to-one settings model.

Fields:
- `id` UUID primary key
- `centerId` unique UUID, linked to `Center`
- `metaPixelId`
- `metaConversionApiToken`
- `tiktokPixelId`
- `snapPixelId`
- `ga4Id`
- `gtmId`
- `customHeadScript`
- `customBodyScript`
- `createdAt`
- `updatedAt`

Rules:
- Settings are tenant-owned and must always be scoped by authenticated session `centerId`.
- Settings drive public center tracking injection, browser marketing events, backend-only Meta CAPI booking conversion tracking, and tenant test tracking.
- Empty strings are normalized to `null`.
- Short ID fields are capped at 120 characters; token/script fields are capped at 20000 characters.

## 16. Marketing Tracking Log (2026-05-24)

Added `MarketingTrackingLog` as a center-scoped operational debug log for tenant marketing events.

Enums:
- `MarketingTrackingProvider`: `META_PIXEL`, `META_CAPI`, `TIKTOK`, `GA4`, `SNAP`
- `MarketingTrackingStatus`: `SUCCESS`, `FAILED`, `SKIPPED`

Fields:
- `id` UUID primary key
- `centerId` UUID, linked to `Center`
- `provider`
- `eventName`
- `status`
- `message` nullable, capped at 500 characters
- `eventId` nullable
- `bookingRequestId` nullable
- `createdAt`

Indexes:
- `centerId, createdAt`
- `centerId, provider, createdAt`
- `bookingRequestId`

Rules:
- Logs are tenant-owned and must always be scoped by authenticated session `centerId` for tenant reads.
- Logs store safe operational data only: provider, event name, status, short message, event id, optional booking request id, and timestamp.
- Logs must never store Meta CAPI tokens, raw phone numbers, raw emails, raw names, or full provider request payloads.
- Server-side Meta CAPI `CompleteBooking` and `TestMarketingEvent` attempts write `SUCCESS`, `FAILED`, or `SKIPPED` rows.

## 17. Smart Follow-up Treatment Plans (2026-05-28)

Service follow-up configuration is stored directly on `Service`:
- `followUpEnabled Boolean @default(false)`
- `followUpMode ServiceFollowUpMode @default(NONE)` with `NONE`, `SESSION_BASED_PLAN`, and `RECURRING_CONTINUOUS`
- `defaultIntervalDays Int?`
- `totalRecommendedSessions Int?`
- `recurringIntervalValue Int?`
- `recurringIntervalUnit RecurringIntervalUnit?`
- `autoWhatsappReminderEnabled Boolean @default(false)`
- `autoReminderDaysBefore Int?`
- `autoCreateNextReminder Boolean @default(true)`
- `reminderMessageAr`, `reminderMessageEn`, `reminderMessageHe`
- `followUpRules Json?` for session-plan rules like `{ fromSessionNumber, toSessionNumber, intervalDays }`.

Added enums:
- `ServiceFollowUpMode`: `NONE`, `SESSION_BASED_PLAN`, `RECURRING_CONTINUOUS`
- The redundant `ServiceFollowUpType` enum and `Service.followUpType` column were removed by migration `20260622140000_refactor_follow_up_plan_types`; phase intervals remain stored in `followUpRules` with `defaultIntervalDays` fallback.
- Migration `20260622141000_backfill_session_plan_rules` converts legacy fixed-interval configurations with a session count into an equivalent single phase, preserving their schedule after the discriminator removal.
- Migration `20260622141100_backfill_json_null_session_plan_rules` applies the same compatibility mapping to rows stored with Prisma JSON null.
- `RecurringIntervalUnit`: `DAY`, `WEEK`, `MONTH`, `YEAR`
- `PatientFollowUpSourceType`: `APPOINTMENT_COMPLETED`, `MANUAL`, `BOOKING_REQUEST`
- `PatientFollowUpStatus`: `DUE`, `UPCOMING`, `CONTACTED`, `BOOKED`, `COMPLETED`, `MISSED`, `CANCELLED`

Added `PatientFollowUp`:
- `id`, `centerId`, `patientId`
- optional `serviceId`, `appointmentId`, `nextAppointmentId`
- `sourceType`, `title`, `notes`, `sessionNumber`, `dueDate`, `status`, `lastContactedAt`
- recurring metadata: `isRecurring`, `recurringIntervalValue`, `recurringIntervalUnit`, `nextRecurringAt`, `originFollowUpId`
- timestamps

Indexes:
- unique `(centerId, appointmentId, sessionNumber)`
- `(centerId, status, dueDate)`, `(centerId, patientId, serviceId, isRecurring, status)`, `(centerId, dueDate)`, `(centerId, patientId, dueDate)`, `(centerId, serviceId)`

Rules:
- Follow-up records are tenant-owned and every query must scope by authenticated `centerId`.
- Source appointments and next appointments are nullable set-null references so clinical history survives appointment cleanup.
- Automatic creation is idempotent per source appointment.

## 18. Appointment Custom One-Time Services (2026-05-28)

Appointments can now represent a one-time service that is not part of the saved `Service` catalog.

Added to `Appointment`:
- `customServiceName String?`
- `customServiceDuration Int?`
- `customServicePrice Decimal?`
- `customServiceCurrency String?`
- `customServiceSaved Boolean @default(false)`

Adjusted `Invoice`:
- `serviceId` is nullable so an invoice can be linked to a custom appointment without creating a catalog service.
- `customServiceName String?` stores the invoice service display name when no catalog service exists.

Rules:
- Every appointment must have either `serviceId` or `customServiceName`, except existing offer-backed appointments.
- Custom appointment invoices use `customServicePrice` or a manually supplied invoice amount.
- If staff choose “save as future service”, a real `Service` is created and linked while the appointment still keeps the custom-service snapshot and badge.
# 2026-06-08 - Follow-up Early Plan Closure

- Added `PatientFollowUpStatus.CLOSED_EARLY` for future treatment-plan sessions closed without deleting history.
- Added `PatientFollowUpPlanStatus` enum: `ACTIVE`, `COMPLETED`, `CLOSED_EARLY`, `CANCELLED`.
- Added `PatientFollowUp` plan-closure fields:
  - `planStatus`
  - `closedEarlyReason`
  - `closedEarlyAt`
  - `closedEarlyByUserId`
  - `closedEarlyAfterSession`
- Migration: `20260608120000_add_follow_up_early_closure`.

# 2026-06-14 - Tenant Expenses

Added tenant-owned expense tracking models through migration `20260614120000_add_tenant_expenses`.

Enum:
- `ExpenseStatus`: `PAID`, `PENDING`, `RECURRING`, `CANCELLED`

Models:
- `ExpenseCategory`: center-scoped categories with `name`, `color`, `icon`, `isActive`, `sortOrder`, timestamps, and unique `(centerId, name)`.
- `ExpenseRecurrence`: center-scoped monthly recurring expense templates with category/branch/user references, amount/currency/payment metadata, `dayOfMonth`, `nextGenerationDate`, `isPaused`, and `lastGeneratedAt`.
- `Expense`: center-scoped expense records with category/branch/user/recurrence references, title, description, amount, currency, `expenseDate`, optional `dueDate`, `PaymentMethod`, `ExpenseStatus`, receipt URL, invoice/vendor/notes/tags, and timestamps.

Rules:
- All expense records, categories, and recurrences are tenant-owned and must always be queried by authenticated `centerId`.
- Category and branch references are nullable with `SetNull` delete behavior so historical expenses survive category/branch cleanup.
- Center and creator user references are restricted to preserve financial history.
## 2026-06-20 - Recurring Follow-up Workflow Metadata

`PatientFollowUp` recurring lifecycle now stores:
- `lastContactedByUserId` alongside existing `lastContactedAt`.
- `reminderCount`, `lastReminderAt`, and `lastReminderByUserId`.
- `skippedAt` and `skippedByUserId`.
- `pausedAt` and `pausedByUserId`.
- `PatientFollowUpStatus`: new `SKIPPED` and `PAUSED` values.
- `PatientFollowUpPlanStatus`: new `PAUSED` value.

Migration: `20260620120000_add_recurring_follow_up_workflow`.
