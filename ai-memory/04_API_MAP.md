## 2026-06-17 - Public Booking Mode

- `GET /api/v1/public/centers/:slug` now returns `branding.publicBookingMode`.
- `PATCH /api/v1/tenant/public-profile` accepts `publicBookingMode` as `SIMPLE_REQUEST` or `DIRECT_BOOKING`.
- `PATCH /api/v1/admin/centers/:centerId/public-profile` accepts the same field for Super Admin public profile editing.
- `POST /api/v1/public/centers/:slug/booking-requests` branches by the center setting:
  - `SIMPLE_REQUEST`: requires full name and phone, accepts optional `serviceId`, `offerId`, `patientArea`, `branchId`, and note, stores `source=PUBLIC_WEBSITE`, and does not require provider/date/time. `branchId` is required only when the center has multiple active branches and is auto-filled when there is exactly one active branch.
  - `DIRECT_BOOKING`: preserves service/provider/date/time validation and slot availability checks.
- `GET /api/v1/tenant/booking-requests` returns `patientArea`, `branchId`, and `branch`, and may return `requestedDate=null` for simple contact requests.

## 2026-06-07 - Tenant Staff Provider Flag

- Tenant staff create/update/list/detail payloads include `providerEnabled`.
- `GET /api/v1/tenant/appointments/options` and tenant schedule provider lists include active staff assignments when `providerEnabled=true OR userId=center.ownerUserId`, then de-duplicate users with multiple center roles.
- Appointment create/update provider validation accepts active same-center staff assignments when `providerEnabled=true OR userId=center.ownerUserId`, so the active owner remains selectable and saveable even if older data has `providerEnabled=false/null`.

# RoyalCare - API Map

Latest update 2026-06-08: Tenant service create/update/list/detail APIs include `treatmentTemplates` for finite treatment plans. Appointment create/update accepts optional `treatmentTemplateId`; appointment options return each service's active templates so `/tenant/appointments/new` can default to the service default protocol. Appointment creation snapshots the selected template or patient-specific override into the appointment, and follow-up plan generation copies that snapshot into each `PatientFollowUp` row.

Last updated: 2026-06-06
Status: Dedicated tenant login, tenant patients, services, appointments, follow-ups, tenant staff, booking requests, tenant notifications, tenant website builder settings, center website gallery/reviews/before-after, center website analytics, and public pricing/contact routes documented

Latest public profile branch endpoints:
- `GET /api/v1/admin/centers/:centerId/public-profile/branches`
- `POST /api/v1/admin/centers/:centerId/public-profile/branches`
- `PATCH /api/v1/admin/centers/:centerId/public-profile/branches/:branchId`
- `DELETE /api/v1/admin/centers/:centerId/public-profile/branches/:branchId` soft-deactivates a branch.
- `PATCH /api/v1/admin/centers/:centerId/public-profile/branches/reorder`
- Tenant equivalents exist under `/api/v1/tenant/public-profile/branches`.
- `GET /api/v1/public/centers/:slug` now returns active `branches[]` sorted by main branch first, then `sortOrder`.

Rules:
- Branch management is center-scoped. Super Admin routes require the platform permission guard; tenant routes derive `centerId` from the signed center session and require `settings:view`.
- Public websites prefer active branch rows for contact/location display. Legacy `BrandingSettings` address/phone/WhatsApp fields remain fallback for centers without branches.
- Branches are public profile/contact data only. Appointments, services, and staff are not branch-aware in this update.

Latest public pricing/contact endpoints:
- `GET /api/v1/public/plans` — public pricing plan list used by `/pricing`.
- `GET /api/v1/public/platform-contact` — public-safe platform sales WhatsApp contact used by pricing CTAs.

Latest Super Admin center management endpoint:
- `PATCH /api/v1/centers/:centerId/public-visibility` and alias `PATCH /api/v1/super-admin/centers/:centerId/public-visibility` — updates whether a center appears in public center listings. Requires platform session cookie and `edit:centers`.

Rules:
- Public pricing CTAs open WhatsApp directly with a prefilled message; no checkout or lead storage is part of this flow.
- `GET /api/v1/public/platform-contact` returns only `{ salesWhatsappNumber }`, using `public_sales_whatsapp` with safe fallback to public support WhatsApp/phone.
- Protected platform settings endpoints use the Super Admin platform session cookie through `PermissionGuard`; they do not require the legacy `x-royalcare-super-admin-user-id` header.

Latest center analytics endpoints:
- `POST /api/v1/public/centers/:slug/track` — fire-and-forget public event ingestion (no auth)
- `GET /api/v1/tenant/marketing/analytics` — center website analytics dashboard (session auth, `reports:view`)

Latest tenant financial reports endpoint:
- `GET /api/v1/tenant/reports/financial` - center financial dashboard data (session auth, `reports:view`), including revenue cards/charts, receivables KPIs, receivable detail rows, receivables by payment status, top patients by debt, revenue-vs-receivables chart data, and `reportMeta` with the active range and included invoice/payment counts.

Rules:
- Tenant financial reports derive `centerId` from the authenticated tenant session.
- Receivable values are calculated from invoice amount, payment totals, credit-use totals, and derived remaining amount/payment status. The report must not treat invoice total as collected revenue.
- Revenue is filtered by actual collection dates (`Payment.paidAt` and credit-use `createdAt`); invoice activity counts are filtered by invoice `createdAt`.
- Receivables are not limited by the selected report range by default. They include every same-center, non-cancelled invoice with computed remaining balance greater than zero until fully paid.
- Supported query filters include `period=today|last7days|week|month|custom`, `from`, `to`, `openOnly=true`, and `overdueOnly=true`.

Latest center website builder endpoints:
- `GET /api/v1/tenant/before-after`
- `POST /api/v1/tenant/before-after`
- `PATCH /api/v1/tenant/before-after/:id`
- `DELETE /api/v1/tenant/before-after/:id`
- `POST /api/v1/tenant/before-after/upload`
- `GET /api/v1/public/centers/:slug/before-after`

Rules:
- Tenant before/after endpoints derive `centerId` from the authenticated tenant session.
- Public before/after endpoint resolves `slug` to the center id and returns published items only.
- Public response does not expose tenant/admin-only fields.

## 1. API Principles

Recommended style:
- REST API
- Base path: `/api/v1`
- JSON request/response
- DTO validation in NestJS
- OpenAPI documentation
- Consistent error format
- Consistent pagination format

Rules:
- Tenant-owned endpoints must resolve and enforce `centerId`.
- Do not trust arbitrary client-provided `centerId`.
- Module access must be checked server-side.
- Permission checks must be enforced on every protected endpoint.

Needs Confirmation:
- Whether GraphQL is required. Current recommendation: REST first.

## 2. Common Response Patterns

List response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

## 2.1 Permanent Error Response Standard

RoyalCare APIs must never rely on generic user-facing errors for normal validation or business-rule failures.

Required validation error shape:

```json
{
  "message": "Validation failed",
  "errors": {
    "adminPhone": "Phone number is already used",
    "adminEmail": "Email is already used"
  }
}
```

Rules:
- `errors` keys must be stable field keys that the frontend can map directly to inputs.
- Current required form field keys include `centerName`, `adminEmail`, `adminPhone`, `subscriptionPlan`, `startDate`, `expiryDate`, and `domain`.
- Backend services must return user-readable errors for validation and business-rule failures.
- Backend responses must support Arabic, Hebrew, and English for user-facing form errors, either as localized strings or locale maps such as `{ "en": "...", "ar": "...", "he": "..." }`.
- Prisma `P2002` unique constraint failures must be caught and mapped to field-specific duplicate messages.
- Missing required fields must be returned as field-specific required messages.
- Invalid enum values must be returned as readable field messages, not raw enum errors.
- Date rules such as subscription expiry before start date must be returned as field-specific messages.
- Technical errors, stack traces, Prisma internals, DTO names, and raw database messages must never be exposed to normal users.
- The frontend may log technical details during development, but visible UI must show only clear translated user-facing messages.

Implementation priority:
- Add New Center Wizard
- Users forms
- Subscriptions forms
- Domains forms
- Plans forms

## 2.2 Password Security Standard

User passwords must never be stored or returned as plain text.

Rules:
- APIs may accept a one-time password field only for creation/reset workflows.
- Before writing any user password, the backend must hash it with a secure password hashing algorithm.
- RoyalCare currently hashes backend-created user passwords with Node.js `crypto.scrypt` in `services/api/src/common/security/password-hashing.ts`.
- Password hashes must be stored only in `User.passwordHash`.
- `passwordHash` must never be selected in API response payloads.
- User response payloads must use the shared safe projection at `services/api/src/common/database/safe-user-select.ts`.
- Centers list, center details, users list, user details, and center-role assignment responses must never expose `passwordHash` or plaintext passwords.
- Admin UI must use password operations such as Reset Password, Force Password Change, and Welcome Email trigger instead of displaying password values.

## 2.3 Implemented Operational Endpoints

