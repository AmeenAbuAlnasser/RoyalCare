-- Add snapPixelId column to PlatformTrackingConfig
ALTER TABLE "PlatformTrackingConfig" ADD COLUMN IF NOT EXISTS "snapPixelId" VARCHAR(120);
