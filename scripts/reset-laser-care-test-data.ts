/**
 * DEV ONLY: permanently remove Laser Care operational test data.
 *
 * Run from the repository root:
 *   npx ts-node scripts/reset-laser-care-test-data.ts --apply
 *
 * This intentionally preserves the center, users/accounts, roles/permissions,
 * services/templates, branches, subscriptions, and all website/configuration data.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '../packages/database/node_modules/@prisma/adapter-pg';
import {
  Prisma,
  PrismaClient,
} from '../packages/database/node_modules/@prisma/client';

const CONFIRM_RESET = true;

const TARGET = Object.freeze({
  centerId: '17c0114c-0c7a-4a72-9944-a01263d6cecf',
  name: 'Laser Care',
  slug: 'laser-care',
});

const OPERATIONAL_AUDIT_ACTIONS = [
  'APPOINTMENT_REMINDER_SENT',
  'BOOKING_REQUEST_ACCEPTED',
  'BOOKING_REQUEST_PATIENT_CREATED',
  'BOOKING_REQUEST_REJECTED',
  'TENANT_APPOINTMENT_CANCELLED',
  'TENANT_APPOINTMENT_CREATED',
  'TENANT_APPOINTMENT_RESTORED',
  'TENANT_APPOINTMENT_STATUS_CHANGED',
  'TENANT_APPOINTMENT_UPDATED',
  'TENANT_CREDIT_CREATED',
  'TENANT_CREDIT_USED',
  'TENANT_INVOICE_CANCELLED',
  'TENANT_INVOICE_CREATED',
  'TENANT_INVOICE_RESTORED',
  'TENANT_INVOICE_STATUS_CHANGED',
  'TENANT_PATIENT_CREATED',
  'TENANT_PATIENT_DELETED',
  'TENANT_PATIENT_RESTORED',
  'TENANT_PATIENT_STATUS_CHANGED',
  'TENANT_PATIENT_UPDATED',
  'TENANT_PAYMENT_ADDED',
] as const;

type DbClient = PrismaClient | Prisma.TransactionClient;

type Counts = {
  appointmentNotifications: number;
  appointments: number;
  bookingRequestTrackingLogs: number;
  bookingRequests: number;
  creditTransactions: number;
  invoices: number;
  notificationLogs: number;
  operationalAuditLogs: number;
  patientFollowUps: number;
  patientPortalTokens: number;
  patients: number;
  payments: number;
  sessions: number;
};

const COUNT_KEYS: ReadonlyArray<keyof Counts> = [
  'appointmentNotifications',
  'appointments',
  'bookingRequestTrackingLogs',
  'bookingRequests',
  'creditTransactions',
  'invoices',
  'notificationLogs',
  'operationalAuditLogs',
  'patientFollowUps',
  'patientPortalTokens',
  'patients',
  'payments',
  'sessions',
];

function readDatabaseUrl(): string {
  const envFiles = [
    resolve(process.cwd(), 'services/api/.env'),
    resolve(process.cwd(), 'packages/database/.env'),
    resolve(process.cwd(), '.env'),
  ];

  for (const file of envFiles) {
    if (!existsSync(file)) continue;
    const match = readFileSync(file, 'utf8').match(
      /^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/m,
    );
    if (match?.[1]) return match[1];
  }

  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error('DATABASE_URL was not found. No data was changed.');
}

function assertDevelopmentDatabase(connectionString: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run with NODE_ENV=production.');
  }

  const url = new URL(connectionString);
  const localHosts = new Set(['127.0.0.1', 'localhost', '::1']);
  const databaseName = url.pathname.replace(/^\//, '');

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Refusing to run against a non-PostgreSQL database.');
  }
  if (!localHosts.has(url.hostname)) {
    throw new Error(`Refusing to run against non-local host "${url.hostname}".`);
  }
  if (databaseName !== 'royalcare_dev') {
    throw new Error(`Refusing to run against database "${databaseName}".`);
  }
  if (!CONFIRM_RESET || !process.argv.includes('--apply')) {
    throw new Error(
      'Reset not confirmed. Set CONFIRM_RESET=true and run with --apply.',
    );
  }
}

const notificationWhere = (centerId: string): Prisma.NotificationWhereInput => ({
  centerId,
  OR: [
    { type: 'BOOKING_REQUEST_CREATED' },
    { eventKey: { startsWith: 'appointment:' } },
    { eventKey: { startsWith: 'booking-request:' } },
    { eventKey: { startsWith: 'follow-up:' } },
  ],
});

const auditWhere = (centerId: string): Prisma.AuditLogWhereInput => ({
  centerId,
  action: { in: [...OPERATIONAL_AUDIT_ACTIONS] },
});

async function getCounts(db: DbClient, centerId: string): Promise<Counts> {
  const operationalNotifications = notificationWhere(centerId);
  const [
    appointmentNotifications,
    appointments,
    bookingRequestTrackingLogs,
    bookingRequests,
    creditTransactions,
    invoices,
    notificationLogs,
    operationalAuditLogs,
    patientFollowUps,
    patientPortalTokens,
    patients,
    payments,
    sessions,
  ] = await Promise.all([
    db.notification.count({ where: operationalNotifications }),
    db.appointment.count({ where: { centerId } }),
    db.marketingTrackingLog.count({
      where: { centerId, bookingRequestId: { not: null } },
    }),
    db.bookingRequest.count({ where: { centerId } }),
    db.creditTransaction.count({ where: { centerId } }),
    db.invoice.count({ where: { centerId } }),
    db.notificationLog.count({
      where: { notification: operationalNotifications },
    }),
    db.auditLog.count({ where: auditWhere(centerId) }),
    db.patientFollowUp.count({ where: { centerId } }),
    db.patientPortalToken.count({ where: { centerId } }),
    db.patient.count({ where: { centerId } }),
    db.payment.count({ where: { centerId } }),
    db.session.count({ where: { centerId } }),
  ]);

  return {
    appointmentNotifications,
    appointments,
    bookingRequestTrackingLogs,
    bookingRequests,
    creditTransactions,
    invoices,
    notificationLogs,
    operationalAuditLogs,
    patientFollowUps,
    patientPortalTokens,
    patients,
    payments,
    sessions,
  };
}

function assertZero(counts: Counts): void {
  const remaining = COUNT_KEYS.filter((key) => counts[key] !== 0);
  if (remaining.length) {
    throw new Error(
      `Reset verification failed: ${remaining
        .map((key) => `${key}=${counts[key]}`)
        .join(', ')}`,
    );
  }
}

async function main(): Promise<void> {
  const connectionString = readDatabaseUrl();
  assertDevelopmentDatabase(connectionString);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  await prisma.$connect();
  try {
    const center = await prisma.center.findUnique({
      where: { id: TARGET.centerId },
      select: { id: true, name: true, slug: true },
    });

    if (
      !center ||
      center.id !== TARGET.centerId ||
      center.slug !== TARGET.slug ||
      center.name !== TARGET.name
    ) {
      throw new Error(
        'Laser Care identity check failed (expected exact id + slug + name). No data was changed.',
      );
    }

    console.log({ tenantId: center.id, centerId: center.id });
    const before = await getCounts(prisma, center.id);
    console.log('\nBefore deletion');
    console.table(before);

    const result = await prisma.$transaction(async (tx) => {
      // Lock the exact center row so its identity cannot change during the reset.
      const locked = await tx.$queryRaw<Array<{ id: string; name: string; slug: string }>>`
        SELECT id, name, slug FROM "Center"
        WHERE id = ${TARGET.centerId}::uuid
          AND slug = ${TARGET.slug}
          AND name = ${TARGET.name}
        FOR UPDATE
      `;
      if (locked.length !== 1) throw new Error('Transactional tenant lock failed.');

      const deleted: Counts = {
        notificationLogs: (
          await tx.notificationLog.deleteMany({
            where: { notification: notificationWhere(center.id) },
          })
        ).count,
        appointmentNotifications: (
          await tx.notification.deleteMany({ where: notificationWhere(center.id) })
        ).count,
        operationalAuditLogs: (
          await tx.auditLog.deleteMany({ where: auditWhere(center.id) })
        ).count,
        bookingRequestTrackingLogs: (
          await tx.marketingTrackingLog.deleteMany({
            where: { centerId: center.id, bookingRequestId: { not: null } },
          })
        ).count,
        payments: (await tx.payment.deleteMany({ where: { centerId: center.id } }))
          .count,
        creditTransactions: (
          await tx.creditTransaction.deleteMany({ where: { centerId: center.id } })
        ).count,
        patientPortalTokens: (
          await tx.patientPortalToken.deleteMany({ where: { centerId: center.id } })
        ).count,
        sessions: (await tx.session.deleteMany({ where: { centerId: center.id } }))
          .count,
        bookingRequests: (
          await tx.bookingRequest.deleteMany({ where: { centerId: center.id } })
        ).count,
        patientFollowUps: (
          await tx.patientFollowUp.deleteMany({ where: { centerId: center.id } })
        ).count,
        invoices: (await tx.invoice.deleteMany({ where: { centerId: center.id } }))
          .count,
        appointments: (
          await tx.appointment.deleteMany({ where: { centerId: center.id } })
        ).count,
        patients: (await tx.patient.deleteMany({ where: { centerId: center.id } }))
          .count,
      };

      const remaining = await getCounts(tx, center.id);
      assertZero(remaining);
      return { deleted, remaining };
    });

    console.log('\nDeleted tables summary');
    console.table(result.deleted);
    console.log('\nRemaining counts summary');
    console.table(result.remaining);
    console.log({ tenantId: center.id, centerId: center.id });
    console.log('\nDashboard statistics are query-derived; zero verification resets them.');
    console.log('No persisted dashboard cache or center-scoped counter exists to clear.');
    console.log('Patient attachment/image and queue/check-in tables: not present in the schema.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
