/**
 * final-followup-state-rebuild.mjs
 *
 * THE single, canonical repair script for finite treatment-plan follow-up state.
 * It replaces every earlier ad-hoc repair script. Run it once per center to bring
 * historical data in line with the session-based architecture, then never patch by
 * hand again — the runtime sync keeps state correct from here on.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * MODEL (must match patient-follow-ups.service.ts)
 *   • nextAppointmentId is the ONE universal link from a session to the appointment
 *     that fulfils it. Session 1's link is the plan's origin appointment.
 *   • appointmentId is provenance only (which appointment spawned the plan). It is
 *     NEVER used to derive status. It is only used here to (a) group a plan and
 *     (b) resolve session 1's origin appointment for link back-fill.
 *
 * STATUS DERIVATION (appointment status → session status)
 *   SCHEDULED | CONFIRMED → BOOKED      (link kept)
 *   COMPLETED             → COMPLETED   (link kept)
 *   NO_SHOW               → MISSED      (link cleared — re-bookable)
 *   CANCELLED             → DUE|UPCOMING by dueDate (link cleared — re-bookable)
 *
 * PER-SESSION RULES
 *   1. Session 1 link back-fill: if nextAppointmentId is null but the origin
 *      appointment (appointmentId) is SCHEDULED/CONFIRMED/COMPLETED, set
 *      nextAppointmentId = appointmentId so it links through the universal path.
 *   2. Session WITH a usable link (SCHEDULED/CONFIRMED/COMPLETED): derive status,
 *      keep link.
 *   3. Session WITH a NO_SHOW/CANCELLED link: derive status (MISSED / DUE-UPCOMING),
 *      CLEAR the link.
 *   4. Session WITHOUT a link: status = DUE/UPCOMING by dueDate, EXCEPT preserve
 *      genuinely meaningful stored states: COMPLETED, CONTACTED, MISSED.
 *
 * WHOLE-PLAN PROTECTIONS (a protected plan is skipped entirely, untouched)
 *   • Any session CLOSED_EARLY, or planStatus CLOSED_EARLY, or closedEarlyAt set
 *     → explicit user close-early. Never touched.
 *   • planStatus CANCELLED together with a real closedEarlyReason → explicit user
 *     cancellation. Never touched.
 *   (A bare status=CANCELLED with planStatus ACTIVE and no close-early markers is the
 *    historical mass-cancel corruption — that IS repaired.)
 *
 * Recurring follow-ups (isRecurring = true) are out of scope and never touched.
 *
 * Usage:
 *   node scripts/final-followup-state-rebuild.mjs --centerSlug=laser-care
 *   node scripts/final-followup-state-rebuild.mjs --centerSlug=laser-care --apply
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
  console.error("  node scripts/final-followup-state-rebuild.mjs --centerSlug=<slug>");
  console.error("  node scripts/final-followup-state-rebuild.mjs --centerSlug=<slug> --apply");
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
types.setTypeParser(1082, (v) => v); // date columns as "YYYY-MM-DD" strings

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusForDueDate(dueDateStr) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(`${dueDateStr}T00:00:00.000Z`);
  return due.getTime() <= today.getTime() ? "DUE" : "UPCOMING";
}

const FULFILLING = new Set(["SCHEDULED", "CONFIRMED", "COMPLETED"]);
const PRESERVE_WHEN_UNLINKED = new Set(["COMPLETED", "CONTACTED", "MISSED"]);

/**
 * Compute the target { status, nextAppointmentId } for one session.
 * `originStatus` is the appointmentId appointment's status (may be null).
 * `linkStatus`   is the nextAppointmentId appointment's status (may be null).
 */