Currently implemented:
- `GET /api/v1/health`
- `GET /api/v1/auth/center/resolve/:centerSlug`
- `POST /api/v1/auth/center/login`
- `GET /api/v1/auth/center/me`
- `POST /api/v1/auth/center/logout`
- `GET /api/v1/tenant/services`
- `POST /api/v1/tenant/services`
- `GET /api/v1/tenant/services/:serviceId`
- `PATCH /api/v1/tenant/services/:serviceId`
- `PATCH /api/v1/tenant/services/:serviceId/status`
- `GET /api/v1/tenant/appointments`
- `GET /api/v1/tenant/appointments/options`
- `POST /api/v1/tenant/appointments`
- `GET /api/v1/tenant/appointments/:appointmentId`
- `PATCH /api/v1/tenant/appointments/:appointmentId`
- `PATCH /api/v1/tenant/appointments/:appointmentId/status`
- `PATCH /api/v1/tenant/appointments/:appointmentId/cancel`
- `GET /api/v1/tenant/staff`
- `POST /api/v1/tenant/staff`
- `GET /api/v1/tenant/staff/:staffId`
- `PATCH /api/v1/tenant/staff/:staffId`
- `PATCH /api/v1/tenant/staff/:staffId/status`
- `GET /api/v1/tenant/billing`
- `GET /api/v1/tenant/billing/options`
- `POST /api/v1/tenant/billing`
- `GET /api/v1/tenant/billing/:invoiceId`
- `PATCH /api/v1/tenant/billing/:invoiceId/status`
- `GET /api/v1/tenant/billing/:invoiceId/payments`
- `GET /api/v1/tenant/public-profile`
- `PATCH /api/v1/tenant/public-profile`
- `POST /api/v1/tenant/public-profile/upload-image`
- `GET /api/v1/tenant/center-gallery`
- `POST /api/v1/tenant/center-gallery/upload`
- `DELETE /api/v1/tenant/center-gallery/:id`
- `PATCH /api/v1/tenant/center-gallery/reorder`
- `GET /api/v1/tenant/reviews`
- `POST /api/v1/tenant/reviews`
- `PATCH /api/v1/tenant/reviews/:id`
- `DELETE /api/v1/tenant/reviews/:id`
- `GET /api/v1/public/centers/:slug`
- `GET /api/v1/public/centers/:slug/gallery`
- `GET /api/v1/public/centers/:slug/reviews`

Public center profile response notes:
- `GET /api/v1/public/centers/:slug` returns public-safe center website fields from `BrandingSettings`, including logo, cover image, primary/secondary colors, localized short/full descriptions, localized slogans, localized address, WhatsApp, phone, email, Google Maps URL, localized working-hours text, and public social links.
- `GET /api/v1/public/centers/:slug` also returns public-safe website builder fields `websiteSectionOrder` and `websiteSectionVisibility`; these control `/c/[slug]` homepage section order and navbar/footer visibility.
- It must never include tenant-private settings, admin-only notes, or marketing server-side tokens such as `metaConversionApiToken`.
- `GET/PATCH /api/v1/tenant/public-profile` persists the same builder fields for the authenticated center only. Tenant clients must not provide or trust `centerId`.
- `GET /api/v1/public/centers/:slug/gallery` returns only center-scoped public gallery image ids, image URLs, and sort order for active/public/subscribed centers.
- `GET /api/v1/public/centers/:slug/reviews` returns only published center-scoped reviews with customer name, rating, localized comments, and sort order. It never exposes phone/email/private patient data.
- The web center website routes `/c/[slug]`, `/c/[slug]/about`, `/c/[slug]/services`, `/c/[slug]/contact`, `/c/[slug]/gallery`, and `/c/[slug]/reviews` all use public-safe center data.
- `/c/[slug]/services` renders all active public services from this response; `/c/[slug]/about` renders public full description, working hours, and center info; `/c/[slug]/contact` renders public contact/social/map fields.
- `/c/[slug]` renders a Gallery section only when `GET /api/v1/public/centers/:slug/gallery` returns images; `/c/[slug]/gallery` renders the full center gallery.
- `/c/[slug]` renders a Reviews section only when `GET /api/v1/public/centers/:slug/reviews` returns published reviews; `/c/[slug]/reviews` renders the full public reviews page.
- `POST /api/v1/tenant/billing/:invoiceId/payments`
- `GET /api/v1/patients`
- `POST /api/v1/patients`
- `GET /api/v1/patients/:patientId`
- `PATCH /api/v1/patients/:patientId`
- `PATCH /api/v1/patients/:patientId/status`
- `GET /api/v1/super-admin/centers`
- `POST /api/v1/super-admin/centers`
- `GET /api/v1/super-admin/centers/:centerId`
- `GET /api/v1/centers`
- `POST /api/v1/centers`
- `GET /api/v1/centers/:centerId`
- `PATCH /api/v1/centers/:centerId`
- `PATCH /api/v1/centers/:centerId/status`
- `PATCH /api/v1/centers/:centerId/subscription`
- `GET /api/v1/centers/:centerId/internal-notes`
- `POST /api/v1/centers/:centerId/internal-notes`
- `GET /api/v1/centers/:centerId/staff`
- `POST /api/v1/centers/:centerId/staff`
- `PATCH /api/v1/centers/:centerId/staff/:userId`
- `PATCH /api/v1/centers/:centerId/staff/:userId/status`
- `POST /api/v1/centers/:centerId/staff/:userId/reset-password`
- `GET /api/v1/super-admin/users`
- `POST /api/v1/super-admin/users`
- `GET /api/v1/super-admin/users/:userId`
- `POST /api/v1/super-admin/users/:userId/center-roles`
- `GET /api/v1/permissions/me`
- `GET /api/v1/permissions/platform-roles`
- `POST /api/v1/permissions/platform-users/:userId/roles`
- `GET /api/v1/super-admin/subscriptions`
- `POST /api/v1/super-admin/subscriptions`
- `GET /api/v1/super-admin/subscriptions/:subscriptionId`
- `GET /api/v1/super-admin/subscriptions/:subscriptionId/timeline`
- `POST /api/v1/super-admin/subscriptions/:subscriptionId/manual-whatsapp-log`
- `GET /api/v1/super-admin/subscriptions/invoices`
- `POST /api/v1/super-admin/subscriptions/invoices`
- `PATCH /api/v1/super-admin/subscriptions/invoices/:invoiceId/mark-paid`
- `PATCH /api/v1/super-admin/subscriptions/invoices/:invoiceId/cancel`
- `GET /api/v1/super-admin/subscriptions/invoices/:invoiceId/pdf`
- `GET /api/v1/super-admin/subscriptions/lifecycle-job/status`
- `POST /api/v1/super-admin/subscriptions/run-lifecycle-job`
- `GET /api/v1/super-admin/centers/:centerId/subscription`
- `GET /api/v1/tenant/subscription/invoices`
- `GET /api/v1/tenant/reports/financial`
- `GET /api/v1/public/centers/:slug` - returns public center profile, active services, and active public providers.
- `GET /api/v1/public/centers/:slug/gallery` - returns public-safe gallery images scoped by the resolved center slug.
- `GET /api/v1/public/centers/:slug/reviews` - returns published public-safe reviews scoped by the resolved center slug.
- `GET /api/v1/public/centers/:slug/availability?serviceId=&date=&providerId=` - returns availability slots with unavailable reasons; `providerId` is optional.
- `POST /api/v1/public/centers/:slug/booking-requests` - accepts optional `providerId` and revalidates availability with the selected provider.
- `GET /api/v1/tenant/booking-requests`
- `PATCH /api/v1/tenant/booking-requests/:id/accept`
- `PATCH /api/v1/tenant/booking-requests/:id/reject`
- `GET /api/v1/tenant/notifications`
- `GET /api/v1/tenant/notifications/stream`
- `PATCH /api/v1/tenant/notifications/:id/read`

Purpose:
- Basic service health check for local development, deployment checks, and future monitoring.

Response:

```json
{
  "service": "royalcare-api",
  "status": "ok"
}
```

Notes:
- Centers, Users, Subscriptions, and platform RBAC endpoints are the first real database-backed foundation endpoints.
- Tenant Patients and Tenant Services endpoints are protected by the signed center session cookie and always derive `centerId` from the authenticated center staff session.
- Tenant Appointments endpoints are protected by the signed center session cookie and always derive `centerId` from the authenticated center staff session.
- Public booking creation creates a `BOOKING_REQUEST_CREATED` Center Admin in-app notification with `actionUrl: "/tenant/booking-requests"`, emits it through the tenant notification SSE stream, and returns `bookingRequestId` for same-browser UI refresh events.
- Permission guards now protect the implemented Super Admin Centers and Users actions.
- Full authentication and tenant-aware request context still need to be added before production exposure.

Error response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {}
  }
}
```

## 3. Auth API

Endpoints:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/center/resolve/:centerSlug` - implemented for dedicated branded center login
- `POST /api/v1/auth/center/login` - implemented for center staff users
- `GET /api/v1/auth/center/me` - implemented for current center staff session
- `POST /api/v1/auth/center/logout` - implemented for center staff sessions

