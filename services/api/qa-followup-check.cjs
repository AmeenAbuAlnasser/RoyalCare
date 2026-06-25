/**
 * QA script — run from services/api/
 *   node qa-followup-check.cjs
 * Uses pg directly (avoids tsconfig-paths issue with @royalcare/db alias).
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev',
});

async function q(sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function main() {
  // 1. Find patient
  const patients = await q(`
    SELECT id, "fullName", "centerId"
    FROM "Patient"
    WHERE "fullName" ILIKE $1
       OR "fullName" ILIKE $2
       OR "fullName" ILIKE $3
    LIMIT 10
  `, ['%امين%', '%amin%', '%النصر%']);

  console.log('\n=== PATIENTS FOUND ===');
  if (patients.length === 0) {
    console.log('No match — showing 20 most recent patients:');
    const all = await q(`SELECT id, "fullName" FROM "Patient" ORDER BY "createdAt" DESC LIMIT 20`, []);
    console.table(all.map(p => ({ id: p.id.slice(0,8), fullName: p.fullName })));
    return;
  }
  console.table(patients.map(p => ({ id: p.id.slice(0,8), fullName: p.fullName, center: p.centerId.slice(0,8) })));

  for (const patient of patients) {
    // 2. Follow-ups
    const followUps = await q(`
      SELECT
        f.id, f."patientId", f."serviceId", f."appointmentId",
        f."sessionNumber", f."dueDate", f.status, f."sourceType", f."createdAt",
        s."nameEn", s."nameAr", s."totalRecommendedSessions"
      FROM "PatientFollowUp" f
      LEFT JOIN "Service" s ON s.id = f."serviceId"
      WHERE f."patientId" = $1
      ORDER BY f."dueDate" ASC
    `, [patient.id]);

    console.log(`\n=== DB FOLLOW-UPS for "${patient.fullName}" — count: ${followUps.length} ===`);
    if (followUps.length === 0) {
      console.log('  (none in DB)');
    } else {
      console.table(followUps.map(f => ({
        id: f.id.slice(0,8),
        session: f.sessionNumber,
        due: new Date(f.dueDate).toISOString().slice(0,10),
        status: f.status,
        source: f.sourceType,
        svc: f.nameEn || f.nameAr || '-',
        totSess: f.totalRecommendedSessions ?? '-',
        appt: f.appointmentId ? f.appointmentId.slice(0,8) : 'null',
        created: new Date(f.createdAt).toISOString().slice(0,16),
      })));
    }

    // 3. Appointments
    const appts = await q(`
      SELECT
        a.id, a."appointmentDate", a.status, a."createdAt",
        s."nameEn", s."nameAr",
        s."followUpEnabled", s."autoCreateNextReminder",
        s."totalRecommendedSessions", s."followUpMode"
      FROM "Appointment" a
      LEFT JOIN "Service" s ON s.id = a."serviceId"
      WHERE a."patientId" = $1
      ORDER BY a."createdAt" DESC
      LIMIT 10
    `, [patient.id]);

    console.log(`\n=== APPOINTMENTS for "${patient.fullName}" ===`);
    console.table(appts.map(a => ({
      id: a.id.slice(0,8),
      date: new Date(a.appointmentDate).toISOString().slice(0,10),
      status: a.status,
      svc: a.nameEn || a.nameAr || '-',
      fuEnabled: a.followUpEnabled ?? false,
      autoRemind: a.autoCreateNextReminder ?? false,
      totSess: a.totalRecommendedSessions ?? '-',
      fuMode: a.followUpMode || '-',
      created: new Date(a.createdAt).toISOString().slice(0,16),
    })));

    // 4. API filter simulation — UPCOMING
    const upcoming = await q(`
      SELECT f.id, f."sessionNumber", f."dueDate", f.status
      FROM "PatientFollowUp" f
      WHERE f."patientId" = $1
        AND f."dueDate" >= NOW()::DATE
        AND f.status IN ('UPCOMING','DUE','CONTACTED')
      ORDER BY f."dueDate" ASC
    `, [patient.id]);

    console.log(`\n=== UPCOMING FILTER result for "${patient.fullName}" — count: ${upcoming.length} ===`);
    console.table(upcoming.map(u => ({
      id: u.id.slice(0,8),
      session: u.sessionNumber,
      due: new Date(u.dueDate).toISOString().slice(0,10),
      status: u.status,
    })));
  }

  console.log('\n=== DONE ===');
}

main().catch(console.error).finally(() => pool.end());
