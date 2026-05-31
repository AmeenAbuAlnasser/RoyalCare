# RoyalCare - Business Rules

Last updated: 2026-05-26
Status: Dedicated tenant login, patients, services, appointments, tenant staff, tenant billing, subscription lifecycle, scheduling, marketing tracking, center website analytics, smart contact widget, and treatment follow-up rules documented

## 0. Latest Addition - Smart Follow-up Treatment Plans (2026-05-28)

Some services can define a follow-up plan so centers remember recurring sessions and bring patients back.

Service rules:
- Follow-ups are disabled by default and enabled per service.
- `FIXED_INTERVAL` uses `defaultIntervalDays`.
- `SESSION_PLAN` uses session rules: `fromSessionNumber`, `toSessionNumber`, `intervalDays`.
- If no session rule matches, the default interval is used when present.
- `totalRecommendedSessions` prevents creating a next reminder once the completed-session count reaches the recommendation.
- `autoCreateNextReminder=false` keeps settings saved but does not create reminders automatically.

Automatic creation:
- When an appointment transitions to `COMPLETED`, the backend checks the linked service follow-up settings.
- The next due date is calculated from the completed appointment date plus the resolved interval.
- The follow-up is created once per source appointment; repeated status saves must not duplicate rows.
- The next `sessionNumber` shown to staff is the recommended upcoming session number.

Tenant worklist:
- `/tenant/follow-ups` shows Today, This week, Overdue, Upcoming, Contacted, Booked, and Completed filters.
- Staff can open WhatsApp with a prefilled message, mark contacted/booked/completed, add notes, and open appointment creation prefilled with patient/service context.
- WhatsApp is manual only in v1; no automatic sending is allowed.
- Follow-up metrics include due today, overdue, contacted, booked/completed from follow-ups, and conversion percentage.

Patient profile:
- Patient details show a compact follow-up timeline for the patient, with due date, session number, status, and notes.

Security:
- Tenant follow-up endpoints require a valid center session.
- Reads require `appointments:view`; status/note updates require `appointments:update`.
- Every follow-up query and mutation is scoped by the session `centerId`.

## 1. Platform Model

RoyalCare is the parent SaaS platform. It sells websites and admin systems to multiple centers.

Each center is a tenant. A center receives its own website, admin panel, customers, appointments, branding, enabled modules, and domain configuration.

Public surface separation:
- RoyalCare platform marketing pages (`/`, `/centers`, `/features`, `/pricing`) explain and sell the RoyalCare SaaS platform to center owners and patients.
- Center website pages (`/c/[slug]`, `/c/[slug]/about`, `/c/[slug]/services`, `/c/[slug]/contact`, `/c/[slug]/gallery`, `/c/[slug]/reviews`, `/c/[slug]/before-after`) are independent public websites for subscribed centers.
- Platform marketing pages must use the RoyalCare platform navbar and platform branding.
- Center website pages must use the center-specific navbar, center logo/name/colors, public-safe center content, and Book Now CTA.
- Center website pages may include a small Back to RoyalCare/All centers link, but must not show platform marketing nav items as the main navigation.
- Center website features must be generic and centerId-scoped, never slug-hardcoded. Public routes may accept a center slug, but backend services must resolve that slug to the center id and query center-owned assets such as gallery images by `centerId`.
- Public center gallery images must only display images uploaded by the same center. If a center has no gallery images, the public website hides the homepage gallery section gracefully.
- Public center reviews/testimonials must only display published reviews created by the same center. Public review payloads must not include phone, email, private patient ids, or tenant admin fields. If a center has no published reviews, the public website hides the homepage reviews section gracefully.
- Public center before/after cases must only display published cases created by the same center. Public payloads must include safe display fields only: localized title/description, category, before/after image URLs, and sort order. If a center has no published cases, the public website hides the homepage before/after section gracefully.
- Center website homepage sections are center-owned builder settings. `BrandingSettings.websiteSectionOrder` controls homepage order, and `BrandingSettings.websiteSectionVisibility` controls whether Hero, About, Services, Reviews, Before/After, Team, Offers, Gallery, Contact, Working hours, and Social links render.
- Public center websites must render homepage sections from the saved order and visibility. Hidden sections and empty sections must not render placeholders.
- Center website navigation must derive visibility from the same builder settings and available public data, so hidden or empty modules do not appear in the navbar/footer.
- Public center favicons must use `center.branding.logoUrl` for any `/c/[slug]` route when available and fall back to the RoyalCare platform favicon only when the center has no logo or the route leaves `/c/*`.
- Future custom domains or subdomains may point to center website pages, but custom-domain routing is not part of this foundation step.

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
- User-entered business names are data, not UI text. The system must not auto-translate patient or center names.
- Patient display names should use the requested locale snapshot (`fullNameAr`, `fullNameEn`, `fullNameHe`) and fall back to `fullName`.
- Center display names should use the requested locale snapshot (`nameAr`, `nameEn`, `nameHe`) and fall back to `name`.
- Audit logs should snapshot localized patient and center names when the billing action happens so later UI language switches can render the stored business value without translation.

