ALTER TABLE "BookingRequest" ADD COLUMN "providerId" UUID;

CREATE INDEX "BookingRequest_providerId_idx" ON "BookingRequest"("providerId");

ALTER TABLE "BookingRequest"
    ADD CONSTRAINT "BookingRequest_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
