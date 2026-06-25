/**
 * repair-follow-up-session-one-date.mjs
 *
 * Repairs follow-up session due dates for a specific appointment, applying the
 * corrected session-1-anchoring rule:
 *
 *   Session 1 dueDate = appointment date        (the visit itself)
 *   Session 2 dueDate = appointment date + interval(2)
 *   Session 3 dueDate = appointment date + interval(2) + interval(3)
 *   ...
 *
 * This repair is needed for appointments created BEFORE the session-1 fix was
 * applied to createPlanFromAppointment. New plans created after the fix are
 * already correct and do not need this script.
 *
 * Data source priority (never uses service fallback when template is present):
 *   1. appointment.treatmentTemplatePhases  (if treatmentTemplateId is set)
 *   2. planPhases from the first follow-up row (plan snapshot)
 *   3. planDefaultIntervalDays as flat fallback
 *
 * Usage:
 *   node scripts/repair-follow-up-session-one-date.mjs --appointmentId=<uuid>
 *   node scripts/repair-follow-up-session-one-date.mjs --appointmentId=<uuid> --apply
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
const appointmentIdArg = args.find(a => a.startsWith("--appointmentId="))?.split("=")[1]?.trim();
const apply = args.includes("--apply");

if (!appointmentIdArg) {
  console.error("Usage:");
  console.error("  node scripts/repair-follow-up-session-one-date.mjs --appointmentId=<uuid>");
  console.error("  node scripts/repair-follow-up-session-one-date.mjs --appointmentId=<uuid> --apply");
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
// Return PostgreSQL `date` columns as raw "YYYY-MM-DD" strings instead of local-midnight
// Date objects. pg-types@2 creates new Date(year, month, day) for OID 1082, which shifts
// the calendar date on UTC+ servers when UTC extraction methods are used.
types.setTypeParser(1082, val => val);
const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateOnly(value) {
  const d = new Date(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dateOnly(d);
}

function parsePhaseRules(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(r => {
      if (!r || typeof r !== "object") return null;
      // The DB stores phases with fromSessionNumber / toSessionNumber / intervalDays.
      const from = Number(r.fromSessionNumber ?? 0);
      const to   = Number(r.toSessionNumber   ?? 0);
      const days = Number(r.intervalDays       ?? 0);
      if (!Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(days)) return null;
      if (from <= 0 || to < from || days <= 0) return null;
      return { from, to, days };
    })
    .filter(Boolean);
}

function resolveInterval(rules, defaultIntervalDays, sessionNumber) {
  if (rules.length > 0) {
    const rule = rules.find(r => sessionNumber >= r.from && sessionNumber <= r.to);
    if (rule) return rule.days;
  }
  return typeof defaultIntervalDays === "number" ? defaultIntervalDays : null;
}

// Statuses whose status field is recalculated when their date changes.
// Completed / booked / contacted / cancelled / closed statuses are preserved.
const RECALC_STATUSES = new Set(["UPCOMING", "DUE", "MISSED"]);

function statusForDate(dueDateStr) {
  const today = dateOnly(new Date());
  return dueDateStr <= today ? "DUE" : "UPCOMING";
}

// ─── Fetch appointment ─────────────────────────────────────────────────────────
const { rows: [appt] } = await client.query(`
  SELECT
    a.id,
    a."appointmentDate",
    a."treatmentTemplateId",
    a."treatmentTemplateTotalSessions",
    a."treatmentTemplateDefaultIntervalDays",
    a."treatmentTemplatePhases"
  FROM "Appointment" a
  WHERE a.id = $1
`, [appointmentIdArg]);

if (!appt) {
  console.error(`\nERROR: Appointment ${appointmentIdArg} not found.`);
  await client.end();
  process.exit(1);
}

const appointmentDateStr = dateOnly(appt.appointmentDate);

console.log("\n" + "═".repeat(80));
console.log(`  repair-follow-up-session-one-date`);
console.log("═".repeat(80));
console.log(`  Appointment : ${appt.id}`);
console.log(`  Date        : ${appointmentDateStr}`);
console.log(`  Template ID : ${appt.treatmentTemplateId ?? "(none — using plan snapshot)"}`);
console.log(`  Mode        : ${apply ? "APPLY (will write to DB)" : "DRY RUN (read-only)"}`);

// ─── Fetch follow-up rows ─────────────────────────────────────────────────────
const { rows: followUps } = await client.query(`
  SELECT
    id,
    "sessionNumber",
    status,
    "dueDate",
    "planTotalSessions",
    "planDefaultIntervalDays",
    "planPhases"
  FROM "PatientFollowUp"
  WHERE "appointmentId" = $1
    AND "isRecurring" = false
    AND "sessionNumber" IS NOT NULL
  ORDER BY "sessionNumber" ASC
`, [appointmentIdArg]);

if (followUps.length === 0) {
  console.log("\n  No finite-plan follow-up rows found for this appointment. Nothing to repair.");
  await client.end();
  process.exit(0);
}

console.log(`\n  Follow-up rows found: ${followUps.length}`);

// ─── Resolve phase rules ───────────────────────────────────────────────────────
const hasTemplate = appt.treatmentTemplateId !== null;
const firstRow = followUps[0];

let rules;
let defaultIntervalDays;
let rulesSource;

if (hasTemplate) {
  rules = parsePhaseRules(appt.treatmentTemplatePhases);
  defaultIntervalDays = typeof appt.treatmentTemplateDefaultIntervalDays === "number"
    ? appt.treatmentTemplateDefaultIntervalDays
    : null;
  rulesSource = "appointment.treatmentTemplatePhases (snapshot)";
} else {
  rules = parsePhaseRules(firstRow.planPhases);
  defaultIntervalDays = typeof firstRow.planDefaultIntervalDays === "number"
    ? firstRow.planDefaultIntervalDays
    : null;
  rulesSource = "planPhases from first follow-up row";
}

console.log(`\n  Rules source         : ${rulesSource}`);
console.log(`  Parsed phase rules   : ${rules.length > 0 ? JSON.stringify(rules) : "(none)"}`);
console.log(`  Default interval days: ${defaultIntervalDays ?? "(none)"}`);

if (rules.length === 0 && defaultIntervalDays === null) {
  console.error("\n  ERROR: No phase rules and no default interval. Cannot compute dates. Aborting.");
  await client.end();
  process.exit(1);
}

// ─── Compute new dates ─────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(80));
console.log(`  ${"Sess".padEnd(6)} ${"Old Date".padEnd(14)} ${"New Date".padEnd(14)} ${"Old Status".padEnd(16)} New Status`);
console.log("─".repeat(80));

const updates = [];
let runningDate = appointmentDateStr;

for (const row of followUps) {
  const session = row.sessionNumber;

  if (session === 1) {
    // Session 1 IS the appointment — no interval added.
    runningDate = appointmentDateStr;
  } else {
    const interval = resolveInterval(rules, defaultIntervalDays, session);
    if (interval === null || interval <= 0) {
      console.log(`  Session ${session}: no interval resolved — skipping this row`);
      continue;
    }
    runningDate = addDays(runningDate, interval);
  }

  const oldDate   = dateOnly(row.dueDate);
  const newDate   = runningDate;
  const dateChanged = oldDate !== newDate;

  const oldStatus = row.status;
  let newStatus = oldStatus;
  if (dateChanged && RECALC_STATUSES.has(oldStatus)) {
    newStatus = statusForDate(newDate);
  }

  const statusChanged = oldStatus !== newStatus;
  const marker = (dateChanged || statusChanged) ? "◀ UPDATE" : "";

  console.log(
    `  ${String(session).padEnd(6)} ${oldDate.padEnd(14)} ${newDate.padEnd(14)} ${oldStatus.padEnd(16)} ${newStatus.padEnd(14)} ${marker}`
  );

  if (dateChanged || statusChanged) {
    updates.push({ id: row.id, session, oldDate, newDate, oldStatus, newStatus, dateChanged, statusChanged });
  }
}

console.log("─".repeat(80));
console.log(`\n  Rows to update: ${updates.length} of ${followUps.length}`);

if (updates.length === 0) {
  console.log("  All dates already match the corrected rule. Nothing to repair.");
  await client.end();
  process.exit(0);
}

if (!apply) {
  console.log("\n  [DRY RUN] Pass --apply to write the changes above to the database.");
  await client.end();
  process.exit(0);
}

// ─── Apply ─────────────────────────────────────────────────────────────────────
console.log("\n  [APPLYING] Writing to database...\n");

for (const u of updates) {
  await client.query(
    `UPDATE "PatientFollowUp" SET "dueDate" = $1, "status" = $2 WHERE id = $3`,
    [u.newDate, u.newStatus, u.id]
  );
  const datePart   = u.dateChanged   ? `date ${u.oldDate} → ${u.newDate}` : `date unchanged`;
  const statusPart = u.statusChanged ? `status ${u.oldStatus} → ${u.newStatus}` : `status unchanged`;
  console.log(`  Session ${String(u.session).padEnd(4)} : ${datePart}  |  ${statusPart}`);
}

console.log(`\n  ✓ Repaired ${updates.length} follow-up row(s).`);
console.log("\n  NOTE: Only rows linked to this appointment were updated.");
console.log("  NOTE: New plans created after the session-1 fix are already correct.");

await client.end();
