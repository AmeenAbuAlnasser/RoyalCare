import { PrismaPg } from '@prisma/adapter-pg';
import {
  PatientFollowUpSourceType,
  PrismaClient,
  type RecurringIntervalUnit,
} from '@royalcare/db';
import { getApiDatabaseUrl } from '../src/common/config/database-url';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addInterval(date: Date, value: number, unit: RecurringIntervalUnit) {
  const result = new Date(`${dateOnly(date)}T00:00:00.000Z`);
  if (unit === 'DAY') result.setUTCDate(result.getUTCDate() + value);
  if (unit === 'WEEK') result.setUTCDate(result.getUTCDate() + value * 7);
  if (unit === 'MONTH') result.setUTCMonth(result.getUTCMonth() + value);
  if (unit === 'YEAR') result.setUTCFullYear(result.getUTCFullYear() + value);
  return result;
}

function classify(nextDueDate: Date, today: Date) {
  const daysUntilDue = Math.round(
    (nextDueDate.getTime() - today.getTime()) / 86_400_000,
  );
  const bucket =
    daysUntilDue < 0
      ? 'OVERDUE'
      : daysUntilDue === 0
        ? 'TODAY'
        : daysUntilDue <= 7
          ? 'THIS_WEEK'
          : 'UPCOMING';
  return { bucket, daysUntilDue };
}

async function main() {
  const branchId = argument('--branch-id');
  const appointmentId = argument('--appointment-id');
  const sourceDateValue = argument('--source-date');
  const todayValue = argument('--today');
  const apply = process.argv.includes('--apply');

  if (!branchId) throw new Error('--branch-id is required');
  if (sourceDateValue && !/^\d{4}-\d{2}-\d{2}$/.test(sourceDateValue)) {
    throw new Error('--source-date must be YYYY-MM-DD');
  }
  if (sourceDateValue && !appointmentId) {
    throw new Error('--source-date requires --appointment-id');
  }
  if (todayValue && !/^\d{4}-\d{2}-\d{2}$/.test(todayValue)) {
    throw new Error('--today must be YYYY-MM-DD');
  }

  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: getApiDatabaseUrl() });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as never);

  try {
    const branch = await prisma.centerBranch.findUniqueOrThrow({
      where: { id: branchId },
      select: { centerId: true, id: true, name: true },
    });
    const appointments = await prisma.appointment.findMany({
      where: {
        branchId,
        status: 'COMPLETED',
        ...(appointmentId ? { id: appointmentId } : {}),
        service: {
          followUpEnabled: true,
          followUpMode: 'RECURRING_CONTINUOUS',
          recurringIntervalValue: { not: null },
          recurringIntervalUnit: { not: null },
        },
      },
      select: {
        id: true,
        appointmentDate: true,
        completedAt: true,
        patientId: true,
        serviceId: true,
        patient: { select: { fullName: true } },
        service: {
          select: {
            nameAr: true,
            nameEn: true,
            nameHe: true,
            recurringIntervalValue: true,
            recurringIntervalUnit: true,
          },
        },
      },
    });

    const changes: Array<Record<string, string | null>> = [];
    const today = new Date(`${todayValue ?? dateOnly(new Date())}T00:00:00.000Z`);
    for (const appointment of appointments) {
      if (!appointment.serviceId || !appointment.service) continue;
      const value = appointment.service.recurringIntervalValue;
      const unit = appointment.service.recurringIntervalUnit;
      if (!value || !unit) continue;

      const sourceDate = sourceDateValue
        ? new Date(`${sourceDateValue}T00:00:00.000Z`)
        : (appointment.completedAt ?? appointment.appointmentDate);
      const nextDueDate = addInterval(sourceDate, value, unit);
      const classification = classify(nextDueDate, today);
      const status = nextDueDate.getTime() <= today.getTime() ? 'DUE' : 'UPCOMING';
      const existing = await prisma.patientFollowUp.findFirst({
        where: { appointmentId: appointment.id, isRecurring: true },
        select: { id: true, dueDate: true, nextRecurringAt: true, status: true, planStatus: true },
      });
      const change = {
        appointmentId: appointment.id,
        patientName: appointment.patient.fullName,
        serviceName:
          appointment.service.nameAr || appointment.service.nameEn || appointment.service.nameHe,
        branchId,
        sourceDate: dateOnly(sourceDate),
        appointmentDate: dateOnly(appointment.appointmentDate),
        completedAt: appointment.completedAt?.toISOString() ?? null,
        recurrenceInterval: String(value),
        recurrenceUnit: unit,
        nextDueDate: dateOnly(nextDueDate),
        today: dateOnly(today),
        daysUntilDue: String(classification.daysUntilDue),
        computedBucket: classification.bucket,
        existingFollowUpId: existing?.id ?? null,
        action: existing ? 'UPDATE' : 'CREATE',
        status,
        planStatus: 'ACTIVE',
      };
      changes.push(change);

      if (!apply) continue;
      if (existing) {
        await prisma.patientFollowUp.update({
          where: { id: existing.id },
          data: { dueDate: nextDueDate, nextRecurringAt: nextDueDate, status, planStatus: 'ACTIVE' },
        });
      } else {
        await prisma.patientFollowUp.create({
          data: {
            centerId: branch.centerId,
            patientId: appointment.patientId,
            serviceId: appointment.serviceId,
            appointmentId: appointment.id,
            sourceType: PatientFollowUpSourceType.APPOINTMENT_COMPLETED,
            title: change.serviceName || 'Recurring follow-up',
            dueDate: nextDueDate,
            nextRecurringAt: nextDueDate,
            isRecurring: true,
            recurringIntervalValue: value,
            recurringIntervalUnit: unit,
            status,
            planStatus: 'ACTIVE',
          },
        });
      }
    }

    console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY_RUN', branch, changes }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
