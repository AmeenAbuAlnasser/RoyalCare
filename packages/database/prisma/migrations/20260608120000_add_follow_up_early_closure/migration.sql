ALTER TYPE "PatientFollowUpStatus" ADD VALUE IF NOT EXISTS 'CLOSED_EARLY';

CREATE TYPE "PatientFollowUpPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CLOSED_EARLY', 'CANCELLED');

ALTER TABLE "PatientFollowUp"
ADD COLUMN "planStatus" "PatientFollowUpPlanStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "closedEarlyReason" TEXT,
ADD COLUMN "closedEarlyAt" TIMESTAMP(3),
ADD COLUMN "closedEarlyByUserId" UUID,
ADD COLUMN "closedEarlyAfterSession" INTEGER;

CREATE INDEX "PatientFollowUp_centerId_planStatus_idx"
ON "PatientFollowUp"("centerId", "planStatus");
