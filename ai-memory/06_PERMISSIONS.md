# RoyalCare - Permissions

Last updated: 2026-06-14
Status: Super Admin RBAC plus tenant login, patients, services, appointments, staff, billing, reports, and expenses foundations implemented

## 1. Permission Goals

RoyalCare needs strong permissions because it has three levels:
1. Super Admin
2. Center Owner Admin Panel
3. Customer Portal

Permission design must protect:
- Tenant data isolation
- Subscription-controlled features
- Administrative actions
- Customer privacy
- Future mobile access

## 2. Access Layers

Every protected request should pass these checks:
1. Authentication
2. Tenant resolution, when tenant-owned data is involved
3. User membership in the center, unless Super Admin
4. Role/permission check
5. Module availability check, when feature is module-based
6. Subscription status check
7. Resource ownership check, especially for customers

## 3. Role Types

### 3.1 Super Admin Roles

Example roles:
- Owner
- Platform Admin
- Support Agent
- Billing Manager

Capabilities may include:
- Manage all centers
- Manage subscriptions
- Manage domains
- Manage modules/templates
- View audit logs
- Trigger backups

### 3.2 Center Roles

Example roles:
- Center Owner
- Center Manager
- Receptionist
- Practitioner
- Content Editor

Capabilities may include:
- Manage customers
- Manage appointments
- Manage sessions
- Manage services
- Manage staff
- Edit pages
- Manage branding
- Manage center users

### 3.3 Customer Role

Customer access is resource-owned, not broad admin access.

Capabilities may include:
- View own profile
- Update own profile
- View own appointments
- Request/book appointment
- View own notifications
- View own sessions if enabled

## 4. Permission Key Pattern

RoyalCare now uses granular action/resource permission keys for the implemented Super Admin foundation:

```text
action:resource
```

Implemented platform permission keys:
- `view:centers`
- `create:centers`
- `edit:centers`
- `suspend:centers`
- `manage:subscriptions`
- `view:internal_notes`
- `manage:internal_notes`
- `view:users`
- `manage:users`
- `manage:plans`
- `view:reports`

Older draft dot-separated examples below are retained as conceptual examples for future Center Admin and portal work.

Use dot-separated permission keys in future modules only if the platform key pattern is intentionally revised:

```text
resource.action
```

Examples:
- `centers.read`
- `centers.create`
- `centers.update`
- `centers.status.manage`
- `subscriptions.read`
- `subscriptions.manage`
- `domains.read`
- `domains.manage`
- `customers.read`
- `customers.create`
- `customers.update`
- `customers.delete`

## 5. Super Admin Permissions

Implemented platform roles:
- `super_admin`: all current platform permissions.
- `platform_admin`: centers operations, subscription management, internal notes, plans, and reports; no user management.
- `finance_admin`: centers view, manual subscriptions/plans, and reports.
- `support_admin`: centers view, internal notes view/manage, and reports.
- `read_only_admin`: centers view and reports only.

Implemented backend enforcement:
- Centers list/details require `view:centers`.
- Center creation requires `create:centers`.
- Center edit requires `edit:centers`.
- Center status actions require `suspend:centers`.
- Manual subscription updates require `manage:subscriptions`.
- Internal notes list requires `view:internal_notes`.
- Internal note creation requires `manage:internal_notes`.
- Super Admin users list/details require `view:users`.
- Super Admin user create, update, status change, password reset, platform role assignment, and center role assignment require `manage:users`.
- Center staff listing from Super Admin Center Details requires `view:users`.
- Center staff create/edit/status/reset actions require `manage:users`.
- Center staff membership is tenant-scoped through `UserRole.centerId`; staff users must not be managed through another center's route.

Implemented frontend enforcement:
- Centers List hides Add New Center unless the user has `create:centers`.
- Centers List hides Edit unless the user has `edit:centers`.
- Centers List hides Renew Subscription unless the user has `manage:subscriptions`.
- Centers List hides Suspend unless the user has `suspend:centers`.
- Center Details hides Edit unless the user has `edit:centers`.
- Center Details hides status actions unless the user has `suspend:centers`.
- Center Details hides Subscription Management unless the user has `manage:subscriptions`.
- Center Details hides Internal Notes unless the user has `view:internal_notes`.
- Center Details hides note creation unless the user has `manage:internal_notes`.
- Center Details hides Center Staff Users unless the user has `view:users`.
- Center Details hides add/edit/status/reset staff actions unless the user has `manage:users`.

