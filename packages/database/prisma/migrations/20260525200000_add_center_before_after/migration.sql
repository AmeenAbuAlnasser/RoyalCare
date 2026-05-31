-- Add center-scoped before/after transformation gallery items.
DO $$ BEGIN
  CREATE TYPE "CenterBeforeAfterCategory" AS ENUM ('LASER', 'SKIN', 'DENTAL', 'HAIR', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "CenterBeforeAfter" (
    "id" UUID NOT NULL,
    "centerId" UUID NOT NULL,
    "titleAr" VARCHAR(180),
    "titleEn" VARCHAR(180),
    "titleHe" VARCHAR(180),
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "descriptionHe" TEXT,
    "category" "CenterBeforeAfterCategory" NOT NULL DEFAULT 'OTHER',
    "beforeImageUrl" VARCHAR(500) NOT NULL,
    "afterImageUrl" VARCHAR(500) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CenterBeforeAfter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CenterBeforeAfter_centerId_isPublished_sortOrder_idx" ON "CenterBeforeAfter"("centerId", "isPublished", "sortOrder");
CREATE INDEX IF NOT EXISTS "CenterBeforeAfter_centerId_category_idx" ON "CenterBeforeAfter"("centerId", "category");
CREATE INDEX IF NOT EXISTS "CenterBeforeAfter_centerId_sortOrder_idx" ON "CenterBeforeAfter"("centerId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "CenterBeforeAfter"
  ADD CONSTRAINT "CenterBeforeAfter_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
