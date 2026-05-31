CREATE TABLE IF NOT EXISTS "PublicFeaturedService" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "titleAr"       VARCHAR(200) NOT NULL,
    "titleEn"       VARCHAR(200) NOT NULL,
    "titleHe"       VARCHAR(200) NOT NULL DEFAULT '',
    "descriptionAr" VARCHAR(500) NOT NULL DEFAULT '',
    "descriptionEn" VARCHAR(500) NOT NULL DEFAULT '',
    "descriptionHe" VARCHAR(500) NOT NULL DEFAULT '',
    "imageUrl"      VARCHAR(500),
    "slug"          VARCHAR(160) NOT NULL,
    "sortOrder"     INTEGER      NOT NULL DEFAULT 0,
    "isActive"      BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicFeaturedService_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'PublicFeaturedService' AND indexname = 'PublicFeaturedService_slug_key'
  ) THEN
    CREATE UNIQUE INDEX "PublicFeaturedService_slug_key" ON "PublicFeaturedService"("slug");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'PublicFeaturedService' AND indexname = 'PublicFeaturedService_isActive_sortOrder_idx'
  ) THEN
    CREATE INDEX "PublicFeaturedService_isActive_sortOrder_idx" ON "PublicFeaturedService"("isActive", "sortOrder");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'PublicFeaturedService' AND indexname = 'PublicFeaturedService_slug_idx'
  ) THEN
    CREATE INDEX "PublicFeaturedService_slug_idx" ON "PublicFeaturedService"("slug");
  END IF;
END $$;