Needs Confirmation:
- Whether users can own or manage multiple centers.
- Whether one customer can have accounts in multiple centers using one login.

## 3. Subscription Rules

RoyalCare controls access through subscriptions.

Billing rule:
- Subscription billing is manual/direct only.
- Do not implement Stripe, PayPal, card payments, checkout pages, or online payment gateway integrations.
- Super Admin manages plan, status, dates, renewal date, and billing notes manually.
- Subscription invoices use server-generated yearly numbers in the format `SUB-YYYY-000001`; the frontend must not supply invoice numbers.
- Subscription invoice number generation must be race-safe and backed by the yearly `SubscriptionInvoiceNumberCounter`.
- Unpaid subscription invoices with a due date before today must be classified as `OVERDUE`; paid and cancelled invoices are not auto-changed.
- Subscription invoice PDF downloads must be audited as `SUBSCRIPTION_INVOICE_DOWNLOADED`.
- Super Admin subscription financial KPIs are based on subscription invoices, not tenant treatment invoices.
- Subscription System MVP is closed with lifecycle automation, tenant access control, renewal requests, manual WhatsApp support, notifications, audit logs, timeline, dashboard KPIs, filters, and actions.
- Remaining production limitations: no real payment gateway, no WhatsApp API automation, lifecycle cron depends on API process uptime, and timezone/date boundaries must be monitored after deploy.
- Recommended next business module is Billing / subscription invoices / payments, starting with manual invoice and payment records before any payment provider integration.

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
- Tenant subscription access control is backend-enforced for business write APIs.
- `ACTIVE` and `TRIALING` subscriptions allow full tenant business access.
- Subscriptions expiring within 7 days allow full access but show a tenant warning banner.
- `EXPIRING_SOON` means subscription status is `ACTIVE` or `TRIALING`, `daysRemaining` is between 0 and 7 inclusive, and the subscription/center is not suspended, cancelled, or expired.
- `EXPIRED` subscriptions allow tenant read access, dashboard, notifications, settings, logout, and renewal request, but block create/update/delete actions for patients, appointments, services, staff, invoices, payments, credits, and tenant role-permission changes.
- `SUSPENDED` subscriptions block tenant business write actions and show the localized suspension message while dashboard, notifications, logout, and renewal request remain available.
- Super Admin subscription KPI lifecycle buckets must classify every subscription exactly once as `ACTIVE`, `TRIALING`, `EXPIRING_SOON`, `EXPIRED`, `SUSPENDED`, `CANCELLED`, or `UNKNOWN`; the visible lifecycle bucket sum must equal total subscriptions.
- Subscription restriction errors must return stable error codes: `SUBSCRIPTION_EXPIRED` or `SUBSCRIPTION_SUSPENDED`.

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

## 9.4 Patient Credit System Rules

A patient can accumulate a credit balance that is applied toward future invoice payments.

### Credit Sources
- `OVERPAYMENT`: Created automatically when a cash payment exceeds the invoice balance due. The overpaid amount is stored as `Patient.creditBalance` and a `CreditTransaction` of type `CREDIT_ADD`, source `OVERPAYMENT`.
- `MANUAL`: A staff user with `billing.mark_paid` permission can add credit directly to a patient account. A mandatory non-empty reason/notes field is required for audit trail.
- `ADJUSTMENT`: Reserved for future programmatic adjustments.

