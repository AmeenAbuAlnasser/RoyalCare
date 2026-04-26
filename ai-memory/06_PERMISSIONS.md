# RoyalCare - Permissions

Last updated: 2026-04-26
Status: Initial permission model

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

Use dot-separated permission keys:

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

Centers:
- `centers.read`
- `centers.create`
- `centers.update`
- `centers.status.manage`
- `centers.impersonate`

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
- `services.read`
- `services.create`
- `services.update`
- `services.delete`

Staff:
- `staff.read`
- `staff.create`
- `staff.update`
- `staff.delete`

Appointments:
- `appointments.read`
- `appointments.create`
- `appointments.update`
- `appointments.status.manage`
- `appointments.delete`

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

## 11. Tenant Isolation Enforcement

Backend enforcement:
- Tenant guard resolves center context.
- Permission guard checks user role.
- Repository/service layer scopes tenant-owned queries by `centerId`.
- Tests should cover cross-tenant access attempts.

Frontend enforcement:
- Hide inaccessible navigation items.
- Hide or disable inaccessible actions.
- Never rely on frontend checks as the only protection.

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
