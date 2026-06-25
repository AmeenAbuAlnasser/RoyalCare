/**
 * QA script — diagnose follow-up mismatch for "امين ابو النصر".
 * Run: node scripts/qa-followup-check.mjs
 */
import { PrismaClient } from "@royalcare/db";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public" } },
});

async function main() {
  // 1. Find the patient
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { fullName: { contains: "امين", mode: "insensitive" } },
        { fullName: { contains: "amin", mode: "insensitive" } },
        { fullName: { contains: "Abu", mode: "insensitive" } },
        { fullName: { contains: "ابو النصر", mode: "insensitive" } },
      ],
    },
    select: { id: true, fullName: true, centerId: true },
    take: 10,
  });

  console.log("\n=== PATIENTS FOUND ===");
  console.table(patients);

  if (patients.length === 0) {
    console.log("No matching patients found.");
    await prisma.$disconnect();
    return;
  }

  for (const patient of patients) {
    console.log(`\n=== FOLLOW-UPS for ${patient.fullName} (${patient.id}) ===`);

    const followUps = await prisma.patientFollowUp.findMany({
      where: { patientId: patient.id },
      select: {
        id: true,
        patientId: true,
        serviceId: true,
        appointmentId: true,
        sessionNumber: true,
        dueDate: true,
        status: true,
        sourceType: true,
        createdAt: true,
        service: { select: { nameEn: true, nameAr: true, totalRecommendedSessions: true } },
      },
      orderBy: [{ dueDate: "asc" }],
    });

    console.log(`Total follow-ups in DB: ${followUps.length}`);
    console.table(
      followUps.map((f) => ({
        id: f.id.slice(0, 8),
        session: f.sessionNumber,
        due: f.dueDate.toISOString().slice(0, 10),
        status: f.status,
        source: f.sourceType,
        service: f.service?.nameEn || f.service?.nameAr || "-",
        totalSessions: f.service?.totalRecommendedSessions ?? "-",
        appointmentId: f.appointmentId?.slice(0, 8) ?? "null",
        createdAt: f.createdAt.toISOString().slice(0, 19),
      })),
    );

    // 2. Find related appointments
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        status: true,
        createdAt: true,
        serviceId: true,
        service: { select: { nameEn: true, nameAr: true, totalRecommendedSessions: true, followUpEnabled: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`\n=== APPOINTMENTS for ${patient.fullName} ===`);
    console.table(
      appointments.map((a) => ({
        id: a.id.slice(0, 8),
        date: a.appointmentDate.toISOString().slice(0, 10),
        time: a.startTime,
        status: a.status,
        service: a.service?.nameEn || a.service?.nameAr || "-",
        followUpEnabled: a.service?.followUpEnabled ?? "-",
        totalSessions: a.service?.totalRecommendedSessions ?? "-",
        createdAt: a.createdAt.toISOString().slice(0, 19),
      })),
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
