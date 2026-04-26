# CLAUDE.md - RoyalCare AI Instructions

Project: RoyalCare
Initialized: 2026-04-26

## 1. Purpose

This file helps Claude continue work on RoyalCare without losing project context.

Before making architectural or product decisions, read:
- `ai-memory/00_PROJECT_OVERVIEW.md`
- `ai-memory/01_ARCHITECTURE.md`
- `ai-memory/03_BUSINESS_RULES.md`
- `ai-memory/06_PERMISSIONS.md`
- `ai-memory/09_CURRENT_STATUS.md`
- `ai-memory/10_NEXT_TASKS.md`

## 2. Project Summary

RoyalCare is a multi-tenant SaaS platform for laser centers, physiotherapy clinics, hijama centers, beauty clinics, and wellness centers.

RoyalCare is the parent platform. It sells and manages websites plus admin systems for multiple centers.

Each center gets:
- Custom domain
- Website
- Admin panel
- Customers
- Appointments
- Branding
- Enabled modules
- Customer portal

System levels:
1. Super Admin
2. Center Owner Admin Panel
3. Customer Portal

Planned stack:
- Next.js + TypeScript
- NestJS + TypeScript
- PostgreSQL + Prisma
- Future React Native Expo

## 3. Non-Negotiable Rules

- Do not make random assumptions.
- Mark unclear items as `Needs Confirmation`.
- Preserve tenant isolation using `centerId`.
- Treat Arabic and Hebrew RTL support as first-class.
- Keep admin UI simple and practical.
- Enforce permissions on the backend.
- Do not rely on frontend hiding as security.
- Keep documentation updated as decisions change.

## 4. How To Work In This Project

When starting a new task:
1. Read relevant files in `ai-memory/`.
2. Check `09_CURRENT_STATUS.md`.
3. Check `10_NEXT_TASKS.md`.
4. Implement using the documented architecture unless the user changes direction.
5. Update memory files after meaningful changes.

When adding a decision:
- Append it to `ai-memory/07_DECISIONS_LOG.md`.

When changing schema:
- Update `ai-memory/02_DATABASE_SCHEMA.md`.

When changing API:
- Update `ai-memory/04_API_MAP.md`.

When changing status:
- Update `ai-memory/09_CURRENT_STATUS.md`.

## 5. Architecture Guardrails

Backend:
- Use NestJS modules.
- Keep business logic in services.
- Use DTO validation.
- Use guards for auth, tenancy, permissions, modules, and subscriptions.
- Scope tenant-owned queries by trusted `centerId`.

Frontend:
- Use Next.js with TypeScript.
- Build practical admin screens.
- Support RTL/LTR switching.
- Use reusable components for tables, forms, modals, drawers, badges, and navigation.

Database:
- Use PostgreSQL and Prisma.
- Every tenant-owned model needs `centerId`.
- Add indexes for common tenant queries.
- Use migrations for schema changes.

## 6. Current State

As of initialization:
- Memory/docs are initialized.
- Application code is not scaffolded.
- Database schema is conceptual only.
- Many details are pending confirmation.

See `ai-memory/09_CURRENT_STATUS.md` for the current source of truth.
