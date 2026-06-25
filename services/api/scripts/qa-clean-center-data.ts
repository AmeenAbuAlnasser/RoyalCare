import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@royalcare/db';
import { getApiDatabaseUrl } from '../src/common/config/database-url';

const targetCenterName = 'QA Recovery Center 1779095621868';
const targetCenterSlug = 'qa-recovery-1779095621868';

type CleanupCounts = {
  appointments: number;
  auditLogsKept: number;
  bookingRequests: number;
  centerExists: number;
  creditTransactions: number;
  invoices: number;
  notificationLogs: number;
  notifications: number;
  ownerUserExists: number;
  patientFollowUps: number;
  patientPortalTokens: number;
  patients: number;
  payments: number;
  sessions: number;
  subscriptionsKept: number;
};

function hasExecuteFlag() {
  return process.argv.includes('--execute');
}

function printCounts(title: string, counts: CleanupCounts) {
  console.log(`\n${title}`);
  console.table(counts);
}

async function getCounts(prisma: PrismaClient, centerId: string): Promise<CleanupCounts> {
  const center = await prisma.center.findUnique({
    where: { id: centerId },
    select: { ownerUserId: true },
  });

  const [
    appointments,
    auditLogsKept,
    bookingRequests,
    creditTransactions,
    invoices,
    notificationLogs,
    notifications,
    ownerUserExists,
    patientFollowUps,
    patientPortalTokens,
    patients,
    payments,
    sessions,
    subscriptionsKept,
  ] = await Promise.all([
    prisma.appointment.count({ where: { centerId } }),
    prisma.auditLog.count({ where: { centerId } }),
    prisma.bookingRequest.count({ where: { centerId } }),
    prisma.creditTransaction.count({ where: { centerId } }),
    prisma.invoice.count({ where: { centerId } }),
    prisma.notificationLog.count({ where: { notification: { centerId } } }),
    prisma.notification.count({ where: { centerId } }),
    center?.ownerUserId
      ? prisma.user.count({ where: { id: center.ownerUserId } })
      : Promise.resolve(0),
    prisma.patientFollowUp.count({ where: { centerId } }),
    prisma.patientPortalToken.count({ where: { centerId } }),
    prisma.patient.count({ where: { centerId } }),
    prisma.payment.count({ where: { centerId } }),
    prisma.session.count({ where: { centerId } }),
    prisma.subscription.count({ where: { centerId } }),
  ]);

  return {
    appointments,
    auditLogsKept,
    bookingRequests,
    centerExists: center ? 1 : 0,
    creditTransactions,
    invoices,
    notificationLogs,
    notifications,
    ownerUserExists,
    patientFollowUps,
    patientPortalTokens,
    patients,
    payments,
    sessions,
    subscriptionsKept,
  };
}

async function confirmOrExit(centerName: string) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `\nType the exact center name to delete QA data: ${centerName}\n> `,
    );

    if (answer !== centerName) {
      console.log('Confirmation did not match. No data was deleted.');
      process.exitCode = 1;
      return false;
    }

    return true;
  } finally {
    rl.close();
  }
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getApiDatabaseUrl() }),
  });

  await prisma.$connect();

  try {
    const centers = await prisma.center.findMany({
      where: {
        OR: [{ name: targetCenterName }, { slug: targetCenterSlug }],
      },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        slug: true,
        subscriptions: { select: { id: true } },
      },
    });

    if (centers.length !== 1) {
      throw new Error(
        `Expected exactly one center for name "${targetCenterName}" or slug "${targetCenterSlug}", found ${centers.length}.`,
      );
    }

    const center = centers[0];
    console.log('Target center found');
    console.log(`id: ${center.id}`);
    console.log(`name: ${center.name}`);
    console.log(`slug: ${center.slug}`);
    console.log(`ownerUserId: ${center.ownerUserId ?? 'none'}`);
    console.log(`subscriptions: ${center.subscriptions.length}`);

    const beforeCounts = await getCounts(prisma, center.id);
    printCounts('Counts before cleanup', beforeCounts);

    if (!hasExecuteFlag()) {
      console.log(
        '\nDry run only. Re-run with --execute to prompt for confirmation and delete QA data.',
      );
      return;
    }

    const confirmed = await confirmOrExit(center.name);
    if (!confirmed) return;

    const deleted = await prisma.$transaction(async (tx) => {
      const notificationLogs = await tx.notificationLog.deleteMany({
        where: { notification: { centerId: center.id } },
      });
      const payments = await tx.payment.deleteMany({ where: { centerId: center.id } });
      const creditTransactions = await tx.creditTransaction.deleteMany({
        where: { centerId: center.id },
      });
      const patientFollowUps = await tx.patientFollowUp.deleteMany({
        where: { centerId: center.id },
      });
      const sessions = await tx.session.deleteMany({ where: { centerId: center.id } });
      const bookingRequests = await tx.bookingRequest.deleteMany({
        where: { centerId: center.id },
      });
      const invoices = await tx.invoice.deleteMany({ where: { centerId: center.id } });
      const patientPortalTokens = await tx.patientPortalToken.deleteMany({
        where: { centerId: center.id },
      });
      const appointments = await tx.appointment.deleteMany({
        where: { centerId: center.id },
      });
      const notifications = await tx.notification.deleteMany({
        where: { centerId: center.id },
      });
      const patients = await tx.patient.deleteMany({ where: { centerId: center.id } });

      return {
        appointments: appointments.count,
        bookingRequests: bookingRequests.count,
        creditTransactions: creditTransactions.count,
        invoices: invoices.count,
        notificationLogs: notificationLogs.count,
        notifications: notifications.count,
        patientFollowUps: patientFollowUps.count,
        patientPortalTokens: patientPortalTokens.count,
        patients: patients.count,
        payments: payments.count,
        sessions: sessions.count,
      };
    });

    console.log('\nDeleted records');
    console.table(deleted);

    const afterCounts = await getCounts(prisma, center.id);
    printCounts('Counts after cleanup', afterCounts);
    console.log('\nCleanup complete. Center, owner user, subscriptions, plans, and audit logs were not deleted.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
