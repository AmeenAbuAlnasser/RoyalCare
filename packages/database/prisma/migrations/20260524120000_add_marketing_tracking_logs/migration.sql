-- CreateEnum
CREATE TYPE "MarketingTrackingProvider" AS ENUM ('META_PIXEL', 'META_CAPI', 'TIKTOK', 'GA4', 'SNAP');

-- CreateEnum
CREATE TYPE "MarketingTrackingStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "MarketingTrackingLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId" UUID NOT NULL,
    "provider" "MarketingTrackingProvider" NOT NULL,
    "eventName" VARCHAR(120) NOT NULL,
    "status" "MarketingTrackingStatus" NOT NULL,
    "message" VARCHAR(500),
    "eventId" VARCHAR(160),
    "bookingRequestId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingTrackingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingTrackingLog_centerId_createdAt_idx" ON "MarketingTrackingLog"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingTrackingLog_centerId_provider_createdAt_idx" ON "MarketingTrackingLog"("centerId", "provider", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingTrackingLog_bookingRequestId_idx" ON "MarketingTrackingLog"("bookingRequestId");

-- AddForeignKey
ALTER TABLE "MarketingTrackingLog" ADD CONSTRAINT "MarketingTrackingLog_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
