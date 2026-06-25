/**
 * reset-laser-care-test-data.mjs
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!  WARNING: LOCAL / DEV CLEANUP ONLY.                                     !!
 * !!  DO NOT run this script in staging or production.                       !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Deletes all test operational data for the center with slug "laser-care"
 * so it can be tested from a clean state.
 *
 * DELETED (all scoped strictly to laser-care's centerId):
 *   CreditTransaction, Payment, PatientPortalToken, Session,
 *   BookingRequest, PatientFollowUp, Invoice, Appointment,
 *   ServiceTreatmentTemplate, Service, Patient
 *
 * PRESERVED (untouched):
 *   Center record, BrandingSettings (logo / cover / colors / descriptions),
 *   CenterBranch, CenterGalleryImage, CenterBeforeAfter, CenterTeamMember,
 *   CenterOffer, DynamicPage, CenterWorkingHours, CenterClosedDay,
 *   ProviderWorkingHours, ProviderLeaveDay, CenterSeoSettings,
 *   TenantMarketingSettings, Subscription, SubscriptionInvoice, Domain,
 *   User / staff, UserRole, Role, AuditLog, Notification
 *
 * Usage:
 *   node scripts/reset-laser-care-test-data.mjs           # dry-run (default)
 *   node scripts/reset-laser-care-test-data.mjs --apply   # permanently delete
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);

// ─── Load DATABASE_URL ────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "packages", "database", ".env");

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/);
      if (m) { DATABASE_URL = m[1]; break; }
    }
  } catch {
    // ignore — will fail below with a clear message
  }
}

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in environment or packages/database/.env");
  process.exit(1);
}

// ─── pg client ────────────────────────────────────────────────────────────────
const { Client } = require(
  path.join(__dirname, "..", "packages", "database", "node_modules", "pg"),
);

const apply       = process.argv.includes("--apply");
const TARGET_SLUG = "laser-care";
const WIDE        = "=".repeat(80);
const THIN        = "-".repeat(80);

// ─── Count queries (dry-run inspection) ──────────────────────────────────────
// ServiceTreatmentTemplate has no centerId; scoped via its parent Service.
const COUNT_STEPS = [
  {
    label: "CreditTransaction",
    sql: `SELECT COUNT(*) FROM "CreditTransaction" WHERE "centerId" = $1`,
  },
  {
    label: "Payment",
    sql: `SELECT COUNT(*) FROM "Payment" WHERE "centerId" = $1`,
  },
  {
    label: "PatientPortalToken",
    sql: `SELECT COUNT(*) FROM "PatientPortalToken" WHERE "centerId" = $1`,
  },
  {
    label: "Session",
    sql: `SELECT COUNT(*) FROM "Session" WHERE "centerId" = $1`,
  },
  {
    label: "BookingRequest",
    sql: `SELECT COUNT(*) FROM "BookingRequest" WHERE "centerId" = $1`,
  },
  {
    label: "PatientFollowUp",
    sql: `SELECT COUNT(*) FROM "PatientFollowUp" WHERE "centerId" = $1`,
  },
  {
    label: "Invoice",
    sql: `SELECT COUNT(*) FROM "Invoice" WHERE "centerId" = $1`,
  },
  {
    label: "Appointment",
    sql: `SELECT COUNT(*) FROM "Appointment" WHERE "centerId" = $1`,
  },
  {
    label: "ServiceTreatmentTemplate",
    sql: `SELECT COUNT(*) FROM "ServiceTreatmentTemplate"
          WHERE "serviceId" IN (SELECT id FROM "Service" WHERE "centerId" = $1)`,
  },
  {
    label: "Service",
    sql: `SELECT COUNT(*) FROM "Service" WHERE "centerId" = $1`,
  },
  {
    label: "Patient",
    sql: `SELECT COUNT(*) FROM "Patient" WHERE "centerId" = $1`,
  },
];

// ─── Delete queries (child → parent order) ───────────────────────────────────
// Deletion order is determined by FK constraints:
//
//   CreditTransaction  — Restrict FK to Patient, Invoice → delete first
//   Payment            — Restrict FK to Invoice, Patient → delete before Invoice
//   PatientPortalToken — Cascade FK to Patient
//   Session            — Restrict/SetNull FK to Appointment, Service
//   BookingRequest     — SetNull FK to Appointment; delete before Appointment
//   PatientFollowUp    — Restrict FK to Patient; self-ref via originFollowUpId
//                        (SetNull). NULLed in a preliminary UPDATE step to avoid
//                        self-referential FK ordering issues.
//   Invoice            — Restrict FK to Patient, Service; delete after above
//   Appointment        — Restrict FK to Patient, Service; delete after Invoice
//   ServiceTreatmentTemplate — scoped via Service.centerId (no own centerId)
//   Service            — Restrict FK from Invoice, Appointment → delete last
//   Patient            — Restrict FK from everything → delete last
//
const DELETE_STEPS = [
  {
    label: "CreditTransaction",
    sql: `DELETE FROM "CreditTransaction" WHERE "centerId" = $1`,
  },
  {
    label: "Payment",
    sql: `DELETE FROM "Payment" WHERE "centerId" = $1`,
  },
  {
    label: "PatientPortalToken",
    sql: `DELETE FROM "PatientPortalToken" WHERE "centerId" = $1`,
  },
  {
    label: "Session",
    sql: `DELETE FROM "Session" WHERE "centerId" = $1`,
  },
  {
    label: "BookingRequest",
    sql: `DELETE FROM "BookingRequest" WHERE "centerId" = $1`,
  },
  // Clear self-referential originFollowUpId before deleting PatientFollowUp
  // rows, so the SET NULL FK action inside the same table does not cause
  // ordering issues within the single DELETE statement.
  {
    label: "PatientFollowUp (clear self-ref)",
    sql: `UPDATE "PatientFollowUp" SET "originFollowUpId" = NULL WHERE "centerId" = $1`,
    isUpdate: true,
  },
  {
    label: "PatientFollowUp",
    sql: `DELETE FROM "PatientFollowUp" WHERE "centerId" = $1`,
  },
  {
    label: "Invoice",
    sql: `DELETE FROM "Invoice" WHERE "centerId" = $1`,
  },
  {
    label: "Appointment",
    sql: `DELETE FROM "Appointment" WHERE "centerId" = $1`,
  },
  {
    label: "ServiceTreatmentTemplate",
    sql: `DELETE FROM "ServiceTreatmentTemplate"
          WHERE "serviceId" IN (SELECT id FROM "Service" WHERE "centerId" = $1)`,
  },
  {
    label: "Service",
    sql: `DELETE FROM "Service" WHERE "centerId" = $1`,
  },
  {
    label: "Patient",
    sql: `DELETE FROM "Patient" WHERE "centerId" = $1`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + WIDE);
  console.log("  RoyalCare — Reset Test Data: " + TARGET_SLUG);
  console.log(WIDE);
  console.log();
  console.log("  !! WARNING: LOCAL / DEV CLEANUP ONLY — do not run in production !!");
  console.log();
  console.log("  Mode   : " + (apply
    ? "APPLY  -- data will be PERMANENTLY deleted"
    : "DRY-RUN -- counts only, nothing will be deleted"
  ));
  console.log("  Target : slug = " + TARGET_SLUG);
  console.log(WIDE);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // ── 1. Resolve centerId ─────────────────────────────────────────────────
    const { rows: centerRows } = await client.query(
      `SELECT id, name, slug, status FROM "Center" WHERE slug = $1 LIMIT 1`,
      [TARGET_SLUG],
    );

    if (centerRows.length === 0) {
      console.error(
        "\nERROR: Center with slug '" + TARGET_SLUG + "' was not found.\n" +
        "       Refusing to proceed — verify the slug and the database connection.\n",
      );
      process.exit(1);
    }

    const center   = centerRows[0];
    const centerId = center.id;

    console.log("\nCenter found:");
    console.log("  id     : " + centerId);
    console.log("  name   : " + center.name);
    console.log("  slug   : " + center.slug);
    console.log("  status : " + center.status);
    console.log();

    // ── 2. Count rows per table ─────────────────────────────────────────────
    console.log("Records that will be deleted:");
    console.log(THIN);

    let totalRows = 0;
    for (const step of COUNT_STEPS) {
      const { rows } = await client.query(step.sql, [centerId]);
      const count = parseInt(rows[0].count, 10);
      totalRows += count;
      console.log(
        "  " + step.label.padEnd(30) +
        String(count).padStart(8) + " rows",
      );
    }

    console.log(THIN);
    console.log("  " + "TOTAL".padEnd(30) + String(totalRows).padStart(8) + " rows");
    console.log();

    // ── 3. Dry-run exit ─────────────────────────────────────────────────────
    if (!apply) {
      if (totalRows === 0) {
        console.log("All tables are already empty for this center. Nothing to delete.\n");
      } else {
        console.log("DRY-RUN complete. No data was modified.");
        console.log("Run with --apply to permanently delete the above records.\n");
      }
      return;
    }

    if (totalRows === 0) {
      console.log("Nothing to delete — all tables already empty for this center.\n");
      return;
    }

    // ── 4. Delete inside a transaction ──────────────────────────────────────
    console.log("Starting transaction...\n");
    await client.query("BEGIN");

    try {
      let totalDeleted = 0;

      for (const step of DELETE_STEPS) {
        const result = await client.query(step.sql, [centerId]);
        const n      = result.rowCount ?? 0;
        if (!step.isUpdate) {
          totalDeleted += n;
          console.log(
            "  Deleted " + String(n).padStart(6) + "  " + step.label,
          );
        } else {
          console.log(
            "  Updated " + String(n).padStart(6) + "  " + step.label,
          );
        }
      }

      await client.query("COMMIT");

      console.log();
      console.log("Transaction committed.\n");
      console.log(THIN);
      console.log("  TOTAL deleted: " + totalDeleted + " rows");
      console.log(THIN);
      console.log();
      console.log("Verify in browser:");
      console.log("  /tenant/patients      — should be empty");
      console.log("  /tenant/appointments  — should be empty");
      console.log("  /tenant/billing       — should be empty");
      console.log("  /tenant/reports       — all metrics should be zero");
      console.log("  /tenant/services      — should be empty");
      console.log("  Staff members         — should be unchanged");
      console.log("  Public page / logo    — should be unchanged");
      console.log();

    } catch (txErr) {
      await client.query("ROLLBACK");
      console.error(
        "\nERROR: Transaction rolled back. No data was modified.\n" +
        "Reason: " + (txErr.message || String(txErr)) + "\n",
      );
      process.exit(1);
    }

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nScript failed: " + (err.message || String(err)));
  process.exit(1);
});