### Using Credit
- Staff with `payments.create` permission can apply patient credit to an unpaid invoice using `POST /tenant/billing/:invoiceId/use-credit`.
- The credit amount applied is automatically capped at `min(patientCreditBalance, invoiceBalanceDue)`.
- Applying credit decrements `Patient.creditBalance` and creates a `CreditTransaction` of type `CREDIT_USE`.
- Invoice status is recalculated after credit is applied (PENDING → PARTIAL → PAID).

### Strict Validation
- Credit balance cannot go below zero.
- Credit cannot be applied to a `CANCELLED` invoice.
- Credit cannot be applied when invoice is already fully `PAID`.
- Credit amount must be positive and non-zero.
- All credit operations are scoped by `centerId`; cross-center credit access is forbidden.
- `CreditTransaction` records are atomic with `Patient.creditBalance` updates via Prisma `$transaction`.

### Permissions
- `payments.create` — CENTER_OWNER, CENTER_MANAGER, ACCOUNTANT, RECEPTIONIST can use credit.
- `billing.mark_paid` — CENTER_OWNER, CENTER_MANAGER, ACCOUNTANT can add manual credit to a patient.

## 9.5 Tenant Financial Reports Rules

Tenant financial reports are Center Admin read-only operational reports.

Rules:
- Reports are scoped by the authenticated session `centerId`; the client never supplies `centerId`.
- `reports:view` is required.
- Cancelled tenant invoices are excluded from invoice counts, averages, payment-status charts, service revenue, and revenue totals.
- Revenue includes manual cash/bank/check/other payments plus `CREDIT_USE` patient credit transactions.
- Patient credit balance cards use current patient credit balances, not only period movement.
- Supported report periods are today, last 7 days, this month, and custom date range.
- Date display in the web UI must remain numeric `DD/MM/YYYY` in EN, AR, and HE.
- Arabic and Hebrew report layouts must remain RTL.
- Tenant invoice `OVERDUE` is report-derived only because the tenant `InvoiceStatus` enum does not store `OVERDUE`; unpaid `PENDING`/`PARTIAL` invoices created before today are reported as overdue without changing stored invoice status.

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
- Super Admin subscription lifecycle notifications must target `SUPER_ADMIN`.
- Tenant-facing notifications must target `CENTER_ADMIN`.
- Super Admin notifications are unread until `readAt` is set.
- Subscription lifecycle events that create Super Admin in-app alerts include expiring soon, expired, suspended, renewed, trial ending soon, renewal request submitted, and missing WhatsApp phone.

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
- Super Admin user create/update/status changes
- Super Admin user password reset
- Super Admin user center role assignment/removal
- Super Admin login-as center admin
- Customer deletion
- Appointment deletion/cancellation
- Backup and restore actions

Rules:
- Audit logging must never block the primary action if the log write fails.
- Audit rows should keep relational `actorUserId`, `targetUserId`, and `centerId` when those records can be safely resolved.
- If the actor cannot be resolved, the audit row should still be written with the supplied actor value stored in metadata when available.
- Tenant billing, patient, and appointment financial/clinical mutations must be audited for create, update/status, cancel/archive, restore, payment, credit creation, and credit usage events.
- Critical financial/clinical records must not be hard deleted in normal workflows. Use invoice `CANCELLED`, patient `ARCHIVED`, and appointment `CANCELLED` plus restore flows.

Needs Confirmation:
- Audit retention period.
- Whether centers can view their own audit log.

## 15. Tenant RBAC Permission Key Standard

Tenant center permissions use colon-separated keys. Backend checks, role-permission storage, `/auth/center/me`, `/permissions/me` for tenant-cookie sessions, and frontend permission helpers must use the same canonical keys.

Canonical tenant keys:
- `patients:view`, `patients:create`, `patients:update`, `patients:status`
- `appointments:view`, `appointments:create`, `appointments:update`, `appointments:cancel`, `appointments:status`
- `services:view`, `services:create`, `services:update`, `services:archive`, `services:status`
- `billing:view`, `billing:create`, `billing:update`, `billing:cancel`
- `payments:view`, `payments:create`
- `reports:view`
- `settings:view`
- `permissions:view`, `permissions:update`
- `staff:view`, `staff:create`, `staff:update`, `staff:status`

