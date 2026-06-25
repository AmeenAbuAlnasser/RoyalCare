import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "packages", "database", ".env");

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/);
    if (m) { DATABASE_URL = m[1]; break; }
  }
}
const { Client } = require(path.join(__dirname, "..", "packages", "database", "node_modules", "pg"));

const APPT_ID = process.argv[2] ?? "03c1cdce-bc94-480f-92e0-4362279e1a9d";
const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

const { rows: [appt] } = await client.query(`
  SELECT
    a.id,
    a."treatmentTemplateId",
    a."treatmentTemplateTotalSessions",
    a."treatmentTemplateDefaultIntervalDays",
    a."treatmentTemplatePhases",
    a."treatmentTemplateNameAr",
    a."treatmentTemplateNameEn",
    svc."followUpRules"            AS "svcFollowUpRules",
    svc."totalRecommendedSessions" AS "svcTotalSessions",
    svc."defaultIntervalDays"      AS "svcDefaultInterval",
    svc."followUpMode"
  FROM "Appointment" a
  LEFT JOIN "Service" svc ON svc.id = a."serviceId"
  WHERE a.id = $1
`, [APPT_ID]);

console.log("\n=== APPOINTMENT SNAPSHOT ===");
console.log(JSON.stringify(appt, null, 2));

if (appt?.treatmentTemplateId) {
  const { rows: [tpl] } = await client.query(`
    SELECT id, "nameAr", "nameEn", "totalSessions", "defaultIntervalDays", phases
    FROM "ServiceTreatmentTemplate"
    WHERE id = $1
  `, [appt.treatmentTemplateId]);
  console.log("\n=== TEMPLATE RECORD (live) ===");
  console.log(JSON.stringify(tpl, null, 2));
}

const { rows: followUps } = await client.query(`
  SELECT
    id, "sessionNumber", status, "dueDate",
    "planTotalSessions", "planDefaultIntervalDays", "planPhases",
    "treatmentTemplateId", "appointmentId", "sourceType"
  FROM "PatientFollowUp"
  WHERE "appointmentId" = $1
  ORDER BY "sessionNumber" ASC, "dueDate" ASC
`, [APPT_ID]);

console.log(`\n=== LINKED FOLLOW-UP ROWS (${followUps.length}) ===`);
console.log(JSON.stringify(followUps, null, 2));

await client.end();
