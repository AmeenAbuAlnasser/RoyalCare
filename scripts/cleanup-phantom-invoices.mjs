/**
 * Phantom invoice cleanup
 *
 * MODE 1 — auto-source (default):
 *   Finds invoices where source IN [AUTO_APPOINTMENT, AUTO_FOLLOW_UP, AUTO_RECALCULATION]
 *   AND status=PENDING AND no payments AND no credit transactions.
 *
 *   node scripts/cleanup-phantom-invoices.mjs
 *   node scripts/cleanup-phantom-invoices.mjs --apply
 *
 * MODE 2 — legacy (pre-source migration):
 *   Old phantom invoices were created before Invoice.source existed.
 *   The migration defaulted them to MANUAL, so filtering on source misses them.
 *   Use explicit filters to target only those specific records.
 *   At least one of --patient-phone, --service, or --amount is required in legacy mode
 *   to avoid accidentally deleting real manually-created invoices.
 *
 *   node scripts/cleanup-phantom-invoices.mjs --legacy --patient-phone=0598340283 --service="تحديد لحية" --amount=79.98
 *   node scripts/cleanup-phantom-invoices.mjs --legacy --patient-phone=0598340283 --service="تحديد لحية" --amount=79.98 --apply
 */

import { PrismaClient } from "@royalcare/db";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs() {
  const argv = process.argv.slice(2);
  const flags = {
    apply: false,
    legacy: false,
    patientPhone: null,
    service: null,
    amount: null,
  };
  for (const arg of argv) {
    if (arg === "--apply") { flags.apply = true; continue; }
    if (arg === "--legacy") { flags.legacy = true; continue; }
    const phoneMatch = arg.match(/^--patient-phone=(.+)$/);
    if (phoneMatch) { flags.patientPhone = phoneMatch[1].trim(); continue; }
    const serviceMatch = arg.match(/^--service=(.+)$/);
    if (serviceMatch) { flags.service = serviceMatch[1].trim(); continue; }
    const amountMatch = arg.match(/^--amount=(.+)$/);
    if (amountMatch) { flags.amount = parseFloat(amountMatch[1]); continue; }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Build Prisma where clause
// ---------------------------------------------------------------------------
function buildWhere(flags) {
  // Base guards — always applied regardless of mode
  const base = {
    status: "PENDING",
    payments: { none: {} },
    creditTransactions: { none: {} },
  };

  if (!flags.legacy) {
    // MODE 1: auto-source detection
    return {
      ...base,
      source: { in: ["AUTO_APPOINTMENT", "AUTO_FOLLOW_UP", "AUTO_RECALCULATION"] },
    };
  }

  // MODE 2: legacy — source was defaulted to MANUAL by migration
  const where = { ...base, source: "MANUAL" };

  if (flags.patientPhone) {
    where.patient = { phone: flags.patientPhone };
  }

  if (flags.service) {
    // Match against Arabic, English, or custom service name (case-insensitive)
    where.OR = [
      {
        service: {
          OR: [
            { nameAr: { contains: flags.service, mode: "insensitive" } },
            { nameEn: { contains: flags.service, mode: "insensitive" } },
            { nameHe: { contains: flags.service, mode: "insensitive" } },
          ],
        },
      },
      { customServiceName: { contains: flags.service, mode: "insensitive" } },
    ];
  }

  if (flags.amount != null && !isNaN(flags.amount)) {
    where.amount = { equals: flags.amount };
  }

  return where;
}

// ---------------------------------------------------------------------------
// Print helper
// ---------------------------------------------------------------------------
const DIVIDER = "─".repeat(88);

function printInvoice(inv) {
  const serviceName =
    inv.service?.nameAr ??
    inv.service?.nameEn ??
    inv.customServiceName ??
    "(custom/unknown)";

  console.log(`Invoice ID:  ${inv.id}`);
  console.log(`Number:      ${inv.invoiceNumber ?? "(none)"}`);
  console.log(`Source:      ${inv.source}`);
  console.log(`Status:      ${inv.status}`);
  console.log(`Amount:      ${inv.amount} ${inv.currency}`);
  console.log(`Patient:     ${inv.patient.fullName}  |  Phone: ${inv.patient.phone ?? "—"}`);
  console.log(`Service:     ${serviceName}`);
  if (inv.appointment) {
    const apptDate = inv.appointment.appointmentDate?.toISOString().split("T")[0] ?? "—";
    console.log(`Appointment: ${apptDate}  status=${inv.appointment.status}`);
  }
  console.log(`Created at:  ${inv.createdAt.toISOString()}`);
  console.log(DIVIDER);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public" },
  },
});

async function main() {
  const flags = parseArgs();

  console.log("\n=== RoyalCare — Phantom Invoice Cleanup ===");
  console.log(`Mode:  ${flags.legacy ? "LEGACY (source=MANUAL, explicit filters)" : "AUTO (source=AUTO_*)"}`);
  console.log(`Apply: ${flags.apply ? "YES — will delete" : "NO — dry-run only"}`);
  if (flags.legacy) {
    console.log(`Filters:`);
    if (flags.patientPhone) console.log(`  --patient-phone  = ${flags.patientPhone}`);
    if (flags.service)      console.log(`  --service        = ${flags.service}`);
    if (flags.amount != null) console.log(`  --amount         = ${flags.amount}`);
  }
  console.log();

  // Safety: legacy mode requires at least one specific filter so we don't
  // accidentally target every MANUAL PENDING invoice in the system.
  if (flags.legacy && !flags.patientPhone && !flags.service && flags.amount == null) {
    console.error(
      "❌ Legacy mode requires at least one of: --patient-phone, --service, --amount\n" +
      "   This prevents accidentally deleting all MANUAL invoices.\n",
    );
    process.exit(1);
  }

  const where = buildWhere(flags);

  const phantoms = await prisma.invoice.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, phone: true, centerId: true } },
      service: { select: { id: true, nameAr: true, nameEn: true, nameHe: true } },
      appointment: { select: { id: true, appointmentDate: true, status: true } },
    },
    orderBy: [{ centerId: "asc" }, { patientId: "asc" }, { createdAt: "asc" }],
  });

  if (phantoms.length === 0) {
    console.log("✅ No matching phantom invoices found. Nothing to clean up.");
    return;
  }

  console.log(`⚠️  Found ${phantoms.length} phantom invoice(s):\n`);
  console.log(DIVIDER);
  for (const inv of phantoms) {
    printInvoice(inv);
  }

  if (!flags.apply) {
    console.log(
      `\n🔍 DRY-RUN complete — ${phantoms.length} invoice(s) would be deleted.\n` +
      "   Add --apply to permanently remove them.\n",
    );
    return;
  }

  const idsToDelete = phantoms.map((i) => i.id);

  // Re-apply the safety guards on delete so a concurrent payment that arrives
  // between the find and the delete is never touched.
  const deleteWhere = {
    id: { in: idsToDelete },
    status: "PENDING",
    payments: { none: {} },
    creditTransactions: { none: {} },
  };

  const result = await prisma.invoice.deleteMany({ where: deleteWhere });
  console.log(`\n✅ Deleted ${result.count} phantom invoice(s) successfully.\n`);
}

main()
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