Implemented tenant enforcement:
- Tenant Patients endpoints require a valid center staff session cookie.
- Patient list/detail/create/update/status actions derive `centerId` from the session, never from client-supplied input.
- Patient detail/update/status routes return `404` for records outside the authenticated center.
- Granular center-role permission checks for patients are not yet implemented; current foundation allows authenticated active center staff roles and is ready to be narrowed by future center permissions.

Current development auth bridge:
- Until real authentication is implemented, protected API requests may pass `x-royalcare-super-admin-user-id` to select a platform admin user.
- If no header is provided, the backend uses the seeded local fallback Super Admin user `super.admin@royalcare.local`.

Legacy draft permissions:

Centers:
- `centers.read`
- `centers.create`
- `centers.update`
- `centers.status.manage`
- `centers.impersonate`
- `centers.internal_notes.read`
- `centers.internal_notes.create`

Subscriptions:
- `subscriptions.read`
- `subscriptions.manage`
- `plans.read`
- `plans.manage`

Domains:
- `domains.read`
- `domains.manage`
- `domains.verify`

Templates and modules:
- `templates.read`
- `templates.manage`
- `modules.read`
- `modules.manage`

Platform users:
- `platform_users.read`
- `platform_users.create`
- `platform_users.update`
- `platform_users.disable`
- `platform_roles.manage`

Audit and backups:
- `audit.read`
- `backups.read`
- `backups.create`
- `backups.restore`

Needs Confirmation:
- Whether Super Admin impersonation is allowed.
- Whether restore permission should exist in the UI or remain operational-only.

## 6. Center Admin Permissions

Implemented tenant login foundation:
- Dedicated branded tenant login route is `/c/[centerSlug]/login`.
- Generic `/tenant/login` remains as a temporary fallback route.
- Dedicated login resolves the center by slug before credential submission.
- Dedicated login applies center branding from `BrandingSettings.logoUrl` and center default language from `Center.primaryLanguage`.
- Center staff users log in through `POST /api/v1/auth/center/login`, not the Super Admin login.
- Login requires a center-scoped `UserRole.centerId` assignment and active user status.
- When `centerSlug` is provided, login also requires the active user role assignment to belong to that exact center slug.
- Wrong-center login attempts are rejected.
- Suspended, cancelled, and archived centers are blocked from tenant login.
- The signed center session stores one center context and `/auth/center/me` re-checks that center-scoped role on every refresh.
- Center dashboard shell displays only the authenticated user's assigned center context.

Implemented tenant services enforcement:
- Tenant Services endpoints require a valid center staff session cookie.
- Service list/detail/create/update/status actions derive `centerId` from the session, never from client-supplied input.
- Cross-center service IDs return `404`.
- `CENTER_OWNER` and `CENTER_MANAGER` can view, create, update, archive, and activate services.
- `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF` can view services only.
- Services are private tenant ERP records by default; public exposure requires a future explicit public-services API.

Implemented tenant appointments enforcement:
- Tenant Appointments endpoints require a valid center staff session cookie.
- Appointment list/detail/create/update/status/cancel actions derive `centerId` from the session, never from client-supplied input.
- Cross-center appointment IDs return `404`.
- Cross-center patient, service, and provider assignments are rejected.
- `CENTER_OWNER`, `CENTER_MANAGER`, and `RECEPTIONIST` can view, create, update, cancel, and status-change appointments.
- `DOCTOR` can view, update, and status-change appointments.
- `ACCOUNTANT` and `STAFF` can view appointments only.
- Cancelled appointments remain visible historically; no delete permission is implemented.

Implemented tenant staff enforcement:
- Tenant Staff endpoints require a valid center staff session cookie.
- Staff list/detail/create/update/status actions derive `centerId` from the session, never from client-supplied input.
- Cross-center staff IDs return `404`.
- `CENTER_OWNER` and `CENTER_MANAGER` can view, create, update, activate, and deactivate staff.
- `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF` can view staff only.
- Passwords are hashed on create/update and are never returned.

