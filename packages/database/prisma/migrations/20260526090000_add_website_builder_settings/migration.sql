-- Add simple center website builder settings to BrandingSettings.
ALTER TABLE "BrandingSettings"
  ADD COLUMN IF NOT EXISTS "websiteSectionOrder" JSONB,
  ADD COLUMN IF NOT EXISTS "websiteSectionVisibility" JSONB;
