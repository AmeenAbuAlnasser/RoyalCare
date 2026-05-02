# RoyalCare - API Map

Last updated: 2026-04-29
Status: Dedicated tenant login, tenant patients, services, appointments, and tenant staff API foundations documented

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
- `GET /api/v1/super-admin/centers/:centerId/subscription`

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
- `GET /api/v1/patients` - lists patients for the authenticated center only; supports `search` by name or phone.
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
- `GET /api/v1/super-admin/centers/:centerId/subscription` - implemented
- `PATCH /api/v1/super-admin/centers/:centerId/subscription`

Implemented foundation behavior:
- List subscriptions with pagination, search, status, and center filters.
- View one subscription.
- Create a subscription for a center.
- Get the latest subscription for a center.

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
- `POST /api/v1/super-admin/users/:userId/center-roles` - implemented
- `GET /api/v1/permissions/me` - implemented
- `GET /api/v1/permissions/platform-roles` - implemented
- `POST /api/v1/permissions/platform-users/:userId/roles` - implemented

Implemented foundation behavior:
- List users with pagination, search, and status filters.
- View one user with owned centers and role assignments.
- Create a user with email or phone identity.
- Link a user to a center role through `UserRole.centerId`.
- Seed platform permissions and default roles on API startup.
- Resolve current platform permissions for the development Super Admin user.
- Assign implemented platform roles to users through `UserRole.centerId = null`.
- Protected endpoints return `403 Forbidden` when the current platform user lacks the required permission.

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
- `GET /api/v1/admin/branding`
- `PATCH /api/v1/admin/branding`
- `POST /api/v1/admin/branding/logo`

Permissions:
- `settings.read`
- `settings.update`
- `branding.read`
- `branding.update`

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
- `GET /api/v1/super-admin/audit-log`
- `GET /api/v1/admin/audit-log`
- `GET /api/v1/super-admin/backups`
- `POST /api/v1/super-admin/backups`
- `GET /api/v1/super-admin/backups/:backupId`

Needs Confirmation:
- Whether center admins can view audit logs.
- Whether restore actions are API-triggered or operational only.
