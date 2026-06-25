const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev' });

pool.query(`
  SELECT f."sessionNumber", f."dueDate"::text AS due, f.status,
         p."fullName" AS patient, f.id
  FROM "PatientFollowUp" f
  JOIN "Patient" p ON p.id = f."patientId"
  WHERE f."centerId" = 'd5bcb26b-e5d5-4886-9b67-c968b60dc8fa'
  ORDER BY p."fullName", f."sessionNumber" ASC
`).then(r => {
  console.table(r.rows.map(x => ({
    patient: x.patient, session: x.sessionNumber,
    due: x.due?.slice(0,10), status: x.status, id: x.id.slice(0,8)
  })));
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