Rules:
- Legacy dot keys such as `appointments.view`, `appointments.status.update`, `services.archive`, and `billing.mark_paid` may be normalized during reads for backward compatibility, but new saves must use canonical colon keys.
- Tenant service methods must receive the logged-in user's effective permission array, not only the role key.
- Removing a permission from a center role must remove the matching backend API access and hide the matching frontend action.

## 16. Tenant Marketing Tracking Rules

Tenant marketing settings are stored per center and scoped by `centerId`.

Rules:
- Public tracking injection is allowed only on center-specific public journey pages:
  - `/c/[slug]`
  - `/c/[slug]/book`
  - `/c/[slug]/patient/[token]`
- Tracking scripts must not be injected into `/centers`, `/tenant/*`, or `/super-admin/*`.
- The public marketing settings endpoint must never expose `metaConversionApiToken`.
- Current browser event helper supports `PageView`, `ViewCenter`, `StartBooking`, `ViewBookingPage`, `SelectService`, `SelectDateTime`, `SubmitBookingAttempt`, `BookingFailed`, `CompleteBooking`, `PatientPortalView`, `WhatsAppClick`, and `CallClick`.
- Script provider failures must not block booking, WhatsApp, call, or portal UX.
- Marketing QA must verify script injection only on center public journey pages, no Meta Conversion API token leakage in Network responses, browser/provider-stub events firing, booking continuing when provider globals throw, and web build/typecheck passing.
- Server-side Meta Conversion API tracking is allowed only for successful public booking creation.
- Meta CAPI must read `metaPixelId` and `metaConversionApiToken` only on the backend from the center-scoped tenant marketing settings row.
- Tenant admins can manage marketing ids and the Meta CAPI token only from authenticated tenant settings routes with `settings:view`.
- Authenticated settings responses must not echo the raw Meta CAPI token after save; the UI should show a saved/hidden token state and allow replace or clear.
- Tenant marketing settings can send `TestMarketingEvent` test events for Meta Pixel, TikTok Pixel, GA4, Snap Pixel, and backend-only Meta CAPI.
- Meta CAPI test mode must remain backend-only and must never expose `metaConversionApiToken`.
- If a center has no Meta pixel id or conversion token, server-side CAPI tracking must silently skip.
- Meta CAPI provider failures must never block booking creation or expose raw tokens/personal data in logs.
- User data sent to Meta CAPI must hash available phone, email, first name, and last name with SHA-256 after lowercasing and trimming.
- Browser Meta Pixel `CompleteBooking` and server-side Meta CAPI `CompleteBooking` must use the same dedupe id in the format `booking_<bookingRequestId>` (`eventID` in Pixel and `event_id` in CAPI).
- Server-side Meta CAPI attempts for `CompleteBooking` and `TestMarketingEvent` must write tenant-scoped `MarketingTrackingLog` rows with provider, event name, status, short safe message, event id, optional booking request id, and timestamp.
- Marketing debug logs must never store or expose raw Meta CAPI tokens, raw phone numbers, raw emails, raw names, hashed user data payloads, or full provider request payloads.
- Tenant marketing log reads are available only to authenticated tenant users with `settings:view`, and every query must be scoped by the session `centerId`.
- The `MarketingTrackingLog` migration must be applied before logs appear in the tenant UI.
- If the log table is missing or temporarily unavailable, booking creation and Meta CAPI test behavior must continue; log writes are best-effort only.
- Meta CAPI failures must be recorded as safe `FAILED` log rows when the table exists, but they must never block public booking creation.

## 17. Public Booking UX Rules

Public center booking pages must remain center-scoped by slug and use the public center/availability APIs only.

Rules:
- Required booking fields are service, date, available time slot, patient full name, and valid phone number.
- Field validation errors must be localized in EN/AR/HE and shown next to the relevant input or section.
- Slot-unavailable conflicts must clear the selected time, refresh availability, show a localized message, and let the visitor choose another time.
- Service/page loading, slot loading, and submit states must show clear loading or disabled UI.
- Double submit must be prevented client-side; the backend remains the source of truth for slot availability.
- Marketing events must be preserved: `ViewBookingPage`, `SelectService`, `SelectDateTime`, `SubmitBookingAttempt`, `BookingFailed`, and `CompleteBooking`.
- `BookingFailed` must fire for client validation failures, slot conflicts, and API failures, but tracking failures must never block the user experience.
- Mobile layouts must keep touch targets usable and avoid horizontal overflow in EN, AR, and HE.

