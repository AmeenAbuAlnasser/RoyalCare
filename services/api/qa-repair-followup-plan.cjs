/**
 * QA repair — idempotent.
 * For any appointment whose service has totalRecommendedSessions >= 2 and
 * followUpEnabled=true but only has ONE follow-up (the old chain-style record),
 * cancel the stale record and pre-create the full plan.
 *
 * Run from services/api/:
 *   node qa-repair-followup-plan.cjs
 *
 * Pass --dry-run to preview without writing.
 */
const { Pool } = require('pg');

const DRY_RUN = process.argv.includes('--dry-run');
const pool = new Pool({ connectionString: 'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev' });

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusForDueDate(isoDate) {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate <= today ? 'DUE' : 'UPCOMING';
}

function resolveInterval(defaultIntervalDays, rules, sessionN) {
  if (Array.isArray(rules)) {
    const rule = rules.find(r => sessionN >= r.fromSessionNumber && sessionN <= r.toSessionNumber);
    if (rule) return rule.intervalDays;
  }
  return defaultIntervalDays;
}

async function q(sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function main() {
  console.log(`\n=== QA REPAIR — follow-up plan (${DRY_RUN ? 'DRY RUN' : 'LIVE'}) ===\n`);

  // Find appointments with:
  //   - service followUpEnabled=true, autoCreateNextReminder=true, totalRecommendedSessions >= 2
  //   - exactly 1 active (non-cancelled) follow-up linked to that appointment
  const candidates = await q(`
    SELECT
      a.id          AS "appointmentId",
      a."centerId",
      a."patientId",
      a."serviceId",
      a."appointmentDate"::text AS "appointmentDate",
      s."nameEn", s."nameAr",
      s."followUpMode",
      s."defaultIntervalDays",
      s."totalRecommendedSessions",
      s."followUpRules",
      (SELECT COUNT(*) FROM "PatientFollowUp" f
        WHERE f."patientId" = a."patientId"
          AND f."serviceId" = a."serviceId"
          AND f."centerId" = a."centerId"
          AND f.status NOT IN ('CANCELLED')
      ) AS "activeFollowUpCount"
    FROM "Appointment" a
    JOIN "Service" s ON s.id = a."serviceId"
    WHERE s."followUpEnabled" = true
      AND s."autoCreateNextReminder" = true
      AND s."totalRecommendedSessions" >= 2
      AND a.status = 'COMPLETED'
    ORDER BY a."createdAt" DESC
    LIMIT 50
  `, []);

  const toRepair = candidates.filter(c => Number(c.activeFollowUpCount) < Number(c.totalRecommendedSessions));

  console.log(`Candidates found: ${candidates.length}, need repair: ${toRepair.length}`);

  if (toRepair.length === 0) {
    console.log('Nothing to repair.');
    return;
  }

  for (const appt of toRepair) {
    const svcName = appt.nameEn || appt.nameAr;
    const total = Number(appt.totalRecommendedSessions);
    const existing = Number(appt.activeFollowUpCount);
    console.log(`\n--- Appointment ${appt.appointmentId.slice(0,8)} | patient ${appt.patientId.slice(0,8)} | service "${svcName}" (${total} sessions) | active follow-ups: ${existing} ---`);
    console.log(`    appointmentDate: ${appt.appointmentDate.slice(0,10)}, interval: ${appt.defaultIntervalDays} days`);

    // Get existing active follow-ups
    const existingFU = await q(`
      SELECT id, "sessionNumber", "dueDate"::text AS "dueDate", status
      FROM "PatientFollowUp"
      WHERE "patientId" = $1 AND "serviceId" = $2 AND "centerId" = $3
        AND status NOT IN ('CANCELLED')
      ORDER BY "dueDate" ASC
    `, [appt.patientId, appt.serviceId, appt.centerId]);

    console.log('  Existing follow-ups:');
    existingFU.forEach(f => console.log(`    session ${f.sessionNumber}: due ${f.dueDate.slice(0,10)} [${f.status}]`));

    // Build the full plan: sessions 1..totalSessions
    const rules = Array.isArray(appt.followUpRules) ? appt.followUpRules : [];
    const plan = [];
    let runningDate = appt.appointmentDate.slice(0, 10);

    for (let s = 1; s <= total; s++) {
      const interval = resolveInterval(appt.defaultIntervalDays, rules, s);
      if (!interval || interval <= 0) continue;
      runningDate = addDays(runningDate, interval);
      plan.push({ session: s, dueDate: runningDate, status: statusForDueDate(runningDate) });
    }

    console.log('  New plan to create:');
    plan.forEach(p => console.log(`    session ${p.session}: due ${p.dueDate} [${p.status}]`));

    // Find which sessions are already covered
    const existingDueDates = new Set(existingFU.map(f => f.dueDate.slice(0,10)));
    const existingSessionNums = new Set(existingFU.map(f => Number(f.sessionNumber)));

    const toCreate = plan.filter(p => !existingSessionNums.has(p.session));
    console.log(`  Sessions to insert: ${toCreate.map(p => p.session).join(', ')}`);

    if (toCreate.length === 0) {
      console.log('  Already complete — skipping.');
      continue;
    }

    if (DRY_RUN) {
      console.log('  [DRY RUN] Would insert the above sessions.');
      continue;
    }

    // Cancel any stale old follow-ups that don't match the new plan sessions
    // (e.g., a session-2 record from the old chain code that conflicts with the new session-1)
    const conflictingIds = existingFU
      .filter(f => !plan.some(p => p.session === Number(f.sessionNumber)))
      .map(f => f.id);

    if (conflictingIds.length > 0) {
      await pool.query(
        `UPDATE "PatientFollowUp" SET status = 'CANCELLED' WHERE id = ANY($1::uuid[])`,
        [conflictingIds],
      );
      console.log(`  Cancelled ${conflictingIds.length} stale follow-ups: ${conflictingIds.map(id => id.slice(0,8)).join(', ')}`);
    }

    // Get title from service
    const title = appt.nameAr || appt.nameEn || 'Follow-up';

    // Insert missing sessions (id generated by gen_random_uuid())
    for (const p of toCreate) {
      await pool.query(`
        INSERT INTO "PatientFollowUp" (
          "id",
          "centerId", "patientId", "serviceId", "appointmentId",
          "sourceType", "title", "sessionNumber", "dueDate", "status",
          "createdAt", "updatedAt"
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, 'APPOINTMENT_COMPLETED', $5, $6, $7::date, $8, NOW(), NOW())
      `, [
        appt.centerId, appt.patientId, appt.serviceId, appt.appointmentId,
        title, p.session, p.dueDate, p.status,
      ]);
      console.log(`  Inserted session ${p.session}: due ${p.dueDate} [${p.status}]`);
    }
  }

  console.log('\n=== REPAIR COMPLETE ===');
}

main().catch(console.error).finally(() => pool.end());
