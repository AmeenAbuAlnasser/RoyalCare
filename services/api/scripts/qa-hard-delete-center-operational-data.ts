import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@royalcare/db';
import { getApiDatabaseUrl } from '../src/common/config/database-url';

const targetCenterName = 'QA Recovery Center 1779095621868';

type OperationalCounts = {
  appointments: number;
  bookingRequests: number;
  creditTransactions: number;
  customers: number;
  invoices: number;
  marketingTrackingLogsForBookings: number;
  notificationLogs: number;
  notifications: number;
  patientFollowUps: number;
  patientPortalTokens: number;
  patients: number;
  payments: number;
  sessions: number;
};

type SafetyCounts = {
  auditLogsKept: number;
  centerExists: number;
  ownerUserExists: number;
  servicesKept: number;
  subscriptionsKept: number;
  userRolesKept: number;
};

const operationalKeys: Array<keyof OperationalCounts> = [
  'appointments',
  'bookingRequests',
  'creditTransactions',
  'customers',
  'invoices',
  'marketingTrackingLogsForBookings',
  'notificationLogs',
  'notifications',
  'patientFollowUps',
  'patientPortalTokens',
  'patients',
  'payments',
  'sessions',
];

function printTable(title: string, counts: Record<string, number>) {
  console.log(`\n${title}`);
  console.table(counts);
}

function assertAllOperationalCountsZero(counts: OperationalCounts) {
  const remaining = operationalKeys
    .filter((key) => counts[key] > 0)
    .map((key) => `${key}: ${counts[key]}`);

  if (remaining.length > 0) {
    throw new Error(
      `Cleanup incomplete. Remaining target operational records: ${remaining.join(', ')}`,
    );
  }
}

async function findTargetCenter(prisma: PrismaClient) {
  const centers = await prisma.center.findMany({
    where: { name: targetCenterName },
    select: {
      id: true,
      name: true,
      ownerUserId: true,
      slug: true,
    },
  });

  if (centers.length !== 1) {
    throw new Error(
      `Expected exactly one center named "${targetCenterName}", found ${centers.length}. No data was deleted.`,
    );
  }

  return centers[0];
}

async function getOperationalCounts(
  prisma: PrismaClient,
  centerId: string,
): Promise<OperationalCounts> {
  const [
    appointments,
    bookingRequests,
    creditTransactions,
    customers,
    invoices,
    marketingTrackingLogsForBookings,
    notificationLogs,
    notifications,
    patientFollowUps,
    patientPortalTokens,
    patients,
    payments,
    sessions,
  ] = await Promise.all([
    prisma.appointment.count({ where: { centerId } }),
    prisma.bookingRequest.count({ where: { centerId } }),
    prisma.creditTransaction.count({ where: { centerId } }),
    prisma.customer.count({ where: { centerId } }),
    prisma.invoice.count({ where: { centerId } }),
    prisma.marketingTrackingLog.count({
      where: { centerId, bookingRequestId: { not: null } },
    }),
    prisma.notificationLog.count({ where: { notification: { centerId } } }),
    prisma.notification.count({ where: { centerId } }),
    prisma.patientFollowUp.count({ where: { centerId } }),
    prisma.patientPortalToken.count({ where: { centerId } }),
    prisma.patient.count({ where: { centerId } }),
    prisma.payment.count({ where: { centerId } }),
    prisma.session.count({ where: { centerId } }),
  ]);

  return {
    appointments,
    bookingRequests,
    creditTransactions,
    customers,
    invoices,
    marketingTrackingLogsForBookings,
    notificationLogs,
    notifications,
    patientFollowUps,
    patientPortalTokens,
    patients,
    payments,
    sessions,
  };
}

