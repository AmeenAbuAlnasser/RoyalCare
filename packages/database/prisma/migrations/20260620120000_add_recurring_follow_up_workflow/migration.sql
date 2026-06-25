ALTER TYPE "PatientFollowUpStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';
ALTER TYPE "PatientFollowUpStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "PatientFollowUpPlanStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

ALTER TABLE "PatientFollowUp"
  ADD COLUMN "lastContactedByUserId" UUID,
  ADD COLUMN "reminderCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastReminderAt" TIMESTAMP(3),
  ADD COLUMN "lastReminderByUserId" UUID,
  ADD COLUMN "skippedAt" TIMESTAMP(3),
  ADD COLUMN "skippedByUserId" UUID,
  ADD COLUMN "pausedAt" TIMESTAMP(3),
  ADD COLUMN "pausedByUserId" UUID;
