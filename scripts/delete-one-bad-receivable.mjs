/**
 * delete-one-bad-receivable.mjs
 *
 * Finds and optionally deletes the specific phantom receivable:
 *   Patient phone : 0598340283
 *   Service       : تحديد لحيه  (beard sculpting - stored with ha not ta-marbuta)
 *   Amount        : 79.98
 *   Date          : 2026-06-08
 *
 * Safety rules enforced at every step:
 *   - Refuses if more than 2 records match (prevents wide-net deletions)
 *   - Refuses to delete any invoice with payments or credit transactions
 *   - Dry-run by default; requires explicit --apply to delete
 *
 * Usage:
 *   node scripts/delete-one-bad-receivable.mjs            # inspect / dry-run
 *   node scripts/delete-one-bad-receivable.mjs --apply    # delete
 *
 * NOTE: The service name in the database is spelled with final-ha (ه)
 * not ta-marbuta (ة). The UI renders it as 'تحديد لحيه' in storage.
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);

// ─── Load DATABASE_URL from packages/database/.env ───────────────────────────
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
    // ignore
  }
}

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in environment or packages/database/.env");
  process.exit(1);
}

// ─── pg client ───────────────────────────────────────────────────────────────
const { Client } = require(
  path.join(__dirname, "..", "packages", "database", "node_modules", "pg")
);

const apply = process.argv.includes("--apply");
const DIVIDER = "-".repeat(90);

// Service name as stored in DB (nameAr uses final-ha not ta-marbuta)
// Both variants are matched to be safe
const SERVICE_PATTERNS = [
  "%تحديد لحيه%",
  "%تحديد لحية%",
];

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n=== RoyalCare -- Delete One Bad Receivable ===");
  console.log("Mode  : " + (apply ? "APPLY -- will delete" : "DRY-RUN -- inspection only"));
  console.log("Target: patient phone=0598340283  service~'\\u062a\\u062d\\u062f\\u064a\\u062f \\u0644\\u062d\\u064a'  amount=79.98");
  console.log(DIVIDER);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // ── Step 1: Find the invoice ──────────────────────────────────────────────
    // Match both spelling variants of the service name
    const findSQL = `
      SELECT
        i.id                                          AS "invoiceId",
        i."invoiceNumber",
        i.source,
        i.status,
        i.amount::float8                              AS "totalAmount",
        i.currency,
        i."createdAt",
        i."appointmentId",
        i."serviceId",
        -- patient
        p.id                                          AS "patientId",
        p."fullName"                                  AS "patientName",
        p.phone                                       AS "patientPhone",
        -- service
        svc."nameAr"                                  AS "serviceNameAr",
        svc."nameEn"                                  AS "serviceNameEn",
        i."customServiceName",
        -- payment aggregate
        COALESCE(pay_agg.paid, 0)::float8             AS "paidAmount",
        COALESCE(cr_agg.credit_used, 0)::float8       AS "creditUsed",
        (i.amount - COALESCE(pay_agg.paid, 0) - COALESCE(cr_agg.credit_used, 0))::float8
                                                      AS "remainingAmount",
        -- counts for safety checks
        COALESCE(pay_agg.cnt, 0)                      AS "paymentCount",
        COALESCE(cr_agg.cnt, 0)                       AS "creditCount"
      FROM "Invoice" i
      JOIN "Patient" p ON p.id = i."patientId"
      LEFT JOIN "Service" svc ON svc.id = i."serviceId"
      LEFT JOIN (
        SELECT "invoiceId",
               SUM(amount) AS paid,
               COUNT(*)    AS cnt
        FROM "Payment"
        GROUP BY "invoiceId"
      ) pay_agg ON pay_agg."invoiceId" = i.id
      LEFT JOIN (
        SELECT "relatedInvoiceId" AS "invoiceId",
               SUM(amount)        AS credit_used,
               COUNT(*)           AS cnt
        FROM "CreditTransaction"
        WHERE type = 'CREDIT_USE'
        GROUP BY "relatedInvoiceId"
      ) cr_agg ON cr_agg."invoiceId" = i.id
      WHERE
        p.phone = $1
        AND i.status NOT IN ('CANCELLED')
        AND (
          svc."nameAr" ILIKE $2
          OR svc."nameAr" ILIKE $3
          OR svc."nameEn" ILIKE $2
          OR svc."nameEn" ILIKE $3
          OR i."customServiceName" ILIKE $2
          OR i."customServiceName" ILIKE $3
        )
        AND i.amount BETWEEN $4 AND $5
      ORDER BY i."createdAt" DESC
    `;

    const AMOUNT_LOW  = 79.97;
    const AMOUNT_HIGH = 79.99;

    const { rows: found } = await client.query(findSQL, [
      "0598340283",
      SERVICE_PATTERNS[0],
      SERVICE_PATTERNS[1],
      AMOUNT_LOW,
      AMOUNT_HIGH,
    ]);

    if (found.length === 0) {
      console.log("\nOK: No matching invoice found.");
      console.log("   The receivable may already be gone, or the service/amount differs.");
      console.log("   Check the raw invoice list for patient phone=0598340283 manually.\n");
      return;
    }

    // ── Step 2: Print exact source of each row ────────────────────────────────
    console.log("\nFound " + found.length + " matching invoice(s):\n");

    for (const row of found) {
      const serviceName = row.serviceNameAr || row.serviceNameEn || row.customServiceName || "(unknown)";
      const payStatus = computePaymentStatus(row);

      console.log("invoiceId        : " + row.invoiceId);
      console.log("invoiceNumber    : " + (row.invoiceNumber || "(none)"));
      console.log("source           : " + row.source);
      console.log("status           : " + row.status);
      console.log("paymentStatus    : " + payStatus);
      console.log("totalAmount      : " + Number(row.totalAmount).toFixed(2) + " " + row.currency);
      console.log("paidAmount       : " + Number(row.paidAmount).toFixed(2));
      console.log("creditUsed       : " + Number(row.creditUsed).toFixed(2));
      console.log("remainingAmount  : " + Number(row.remainingAmount).toFixed(2));
      console.log("patientId        : " + row.patientId);
      console.log("patientName      : " + row.patientName);
      console.log("patientPhone     : " + row.patientPhone);
      console.log("serviceId        : " + (row.serviceId || "(none)"));
      console.log("serviceName      : " + serviceName);
      console.log("appointmentId    : " + (row.appointmentId || "(none)"));
      console.log("createdAt        : " + (row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt));
      console.log("paymentCount     : " + row.paymentCount);
      console.log("creditCount      : " + row.creditCount);
      console.log(DIVIDER);
    }

    // ── Step 3: Safety gate — too many matches ────────────────────────────────
    if (found.length > 2) {
      console.error(
        "\nREFUSED: " + found.length + " records matched. Expected at most 2.\n" +
        "   Narrow the criteria before deleting. No records were touched.\n"
      );
      process.exit(1);
    }

    // ── Step 4: Safety gate — has payments / credit transactions ─────────────
    const withPayments = found.filter(
      (r) => Number(r.paymentCount) > 0 || Number(r.creditCount) > 0
    );

    // Only delete records with ZERO payments AND ZERO credit
    const safeToDelete = found.filter(
      (r) => Number(r.paymentCount) === 0 && Number(r.creditCount) === 0
    );

    if (withPayments.length > 0) {
      console.log(
        "\nWARNING: " + withPayments.length + " invoice(s) have payments/credits -- will be SKIPPED:"
      );
      for (const r of withPayments) {
        console.log("   Invoice " + r.invoiceId + ": payments=" + r.paymentCount + "  credits=" + r.creditCount);
      }
    }

    if (safeToDelete.length === 0) {
      console.log("\nREFUSED: All matching invoices have payments or credit transactions.");
      console.log("   Nothing was deleted.\n");
      process.exit(1);
    }

    // ── Step 5: Dry-run exit ──────────────────────────────────────────────────
    if (!apply) {
      console.log(
        "\nDRY-RUN complete -- " + safeToDelete.length + " invoice(s) would be deleted:\n"
      );
      for (const r of safeToDelete) {
        console.log("   " + r.invoiceId + "  (" + (r.invoiceNumber || "no number") + ")  status=" + r.status + "  paid=" + Number(r.paidAmount).toFixed(2));
      }
      console.log("\nAll safety checks passed (no payments, no credit, <=2 matches).");
      console.log("Run with --apply to permanently delete.\n");
      return;
    }

    // ── Step 6: Delete (re-verify safety inline with DELETE WHERE) ────────────
    const idsToDelete = safeToDelete.map((r) => r.invoiceId);

    // Re-apply safety in the DELETE itself so concurrent payments are protected
    const deleteSQL = `
      DELETE FROM "Invoice"
      WHERE id = ANY($1::uuid[])
        AND id NOT IN (
          SELECT DISTINCT "invoiceId" FROM "Payment"
        )
        AND id NOT IN (
          SELECT DISTINCT "relatedInvoiceId" FROM "CreditTransaction"
          WHERE "relatedInvoiceId" IS NOT NULL AND type = 'CREDIT_USE'
        )
      RETURNING id, "invoiceNumber", status
    `;

    const { rows: deleted } = await client.query(deleteSQL, [idsToDelete]);

    if (deleted.length === 0) {
      console.log(
        "\nWARNING: DELETE returned 0 rows -- the invoice may have received a payment\n" +
        "   between the inspection and the delete, or it was already deleted.\n" +
        "   No data was modified.\n"
      );
      return;
    }

    console.log("\nDeleted " + deleted.length + " invoice(s):");
    for (const r of deleted) {
      console.log("   id=" + r.id + "  number=" + (r.invoiceNumber || "(none)") + "  status=" + r.status);
    }
    console.log(
      "\nNext step: refresh /tenant/reports in the browser to confirm\n" +
      "the receivable for patient phone=0598340283 is no longer shown.\n"
    );

  } finally {
    await client.end();
  }
}

function computePaymentStatus(row) {
  const remaining = Number(row.remainingAmount);
  const paid      = Number(row.paidAmount) + Number(row.creditUsed);
  const total     = Number(row.totalAmount);
  if (remaining <= 0 || paid >= total) return "PAID";
  const createdAt = new Date(row.createdAt);
  const todayUTC  = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  if (createdAt < todayUTC) return "OVERDUE";
  if (paid > 0 || row.status === "PARTIAL") return "PARTIAL";
  return "PENDING";
}

main().catch((err) => {
  console.error("\nScript failed: " + (err.message || String(err)));
  process.exit(1);
});
