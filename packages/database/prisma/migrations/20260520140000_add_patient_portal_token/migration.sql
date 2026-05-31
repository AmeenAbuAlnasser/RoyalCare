CREATE TABLE "PatientPortalToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientPortalToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientPortalToken_token_key" ON "PatientPortalToken"("token");
CREATE INDEX "PatientPortalToken_token_idx" ON "PatientPortalToken"("token");
CREATE INDEX "PatientPortalToken_centerId_patientId_idx" ON "PatientPortalToken"("centerId", "patientId");
CREATE INDEX "PatientPortalToken_expiresAt_idx" ON "PatientPortalToken"("expiresAt");

ALTER TABLE "PatientPortalToken" ADD CONSTRAINT "PatientPortalToken_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientPortalToken" ADD CONSTRAINT "PatientPortalToken_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