Implemented center staff auth behavior:
- Dedicated center login route is `/c/:centerSlug/login`; `/tenant/login` remains a generic fallback.
- Center login resolution by slug returns safe center identity, branding logo URL, primary language, status, and `loginAllowed`.
- Center login resolution uses the stored center branding logo when present and lets the web app fall back to center initials when no logo is stored.
- Center login resolution applies the center default language; Arabic and Hebrew must render RTL, while English renders LTR.
- Authenticates center staff users by email and password against real PostgreSQL users.
- Passwords are verified with the existing scrypt password hash; plaintext passwords are never stored or returned.
- Login requires an active center-scoped `UserRole.centerId` assignment with one of the staff roles.
- Slug-scoped login requires the user role assignment to belong to the resolved center slug; users assigned to another center are rejected.
- Inactive users cannot log in.
- Suspended, cancelled, and archived centers are blocked.
- Login sets an HttpOnly signed `royalcare_center_session` cookie.
- `/auth/center/me` resolves the current user, role, and center from the signed session cookie and re-checks center-scoped membership.
- Logout clears the center session cookie.
- Auth responses return safe user and center fields only and must never include password, passwordHash, tokens, secrets, or auth metadata.

Needs Confirmation:
- JWT cookie sessions vs bearer tokens.
- Whether phone/passwordless login is required.
- MFA requirements for Super Admin.

## 4. Tenancy API

Endpoints:
- `GET /api/v1/tenant/current`
- `GET /api/v1/tenant/modules`
- `GET /api/v1/tenant/branding`
- `GET /api/v1/tenant/languages`

Purpose:
- Used by frontend and future mobile app to understand active center context.

## 4.1 Tenant Patients API

Implemented endpoints:
- `GET /api/v1/patients` - lists patients for the authenticated center only; supports `search` by name or phone. Responses include a computed `summary` per patient with latest completed/booked appointment, nearest upcoming scheduled/confirmed appointment, treatment/follow-up plan count, overdue follow-up/session count, outstanding invoice balance, upcoming appointment count, and total linked records.
- `POST /api/v1/patients` - creates a patient in the authenticated center only.
- `GET /api/v1/patients/:patientId` - returns one patient only when it belongs to the authenticated center.
- `PATCH /api/v1/patients/:patientId` - updates one patient only when it belongs to the authenticated center.
- `PATCH /api/v1/patients/:patientId/status` - updates patient status to `ACTIVE`, `INACTIVE`, or `ARCHIVED`.

Validation:
- `fullName` is required for create.
- `phone` is required and must match the RoyalCare phone validation pattern.
- Duplicate phone is rejected only inside the same center with `409 errors.phone`.
- Invalid status is rejected with `400 errors.status`.
- Missing or cross-center patients return `404 Patient not found`.

Security:
- Tenant `centerId` is never accepted from the client body or query.
- The API uses the signed `royalcare_center_session` cookie and re-checks active center membership through `/auth/center/me` logic.
- Platform admin users do not use this tenant API directly.
- Patient responses contain patient fields only and no password, passwordHash, token, secret, auth verification, last-login, or deleted metadata fields.

## 4.3 Tenant Billing API

Implemented endpoints:
- `GET /api/v1/tenant/billing` — lists invoices for the authenticated center; supports `search` (patient name or phone) and `status` (`PENDING`, `PAID`, `CANCELLED`, or `ALL`) query params.
- `GET /api/v1/tenant/billing/options` — returns dropdown options for the create-invoice form: active patients, active non-archived services (with price), and all active center staff as providers.
- `POST /api/v1/tenant/billing` — creates a new `PENDING` invoice in the authenticated center.
- `GET /api/v1/tenant/billing/:invoiceId` — returns one invoice only when it belongs to the authenticated center.
- `PATCH /api/v1/tenant/billing/:invoiceId/status` — transitions invoice status; enforces `billing.mark_paid` for `PAID` and `billing.update` for `CANCELLED`; rejects forbidden transitions.

Validation:
- `patientId` must be a valid UUID of a patient in the same center.
- `serviceId` must be a valid UUID of an active service in the same center.
- `staffUserId` is optional; when provided must be a valid UUID of an active staff user in the same center.
- `amount` must be a positive decimal greater than zero.
- `currency` is required (defaults to `ILS` when empty).
- `notes` is optional free text.
- Status transitions: `CANCELLED` invoices cannot be updated; `PAID` invoices can only be cancelled.

Security:
- Tenant `centerId` is never accepted from the client body or query.
- All endpoints use the signed `royalcare_center_session` cookie and re-check center membership.
- `billing.view` is required for all read operations.
- `billing.create` is required to create an invoice.
- `billing.mark_paid` is required to transition to `PAID`.
- `billing.update` is required to transition to `CANCELLED`.
- Invoice responses contain no `passwordHash`, token, secret, or auth metadata fields.
- `invoice.amount` and `service.price` are serialized as strings (from Prisma `Decimal`) in all responses.

## 4.4 Tenant Financial Reports API

Implemented endpoint:
- `GET /api/v1/tenant/reports/financial` - returns Center Admin financial report cards and chart datasets for the authenticated center only.

Query:
- `period=today|last7days|month|custom`
- `from=YYYY-MM-DD` and `to=YYYY-MM-DD` when `period=custom`

Response:
- `cards`: `revenueToday`, `revenueThisMonth`, `paidInvoices`, `pendingInvoices`, `overdueInvoices`, `totalPatientCredit`, and `averageInvoiceValue`.
- `charts`: `revenueByDay`, `revenueByPaymentStatus`, `revenueByService`, and `topPatientsBySpending`.
- `currency`, `periodStart`, and `periodEnd`.

Rules:
- Uses the authenticated center staff session and derives `centerId` server-side.
- Requires `reports:view`.
- Excludes `CANCELLED` invoices from report invoice and revenue calculations.
- Includes both cash payments and `CREDIT_USE` patient credit usage in revenue charts and top-patient spending.
- Existing `GET /api/v1/tenant/billing/summary` and `GET /api/v1/tenant/reports/top-patients` remain available for compatibility.

## 5. Super Admin - Centers

Endpoints:
- `GET /api/v1/super-admin/centers` - implemented
- `POST /api/v1/super-admin/centers` - implemented
- `GET /api/v1/super-admin/centers/:centerId` - implemented
- `PATCH /api/v1/super-admin/centers/:centerId`
- `POST /api/v1/super-admin/centers/:centerId/suspend`
- `POST /api/v1/super-admin/centers/:centerId/activate`
- `POST /api/v1/super-admin/centers/:centerId/cancel`

