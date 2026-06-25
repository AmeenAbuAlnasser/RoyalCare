/**
 * Filter audit — compares DB counts vs backend filter logic for every filter.
 * Run: node qa-filter-audit.cjs   (from services/api/)
 */
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev' });

async function q(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function count(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return Number(rows[0]?.count ?? 0);
}

async function main() {
  // 1. Find QA center
  const centers = await q(`SELECT id, name FROM "Center" WHERE name ILIKE '%QA Recovery%' LIMIT 5`);
  if (!centers.length) { console.error('No QA center found'); return; }
  console.log('\n=== QA CENTERS ===');
  console.table(centers.map(c => ({ id: c.id.slice(0,8), name: c.name })));

  const centerIds = centers.map(c => c.id);
  const cidList   = centerIds.map((_, i) => `$${i + 1}`).join(',');

  // 2. All follow-ups in these centers
  const all = await q(
    `SELECT f.id, f."patientId", f."sessionNumber", f."dueDate"::text, f.status, f."sourceType",
            p."fullName" AS "patientName"
     FROM "PatientFollowUp" f
     JOIN "Patient" p ON p.id = f."patientId"
     WHERE f."centerId" IN (${cidList})
     ORDER BY f."dueDate" ASC`,
    centerIds,
  );

  console.log(`\n=== ALL FOLLOW-UPS (${all.length} rows) ===`);
  console.table(all.map(r => ({
    id:        r.id.slice(0,8),
    patient:   r.patientName,
    session:   r.sessionNumber,
    due:       r.dueDate?.slice(0,10),
    status:    r.status,
  })));

  // 3. Today anchor
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() +     86_400_000).toISOString().slice(0,10);
  const weekEnd  = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0,10);

  console.log(`\n=== DATE ANCHORS ===`);
  console.table([{ today, tomorrow, weekEnd }]);

  // 4. DB counts per filter (current backend logic)
  const CURRENT = {
    TODAY:     await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date = $${centerIds.length+1}::date AND status IN ('DUE','UPCOMING','CONTACTED')`, [...centerIds, today]),
    THIS_WEEK: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date >= $${centerIds.length+1}::date AND "dueDate"::date < $${centerIds.length+2}::date AND status IN ('DUE','UPCOMING','CONTACTED')`, [...centerIds, today, weekEnd]),
    OVERDUE:   await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date < $${centerIds.length+1}::date AND status IN ('DUE','UPCOMING','CONTACTED')`, [...centerIds, today]),
    UPCOMING:  await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date >= $${centerIds.length+1}::date AND status IN ('DUE','UPCOMING')`, [...centerIds, tomorrow]),
    CONTACTED: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND status = 'CONTACTED'`, centerIds),
    BOOKED:    await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND status = 'BOOKED'`, centerIds),
    COMPLETED: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND status = 'COMPLETED'`, centerIds),
  };

  // 5. DB counts per filter (proposed fix: include MISSED, exclude CANCELLED)
  const FIXED = {
    TODAY:     await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date = $${centerIds.length+1}::date AND status NOT IN ('COMPLETED','BOOKED','CANCELLED')`, [...centerIds, today]),
    THIS_WEEK: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date >= $${centerIds.length+1}::date AND "dueDate"::date < $${centerIds.length+2}::date AND status NOT IN ('COMPLETED','BOOKED','CANCELLED')`, [...centerIds, today, weekEnd]),
    OVERDUE:   await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date < $${centerIds.length+1}::date AND status NOT IN ('COMPLETED','BOOKED','CANCELLED')`, [...centerIds, today]),
    UPCOMING:  await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND "dueDate"::date >= $${centerIds.length+1}::date AND status NOT IN ('COMPLETED','BOOKED','CANCELLED')`, [...centerIds, tomorrow]),
    CONTACTED: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND status = 'CONTACTED'`, centerIds),
    BOOKED:    await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND status = 'BOOKED'`, centerIds),
    COMPLETED: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) AND status = 'COMPLETED'`, centerIds),
  };

  // 6. Count by status (what's in DB)
  const bySt = await q(
    `SELECT status, COUNT(*)::int AS cnt FROM "PatientFollowUp" WHERE "centerId" IN (${cidList}) GROUP BY status ORDER BY status`,
    centerIds,
  );
  console.log('\n=== ALL STATUSES IN DB ===');
  console.table(bySt);

  // 7. Side-by-side comparison
  console.log('\n=== FILTER COMPARISON: current vs fixed ===');
  console.table(
    Object.keys(CURRENT).map(f => ({
      filter:   f,
      current:  CURRENT[f],
      fixed:    FIXED[f],
      changed:  CURRENT[f] !== FIXED[f] ? '⚠️ CHANGES' : '✓ same',
    })),
  );

  // 8. Rows that ONLY the fix picks up (missed by current logic)
  const missedByCurrentOverdue = await q(
    `SELECT id, "patientId", "sessionNumber", "dueDate"::text, status
     FROM "PatientFollowUp"
     WHERE "centerId" IN (${cidList})
       AND "dueDate"::date < $${centerIds.length+1}::date
       AND status NOT IN ('DUE','UPCOMING','CONTACTED')
       AND status NOT IN ('COMPLETED','BOOKED','CANCELLED')`,
    [...centerIds, today],
  );
  if (missedByCurrentOverdue.length) {
    console.log('\n=== ROWS MISSED BY CURRENT OVERDUE FILTER (would be added by fix) ===');
    console.table(missedByCurrentOverdue.map(r => ({
      id: r.id.slice(0,8), session: r.sessionNumber,
      due: r.dueDate?.slice(0,10), status: r.status,
    })));
  }

  // 9. THIS_WEEK overlap with TODAY
  const thiswkRows = await q(
    `SELECT "dueDate"::date::text AS due, status, COUNT(*)::int AS cnt
     FROM "PatientFollowUp"
     WHERE "centerId" IN (${cidList})
       AND "dueDate"::date >= $${centerIds.length+1}::date
       AND "dueDate"::date < $${centerIds.length+2}::date
       AND status NOT IN ('COMPLETED','BOOKED','CANCELLED')
     GROUP BY "dueDate"::date, status
     ORDER BY "dueDate"::date`,
    [...centerIds, today, weekEnd],
  );
  console.log('\n=== THIS_WEEK rows by date+status ===');
  console.table(thiswkRows);
}

main().catch(console.error).finally(() => pool.end());
