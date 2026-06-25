/**
 * reset-followup-statuses-simple.mjs
 *
 * Resets follow-up session statuses to match their linked appointments.
 *
 * Rules applied:
 *   Session 1 (sessionNumber=1, isRecurring=false, appointmentId IS NOT NULL):
 *     - Reads the origin appointment's current status.
 *     - Sets follow-up status: SCHEDULED/CONFIRMED → BOOKED, COMPLETED → COMPLETED,
 *       NO_SHOW → MISSED, CANCELLED → DUE/UPCOMING by dueDate.
 *     - Sets nextAppointmentId = appointmentId if not already set (makes link explicit).
 *
 *   Sessions 2..N with NO linked appointment (nextAppointmentId IS NULL):
 *     - Sets status = DUE  if dueDate < today
 *     - Sets status = UPCOMING if dueDate >= today
 *     - Preserves planStatus — does NOT cancel the plan.
 *
 *   Skips: sessions already matching their target status (no-op), and sessions
 *   that are CLOSED_EARLY (explicit plan-level action that must be preserved).
 *
 * Usage:
 *   node scripts/reset-followup-statuses-simple.mjs --centerSlug=laser-care
 *   node scripts/reset-followup-statuses-simple.mjs --centerSlug=laser-care --apply
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const centerSlugArg = args.find((a) => a.startsWith("--centerSlug="))?.split("=")[1]?.trim();
const apply = args.includes("--apply");

if (!centerSlugArg) {
  console.error("Usage:");
  console.error("  node scripts/reset-followup-statuses-simple.mjs --centerSlug=<slug>");
  console.error("  node scripts/reset-followup-statuses-simple.mjs --centerSlug=<slug> --apply");
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

function apptStatusToFollowUp(apptStatus, dueDateStr) {
  switch (apptStatus) {
    case "SCHEDULED":
    case "CONFIRMED":
      return "BOOKED";
    case "COMPLETED":
      return "COMPLETED";
    case "NO_SHOW":
      return "MISSED";
    case "CANCELLED":
      return statusForDueDate(dueDateStr);
    default:
      return null; // unknown status — skip
  }
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
console.log("  reset-followup-statuses-simple");
console.log("═".repeat(80));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${centerId}`);
console.log(`  Mode    : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

// ─── Part A: Session 1 rows with an origin appointment ───────────────────────
const { rows: session1Rows } = await client.query(
  `
  SELECT
    f.id                    AS "followUpId",
    f."sessionNumber",
    f.status                AS "currentStatus",
    f."planStatus",
    f."dueDate",
    f."nextAppointmentId",
    f."appointmentId",
    a.status                AS "appointmentStatus"
  FROM "PatientFollowUp" f
  JOIN "Appointment"     a ON a.id = f."appointmentId"
  WHERE f."centerId"    = $1
    AND a."centerId"    = $1
    AND f."sessionNumber" = 1
    AND f."isRecurring" = false
    AND f.status NOT IN ('CLOSED_EARLY')
  ORDER BY f."dueDate"
  `,
  [centerId],
);

console.log(`\n  Session 1 rows with origin appointment : ${session1Rows.length}`);

// ─── Part B: Sessions 2..N with no linked appointment ─────────────────────────
// Include COMPLETED — sessions 2..N with no appointment link should never be COMPLETED
// (completion only comes from markLinkedSessionCompleted which always sets nextAppointmentId).
// Stored COMPLETED + no link = bug data from old code. Reset to DUE/UPCOMING.
const { rows: futureRows } = await client.query(
  `
  SELECT
    f.id                    AS "followUpId",
    f."sessionNumber",
    f.status                AS "currentStatus",
    f."planStatus",
    f."dueDate",
    f."nextAppointmentId"
  FROM "PatientFollowUp" f
  WHERE f."centerId"          = $1
    AND f."isRecurring"       = false
    AND f."sessionNumber"     > 1
    AND f."nextAppointmentId" IS NULL
    AND f.status NOT IN ('CANCELLED', 'CLOSED_EARLY')
  ORDER BY f."dueDate", f."sessionNumber"
  `,
  [centerId],
);

console.log(`  Sessions 2..N without linked appointment: ${futureRows.length}`);

// ─── Build repair list ────────────────────────────────────────────────────────
const repairs = [];

// Session 1 repairs
for (const row of session1Rows) {
  const targetStatus = apptStatusToFollowUp(row.appointmentStatus, row.dueDate);
  if (!targetStatus) continue;

  const targetNextApptId =
    row.appointmentStatus === "CANCELLED" ? null : row.appointmentId;

  const statusChanged = row.currentStatus !== targetStatus;
  const linkChanged =
    targetNextApptId === null
      ? row.nextAppointmentId !== null
      : row.nextAppointmentId !== row.appointmentId;

  if (statusChanged || linkChanged) {
    repairs.push({
      followUpId: row.followUpId,
      sessionNumber: row.sessionNumber,
      dueDate: row.dueDate,
      currentStatus: row.currentStatus,
      targetStatus,
      currentNextApptId: row.nextAppointmentId ?? null,
      targetNextApptId,
      appointmentStatus: row.appointmentStatus,
      reason: "session1-sync-with-appointment",
    });
  }
}

// Sessions 2..N repairs — reset status AND planStatus.
// A session that was incorrectly COMPLETED (no appointment link) also needs planStatus=ACTIVE
// so it becomes actionable again in the UI.
for (const row of futureRows) {
  const targetStatus = statusForDueDate(row.dueDate);
  const targetPlanStatus = "ACTIVE";
  const statusChanged = row.currentStatus !== targetStatus;
  const planStatusChanged = row.planStatus !== targetPlanStatus;
  if (statusChanged || planStatusChanged) {
    repairs.push({
      followUpId: row.followUpId,
      sessionNumber: row.sessionNumber,
      dueDate: row.dueDate,
      currentStatus: row.currentStatus,
      targetStatus,
      currentPlanStatus: row.planStatus,
      targetPlanStatus,
      currentNextApptId: null,
      targetNextApptId: null,
      appointmentStatus: "—",
      reason: statusChanged && planStatusChanged
        ? "reset-status+planStatus"
        : statusChanged
        ? "reset-status"
        : "reset-planStatus",
    });
  }
}

console.log(`\n  Total rows already correct (no change needed): ${(session1Rows.length + futureRows.length) - repairs.length}`);
console.log(`  Total rows needing repair                    : ${repairs.length}`);

if (repairs.length === 0) {
  console.log("\n  All sessions are already correct. Nothing to repair.");
  await client.end();
  process.exit(0);
}

// ─── Print diff table ─────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(120));
console.log(
  `  ${"FollowUp ID".padEnd(38)} ${"Sess".padEnd(5)} ${"DueDate".padEnd(12)} ${"ApptStatus".padEnd(14)} ${"CurrentFU".padEnd(14)} ${"TargetFU".padEnd(12)} Reason`
);
console.log("─".repeat(120));

for (const r of repairs) {
  console.log(
    `  ${r.followUpId.padEnd(38)} ${String(r.sessionNumber).padEnd(5)} ${String(r.dueDate).padEnd(12)} ${r.appointmentStatus.padEnd(14)} ${r.currentStatus.padEnd(14)} ${r.targetStatus.padEnd(12)} ${r.reason}`
  );
}
console.log("─".repeat(120));

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
       SET    status              = $1,
              "nextAppointmentId" = $2,
              "planStatus"        = COALESCE($3, "planStatus"),
              "updatedAt"         = now()
       WHERE  id = $4`,
      [r.targetStatus, r.targetNextApptId, r.targetPlanStatus ?? null, r.followUpId],
    );
    const planNote = r.targetPlanStatus ? `  planStatus→${r.targetPlanStatus}` : "";
    console.log(
      `  ✓ sess ${String(r.sessionNumber).padEnd(3)}  ${r.currentStatus.padEnd(14)} → ${r.targetStatus.padEnd(12)}${planNote}  [${r.followUpId}]  (${r.reason})`
    );
    applied++;
  }

  await client.query("COMMIT");

  console.log(`\n  ✓ Repaired ${applied} follow-up session(s).`);
  console.log(`\n  Verify in browser /tenant/follow-ups:`);
  console.log(`    - Appointment مؤكدة/مجدولة  → session 1 shows محجوزة`);
  console.log(`    - Session 1 shows "عرض الموعد / تعديل الموعد", not "حجز جلسة"`);
  console.log(`    - Sessions 2..N show "حجز جلسة" when not linked`);
  console.log(`    - Completed filter does NOT show session 1 when appointment is مؤكدة`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`\nERROR: Transaction rolled back — no data modified.\nReason: ${err.message || String(err)}\n`);
  await client.end();
  process.exit(1);
}

await client.end();