Implemented foundation behavior:
- List centers with pagination, search, status, and type filters.
- View one center with basic center info, owner/admin info, branding settings, subscriptions, domains, tenant status, `createdAt`, `updatedAt`, and active user-role assignments.
- `GET /api/v1/centers/:centerId` returns `404 Not Found` when the center id does not exist.
- `GET /api/v1/centers/:centerId` also returns `404 Not Found` for malformed center ids instead of exposing Prisma errors.
- Center detail responses select owner/admin users through `safeUserSelect` and must never include `passwordHash`, plaintext passwords, or sensitive auth fields.
- Center list, detail, and create responses select safe domain fields and must never expose domain verification tokens.
- Create a center with admin user upsert, center-scoped admin role assignment, branding settings, initial subscription, and optional domain in one transaction.
- `POST /api/v1/centers` is available as a web-friendly creation alias for the Add New Center wizard; the existing Super Admin path remains available.
- `/super-admin/centers` now consumes `GET /api/v1/centers` for its real PostgreSQL-backed list.
- The real centers list includes owner/admin, branding, latest subscription, and primary domain data needed by `/super-admin/centers`.
- `/super-admin/centers/[id]` uses `GET /api/v1/centers/:centerId` as the only details data source and no longer falls back to mock center records.
- `PATCH /api/v1/centers/:centerId` updates center name, type, status, owner/admin name/email/phone, latest subscription plan/dates, and primary domain.
- Center update validation returns field-specific errors for `centerName`, `adminEmail`, `adminPhone`, `subscriptionPlan`, `startDate`, `expiryDate`, and `domain`.
- Center update rejects duplicate admin email, duplicate admin phone, and duplicate domain with field-specific `409 Conflict` responses.
- Center update does not accept or update passwords and returns users through `safeUserSelect`.
- `PATCH /api/v1/centers/:centerId/status` changes a center status to `ACTIVE`, `SUSPENDED`, or `CANCELLED`.
- Status changes reject unsupported statuses such as `INACTIVE` with `400 errors.status`.
- Status changes to `SUSPENDED` and `CANCELLED` require a reason and return `400 errors.reason` when missing.
- Status changes create an automatic private internal note describing the transition and reason.
- Status change responses return the same safe center detail projection and never expose password, password hash, token, secret, or auth metadata.
- `PATCH /api/v1/centers/:centerId/subscription` manually updates a center subscription plan, status, start/end dates, next renewal date, and billing notes.
- Manual subscription plans are `BASIC`, `STANDARD`, `PREMIUM`, and `ENTERPRISE`.
- Manual subscription statuses are `TRIAL`, `ACTIVE`, `EXPIRED`, `OVERDUE`, and `CANCELLED`; these map to persisted subscription statuses without any payment gateway integration.
- Manual subscription validation returns `errors.subscriptionPlan`, `errors.subscriptionStatus`, or `errors.subscriptionDates`.
- Manual subscription changes create an automatic private internal note.
- No Stripe, PayPal, card, checkout, or external payment provider fields are supported or returned.
- `GET /api/v1/centers/:centerId/internal-notes` lists private Super Admin internal notes newest first.
- `POST /api/v1/centers/:centerId/internal-notes` creates a private Super Admin internal note for a center.
- Internal note creation rejects empty notes with `400 errors.note` and returns `404 Center not found` for missing or malformed center ids.
- Internal note responses include note text, safe author info, `createdAt`, and `updatedAt`; they must never include passwords, password hashes, tokens, secrets, or auth metadata.
- Internal notes are a Super Admin support feature and are not included in normal center detail responses.
- `GET /api/v1/centers/:centerId/staff` lists center-scoped staff users assigned through `UserRole.centerId`.
- `POST /api/v1/centers/:centerId/staff` creates a safe center staff user and assigns a center-scoped staff role.
- `PATCH /api/v1/centers/:centerId/staff/:userId` updates staff name, email, phone, role, and status only when the user belongs to the route center.
- `PATCH /api/v1/centers/:centerId/staff/:userId/status` activates/deactivates/suspends a center staff user only within that center.
- `POST /api/v1/centers/:centerId/staff/:userId/reset-password` resets a staff temporary password and returns the generated temporary password for the Super Admin reset operation only.
- Staff reset stores only the scrypt password hash in the database and never returns `passwordHash`.
- Center staff roles are `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF`.
- Center staff validation returns field-specific errors for `fullName`, `email`, `phone`, `role`, `status`, and `temporaryPassword`.
- Center staff responses include only safe UI fields: id, fullName, email, phone, role, status, createdAt, and updatedAt.
- Staff users cannot be listed, updated, status-changed, or password-reset through a different center id.
- Creation validation currently enforces center name, owner/admin email, owner/admin phone, subscription plan, default language, enabled languages, and that enabled languages include the default language.
- Creation validation also enforces owner/admin name, valid owner/admin email format, valid owner/admin phone format, required temporary password, and minimum temporary password length.
- Missing owner/admin phone returns `400 Bad Request` with field key `errors.adminPhone` and localized English, Arabic, and Hebrew messages.
- Center admin creation now pre-checks duplicate admin email and duplicate admin phone before writing the user record. Duplicate admin phone returns `409 Conflict` with `errors.adminPhone` localized in English, Arabic, and Hebrew instead of allowing Prisma `P2002` to bubble as a `500`.
- Duplicate domain creation returns `409 Conflict` with field key `errors.domain`.
- The current Create Center frontend does not mark domain as required, so backend domain remains optional unless a domain hostname is provided.

Permissions:
- `view:centers`
- `create:centers`
- `edit:centers`
- `suspend:centers`
- `manage:subscriptions`
- `view:internal_notes`
- `manage:internal_notes`
- `view:users`
- `manage:users`

## 6. Super Admin - Subscriptions

Endpoints:
- `GET /api/v1/super-admin/plans`
- `POST /api/v1/super-admin/plans`
- `PATCH /api/v1/super-admin/plans/:planId`
- `GET /api/v1/super-admin/subscriptions` - implemented
- `POST /api/v1/super-admin/subscriptions` - implemented
- `GET /api/v1/super-admin/subscriptions/:subscriptionId` - implemented
- `GET /api/v1/super-admin/subscriptions/lifecycle-job/status` - implemented
- `POST /api/v1/super-admin/subscriptions/run-lifecycle-job` - implemented
- `GET /api/v1/super-admin/centers/:centerId/subscription` - implemented
- `PATCH /api/v1/super-admin/centers/:centerId/subscription`

Implemented foundation behavior:
- List subscriptions with pagination, search, status, and center filters.
- View one subscription.
- Create a subscription for a center.
- Get the latest subscription for a center.
- Monitor subscription lifecycle automation status.
- Run the subscription lifecycle job manually for QA/operations.

Permissions:
- `manage:plans`
- `view:reports`
- `manage:subscriptions`

Needs Confirmation:
- Manual billing export/reporting endpoints. Online payment webhooks are out of scope unless explicitly approved later.

## 6.1 Super Admin - Users

Endpoints:
- `GET /api/v1/super-admin/users` - implemented
- `POST /api/v1/super-admin/users` - implemented
- `GET /api/v1/super-admin/users/:userId` - implemented
- `PATCH /api/v1/super-admin/users/:userId` - implemented
- `PATCH /api/v1/super-admin/users/:userId/status` - implemented
- `POST /api/v1/super-admin/users/:userId/reset-password` - implemented
- `POST /api/v1/super-admin/users/:userId/center-roles` - implemented
- `GET /api/v1/permissions/me` - implemented
- `GET /api/v1/permissions/platform-roles` - implemented
- `POST /api/v1/permissions/platform-users/:userId/roles` - implemented

Implemented foundation behavior:
- List users with pagination, search, status, and role filters plus real status counters.
- View one user with owned centers and role assignments.
- Create a user with full name, email, temporary password, status, optional platform role, and optional center role.
- Update user full name, email, phone, and status.
- Activate/deactivate/suspend users through the status endpoint; no hard delete is used in the Super Admin UI.
- Reset user passwords by hashing the new temporary password and returning the temporary value only for the reset workflow.
- Link a user to a center role through `UserRole.centerId`, accepting a center role key and creating the center system role if missing.
- Seed platform permissions and default roles on API startup.
- Resolve current platform permissions for the development Super Admin user.
- Assign implemented platform roles to users through `UserRole.centerId = null`.
- Protected endpoints return `403 Forbidden` when the current platform user lacks the required permission.
- User responses select safe fields and never include `passwordHash`.

Permissions:
- `view:users`
- `manage:users`

## 7. Super Admin - Domains

Endpoints:
- `GET /api/v1/super-admin/domains`
- `POST /api/v1/super-admin/centers/:centerId/domains`
- `PATCH /api/v1/super-admin/domains/:domainId`
- `POST /api/v1/super-admin/domains/:domainId/verify`
- `POST /api/v1/super-admin/domains/:domainId/set-primary`
- `DELETE /api/v1/super-admin/domains/:domainId`

Permissions:
- `domains.read`
- `domains.manage`

## 8. Super Admin - Modules and Templates

Endpoints:
- `GET /api/v1/super-admin/modules`
- `PATCH /api/v1/super-admin/centers/:centerId/modules`
- `GET /api/v1/super-admin/templates`
- `POST /api/v1/super-admin/templates`
- `PATCH /api/v1/super-admin/templates/:templateId`

Permissions:
- `modules.read`
- `modules.manage`
- `templates.read`
- `templates.manage`

## 9. Center Admin - Dashboard

Endpoints:
- `GET /api/v1/admin/dashboard/summary`
- `GET /api/v1/admin/dashboard/upcoming-appointments`
- `GET /api/v1/admin/dashboard/recent-customers`

Permissions:
- `dashboard.read`

## 10. Center Admin - Settings and Branding

Endpoints:
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings`
- `GET /api/v1/public/settings`
- `GET /api/v1/admin/branding`
- `PATCH /api/v1/admin/branding`
- `POST /api/v1/admin/branding/logo`

Permissions:
- `manage:settings` for protected platform settings reads/writes and public branding uploads.
- `branding.read`
- `branding.update`

Public website appearance update:
- `GET/PATCH /api/v1/admin/settings` now includes non-secret public website appearance keys for site name, public logo/favicon/hero/footer images, support phone/WhatsApp/email, social links, and AR/EN/HE landing CTA text.
- `GET /api/v1/public/settings` exposes only `public_*` settings for the public web frontend and does not require authentication.
- Public social links are optional; empty values should be hidden by the frontend.

## 11. Center Admin - Users and Roles

Endpoints:
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users/:userId`
- `PATCH /api/v1/admin/users/:userId`
- `POST /api/v1/admin/users/:userId/disable`
- `GET /api/v1/admin/roles`
- `POST /api/v1/admin/roles`
- `PATCH /api/v1/admin/roles/:roleId`

Permissions:
- `users.read`
- `users.create`
- `users.update`
- `users.disable`
- `roles.read`
- `roles.manage`

## 12. Center Admin - Customers

Endpoints:
- `GET /api/v1/admin/customers`
- `POST /api/v1/admin/customers`
- `GET /api/v1/admin/customers/:customerId`
- `PATCH /api/v1/admin/customers/:customerId`
- `DELETE /api/v1/admin/customers/:customerId`

