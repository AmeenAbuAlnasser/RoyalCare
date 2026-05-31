-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CenterLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'DEMO_BOOKED', 'CONVERTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CenterLead" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "centerName"   VARCHAR(200) NOT NULL,
  "ownerName"    VARCHAR(160) NOT NULL,
  "phone"        VARCHAR(32) NOT NULL,
  "whatsapp"     VARCHAR(32),
  "city"         VARCHAR(120),
  "businessType" VARCHAR(120),
  "notes"        VARCHAR(1000),
  "status"       "CenterLeadStatus" NOT NULL DEFAULT 'NEW',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CenterLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CenterLead_status_createdAt_idx" ON "CenterLead"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "CenterLead_createdAt_idx" ON "CenterLead"("createdAt");
