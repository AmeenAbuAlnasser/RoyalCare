/**
 * QA verification script for multi-session follow-up scheduling.
 *
 * Usage (run from services/api/):
 *   # Step 1 – read-only report
 *   npx ts-node -r tsconfig-paths/register scripts/qa-followups-plan-check.ts
 *
 *   # Step 2 – move session 2 due date to today so filter checks become testable
 *   npx ts-node -r tsconfig-paths/register scripts/qa-followups-plan-check.ts --set-session2-today
 *
 *   # Step 3 – mark session 2 completed (status transition test)
 *   npx ts-node -r tsconfig-paths/register scripts/qa-followups-plan-check.ts --complete-session2
 *
 *   # Step 4 – shift session 3 due date 50 days into the future (date-edit test)
 *   npx ts-node -r tsconfig-paths/register scripts/qa-followups-plan-check.ts --shift-session3-50
 *
 *   # Step 5 – restore session 2 to UPCOMING for re-testing
 *   npx ts-node -r tsconfig-paths/register scripts/qa-followups-plan-check.ts --restore-session2
 *
 * Never deletes data.  Never touches other centers.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@royalcare/db';
import { getApiDatabaseUrl } from '../src/common/config/database-url';

// ── constants ────────────────────────────────────────────────────────────────

const QA_CENTER_NAME = 'QA Recovery Center 1779095621868';

const FLAG_SET_SESSION2_TODAY  = '--set-session2-today';
const FLAG_COMPLETE_SESSION2   = '--complete-session2';
const FLAG_SHIFT_SESSION3_50   = '--shift-session3-50';
const FLAG_RESTORE_SESSION2    = '--restore-session2';

// ── helpers ──────────────────────────────────────────────────────────────────

function has(flag: string) {
  return process.argv.includes(flag);
}

function banner(msg: string) {
  const line = '─'.repeat(msg.length + 4);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${msg}  │`);
  console.log(`└${line}┘`);
}

function pass(msg: string)  { console.log(`  ✅  ${msg}`); }
function fail(msg: string)  { console.log(`  ❌  ${msg}`); }
function info(msg: string)  { console.log(`  ℹ️   ${msg}`); }
function warn(msg: string)  { console.log(`  ⚠️   ${msg}`); }

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date.toISOString().slice(0, 10) + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const databaseUrl = getApiDatabaseUrl();
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  // ── 0. Locate QA center ───────────────────────────────────────────────────

  banner('0. Locating QA center');

  const center = await prisma.center.findFirst({
    where: { name: QA_CENTER_NAME },
    select: { id: true, name: true },
  });

  if (!center) {
    fail(`Center "${QA_CENTER_NAME}" not found. Is the QA seed loaded?`);
    process.exit(1);
  }

  pass(`Center found: ${center.name} (${center.id})`);

  // ── 1. Find a patient with a multi-session follow-up plan ─────────────────

  banner('1. Finding patient with 8-session follow-up plan');

  const followUpRows = await prisma.patientFollowUp.findMany({
    where: {
      centerId: center.id,
      status: { not: 'CANCELLED' },
      service: { totalRecommendedSessions: { gte: 2 } },
    },
    select: {
      id: true,
      patientId: true,
      serviceId: true,
      appointmentId: true,
      sessionNumber: true,
      dueDate: true,
      status: true,
      sourceType: true,
      service: {
        select: {
          nameEn: true, nameAr: true,
          totalRecommendedSessions: true,
          defaultIntervalDays: true,
          followUpEnabled: true,
        },
      },
      patient: {
        select: { fullName: true, phone: true },
      },
    },
    orderBy: [{ patientId: 'asc' }, { sessionNumber: 'asc' }],
  });

  if (followUpRows.length === 0) {
    fail('No multi-session follow-ups found. Create an appointment with totalRecommendedSessions >= 2 first.');
    process.exit(1);
  }

  // Group by patient+service
  const planMap = new Map<string, typeof followUpRows>();
  for (const row of followUpRows) {
    const key = `${row.patientId}::${row.serviceId}`;
    if (!planMap.has(key)) planMap.set(key, []);
    planMap.get(key)!.push(row);
  }

  info(`Follow-up groups (patient+service): ${planMap.size}`);

  // Pick the group with the most sessions
  let bestKey = '';
  let bestRows: typeof followUpRows = [];
  for (const [key, rows] of planMap.entries()) {
    if (rows.length > bestRows.length) {
      bestKey = key;
      bestRows = rows;
    }
  }

  const firstRow = bestRows[0];
  const patientName = firstRow.patient.fullName;
  const serviceName = firstRow.service?.nameEn || firstRow.service?.nameAr || '-';
  const totalSessions = firstRow.service?.totalRecommendedSessions ?? '?';

  info(`Using patient: "${patientName}" (${firstRow.patientId.slice(0, 8)})`);
  info(`Service: "${serviceName}" | totalRecommendedSessions: ${totalSessions}`);
  info(`Follow-ups in DB for this patient+service: ${bestRows.length}`);

  // ── 2. Database verification ──────────────────────────────────────────────

  banner('2. Database verification — all follow-up rows');

  console.log('\n  Sessions in DB:');
  console.table(
    bestRows.map((r) => ({
      session:    r.sessionNumber ?? '-',
      dueDate:    isoDate(r.dueDate),
      status:     r.status,
      source:     r.sourceType,
      id:         r.id.slice(0, 8),
    })),
  );

  const sessionNumbers = bestRows.map((r) => r.sessionNumber ?? 0).sort((a, b) => a - b);
  const expectedSessions = Array.from({ length: Number(totalSessions) }, (_, i) => i + 1);
  const missingSessions  = expectedSessions.filter((n) => !sessionNumbers.includes(n));
  const extraSessions    = sessionNumbers.filter((n) => !expectedSessions.includes(n));

  if (bestRows.length === Number(totalSessions) && missingSessions.length === 0) {
    pass(`All ${totalSessions} sessions present`);
  } else {
    fail(`Expected ${totalSessions} sessions, found ${bestRows.length}`);
    if (missingSessions.length) warn(`Missing sessions: ${missingSessions.join(', ')}`);
    if (extraSessions.length)   warn(`Extra sessions:   ${extraSessions.join(', ')}`);
  }

  // ── 3. Optional mutation: set session 2 due date to today ─────────────────

  const session2Row = bestRows.find((r) => r.sessionNumber === 2);
  const today = todayUtc();

  if (has(FLAG_SET_SESSION2_TODAY)) {
    banner('3. Setting session 2 due date to today');

    if (!session2Row) {
      fail('Session 2 row not found — cannot update.');
    } else {
      await prisma.patientFollowUp.update({
        where: { id: session2Row.id },
        data: {
          dueDate: today,
          status: 'DUE',
        },
      });
      pass(`Session 2 (${session2Row.id.slice(0, 8)}) due date set to ${isoDate(today)}, status → DUE`);
      info('Now run the QA filter checks in the browser (see checklist below).');
    }
  }

  // ── 4. Optional mutation: mark session 2 completed ────────────────────────

  if (has(FLAG_COMPLETE_SESSION2)) {
    banner('4. Marking session 2 COMPLETED');

    if (!session2Row) {
      fail('Session 2 row not found — cannot update.');
    } else {
      await prisma.patientFollowUp.update({
        where: { id: session2Row.id },
        data: { status: 'COMPLETED' },
      });
      pass(`Session 2 (${session2Row.id.slice(0, 8)}) status → COMPLETED`);

      const session3Row = bestRows.find((r) => r.sessionNumber === 3);
      if (session3Row) {
        info(`Session 3 (${session3Row.id.slice(0, 8)}) is now the next actionable: due ${isoDate(session3Row.dueDate)}, status ${session3Row.status}`);
        pass('Verify in UI: session 3 card shows المتابعة التالية / Next Follow-up badge');
      }
    }
  }

  // ── 5. Optional mutation: shift session 3 due date +50 days ──────────────

  if (has(FLAG_SHIFT_SESSION3_50)) {
    banner('5. Shifting session 3 due date +50 days');

    // Re-fetch to get latest state
    const session3RowFresh = await prisma.patientFollowUp.findFirst({
      where: {
        centerId: center.id,
        patientId: firstRow.patientId,
        serviceId: firstRow.serviceId!,
        sessionNumber: 3,
      },
      select: { id: true, dueDate: true, status: true },
    });

    if (!session3RowFresh) {
      fail('Session 3 row not found — cannot update.');
    } else {
      const newDate = addDaysUtc(session3RowFresh.dueDate, 50);
      const prevDate = isoDate(session3RowFresh.dueDate);
      await prisma.patientFollowUp.update({
        where: { id: session3RowFresh.id },
        data: {
          dueDate: newDate,
          status: 'UPCOMING',
        },
      });
      pass(`Session 3 due date: ${prevDate} → ${isoDate(newDate)}`);
      info('Verify in UI: only session 3 date changed, sessions 4-8 unchanged.');
    }

    // Verify sessions 4+ are unchanged
    const otherRows = await prisma.patientFollowUp.findMany({
      where: {
        centerId: center.id,
        patientId: firstRow.patientId,
        serviceId: firstRow.serviceId!,
        sessionNumber: { gte: 4 },
        status: { not: 'CANCELLED' },
      },
      select: { sessionNumber: true, dueDate: true, status: true },
      orderBy: { sessionNumber: 'asc' },
    });

    if (otherRows.length > 0) {
      pass(`Sessions 4+ unchanged (${otherRows.length} rows):`);
      console.table(otherRows.map((r) => ({
        session:  r.sessionNumber,
        dueDate:  isoDate(r.dueDate),
        status:   r.status,
      })));
    }
  }

  // ── 6. Optional mutation: restore session 2 to UPCOMING ──────────────────

  if (has(FLAG_RESTORE_SESSION2)) {
    banner('6. Restoring session 2 to UPCOMING');

    if (!session2Row) {
      fail('Session 2 not found.');
    } else {
      const orig = addDaysUtc(
        new Date(
          (await prisma.appointment.findFirst({
            where: { id: session2Row.appointmentId! },
            select: { appointmentDate: true },
          }))!.appointmentDate,
        ),
        firstRow.service?.defaultIntervalDays ?? 30,
      );

      await prisma.patientFollowUp.update({
        where: { id: session2Row.id },
        data: {
          dueDate: orig,
          status: isoDate(orig) <= isoDate(today) ? 'DUE' : 'UPCOMING',
        },
      });
      pass(`Session 2 restored to ${isoDate(orig)}`);
    }
  }

  // ── 7. Filter simulation — API-side where-clause checks ──────────────────

  banner('7. Filter simulation (DB-level)');

  const tomorrow  = addDaysUtc(today, 1);
  const weekEnd   = addDaysUtc(today, 7);

  const filterResults = await Promise.all([
    prisma.patientFollowUp.count({
      where: {
        centerId: center.id,
        patientId: firstRow.patientId,
        dueDate: { gte: today, lt: tomorrow },
        status: { in: ['DUE', 'UPCOMING', 'CONTACTED'] },
      },
    }),
    prisma.patientFollowUp.count({
      where: {
        centerId: center.id,
        patientId: firstRow.patientId,
        dueDate: { gte: today, lt: weekEnd },
        status: { in: ['DUE', 'UPCOMING', 'CONTACTED'] },
      },
    }),
    prisma.patientFollowUp.count({
      where: {
        centerId: center.id,
        patientId: firstRow.patientId,
        dueDate: { gte: tomorrow },
        status: { in: ['UPCOMING', 'DUE'] },
      },
    }),
    prisma.patientFollowUp.count({
      where: {
        centerId: center.id,
        patientId: firstRow.patientId,
        status: { not: 'CANCELLED' },
      },
    }),
  ]);

  const [countToday, countThisWeek, countUpcoming, countAll] = filterResults;

  console.log('\n  Filter counts for this patient:');
  console.table([
    { filter: 'TODAY',     count: countToday,    note: 'visible only when a session is due today' },
    { filter: 'THIS_WEEK', count: countThisWeek, note: 'sessions due within 7 days' },
    { filter: 'UPCOMING',  count: countUpcoming, note: 'sessions due from tomorrow onwards' },
    { filter: 'ALL_PLAN',  count: countAll,      note: 'all non-cancelled (full plan size)' },
  ]);

  if (countAll === Number(totalSessions)) {
    pass(`Full plan: all ${totalSessions} sessions visible to "full plan" query`);
  } else {
    fail(`Full plan query returned ${countAll}, expected ${totalSessions}`);
  }

  // ── 8. Next-actionable session highlight check ────────────────────────────

  banner('8. Next-actionable session (المتابعة التالية check)');

  const actionable = await prisma.patientFollowUp.findMany({
    where: {
      centerId: center.id,
      patientId: firstRow.patientId,
      serviceId: firstRow.serviceId!,
      status: { notIn: ['BOOKED', 'COMPLETED', 'CANCELLED'] },
    },
    select: { id: true, sessionNumber: true, dueDate: true, status: true },
    orderBy: { dueDate: 'asc' },
  });

  if (actionable.length === 0) {
    info('No actionable sessions — all are completed/booked/cancelled.');
  } else {
    // Mirrors getNextActionableFollowUpId in TenantFollowUpsPage.tsx
    const todayMs = today.getTime();
    const future = actionable.filter((r) => r.dueDate.getTime() >= todayMs);
    const next = future.length > 0
      ? future[0]
      : actionable.sort(
          (a, b) =>
            Math.abs(todayMs - a.dueDate.getTime()) -
            Math.abs(todayMs - b.dueDate.getTime()),
        )[0];

    pass(`Next-actionable: session ${next.sessionNumber}, due ${isoDate(next.dueDate)}, status ${next.status}`);
    info(`This card gets المتابعة التالية / Next Follow-up / המעקב הבא badge`);
    info(`Follow-up ID: ${next.id}`);
  }

  // ── 9. WhatsApp message preview ───────────────────────────────────────────

  banner('9. WhatsApp message preview');

  const s2 = await prisma.patientFollowUp.findFirst({
    where: {
      centerId: center.id,
      patientId: firstRow.patientId,
      sessionNumber: 2,
      status: { not: 'CANCELLED' },
    },
    select: {
      dueDate: true,
      sessionNumber: true,
      patient: { select: { fullName: true, phone: true } },
      service: { select: { nameAr: true, nameEn: true } },
    },
  });

  if (s2) {
    const pt    = s2.patient.fullName;
    const svc   = s2.service?.nameAr || s2.service?.nameEn || 'الخدمة';
    const due   = isoDate(s2.dueDate);
    const arMsg = `مرحبًا ${pt} 🌷\nنذكرك أن موعد جلستك القادمة لخدمة ${svc} أصبح قريبًا.\nيسعدنا حجز موعد مناسب لك.`;
    const enMsg = `Hello ${pt},\nWe would like to remind you that your next ${svc} session is coming up.\nWe will be happy to book a convenient appointment for you.`;

    info(`Patient: ${pt} | Phone: ${s2.patient.phone}`);
    info(`Service: ${svc} | Session: 2 | Due: ${due}`);
    info('AR message:');
    console.log(`\n    ${arMsg.replace(/\n/g, '\n    ')}\n`);
    info('EN message:');
    console.log(`\n    ${enMsg.replace(/\n/g, '\n    ')}\n`);
    pass('WhatsApp message contains patient name and service info');
  } else {
    warn('Session 2 not found for WhatsApp preview.');
  }

  // ── 10. Summary ───────────────────────────────────────────────────────────

  banner('10. QA Summary');
  console.log(`
  Patient:  ${patientName}
  Service:  ${serviceName}
  Plan:     ${bestRows.length} / ${totalSessions} sessions in DB
  Center:   ${QA_CENTER_NAME}

  Run flags:
    ${FLAG_SET_SESSION2_TODAY.padEnd(26)}  Set session 2 due = today  (enables TODAY/THIS_WEEK filter tests)
    ${FLAG_COMPLETE_SESSION2.padEnd(26)}   Mark session 2 COMPLETED   (status-transition test)
    ${FLAG_SHIFT_SESSION3_50.padEnd(26)}   Shift session 3 +50 days   (date-edit isolation test)
    ${FLAG_RESTORE_SESSION2.padEnd(26)}    Restore session 2 to orig  (reset after tests)
  `);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('\n❌ Script error:', err);
  process.exit(1);
});
