# RoyalCare Web

Main web application for RoyalCare.

Stack:
- Next.js 16
- TypeScript
- Tailwind CSS
- App Router
- ESLint

This app is prepared for:
- Public center websites
- RoyalCare Super Admin Panel
- Center Admin Panel
- Customer Portal

## Structure

```text
src/
  app/
    (public)/
    (super-admin)/
    (center-admin)/
    (portal)/
  components/
  config/
  features/
  hooks/
  i18n/
  lib/
  providers/
  styles/
  types/
```

Route groups are placeholders only. Feature pages and application workflows will be added later.

## Development

```bash
npm run dev
```

## Architecture Notes

- Keep RTL support in mind for Arabic and Hebrew.
- Prefer logical CSS properties such as `padding-inline` and `margin-inline`.
- Keep public website, Super Admin, Center Admin, and Customer Portal concerns separated by route group and feature module.
- Backend business logic belongs in `services/api`, not in the web app.
- Shared contracts should move to `packages/shared` when cross-app reuse begins.

## Generated Baseline

This project was initialized with `create-next-app@16.2.4`.
