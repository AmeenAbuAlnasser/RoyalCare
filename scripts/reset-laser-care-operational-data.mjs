/**
 * reset-laser-care-operational-data.mjs
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!  WARNING: LOCAL / DEV CLEANUP ONLY.                                     !!
 * !!  DO NOT run this script in staging or production.                       !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Deletes ALL operational / test data for the center with slug "laser-care"
 * so testing can restart from a clean state.
 *
 * DELETED (strictly scoped to laser-care's centerId):
 *   NotificationLog, Notification,
 *   CreditTransaction, Payment, PatientPortalToken,
 *   Session, BookingRequest,
 *   PatientFollowUp (self-ref cleared first),
 *   Invoice, Appointment,
 *   Patient
 *
 * PRESERVED (never touched):
 *   Center · Service · ServiceTreatmentTemplate (service catalog / templates)
 *   BrandingSettings (logo / cover / colors / public descriptions)
 *   CenterBranch · CenterWorkingHours · CenterClosedDay
 *   ProviderWorkingHours · ProviderLeaveDay
 *   CenterGalleryImage · CenterReview · CenterBeforeAfter
 *   CenterTeamMember · CenterOffer · DynamicPage
 *   CenterSeoSettings · TenantMarketingSettings
 *   Domain · Subscription · SubscriptionInvoice
 *   User / staff · UserRole · Role · RolePermission
 *   AuditLog · Customer · MarketingTrackingLog · CenterWebsiteEvent
 *
 * FORBIDDEN (script explicitly refuses to touch these):
 *   Center, User, Role, UserRole, RolePermission,
 *   Subscription, SubscriptionInvoice, AuditLog,
 *   BrandingSettings, Permission,
 *   Service, ServiceTreatmentTemplate
 *
 * Usage:
 *   node scripts/reset-laser-care-operational-data.mjs          # dry-run
 *   node scripts/reset-laser-care-operational-data.mjs --apply  # delete
 */

import { createRequire } from "module";
import { readFileSync }  from "fs";
import { fileURLToPath } from "url";
import path              from "path";

const require    = createRequire(import.meta.url);
const __dirname  = path.dirname(fileURLToPath(import.meta.url));

// ─── Forbidden table guard ─────────────────────────────────────────────────────
// Protects against accidental additions to DELETE_STEPS.
const FORBIDDEN_TABLES = new Set([
  "Center", "User", "Role", "UserRole", "RolePermission",
  "Subscription", "SubscriptionInvoice", "AuditLog",
  "BrandingSettings", "Permission",
  "Service", "ServiceTreatmentTemplate",
]);

// ─── Config ───────────────────────────────────────────────────────────────────
const TARGET_SLUG = "laser-care";
const apply       = process.argv.includes("--apply");
const WIDE        = "=".repeat(80);
const THIN        = "-".repeat(80);

// ─── Load DATABASE_URL ────────────────────────────────────────────────────────
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  // Try packages/database/.env first, then services/api/.env
  for (const rel of [
    "../packages/database/.env",
    "../services/api/.env",
  ]) {
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
  console.error("ERROR: DATABASE_URL not found in environment or .env files.");
  process.exit(1);
}

// ─── pg client ────────────────────────────────────────────────────────────────
const pgPath = (() => {
  // prefer the copy bundled with the database package
  for (const rel of [
    "../packages/database/node_modules/pg",
    "../services/api/node_modules/pg",
  ]) {
    try {
      const resolved = path.join(__dirname, rel);
      require.resolve(resolved);
      return resolved;
    } catch { /* try next */ }
  }
  return "pg"; // fall back to global
})();

const { Client } = require(pgPath);

// ─── Count queries (for dry-run) ──────────────────────────────────────────────
// Shown before deletion so the operator knows exactly what will be removed.
const COUNT_STEPS = [
  // Notification logs cascade from Notification — count both explicitly.
  {
    label: "NotificationLog",
    sql: `SELECT COUNT(*) FROM "NotificationLog"
          WHERE "notificationId" IN (
            SELECT id FROM "Notification" WHERE "centerId" = $1
          )`,
  },
  {
    label: "Notification",
    sql: `SELECT COUNT(*) FROM "Notification" WHERE "centerId" = $1`,
  },
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
    label: "Patient",
    sql: `SELECT COUNT(*) FROM "Patient" WHERE "centerId" = $1`,
  },
];

