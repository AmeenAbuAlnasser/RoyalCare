CREATE TYPE "ServiceFollowUpMode" AS ENUM ('NONE', 'FINITE_PLAN', 'RECURRING');

CREATE TYPE "RecurringIntervalUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

ALTER TABLE "Service"
ADD COLUMN "followUpMode" "ServiceFollowUpMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN "recurringIntervalValue" INTEGER,
ADD COLUMN "recurringIntervalUnit" "RecurringIntervalUnit",
ADD COLUMN "autoWhatsappReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "autoReminderDaysBefore" INTEGER;

UPDATE "Service"
SET "followUpMode" = CASE
  WHEN "followUpEnabled" = false THEN 'NONE'::"ServiceFollowUpMode"
  ELSE 'FINITE_PLAN'::"ServiceFollowUpMode"
END;

ALTER TABLE "PatientFollowUp"
ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recurringIntervalValue" INTEGER,
ADD COLUMN "recurringIntervalUnit" "RecurringIntervalUnit",
ADD COLUMN "nextRecurringAt" TIMESTAMP(3),
ADD COLUMN "originFollowUpId" UUID;

ALTER TABLE "PatientFollowUp"
ADD CONSTRAINT "PatientFollowUp_originFollowUpId_fkey"
FOREIGN KEY ("originFollowUpId") REFERENCES "PatientFollowUp"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PatientFollowUp_centerId_patientId_serviceId_isRecurring_status_idx"
ON "PatientFollowUp"("centerId", "patientId", "serviceId", "isRecurring", "status");
