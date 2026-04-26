# AGENTS.md - RoyalCare Agent Guide

Project: RoyalCare
Initialized: 2026-04-26

## 1. Agent Mission

Help build RoyalCare as a professional multi-tenant SaaS platform for centers and clinics.

The project must remain understandable for long-running AI-assisted development. Keep the memory files accurate.

## 2. Read First

Before starting meaningful work, read:
- `ai-memory/00_PROJECT_OVERVIEW.md`
- `ai-memory/01_ARCHITECTURE.md`
- `ai-memory/09_CURRENT_STATUS.md`
- `ai-memory/10_NEXT_TASKS.md`

For specific work, also read:
- Database work: `ai-memory/02_DATABASE_SCHEMA.md`
- Business logic: `ai-memory/03_BUSINESS_RULES.md`
- API work: `ai-memory/04_API_MAP.md`
- UI work: `ai-memory/05_UI_UX_RULES.md`
- Auth/roles: `ai-memory/06_PERMISSIONS.md`
- Decisions: `ai-memory/07_DECISIONS_LOG.md`
- Changes: `ai-memory/08_CHANGELOG.md`

## 3. Project Facts

RoyalCare is:
- A multi-tenant SaaS platform
- Built for laser, physiotherapy, hijama, beauty, and wellness centers
- A parent platform that sells websites and admin systems to centers

System levels:
- Super Admin
- Center Owner Admin Panel
- Customer Portal

Planned stack:
- Next.js + TypeScript
- NestJS + TypeScript
- PostgreSQL + Prisma
- React Native Expo in the future

## 4. Mandatory Engineering Rules

- Do not make random assumptions.
- Mark unclear requirements as `Needs Confirmation`.
- Tenant-owned records must use `centerId`.
- Backend must enforce tenant isolation.
- Backend must enforce permissions.
- Disabled modules must be blocked server-side.
- Subscription restrictions must be enforced server-side.
- Arabic and Hebrew require RTL support.
- Admin UI must stay simple and practical.

## 5. Memory Maintenance Rules

Update memory files when work changes the project.

Examples:
- New schema model: update `02_DATABASE_SCHEMA.md`.
- New endpoint or route: update `04_API_MAP.md`.
- New business rule: update `03_BUSINESS_RULES.md`.
- New permission: update `06_PERMISSIONS.md`.
- New decision: append to `07_DECISIONS_LOG.md`.
- New completed work: update `08_CHANGELOG.md` and `09_CURRENT_STATUS.md`.
- New planned work: update `10_NEXT_TASKS.md`.

## 6. Coding Direction

When implementation starts:
- Prefer a clear monorepo structure.
- Keep shared types in a shared package when useful.
- Keep API contracts mobile-ready.
- Use Prisma migrations.
- Add tests for tenant isolation and permission behavior.
- Avoid over-building page builder, analytics, or mobile before MVP is confirmed.

## 7. UI Direction

Admin interfaces should use:
- Tables
- Filters
- Forms
- Clear status badges
- Simple navigation
- Responsive layouts
- RTL-aware spacing and alignment

Avoid:
- Complex decorative UI
- Marketing-style admin pages
- Hidden security enforced only by frontend state

## 8. Current Status

Application implementation has not started.

The next major step is to confirm MVP/infrastructure choices, then scaffold the codebase.
