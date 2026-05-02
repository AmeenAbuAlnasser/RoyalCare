# RoyalCare - Business Rules

Last updated: 2026-04-30
Status: Dedicated tenant login, patients, services, appointments, tenant staff, and tenant billing (manual invoices) rules documented

## 1. Platform Model

RoyalCare is the parent SaaS platform. It sells websites and admin systems to multiple centers.

Each center is a tenant. A center receives its own website, admin panel, customers, appointments, branding, enabled modules, and domain configuration.

## 2. Tenant Rules

Mandatory rules:
- Every center is isolated by `centerId`.
- Center-owned data must not be visible across centers.
- Center users can only access centers they are assigned to.
- Center staff users are tenant users, not platform admins.
- Center staff membership and management must be scoped through `UserRole.centerId`.
- A staff user assigned to one center must not be listed, edited, activated/deactivated, or password-reset through another center's route.
- Dedicated tenant login uses `/c/[centerSlug]/login`.
- Generic `/tenant/login` remains a temporary fallback route only.
- Dedicated tenant login must resolve the center by unique slug before login and must authenticate only users assigned to that same center.
- Wrong-center login attempts must be rejected and must not create a session.
- Tenant-side staff login must resolve one center context from the user's active center-scoped role assignment.
- Tenant dashboard sessions must not allow selecting or injecting a different center id.
- Inactive staff users cannot log in.
- Suspended, cancelled, and archived centers are blocked from tenant login.
- Customers belong to a specific center.
- Patients belong to exactly one center.
- Tenant Patients API requests must derive `centerId` only from the authenticated center staff session.
- A center can list, create, view, update, activate, deactivate, or archive only its own patients.
- Cross-center patient access must return `404`, not another center's patient data.
- Patient phone numbers must be unique inside one center; the same phone number is allowed in a different center.
- Super Admin can access tenant data only for legitimate platform administration and support.
- Tenant status and subscription status can restrict access.

Needs Confirmation:
- Whether users can own or manage multiple centers.
- Whether one customer can have accounts in multiple centers using one login.

## 3. Subscription Rules

RoyalCare controls access through subscriptions.

Billing rule:
- Subscription billing is manual/direct only.
- Do not implement Stripe, PayPal, card payments, checkout pages, or online payment gateway integrations.
- Super Admin manages plan, status, dates, renewal date, and billing notes manually.

Expected subscription effects:
- Access to admin panel
- Custom domain activation
- Enabled modules
- Limits such as staff count, customer count, pages, languages, storage, or bookings
- Suspension behavior for unpaid centers

Possible statuses:
- `trial`
- `active`
- `past_due`
- `suspended`
- `cancelled`

Business behavior:
- Active centers can use enabled modules.
- Suspended centers should have restricted admin access.
- Cancelled centers should not serve active websites unless explicitly configured.
- Past-due centers may receive warnings before suspension.

Needs Confirmation:
- Manual/direct payment collection workflow.
- Trial length.
- Grace period for past-due payments.
- Whether suspended public websites should show a maintenance page or continue serving cached content.

## 4. Domain Rules

Each center can have:
- One primary domain
- Optional additional domains
- Optional RoyalCare subdomain

Domain must be verified before activation.

Needs Confirmation:
- Domain automation provider.
- Whether RoyalCare purchases domains for centers or only maps existing domains.
- Whether SSL is automated by hosting provider.

## 5. Center Type Rules

Supported center types:
- Laser
- Physiotherapy
- Hijama
- Beauty
- Wellness

Center type affects:
- Default template
- Suggested modules
- Default page content
- Default service categories
- Session fields
- Appointment workflows

Needs Confirmation:
- Exact fields and workflows per industry.

## 6. Module Rules

Modules are enabled per center by Super Admin or subscription plan.

Examples:
- Appointments
- Sessions
- Customer Portal
- Pages Builder
- Notifications
- Branding
- Laser module
- Physio module
- Hijama module
- Beauty module

Rules:
- Hidden modules should not appear in center admin navigation.
- Disabled modules must reject API access.
- Module availability should be checked server-side.

## 7. Branding Rules

Each center can have its own:
- Logo
- Primary color
- Secondary color
- Accent color
- Theme settings
- Languages
- Public website content

Rules:
- Branding applies to public website and customer portal.
- Admin UI may use center logo/colors lightly, but should remain simple and readable.
- Super Admin UI should keep RoyalCare platform branding.
- Tenant Center Admin login and shell should show the center's own identity.
- Tenant center logo resolves from `BrandingSettings.logoUrl`.
- Tenant UI must use center initials as fallback when no logo URL exists, not the RoyalCare platform logo.
- Dedicated center login shows the resolved center name and logo before authentication.

Needs Confirmation:
- Whether centers can choose fonts.
- Whether center admin panel is fully branded or only lightly branded.

## 8. Language Rules

Supported languages:
- Arabic
- Hebrew
- English

