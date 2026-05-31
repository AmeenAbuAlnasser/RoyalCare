// One-time script: delete all tenant data for a specific center by name.
// The Center record itself is preserved.
// Run from services/api: node clear-center-data.js

'use strict';

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../packages/database/node_modules/@prisma/client');

const CONNECTION_STRING =
  'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public';

const CENTER_NAME = 'Jenin Care';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: CONNECTION_STRING }),
  });

  await prisma.$connect();

  try {
    const center = await prisma.center.findFirst({
      where: { name: CENTER_NAME },
      select: { id: true, name: true, status: true },
    });

    if (!center) {
      console.log(`Center "${CENTER_NAME}" not found. Aborting.`);
      return;
    }

    console.log(`Found: "${center.name}"  id=${center.id}  status=${center.status}`);
    console.log('Starting deletion...\n');

    const centerId = center.id;

    const counts = await prisma.$transaction(
      async (tx) => {
        // 1. Payment — Restrict on Patient; delete before Patient, Invoice
        const payments = await tx.payment.deleteMany({ where: { centerId } });

        // 2. CreditTransaction — Restrict on Patient; delete before Patient
        const creditTransactions = await tx.creditTransaction.deleteMany({ where: { centerId } });

        // 3. Invoice — Restrict on Patient and Service; Payments already gone
        const invoices = await tx.invoice.deleteMany({ where: { centerId } });

        // 4. Session — Cascade on Customer; delete before Customer
        const sessions = await tx.session.deleteMany({ where: { centerId } });

        // 5. Notification — SetNull on Customer; safe at any point
        const notifications = await tx.notification.deleteMany({ where: { centerId } });

        // 6. Appointment — Restrict on Patient and Service; delete before both
        const appointments = await tx.appointment.deleteMany({ where: { centerId } });

        // 7. Patient — no remaining Restrict references
        const patients = await tx.patient.deleteMany({ where: { centerId } });

        // 8. Service — no remaining Restrict references
        const services = await tx.service.deleteMany({ where: { centerId } });

        // 9. Customer — Sessions/Notifications already deleted
        const customers = await tx.customer.deleteMany({ where: { centerId } });

        // 10. CenterInternalNote — Restrict on User (not deleted), Cascade on Center
        const internalNotes = await tx.centerInternalNote.deleteMany({ where: { centerId } });

        // 11. DynamicPage
        const dynamicPages = await tx.dynamicPage.deleteMany({ where: { centerId } });

        // 12. BrandingSettings
        const brandingSettings = await tx.brandingSettings.deleteMany({ where: { centerId } });

        // 13. Domain
        const domains = await tx.domain.deleteMany({ where: { centerId } });

        // 14. Subscription
        const subscriptions = await tx.subscription.deleteMany({ where: { centerId } });

        // 15. UserRole (center-staff assignments)
        const userRoles = await tx.userRole.deleteMany({ where: { centerId } });

        // 16. Role (center-specific; cascades to RolePermission + remaining UserRole)
        const roles = await tx.role.deleteMany({ where: { centerId } });

        return {
          payments: payments.count,
          creditTransactions: creditTransactions.count,
          invoices: invoices.count,
          sessions: sessions.count,
          notifications: notifications.count,
          appointments: appointments.count,
          patients: patients.count,
          services: services.count,
          customers: customers.count,
          internalNotes: internalNotes.count,
          dynamicPages: dynamicPages.count,
          brandingSettings: brandingSettings.count,
          domains: domains.count,
          subscriptions: subscriptions.count,
          userRoles: userRoles.count,
          roles: roles.count,
        };
      },
      { timeout: 60000 },
    );

    console.log('Deleted record counts:');
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table.padEnd(22)} ${count}`);
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n  ${'TOTAL'.padEnd(22)} ${total}`);
    console.log('\nCenter record preserved. Done.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
