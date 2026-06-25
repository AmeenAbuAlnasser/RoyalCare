ALTER TABLE "BookingRequest"
  ADD COLUMN "branchId" UUID;

ALTER TABLE "BookingRequest"
  ADD CONSTRAINT "BookingRequest_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "CenterBranch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "BookingRequest_centerId_branchId_idx"
  ON "BookingRequest"("centerId", "branchId");