Implemented tenant billing enforcement:
- Tenant Billing endpoints require a valid center staff session cookie.
- Invoice list/detail/create/status actions derive `centerId` from the session, never from client-supplied input.
- Cross-center invoice IDs return `404`.
- `billing.view` is required for all read operations (list, options, detail).
- `billing.create` is required to create an invoice.
- `billing.mark_paid` is required to transition invoice status to `PAID`.
- `billing.update` is required to transition invoice status to `CANCELLED`.
- `CENTER_OWNER`, `CENTER_MANAGER`, and `ACCOUNTANT` have all four billing permissions.
- `RECEPTIONIST` has `billing.view` and `billing.create` only.
- `DOCTOR` and `STAFF` have `billing.view` only.
- Invoice responses contain no `passwordHash`, token, secret, or auth metadata fields.
- `billing.create` permission is also checked before showing the Add Invoice button in the frontend.
- `billing.mark_paid` is checked before showing the Mark as Paid button.
- `billing.update` is checked before showing the Cancel Invoice button.

Implemented tenant expenses enforcement:
- Tenant Expenses endpoints require a valid center staff session cookie.
- Expense list/overview/detail/category actions derive `centerId` from the session, never from client-supplied input.
- Canonical expense permission keys are `expenses:view`, `expenses:create`, `expenses:edit`, `expenses:delete`, and `expenses:reports`.
- Legacy dot keys such as `expenses.view`, `expenses.create`, `expenses.edit`, `expenses.delete`, and `expenses.reports` are normalized on read for compatibility.
- Tenant sidebar visibility for Expenses is gated by `expenses:view` after permission normalization.
- `CENTER_OWNER` has all tenant permissions, including expense permissions.
- `CENTER_MANAGER` has expense permissions by default, including for existing saved role-permission rows through effective permission normalization.
- `ACCOUNTANT` has `expenses:view`, `expenses:create`, `expenses:edit`, and `expenses:reports` by default.

Dashboard:
- `dashboard.read`

Settings:
- `settings.read`
- `settings.update`

Branding:
- `branding.read`
- `branding.update`

Users and roles:
- `users.read`
- `users.create`
- `users.update`
- `users.disable`
- `roles.read`
- `roles.manage`

Customers:
- `customers.read`
- `customers.create`
- `customers.update`
- `customers.delete`

Services:
- `services.view`
- `services.create`
- `services.update`
- `services.archive`
- `services.activate`

Staff:
- `staff.view`
- `staff.create`
- `staff.update`
- `staff.activate`

Appointments:
- `appointments.view`
- `appointments.create`
- `appointments.update`
- `appointments.cancel`
- `appointments.status.update`

Sessions:
- `sessions.read`
- `sessions.create`
- `sessions.update`
- `sessions.delete`

Pages:
- `pages.read`
- `pages.create`
- `pages.update`
- `pages.delete`
- `pages.publish`

Notifications:
- `notifications.read`
- `notifications.manage`

Audit:
- `center_audit.read`

Needs Confirmation:
- Whether center admins can delete customers or only archive them.
- Whether practitioners can see all customers or only assigned customers.

## 7. Customer Portal Permissions

Customer actions:
- `portal.profile.read`
- `portal.profile.update`
- `portal.appointments.read`
- `portal.appointments.create`
- `portal.appointments.cancel`
- `portal.sessions.read`
- `portal.notifications.read`

Rules:
- Customer permissions always require resource ownership.
- A customer can never read another customer's data.
- Customer access is always scoped to the current center.

Needs Confirmation:
- Whether customer session history is visible.
- Whether customers can cancel appointments.

## 8. Default Role Matrix - Draft

Super Admin Owner:
- All platform permissions

Platform Admin:
- All except backup restore and platform owner management

Support Agent:
- Read centers, read domains, read subscriptions, limited support actions

Billing Manager:
- Read centers, manage subscriptions, read billing events

Center Owner:
- All center permissions for their center

Center Manager:
- Most operational permissions except subscription/domain/platform settings

Implemented tenant permission key standard:
- Use colon keys only for canonical tenant RBAC storage and checks.
- Legacy dot keys are read through a compatibility normalizer only.
- Final canonical keys: `patients:view`, `patients:create`, `patients:update`, `patients:status`, `appointments:view`, `appointments:create`, `appointments:update`, `appointments:status`, `appointments:cancel`, `services:view`, `services:create`, `services:update`, `services:archive`, `services:status`, `staff:view`, `staff:create`, `staff:update`, `staff:status`, `billing:view`, `billing:create`, `billing:update`, `billing:cancel`, `payments:view`, `payments:create`, `expenses:view`, `expenses:create`, `expenses:edit`, `expenses:delete`, `expenses:reports`, `reports:view`, `settings:view`, `permissions:view`, `permissions:update`.

