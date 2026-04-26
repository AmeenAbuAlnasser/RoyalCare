# RoyalCare

RoyalCare is a multi-tenant SaaS platform for laser centers, physiotherapy clinics, hijama centers, beauty clinics, and wellness centers.

RoyalCare is the parent platform that sells and manages complete digital packages for centers: custom websites, admin panels, customer portals, appointments, branding, modules, and domain mapping.

## Project Status

Status: Initial project memory initialized.

Application code has not been scaffolded yet.

## Product Levels

1. Super Admin - RoyalCare platform administration
2. Center Owner Admin Panel - center operations and website management
3. Customer Portal - customer login, appointments, and profile access

## Planned Stack

- Frontend Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Future Mobile: React Native Expo

## Key Requirements

- Multi-tenant architecture
- Tenant isolation using `centerId`
- Custom domain mapping
- Subscription management
- Multi-language support: Arabic, Hebrew, English
- RTL-friendly UI
- Dynamic pages builder
- Appointments and sessions
- Notifications
- Customer portal
- Center-specific modules
- Industry templates
- Branding system
- Strong permissions
- Backup system
- Mobile-ready API architecture

## AI Memory

The long-term project memory is stored in `ai-memory/`.

Important files:
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

Agent guidance:
- `CLAUDE.md`
- `AGENTS.md`

## Development Note

Before implementation, confirm:
- MVP scope
- Package manager
- Monorepo tooling
- Hosting provider
- Auth strategy
- Payment provider
- File storage provider
- Notification providers
- Backup retention policy

See `ai-memory/10_NEXT_TASKS.md` for the recommended next steps.
