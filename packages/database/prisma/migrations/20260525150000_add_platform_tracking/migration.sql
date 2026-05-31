-- CreateTable: PlatformTrackingConfig (singleton, no centerId)
CREATE TABLE "PlatformTrackingConfig" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metaPixelId" VARCHAR(120),
    "metaConversionApiToken" TEXT,
    "tiktokPixelId" VARCHAR(120),
    "ga4Id" VARCHAR(120),
    "gtmId" VARCHAR(120),
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTrackingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlatformTrackingLog (no centerId, platform-level)
CREATE TABLE "PlatformTrackingLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" "MarketingTrackingProvider" NOT NULL,
    "eventName" VARCHAR(120) NOT NULL,
    "status" "MarketingTrackingStatus" NOT NULL,
    "message" VARCHAR(500),
    "eventId" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformTrackingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformTrackingLog_provider_createdAt_idx" ON "PlatformTrackingLog"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformTrackingLog_createdAt_idx" ON "PlatformTrackingLog"("createdAt");
