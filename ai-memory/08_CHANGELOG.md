# RoyalCare - Changelog

## 2026-04-26

Initialized the backend API in `services/api`.

Added:
- NestJS `11.x` API scaffold generated with `@nestjs/cli@11.0.21`
- TypeScript backend setup
- REST-ready global prefix `api/v1`
- ESLint backend setup
- Clean modular API structure
- Health endpoint at `GET /api/v1/health`
- Module placeholders for:
  - Auth
  - Users
  - Tenancy
  - Centers
  - Subscriptions
  - Domains
  - Appointments
  - Customers
  - Services
  - Sessions
  - Notifications
  - Permissions
- Common backend folders for constants, decorators, DTOs, filters, guards, interceptors, interfaces, and pipes
- Tenant context interface using `centerId`

Verified:
- `npm run lint` passes in `services/api`.
- `npm run build` passes in `services/api`.
- `npm test` passes in `services/api`.
- `npm run test:e2e` passes in `services/api`.

Notes:
- No database connection was added.
- No Prisma schema was created.
- Business endpoints are not implemented yet.

Initialized the main web application in `apps/web`.

Added:
- Next.js `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS
- App Router
- ESLint
- `src/` directory structure
- Import alias `@/*`
- Route-group placeholders for:
  - Public website
  - Super Admin Panel
  - Center Admin Panel
  - Customer Portal
- Feature/module placeholders for:
  - Auth
  - Tenancy
  - Public site
  - Super Admin
  - Center Admin
  - Customer Portal
- RTL-aware global CSS baseline

Removed:
- Generated demo homepage content
- Generated demo SVG assets

Verified:
- `npm run lint` passes in `apps/web`.

Notes:
- No actual RoyalCare pages or workflows were built yet.
- The web app is structure-ready for future implementation.

Initial official project memory initialization.

Added:
- Project overview
- Architecture direction
- Conceptual database schema
- Business rules
- API map
- UI/UX rules
- Permissions model
- Decisions log
- Current status
- Next tasks
- Claude guidance
- Agent guidance
- Root README

Notes:
- No application code has been generated yet.
- Many product and infrastructure details are intentionally marked as `Needs Confirmation`.