// ─── Delete steps (children before parents) ───────────────────────────────────
//
// FK dependency order:
//
//   NotificationLog  ← Notification (Cascade)       → delete Notification first
//   Notification     — centerId direct FK            → independent
//   CreditTransaction — Restrict FK → Patient, Invoice
//   Payment           — Restrict FK → Invoice, Patient
//   PatientPortalToken — Cascade FK → Patient
//   Session           — FK to Appointment (SetNull), Service (SetNull)
//   BookingRequest    — FK to Appointment (SetNull); Service (Cascade from center)
//   PatientFollowUp   — Restrict FK → Patient; self-ref originFollowUpId (SetNull)
//                       NULL the self-ref first to avoid ordering issues.
//   Invoice           — Restrict FK → Patient; Invoice has no child line-item table
//   Appointment       — Restrict FK → Patient; after Invoice
//   Patient           — Restrict FK from Center (can delete once all children gone)
//
//   Service / ServiceTreatmentTemplate: NOT deleted — preserved per requirements.
//
const DELETE_STEPS = [
  // Notifications (NotificationLog cascades automatically)
  {
    label: "Notification (+ NotificationLog cascade)",
    table: "Notification",
    sql:   `DELETE FROM "Notification" WHERE "centerId" = $1`,
  },
  // Financial children — must precede Invoice and Patient
  {
    label: "CreditTransaction",
    table: "CreditTransaction",
    sql:   `DELETE FROM "CreditTransaction" WHERE "centerId" = $1`,
  },
  {
    label: "Payment",
    table: "Payment",
    sql:   `DELETE FROM "Payment" WHERE "centerId" = $1`,
  },
  // Portal tokens — cascade from Patient but delete explicitly for counts
  {
    label: "PatientPortalToken",
    table: "PatientPortalToken",
    sql:   `DELETE FROM "PatientPortalToken" WHERE "centerId" = $1`,
  },
  // Customer sessions (website portal) — SetNull on Appointment/Service
  {
    label: "Session",
    table: "Session",
    sql:   `DELETE FROM "Session" WHERE "centerId" = $1`,
  },
  // Booking requests — SetNull on Appointment, Cascade from Service
  {
    label: "BookingRequest",
    table: "BookingRequest",
    sql:   `DELETE FROM "BookingRequest" WHERE "centerId" = $1`,
  },
  // Clear the self-referential originFollowUpId before bulk-deleting follow-ups.
  // The FK is ON DELETE SET NULL, but a single DELETE statement that removes
  // both parent and child rows in the same batch can trigger FK ordering issues
  // in some PostgreSQL versions. Nulling it first is the safe approach.
  {
    label: "PatientFollowUp (clear self-ref)",
    table: "PatientFollowUp",
    sql:   `UPDATE "PatientFollowUp" SET "originFollowUpId" = NULL WHERE "centerId" = $1`,
    isUpdate: true,
  },
  {
    label: "PatientFollowUp",
    table: "PatientFollowUp",
    sql:   `DELETE FROM "PatientFollowUp" WHERE "centerId" = $1`,
  },
  // Invoices — must come after CreditTransaction and Payment
  {
    label: "Invoice",
    table: "Invoice",
    sql:   `DELETE FROM "Invoice" WHERE "centerId" = $1`,
  },
  // Appointments — must come after Invoice; Restrict FK from Patient
  {
    label: "Appointment",
    table: "Appointment",
    sql:   `DELETE FROM "Appointment" WHERE "centerId" = $1`,
  },
  // Patients — last; all Restrict FK children must be gone first
  {
    label: "Patient",
    table: "Patient",
    sql:   `DELETE FROM "Patient" WHERE "centerId" = $1`,
  },
];

