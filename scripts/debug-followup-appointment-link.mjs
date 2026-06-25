/**
 * debug-followup-appointment-link.mjs
 *
 * Diagnostic script — read-only, writes nothing.
 *
 * Shows the exact DB state for follow-up sessions and their linked appointments,
 * then computes what the frontend would render (sessionVisualState, canBookSession)
 * so you can see whether the bug is in the DB or in the UI layer.
 *
 * Usage:
 *   # All sessions for center (latest 20 appointments):
 *   node scripts/debug-followup-appointment-link.mjs --centerSlug=laser-care
 *
 *   # Specific appointment:
 *   node scripts/debug-followup-appointment-link.mjs --centerSlug=laser-care --appointmentId=<id>
 *
 *   # All appointments (no limit):
 *   node scripts/debug-followup-appointment-link.mjs --centerSlug=laser-care --all
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
const appointmentIdArg = args.find((a) => a.startsWith("--appointmentId="))?.split("=")[1]?.trim();
const showAll = args.includes("--all");

if (!centerSlugArg) {
  console.error("Usage:");
  console.error("  node scripts/debug-followup-appointment-link.mjs --centerSlug=<slug>");
  console.error("  node scripts/debug-followup-appointment-link.mjs --centerSlug=<slug> --appointmentId=<id>");
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
  console.error("ERROR: DATABASE_URL not found.");
  process.exit(1);
}

const { Client, types } = require(
  path.join(__dirname, "..", "packages", "database", "node_modules", "pg"),
);
types.setTypeParser(1082, (v) => v); // date → "YYYY-MM-DD"
types.setTypeParser(1114, (v) => v); // timestamp → raw string

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// ─── Resolve center ────────────────────────────────────────────────────────────
const { rows: [center] } = await client.query(
  `SELECT id, name, slug FROM "Center" WHERE slug = $1`,
  [centerSlugArg],
);
if (!center) {
  console.error(`ERROR: Center "${centerSlugArg}" not found.`);
  await client.end();
  process.exit(1);
}
const centerId = center.id;

const WIDE = "═".repeat(100);
const THIN = "─".repeat(100);

console.log("\n" + WIDE);
console.log(`  DIAGNOSTIC: follow-up ↔ appointment links`);
console.log(WIDE);
console.log(`  Center: ${center.name} (${center.slug})  [${centerId}]`);
console.log(`  Mode  : READ-ONLY — no data is modified`);
console.log(WIDE);

// ─── Frontend logic replicated in JS ──────────────────────────────────────────
// Mirrors TenantFollowUpsPage.tsx exactly so we can show predicted UI state.

function statusForDueDate(dueDateStr) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(`${dueDateStr}T00:00:00.000Z`);
  return due.getTime() <= today.getTime() ? "DUE" : "UPCOMING";
}

// getLinkedAppointment: item.linkedAppointment ?? item.nextAppointment ?? null
// In DB terms: the appointment joined via nextAppointmentId
function computeSessionVisualState(item, linkedAppt) {
  const appointmentStatus = linkedAppt?.status ?? null;

  // getLinkedAppointmentId: linkedAppointmentId ?? linkedAppt.id ?? nextAppointmentId ?? ...
  // ?? (sessionNumber===1 && !isRecurring && appointmentId)
  const linkedAppointmentId =
    item.nextAppointmentId ??
    linkedAppt?.id ??
    (item.sessionNumber === 1 && !item.isRecurring && item.appointmentId
      ? item.appointmentId
      : null);

  // Terminal states first — THIS IS THE KEY ORDER
  if (appointmentStatus === "COMPLETED" || item.status === "COMPLETED") return "COMPLETED";
  if (appointmentStatus === "CANCELLED" || item.status === "CANCELLED") return "CANCELLED";
  if (item.status === "CLOSED_EARLY") return "CLOSED_EARLY";

  // Active linked appointment or any link id → BOOKED
  if (appointmentStatus === "SCHEDULED" || appointmentStatus === "CONFIRMED" || linkedAppointmentId) return "BOOKED";

  if (item.status === "MISSED") return "MISSED";
  return "UNBOOKED";
}

function computeCanBookSession(item, linkedAppt) {
  const isSessionOneOfPlan = item.sessionNumber === 1 && !item.isRecurring;
  const hasSourceAppointment =
    Boolean(item.appointmentId) && item.sessionNumber === 1 && !item.isRecurring;
  const linkedAppointmentId =
    item.nextAppointmentId ??
    linkedAppt?.id ??
    (item.sessionNumber === 1 && !item.isRecurring && item.appointmentId
      ? item.appointmentId
      : null);

  return (
    !isSessionOneOfPlan &&
    !hasSourceAppointment &&
    !linkedAppointmentId &&
    !linkedAppt &&
    !["BOOKED", "COMPLETED", "CLOSED_EARLY", "CANCELLED"].includes(item.status) &&
    item.planStatus !== "CLOSED_EARLY"
  );
}

// What syncFollowUpSessionWithAppointmentStatus would set for this session
// given the appointment's CURRENT status in DB.
function computeSyncTarget(item, linkedAppt) {
  const apptStatus = linkedAppt?.status;
  if (!apptStatus) return null;

  if (item.status === "CANCELLED" || item.status === "CLOSED_EARLY") {
    return { would: "SKIP", reason: `session.status=${item.status} is protected` };
  }

  let targetStatus;
  let targetLink;
  switch (apptStatus) {
    case "SCHEDULED":
    case "CONFIRMED":
      targetStatus = "BOOKED";
      targetLink = linkedAppt.id;
      break;
    case "COMPLETED":
      targetStatus = "COMPLETED";
      targetLink = linkedAppt.id;
      break;
    case "NO_SHOW":
      targetStatus = "MISSED";
      targetLink = linkedAppt.id;
      break;
    case "CANCELLED":
      targetStatus = statusForDueDate(item.dueDate);
      targetLink = null;
      break;
    default:
      return { would: "SKIP", reason: `unknown appt status: ${apptStatus}` };
  }

  const statusSame = item.status === targetStatus;
  const linkSame =
    targetLink === null
      ? item.nextAppointmentId === null
      : item.nextAppointmentId === targetLink;

  if (statusSame && linkSame) {
    return { would: "NO_CHANGE", targetStatus, targetLink };
  }
  return {
    would: "UPDATE",
    currentStatus: item.status,
    targetStatus,
    currentLink: item.nextAppointmentId,
    targetLink,
  };
}

// ─── Find appointments to diagnose ────────────────────────────────────────────
let appointmentRows;
if (appointmentIdArg) {
  const { rows } = await client.query(
    `SELECT * FROM "Appointment" WHERE "centerId" = $1 AND id = $2`,
    [centerId, appointmentIdArg],
  );
  appointmentRows = rows;
  if (appointmentRows.length === 0) {
    console.error(`\nERROR: Appointment ${appointmentIdArg} not found in center ${centerSlugArg}.`);
    await client.end();
    process.exit(1);
  }
} else {
  // Show the most recent appointments that have follow-up plans
  const limit = showAll ? 1000 : 20;
  const { rows } = await client.query(
    `
    SELECT DISTINCT a.*
    FROM "Appointment" a
    INNER JOIN "PatientFollowUp" f ON (
      f."nextAppointmentId" = a.id
      OR (f."appointmentId" = a.id AND f."sessionNumber" = 1 AND f."isRecurring" = false)
    )
    WHERE a."centerId" = $1
    ORDER BY a."appointmentDate" DESC
    LIMIT $2
    `,
    [centerId, limit],
  );
  appointmentRows = rows;
}

console.log(`\n  Appointments with linked follow-up sessions: ${appointmentRows.length}`);
if (appointmentRows.length === 0) {
  console.log("  No appointments found with follow-up sessions.");
  await client.end();
  process.exit(0);
}

// ─── For each appointment: show follow-up rows and computed states ─────────────
for (const appt of appointmentRows) {
  console.log("\n" + WIDE);
  console.log(`  APPOINTMENT`);
  console.log(THIN);
  console.log(`  id              : ${appt.id}`);
  console.log(`  status          : ${appt.status}`);
  console.log(`  patientId       : ${appt.patientId}`);
  console.log(`  serviceId       : ${appt.serviceId ?? "(none)"}`);
  console.log(`  appointmentDate : ${appt.appointmentDate}`);
  console.log(`  completedAt     : ${appt.completedAt ?? "(null)"}`);
  console.log(`  cancelledAt     : ${appt.cancelledAt ?? "(null)"}`);
  console.log(`  customServiceName: ${appt.customServiceName ?? "(null)"}`);

  // All columns in the appointment row (raw dump for any surprise fields)
  const apptFields = Object.keys(appt).filter(
    (k) => !["id","status","patientId","serviceId","appointmentDate","completedAt","cancelledAt","customServiceName","centerId"].includes(k)
  );
  if (apptFields.length > 0) {
    console.log(`  other fields:`);
    for (const k of apptFields) {
      if (appt[k] !== null && appt[k] !== undefined && appt[k] !== false) {
        console.log(`    ${k.padEnd(22)}: ${String(appt[k]).slice(0, 80)}`);
      }
    }
  }

  // Find ALL follow-up rows linked to this appointment
  // Linked = nextAppointmentId = appt.id  OR  (sessionNumber=1, appointmentId=appt.id)
  const { rows: fuRows } = await client.query(
    `
    SELECT f.*
    FROM "PatientFollowUp" f
    WHERE f."centerId" = $1
      AND (
        f."nextAppointmentId" = $2
        OR (f."appointmentId" = $2 AND f."sessionNumber" = 1 AND f."isRecurring" = false)
      )
    ORDER BY f."sessionNumber", f."dueDate"
    `,
    [centerId, appt.id],
  );

  // Also fetch ALL plan siblings so we can show the full picture
  // (other sessions in the same plan that are NOT directly linked to this appointment)
  const siblingIds = [...new Set(fuRows.map((r) => r.appointmentId).filter(Boolean))];
  let siblingRows = [];
  if (siblingIds.length > 0) {
    const { rows } = await client.query(
      `
      SELECT f.*
      FROM "PatientFollowUp" f
      WHERE f."centerId" = $1
        AND f."appointmentId" = ANY($2::text[])
        AND f."isRecurring" = false
        AND f.id NOT IN (${fuRows.map((_, i) => `$${i + 3}`).join(",") || "'__none__'"})
      ORDER BY f."sessionNumber"
      `,
      [centerId, siblingIds, ...fuRows.map((r) => r.id)],
    );
    siblingRows = rows;
  }

  if (fuRows.length === 0) {
    console.log(`\n  ⚠  No directly linked follow-up rows found for this appointment.`);
    console.log(`     (Phase 1: no row with nextAppointmentId = ${appt.id})`);
    console.log(`     (Phase 2: no row with appointmentId = ${appt.id} + sessionNumber=1)`);
    continue;
  }

  console.log(`\n  FOLLOW-UP ROWS LINKED TO THIS APPOINTMENT  (${fuRows.length})`);
  console.log(THIN);

  for (const fu of fuRows) {
    // Determine the "linked appointment" from the DB perspective
    // nextAppointmentId join: is the appointment we already have
    const linkedAppt = fu.nextAppointmentId === appt.id ? appt : null;
    // (If nextAppointmentId points to a DIFFERENT appointment, fetch it)
    let resolvedLinkedAppt = linkedAppt;
    if (fu.nextAppointmentId && fu.nextAppointmentId !== appt.id) {
      const { rows: [other] } = await client.query(
        `SELECT id, status, appointmentDate FROM "Appointment" WHERE id = $1`,
        [fu.nextAppointmentId],
      );
      resolvedLinkedAppt = other ?? null;
    }

    const visualState = computeSessionVisualState(fu, resolvedLinkedAppt);
    const canBook = computeCanBookSession(fu, resolvedLinkedAppt);
    const syncTarget = computeSyncTarget(fu, resolvedLinkedAppt);

    console.log(`\n  ── Session ${fu.sessionNumber}  [${fu.id}]`);
    console.log(`     DB fields:`);
    console.log(`       status               : ${fu.status}`);
    console.log(`       planStatus           : ${fu.planStatus}`);
    console.log(`       dueDate              : ${fu.dueDate}`);
    console.log(`       appointmentId        : ${fu.appointmentId ?? "(null)"}  ← plan-origin marker`);
    console.log(`       nextAppointmentId    : ${fu.nextAppointmentId ?? "(null)"}  ← booking link`);
    console.log(`       isRecurring          : ${fu.isRecurring}`);
    console.log(`       sessionNumber        : ${fu.sessionNumber}`);
    console.log(`       planTotalSessions    : ${fu.planTotalSessions ?? "(null)"}`);
    console.log(`       createdAt            : ${fu.createdAt}`);
    console.log(`       updatedAt            : ${fu.updatedAt}`);

    // Any unexpected / extra fields
    const knownFields = new Set([
      "id","centerId","patientId","serviceId","appointmentId","sourceType","title","notes",
      "sessionNumber","dueDate","isRecurring","recurringIntervalValue","recurringIntervalUnit",
      "nextRecurringAt","originFollowUpId","status","planStatus","closedEarlyReason","closedEarlyAt",
      "closedEarlyByUserId","closedEarlyAfterSession","treatmentTemplateId","treatmentTemplateNameAr",
      "treatmentTemplateNameEn","treatmentTemplateNameHe","planTotalSessions","planDefaultIntervalDays",
      "planPhases","lastContactedAt","nextAppointmentId","createdAt","updatedAt",
    ]);
    const extraFields = Object.keys(fu).filter((k) => !knownFields.has(k));
    if (extraFields.length > 0) {
      console.log(`       extra fields: ${extraFields.map((k) => `${k}=${fu[k]}`).join(", ")}`);
    }

    console.log(`\n     API response (what frontend receives):`);
    console.log(`       item.status            : "${fu.status}"`);
    console.log(`       item.nextAppointmentId : ${fu.nextAppointmentId ?? "null"}`);
    if (resolvedLinkedAppt) {
      console.log(`       nextAppointment.id     : ${resolvedLinkedAppt.id}`);
      console.log(`       nextAppointment.status : "${resolvedLinkedAppt.status}"  ← THIS is appointmentStatus in frontend`);
      console.log(`       linkedAppointment      : same as nextAppointment (from API serializer)`);
    } else {
      console.log(`       nextAppointment        : null  ← no appointment loaded via nextAppointmentId`);
      console.log(`       linkedAppointment      : null`);
    }

    console.log(`\n     Frontend computed state:`);
    console.log(`       sessionVisualState  : "${visualState}"`);
    console.log(`       canBookSession      : ${canBook}`);

    // Show which branch of sessionVisualState fired
    const apptStatus = resolvedLinkedAppt?.status ?? null;
    const apptFired = apptStatus === "COMPLETED" ? "appointmentStatus=COMPLETED" :
                      fu.status === "COMPLETED"   ? "item.status=COMPLETED (DB stale?)" :
                      apptStatus === "CANCELLED"  ? "appointmentStatus=CANCELLED" :
                      fu.status === "CANCELLED"   ? "item.status=CANCELLED" :
                      fu.status === "CLOSED_EARLY"? "item.status=CLOSED_EARLY" :
                      apptStatus === "SCHEDULED"  ? "appointmentStatus=SCHEDULED" :
                      apptStatus === "CONFIRMED"  ? "appointmentStatus=CONFIRMED" :
                      fu.nextAppointmentId        ? "linkedAppointmentId exists (fallback BOOKED)" :
                      (fu.sessionNumber === 1 && !fu.isRecurring && fu.appointmentId) ? "session1+appointmentId fallback BOOKED" :
                      fu.status === "MISSED"      ? "item.status=MISSED" :
                      "fallback UNBOOKED";
    console.log(`       fired branch        : ${apptFired}`);

    // DIAGNOSTIC ALERT
    if (apptStatus && apptStatus !== "COMPLETED" && fu.status === "COMPLETED") {
      console.log(`\n  ⚠  INCONSISTENCY DETECTED:`);
      console.log(`     appointment.status = "${apptStatus}" but follow-up.status = "COMPLETED"`);
      console.log(`     The frontend shows COMPLETED because item.status=COMPLETED fires first.`);
      console.log(`     syncFollowUpSessionWithAppointmentStatus should set follow-up to "${
        apptStatus === "SCHEDULED" || apptStatus === "CONFIRMED" ? "BOOKED" :
        apptStatus === "NO_SHOW" ? "MISSED" :
        statusForDueDate(fu.dueDate)
      }" — but it has NOT run yet (or failed silently).`);
    }
    if (!apptStatus && fu.status === "COMPLETED" && !fu.nextAppointmentId) {
      console.log(`\n  ⚠  ORPHANED COMPLETED SESSION:`);
      console.log(`     follow-up.status = "COMPLETED" but nextAppointmentId = null`);
      console.log(`     No appointment loaded → appointmentStatus = undefined`);
      console.log(`     Frontend shows COMPLETED because item.status=COMPLETED fires first.`);
    }

    console.log(`\n     Sync function prediction (if called now):`);
    if (!syncTarget) {
      console.log(`       No linked appointment with known status — sync would do nothing.`);
    } else {
      console.log(`       → ${syncTarget.would}`);
      if (syncTarget.would === "UPDATE") {
        console.log(`          status: "${syncTarget.currentStatus}" → "${syncTarget.targetStatus}"`);
        console.log(`          nextAppointmentId: ${syncTarget.currentLink ?? "null"} → ${syncTarget.targetLink ?? "null"}`);
      } else if (syncTarget.would === "NO_CHANGE") {
        console.log(`          already correct: status="${syncTarget.targetStatus}" nextAppointmentId=${syncTarget.targetLink ?? "null"}`);
      } else {
        console.log(`          ${syncTarget.reason}`);
      }
    }
  }

  // Show plan siblings (other sessions not directly linked)
  if (siblingRows.length > 0) {
    console.log(`\n  PLAN SIBLING SESSIONS (same appointmentId, not linked to THIS appointment)`);
    console.log(THIN);
    for (const sib of siblingRows) {
      // Load linked appointment for sibling if it has nextAppointmentId
      let sibLinkedAppt = null;
      if (sib.nextAppointmentId) {
        const { rows: [a] } = await client.query(
          `SELECT id, status, appointmentDate FROM "Appointment" WHERE id = $1`,
          [sib.nextAppointmentId],
        );
        sibLinkedAppt = a ?? null;
      }
      const sibVisual = computeSessionVisualState(sib, sibLinkedAppt);
      const sibCanBook = computeCanBookSession(sib, sibLinkedAppt);
      console.log(
        `  Session ${String(sib.sessionNumber).padEnd(3)}  status=${sib.status.padEnd(12)}  planStatus=${sib.planStatus.padEnd(10)}  dueDate=${sib.dueDate}  nextApptId=${sib.nextAppointmentId ?? "null"}  visual=${sibVisual}  canBook=${sibCanBook}`
      );
    }
  }
}

console.log("\n" + WIDE);
console.log("  SUMMARY");
console.log(WIDE);
console.log("  Look for ⚠ INCONSISTENCY DETECTED or ⚠ ORPHANED COMPLETED SESSION above.");
console.log("  If inconsistency found:");
console.log("    → If sync prediction says UPDATE: the server did not run syncFollowUpSessionWithAppointmentStatus.");
console.log("      Check that the API server was restarted with the latest code.");
console.log("      Then run: node scripts/repair-followup-status-from-appointments.mjs --centerSlug=laser-care --apply");
console.log("    → If sync prediction says NO_CHANGE: the DB is correct but the frontend");
console.log("      logic in sessionVisualState is showing stale state from item.status.");
console.log("      The fix is in TenantFollowUpsPage.tsx sessionVisualState: appointment");
console.log("      status must take priority over item.status when a linked appointment exists.");
console.log(WIDE + "\n");

await client.end();
