-- Add tenant-scoped marketing settings storage.
CREATE TABLE "TenantMarketingSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId" UUID NOT NULL,
    "metaPixelId" VARCHAR(120),
    "metaConversionApiToken" TEXT,
    "tiktokPixelId" VARCHAR(120),
    "snapPixelId" VARCHAR(120),
    "ga4Id" VARCHAR(120),
    "gtmId" VARCHAR(120),
    "customHeadScript" TEXT,
    "customBodyScript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMarketingSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantMarketingSettings_centerId_key" ON "TenantMarketingSettings"("centerId");
CREATE INDEX "TenantMarketingSettings_centerId_idx" ON "TenantMarketingSettings"("centerId");

ALTER TABLE "TenantMarketingSettings"
ADD CONSTRAINT "TenantMarketingSettings_centerId_fkey"
FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