QA checklist:
- Open `/c/[slug]/book` in EN, AR, and HE.
- Verify center/services loading skeleton appears before data is ready.
- Submit an empty form and confirm service/date/time/name/phone errors are localized.
- Select service/date and confirm slots show loading, disabled unavailable reasons, and usable mobile touch targets.
- Submit with an unavailable/stale slot and confirm the page clears the time, refreshes slots, and tracks `BookingFailed`.
- Submit a valid booking once and confirm the button is disabled/spinning during submit, duplicate submits are blocked, `CompleteBooking` fires, and CAPI behavior remains backend-only.

## 18. Center Website Analytics Rules

Center website analytics track visitor behavior on the public `/c/[slug]` pages and are strictly isolated from platform-level marketing tracking.

Isolation rules:
- Center website analytics (`CenterWebsiteEvent`) must never be mixed with platform tracking (`PlatformTrackingConfig` / `PlatformTrackingLog`).
- Every `CenterWebsiteEvent` row carries `centerId`; cross-center event reads are forbidden.
- The public track endpoint resolves the center by `slug + publicVisible:true` before writing an event; events for inactive/suspended centers are silently dropped.
- `GET /api/v1/tenant/marketing/analytics` derives `centerId` exclusively from the authenticated tenant session and requires `reports:view`.

Session identity:
- An anonymous `sessionId` (24-char hex) is generated client-side and stored in `sessionStorage` under the key `rc_csid_${slug}`.
- Each center page carries its own isolated session id; two different center slugs produce two independent ids in the same browser tab.
- Visitor uniqueness is computed server-side as distinct non-null `sessionId` values for `VIEW_CENTER_WEBSITE` events in the reporting period.

Homepage deduplication:
- `VIEW_CENTER_WEBSITE` must fire at most once per browser session per center slug.
- The client helper `markHomeViewed(slug)` writes `rc_home_${slug}` to `sessionStorage`; subsequent homepage renders within the same session skip the tracking call.

Traffic source detection (client-side, in priority order):
1. `utm_source` query parameter — checked first and takes precedence.
2. `document.referrer` hostname matching — Facebook, Instagram, TikTok, Google are each mapped to their enum value.
3. No referrer / same-origin — mapped to `DIRECT`.
4. Unrecognized referrer — mapped to `UNKNOWN`.

Event types:
- `VIEW_CENTER_WEBSITE` — fired once per session when the center homepage loads successfully.
- `VIEW_BOOKING_PAGE` — fired when `/c/[slug]/book` renders.
- `CLICK_BOOK_NOW` — fired on the Book Now button click in the center website navbar.
- `CLICK_WHATSAPP` — fired when the WhatsApp contact button is clicked.
- `CLICK_PHONE` — fired when the phone contact button is clicked.
- `VIEW_GALLERY` — fired when the gallery page or section is viewed.
- `VIEW_REVIEWS` — fired when the reviews page or section is viewed.
- `VIEW_BEFORE_AFTER` — fired when the before/after page or section is viewed.
- `VIEW_OFFERS` — fired when the offers page or section is viewed.
- `VIEW_CONTACT` — fired when the contact page or section is viewed.
- `VIEW_SERVICES` — fired when the services page or section is viewed.
- `SELECT_SERVICE` — fired when a service is selected in the booking form; carries `extraData: { serviceId, serviceName }`.
- `COMPLETE_BOOKING` — fired when a booking request is successfully submitted from the booking page.
- `SELECT_OFFER` — fired when a visitor selects an offer.

Tracking behavior:
- All tracking calls use `keepalive: true` on the `fetch` so the request survives page navigation.
- All tracking errors are silently swallowed; analytics must never block user experience.
- Script provider pixel tracking (Meta, TikTok, GA4) is separate from center website event tracking.