async function getSafetyCounts(
  prisma: PrismaClient,
  centerId: string,
  ownerUserId: string | null,
): Promise<SafetyCounts> {
  const [
    auditLogsKept,
    centerExists,
    ownerUserExists,
    servicesKept,
    subscriptionsKept,
    userRolesKept,
  ] = await Promise.all([
    prisma.auditLog.count({ where: { centerId } }),
    prisma.center.count({ where: { id: centerId } }),
    ownerUserId ? prisma.user.count({ where: { id: ownerUserId } }) : Promise.resolve(0),
    prisma.service.count({ where: { centerId } }),
    prisma.subscription.count({ where: { centerId } }),
    prisma.userRole.count({ where: { centerId } }),
  ]);

  return {
    auditLogsKept,
    centerExists,
    ownerUserExists,
    servicesKept,
    subscriptionsKept,
    userRolesKept,
  };
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getApiDatabaseUrl() }),
  });

  await prisma.$connect();

  try {
    const center = await findTargetCenter(prisma);
    console.log('Target center found');
    console.log(`id: ${center.id}`);
    console.log(`name: ${center.name}`);
    console.log(`slug: ${center.slug}`);
    console.log(`ownerUserId: ${center.ownerUserId ?? 'none'}`);

    const beforeOperationalCounts = await getOperationalCounts(prisma, center.id);
    const beforeSafetyCounts = await getSafetyCounts(
      prisma,
      center.id,
      center.ownerUserId,
    );
    printTable('BEFORE operational counts', beforeOperationalCounts);
    printTable('BEFORE protected records kept', beforeSafetyCounts);

    const deleted = await prisma.$transaction(async (tx) => {
      const notificationLogs = await tx.notificationLog.deleteMany({
        where: { notification: { centerId: center.id } },
      });
      const marketingTrackingLogsForBookings =
        await tx.marketingTrackingLog.deleteMany({
          where: { centerId: center.id, bookingRequestId: { not: null } },
        });
      const payments = await tx.payment.deleteMany({
        where: { centerId: center.id },
      });
      const creditTransactions = await tx.creditTransaction.deleteMany({
        where: { centerId: center.id },
      });
      const patientFollowUps = await tx.patientFollowUp.deleteMany({
        where: { centerId: center.id },
      });
      const sessions = await tx.session.deleteMany({
        where: { centerId: center.id },
      });
      const bookingRequests = await tx.bookingRequest.deleteMany({
        where: { centerId: center.id },
      });
      const invoices = await tx.invoice.deleteMany({
        where: { centerId: center.id },
      });
      const patientPortalTokens = await tx.patientPortalToken.deleteMany({
        where: { centerId: center.id },
      });
      const appointments = await tx.appointment.deleteMany({
        where: { centerId: center.id },
      });
      const notifications = await tx.notification.deleteMany({
        where: { centerId: center.id },
      });
      const patients = await tx.patient.deleteMany({
        where: { centerId: center.id },
      });
      const customers = await tx.customer.deleteMany({
        where: { centerId: center.id },
      });

      return {
        appointments: appointments.count,
        bookingRequests: bookingRequests.count,
        creditTransactions: creditTransactions.count,
        customers: customers.count,
        invoices: invoices.count,
        marketingTrackingLogsForBookings: marketingTrackingLogsForBookings.count,
        notificationLogs: notificationLogs.count,
        notifications: notifications.count,
        patientFollowUps: patientFollowUps.count,
        patientPortalTokens: patientPortalTokens.count,
        patients: patients.count,
        payments: payments.count,
        sessions: sessions.count,
      } satisfies OperationalCounts;
    });

    printTable('DELETED operational counts', deleted);

    const afterOperationalCounts = await getOperationalCounts(prisma, center.id);
    const afterSafetyCounts = await getSafetyCounts(
      prisma,
      center.id,
      center.ownerUserId,
    );
    printTable('AFTER operational counts', afterOperationalCounts);
    printTable('AFTER protected records kept', afterSafetyCounts);
    assertAllOperationalCountsZero(afterOperationalCounts);

    if (afterSafetyCounts.centerExists !== 1) {
      throw new Error('Safety check failed: target center no longer exists.');
    }

    if (center.ownerUserId && afterSafetyCounts.ownerUserExists !== 1) {
      throw new Error('Safety check failed: target owner user no longer exists.');
    }

    console.log('\nAll target operational data is zero.');
    console.log('Center, owner/user, staff/users, subscriptions, plans, settings, services, and audit logs were not deleted.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
