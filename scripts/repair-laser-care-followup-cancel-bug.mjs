/**
 * repair-laser-care-followup-cancel-bug.mjs
 *
 * Repairs follow-up sessions that were incorrectly mass-cancelled when their
 * origin appointment was cancelled.
 *
 * Root cause: syncFollowUpSessionWithAppointmentStatus contained a updateMany
 * that cancelled ALL plan sessions whenever the origin appointment was cancelled.
 * This violated the business rule that appointment cancellation must only affect
 * the directly linked session, not the entire treatment plan.
 *
 * What this script fixes:
 *   - Plans where session 1 is COMPLETED (treatment happened) but sessions 2..N
 *     were incorrectly set to CANCELLED + planStatus=CANCELLED.
 *   - Restores sessions 2..N to DUE or UPCOMING based on their dueDate.
 *   - Restores planStatus to ACTIVE on all affected sessions (including session 1).
 *
 * What this script does NOT touch:
 *   - Session 1 status (stays COMPLETED as it should be).
 *   - nextAppointmentId (stays null — sessions remain rebookable).
 *   - Appointments, invoices, or any other tables.
 *   - Plans where ALL sessions are CANCELLED and session 1 is also CANCELLED
 *     (those may have been legitimately cancelled).
 *
 * Usage:
 *   node scripts/repair-laser-care-followup-cancel-bug.mjs --centerSlug=laser-care
 *   node scripts/repair-laser-care-followup-cancel-bug.mjs --centerSlug=laser-care --apply
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const centerSlugArg = args.find((a) => a.startsWith("--centerSlug="))?.split("=")[1]?.trim();
const apply = args.includes("--apply");

if (!centerSlugArg) {
  console.error("Usage:");
  console.error("  node scripts/repair-laser-care-followup-cancel-bug.mjs --centerSlug=<slug>");
  console.error("  node scripts/repair-laser-care-followup-cancel-bug.mjs --centerSlug=<slug> --apply");
  process.exit(1);
}

// ─── Load DATABASE_URL ─────────────────────────────────────────────────────────
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
  console.error("ERROR: DATABASE_URL not found. Set it as an env var or in packages/database/.env");
  process.exit(1);
}

const { Client, types } = require(
  path.join(__dirname, "..", "packages", "database", "node_modules", "pg"),
);
// Return PostgreSQL `date` columns as raw "YYYY-MM-DD" strings.
types.setTypeParser(1082, (val) => val);

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
console.log("  repair-laser-care-followup-cancel-bug");
console.log("═".repeat(80));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${centerId}`);
console.log(`  Mode    : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

// ─── Phase 1: find affected plan appointmentIds ────────────────────────────────
// A plan is "affected" when:
//   - session 1 is COMPLETED (treatment happened — correct state)
//   - at least one session with sessionNumber > 1 is CANCELLED + planStatus=CANCELLED
//     (incorrectly cancelled by the bug)
const { rows: affectedPlans } = await client.query(
  `
  SELECT DISTINCT f."appointmentId"
  FROM   "PatientFollowUp" f
  WHERE  f."centerId" = $1
    AND  f."isRecurring" = false
    AND  f."sessionNumber" > 1
    AND  f.status = 'CANCELLED'
    AND  f."planStatus" = 'CANCELLED'
    AND  EXISTS (
           SELECT 1
           FROM   "PatientFollowUp" s1
           WHERE  s1."centerId"       = f."centerId"
             AND  s1."appointmentId"  = f."appointmentId"
             AND  s1."isRecurring"    = false
             AND  s1."sessionNumber"  = 1
             AND  s1.status           = 'COMPLETED'
         )
  `,
  [centerId],
);

console.log(`\n  Affected plans (session 1 COMPLETED, sessions 2+N incorrectly CANCELLED): ${affectedPlans.length}`);

if (affectedPlans.length === 0) {
  console.log("  No affected plans found. Nothing to repair.");
  await client.end();
  process.exit(0);
}

const affectedApptIds = affectedPlans.map((r) => r.appointmentId);

// ─── Phase 2: fetch rows that need restoration ────────────────────────────────
// Rows to fix: sessions 2..N that are CANCELLED + planStatus=CANCELLED in affected plans.
// Also fetch session 1 to restore its planStatus (even if its status stays COMPLETED).
const { rows: rowsToFix } = await client.query(
  `
  SELECT
    id,
    "sessionNumber",
    status,
    "planStatus",
    "dueDate",
    "appointmentId",
    "nextAppointmentId"
  FROM "PatientFollowUp"
  WHERE "centerId"    = $1
    AND "isRecurring" = false
    AND "appointmentId" = ANY($2::text[])
    AND (
      -- sessions 2..N to restore fully
      ("sessionNumber" > 1 AND status = 'CANCELLED' AND "planStatus" = 'CANCELLED')
      OR
      -- session 1 planStatus fix (status stays COMPLETED, just planStatus needs updating)
      ("sessionNumber" = 1 AND status = 'COMPLETED' AND "planStatus" = 'CANCELLED')
    )
  ORDER BY "appointmentId", "sessionNumber"
  `,
  [centerId, affectedApptIds],
);

const session2plusRows = rowsToFix.filter((r) => r.sessionNumber > 1);
const session1PlanStatusRows = rowsToFix.filter((r) => r.sessionNumber === 1);

console.log(`\n  Rows to restore (sessions 2..N):               ${session2plusRows.length}`);
console.log(`  Session 1 planStatus to restore to ACTIVE:     ${session1PlanStatusRows.length}`);
console.log(`  Total rows to update:                          ${rowsToFix.length}`);

if (rowsToFix.length === 0) {
  console.log("\n  Nothing to update. Exiting.");
  await client.end();
  process.exit(0);
}

// ─── Phase 3: build repair plan ───────────────────────────────────────────────
const repairs = rowsToFix.map((row) => {
  if (row.sessionNumber > 1) {
    return {
      id: row.id,
      appointmentId: row.appointmentId,
      sessionNumber: row.sessionNumber,
      oldStatus: row.status,
      newStatus: statusForDueDate(row.dueDate),
      oldPlanStatus: row.planStatus,
      newPlanStatus: "ACTIVE",
      dueDate: row.dueDate,
      action: "restore-session",
    };
  } else {
    return {
      id: row.id,
      appointmentId: row.appointmentId,
      sessionNumber: row.sessionNumber,
      oldStatus: row.status,
      newStatus: row.status, // stays COMPLETED
      oldPlanStatus: row.planStatus,
      newPlanStatus: "ACTIVE",
      dueDate: row.dueDate,
      action: "fix-planStatus-only",
    };
  }
});

// ─── Phase 4: print diff table ────────────────────────────────────────────────
console.log("\n" + "─".repeat(110));
console.log(
  `  ${"FollowUp ID".padEnd(38)} ${"Sess".padEnd(5)} ${"DueDate".padEnd(12)} ${"OldStatus".padEnd(14)} ${"NewStatus".padEnd(12)} ${"OldPlan".padEnd(10)} ${"NewPlan".padEnd(8)} Action`
);
console.log("─".repeat(110));

for (const r of repairs) {
  console.log(
    `  ${r.id.padEnd(38)} ${String(r.sessionNumber).padEnd(5)} ${String(r.dueDate).padEnd(12)} ${r.oldStatus.padEnd(14)} ${r.newStatus.padEnd(12)} ${r.oldPlanStatus.padEnd(10)} ${r.newPlanStatus.padEnd(8)} ${r.action}`
  );
}
console.log("─".repeat(110));

if (!apply) {
  console.log("\n  [DRY RUN] Pass --apply to write the changes above to the database.");
  console.log("  Verify the list looks correct before applying.\n");
  await client.end();
  process.exit(0);
}

// ─── Phase 5: apply ───────────────────────────────────────────────────────────
console.log("\n  [APPLYING] Writing to database...\n");

await client.query("BEGIN");

try {
  let restoredCount = 0;
  let planStatusFixCount = 0;

  for (const r of repairs) {
    if (r.action === "restore-session") {
      await client.query(
        `UPDATE "PatientFollowUp"
         SET status = $1, "planStatus" = $2, "updatedAt" = now()
         WHERE id = $3`,
        [r.newStatus, r.newPlanStatus, r.id],
      );
      restoredCount++;
      console.log(`  ✓ session ${r.sessionNumber}  ${r.oldStatus} → ${r.newStatus}  planStatus → ${r.newPlanStatus}  [${r.id}]`);
    } else {
      await client.query(
        `UPDATE "PatientFollowUp"
         SET "planStatus" = $1, "updatedAt" = now()
         WHERE id = $2`,
        [r.newPlanStatus, r.id],
      );
      planStatusFixCount++;
      console.log(`  ✓ session ${r.sessionNumber}  status stays ${r.oldStatus}  planStatus ${r.oldPlanStatus} → ${r.newPlanStatus}  [${r.id}]`);
    }
  }

  await client.query("COMMIT");

  console.log(`\n  ✓ Restored ${restoredCount} session(s) to DUE/UPCOMING.`);
  console.log(`  ✓ Fixed planStatus on ${planStatusFixCount} session 1 row(s).`);
  console.log(`\n  Refresh /tenant/follow-ups to verify:`);
  console.log(`    - Session 1 remains مكتملة`);
  console.log(`    - Sessions 2..N are actionable (DUE or UPCOMING)`);
  console.log(`    - Session 2 shows "حجز جلسة" button`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`\nERROR: Transaction rolled back — no data modified.\nReason: ${err.message || String(err)}\n`);
  await client.end();
  process.exit(1);
}

await client.end();
