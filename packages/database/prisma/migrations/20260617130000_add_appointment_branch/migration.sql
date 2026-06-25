ALTER TABLE "Appointment"
  ADD COLUMN "branchId" UUID;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "CenterBranch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Appointment_centerId_branchId_idx"
  ON "Appointment"("centerId", "branchId");
