# RoyalCare - API Map

Last updated: 2026-04-27
Status: NestJS API scaffold initialized; Super Admin Centers, Users, and Subscriptions foundation endpoints implemented

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

## 2.1 Implemented Operational Endpoints

Currently implemented:
- `GET /api/v1/health`
- `GET /api/v1/super-admin/centers`
- `POST /api/v1/super-admin/centers`
- `GET /api/v1/super-admin/centers/:centerId`
- `GET /api/v1/centers`
- `POST /api/v1/centers`
- `GET /api/v1/centers/:centerId`
- `GET /api/v1/super-admin/users`
- `POST /api/v1/super-admin/users`
- `GET /api/v1/super-admin/users/:userId`
- `POST /api/v1/super-admin/users/:userId/center-roles`
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
- Centers, Users, and Subscriptions endpoints are the first real database-backed foundation endpoints.
- Auth, permission guards, and tenant-aware request context still need to be added before production exposure.

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
- View one center with owner, subscriptions, domains, and active user-role assignments.
- Create a center with admin user upsert, center-scoped admin role assignment, branding settings, initial subscription, and optional domain in one transaction.
- `POST /api/v1/centers` is available as a web-friendly creation alias for the Add New Center wizard; the existing Super Admin path remains available.
- Creation validation currently enforces center name, owner/admin email, subscription plan, default language, enabled languages, and that enabled languages include the default language.

Permissions:
- `centers.read`
- `centers.create`
- `centers.update`
- `centers.status.manage`

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
- `plans.read`
- `plans.manage`
- `subscriptions.read`
- `subscriptions.manage`

Needs Confirmation:
- Payment provider webhook endpoints.

## 6.1 Super Admin - Users

Endpoints:
- `GET /api/v1/super-admin/users` - implemented
- `POST /api/v1/super-admin/users` - implemented
- `GET /api/v1/super-admin/users/:userId` - implemented
- `POST /api/v1/super-admin/users/:userId/center-roles` - implemented

Implemented foundation behavior:
- List users with pagination, search, and status filters.
- View one user with owned centers and role assignments.
- Create a user with email or phone identity.
- Link a user to a center role through `UserRole.centerId`.

Permissions:
- `users.read`
- `users.create`
- `users.update`
- `roles.manage`

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

## 13. Center Admin - Services

Endpoints:
- `GET /api/v1/admin/services`
- `POST /api/v1/admin/services`
- `GET /api/v1/admin/services/:serviceId`
- `PATCH /api/v1/admin/services/:serviceId`
- `DELETE /api/v1/admin/services/:serviceId`

Permissions:
- `services.read`
- `services.create`
- `services.update`
- `services.delete`

## 14. Center Admin - Staff

Endpoints:
- `GET /api/v1/admin/staff`
- `POST /api/v1/admin/staff`
- `GET /api/v1/admin/staff/:staffId`
- `PATCH /api/v1/admin/staff/:staffId`
- `DELETE /api/v1/admin/staff/:staffId`

Permissions:
- `staff.read`
- `staff.create`
- `staff.update`
- `staff.delete`

## 15. Center Admin - Appointments

Endpoints:
- `GET /api/v1/admin/appointments`
- `POST /api/v1/admin/appointments`
- `GET /api/v1/admin/appointments/:appointmentId`
- `PATCH /api/v1/admin/appointments/:appointmentId`
- `POST /api/v1/admin/appointments/:appointmentId/confirm`
- `POST /api/v1/admin/appointments/:appointmentId/cancel`
- `POST /api/v1/admin/appointments/:appointmentId/complete`

Permissions:
- `appointments.read`
- `appointments.create`
- `appointments.update`
- `appointments.status.manage`

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