Rules:
- Arabic and Hebrew require RTL layout.
- English requires LTR layout.
- Center default language should be configurable.
- Super Admin Center Details/Edit must show and edit the center default language through the existing `Center.primaryLanguage` field.
- `Center.primaryLanguage` is the source of truth for dedicated tenant login default language, tenant dashboard default language behavior, RTL/LTR default behavior, and default-language-required service/appointment UX.
- When Super Admin changes `Center.primaryLanguage`, branding language metadata should be kept aligned so old branding rows do not show stale language values.
- Dedicated center login loads the center default language from `Center.primaryLanguage`.
- Dedicated center login should automatically apply RTL for Arabic/Hebrew and LTR for English.
- Successful tenant login from `/c/[centerSlug]/login` or `/tenant/login` must persist the tenant UI locale from `Center.primaryLanguage`.
- Tenant dashboard/shell bootstrap must apply the center default language once for the logged-in center/user browser session if it was not already applied.
- A center staff user may manually change the tenant UI language during the browser session; that manual choice remains stable until logout or a new tenant login reapplies the center default.
- Public content should support translations.
- Admin UI should be prepared for translation.

Needs Confirmation:
- Whether all languages are required for every center.
- Fallback language behavior.
- Who enters translations: RoyalCare, center owner, or automatic translation.

## 9. Appointment Rules

Appointments belong to one center and one patient.

Appointment statuses:
- Scheduled
- Confirmed
- In progress
- Completed
- Cancelled
- No-show

Rules:
- Tenant Appointments API requests must derive `centerId` only from the authenticated center staff session.
- A center can list, create, view, update, cancel, and status-change only appointments in its own center.
- Appointment cannot exist without a same-center patient.
- Appointment cannot exist without a same-center active service.
- Appointment cannot exist without a same-center active provider/staff user.
- Appointment providers must be same-center active staff users with provider-capable roles only: `DOCTOR`, `STAFF`, or `CENTER_MANAGER`.
- `RECEPTIONIST` and `ACCOUNTANT` must not appear in appointment provider dropdowns unless a future confirmed rule explicitly allows them.
- Appointment creator is the authenticated center staff user.
- Overlapping appointments are blocked for the same provider.
- Impossible duplicate slots are blocked for the same patient.
- When an overlap is detected the API returns `400` with `errors.staffUserId` and/or `errors.patientId` plus a top-level `conflictDetails` object containing `patientName`, `serviceNameEn`, `serviceNameAr`, `serviceNameHe`, `providerName`, `appointmentDate`, `startTime`, and `endTime` of the conflicting appointment.
- The frontend must display `conflictDetails` as a styled red alert box below the form fields showing all conflict information; a simple text error is not sufficient.
- Conflict alert must support EN, AR, and HE with RTL layout for Arabic and Hebrew.
- Cancelled appointments remain visible historically and are not hard-deleted.
- Cancellation requires a reason through the cancel endpoint.
- Internal notes are tenant admin operational notes and must not be exposed outside authorized tenant appointment workflows.
- No online payment, checkout, card processing, Stripe, PayPal, or payment gateway integration is part of Appointments Management.
- Center admin can manage appointments only if role permission allows.

Needs Confirmation:
- Working hours rules.
- Staff availability rules.
- Booking lead time.
- Cancellation window.
- Whether online booking is request-only or auto-confirmed.

## 9.1 Tenant Services Rules

Tenant services are center-owned ERP records managed from the Center Admin dashboard.

Rules:
- A center can only list, create, update, archive, or activate services that belong to its own `centerId`.
- Service names are stored separately for English, Arabic, and Hebrew.
- Service descriptions are stored separately for English, Arabic, and Hebrew.
- Only the center default language, stored as `Center.primaryLanguage`, is required when creating or fully editing a service.
- Tenant Services require only the default-language service name.
- Tenant Services descriptions are optional in all languages unless a future business rule explicitly makes descriptions mandatory.
- Non-default service languages remain optional and can be filled later.
- Tenant Services are private center-admin ERP records by default.
- Tenant Services should not become public website data unless a future public-services API explicitly exposes active/published service records.
- Services can be active or archived through `isActive`; archived services remain stored for history and future appointment references.
- Service price and currency are manual business metadata only.
- No online payment, checkout, card processing, Stripe, PayPal, or payment gateway integration is part of Services Management.
- Backend role checks are mandatory; frontend action hiding is only a usability layer.

## 9.2 Tenant Staff Rules

Tenant staff are center-scoped users managed inside the Center Admin dashboard.

