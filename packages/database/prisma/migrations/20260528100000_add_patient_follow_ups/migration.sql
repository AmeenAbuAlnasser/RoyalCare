-- Smart follow-up treatment plans v1.
DO $$ BEGIN
  CREATE TYPE "ServiceFollowUpType" AS ENUM ('FIXED_INTERVAL', 'SESSION_PLAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientFollowUpSourceType" AS ENUM ('APPOINTMENT_COMPLETED', 'MANUAL', 'BOOKING_REQUEST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientFollowUpStatus" AS ENUM ('DUE', 'UPCOMING', 'CONTACTED', 'BOOKED', 'COMPLETED', 'MISSED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "followUpEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "followUpType" "ServiceFollowUpType" NOT NULL DEFAULT 'FIXED_INTERVAL',
  ADD COLUMN IF NOT EXISTS "defaultIntervalDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "totalRecommendedSessions" INTEGER,
  ADD COLUMN IF NOT EXISTS "autoCreateNextReminder" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "reminderMessageAr" TEXT,
  ADD COLUMN IF NOT EXISTS "reminderMessageEn" TEXT,
  ADD COLUMN IF NOT EXISTS "reminderMessageHe" TEXT,
  ADD COLUMN IF NOT EXISTS "followUpRules" JSONB;

CREATE TABLE IF NOT EXISTS "PatientFollowUp" (
    "id" UUID NOT NULL,
    "centerId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "serviceId" UUID,
    "appointmentId" UUID,
    "sourceType" "PatientFollowUpSourceType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "notes" TEXT,
    "sessionNumber" INTEGER,
    "dueDate" DATE NOT NULL,
    "status" "PatientFollowUpStatus" NOT NULL DEFAULT 'UPCOMING',
    "lastContactedAt" TIMESTAMP(3),
    "nextAppointmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PatientFollowUp_centerId_appointmentId_sessionNumber_key" ON "PatientFollowUp"("centerId", "appointmentId", "sessionNumber");
CREATE INDEX IF NOT EXISTS "PatientFollowUp_centerId_status_dueDate_idx" ON "PatientFollowUp"("centerId", "status", "dueDate");
CREATE INDEX IF NOT EXISTS "PatientFollowUp_centerId_dueDate_idx" ON "PatientFollowUp"("centerId", "dueDate");
CREATE INDEX IF NOT EXISTS "PatientFollowUp_centerId_patientId_dueDate_idx" ON "PatientFollowUp"("centerId", "patientId", "dueDate");
CREATE INDEX IF NOT EXISTS "PatientFollowUp_centerId_serviceId_idx" ON "PatientFollowUp"("centerId", "serviceId");

DO $$ BEGIN
  ALTER TABLE "PatientFollowUp"
  ADD CONSTRAINT "PatientFollowUp_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientFollowUp"
  ADD CONSTRAINT "PatientFollowUp_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientFollowUp"
  ADD CONSTRAINT "PatientFollowUp_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientFollowUp"
  ADD CONSTRAINT "PatientFollowUp_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientFollowUp"
  ADD CONSTRAINT "PatientFollowUp_nextAppointmentId_fkey"
  FOREIGN KEY ("nextAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
