/**
 * QA script — diagnose follow-up mismatch for "امين ابو النصر".
 * Run from: c:\Users\DVDSTORE\Desktop\RoyalCare\services\api
 *   node ../../scripts/qa-followup-check.cjs
 */
const { PrismaClient } = require('@royalcare/db');

const prisma = new PrismaClient();

async function main() {
  // 1. Find the patient
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { fullName: { contains: 'امين', mode: 'insensitive' } },
        { fullName: { contains: 'amin', mode: 'insensitive' } },
        { fullName: { contains: 'Abu', mode: 'insensitive' } },
        { fullName: { contains: 'النصر', mode: 'insensitive' } },
      ],
    },
    select: { id: true, fullName: true, centerId: true },
    take: 10,
  });

  console.log('\n=== PATIENTS FOUND ===');
  console.table(patients);

  if (patients.length === 0) {
    console.log('No matching patients. Showing ALL patients:');
    const all = await prisma.patient.findMany({ select: { id: true, fullName: true }, take: 20 });
    console.table(all);
    return;
  }

  for (const patient of patients) {
    console.log(`\n=== FOLLOW-UPS for "${patient.fullName}" (${patient.id}) ===`);

    const followUps = await prisma.patientFollowUp.findMany({
      where: { patientId: patient.id },
      select: {
        id: true,
        serviceId: true,
        appointmentId: true,
        sessionNumber: true,
        dueDate: true,
        status: true,
        sourceType: true,
        createdAt: true,
        service: { select: { nameEn: true, nameAr: true, totalRecommendedSessions: true } },
      },
      orderBy: [{ dueDate: 'asc' }],
    });

    console.log(`DB follow-ups count: ${followUps.length}`);
    console.table(
      followUps.map((f) => ({
        id: f.id.slice(0, 8),
        session: f.sessionNumber,
        due: f.dueDate.toISOString().slice(0, 10),
        status: f.status,
        source: f.sourceType,
        service: (f.service && (f.service.nameEn || f.service.nameAr)) || '-',
        totalSess: (f.service && f.service.totalRecommendedSessions) || '-',
        apptId: (f.appointmentId && f.appointmentId.slice(0, 8)) || 'null',
        created: f.createdAt.toISOString().slice(0, 19),
      })),
    );

    // 2. Find appointments
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        status: true,
        createdAt: true,
        service: {
          select: {
            nameEn: true,
            nameAr: true,
            totalRecommendedSessions: true,
            followUpEnabled: true,
            autoCreateNextReminder: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(`\n=== APPOINTMENTS for "${patient.fullName}" ===`);
    console.table(
      appointments.map((a) => ({
        id: a.id.slice(0, 8),
        date: a.appointmentDate.toISOString().slice(0, 10),
        status: a.status,
        service: (a.service && (a.service.nameEn || a.service.nameAr)) || '-',
        followUpEnabled: (a.service && a.service.followUpEnabled) || false,
        autoReminder: (a.service && a.service.autoCreateNextReminder) || false,
        totalSess: (a.service && a.service.totalRecommendedSessions) || '-',
        created: a.createdAt.toISOString().slice(0, 19),
      })),
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
