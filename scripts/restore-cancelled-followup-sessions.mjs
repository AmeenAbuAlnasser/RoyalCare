/**
 * restore-cancelled-followup-sessions.mjs
 *
 * Restores sessions 2..N of finite treatment plans that were incorrectly
 * mass-cancelled by the old `cancelFollowUpsForAppointment` bug.
 *
 * That function filtered by `appointmentId`. Since `createPlanFromAppointment`
 * stamps `appointmentId = appointment.id` on EVERY session (1..N), the
 * updateMany cancelled the entire plan whenever an appointment transitioned
 * away from COMPLETED status.
 *
 * Detection criteria (ALL must be true — any mismatch keeps the row safe):
 *   - isRecurring = false         (finite plan session)
 *   - sessionNumber > 1           (never touch session 1)
 *   - status NOT IN (COMPLETED, CLOSED_EARLY)
 *   - status = CANCELLED  OR  planStatus = CANCELLED
 *   - nextAppointmentId IS NULL   (never explicitly booked — a user-cancelled
 *                                  booked session would have had a link)
 *   - closedEarlyReason IS NULL   (no explicit user close-early reason)
 *   - closedEarlyAt IS NULL       (no explicit close timestamp)
 *   - closedEarlyAfterSession IS NULL
 *   - planStatus != CLOSED_EARLY  (plan not explicitly closed by user)
 *   - Session 1 of the same plan exists AND is NOT cancelled/closed
 *     (proves the plan is still live and session 1 was not removed)
 *
 * Restore action (per session, never touches session 1 or linked appointments):
 *   - status    = DUE     if dueDate <= today
 *   - status    = UPCOMING if dueDate > today
 *   - planStatus = ACTIVE
 *
 * Usage:
 *   node scripts/restore-cancelled-followup-sessions.mjs --centerSlug=laser-care
 *   node scripts/restore-cancelled-followup-sessions.mjs --centerSlug=laser-care --apply
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const centerSlugArg = args.find((a) => a.startsWith("--centerSlug="))?.split("=")[1]?.trim();
const apply = args.includes("--apply");

if (!centerSlugArg) {
  console.error("Usage:");
  console.error("  node scripts/restore-cancelled-followup-sessions.mjs --centerSlug=<slug>");
  console.error("  node scripts/restore-cancelled-followup-sessions.mjs --centerSlug=<slug> --apply");
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

const { Client, types } = require(
  path.join(__dirname, "..", "packages", "database", "node_modules", "pg"),
);
types.setTypeParser(1082, (v) => v); // return date columns as "YYYY-MM-DD" strings

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusForDueDate(dueDateStr) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(`${dueDateStr}T00:00:00.000Z`);
  return due.getTime() <= today.getTime() ? "DUE" : "UPCOMING";
}

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

console.log("\n" + "═".repeat(80));
console.log("  restore-cancelled-followup-sessions");
console.log("═".repeat(80));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${centerId}`);
console.log(`  Mode    : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

// ─── Detect incorrectly-cancelled sessions ─────────────────────────────────────
//
// Join session 2..N to session 1 of the same plan via appointmentId.
// createPlanFromAppointment stamps appointmentId = appointment.id on ALL sessions,
// so grouping by (centerId, appointmentId) identifies the plan.
// Only include rows where session 1 is still active (plan not explicitly closed).
//
const { rows: brokenRows } = await client.query(
  `
  SELECT
    f.id                           AS "followUpId",
    f."sessionNumber",
    f.status                       AS "currentStatus",
    f."planStatus"                 AS "currentPlanStatus",
    f."dueDate",
    f."appointmentId",
    a.status                       AS "appointmentStatus",
    f1.id                          AS "session1Id",
    f1.status                      AS "session1Status",
    f1."planStatus"                AS "session1PlanStatus"
  FROM "PatientFollowUp"  f
  -- Session 1 of the same plan (same centerId + appointmentId)
  JOIN "PatientFollowUp"  f1 ON (
    f1."centerId"        = f."centerId"
    AND f1."appointmentId" = f."appointmentId"
    AND f1."isRecurring"   = false
    AND f1."sessionNumber" = 1
  )
  -- Origin appointment (proves the plan exists and the appointment is real)
  JOIN "Appointment" a ON (
    a.id          = f."appointmentId"
    AND a."centerId" = f."centerId"
  )
  WHERE f."centerId"             = $1
    AND f."isRecurring"          = false
    AND f."sessionNumber"        > 1
    -- Only cancelled sessions — never touch COMPLETED or CLOSED_EARLY
    AND f.status NOT IN ('COMPLETED', 'CLOSED_EARLY')
    AND (f.status = 'CANCELLED' OR f."planStatus" = 'CANCELLED')
    -- No explicit appointment link (bug cancellation never set one)
    AND f."nextAppointmentId"    IS NULL
    -- No explicit user close-early markers
    AND (f."closedEarlyReason"   IS NULL OR f."closedEarlyReason" = '')
    AND f."closedEarlyAt"        IS NULL
    AND f."closedEarlyAfterSession" IS NULL
    -- Plan not explicitly closed by user
    AND f."planStatus"           != 'CLOSED_EARLY'
    -- Session 1 must still be active — if it is also cancelled/closed then
    -- the whole plan was deliberately cancelled and we must not touch it
    AND f1.status    NOT IN ('CANCELLED', 'CLOSED_EARLY')
    AND f1."planStatus" NOT IN ('CANCELLED', 'CLOSED_EARLY')
  ORDER BY f."appointmentId", f."sessionNumber"
  `,
  [centerId],
);

console.log(`\n  Incorrectly-cancelled sessions detected: ${brokenRows.length}`);

if (brokenRows.length === 0) {
  console.log("\n  Nothing to restore — all sessions are already correct.");
  await client.end();
  process.exit(0);
}

// ─── Build repair list ────────────────────────────────────────────────────────
const repairs = brokenRows.map((row) => ({
  followUpId: row.followUpId,
  sessionNumber: row.sessionNumber,
  dueDate: row.dueDate,
  currentStatus: row.currentStatus,
  currentPlanStatus: row.currentPlanStatus,
  targetStatus: statusForDueDate(row.dueDate),
  targetPlanStatus: "ACTIVE",
  appointmentStatus: row.appointmentStatus,
  session1Status: row.session1Status,
}));

const alreadyOk = brokenRows.length - repairs.length; // always 0 here, for clarity

// ─── Print diff table ─────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(130));
console.log(
  `  ${"FollowUp ID".padEnd(38)} ${"Sess".padEnd(5)} ${"DueDate".padEnd(12)} ${"Sess1Status".padEnd(14)} ${"ApptStatus".padEnd(14)} ${"CurrStatus".padEnd(14)} ${"→Status".padEnd(12)} →Plan`,
);
console.log("─".repeat(130));

for (const r of repairs) {
  console.log(
    `  ${r.followUpId.padEnd(38)} ${String(r.sessionNumber).padEnd(5)} ${String(r.dueDate).padEnd(12)} ${r.session1Status.padEnd(14)} ${r.appointmentStatus.padEnd(14)} ${r.currentStatus.padEnd(14)} ${r.targetStatus.padEnd(12)} ${r.targetPlanStatus}`,
  );
}

console.log("─".repeat(130));
console.log(`  Total to restore: ${repairs.length}`);

if (!apply) {
  console.log("\n  [DRY RUN] Pass --apply to write the changes above to the database.");
  await client.end();
  process.exit(0);
}

// ─── Apply ────────────────────────────────────────────────────────────────────
console.log("\n  [APPLYING] Writing to database...\n");
await client.query("BEGIN");

try {
  let applied = 0;

  for (const r of repairs) {
    await client.query(
      `UPDATE "PatientFollowUp"
       SET    status        = $1,
              "planStatus"  = $2,
              "updatedAt"   = now()
       WHERE  id = $3`,
      [r.targetStatus, r.targetPlanStatus, r.followUpId],
    );
    console.log(
      `  ✓ sess ${String(r.sessionNumber).padEnd(3)}  ${r.currentStatus.padEnd(14)} → ${r.targetStatus.padEnd(12)}  planStatus→${r.targetPlanStatus}  [${r.followUpId}]`,
    );
    applied++;
  }

  await client.query("COMMIT");

  console.log(`\n  ✓ Restored ${applied} follow-up session(s).`);
  console.log(`\n  Verify in browser /tenant/follow-ups:`);
  console.log(`    - Session 1 remains محجوزة (BOOKED) — unchanged`);
  console.log(`    - Session 2 shows DUE and "حجز جلسة" button (was past dueDate)`);
  console.log(`    - Sessions 3..N show UPCOMING and "حجز جلسة" button`);
  console.log(`    - Changing appointment status no longer mass-cancels the plan`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error(
    `\nERROR: Transaction rolled back — no data modified.\nReason: ${err.message || String(err)}\n`,
  );
  await client.end();
  process.exit(1);
}

await client.end();
