CREATE TYPE "PublicBookingMode" AS ENUM ('SIMPLE_REQUEST', 'DIRECT_BOOKING');

CREATE TYPE "BookingRequestSource" AS ENUM ('PUBLIC_WEBSITE', 'CUSTOMER_PORTAL', 'ADMIN');

ALTER TABLE "BrandingSettings"
  ADD COLUMN "publicBookingMode" "PublicBookingMode" NOT NULL DEFAULT 'SIMPLE_REQUEST';

ALTER TABLE "BookingRequest"
  ADD COLUMN "source" "BookingRequestSource" NOT NULL DEFAULT 'PUBLIC_WEBSITE',
  ALTER COLUMN "requestedDate" DROP NOT NULL;

CREATE INDEX "BookingRequest_centerId_source_idx" ON "BookingRequest"("centerId", "source");
