/**
 * repair-followup-status-from-appointments.mjs
 *
 * Repairs follow-up session statuses so they match the current status of their
 * linked appointments. This is the authoritative one-pass repair for any data
 * inconsistency between Appointment.status and PatientFollowUp.status.
 *
 * Mapping applied (mirrors syncFollowUpSessionWithAppointmentStatus):
 *   Appointment SCHEDULED / CONFIRMED  →  Follow-up BOOKED
 *   Appointment COMPLETED              →  Follow-up COMPLETED
 *   Appointment NO_SHOW                →  Follow-up MISSED
 *   Appointment CANCELLED              →  Follow-up DUE or UPCOMING (based on dueDate)
 *                                          + nextAppointmentId cleared
 *
 * Which sessions are checked:
 *   - Any PatientFollowUp where nextAppointmentId IS NOT NULL (explicit booking link).
 *   - Session 1 of a finite plan (sessionNumber=1, isRecurring=false, appointmentId IS NOT NULL)
 *     even if nextAppointmentId is null — the linked appointment is appointmentId in that case.
 *
 * What is skipped:
 *   - Sessions with status = CLOSED_EARLY or CANCELLED (explicit plan-level actions).
 *   - Sessions where follow-up status already matches the expected mapping (no change needed).
 *
 * Usage:
 *   node scripts/repair-followup-status-from-appointments.mjs --centerSlug=laser-care
 *   node scripts/repair-followup-status-from-appointments.mjs --centerSlug=laser-care --apply
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
  console.error("  node scripts/repair-followup-status-from-appointments.mjs --centerSlug=<slug>");
  console.error("  node scripts/repair-followup-status-from-appointments.mjs --centerSlug=<slug> --apply");
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

function expectedFollowUpStatus(appointmentStatus, dueDateStr) {
  switch (appointmentStatus) {
    case "SCHEDULED":
    case "CONFIRMED":
      return { status: "BOOKED", clearLink: false };
    case "COMPLETED":
      return { status: "COMPLETED", clearLink: false };
    case "NO_SHOW":
      return { status: "MISSED", clearLink: false };
    case "CANCELLED":
      return { status: statusForDueDate(dueDateStr), clearLink: true };
    default:
      return null;
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
console.log("  repair-followup-status-from-appointments");
console.log("═".repeat(80));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${centerId}`);
console.log(`  Mode    : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

// ─── Find all follow-up sessions with a linked appointment ────────────────────
//
// Two cases:
//   1. nextAppointmentId IS NOT NULL  →  linked appointment is nextAppointmentId
//   2. sessionNumber=1, isRecurring=false, appointmentId IS NOT NULL, nextAppointmentId IS NULL
//      →  linked appointment is appointmentId (session 1 of a plan without explicit link)
//
// We JOIN to Appointment to get its current status in a single query.
// CLOSED_EARLY and CANCELLED follow-up sessions are excluded — they represent
// explicit plan-level actions that should not be overridden.
//
const { rows: candidates } = await client.query(
  `
  SELECT
    f.id                      AS "followUpId",
    f."sessionNumber",
    f.status                  AS "followUpStatus",
    f."planStatus",
    f."dueDate",
    f."nextAppointmentId",
    f."appointmentId"         AS "planOriginAppointmentId",
    a.id                      AS "linkedApptId",
    a.status                  AS "appointmentStatus"
  FROM "PatientFollowUp" f
  JOIN "Appointment" a ON a.id = COALESCE(
    f."nextAppointmentId",
    CASE
      WHEN f."sessionNumber" = 1 AND f."isRecurring" = false
      THEN f."appointmentId"
      ELSE NULL
    END
  )
  WHERE f."centerId" = $1
    AND a."centerId" = $1
    AND f.status NOT IN ('CLOSED_EARLY', 'CANCELLED')
  ORDER BY f."sessionNumber", f."dueDate"
  `,
  [centerId],
);

console.log(`\n  Follow-up sessions with a linked appointment: ${candidates.length}`);

if (candidates.length === 0) {
  console.log("  Nothing to check. Exiting.");
  await client.end();
  process.exit(0);
}

// ─── Compute repairs ──────────────────────────────────────────────────────────
const repairs = [];

for (const row of candidates) {
  const expected = expectedFollowUpStatus(row.appointmentStatus, row.dueDate);
  if (!expected) continue; // unrecognized appointment status — skip

  const currentStatus = row.followUpStatus;
  const targetStatus = expected.status;
  const clearLink = expected.clearLink;

  // Determine what nextAppointmentId should be after repair
  const targetNextApptId = clearLink ? null : row.linkedApptId;

  // Current nextAppointmentId (from the follow-up row)
  const currentNextApptId = row.nextAppointmentId ?? null;

  const statusNeedsUpdate = currentStatus !== targetStatus;
  const linkNeedsUpdate = clearLink
    ? currentNextApptId !== null
    : currentNextApptId !== row.linkedApptId;

  if (statusNeedsUpdate || linkNeedsUpdate) {
    repairs.push({
      followUpId: row.followUpId,
      sessionNumber: row.sessionNumber,
      dueDate: row.dueDate,
      currentStatus,
      targetStatus,
      currentNextApptId,
      targetNextApptId,
      appointmentStatus: row.appointmentStatus,
      linkedApptId: row.linkedApptId,
      statusNeedsUpdate,
      linkNeedsUpdate,
    });
  }
}

console.log(`  Sessions already correct (no change needed): ${candidates.length - repairs.length}`);
console.log(`  Sessions needing repair:                     ${repairs.length}`);

if (repairs.length === 0) {
  console.log("\n  All sessions are already in sync with their appointments. Nothing to repair.");
  await client.end();
  process.exit(0);
}

// ─── Print diff table ─────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(120));
console.log(
  `  ${"FollowUp ID".padEnd(38)} ${"Sess".padEnd(5)} ${"DueDate".padEnd(12)} ${"ApptStatus".padEnd(14)} ${"CurrentFU".padEnd(14)} ${"TargetFU".padEnd(12)} Link`
);
console.log("─".repeat(120));

for (const r of repairs) {
  const linkChange = r.linkNeedsUpdate
    ? r.targetNextApptId === null
      ? "clear"
      : "set"
    : "-";
  console.log(
    `  ${r.followUpId.padEnd(38)} ${String(r.sessionNumber).padEnd(5)} ${String(r.dueDate).padEnd(12)} ${r.appointmentStatus.padEnd(14)} ${r.currentStatus.padEnd(14)} ${r.targetStatus.padEnd(12)} ${linkChange}`
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
              "updatedAt"         = now()
       WHERE  id = $3`,
      [r.targetStatus, r.targetNextApptId, r.followUpId],
    );
    console.log(
      `  ✓ session ${String(r.sessionNumber).padEnd(3)}  ${r.currentStatus.padEnd(14)} → ${r.targetStatus.padEnd(12)}  appt: ${r.appointmentStatus.padEnd(12)}  [${r.followUpId}]`
    );
    applied++;
  }

  await client.query("COMMIT");

  console.log(`\n  ✓ Repaired ${applied} follow-up session(s).`);
  console.log(`\n  Verify in browser /tenant/follow-ups:`);
  console.log(`    - Appointment مجدول  → session shows محجوزة`);
  console.log(`    - Appointment مكتمل  → session shows مكتملة`);
  console.log(`    - Appointment ملغي   → session shows قابلة للحجز (DUE/UPCOMING)`);
  console.log(`    - Sessions 2..N remain actionable (not cancelled)`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`\nERROR: Transaction rolled back — no data modified.\nReason: ${err.message || String(err)}\n`);
  await client.end();
  process.exit(1);
}

await client.end();