Implemented Tenant Services defaults:
- `CENTER_OWNER`: all tenant permissions
- `CENTER_MANAGER`: all tenant permissions
- `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, `STAFF`: `services:view`

Implemented Tenant Appointments defaults:
- `CENTER_OWNER`: all tenant permissions
- `CENTER_MANAGER`: all tenant permissions
- `DOCTOR`: `appointments:view`, `appointments:update`, `appointments:status`
- `RECEPTIONIST`: `appointments:view`, `appointments:create`, `appointments:update`, `appointments:cancel`, `appointments:status`
- `ACCOUNTANT`: `appointments:view`
- `STAFF`: `appointments:view`

Implemented Tenant Staff defaults:
- `CENTER_OWNER`: all tenant permissions
- `CENTER_MANAGER`: all tenant permissions
- `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, `STAFF`: `staff:view`

Implemented Tenant Billing/Payments defaults:
- `CENTER_OWNER`: all tenant permissions
- `CENTER_MANAGER`: all tenant permissions
- `ACCOUNTANT`: `billing:view`, `billing:create`, `billing:update`, `payments:view`, `payments:create`
- `RECEPTIONIST`: `billing:view`, `billing:create`, `payments:view`, `payments:create`
- `DOCTOR`, `STAFF`: `billing:view`, `payments:view`

Implemented Tenant Expenses defaults:
- `CENTER_OWNER`: all tenant permissions
- `CENTER_MANAGER`: all tenant permissions, with saved role rows receiving effective expense permissions by default
- `ACCOUNTANT`: `expenses:view`, `expenses:create`, `expenses:edit`, `expenses:reports`

Receptionist:
- Customers, appointments, basic dashboard

Practitioner:
- Assigned appointments and sessions

Content Editor:
- Pages, services, branding content

Customer:
- Own portal data only

Needs Confirmation:
- Exact default roles for MVP.

## 9. Module Access

Permission alone is not enough. Module must also be enabled.

Example:
- User has `sessions.read`
- Center does not have Sessions module enabled
- API must reject access

Module checks should happen after authentication and tenant resolution.

## 10. Subscription Access

Subscription may restrict:
- Admin access
- Public website availability
- Module availability
- Limits
- Custom domain usage

Rules:
- Suspended centers should have limited or blocked admin functionality.
- Super Admin can always access center records.
- Center users should see clear messages when access is restricted.
- Tenant subscription state is enforced server-side before tenant business writes.
- `EXPIRED` subscriptions block `POST`, `PATCH`, `PUT`, and `DELETE` for patients, appointments, services, staff, billing, payments, credits, and role-permission management while keeping read access available.
- `SUSPENDED` subscriptions block tenant business writes with a suspension error; dashboard, notifications, logout, and renewal request remain available.
- Frontend action buttons use the same `subscriptionAccess` state from `/permissions/me` to disable write actions and show localized banners/tooltips, but backend middleware remains authoritative.
- Tenant marketing settings read/write endpoints require `settings:view`, are scoped by the authenticated `centerId`, and are included in the tenant subscription write-block middleware for expired/suspended centers.

## 11. Tenant Isolation Enforcement

Backend enforcement:
- Tenant guard resolves center context.
- Permission guard checks user role.
- Repository/service layer scopes tenant-owned queries by `centerId`.
- Tests should cover cross-tenant access attempts.
- Protected Super Admin endpoints require an explicit `x-royalcare-super-admin-user-id` header; tenant center sessions alone do not satisfy platform permissions.

Frontend enforcement:
- Hide inaccessible navigation items.
- Hide or disable inaccessible actions.
- Never rely on frontend checks as the only protection.
- 2026-05-18 RBAC UI pass: Center Admin appointment list/details hide unauthorized appointment edit/status and billing payment/credit controls; expired/suspended subscription blocks keep permitted write controls disabled with localized messages while API checks remain authoritative.

## 12. Audit Requirements

Audit permission-sensitive actions:
- Role changes
- Permission changes
- User invites/disables
- Subscription changes
- Domain changes
- Module changes
- Customer deletion/archive
- Appointment cancellations
- Backup and restore actions