function computeTarget(row) {
  const { sessionNumber, dueDate, status, appointmentId, nextAppointmentId, originStatus, linkStatus } = row;

  // ── Resolve the EFFECTIVE link for this session ─────────────────────────────
  // Start from the stored link.
  let linkId = nextAppointmentId;
  let linkAppStatus = linkStatus;

  // Session-1 back-fill: no stored link, but origin appointment fulfils it.
  if (!linkId && sessionNumber === 1 && appointmentId && FULFILLING.has(originStatus)) {
    linkId = appointmentId;
    linkAppStatus = originStatus;
  }

  // ── Session WITH an effective link ──────────────────────────────────────────
  if (linkId && linkAppStatus) {
    switch (linkAppStatus) {
      case "SCHEDULED":
      case "CONFIRMED":
        return { status: "BOOKED", nextAppointmentId: linkId };
      case "COMPLETED":
        return { status: "COMPLETED", nextAppointmentId: linkId };
      case "NO_SHOW":
        return { status: "MISSED", nextAppointmentId: null }; // detach → re-bookable
      case "CANCELLED":
        return { status: statusForDueDate(dueDate), nextAppointmentId: null }; // detach
      default:
        // Unknown linked status — fall through to unlinked handling.
        break;
    }
  }

  // ── Session WITHOUT a usable link ───────────────────────────────────────────
  // Preserve genuinely meaningful stored states; otherwise normalise by dueDate.
  if (PRESERVE_WHEN_UNLINKED.has(status)) {
    return { status, nextAppointmentId: null };
  }
  return { status: statusForDueDate(dueDate), nextAppointmentId: null };
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

console.log("\n" + "═".repeat(86));
console.log("  final-followup-state-rebuild");
console.log("═".repeat(86));
console.log(`  Center  : ${center.name} (${center.slug})`);
console.log(`  CenterId: ${centerId}`);
console.log(`  Mode    : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

// ─── Load every finite-plan session with its origin + linked appointment status ─
const { rows: sessions } = await client.query(
  `
  SELECT
    f.id                       AS "id",
    f."appointmentId",
    f."nextAppointmentId",
    f."sessionNumber",
    f.status                   AS "status",
    f."planStatus",
    f."closedEarlyReason",
    f."closedEarlyAt",
    f."dueDate",
    a_origin.status            AS "originStatus",
    a_link.status              AS "linkStatus"
  FROM "PatientFollowUp" f
  LEFT JOIN "Appointment" a_origin ON a_origin.id = f."appointmentId"  AND a_origin."centerId" = f."centerId"
  LEFT JOIN "Appointment" a_link   ON a_link.id   = f."nextAppointmentId" AND a_link."centerId" = f."centerId"
  WHERE f."centerId"    = $1
    AND f."isRecurring" = false
  ORDER BY f."appointmentId", f."sessionNumber"
  `,
  [centerId],
);

console.log(`\n  Finite-plan sessions loaded: ${sessions.length}`);

// ─── Group into plans by provenance appointmentId; apply whole-plan protections ─
const planGroups = new Map(); // appointmentId → rows[]
for (const s of sessions) {
  const key = s.appointmentId ?? `__orphan__${s.id}`;
  if (!planGroups.has(key)) planGroups.set(key, []);
  planGroups.get(key).push(s);
}

function planIsProtected(rows) {
  for (const r of rows) {
    if (r.status === "CLOSED_EARLY") return "session CLOSED_EARLY";
    if (r.planStatus === "CLOSED_EARLY") return "planStatus CLOSED_EARLY";
    if (r.closedEarlyAt) return "closedEarlyAt set";
    if (r.planStatus === "CANCELLED" && r.closedEarlyReason && r.closedEarlyReason.trim()) {
      return "explicit plan cancellation (reason present)";
    }
  }
  return null;
}

// ─── Build repair list ──────────────────────────────────────────────────────────
const repairs = [];
let protectedPlans = 0;
let protectedSessions = 0;

for (const [key, rows] of planGroups) {
  const protectedReason = planIsProtected(rows);
  if (protectedReason) {
    protectedPlans++;
    protectedSessions += rows.length;
    continue;
  }

  for (const row of rows) {
    const target = computeTarget(row);
    const statusChanged = row.status !== target.status;
    const linkChanged = (row.nextAppointmentId ?? null) !== (target.nextAppointmentId ?? null);
    const planStatusChanged = row.planStatus !== "ACTIVE";

    if (statusChanged || linkChanged || planStatusChanged) {
      repairs.push({
        id: row.id,
        sessionNumber: row.sessionNumber,
        dueDate: row.dueDate,
        fromStatus: row.status,
        toStatus: target.status,
        fromLink: row.nextAppointmentId ?? null,
        toLink: target.nextAppointmentId ?? null,
        fromPlanStatus: row.planStatus,
        originStatus: row.originStatus ?? "—",
        linkStatus: row.linkStatus ?? "—",
      });
    }
  }
}

console.log(`  Plans grouped              : ${planGroups.size}`);
console.log(`  Protected plans (skipped)  : ${protectedPlans} (${protectedSessions} sessions)`);
console.log(`  Sessions needing repair    : ${repairs.length}`);

if (repairs.length === 0) {
  console.log("\n  Nothing to repair — all finite-plan sessions already consistent.");
  await client.end();
  process.exit(0);
}

// ─── Before/after diff table ────────────────────────────────────────────────────
console.log("\n" + "─".repeat(140));
console.log(
  `  ${"FollowUp ID".padEnd(38)} ${"Sess".padEnd(5)} ${"DueDate".padEnd(12)} ${"Origin".padEnd(11)} ${"Link".padEnd(11)} ${"Status".padEnd(23)} ${"Link change"}`,
);
console.log("─".repeat(140));
for (const r of repairs) {
  const statusCol = `${r.fromStatus} → ${r.toStatus}`;
  const linkCol =
    r.fromLink === r.toLink
      ? "(unchanged)"
      : `${r.fromLink ? r.fromLink.slice(0, 8) : "null"} → ${r.toLink ? r.toLink.slice(0, 8) : "null"}`;
  console.log(
    `  ${r.id.padEnd(38)} ${String(r.sessionNumber).padEnd(5)} ${String(r.dueDate).padEnd(12)} ${String(r.originStatus).padEnd(11)} ${String(r.linkStatus).padEnd(11)} ${statusCol.padEnd(23)} ${linkCol}`,
  );
}
console.log("─".repeat(140));
console.log(`  Total sessions to repair: ${repairs.length}`);

if (!apply) {
  console.log("\n  [DRY RUN] Pass --apply to write the changes above to the database.");
  await client.end();
  process.exit(0);
}

// ─── Apply ──────────────────────────────────────────────────────────────────────
console.log("\n  [APPLYING] Writing to database...\n");
await client.query("BEGIN");
try {
  let applied = 0;
  for (const r of repairs) {
    await client.query(
      `UPDATE "PatientFollowUp"
       SET    status              = $1,
              "nextAppointmentId" = $2,
              "planStatus"        = 'ACTIVE',
              "updatedAt"         = now()
       WHERE  id = $3`,
      [r.toStatus, r.toLink, r.id],
    );
    // STEP 6 — read back the SAME row inside the txn and assert it persisted.
    const verify = await client.query(
      `SELECT status, "planStatus" FROM "PatientFollowUp" WHERE id = $1`,
      [r.id],
    );
    const actual = verify.rows[0];
    if (!actual || actual.status !== r.toStatus) {
      throw new Error(
        `WRITE FAILED  id=${r.id}  old=${r.fromStatus}  attempted=${r.toStatus}  persisted=${actual ? actual.status : "(row missing)"}`,
      );
    }
    console.log(
      `  ✓ sess ${String(r.sessionNumber).padEnd(2)}  ${r.fromStatus.padEnd(10)} → attempted ${r.toStatus.padEnd(9)} → persisted ${actual.status.padEnd(9)}  [${r.id}]`,
    );
    applied++;
  }
  await client.query("COMMIT");
  console.log(`  ✓ Rebuilt ${applied} finite-plan session(s).`);
  console.log(`\n  Verify in browser /tenant/follow-ups:`);
  console.log(`    - Session 1 reflects its origin appointment (BOOKED / COMPLETED / re-bookable).`);
  console.log(`    - Sessions 2..N restored to DUE/UPCOMING unless booked/completed.`);
  console.log(`    - Changing one appointment's status touches exactly one session.`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`\nERROR: Transaction rolled back — no data modified.\nReason: ${err.message || String(err)}\n`);
  await client.end();
  process.exit(1);
}

await client.end();
