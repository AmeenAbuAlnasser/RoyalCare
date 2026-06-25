/**
 * reset-laser-care-full-test-data.mjs
 *
 * Wipes ALL operational/test data for a single center while preserving the center
 * itself, its staff, settings, branding, working hours, website content, gallery,
 * offers, pages and subscription.
 *
 * DELETES (scoped to the target center):
 *   NotificationLog, Notification, Payment, CreditTransaction, Invoice,
 *   PatientFollowUp, PatientPortalToken, Session, BookingRequest, Appointment,
 *   ServiceTreatmentTemplate, Service, Patient
 *
 * PRESERVES (never touched):
 *   Center, BrandingSettings, Users/UserRole/Role/Permission/RolePermission,
 *   CenterWorkingHours, ProviderWorkingHours, CenterClosedDay, ProviderLeaveDay,
 *   DynamicPage, CenterGalleryImage, CenterOffer, CenterReview, CenterBeforeAfter,
 *   CenterTeamMember, CenterSeoSettings, Subscription, Domain, marketing/leads,
 *   AuditLog (system audit trail), Customer (legacy, not a tenant patient).
 *
 * Delete order respects foreign keys (children before parents). Restrict FKs that
 * force ordering: Payment→Invoice; Payment/CreditTransaction/Invoice/FollowUp/
 * Appointment → Patient; Appointment/Invoice → Service.
 *
 * Safety:
 *   - DRY RUN by default; prints counts. --apply required to delete.
 *   - Refuses to run when NODE_ENV=production.
 *   - All deletes run in ONE transaction; counts are re-verified (must be 0) before COMMIT.
 *
 * Usage:
 *   node scripts/reset-laser-care-full-test-data.mjs --centerSlug=laser-care
 *   node scripts/reset-laser-care-full-test-data.mjs --centerSlug=laser-care --apply
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Production guard ───────────────────────────────────────────────────────
if ((process.env.NODE_ENV || "").toLowerCase() === "production") {
  console.error("ERROR: Refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const centerSlugArg = args.find((a) => a.startsWith("--centerSlug="))?.split("=")[1]?.trim();
const apply = args.includes("--apply");

if (!centerSlugArg) {
  console.error("Usage:");
  console.error("  node scripts/reset-laser-care-full-test-data.mjs --centerSlug=<slug>");
  console.error("  node scripts/reset-laser-care-full-test-data.mjs --centerSlug=<slug> --apply");
  process.exit(1);
}

// ─── DATABASE_URL ─────────────────────────────────────────────────────────────
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  for (const rel of ["../packages/database/.env", "../services/api/.env"]) {
    try {
      const raw = readFileSync(path.join(__dirname, rel), "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/);
        if (m) { DATABASE_URL = m[1]; break; }
      }
      if (DATABASE_URL) break;
    } catch { /* ignore */ }
  }
}
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set. Set it as an env var or in packages/database/.env");
  process.exit(1);
}

const { Client } = require(
  path.join(__dirname, "..", "packages", "database", "node_modules", "pg"),
);

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// ─── Resolve center ────────────────────────────────────────────────────────────
const { rows: [center] } = await client.query(
  `SELECT id, name, slug FROM "Center" WHERE slug = $1`,
  [centerSlugArg],
);
if (!center) {
  console.error(`\nERROR: Center with slug "${centerSlugArg}" not found.`);
  await client.end();
  process.exit(1);
}
const centerId = center.id;

// ─── Delete plan (children → parents) ───────────────────────────────────────────
// Each step: a label, a WHERE clause and params used for BOTH the count and the delete.
const subNotifications = `"notificationId" IN (SELECT id FROM "Notification" WHERE "centerId" = $1)`;
const subServices = `"serviceId" IN (SELECT id FROM "Service" WHERE "centerId" = $1)`;
const byCenter = `"centerId" = $1`;

const steps = [
  { table: "NotificationLog",          where: subNotifications },
  { table: "Notification",             where: byCenter },
  { table: "Payment",                  where: byCenter },
  { table: "CreditTransaction",        where: byCenter },
  { table: "Invoice",                  where: byCenter },
  { table: "PatientFollowUp",          where: byCenter },
  { table: "PatientPortalToken",       where: byCenter },
  { table: "Session",                  where: byCenter },
  { table: "BookingRequest",           where: byCenter },
  { table: "Appointment",              where: byCenter },
  { table: "ServiceTreatmentTemplate", where: subServices },
  { table: "Service",                  where: byCenter },
  { table: "Patient",                  where: byCenter },
];

async function countFor(step) {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n FROM "${step.table}" WHERE ${step.where}`,
    [centerId],
  );
  return rows[0].n;
}

console.log("\n" + "═".repeat(78));
console.log("  reset-laser-care-full-test-data");
console.log("═".repeat(78));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${centerId}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "(unset)"}`);
console.log(`  Mode    : ${apply ? "APPLY (will DELETE in one transaction)" : "DRY RUN (read-only)"}`);

// ─── Counts BEFORE ──────────────────────────────────────────────────────────────
console.log("\n  Rows in scope (delete order):");
console.log("  " + "─".repeat(50));
let totalBefore = 0;
for (const step of steps) {
  step.before = await countFor(step);
  totalBefore += step.before;
  console.log(`  ${step.table.padEnd(28)} ${String(step.before).padStart(8)}`);
}
console.log("  " + "─".repeat(50));
console.log(`  ${"TOTAL".padEnd(28)} ${String(totalBefore).padStart(8)}`);

if (totalBefore === 0) {
  console.log("\n  Nothing to delete — center already clean.");
  await client.end();
  process.exit(0);
}

if (!apply) {
  console.log("\n  [DRY RUN] Pass --apply to delete the rows above in a single transaction.");
  await client.end();
  process.exit(0);
}

// ─── Apply (single transaction) ───────────────────────────────────────────────
console.log("\n  [APPLYING] Deleting in one transaction...\n");
await client.query("BEGIN");
try {
  let totalDeleted = 0;
  for (const step of steps) {
    const res = await client.query(
      `DELETE FROM "${step.table}" WHERE ${step.where}`,
      [centerId],
    );
    totalDeleted += res.rowCount;
    console.log(`  ✓ ${step.table.padEnd(28)} deleted ${String(res.rowCount).padStart(8)}`);
  }

  // Verify everything is gone BEFORE committing.
  console.log("\n  Verifying counts (must all be 0)...");
  const leftovers = [];
  for (const step of steps) {
    const n = await countFor(step);
    if (n !== 0) leftovers.push(`${step.table}=${n}`);
  }
  if (leftovers.length > 0) {
    throw new Error(`Post-delete verification failed — leftovers: ${leftovers.join(", ")}`);
  }

  await client.query("COMMIT");
  console.log(`  ✓ Verified clean. Deleted ${totalDeleted} row(s) total.`);
  console.log("\n  Center, staff, settings, branding, working hours, website content,");
  console.log("  gallery/offers/pages and subscription were preserved.");
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`\nERROR: Transaction rolled back — no data deleted.\nReason: ${err.message || String(err)}\n`);
  await client.end();
  process.exit(1);
}

await client.end();
