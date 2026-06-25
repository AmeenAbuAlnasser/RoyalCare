/**
 * QA seed: multi-session follow-up visibility.
 *
 * Creates (or reuses) a service, patient, and appointment, then explicitly
 * writes 8 follow-up rows with dates spread across past / today / this-week /
 * future so every filter tab can be tested without waiting 30 real days.
 *
 * Run from services/api/  (uses ts-node + tsconfig-paths like other QA scripts)
 *   npm run qa:seed-followups-visibility
 *
 * or directly:
 *   npx ts-node -r tsconfig-paths/register scripts/qa-seed-followups-visibility.ts
 *
 * Idempotent:  safe to rerun — finds existing records before creating new ones.
 * Read-safe:   pass --dry-run to preview without writing anything.
 * Non-destructive: never deletes data, never touches other centers.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import {
  PatientFollowUpSourceType,
  PrismaClient,
  type PatientFollowUpStatus,
} from '@royalcare/db';
import { getApiDatabaseUrl } from '../src/common/config/database-url';

// ── QA constants ─────────────────────────────────────────────────────────────

const QA_CENTER_NAME = 'QA Recovery Center 1779095621868';

/** Unique marker in the service name — used to detect an existing QA record. */
const QA_SERVICE_NAME_EN = 'QA Monthly Follow-up Service';
const QA_SERVICE_NAME_AR = 'خدمة QA متابعة شهرية';

const QA_PATIENT_PHONE  = '0598001122';
const QA_PATIENT_NAME   = 'QA Follow-up Plan Patient';
const QA_PATIENT_NAME_AR = 'مريض QA خطة متابعة';

const TOTAL_SESSIONS = 8;
const INTERVAL_DAYS  = 30;

