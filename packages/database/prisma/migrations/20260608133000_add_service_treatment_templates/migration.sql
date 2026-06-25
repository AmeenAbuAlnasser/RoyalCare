CREATE TABLE "ServiceTreatmentTemplate" (
  "id" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "nameAr" VARCHAR(160) NOT NULL DEFAULT '',
  "nameEn" VARCHAR(160) NOT NULL DEFAULT '',
  "nameHe" VARCHAR(160) NOT NULL DEFAULT '',
  "totalSessions" INTEGER NOT NULL,
  "defaultIntervalDays" INTEGER,
  "phases" JSONB,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceTreatmentTemplate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceTreatmentTemplate"
ADD CONSTRAINT "ServiceTreatmentTemplate_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ServiceTreatmentTemplate_serviceId_isActive_sortOrder_idx"
ON "ServiceTreatmentTemplate"("serviceId", "isActive", "sortOrder");

CREATE INDEX "ServiceTreatmentTemplate_serviceId_isDefault_idx"
ON "ServiceTreatmentTemplate"("serviceId", "isDefault");

ALTER TABLE "Appointment"
ADD COLUMN "treatmentTemplateId" UUID,
ADD COLUMN "treatmentTemplateNameAr" VARCHAR(160),
ADD COLUMN "treatmentTemplateNameEn" VARCHAR(160),
ADD COLUMN "treatmentTemplateNameHe" VARCHAR(160),
ADD COLUMN "treatmentTemplateTotalSessions" INTEGER,
ADD COLUMN "treatmentTemplateDefaultIntervalDays" INTEGER,
ADD COLUMN "treatmentTemplatePhases" JSONB;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_treatmentTemplateId_fkey"
FOREIGN KEY ("treatmentTemplateId") REFERENCES "ServiceTreatmentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Appointment_treatmentTemplateId_idx"
ON "Appointment"("treatmentTemplateId");

ALTER TABLE "PatientFollowUp"
ADD COLUMN "treatmentTemplateId" UUID,
ADD COLUMN "treatmentTemplateNameAr" VARCHAR(160),
ADD COLUMN "treatmentTemplateNameEn" VARCHAR(160),
ADD COLUMN "treatmentTemplateNameHe" VARCHAR(160),
ADD COLUMN "planTotalSessions" INTEGER,
ADD COLUMN "planDefaultIntervalDays" INTEGER,
ADD COLUMN "planPhases" JSONB;

ALTER TABLE "PatientFollowUp"
ADD CONSTRAINT "PatientFollowUp_treatmentTemplateId_fkey"
FOREIGN KEY ("treatmentTemplateId") REFERENCES "ServiceTreatmentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PatientFollowUp_treatmentTemplateId_idx"
ON "PatientFollowUp"("treatmentTemplateId");
