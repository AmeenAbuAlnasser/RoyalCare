-- CreateTable: Plan
-- Stores canonical subscription plan definitions for RoyalCare.
-- planCode/planName on Subscription remain unchanged as denormalized strings.
-- Subscription.planId is nullable so existing rows are unaffected.

CREATE TABLE "Plan" (
    "id"                     UUID         NOT NULL,
    "code"                   VARCHAR(80)  NOT NULL,
    "nameEn"                 VARCHAR(120) NOT NULL,
    "nameAr"                 VARCHAR(120) NOT NULL,
    "nameHe"                 VARCHAR(120) NOT NULL,
    "descriptionEn"          TEXT,
    "descriptionAr"          TEXT,
    "descriptionHe"          TEXT,
    "yearlyPrice"            DECIMAL(10,2) NOT NULL,
    "currency"               VARCHAR(10)  NOT NULL DEFAULT 'USD',
    "isActive"               BOOLEAN      NOT NULL DEFAULT true,
    "isPublic"               BOOLEAN      NOT NULL DEFAULT true,
    "isPopular"              BOOLEAN      NOT NULL DEFAULT false,
    "isContactPricing"       BOOLEAN      NOT NULL DEFAULT false,
    "displayOrder"           INTEGER      NOT NULL DEFAULT 0,
    "maxUsers"               INTEGER,
    "maxPatients"            INTEGER,
    "maxAppointmentsPerMonth" INTEGER,
    "features"               JSONB,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex: supports public pricing page query (isActive + isPublic ordered by displayOrder)
CREATE INDEX "Plan_isActive_isPublic_displayOrder_idx" ON "Plan"("isActive", "isPublic", "displayOrder");

-- AlterTable: add nullable planId FK to Subscription
-- Nullable so all existing rows are unaffected. Backfill runs in seed script.
ALTER TABLE "Subscription" ADD COLUMN "planId" UUID;

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