Dashboard metrics (30-day window):
- `visitors` — distinct `sessionId` count for `VIEW_CENTER_WEBSITE`.
- `bookingPageViews` — count of `VIEW_BOOKING_PAGE` events.
- `bookNowClicks` — count of `CLICK_BOOK_NOW` events.
- `whatsappClicks` — count of `CLICK_WHATSAPP` events.
- `phoneClicks` — count of `CLICK_PHONE` events.
- `contactPageViews` — count of `VIEW_CONTACT` events.
- `galleryViews` — count of `VIEW_GALLERY` events.
- `reviewsViews` — count of `VIEW_REVIEWS` events.
- `beforeAfterViews` — count of `VIEW_BEFORE_AFTER` events.
- `completedBookings` — count of `COMPLETE_BOOKING` events.
- `conversionRate` — `completedBookings / visitors` (formatted as a percentage string; zero visitors returns `0%`).
- Traffic sources — grouped by `source` enum, each entry has `source`, `count`, and `percent`.
- `dailyVisitors` — per-day unique session counts for `VIEW_CENTER_WEBSITE` (Map deduplication in memory).
- `bookingAttempts` — per-day count of `COMPLETE_BOOKING` events.
- `topPages` — aggregated `VIEW_*` events by `page` field, ordered by count.
- `topServices` — `SELECT_SERVICE` events grouped by `extraData.serviceName`, ordered by count.

Booking page rules:
- `/c/[slug]/book` must use a center-branded `BookingNavbar` showing center logo/name/links, not the RoyalCare platform `PublicHeader`.
- `BookingNavbar` uses already-fetched `PublicCenterDetail` data; no additional API call is needed.
- Tracking events on the booking page: `VIEW_BOOKING_PAGE` fires on render, `SELECT_SERVICE` fires on service selection with `extraData`, and `COMPLETE_BOOKING` fires on successful booking submission.

## 19. Smart Contact Widget Rules

A floating Smart Contact Widget appears on all public center pages (`/c/[slug]/*`) and the booking page.

Rules:
- The widget is center-scoped and uses only already-fetched `PublicCenterDetail` data; no additional API call is made.
- The widget reuses the center's `branding.primaryColor` for the Book Now action and the main toggle button.
- Each action is hidden automatically when the required branding field is missing or empty:
  - WhatsApp action: requires `branding.whatsappPhone`.
  - Phone action: requires `branding.phone` (falls back to `branding.whatsappPhone` as call target when only WhatsApp is set).
  - Google Maps action: requires `branding.googleMapsUrl`.
  - Messenger action: requires `branding.facebookUrl` from which a `https://m.me/` handle is derived; derivation is skipped when the URL cannot produce a clean page handle.
  - Book Now action: always present on all pages except the booking page itself (`showBook={false}` on `/c/[slug]/book`).
- The widget is fixed-positioned at the bottom-right corner with `z-50`; the navbar uses `z-40`.
- On mobile it respects the iPhone safe area via `calc(env(safe-area-inset-bottom, 0px) + 1.5rem)`.
- The existing `pb-20 sm:pb-6` on the page main content prevents the widget from overlapping content on mobile.
- The widget closes on outside click and Escape key.
- If all computed actions result in an empty list the widget renders nothing (`return null`).
- Tracking events fired from the widget use the current page slug as `page` context: `CLICK_WHATSAPP`, `CLICK_PHONE`, `CLICK_BOOK_NOW`, `CLICK_MAP`, `CLICK_MESSENGER`.
- `CLICK_MAP` and `CLICK_MESSENGER` are center website event types added for the widget; they are stored in `CenterWebsiteEvent` and listed in `VALID_EVENT_TYPES` in `center-analytics.service.ts`.
- Platform tracking (Meta, TikTok, GA4) is separate and must not be called from the widget.
- Component file: `apps/web/src/components/center/SmartContactWidget.tsx` — shared between `CenterProfilePage.tsx` and `BookingPage.tsx`.
## 20. Custom One-Time Appointment Services

Tenant staff can create or edit an appointment with a service that is not in the center's saved catalog.

Rules:
- Default appointment flow still uses the active services dropdown.
- Custom mode hides the services dropdown and requires a custom service name plus duration; price is optional.
- Validation requires either a saved `serviceId` or a `customServiceName` for normal appointments.
- Provider assignment, treatment notes, internal notes, and appointment status flow behave the same for custom appointments.
- Custom appointments display a "Custom service" badge in appointment list/detail and billing surfaces.
- If "save as future service" is selected, the API creates a real `Service` record scoped to the current `centerId` and links it to the appointment.
- Temporary custom services do not require a `Service` row; billing can create an invoice with nullable `serviceId`, `customServiceName`, and the custom/manual invoice amount.
- Tenant financial reports group revenue from custom-service invoices under the custom service name.