Permissions:
- `customers.read`
- `customers.create`
- `customers.update`
- `customers.delete`

## 13. Tenant Center Admin - Services

Endpoints:
- `GET /api/v1/tenant/services`
- `POST /api/v1/tenant/services`
- `GET /api/v1/tenant/services/:serviceId`
- `PATCH /api/v1/tenant/services/:serviceId`
- `PATCH /api/v1/tenant/services/:serviceId/status`

Permissions:
- `services.view`
- `services.create`
- `services.update`
- `services.archive`
- `services.activate`

Rules:
- Uses the authenticated center staff session cookie.
- `centerId` is derived from the server-side session, never from request payload.
- Tenant services are private Center Admin ERP records by default and are not public website/service catalog data unless a future explicit public-services API is added.
- Only the center default-language name and description are required on create/full edit; non-default English/Arabic/Hebrew fields remain stored but are optional.
- `GET` list/details require `services.view`.
- `POST` requires `services.create`.
- `PATCH` update requires `services.update`.
- Status archive requires `services.archive`.
- Status activate requires `services.activate`.
- Cross-center service IDs return `404`.
- Responses include service fields only and must not expose password, passwordHash, tokens, secrets, or auth metadata.
- No online payment endpoints or fields are included.

## 13.1 Tenant Center Admin - Appointments

Implemented endpoints:
- `GET /api/v1/tenant/appointments` - lists appointments for the authenticated center only; supports search, status, date, and provider filters.
- `GET /api/v1/tenant/appointments/options` - returns same-center active patients, active services, and active providers for appointment forms.
- `POST /api/v1/tenant/appointments` - creates an appointment in the authenticated center only.
- `GET /api/v1/tenant/appointments/:appointmentId` - returns one appointment only when it belongs to the authenticated center.
- `PATCH /api/v1/tenant/appointments/:appointmentId` - updates appointment patient/service/provider/date/time/notes only within the authenticated center.
- `PATCH /api/v1/tenant/appointments/:appointmentId/status` - updates appointment status.
- `PATCH /api/v1/tenant/appointments/:appointmentId/cancel` - cancels an appointment with required cancellation reason.

Permissions:
- `appointments.view`
- `appointments.create`
- `appointments.update`
- `appointments.cancel`
- `appointments.status.update`

Validation:
- Patient is required and must belong to the same center.
- Service is required and must belong to the same center and be active.
- Provider is required and must be an active same-center staff user.
- Appointment date, start time, and duration are required and must be valid.
- Appointment must end on the same day.
- Invalid status returns `400 errors.status`.
- Provider overlap returns `400 errors.staffUserId`.
- Patient overlap returns `400 errors.patientId`.
- Missing or cross-center appointments return `404 Appointment not found`.
- Missing cancellation reason returns `400 errors.cancellationReason`.

Security:
- Tenant `centerId` is never accepted from the client body or query.
- Cross-center patient, service, provider, and appointment access is rejected.
- Responses include appointment, patient, service, and safe user fields only.
- Responses must never include password, passwordHash, tokens, secrets, or auth metadata.
- No online payment endpoints or fields are included.

## 14. Center Admin - Staff

Implemented tenant endpoints:
- `GET /api/v1/tenant/staff` - lists same-center staff; supports `search`, `role`, and `status`.
- `POST /api/v1/tenant/staff` - creates a same-center staff user with hashed password and center role assignment.
- `GET /api/v1/tenant/staff/:staffId` - returns one staff user only when assigned to the authenticated center.
- `PATCH /api/v1/tenant/staff/:staffId` - updates full name, email, role, status, and optional password.
- `PATCH /api/v1/tenant/staff/:staffId/status` - activates or deactivates staff without hard deletion.

Permissions:
- `staff.view`
- `staff.create`
- `staff.update`
- `staff.activate`

