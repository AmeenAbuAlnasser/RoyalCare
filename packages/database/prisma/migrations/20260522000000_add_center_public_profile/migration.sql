-- Migration: add_center_public_profile
-- Adds public profile fields to BrandingSettings

ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "coverImageUrl" VARCHAR(500);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "cardImageUrl" VARCHAR(500);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "publicDescriptionAr" VARCHAR(800);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "publicDescriptionEn" VARCHAR(800);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "publicDescriptionHe" VARCHAR(800);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "cityAr" VARCHAR(120);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "cityEn" VARCHAR(120);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "cityHe" VARCHAR(120);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "addressAr" VARCHAR(300);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "addressEn" VARCHAR(300);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "addressHe" VARCHAR(300);
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "whatsappPhone" VARCHAR(30);