// ── Date helpers ─────────────────────────────────────────────────────────────

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function shiftDays(base: Date, days: number): Date {
  const d = new Date(base.toISOString().slice(0, 10) + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function statusForDate(d: Date, today: Date): PatientFollowUpStatus {
  return d.getTime() <= today.getTime() ? 'DUE' : 'UPCOMING';
}

// ── Logging helpers ───────────────────────────────────────────────────────────

const DRY_RUN   = process.argv.includes('--dry-run');
const RESET_MIX = process.argv.includes('--reset-mix');

function banner(msg: string) {
  const line = '─'.repeat(msg.length + 4);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${msg}  │`);
  console.log(`└${line}┘`);
}

function pass(msg: string)  { console.log(`  ✅  ${msg}`); }
function info(msg: string)  { console.log(`  ℹ️   ${msg}`); }
function warn(msg: string)  { console.log(`  ⚠️   ${msg}`); }
function write(msg: string) { console.log(`  ✏️   ${DRY_RUN ? '[DRY] ' : ''}${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const databaseUrl = getApiDatabaseUrl();
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  const today = todayUtc();

  // ── Step 0: Locate QA center ─────────────────────────────────────────────

  banner('Step 0  Locate QA center');

  const center = await prisma.center.findFirst({
    where: { name: QA_CENTER_NAME },
    select: { id: true, name: true, ownerUserId: true },
  });

  if (!center) {
    console.error(`  ❌  Center "${QA_CENTER_NAME}" not found. Is the QA seed loaded?`);
    process.exitCode = 1;
    return;
  }

  pass(`${center.name}  (${center.id})`);

  // ── Step 1: Find or create QA service ─────────────────────────────────────

  banner('Step 1  QA service');

  let service = await prisma.service.findFirst({
    where: { centerId: center.id, nameEn: QA_SERVICE_NAME_EN },
    select: {
      id: true, nameEn: true, nameAr: true,
      followUpEnabled: true, totalRecommendedSessions: true,
      defaultIntervalDays: true, durationMinutes: true,
    },
  });

  if (service) {
    pass(`Existing service found: "${service.nameEn}" (${service.id})`);
    info(`followUpEnabled=${service.followUpEnabled}  sessions=${service.totalRecommendedSessions}  interval=${service.defaultIntervalDays}d  duration=${service.durationMinutes}min`);
  } else {
    write(`Creating service "${QA_SERVICE_NAME_EN}"`);

    if (!DRY_RUN) {
      service = await prisma.service.create({
        data: {
          centerId: center.id,
          nameEn: QA_SERVICE_NAME_EN,
          nameAr: QA_SERVICE_NAME_AR,
          nameHe: QA_SERVICE_NAME_EN,
          durationMinutes: 15,
          followUpEnabled: true,
          defaultIntervalDays: INTERVAL_DAYS,
          totalRecommendedSessions: TOTAL_SESSIONS,
          autoCreateNextReminder: true,
          isActive: true,
          currency: 'ILS',
        },
        select: {
          id: true, nameEn: true, nameAr: true,
          followUpEnabled: true, totalRecommendedSessions: true,
          defaultIntervalDays: true, durationMinutes: true,
        },
      });
      pass(`Service created: ${service.id}`);
    } else {
      pass('[DRY] Would create service');
      service = null;
    }
  }

  const serviceId = service?.id;

  // ── Step 2: Find or create QA patient ────────────────────────────────────

  banner('Step 2  QA patient');

  let patient = await prisma.patient.findFirst({
    where: { centerId: center.id, phone: QA_PATIENT_PHONE },
    select: { id: true, fullName: true, phone: true },
  });

  if (patient) {
    pass(`Existing patient found: "${patient.fullName}" (${patient.id})`);
  } else {
    write(`Creating patient "${QA_PATIENT_NAME}" / ${QA_PATIENT_PHONE}`);

    if (!DRY_RUN) {
      patient = await prisma.patient.create({
        data: {
          centerId: center.id,
          fullName: QA_PATIENT_NAME,
          fullNameEn: QA_PATIENT_NAME,
          fullNameAr: QA_PATIENT_NAME_AR,
          phone: QA_PATIENT_PHONE,
          status: 'ACTIVE',
        },
        select: { id: true, fullName: true, phone: true },
      });
      pass(`Patient created: ${patient.id}`);
    } else {
      pass('[DRY] Would create patient');
      patient = null;
    }
  }

  const patientId = patient?.id;

  // ── Step 3: Find a staff user in the center ──────────────────────────────

  banner('Step 3  Staff user (required for appointment)');

  const staffRole = await prisma.userRole.findFirst({
    where: {
      centerId: center.id,
      status: 'ACTIVE',
      role: {
        key: { in: ['CENTER_MANAGER', 'DOCTOR', 'STAFF'] },
        status: 'ACTIVE',
      },
      user: { deletedAt: null, status: 'ACTIVE' },
    },
    select: { userId: true, user: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (!staffRole) {
    console.error('  ❌  No active staff/doctor/manager found in this center.');
    console.error('      The appointment requires a valid staffUserId.');
    console.error('      Please add at least one provider to the QA center and rerun.');
    process.exitCode = 1;
    return;
  }

  const staffUserId  = staffRole.userId;
  const createdById  = center.ownerUserId ?? staffUserId;

  pass(`Staff user: "${staffRole.user.fullName}" (${staffUserId})`);

  // ── Step 4: Find or create QA appointment ─────────────────────────────────
  //
  // Appointment date = today - 61 days so that the auto-generated plan would
  // place session 1 at today-31, session 2 at today-1 … but we skip auto-
  // generation and write explicit rows below.

  banner('Step 4  QA appointment (past, COMPLETED)');

  const apptDate = shiftDays(today, -61);

  let appointment = patientId && serviceId
    ? await prisma.appointment.findFirst({
        where: {
          centerId: center.id,
          patientId,
          serviceId,
          status: 'COMPLETED',
        },
        select: { id: true, appointmentDate: true, status: true },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  if (appointment) {
    pass(`Existing COMPLETED appointment found: ${appointment.id}  date=${isoDate(appointment.appointmentDate)}`);
  } else {
    write(`Creating COMPLETED appointment on ${isoDate(apptDate)}`);

    if (!DRY_RUN && patientId && serviceId) {
      appointment = await prisma.appointment.create({
        data: {
          centerId: center.id,
          patientId,
          serviceId,
          staffUserId,
          createdByUserId: createdById,
          appointmentDate: apptDate,
          startTime: '10:00',
          endTime: '10:15',
          durationMinutes: 15,
          status: 'COMPLETED',
          completedAt: apptDate,
        },
        select: { id: true, appointmentDate: true, status: true },
      });
      pass(`Appointment created: ${appointment.id}`);
    } else {
      pass('[DRY] Would create appointment');
      appointment = null;
    }
  }

  const appointmentId = appointment?.id;

  // ── Step 5: Build the 8 follow-up rows ────────────────────────────────────
  //
  // Due dates are intentionally hand-crafted so every filter tab is testable:
  //
  //  session  status    due date
  //  ─────────────────────────────────────────────────────────────────────────
  //    1      MISSED    today − 30 d   (overdue, past)
  //    2      DUE       TODAY          ← highlighted "Next Follow-up"
  //    3      UPCOMING  today + 4 d    ← appears in "This Week"
  //    4      UPCOMING  today + 34 d
  //    5      UPCOMING  today + 64 d
  //    6      UPCOMING  today + 94 d
  //    7      UPCOMING  today + 124 d
  //    8      UPCOMING  today + 154 d

  banner('Step 5  Follow-up rows (8 sessions)');

  // Target date/status per session.
  // This mix covers every filter tab:
  //   session 1 → MISSED    (overdue, past)       OVERDUE filter
  //   session 2 → DUE today                        TODAY + THIS_WEEK
  //   session 3 → UPCOMING this week (+4 days)     THIS_WEEK + UPCOMING
  //   session 4 → CONTACTED (future date)          CONTACTED filter
  //   session 5 → BOOKED    (future date)          BOOKED filter
  //   session 6 → COMPLETED (past date)            COMPLETED filter
  //   session 7 → UPCOMING  (+34 days)             UPCOMING
  //   session 8 → UPCOMING  (+64 days)             UPCOMING
  const planDates: Array<{ session: number; offset: number; forceStatus?: PatientFollowUpStatus }> = [
    { session: 1, offset: -30, forceStatus: 'MISSED'    },
    { session: 2, offset:   0, forceStatus: 'DUE'       },
    { session: 3, offset:   4                            },
    { session: 4, offset:  34, forceStatus: 'CONTACTED' },
    { session: 5, offset:  64, forceStatus: 'BOOKED'    },
    { session: 6, offset: -10, forceStatus: 'COMPLETED' },
    { session: 7, offset:  94                            },
    { session: 8, offset: 124                            },
  ];

  const title = QA_SERVICE_NAME_AR;
  const createdIds: string[] = [];

  for (const entry of planDates) {
    const dueDate = shiftDays(today, entry.offset);
    const status: PatientFollowUpStatus = entry.forceStatus ?? statusForDate(dueDate, today);

    // Check for existing row
    const existing = appointmentId && patientId && serviceId
      ? await prisma.patientFollowUp.findFirst({
          where: {
            centerId: center.id,
            patientId,
            serviceId,
            sessionNumber: entry.session,
            status: { not: 'CANCELLED' },
          },
          select: { id: true, dueDate: true, status: true },
        })
      : null;

    if (existing) {
      // --reset-mix: force the status/date to the target values
      if (RESET_MIX && !DRY_RUN) {
        await prisma.patientFollowUp.update({
          where: { id: existing.id },
          data: { dueDate, status },
        });
        write(`Session ${entry.session}: RESET  id=${existing.id.slice(0, 8)}  due=${isoDate(dueDate)}  status=${status}`);
      } else {
        pass(`Session ${entry.session}: exists  id=${existing.id.slice(0, 8)}  due=${isoDate(existing.dueDate)}  status=${existing.status}${RESET_MIX ? '  [add --no-dry-run to reset]' : ''}`);
      }
      createdIds.push(existing.id);
      continue;
    }

    write(`Session ${entry.session}: due=${isoDate(dueDate)}  status=${status}`);

    if (!DRY_RUN && patientId && serviceId && appointmentId) {
      const row = await prisma.patientFollowUp.create({
        data: {
          centerId: center.id,
          patientId,
          serviceId,
          appointmentId,
          sourceType: PatientFollowUpSourceType.APPOINTMENT_COMPLETED,
          title,
          sessionNumber: entry.session,
          dueDate,
          status,
        },
        select: { id: true },
      });
      createdIds.push(row.id);
    }
  }

  // ── Step 6: Print final state ─────────────────────────────────────────────

  banner('Step 6  Final follow-up plan');

  if (!DRY_RUN && patientId && serviceId) {
    const rows = await prisma.patientFollowUp.findMany({
      where: {
        centerId: center.id,
        patientId,
        serviceId,
        status: { not: 'CANCELLED' },
      },
      select: { id: true, sessionNumber: true, dueDate: true, status: true },
      orderBy: { sessionNumber: 'asc' },
    });

    console.log('');
    console.table(
      rows.map((r) => ({
        session:  r.sessionNumber,
        dueDate:  isoDate(r.dueDate),
        status:   r.status,
        relation: r.dueDate < today
          ? 'PAST'
          : isoDate(r.dueDate) === isoDate(today)
          ? 'TODAY  ← Next Follow-up'
          : r.dueDate < shiftDays(today, 7)
          ? 'THIS WEEK'
          : 'UPCOMING',
        id: r.id.slice(0, 8),
      })),
    );

    pass(`Total follow-up rows: ${rows.length} / ${TOTAL_SESSIONS}`);
  }

  // ── Step 7: QA instructions ───────────────────────────────────────────────

  banner('Step 7  QA checklist — open the browser now');

  const todayStr    = isoDate(today);
  const thisWeekStr = isoDate(shiftDays(today, 4));

  console.log(`
  Patient   : ${QA_PATIENT_NAME} / ${QA_PATIENT_NAME_AR}
  Phone     : ${QA_PATIENT_PHONE}
  Service   : ${QA_SERVICE_NAME_EN} / ${QA_SERVICE_NAME_AR}
  Center    : ${QA_CENTER_NAME}

  Dates at a glance:
    session 1  MISSED    today ${todayStr} − 30d      [past, overdue]
    session 2  DUE       ${todayStr}                  [TODAY → المتابعة التالية]
    session 3  UPCOMING  ${todayStr} + 4d  [THIS WEEK]
    session 4  CONTACTED ${todayStr} + 34d [CONTACTED filter]
    session 5  BOOKED    ${todayStr} + 64d [BOOKED filter]
    session 6  COMPLETED ${todayStr} - 10d [COMPLETED filter]
    session 7  UPCOMING  ${todayStr} + 94d [UPCOMING]
    session 8  UPCOMING  ${todayStr} + 124d [UPCOMING]

  ┌──────────────────────────────────────────────────────────────────────┐
  │  QA FILTER CHECKS — one-to-one mapping                              │
  ├─────────────┬────────────────────────────────────────────────────────┤
  │  TODAY      │ session 2 (DUE today)                                 │
  │  THIS_WEEK  │ sessions 2 + 3 (today + 4 days)                       │
  │  OVERDUE    │ session 1 (MISSED, past due)                          │
  │  UPCOMING   │ sessions 3, 7, 8 (future UPCOMING)                    │
  │  CONTACTED  │ session 4                                              │
  │  BOOKED     │ session 5                                              │
  │  COMPLETED  │ session 6                                              │
  ├─────────────┴────────────────────────────────────────────────────────┤
  │  EXPAND checks:                                                      │
  │    Matching sessions appear FIRST (full opacity)                     │
  │    Other sessions appear below in muted "Other sessions in plan" box │
  ├──────────────────────────────────────────────────────────────────────┤
  │  HIGHLIGHT  session 2 gets المتابعة التالية badge                   │
  └──────────────────────────────────────────────────────────────────────┘

  Reset QA mix after testing:
    npx ts-node -r tsconfig-paths/register scripts/qa-seed-followups-visibility.ts --reset-mix
  `);

  if (DRY_RUN) {
    warn('Dry-run mode — nothing was written. Rerun without --dry-run to create data.');
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err: unknown) => {
  console.error('\n❌  Seed error:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
