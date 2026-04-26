# RoyalCare - Current Status

Last updated: 2026-04-26
Status: Web, API, and Phase 2 database foundation ready; mobile implementation not started

## 1. What Exists Now

The project currently has AI memory/documentation files, a clean monorepo folder structure, the main web application scaffolded, the backend API scaffolded, and the database package initialized.

Files initialized:
- `ai-memory/00_PROJECT_OVERVIEW.md`
- `ai-memory/01_ARCHITECTURE.md`
- `ai-memory/02_DATABASE_SCHEMA.md`
- `ai-memory/03_BUSINESS_RULES.md`
- `ai-memory/04_API_MAP.md`
- `ai-memory/05_UI_UX_RULES.md`
- `ai-memory/06_PERMISSIONS.md`
- `ai-memory/07_DECISIONS_LOG.md`
- `ai-memory/08_CHANGELOG.md`
- `ai-memory/09_CURRENT_STATUS.md`
- `ai-memory/10_NEXT_TASKS.md`
- `CLAUDE.md`
- `AGENTS.md`
- `README.md`

Monorepo folders initialized:
- `apps/web`
- `apps/mobile`
- `services/api`
- `packages/database`
- `packages/shared`
- `packages/ui`

Placeholder files:
- `.gitkeep` files were added inside empty app/service/package folders so the structure can be preserved before framework scaffolding.

Web app initialized:
- Location: `apps/web`
- Next.js `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS
- App Router
- ESLint
- `src/` directory
- Import alias `@/*`
- Route groups prepared:
  - `src/app/(public)`
  - `src/app/(super-admin)`
  - `src/app/(center-admin)`
  - `src/app/(portal)`
- Future module folders prepared:
  - `src/features/public-site`
  - `src/features/super-admin`
  - `src/features/center-admin`
  - `src/features/customer-portal`
  - `src/features/auth`
  - `src/features/tenancy`

Backend API initialized:
- Location: `services/api`
- NestJS `11.x`
- TypeScript
- REST-ready architecture
- ESLint
- Global API prefix: `api/v1`
- Default port: `3001`
- Health endpoint: `GET /api/v1/health`
- Prepared modules:
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
- Tenant context interface prepared with `centerId`

Database package initialized:
- Location: `packages/database`
- Package name: `@royalcare/database`
- Prisma ORM `7.8.0`
- PostgreSQL datasource baseline
- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Migrations folder prepared
- Seeds folder prepared
- TypeScript helpers folder prepared
- Tenant scope helper prepared with `centerId`
- Phase 1 Prisma schema foundation implemented
- Phase 2 Prisma business foundation implemented
- Implemented models:
  - User
  - Role
  - Permission
  - UserRole
  - RolePermission
  - Center
  - Subscription
  - Domain
  - Customer
  - Service
  - Appointment
  - Session
  - Notification
  - Dynamic Page
  - Branding Settings
Deferred models:
  - Payment
  - Medical diagnosis details
  - Staff scheduling
  - File Asset
  - Audit Log
  - Dedicated Page Block
  - Audit Log

## 2. Implementation Status

Application code:
- Web scaffold exists, but RoyalCare product features are not implemented

Frontend:
- Next.js app scaffolded at `apps/web`
- No RoyalCare pages built yet
- Future mobile folder prepared at `apps/mobile`

Backend:
- NestJS app scaffolded at `services/api`
- Business endpoints not implemented yet
- Database not connected

Database:
- Prisma schema baseline created
- Phase 1 and Phase 2 foundation models created
- Migrations not created yet
- Migration folder prepared at `packages/database/prisma/migrations`

Authentication:
- Not implemented

Permissions:
- Designed conceptually
- Not implemented

Tenant isolation:
- Designed conceptually using `centerId`
- Not implemented

Deployment:
- Not configured

## 3. Confirmed Direction

Confirmed by project initialization request:
- Project name: RoyalCare
- Product type: Multi-tenant SaaS
- Target industries: laser, physiotherapy, hijama, beauty, wellness
- System levels: Super Admin, Center Owner Admin Panel, Customer Portal
- Frontend Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Future Mobile: React Native Expo
- Multi-language: Arabic, Hebrew, English
- RTL-friendly requirement
- Tenant isolation using `centerId`
- Simple practical admin UI
- Strong permissions system
- Backup system needed

## 4. Major Needs Confirmation

Business:
- MVP scope
- Launch deadline
- Pricing/plans
- Trial rules
- Payment provider
- Online payment requirements
- Country/legal compliance requirements

Technical:
- Package manager
- Monorepo tooling
- Hosting provider
- Authentication strategy
- File storage provider
- Email/SMS/WhatsApp providers
- Backup frequency and retention

Product:
- Customer portal v1 scope
- Appointment booking rules
- Session fields per industry
- Page builder complexity
- Domain automation workflow
- Required templates for first release

## 5. Recommended Immediate Next Step

Before writing application code, confirm MVP scope and infrastructure choices.

Recommended first technical implementation:
1. Choose package manager and monorepo tooling.
2. Add root workspace configuration.
3. Create the first Prisma migration when a PostgreSQL environment is confirmed.
4. Add seed data for platform roles and permissions.
5. Implement auth, tenancy guard, and permissions guard early.
6. Start web app shell only after route/layout direction is confirmed.

## 7. Verification

Latest verification:
- `npm run lint` passed in `apps/web`.
- `npm run lint` passed in `services/api`.
- `npm run build` passed in `services/api`.
- `npm test` passed in `services/api`.
- `npm run test:e2e` passed in `services/api`.
- `npm run db:validate` passed in `packages/database`.
- `npm run typecheck` passed in `packages/database`.
- `npm run db:format` passed in `packages/database`.

## 6. Risk Notes

Important risks:
- Tenant isolation mistakes can expose customer data between centers.
- RTL support is much harder if added late.
- Subscription/module checks must be backend-enforced, not only hidden in UI.
- Page builder scope can grow too large if not constrained.
- Appointment rules can become complex quickly if staff availability, recurring sessions, and cancellation policies are all included at once.
