-- AlterTable: add reminder tracking fields to Appointment
ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "lastReminderSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminderCount"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reminder24hSent"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reminder2hSent"     BOOLEAN NOT NULL DEFAULT false;