Validation:
- Full name is required on create.
- Email is required and must be valid on create.
- Duplicate email returns `409 errors.email`.
- Role must be one of the existing center roles: `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, or `STAFF`.
- Password is required on create, optional on edit, and must be at least 8 characters when supplied.
- Status must be `ACTIVE` or `INACTIVE`.

Security:
- Tenant `centerId` is never accepted from the client body or query.
- Cross-center staff IDs return `404`.
- Responses never include `password`, `passwordHash`, tokens, secrets, auth verification timestamps, `lastLoginAt`, or deleted metadata.
- No hard delete endpoint is implemented.

## 15. Center Admin - Appointments

Endpoints:
- Implemented tenant appointment endpoints are documented in section 13.1 under `/api/v1/tenant/appointments`.
- Older `/api/v1/admin/appointments` route names are not implemented and should not be used for the tenant dashboard.

Permissions:
- `appointments.view`
- `appointments.create`
- `appointments.update`
- `appointments.cancel`
- `appointments.status.update`

## 16. Center Admin - Sessions

Endpoints:
- `GET /api/v1/admin/sessions`
- `POST /api/v1/admin/sessions`
- `GET /api/v1/admin/sessions/:sessionId`
- `PATCH /api/v1/admin/sessions/:sessionId`
- `DELETE /api/v1/admin/sessions/:sessionId`

Permissions:
- `sessions.read`
- `sessions.create`
- `sessions.update`
- `sessions.delete`

## 17. Center Admin - Pages Builder

Endpoints:
- `GET /api/v1/admin/pages`
- `POST /api/v1/admin/pages`
- `GET /api/v1/admin/pages/:pageId`
- `PATCH /api/v1/admin/pages/:pageId`
- `DELETE /api/v1/admin/pages/:pageId`
- `POST /api/v1/admin/pages/:pageId/publish`
- `POST /api/v1/admin/pages/:pageId/unpublish`
- `PATCH /api/v1/admin/pages/:pageId/blocks`

Permissions:
- `pages.read`
- `pages.create`
- `pages.update`
- `pages.delete`
- `pages.publish`

## 18. Center Admin - Notifications

Endpoints:
- `GET /api/v1/admin/notification-templates`
- `PATCH /api/v1/admin/notification-templates/:templateId`
- `GET /api/v1/admin/notification-log`

Permissions:
- `notifications.read`
- `notifications.manage`

## 19. Customer Portal API

Endpoints:
- `GET /api/v1/portal/me`
- `PATCH /api/v1/portal/me`
- `GET /api/v1/portal/appointments`
- `POST /api/v1/portal/appointments`
- `POST /api/v1/portal/appointments/:appointmentId/cancel`
- `GET /api/v1/portal/sessions`
- `GET /api/v1/portal/notifications`

Rules:
- Must be scoped to current customer and center.
- Must not expose other customers.

Needs Confirmation:
- Whether customers can cancel appointments.
- Whether sessions are visible in portal.

## 20. Public Website API

Endpoints:
- `GET /api/v1/public/site`
- `GET /api/v1/public/pages/:slug`
- `GET /api/v1/public/services`
- `GET /api/v1/public/staff`
- `POST /api/v1/public/appointment-requests`
- `POST /api/v1/public/contact-requests`

Rules:
- Public endpoints must resolve tenant by domain.
- Public endpoints must only expose published/active data.
- Rate limiting should be applied to public form submissions.

## 21. Files API

Endpoints:
- `POST /api/v1/files`
- `GET /api/v1/files/:fileId`
- `DELETE /api/v1/files/:fileId`

Rules:
- File permissions depend on purpose and owner.
- Sensitive files must not use public URLs.

## 22. Audit and Backup API

Endpoints:
- `GET /api/v1/super-admin/audit-logs`
- `GET /api/v1/admin/audit-log`
- `GET /api/v1/super-admin/backups`
- `POST /api/v1/super-admin/backups`
- `GET /api/v1/super-admin/backups/:backupId`

Implemented Super Admin audit logs:
- `GET /api/v1/super-admin/audit-logs`
- Supports filters: `actorUserId`, `actorSearch`, `targetUserId`, `targetSearch`, `centerId`, `action`, `dateFrom`, `dateTo`, `page`, `pageSize`.
- With no filters, returns the latest 50 logs ordered by `createdAt desc`.
- Center status updates write `CENTER_STATUS_CHANGED` audit rows after successful `PATCH /api/v1/admin/centers/:centerId/status`.
- Super Admin user status updates write `USER_STATUS_CHANGED` audit rows after successful `PATCH /api/v1/super-admin/users/:userId/status`.
- Super Admin user edits write `USER_UPDATED` audit rows after successful `PATCH /api/v1/super-admin/users/:userId`.
- Super Admin password resets write `PASSWORD_RESET` audit rows after successful `POST /api/v1/super-admin/users/:userId/reset-password`.
- Tenant staff status updates write `TENANT_STAFF_STATUS_CHANGED` audit rows after successful `PATCH /api/v1/tenant/staff/:staffId/status`.
- `POST /api/v1/admin/centers/:centerId/login-as` tenant sessions include optional `impersonatorUserId`; tenant audit logs use it to show the original Super Admin actor while preserving the tenant session user in metadata.

Needs Confirmation:
- Whether center admins can view audit logs.
- Whether restore actions are API-triggered or operational only.

## 23. Tenant RBAC APIs

Endpoints:
- `GET /api/v1/tenant/roles`
- `GET /api/v1/tenant/roles/:roleId/permissions`
- `PATCH /api/v1/tenant/roles/:roleId/permissions`
- `GET /api/v1/auth/center/me`
- `GET /api/v1/permissions/me`

Rules:
- Tenant role-permission endpoints are scoped to the authenticated center session.
- `PATCH /api/v1/tenant/roles/:roleId/permissions` stores canonical colon permission keys.
- `GET /api/v1/auth/center/me` returns the logged-in center user's effective `permissions` array.
- `GET /api/v1/permissions/me` remains the platform permissions endpoint for Super Admin headers, but when a tenant center session cookie is present it returns the tenant center session with normalized effective permissions.
- Tenant operational APIs must enforce the same effective permission keys returned in the tenant session.

## 24. Tenant Dashboard API

Endpoints:
- `GET /api/v1/tenant/dashboard/stats`

Response:
- `patients`
- `appointments`
- `services`
- `staff`
- `todayActivity.appointmentsToday`
- `todayActivity.upcomingNextTwoHours`
- `todayActivity.noShow`
- `alerts.upcomingSoon`
- `alerts.patientsWithCredit`
- `alerts.pendingInvoices`
- `recentAppointments`
- `recentInvoices`

Rules:
- Uses the authenticated tenant center session cookie.
- Counts `Patient`, `Appointment`, and `Service` by the session `centerId`.
- Counts center staff through same-center `UserRole` rows for tenant staff roles, excluding only revoked assignments and deleted users.
- Does not accept `centerId` from the frontend.

## 24.1 Tenant Subscription Access Control

Backend enforcement:
- Tenant write requests are checked by `TenantSubscriptionAccessMiddleware`.
- Protected tenant write surfaces include patients, tenant appointments, tenant billing/payments/credit, tenant services, tenant staff, and tenant role permissions.
- `GET`, `HEAD`, and `OPTIONS` requests remain readable for expired centers.
- `POST /api/v1/tenant/subscription/renewal-request` and `POST /api/v1/auth/center/logout` remain allowed.
- `ACTIVE` and `TRIALING` subscriptions allow writes.
- `EXPIRING_SOON` is computed from the latest subscription period end and allows writes with frontend warning only.
- `EXPIRED` blocks write methods with `403 SUBSCRIPTION_EXPIRED`.
- `SUSPENDED` and `CANCELLED` block write methods with `403 SUBSCRIPTION_SUSPENDED`.

Session response:
- `GET /api/v1/auth/center/me` and tenant-mode `GET /api/v1/permissions/me` include `subscriptionAccess` with `status`, `planName`, `daysRemaining`, `isExpiringSoon`, `isExpired`, and `isSuspended`.

## 25. Super Admin Centers API

Endpoints:
- `GET /api/v1/admin/centers`
- `GET /api/v1/admin/centers/:centerId`
- `GET /api/v1/admin/centers/:centerId/public-profile`
- `PATCH /api/v1/admin/centers/:centerId/public-profile`
- `POST /api/v1/admin/centers/:centerId/public-profile/upload-image`
- `PATCH /api/v1/admin/centers/:centerId/status`
- `POST /api/v1/admin/centers/:centerId/login-as`
- `POST /api/v1/admin/centers/:centerId/manager`

Response:
- List rows return `id`, `name`, `slug`, `status`, `createdAt`, and `usersCount`.
- Details returns the same center fields plus safe center users (`id`, `fullName`, `email`, `phone`, `role`, `roleName`, `status`, `assignmentStatus`, `createdAt`).

Rules:
- Center list/details/status/login-as/manager routes still use the explicit Super Admin platform user header until migrated.
- The center public-profile admin routes use the current platform session cookie through `PermissionGuard`; `GET` requires `view:centers`, while `PATCH` and upload require `edit:centers`.
- Legacy header-based admin center routes remain limited to platform `super_admin`; public-profile admin routes follow the listed platform permission keys.
- Tenant sessions do not grant access.
- User responses must never include `passwordHash`.
- `POST /api/v1/admin/centers/:centerId/login-as` selects the center owner or first active center manager, refuses platform Super Admin targets, creates a tenant center session cookie, returns `token` and `redirectUrl`, and writes an internal audit note.
- `POST /api/v1/admin/centers/:centerId/manager` creates or assigns an active `CENTER_MANAGER` for the center using a required temporary password and returns a safe user summary.

## 26. Super Admin Analytics Dashboard API

Endpoints:
- `GET /api/v1/super-admin/analytics/dashboard`

Response:
- `centers`: `totalCenters`, `activeCenters`, `inactiveCenters`, `recentlyCreatedCenters`, `latestCenters`
- `users`: `totalUsers`, `activeUsers`, `inactiveUsers`, `superAdminsCount`, `centerAdminsCount`
- `appointments`: `totalAppointments`, `todayAppointments`, `completedAppointments`, `cancelledAppointments`, `pendingAppointments`, `appointmentsThisMonth`, `appointmentsPreviousMonth`, `appointmentsByCenter`
- `billing`: `totalInvoices`, `paidInvoices`, `pendingInvoices`, `partialInvoices`, `cancelledInvoices`, `totalPaidAmount`, `totalOutstandingAmount`, `totalPatientCredit`, `revenueThisMonth`, `revenuePreviousMonth`, `revenueByCenter`
- `audit`: `latestAuditLogs`, `sensitiveActionsCount`, `mostActiveAdmins`, `recentLoginAsCenterActions`
- `insights`: `alerts`, `highlights`, `recommendations`

Rules:
- Requires `PermissionGuard` and platform permission `view:reports`.
- Requires an explicit `x-royalcare-super-admin-user-id` header for protected Super Admin access.
- Uses existing Prisma models only: `Center`, `User`, `UserRole`, `Role`, `Appointment`, `Invoice`, `Payment`, `Patient`, and `AuditLog`.
- Revenue totals are based on payments linked to non-cancelled invoices; `CANCELLED` invoices are excluded from all revenue totals.
- Audit slices reuse the enriched audit response fields used by `GET /api/v1/super-admin/audit-logs`.
- `latestCenters` is included for the Super Admin dashboard recent-centers panel and returns safe center summaries only: `id`, `name`, `slug`, `status`, `createdAt`, `ownerName`, `ownerEmail`, and `plan`.
- Smart insights are rule-based only and return translated EN/AR/HE messages. Alerts cover no active centers, centers with no appointments in the last 7 days, revenue drops, cancelled invoices exceeding paid invoices, and high same-day sensitive action counts. Highlights cover top center by revenue, top center by appointments, most active admin, and revenue growth. Recommendations cover inactive centers, high cancellation review, inactive users, and centers with no recent appointment activity.
- Responses return safe zero/default values when tables are empty and never expose password hashes or tokens.

## 27. Super Admin Subscription Timeline API

Endpoint:
- `GET /api/v1/super-admin/subscriptions/:id/timeline`
- `POST /api/v1/super-admin/subscriptions/:id/manual-whatsapp-log`

ID handling:
- `:id` may be a direct subscription id.
- If no subscription exists with that id, the service treats `:id` as a center id and loads the latest subscription for that center.

Response:
- `subscriptionId`
- `centerId`
- `data[]` sorted by `createdAt` descending

Timeline item shape:
- `id`
- `type`
- `title`
- `description`
- `actorName`
- `actorType`
- `createdAt`
- `metadata`

Sources:
- Subscription row creation.
- Subscription audit logs: `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_STATUS_CHANGED`, `SUBSCRIPTION_RENEWAL_REQUESTED`.
- Subscription notifications: `SUBSCRIPTION_EXPIRING`, `SUBSCRIPTION_EXPIRED`, `SUBSCRIPTION_RENEWAL_REQUEST`.
- WhatsApp manual notification logs with metadata actions `OPENED_WHATSAPP` and `COPIED_MESSAGE`.

Rules:
- Timeline entries are normalized to user-facing lifecycle event types such as created, renewed, suspended, cancelled, expired, renewal request, WhatsApp opened/copied, phone updated, plan changed, trial started, and trial ended.
- Duplicate entries with the same type, timestamp, and description are filtered.
- No password hashes, tokens, or sensitive fields are returned.

## 28. Super Admin Notification Center API

Endpoints:
- `GET /api/v1/super-admin/notifications`
- `PATCH /api/v1/super-admin/notifications/:id/read`
- `PATCH /api/v1/super-admin/notifications/read-all`

List query:
- `page`, `pageSize`
- `unreadOnly=true`
- `category=all|subscriptions|renewal_requests|system_alerts`
- `type`, `status`, `centerId`

Response:
- `data[]`: `id`, `type`, `title`, `body`, `status`, `centerId`, `centerName`, `createdAt`, `readAt`, `actionUrl`, `metadata`, safe `center`, and WhatsApp manual attempt summary.
- `stats`: total, pending, sent, failed, sentToday, unread.

Rules:
- Requires Super Admin/report permission through existing `PermissionGuard`.
- Only `targetAudience=SUPER_ADMIN` notifications are returned.
- Read operations update `readAt`/`readByUserId`; they do not delete notifications.
- Super Admin subscription endpoints are protected by the platform permission guard:
  - Read/list/timeline: `view:reports`
  - Create/manual WhatsApp logging: `manage:subscriptions`
- Manual WhatsApp logging stores a `WHATSAPP` notification log and appears in the subscription timeline.

## 29. Tenant Schedule Management API

Endpoints:
- `GET /api/v1/tenant/schedule`
- `PATCH /api/v1/tenant/schedule/center-hours`
- `POST /api/v1/tenant/schedule/closed-days`
- `DELETE /api/v1/tenant/schedule/closed-days/:id`
- `GET /api/v1/tenant/schedule/providers/:providerId`
- `PATCH /api/v1/tenant/schedule/providers/:providerId/hours`
- `POST /api/v1/tenant/schedule/providers/:providerId/leave`
- `DELETE /api/v1/tenant/schedule/providers/leave/:id`

Rules:
- Requires an active tenant session and tenant permission `settings:view`.
- All reads and writes are scoped by the session `centerId`.
- Public booking availability and booking submission can pass `providerId`; the backend validates the provider belongs to the public center and is active.
- Schedule availability uses center hours/closed days, provider working hours, provider leave, existing appointments, pending/accepted booking requests, service duration, and service `bufferMinutes`.
- `GET` seeds default center weekly hours `09:00` to `17:30` for all seven days if no center hours exist yet.
- Center hours, closed days, provider hours, and provider leave use the existing schedule models consumed by `ScheduleService`.
- Invalid time ranges where end time is not after start time return structured validation errors.

## 30. Public Branding Upload API

Endpoint:
- `POST /api/v1/admin/uploads/public-image`

Request:
- Super Admin only through the existing `x-royalcare-super-admin-user-id` platform header check.
- `multipart/form-data`
- File field: `file`

Validation:
- Accepted MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`.
- Maximum size: 2MB.

