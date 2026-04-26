# RoyalCare - Business Rules

Last updated: 2026-04-26
Status: Initial business rules

## 1. Platform Model

RoyalCare is the parent SaaS platform. It sells websites and admin systems to multiple centers.

Each center is a tenant. A center receives its own website, admin panel, customers, appointments, branding, enabled modules, and domain configuration.

## 2. Tenant Rules

Mandatory rules:
- Every center is isolated by `centerId`.
- Center-owned data must not be visible across centers.
- Center users can only access centers they are assigned to.
- Customers belong to a specific center.
- Super Admin can access tenant data only for legitimate platform administration and support.
- Tenant status and subscription status can restrict access.

Needs Confirmation:
- Whether users can own or manage multiple centers.
- Whether one customer can have accounts in multiple centers using one login.

## 3. Subscription Rules

RoyalCare controls access through subscriptions.

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
- Payment provider.
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
- Public content should support translations.
- Admin UI should be prepared for translation.

Needs Confirmation:
- Whether all languages are required for every center.
- Fallback language behavior.
- Who enters translations: RoyalCare, center owner, or automatic translation.

## 9. Appointment Rules

Appointments belong to a center and customer.

Appointment statuses:
- Requested
- Confirmed
- Completed
- Cancelled
- No-show

Rules:
- Appointment time must include timezone handling.
- Appointment must be scoped to `centerId`.
- Customer portal should only show the customer's own appointments.
- Center admin can manage appointments if permission allows.

Needs Confirmation:
- Working hours rules.
- Staff availability rules.
- Booking lead time.
- Cancellation window.
- Whether online booking is request-only or auto-confirmed.

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

## 14. Audit Rules

Actions that should be audited:
- Super Admin login
- Center creation/update/suspension
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
