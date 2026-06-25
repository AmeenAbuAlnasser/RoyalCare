/**
 * Read-only focused diagnostic for appointment/follow-up consistency.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/debug-appointment-follow-up.ts [appointmentId]
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@royalcare/db';
import { getApiDatabaseUrl } from '../src/common/config/database-url';
import { PrismaService } from '../src/common/database/prisma.service';
import { TenantAppointmentsService } from '../src/modules/appointments/services/tenant-appointments.service';
import { PatientFollowUpsService } from '../src/modules/patient-follow-ups/services/patient-follow-ups.service';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getApiDatabaseUrl() }),
  });
  const requestedId = process.argv[2];

  try {
    const recurringAnchor = requestedId
      ? null
      : await prisma.patientFollowUp.findFirst({
          where: {
            isRecurring: true,
            service: {
              OR: [
                { nameAr: { contains: 'حجامة', mode: 'insensitive' } },
                { nameEn: { contains: 'hijama', mode: 'insensitive' } },
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            appointmentId: true,
            centerId: true,
            patientId: true,
            serviceId: true,
          },
        });
    const appointment = await prisma.appointment.findFirst({
      where: requestedId
        ? { id: requestedId }
        : recurringAnchor?.appointmentId
          ? { id: recurringAnchor.appointmentId }
          : recurringAnchor
            ? {
                centerId: recurringAnchor.centerId,
                patientId: recurringAnchor.patientId,
                serviceId: recurringAnchor.serviceId,
              }
            : {
                service: {
                  followUpMode: 'RECURRING_CONTINUOUS',
                  OR: [
                    { nameAr: { contains: 'حجامة', mode: 'insensitive' } },
                    { nameEn: { contains: 'hijama', mode: 'insensitive' } },
                  ],
                },
              },
      orderBy: requestedId ? undefined : { createdAt: 'desc' },
      select: {
        id: true,
        centerId: true,
        patientId: true,
        serviceId: true,
        status: true,
        appointmentDate: true,
        service: {
          select: {
            nameAr: true,
            nameEn: true,
            followUpMode: true,
            recurringIntervalValue: true,
            recurringIntervalUnit: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('No matching recurring Hijama appointment was found.');
    }

    const rows = await prisma.patientFollowUp.findMany({
      where: {
        centerId: appointment.centerId,
        OR: [
          { appointmentId: appointment.id },
          { nextAppointmentId: appointment.id },
          {
            isRecurring: true,
            patientId: appointment.patientId,
            serviceId: appointment.serviceId,
          },
        ],
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        appointmentId: true,
        nextAppointmentId: true,
        patientId: true,
        serviceId: true,
        isRecurring: true,
        recurringIntervalValue: true,
        recurringIntervalUnit: true,
        dueDate: true,
        status: true,
      },
    });

    const recurring = rows.find((row) => row.isRecurring);
    const next = rows.find(
      (row) => !['COMPLETED', 'CANCELLED', 'CLOSED_EARLY'].includes(row.status),
    );

    const prismaService = new PrismaService();
    const appointmentService = new TenantAppointmentsService(
      prismaService,
      null as never,
      null as never,
      new PatientFollowUpsService(prismaService),
      null as never,
    );
    const permissions = ['appointments:view'];
    const listResponse = await appointmentService.list(
      appointment.centerId,
      permissions,
      { date: appointment.appointmentDate.toISOString().slice(0, 10) },
    );
    const listAppointment = listResponse.items.find(
      (item) => item.id === appointment.id,
    );
    const detailAppointment = await appointmentService.getById(
      appointment.centerId,
      permissions,
      appointment.id,
    );

    console.log(
      JSON.stringify(
        {
          appointment,
          relatedPatientFollowUps: rows,
          computed: {
            hasFollowUpPlan: rows.length > 0,
            followUpPlanSummary:
              rows.length > 0
                ? {
                    type: recurring ? 'RECURRING_CONTINUOUS' : 'SESSION_BASED_PLAN',
                    followUpCount: rows.length,
                    nextFollowUpDate: next?.dueDate ?? null,
                    recurringIntervalValue:
                      recurring?.recurringIntervalValue ?? null,
                    recurringIntervalUnit:
                      recurring?.recurringIntervalUnit ?? null,
                  }
                : null,
          },
          endpointComparison: {
            list: listAppointment
              ? {
                  id: listAppointment.id,
                  patientId: listAppointment.patientId,
                  serviceId: listAppointment.serviceId,
                  hasFollowUpPlan: listAppointment.hasFollowUpPlan,
                  followUpPlanId: listAppointment.followUpPlanId,
                  followUpPlanSummary: listAppointment.followUpPlanSummary,
                }
              : null,
            details: {
              id: detailAppointment.id,
              patientId: detailAppointment.patientId,
              serviceId: detailAppointment.serviceId,
              hasFollowUpPlan: detailAppointment.hasFollowUpPlan,
              followUpPlanId: detailAppointment.followUpPlanId,
              followUpPlanSummary: detailAppointment.followUpPlanSummary,
              followUpRows: detailAppointment.followUpPlan.length,
            },
          },
        },
        null,
        2,
      ),
    );
    await prismaService.onModuleDestroy();
  } finally {
    await prisma.$disconnect();
  }
}

void main();