// ─── Safety check ─────────────────────────────────────────────────────────────
for (const step of DELETE_STEPS) {
  if (FORBIDDEN_TABLES.has(step.table)) {
    console.error(
      `\nBUG: DELETE_STEPS contains forbidden table "${step.table}".` +
      "\nThis script must never delete protected platform data.\n",
    );
    process.exit(2);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + WIDE);
  console.log("  RoyalCare — Reset Operational Data: " + TARGET_SLUG);
  console.log(WIDE);
  console.log();
  console.log("  !! WARNING: LOCAL / DEV CLEANUP ONLY — never run in production !!");
  console.log();
  console.log(
    "  Mode   : " +
    (apply
      ? "APPLY  -- records will be PERMANENTLY deleted"
      : "DRY-RUN -- counts only, nothing will be modified"),
  );
  console.log("  Target : slug = " + TARGET_SLUG);
  console.log(WIDE);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // ── 1. Resolve centerId ──────────────────────────────────────────────────
    const { rows: centerRows } = await client.query(
      `SELECT id, name, slug, status FROM "Center" WHERE slug = $1 LIMIT 1`,
      [TARGET_SLUG],
    );

    if (centerRows.length === 0) {
      console.error(
        "\nERROR: Center with slug '" + TARGET_SLUG + "' was not found.\n" +
        "       Verify the slug and the DATABASE_URL connection string.\n",
      );
      process.exit(1);
    }

    const center   = centerRows[0];
    const centerId = center.id;

    console.log("\nCenter resolved:");
    console.log("  id     : " + centerId);
    console.log("  name   : " + center.name);
    console.log("  slug   : " + center.slug);
    console.log("  status : " + center.status);
    console.log();

    // ── 2. Count rows ────────────────────────────────────────────────────────
    console.log("Records that will be deleted:");
    console.log(THIN);

    let totalRows = 0;
    for (const step of COUNT_STEPS) {
      const { rows } = await client.query(step.sql, [centerId]);
      const count    = parseInt(rows[0].count, 10);
      totalRows += count;
      console.log(
        "  " + step.label.padEnd(32) +
        String(count).padStart(7) + " rows",
      );
    }

    console.log(THIN);
    console.log(
      "  " + "TOTAL".padEnd(32) + String(totalRows).padStart(7) + " rows",
    );
    console.log();

    // ── 3. Dry-run exit ──────────────────────────────────────────────────────
    if (!apply) {
      if (totalRows === 0) {
        console.log("All tables are already empty for this center. Nothing to do.\n");
      } else {
        console.log("DRY-RUN complete — no data was modified.");
        console.log(
          "Run with --apply to permanently delete the " +
          totalRows + " rows listed above.\n",
        );
      }
      return;
    }

    if (totalRows === 0) {
      console.log("Nothing to delete — all tables already empty for this center.\n");
      return;
    }

    // ── 4. Delete in a single transaction ───────────────────────────────────
    console.log("Starting transaction ...\n");
    await client.query("BEGIN");

    try {
      let totalDeleted = 0;

      for (const step of DELETE_STEPS) {
        const result = await client.query(step.sql, [centerId]);
        const n      = result.rowCount ?? 0;

        if (step.isUpdate) {
          console.log("  Updated  " + String(n).padStart(6) + "  " + step.label);
        } else {
          totalDeleted += n;
          console.log("  Deleted  " + String(n).padStart(6) + "  " + step.label);
        }
      }

      await client.query("COMMIT");

      console.log();
      console.log("Transaction committed successfully.\n");
      console.log(THIN);
      console.log("  TOTAL rows deleted : " + totalDeleted);
      console.log(THIN);
      console.log();
      console.log("Verify in browser:");
      console.log("  /tenant/patients      — should be empty");
      console.log("  /tenant/appointments  — should be empty");
      console.log("  /tenant/follow-ups    — should be empty");
      console.log("  /tenant/billing       — should be empty");
      console.log("  /tenant/reports       — all metrics should be zero");
      console.log("  /tenant/services      — services should STILL APPEAR (preserved)");
      console.log("  Staff members         — should be unchanged");
      console.log("  Public page / logo    — should be unchanged");
      console.log("  Center branding       — should be unchanged");
      console.log();

    } catch (txErr) {
      await client.query("ROLLBACK");
      console.error(
        "\nERROR: Transaction rolled back — no data was modified.\n" +
        "Reason: " + (txErr.message || String(txErr)) + "\n",
      );
      process.exit(1);
    }

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nFatal: " + (err.message || String(err)));
  process.exit(1);
});