Response:
- `{ "url": "/uploads/branding/<filename>" }`

Storage:
- Files are written to `apps/web/public/uploads/branding/` so the existing web app can serve them as public assets under `/uploads/branding/...`.

Usage:
- Super Admin Public Website Appearance settings use this endpoint for `logoUrl`, `faviconUrl`, `heroImageUrl`, and `footerLogoUrl`.

## 31. Tenant Marketing Settings API

Endpoints:
- `GET /api/v1/tenant/settings/marketing`
- `PATCH /api/v1/tenant/settings/marketing`
- `POST /api/v1/tenant/settings/marketing/test-meta-capi`
- `GET /api/v1/tenant/settings/marketing/logs?limit=20`

Request/response fields:
- `metaPixelId`
- `metaConversionApiToken` in PATCH requests only; GET/PATCH responses return `metaConversionApiToken: null` plus `hasMetaConversionApiToken`
- `tiktokPixelId`
- `snapPixelId`
- `ga4Id`
- `gtmId`
- `customHeadScript`
- `customBodyScript`
- `updatedAt` in responses

Rules:
- Requires a valid center session.
- Requires tenant permission `settings:view`.
- All reads/writes use `session.center.id`; no client-provided `centerId` is accepted.
- PATCH upserts the one settings row for the center and normalizes blank strings to `null`.
- Omitting `metaConversionApiToken` during PATCH preserves the existing saved token; sending `null` or an empty string clears it; sending a non-empty string replaces it.
- `metaConversionApiToken` is stored for backend-only Meta Conversion API calls and is never returned by public endpoints.
- Authenticated tenant settings responses mask the raw token by returning `hasMetaConversionApiToken` instead of echoing the secret value.
- `POST /test-meta-capi` sends a backend-only Meta `TestMarketingEvent` using the saved center-scoped pixel id and token; it returns only success/error status and never returns the token or provider response details.
- `GET /logs` returns the latest center-scoped marketing tracking debug rows for the tenant settings UI. `limit` defaults to 20 and is clamped server-side.
- Log responses include only safe fields: `id`, `provider`, `eventName`, `status`, `message`, `eventId`, `bookingRequestId`, and `createdAt`.
- Log responses never include tokens, raw phone numbers, raw emails, raw names, hashed user data payloads, or full provider request payloads.
- If the log table is missing because the migration has not been applied, the logs endpoint returns an empty safe fallback with `unavailable: true`; booking and settings reads/writes must not fail because marketing debug logs are unavailable.

## 32. Public Center Marketing Settings API

Endpoint:
- `GET /api/v1/public/centers/:slug/marketing-settings`

Response:
- `metaPixelId`
- `tiktokPixelId`
- `snapPixelId`
- `ga4Id`
- `gtmId`
- `customHeadScript`
- `customBodyScript`

Rules:
- Only returns settings for active, public-visible centers with an allowed subscription state.
- Does not require authentication because it is consumed by public center pages.
- Never returns `metaConversionApiToken`.
- Custom script fields are exposed only through this public-safe center endpoint for tenant-owned marketing injection on the public journey.
- Used only by public center journey pages such as `/c/[slug]`, `/c/[slug]/book`, and the patient portal route.

Server-side conversion tracking:
- Successful `POST /api/v1/public/centers/:slug/booking-requests` calls trigger a best-effort backend Meta Conversion API `CompleteBooking` event.
- The backend reads `metaPixelId` and `metaConversionApiToken` from the center-scoped tenant marketing settings row by trusted `centerId`.
- The public booking response includes `bookingRequestId` and `trackingEventId` for browser/server Meta deduplication; `trackingEventId` uses `booking_<bookingRequestId>`.
- The public booking response does not include the token or any CAPI response data.
- Missing pixel/token or provider failures silently skip/warn and never block booking creation.
- User data values sent to Meta are hashed server-side where available; logs must not contain tokens or raw personal data.

## 33. Center Website Analytics API

### Public track endpoint

`POST /api/v1/public/centers/:slug/track`

- No authentication required.
- Returns HTTP 200 always (fire-and-forget); errors are swallowed so analytics never block UX.
- Controller: `PublicCenterTrackController` in `center-analytics.module`.

Request body:
```json
{
  "eventType": "VIEW_BOOKING_PAGE",
  "source": "GOOGLE",
  "sessionId": "abc123...",
  "page": "/c/qa-recovery/book",
  "extraData": { "serviceId": "...", "serviceName": "..." }
}
```

Validation:
- `eventType` must be one of 14 `CenterWebsiteEventType` enum values; invalid values return 400.
- `source` must be one of 6 `CenterTrafficSource` enum values or absent (defaults to `UNKNOWN`).
- Center is resolved by `slug` with `publicVisible: true`; events for inactive/unknown centers are silently ignored.
- `sessionId`, `page`, and `extraData` are optional.

Storage: writes one `CenterWebsiteEvent` row with `centerId`, `eventType`, `source`, `sessionId`, `page`, `extraData`, and `occurredAt`.

### Tenant analytics dashboard

`GET /api/v1/tenant/marketing/analytics`

- Requires active tenant session cookie (`royalcare_center_session`).
- Requires tenant permission `reports:view`.
- Controller: `TenantCenterAnalyticsController` in `center-analytics.module`.
- `centerId` is derived from the session; no client-supplied center id is accepted.

Query: none (always returns last 30 days).

Response:
```json
{
  "period": "last30days",
  "cards": {
    "visitors": 0,
    "bookingPageViews": 0,
    "bookNowClicks": 0,
    "whatsappClicks": 0,
    "phoneClicks": 0,
    "contactPageViews": 0,
    "galleryViews": 0,
    "reviewsViews": 0,
    "beforeAfterViews": 0,
    "completedBookings": 0,
    "conversionRate": "0%"
  },
  "trafficSources": [
    { "source": "GOOGLE", "count": 0, "percent": 0 }
  ],
  "charts": {
    "dailyVisitors": [{ "date": "2026-04-27", "count": 0 }],
    "bookingAttempts": [{ "date": "2026-04-27", "count": 0 }],
    "topPages": [{ "page": "/c/slug/book", "count": 0 }],
    "topServices": [{ "name": "Laser Hair Removal", "count": 0 }]
  }
}
```

Rules:
- `visitors` = distinct non-null `sessionId` values for `VIEW_CENTER_WEBSITE` events via `groupBy()`.
- Daily chart deduplication uses in-memory `Map<date, Set<sessionId>>` to count unique visitors per day without raw SQL.
- Top services are derived from `SELECT_SERVICE` events using `ev.extraData.serviceName`.
- `conversionRate` = `completedBookings / visitors` as percentage; zero visitors returns `"0%"`.
- All queries are scoped by the session `centerId`.
- Requires `reports:view` permission check passed as the effective permissions array.

## 34. Tenant Smart Follow-ups API

Base path: `/api/v1/tenant/follow-ups`

