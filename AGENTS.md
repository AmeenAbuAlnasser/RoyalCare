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
- Every new UI page must be responsive for desktop, tablet, and mobile by default.
- Do not allow unwanted horizontal page scroll; tables may scroll only inside their own table containers.
- Fix real overflow causes with `min-width: 0`, `max-width: 100%`, and responsive grid/flex constraints before using overflow hiding as a safety net.
- All Super Admin pages must use `apps/web/src/features/super-admin/layout/SuperAdminLayout.tsx`.
- Do not create custom page-specific Super Admin navbars, sidebars, headers, language switchers, or profile header controls.
- Arabic/Hebrew Super Admin layouts must be RTL with sidebar/drawer on the right.
- English Super Admin layouts must be LTR with sidebar/drawer on the left.
- No UI feature is complete with visual checks only; it must pass functional UI testing.
- Dynamic `[id]` pages must be tested with at least 3 different ids and each id must show matching, different data.
- List `View` actions must navigate to the correct details page for the clicked row.
- Edit actions must target the correct item and must not silently edit or open the first item.
- Mock detail pages must not use one hardcoded object when a route id exists.
- After navigation, test English, Arabic, and Hebrew language persistence.
- Before completing a feature, verify route behavior, correct data, no hydration errors, no unwanted horizontal overflow, responsive desktop/tablet/mobile behavior, and correct button contrast.
- No page is complete unless it meets professional ERP UI standards suitable for a paid enterprise SaaS platform.
- Responsive design means intentional redesign per viewport, not shrinking desktop UI.
- Mobile layouts must be intentionally redesigned: tables become cards or optimized layouts, action buttons become dropdowns/action menus, sidebars become drawers, filters become collapsible sections where needed, and stats become stacked cards.
- Buttons must have consistent sizing, clear hierarchy, strong visual priority, and no ugly stacked clusters.
- Spacing must be balanced: no compressed UI and no oversized empty areas.
- Colors must follow RoyalCare branding with strong contrast, no random colors, and a premium SaaS feel.
- Typography must have clear hierarchy, readable sizes, and no weak tiny text.
- Hover, active, and navigation states must be professional, visible, and enterprise-grade.
- Final UI quality question: would this be acceptable for a paid enterprise SaaS platform? If no, redesign is required.

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
- Shared Super Admin shell for all Super Admin pages

Avoid:
- Complex decorative UI
- Marketing-style admin pages
- Hidden security enforced only by frontend state
- Page-specific Super Admin navigation/header implementations
- Page-level horizontal scrolling caused by tables, filters, cards, badges, or fixed-width containers

## 8. Current Status

Application implementation has not started.

The next major step is to confirm MVP/infrastructure choices, then scaffold the codebase.
