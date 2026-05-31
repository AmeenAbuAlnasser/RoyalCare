# RoyalCare Backup and Recovery

Updated: 2026-05-18

## Production Backup Policy

RoyalCare production PostgreSQL backups must be automated, monitored, encrypted, and periodically restored into a non-production environment.

Recommended schedule:
- Daily logical backup at 03:00 server time, after the 02:00 subscription lifecycle job.
- Keep daily backups for 14 days.
- Keep weekly backups for 8 weeks.
- Keep monthly backups for 12 months.
- Store at least one encrypted copy outside the primary server.

## Backup Commands

Verify `pg_dump` is installed and available before launch:

```bash
pg_dump --version
```

Windows PowerShell:

```powershell
Get-Command pg_dump
pg_dump --version
```

Windows install/path note:
- Install PostgreSQL client tools on the API/operations host.
- If `pg_dump` is installed but not found, add the PostgreSQL `bin` directory to PATH, for example `C:\Program Files\PostgreSQL\16\bin`.
- Reopen the terminal/service shell after updating PATH and rerun `Get-Command pg_dump`.

Use custom-format dumps for production restores:

```bash
mkdir -p backups
pg_dump "$DATABASE_URL" --format=custom --file "backups/royalcare_$(date +%Y%m%d_%H%M%S).dump"
```

Plain SQL export for human inspection:

```bash
mkdir -p backups
pg_dump "$DATABASE_URL" --format=plain --file "backups/royalcare_$(date +%Y%m%d_%H%M%S).sql"
```

Windows PowerShell example:

```powershell
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path backups | Out-Null
pg_dump $env:DATABASE_URL --format=custom --file "backups/royalcare_$stamp.dump"
```

If PATH is not configured, use the full executable path:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" $env:DATABASE_URL --format=custom --file "backups/royalcare_$stamp.dump"
```

## Restore Commands

Restore a custom-format dump into a clean database:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" backups/royalcare_YYYYMMDD_HHMMSS.dump
```

Windows PowerShell custom restore:

```powershell
pg_restore --clean --if-exists --no-owner --dbname $env:DATABASE_URL backups/royalcare_YYYYMMDD_HHMMSS.dump
```

Restore a plain SQL dump:

```bash
psql "$DATABASE_URL" --file backups/royalcare_YYYYMMDD_HHMMSS.sql
```

Production restore safety:
- Restore to staging first.
- Verify application boot, login, tenant isolation, invoices, payments, credits, appointments, audit logs, and reports.
- Take a fresh backup before any destructive restore.
- Record backup filename, restore operator, time, app commit, and Prisma schema version.

## Recovery Flows

Invoices:
- Financial invoices must not be hard deleted.
- Cancel invoice by setting status to `CANCELLED`.
- Restore a cancelled invoice by reopening it to `PENDING`; the API recalculates to `PARTIAL` or `PAID` when existing payments require it.
- Reports exclude `CANCELLED` invoices and include restored invoices again.

Patients:
- Patients must not be hard deleted.
- Archive with status `ARCHIVED`.
- Restore by changing status back to `ACTIVE` or `INACTIVE`.
- Archived patients are excluded from create-flow selectors.

Appointments:
- Appointments must not be hard deleted.
- Cancel with status `CANCELLED`, `isCancelled=true`, `cancelledAt`, and a reason.
- Restore by changing status away from `CANCELLED`; stale cancellation flags and cancellation reason are cleared.

Audit logs:
- Audit rows are append-only business evidence.
- Audit parent references use `SetNull` where possible so audit history survives user or center lifecycle changes.

## Current Safety Notes

Critical financial and clinical records now use restrictive referential actions against parent center/invoice/subscription deletes where applicable:
- Subscription
- Subscription invoice
- Patient
- Appointment
- Tenant invoice
- Payment
- Credit transaction

Remaining cascade relations are limited to non-financial or dependent configuration/session records and must be reviewed before adding any center hard-delete feature.
