# RoyalCare Production Deployment Runbook

This runbook covers staging and production deployment for the RoyalCare API, web app, and PostgreSQL database.

Do not run production deployment commands from an unverified branch. Deploy from a tagged release or a known-good commit that has already passed API lint/build, web lint/typecheck/build, and Prisma migration checks.

## 1. Prerequisites

### Server

- Windows Server or Linux server with stable process supervision.
- Node.js 20 LTS or newer.
- PostgreSQL 15 or newer.
- PostgreSQL client tools installed:
  - `pg_dump`
  - `pg_restore`
- Chrome or Chromium installed for PDF invoice generation.
- PM2 installed globally:

```powershell
npm install -g pm2
```

- Nginx or another reverse proxy in front of the API and web app.
- TLS certificates configured for public domains.

### Required Ports

- API process: `3001`
- Web process: `3002`
- Nginx should expose HTTPS publicly and proxy to local app ports.

### Required Verification Commands

```powershell
node --version
npm --version
pg_dump --version
pg_restore --version
pm2 --version
```

If `pg_dump` is installed but not found on Windows, add the PostgreSQL `bin` directory to PATH, for example:

```powershell
C:\Program Files\PostgreSQL\16\bin
```

## 2. Environment Variables

Keep real `.env` files on the server only. Do not commit secrets.

### API: `services/api/.env`

Required:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/royalcare_prod?schema=public"
NODE_ENV="production"
PORT="3001"
ROYALCARE_CENTER_SESSION_SECRET="strong-random-secret"
ROYALCARE_PLATFORM_AUTH_HEADER="strong-platform-header-secret"
ROYALCARE_JWT_SECRET="strong-random-jwt-secret-if-used"
ROYALCARE_API_URL="https://api.example.com"
ROYALCARE_WEB_URL="https://app.example.com"
ROYALCARE_PUBLIC_URL="https://example.com"
CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
WHATSAPP_MODE="manual"
WHATSAPP_API_URL=""
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_ID=""
```

Notes:

- `ROYALCARE_CENTER_SESSION_SECRET` must be present in production. The API must not start without it.
- `CHROME_PATH` must point to a real Chrome/Chromium executable if PDF invoice download is enabled.
- Keep `ROYALCARE_PLATFORM_AUTH_HEADER` server-side only. Never expose it to browser code.

### Web: `apps/web/.env`

Required:

```env
NEXT_PUBLIC_API_URL="https://api.example.com/api/v1"
NEXT_PUBLIC_ROYALCARE_API_URL="https://api.example.com/api/v1"
NEXT_PUBLIC_ROYALCARE_APP_URL="https://app.example.com"
NEXT_PUBLIC_ROYALCARE_SUPPORT_WHATSAPP="970598396860"
```

## 3. Backup Before Deploy

Always create and verify a database backup before running migrations.

Windows:

```powershell
.\scripts\backup-db.ps1
```

Manual command:

```powershell
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump $env:DATABASE_URL --format=custom --file "backups\royalcare_$stamp.dump"
pg_restore --list "backups\royalcare_$stamp.dump" | Out-Null
```

The backup is not considered usable until `pg_restore --list` succeeds.

## 4. Deployment Steps

From the repository root:

```powershell
git fetch --all
git checkout <release-tag-or-branch>
git pull
```

Install dependencies if `node_modules` is missing or the lockfile changed:

```powershell
cd packages\database
npm install

cd ..\..\services\api
npm install

cd ..\..\apps\web
npm install
```

Run migrations and generate Prisma client:

```powershell
cd packages\database
npx prisma migrate deploy
npx prisma generate
npm run db:validate
```

Build the API:

```powershell
cd services\api
npm run lint
npm run build
```

Build the web app:

```powershell
cd apps\web
npm run lint
npx tsc --noEmit
npm run build
```

Restart PM2 apps:

```powershell
pm2 restart royalcare-api
pm2 restart royalcare-web
pm2 save
```

Or run the Windows deployment script:

```powershell
.\scripts\deploy-production.ps1
```

Dry run:

```powershell
.\scripts\deploy-production.ps1 -DryRun
```

## 5. PM2 Reference

Initial API start:

```powershell
pm2 start npm --name royalcare-api --cwd services\api -- run start:prod
```

Initial web start:

```powershell
pm2 start npm --name royalcare-web --cwd apps\web -- run start
```

Save process list:

```powershell
pm2 save
```

View logs:

```powershell
pm2 logs royalcare-api
pm2 logs royalcare-web
```

## 6. Smoke Tests

Run after every deploy.

```powershell
Invoke-WebRequest "https://api.example.com/api/v1/health" -UseBasicParsing
Invoke-WebRequest "https://app.example.com/centers" -UseBasicParsing
Invoke-WebRequest "https://app.example.com/c/jenin-care" -UseBasicParsing
Invoke-WebRequest "https://app.example.com/c/jenin-care/book" -UseBasicParsing
```

Manual browser smoke:

- `/centers` loads.
- `/c/jenin-care` loads.
- `/c/jenin-care/book` loads.
- `/super-admin/settings` loads for Super Admin.
- Tenant login works.
- Booking request can be submitted from the public page.
- Booking request appears in tenant Booking Requests.
- Tenant schedule remains protected from unauthenticated access.
- Patient portal link opens.
- Subscription invoice PDF downloads successfully.

Security checks:

- Unauthenticated `/api/v1/admin/settings` returns `401` or `403`.
- Tenant session cannot access Super Admin settings API.
- Unauthenticated tenant APIs return `401`.

## 7. Rollback

Rollback is required if migrations, app startup, login, public booking, or tenant isolation checks fail after deployment.

### 7.1 Stop Processes

```powershell
pm2 stop royalcare-api
pm2 stop royalcare-web
```

### 7.2 Roll Back Code

```powershell
git checkout <previous-known-good-tag>
```

Reinstall/build if needed:

```powershell
cd packages\database
npm install
npx prisma generate

cd ..\..\services\api
npm install
npm run build

cd ..\..\apps\web
npm install
npm run build
```

### 7.3 Restore Database Backup

Use only when the deployed migration or data changes must be reverted.

```powershell
.\scripts\restore-db.ps1 -BackupFile "backups\royalcare_YYYYMMDD_HHMMSS.dump"
```

### 7.4 Restart

```powershell
pm2 restart royalcare-api
pm2 restart royalcare-web
pm2 save
```

Re-run smoke tests.

## 8. Troubleshooting

### API Fails Startup

Check:

- `services/api/.env` exists.
- `DATABASE_URL` is valid.
- `ROYALCARE_CENTER_SESSION_SECRET` is present in production.
- Database is reachable.
- `pm2 logs royalcare-api`.

### PDF Download Fails

Check:

- Chrome/Chromium is installed.
- `CHROME_PATH` points to the executable.
- The PM2 API process can access that path.

### Migration Fails

Check:

- Backup exists and was verified before migration.
- `packages/database/prisma/migrations` is complete.
- `npx prisma migrate status` output.
- Do not use `prisma db push` in production.

### Backup Fails

Check:

- `pg_dump --version`.
- `DATABASE_URL` is available to the shell or loaded from `services/api/.env`.
- Backup directory is writable.
- PostgreSQL user has permission to read the database.

### Web Routes Return 502

Check:

- `pm2 status`.
- `pm2 logs royalcare-web`.
- Nginx upstream points to the correct port.
- Web app was built with production public API URLs.

### API Routes Return 502

Check:

- `pm2 status`.
- `pm2 logs royalcare-api`.
- API listens on the configured `PORT`.
- Nginx upstream points to the correct port.

