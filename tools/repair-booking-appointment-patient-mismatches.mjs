import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const { PrismaPg } = require("../services/api/node_modules/@prisma/adapter-pg");
const { PrismaClient } = require("../packages/database/node_modules/@prisma/client");
const apply = process.argv.includes("--apply");

function loadEnv(relativePath) {
  const envPath = path.join(rootDir, relativePath);

  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match || line.trim().startsWith("#")) continue;

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[match[1]] ??= value;
  }
}

function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

loadEnv("services/api/.env");
loadEnv("packages/database/.env");

const connectionString = process.env.API_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing API_DATABASE_URL or DATABASE_URL.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const rows = await prisma.bookingRequest.findMany({
  where: {
    status: "ACCEPTED",
    appointmentId: { not: null },
  },
  orderBy: { createdAt: "asc" },
  select: {
    id: true,
    centerId: true,
    fullName: true,
    phone: true,
    appointmentId: true,
    appointment: {
      select: {
        id: true,
        patientId: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    },
  },
});

const auditLogs = await prisma.auditLog.findMany({
  where: { action: "BOOKING_REQUEST_ACCEPTED" },
  select: { metadata: true },
});

const explicitlyLinkedBookingIds = new Set(
  auditLogs
    .map((log) => log.metadata)
    .filter((metadata) => metadata && typeof metadata === "object")
    .filter((metadata) => metadata.patientResolution === "LINK_EXISTING")
    .map((metadata) => metadata.bookingRequestId)
    .filter((bookingRequestId) => typeof bookingRequestId === "string"),
);

const mismatches = rows.filter((row) => {
  if (explicitlyLinkedBookingIds.has(row.id)) return false;

  const patient = row.appointment?.patient;

  if (!patient) return false;

  return (
    normalize(row.fullName) !== normalize(patient.fullName) ||
    normalize(row.phone) !== normalize(patient.phone)
  );
});

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      scanned: rows.length,
      mismatches: mismatches.length,
    },
    null,
    2,
  ),
);

for (const row of mismatches) {
  const currentPatient = row.appointment?.patient;

  console.log(
    JSON.stringify(
      {
        bookingId: row.id,
        bookingName: row.fullName,
        bookingPhone: row.phone,
        appointmentId: row.appointmentId,
        currentPatientName: currentPatient?.fullName ?? null,
        currentPatientPhone: currentPatient?.phone ?? null,
      },
      null,
      2,
    ),
  );

  if (!apply || !row.appointment) continue;

  await prisma.$transaction(async (tx) => {
    let patient = await tx.patient.findFirst({
      where: {
        centerId: row.centerId,
        phone: row.phone,
        fullName: row.fullName,
      },
      select: { id: true },
    });

    if (!patient) {
      patient = await tx.patient.create({
        data: {
          centerId: row.centerId,
          fullName: row.fullName,
          phone: row.phone,
          status: "ACTIVE",
        },
        select: { id: true },
      });
    }

    if (patient.id === row.appointment.patientId) return;

    await tx.appointment.update({
      where: { id: row.appointment.id },
      data: { patientId: patient.id },
    });

    await tx.auditLog.create({
      data: {
        action: "TENANT_APPOINTMENT_UPDATED",
        centerId: row.centerId,
        metadata: {
          reason: "repair_booking_appointment_patient_mismatch",
          bookingRequestId: row.id,
          appointmentId: row.appointment.id,
          oldPatientId: row.appointment.patientId,
          newPatientId: patient.id,
          bookingFullName: row.fullName,
          bookingPhone: row.phone,
        },
      },
    });
  });
}

await prisma.$disconnect();
