const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev' });

async function count(sql, params) {
  const { rows } = await pool.query(sql, params);
  return Number(rows[0]?.count ?? 0);
}

async function main() {
  const cid = 'd5bcb26b-e5d5-4886-9b67-c968b60dc8fa';
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() +     86_400_000).toISOString().slice(0, 10);
  const weekEnd  = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  // Active statuses now include MISSED (after fix)
  const ACTIVE = "('DUE','UPCOMING','CONTACTED','MISSED')";

  const results = {
    TODAY:     await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND "dueDate"::date=$2::date AND status IN ${ACTIVE}`, [cid, today]),
    THIS_WEEK: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND "dueDate"::date>=$2::date AND "dueDate"::date<$3::date AND status IN ${ACTIVE}`, [cid, today, weekEnd]),
    OVERDUE:   await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND "dueDate"::date<$2::date AND status IN ${ACTIVE}`, [cid, today]),
    UPCOMING:  await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND "dueDate"::date>=$2::date AND status IN ${ACTIVE}`, [cid, tomorrow]),
    CONTACTED: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND status='CONTACTED'`, [cid]),
    BOOKED:    await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND status='BOOKED'`, [cid]),
    COMPLETED: await count(`SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId"=$1 AND status='COMPLETED'`, [cid]),
  };

  // UPCOMING = 12: QA patient sessions 3,4(CONTACTED),7,8 + امين ابو النصر's 8 UPCOMING sessions
  // CONTACTED sessions with future dueDate now correctly appear in UPCOMING (status not COMPLETED/BOOKED)
  const expected = { TODAY: 1, THIS_WEEK: 2, OVERDUE: 1, UPCOMING: 12, CONTACTED: 1, BOOKED: 1, COMPLETED: 1 };

  console.log('\n=== FILTER COUNT VERIFICATION (fixed backend rules) ===');
  console.table(
    Object.keys(results).map(f => ({
      filter:   f,
      db_count: results[f],
      expected: expected[f],
      pass:     results[f] === expected[f] ? '✅ PASS' : '❌ FAIL',
    }))
  );
}

main().catch(console.error).finally(() => pool.end());
