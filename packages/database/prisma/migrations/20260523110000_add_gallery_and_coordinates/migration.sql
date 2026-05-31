-- Add latitude/longitude to BrandingSettings
ALTER TABLE "BrandingSettings" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "BrandingSettings" ADD COLUMN "longitude" DECIMAL(10,7);

-- Create CenterGalleryImage table
CREATE TABLE "CenterGalleryImage" (
    "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "centerId"  UUID         NOT NULL,
    "imageUrl"  VARCHAR(500) NOT NULL,
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CenterGalleryImage_centerId_sortOrder_idx" ON "CenterGalleryImage"("centerId", "sortOrder");

ALTER TABLE "CenterGalleryImage"
    ADD CONSTRAINT "CenterGalleryImage_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "Center"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