Rules:
- Staff users belong to a center through `UserRole.centerId`.
- Tenant Staff API requests must derive `centerId` only from the authenticated center staff session.
- A center can only list, create, view, update, activate, or deactivate staff assigned to its own `centerId`.
- Cross-center staff access must return `404`, not another center's staff user.
- Staff roles use existing center role keys: `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF`.
- Staff create requires full name, email, role, and password.
- Staff edit allows full name, email, role, status, and optional password.
- Passwords must be hashed before storage and must never be returned from API responses.
- `passwordHash` must never be selected or returned by tenant staff APIs.
- Staff are never hard-deleted from tenant management; use activate/deactivate.
- Inactive staff cannot log in and cannot be assigned as appointment providers.
- `CENTER_OWNER` and `CENTER_MANAGER` can view, create, update, activate, and deactivate staff.
- `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF` can view staff only in the current tenant foundation.

## 9.3 Tenant Billing Rules

Tenant billing manages manual payment invoices for services rendered. No online payment is implemented.

Invoice statuses:
- `PENDING` — invoice created, payment not yet received
- `PAID` — payment confirmed manually by authorized staff
- `CANCELLED` — invoice voided; no further transitions are allowed

Rules:
- Billing is manual/direct only. No online payment gateway, card processing, Stripe, PayPal, or checkout flow exists.
- Invoices are tenant-owned and must always be scoped by authenticated session `centerId`.
- Tenant Billing API requests must derive `centerId` only from the authenticated center staff session.
- A center can only list, create, view, or update invoices that belong to its own `centerId`.
- Cross-center invoice access must return `404`.
- Every invoice must reference a same-center active patient.
- Every invoice must reference a same-center active service.
- Provider (staffUserId) is optional and links to any active same-center staff user.
- Amount must be a positive number greater than zero.
- Currency is a short code (e.g. `ILS`, `USD`, `EUR`), default `ILS`.
- Notes are optional free-text metadata.
- New invoices always start in `PENDING` status.
- Status transitions:
  - `PENDING` → `PAID` requires `billing.mark_paid` permission.
  - `PENDING` → `CANCELLED` requires `billing.update` permission.
  - `PAID` → `CANCELLED` requires `billing.update` permission.
  - `CANCELLED` → `PENDING` (reopen) requires `billing.update` permission.
  - `CANCELLED` → `PAID` is forbidden; reopen to `PENDING` first, then mark paid.
  - `PAID` → `PENDING` is forbidden.
- Selecting a service in the create form auto-fills amount and currency from the service price/currency metadata.
- Invoice list supports search by patient name or phone and filter by status.
- Backend role checks are mandatory; frontend action hiding is only a usability layer.
- `CENTER_OWNER`, `CENTER_MANAGER`, and `ACCOUNTANT` have full billing permissions.
- `RECEPTIONIST` can view and create invoices but cannot mark paid or cancel.
- `DOCTOR` and `STAFF` can view invoices only.

## 10. Session Rules

Sessions track actual treatment or service history.

Rules:
- Sessions belong to a center and customer.
- Sessions may link to appointments.
- Sessions may include staff, service, notes, and completion status.
- Visibility of session notes to customers must be controlled.

Needs Confirmation:
- Industry-specific session forms.
- Whether treatment plans/packages are needed in v1.
- Whether medical consent forms are needed.

## 11. Customer Portal Rules

Customer portal allows customers to access center-specific data.

Expected customer abilities:
- Login
- View profile
- View appointments
- Request/book appointments
- Receive notifications

Needs Confirmation:
- Whether customers can edit profile details.
- Whether customers can see session history.
- Whether customers can upload documents.
- Whether customers can pay invoices.

## 12. Notifications Rules

Notification events may include:
- Appointment requested
- Appointment confirmed
- Appointment reminder
- Appointment cancelled
- Customer account created
- Subscription status change
- Domain verification status

Rules:
- Notifications must be center-scoped when related to tenant data.
- Templates should support languages.
- Failed notification attempts should be logged.

Needs Confirmation:
- Required notification channels for MVP.
- Reminder timing.
- Whether WhatsApp is required in v1.

## 13. Page Builder Rules

Dynamic pages belong to a center.

Rules:
- Pages should use structured blocks.
- Page slugs must be unique per center.
- Published and draft states should be separate.
- Public website must only show published pages.

Needs Confirmation:
- Required block types for MVP.
- Whether centers can fully customize layout or only edit template sections.

## 13.1 Super Admin Internal Notes

Internal notes are private RoyalCare operational notes attached to a center.

Rules:
- Internal notes are only for Super Admin platform support and operations.
- Internal notes must never be visible in center owner/admin, customer portal, or public website APIs.
- Internal note authors must be platform users.
- Internal note API responses must use safe author projections and never expose passwords, password hashes, tokens, secrets, or auth metadata.

## 14. Audit Rules

Actions that should be audited:
- Super Admin login
- Center creation/update/suspension
- Center internal note creation/update/deletion
- Subscription changes
- Domain changes
- Permission changes
- User role changes
- Customer deletion
- Appointment deletion/cancellation
- Backup and restore actions

Needs Confirmation:
- Audit retention period.
- Whether centers can view their own audit log.
