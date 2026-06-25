-- Add multi-branch public contact/location support for center websites.
CREATE TABLE "CenterBranch" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "centerId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "cityAr" VARCHAR(160),
  "cityEn" VARCHAR(160),
  "cityHe" VARCHAR(160),
  "addressAr" VARCHAR(300),
  "addressEn" VARCHAR(300),
  "addressHe" VARCHAR(300),
  "phone" VARCHAR(40),
  "whatsapp" VARCHAR(40),
  "mapsUrl" VARCHAR(800),
  "workingHoursTextAr" VARCHAR(800),
  "workingHoursTextEn" VARCHAR(800),
  "workingHoursTextHe" VARCHAR(800),
  "isMain" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CenterBranch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CenterBranch"
  ADD CONSTRAINT "CenterBranch_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CenterBranch_centerId_idx" ON "CenterBranch"("centerId");
CREATE INDEX "CenterBranch_centerId_isActive_isMain_sortOrder_idx"
  ON "CenterBranch"("centerId", "isActive", "isMain", "sortOrder");