Endpoints:
- `GET /api/v1/tenant/follow-ups?filter=TODAY|THIS_WEEK|OVERDUE|UPCOMING|CONTACTED|BOOKED|COMPLETED&patientId=<uuid>&includeAll=true&includeAllForPatient=true`
- `GET /api/v1/tenant/follow-ups/analytics`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/status`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/notes`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/due-date`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/close-early`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/reminder`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/skip-cycle`
- `PATCH /api/v1/tenant/follow-ups/:followUpId/pause`

Rules:
- Requires active center session cookie.
- Reads require `appointments:view`.
- Status, note, and due-date updates require `appointments:update`.
- Every query and mutation scopes by `session.center.id`; no client-provided `centerId` is accepted.
- Filter semantics:
  - `TODAY`: `dueDate` is today only, excluding `COMPLETED` and `CANCELLED`.
  - `THIS_WEEK`: product label "Next 7 Days"; `dueDate >= today` and `dueDate <= today + 7 days`, excluding `COMPLETED`, `BOOKED`, and `CANCELLED`. It is not calendar-week based, and Today can overlap with this bucket.
  - `OVERDUE`: `dueDate` before today, excluding `COMPLETED` and `CANCELLED`.
  - `UPCOMING`: `dueDate` after today, excluding `COMPLETED` and `CANCELLED`.
  - `CONTACTED`, `BOOKED`, and `COMPLETED` match exact status.
- `includeAllForPatient=true` is honored only with a `patientId`; it returns all follow-ups for that same-center patient regardless of the active filter. This is used by `/tenant/follow-ups` expanded Upcoming patient cards so the summary filter controls which patients appear while the expanded plan shows the patient's complete treatment plan.
- `includeAll=true` returns the same-center follow-up queue without applying a status/date filter, capped by the existing list limit. It is used by `/tenant/follow-ups` search and CRM chips so client-side search can override the active filter while preserving tenant isolation and permissions.
- `PATCH /close-early` requires `appointments:update`, accepts an optional `reason`, marks the finite plan `CLOSED_EARLY`, records closure metadata, and changes only future unbooked actionable sessions to `CLOSED_EARLY`.
- Due-date update accepts `{ dueDate: "YYYY-MM-DD" }`. For existing `DUE`/`UPCOMING` rows, the backend recalculates the status from the new date; other workflow statuses are preserved.
- Recurring follow-up rows include `isRecurring`, `recurringIntervalValue`, `recurringIntervalUnit`, `nextRecurringAt`, and `originFollowUpId`.
- Recurring rows are lifecycle reminders, not treatment sessions; `sessionNumber` remains `null`.
- Analytics additionally returns `recurringDueToday`, `recurringThisWeek`, and `recurringPatientsRetention`.
- List queries accept `kind=RECURRING|FINITE` so the UI can keep recurring reminders separate from fixed session plans.
- Analytics also returns `recurringOverdue`.
- Recurring list rows expose reminder/contact/skip/pause metadata plus `sourceAppointment` branch/date context.

List response:
```json
{
  "items": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "serviceId": "uuid",
      "appointmentId": "uuid",
      "sourceType": "APPOINTMENT_COMPLETED",
      "title": "Laser",
      "notes": null,
      "sessionNumber": 2,
      "dueDate": "2026-06-27",
      "status": "UPCOMING",
      "lastContactedAt": null,
      "nextAppointmentId": null,
      "createdAt": "2026-05-28T21:58:49.898Z",
      "updatedAt": "2026-06-02T09:34:57.242Z",
      "overdueDays": 0,
      "patient": { "id": "uuid", "fullName": "Patient", "phone": "059..." },
      "service": { "id": "uuid", "nameAr": "ليزر", "nameEn": "Laser", "nameHe": "" },
      "nextAppointment": null
    }
  ],
  "total": 1
}
```

Analytics response:
```json
{
  "dueToday": 0,
  "overdue": 0,
  "contacted": 0,
  "bookedFromFollowUps": 0,
  "conversionRate": 0
}
```

Related service API update:
- `POST/PATCH /api/v1/tenant/services` accepts follow-up settings: `followUpEnabled`, `followUpType`, `defaultIntervalDays`, `totalRecommendedSessions`, `autoCreateNextReminder`, localized reminder messages, and `followUpRules`.
- `GET /api/v1/tenant/services` and `GET /api/v1/tenant/services/:id` return those follow-up fields.

Automatic creation:
- `PATCH /api/v1/tenant/appointments/:appointmentId/status` creates a follow-up when status changes to `COMPLETED` and the service has follow-ups enabled.
- For `followUpMode=RECURRING_CONTINUOUS`, both appointment update paths create an idempotent ACTIVE recurring row after completion, using `completedAt + recurringIntervalValue/unit` for its due date.
- `GET /api/v1/tenant/follow-ups?kind=RECURRING` performs a center-scoped safe backfill for completed recurring appointments missing their lifecycle row, then returns ACTIVE recurring rows according to the requested date/status filter.
- Recurring list items expose `nextDueDate`; recurring TODAY/THIS_WEEK/OVERDUE filters query the persisted `nextRecurringAt` value.
- `GET /api/v1/tenant/follow-ups/analytics?branchId=:branchId` returns counters scoped to the selected branch, including `recurringDueToday`, `recurringThisWeek`, and `recurringOverdue`.
- Recurring `filter=THIS_WEEK` uses `nextDueDate > today AND nextDueDate <= today + 7 days`; TODAY and OVERDUE do not overlap this window. The recurring counters use the same shared backend window.
## Appointment Custom One-Time Services - 2026-05-28

Existing tenant appointment endpoints accept custom service fields without adding new routes:
- `POST /api/v1/tenant/appointments`
- `PATCH /api/v1/tenant/appointments/:id`

Additional request fields:
- `customServiceName?: string | null`
- `customServicePrice?: number | string | null`
- `saveCustomService?: boolean`

Rules:
- Normal appointments require either `serviceId` or `customServiceName`.
- `saveCustomService=true` creates a real center-scoped `Service` record and links it to the appointment.
- Appointment responses include `customServiceName`, `customServicePrice`, and `customServiceSaved`.
- Tenant billing endpoints can create invoices from custom appointments using `customServiceName` and the custom/manual amount.
# 2026-06-08 Appointment Follow-up Recalculation

- `PATCH /api/v1/tenant/appointments/:appointmentId` accepts optional `recalculateFollowUpSchedule: boolean`.
- When true and `appointmentDate` changed, the API recalculates linked finite follow-up session due dates from the plan snapshot while preserving completed/cancelled/closed and unrelated booked sessions.
- Tenant appointment detail responses expose a linked `followUp` from either `followUpsNext` or `followUpsCreated`, allowing the edit UI to warn about plan impact.
- `GET /api/v1/tenant/appointments/:appointmentId` now also returns `followUpPlanId` and the exact linked `followUpPlan[]`. Both are resolved from the persisted `followUpsCreated` / `followUpsNext` relations; appointment details no longer infer or reload a plan by patient/service configuration.
- Appointment list and detail responses share `hasFollowUpPlan` and `followUpPlanSummary`. Recurring plans are detected from persisted `PatientFollowUp` rows using direct appointment links plus the recurring plan identity `(centerId, patientId, serviceId, isRecurring)` because later recurring rows may have no `appointmentId`.
- A valid appointment service configuration with `followUpMode=RECURRING_CONTINUOUS`, interval value, and interval unit also yields `hasFollowUpPlan=true` before the first reminder row exists; recurring reminder rows are created only after appointment completion.

## 2026-06-14 Tenant Expenses API

Base path: `/api/v1/tenant/expenses`

Endpoints:
- `GET /overview?from=YYYY-MM-DD&to=YYYY-MM-DD` returns expense KPIs, revenue-vs-expense charts, category/branch breakdowns, and insights. Requires `expenses:reports`.
- `GET /options` returns expense categories, branches, payment methods, and statuses. Requires `expenses:view`.
- `GET /?search=&status=&categoryId=&branchId=&from=&to=` lists center-scoped expenses. Requires `expenses:view`.
- `POST /` creates an expense, optionally with `recurring=true` for a monthly recurrence. Requires `expenses:create`.
- `PATCH /:expenseId` updates a same-center expense. Requires `expenses:edit`.
- `DELETE /:expenseId` deletes a same-center expense. Requires `expenses:delete`.
- `POST /receipt` uploads a PDF/image receipt and returns `{ url }`. Requires `expenses:create`.
- `GET /categories/list` lists categories. Requires `expenses:view`.
- `POST /categories` creates a category. Requires `expenses:edit`.
- `PATCH /categories/:categoryId` updates a same-center category. Requires `expenses:edit`.

Rules:
- The controller derives tenant context from the center session cookie; clients do not provide `centerId`.
- All query/mutation service methods scope by `session.center.id`.
- Validation errors use `{ message: "Validation failed", errors: { fieldName: "Readable message" } }`.
- Receipt uploads allow PDF, PNG, JPG, and WebP up to 10 MB and save under `/uploads/expenses`.
