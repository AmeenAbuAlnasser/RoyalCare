# RoyalCare - Decisions Log

Last updated: 2026-04-26
Status: Initial decisions log

This file records architectural and product decisions. Future agents must append new decisions here instead of silently changing direction.

## Decision Format

Use this format:

```text
## YYYY-MM-DD - Decision Title

Decision:
- What was decided.

Reason:
- Why this direction was chosen.

Impact:
- What this affects.

Needs Confirmation:
- Any remaining uncertainty.
```

## 2026-04-26 - Project Initialized as RoyalCare

Decision:
- The project name is RoyalCare.
- RoyalCare is a multi-tenant SaaS platform for laser centers, physiotherapy clinics, hijama centers, beauty clinics, and wellness centers.

Reason:
- This defines the parent platform and its initial target industries.

Impact:
- All architecture, database, UI, and permission decisions should support multi-center SaaS behavior.

## 2026-04-26 - Three System Levels

Decision:
- RoyalCare has three system levels:
  - Super Admin
  - Center Owner Admin Panel
  - Customer Portal

Reason:
- The platform must support RoyalCare operations, center operations, and end-customer self-service.

Impact:
- Permissions, routing, UI, and API design must clearly separate these levels.

## 2026-04-26 - Planned Technology Stack

Decision:
- Frontend Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Future Mobile: React Native Expo

Reason:
- This stack supports scalable TypeScript development across web, backend, and future mobile.

Impact:
- Repository structure, API contracts, database schema, and shared types should align with TypeScript-first development.

Needs Confirmation:
- Package manager.
- Monorepo tooling.
- Hosting provider.

## 2026-04-26 - Tenant Isolation by centerId

Decision:
- Tenant isolation will use `centerId` on tenant-owned records.

Reason:
- RoyalCare manages many centers in one platform. A shared database/shared schema model is practical and scalable for this SaaS stage.

Impact:
- Every tenant-owned table must include `centerId`.
- Every tenant-owned query must be scoped by trusted `centerId`.
- Cross-tenant access tests are required for sensitive modules.

## 2026-04-26 - Multi-Language and RTL Are First-Class Requirements

Decision:
- Arabic, Hebrew, and English are supported languages.
- Arabic and Hebrew require RTL support.

Reason:
- The platform targets centers and customers who may use RTL languages.

Impact:
- UI layout, content model, routing, templates, and translations must support RTL from the beginning.

Needs Confirmation:
- Default language per center.
- Whether every center must provide all three languages.

## 2026-04-26 - Admin UI Must Stay Simple and Practical

Decision:
- RoyalCare admin interfaces should be simple, responsive, operational, and avoid unnecessary complexity.

Reason:
- Center owners and staff need daily-use workflows, not decorative UI.

Impact:
- Prefer clear tables, forms, filters, and dashboards over complex visual experiences.

## 2026-04-26 - REST API Recommended for Initial Build

Decision:
- REST is the recommended initial API style.

Reason:
- REST is simple, predictable, mobile-friendly, and works well with NestJS OpenAPI documentation.

Impact:
- API planning uses `/api/v1` REST endpoints.

Needs Confirmation:
- Whether the user specifically wants GraphQL.
