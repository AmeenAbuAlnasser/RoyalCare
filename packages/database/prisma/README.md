# RoyalCare Prisma

This folder owns the Prisma schema, migrations, and seed structure for RoyalCare.

Current status:
- PostgreSQL datasource is initialized.
- Prisma client generation is configured.
- Full RoyalCare data models are intentionally not created yet.

Schema rules:
- Tenant-owned tables must include `centerId`.
- Global RoyalCare tables should not include `centerId` unless they are center-scoped.
- Permission, audit, backup, and subscription changes must be designed before production migrations.
