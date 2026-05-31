-- Add center-scoped public reviews/testimonials for Center Website Builder v1.
CREATE TABLE IF NOT EXISTS "CenterReview" (
    "id" UUID NOT NULL,
    "centerId" UUID NOT NULL,
    "customerName" VARCHAR(160) NOT NULL,
    "rating" INTEGER NOT NULL,
    "commentAr" TEXT,
    "commentEn" TEXT,
    "commentHe" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CenterReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CenterReview_centerId_isPublished_sortOrder_idx" ON "CenterReview"("centerId", "isPublished", "sortOrder");
CREATE INDEX IF NOT EXISTS "CenterReview_centerId_sortOrder_idx" ON "CenterReview"("centerId", "sortOrder");

ALTER TABLE "CenterReview"
ADD CONSTRAINT "CenterReview_centerId_fkey"
FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
