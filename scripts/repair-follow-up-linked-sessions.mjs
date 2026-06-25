/**
 * repair-follow-up-linked-sessions.mjs
 *
 * Repairs follow-up session 1 records that were not marked COMPLETED when their
 * source appointment was completed.
 *
 * Root cause: markLinkedSessionCompleted had a `nextAppointmentId: null` constraint
 * in phase 2 that could silently skip session 1 when that field was already set, or
 * failed to link session 1 back to the original appointment via nextAppointmentId.
 *
 * This script finds every completed appointment that has a follow-up plan, locates
 * session 1 (matched by appointmentId = appointment.id, or by patient+service+date
 * as fallback), and:
 *   - Sets status = COMPLETED
 *   - Sets nextAppointmentId = appointment.id (if currently null)
 *
 * Usage:
 *   node scripts/repair-follow-up-linked-sessions.mjs --centerSlug=laser-care
 *   node scripts/repair-follow-up-linked-sessions.mjs --centerSlug=laser-care --apply
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "packages", "database", ".env");

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const centerSlugArg = args.find(a => a.startsWith("--centerSlug="))?.split("=")[1]?.trim();
const apply = args.includes("--apply");

if (!centerSlugArg) {
  console.error("Usage:");
  console.error("  node scripts/repair-follow-up-linked-sessions.mjs --centerSlug=<slug>");
  console.error("  node scripts/repair-follow-up-linked-sessions.mjs --centerSlug=<slug> --apply");
  process.exit(1);
}

// ─── Load DATABASE_URL ─────────────────────────────────────────────────────────
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/);
      if (m) { DATABASE_URL = m[1]; break; }
    }
  } catch {
    // will fail below with a clear message
  }
}

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found. Set it as an env var or in packages/database/.env");
  process.exit(1);
}

const { Client, types } = require(path.join(__dirname, "..", "packages", "database", "node_modules", "pg"));
// Return PostgreSQL `date` columns as raw "YYYY-MM-DD" strings.
types.setTypeParser(1082, val => val);
const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateOnly(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Find center ──────────────────────────────────────────────────────────────
const { rows: [center] } = await client.query(
  `SELECT id, name, slug FROM "Center" WHERE slug = $1`,
  [centerSlugArg],
);

if (!center) {
  console.error(`\nERROR: Center with slug "${centerSlugArg}" not found.`);
  await client.end();
  process.exit(1);
}

console.log("\n" + "═".repeat(80));
console.log("  repair-follow-up-linked-sessions");
console.log("═".repeat(80));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${center.id}`);
console.log(`  Mode    : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

const centerId = center.id;

// ─── Find completed appointments that have follow-up plans ────────────────────
// A "plan" means at least one PatientFollowUp row with isRecurring=false, sessionNumber=1
// linked to this appointment via appointmentId.
const { rows: appointments } = await client.query(`
  SELECT DISTINCT
    a.id,
    a."patientId",
    a."serviceId",
    a."appointmentDate",
    a."completedAt"
  FROM "Appointment" a
  INNER JOIN "PatientFollowUp" f
    ON f."appointmentId" = a.id
    AND f."centerId" = a."centerId"
    AND f."isRecurring" = false
  WHERE a."centerId" = $1
    AND a.status = 'COMPLETED'
  ORDER BY a."appointmentDate" DESC
`, [centerId]);

console.log(`\n  Completed appointments with follow-up plans: ${appointments.length}`);

if (appointments.length === 0) {
  console.log("  Nothing to repair.");
  await client.end();
  process.exit(0);
}

// ─── For each appointment, find session 1 candidates ─────────────────────────

let totalChecked = 0;
let totalNeedsRepair = 0;
const updates = [];

for (const appt of appointments) {
  const apptDateStr = dateOnly(appt.appointmentDate);

  // Strategy 1: session 1 linked via appointmentId (standard case)
  const { rows: session1ByApptId } = await client.query(`
    SELECT
      id,
      "sessionNumber",
      status,
      "dueDate",
      "appointmentId",
      "nextAppointmentId"
    FROM "PatientFollowUp"
    WHERE "centerId" = $1
      AND "appointmentId" = $2
      AND "sessionNumber" = 1
      AND "isRecurring" = false
      AND status NOT IN ('COMPLETED', 'CANCELLED', 'CLOSED_EARLY')
  `, [centerId, appt.id]);

  // Strategy 2: date-based fallback — same patient+service+session1+date, no appointmentId link
  let session1ByDate = [];
  if (session1ByApptId.length === 0 && appt.serviceId) {
    const { rows } = await client.query(`
      SELECT
        id,
        "sessionNumber",
        status,
        "dueDate",
        "appointmentId",
        "nextAppointmentId"
      FROM "PatientFollowUp"
      WHERE "centerId" = $1
        AND "patientId" = $2
        AND "serviceId" = $3
        AND "sessionNumber" = 1
        AND "isRecurring" = false
        AND "dueDate" = $4
        AND status NOT IN ('COMPLETED', 'CANCELLED', 'CLOSED_EARLY')
    `, [centerId, appt.patientId, appt.serviceId, apptDateStr]);
    session1ByDate = rows;
  }

  const candidates = [...session1ByApptId, ...session1ByDate];
  totalChecked++;

  if (candidates.length === 0) continue;

  totalNeedsRepair++;
  const matchReason = session1ByApptId.length > 0 ? "appointmentId+session1" : "date+patient+service+session1";

  for (const row of candidates) {
    const oldStatus = row.status;
    const oldNextApptId = row.nextAppointmentId;
    const newNextApptId = oldNextApptId === null ? appt.id : oldNextApptId;
    const needsLinkUpdate = oldNextApptId === null;

    updates.push({
      followUpId: row.id,
      appointmentId: appt.id,
      apptDate: apptDateStr,
      sessionNumber: row.sessionNumber,
      oldStatus,
      newStatus: "COMPLETED",
      oldNextApptId,
      newNextApptId,
      needsLinkUpdate,
      matchReason,
    });
  }
}

// ─── Print diff table ─────────────────────────────────────────────────────────
console.log(`\n  Appointments checked: ${totalChecked}`);
console.log(`  Plans needing session 1 repair: ${totalNeedsRepair}`);
console.log(`  Follow-up rows to update: ${updates.length}`);

if (updates.length === 0) {
  console.log("\n  All session 1 rows are already COMPLETED. Nothing to repair.");
  await client.end();
  process.exit(0);
}

console.log("\n" + "─".repeat(100));
console.log(
  `  ${"FollowUp ID".padEnd(38)} ${"Appt Date".padEnd(12)} ${"Sess".padEnd(5)} ${"Old Status".padEnd(14)} ${"New Status".padEnd(12)} ${"Link".padEnd(10)} Match`
);
console.log("─".repeat(100));

for (const u of updates) {
  const linkMark = u.needsLinkUpdate ? "→ linked" : "already";
  console.log(
    `  ${u.followUpId.padEnd(38)} ${u.apptDate.padEnd(12)} ${String(u.sessionNumber).padEnd(5)} ${u.oldStatus.padEnd(14)} ${u.newStatus.padEnd(12)} ${linkMark.padEnd(10)} ${u.matchReason}`
  );
}

console.log("─".repeat(100));

if (!apply) {
  console.log("\n  [DRY RUN] Pass --apply to write the changes above to the database.");
  await client.end();
  process.exit(0);
}

// ─── Apply ─────────────────────────────────────────────────────────────────────
console.log("\n  [APPLYING] Writing to database...\n");

let appliedCount = 0;
for (const u of updates) {
  if (u.needsLinkUpdate) {
    await client.query(
      `UPDATE "PatientFollowUp"
       SET status = $1, "nextAppointmentId" = $2, "updatedAt" = now()
       WHERE id = $3`,
      [u.newStatus, u.newNextApptId, u.followUpId],
    );
  } else {
    await client.query(
      `UPDATE "PatientFollowUp"
       SET status = $1, "updatedAt" = now()
       WHERE id = $2`,
      [u.newStatus, u.followUpId],
    );
  }

  const linkNote = u.needsLinkUpdate
    ? ` | nextAppointmentId → ${u.newNextApptId}`
    : " | nextAppointmentId unchanged";
  console.log(`  ✓ ${u.followUpId}  status ${u.oldStatus} → ${u.newStatus}${linkNote}`);
  appliedCount++;
}

console.log(`\n  ✓ Repaired ${appliedCount} follow-up row(s).`);
console.log("  Refresh /tenant/follow-ups to see session 1 marked as مكتملة.");

await client.end();
