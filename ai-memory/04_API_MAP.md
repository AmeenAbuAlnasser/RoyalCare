# RoyalCare - API Map

Last updated: 2026-04-26
Status: Initial API planning map

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
- `GET /api/v1/super-admin/centers`
- `POST /api/v1/super-admin/centers`
- `GET /api/v1/super-admin/centers/:centerId`
- `PATCH /api/v1/super-admin/centers/:centerId`
- `POST /api/v1/super-admin/centers/:centerId/suspend`
- `POST /api/v1/super-admin/centers/:centerId/activate`
- `POST /api/v1/super-admin/centers/:centerId/cancel`

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
- `GET /api/v1/super-admin/centers/:centerId/subscription`
- `PATCH /api/v1/super-admin/centers/:centerId/subscription`

Permissions:
- `plans.read`
- `plans.manage`
- `subscriptions.read`
- `subscriptions.manage`

Needs Confirmation:
- Payment provider webhook endpoints.

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
