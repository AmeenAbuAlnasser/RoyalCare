-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable: add bufferMinutes to Service
ALTER TABLE "Service" ADD COLUMN "bufferMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: CenterWorkingHours
CREATE TABLE "CenterWorkingHours" (
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId"  UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "isOpen"    BOOLEAN NOT NULL DEFAULT true,
    "openTime"  VARCHAR(5) NOT NULL,
    "closeTime" VARCHAR(5) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterWorkingHours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CenterWorkingHours_centerId_dayOfWeek_key" ON "CenterWorkingHours"("centerId", "dayOfWeek");
CREATE INDEX "CenterWorkingHours_centerId_idx" ON "CenterWorkingHours"("centerId");

ALTER TABLE "CenterWorkingHours"
    ADD CONSTRAINT "CenterWorkingHours_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CenterClosedDay
CREATE TABLE "CenterClosedDay" (
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId"  UUID NOT NULL,
    "date"      DATE NOT NULL,
    "reason"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterClosedDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CenterClosedDay_centerId_date_key" ON "CenterClosedDay"("centerId", "date");
CREATE INDEX "CenterClosedDay_centerId_date_idx" ON "CenterClosedDay"("centerId", "date");

ALTER TABLE "CenterClosedDay"
    ADD CONSTRAINT "CenterClosedDay_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProviderWorkingHours
CREATE TABLE "ProviderWorkingHours" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId"    UUID NOT NULL,
    "staffUserId" UUID NOT NULL,
    "dayOfWeek"   "DayOfWeek" NOT NULL,
    "isWorking"   BOOLEAN NOT NULL DEFAULT true,
    "startTime"   VARCHAR(5) NOT NULL,
    "endTime"     VARCHAR(5) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderWorkingHours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderWorkingHours_centerId_staffUserId_dayOfWeek_key" ON "ProviderWorkingHours"("centerId", "staffUserId", "dayOfWeek");
CREATE INDEX "ProviderWorkingHours_centerId_staffUserId_idx" ON "ProviderWorkingHours"("centerId", "staffUserId");
CREATE INDEX "ProviderWorkingHours_centerId_idx" ON "ProviderWorkingHours"("centerId");

ALTER TABLE "ProviderWorkingHours"
    ADD CONSTRAINT "ProviderWorkingHours_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderWorkingHours"
    ADD CONSTRAINT "ProviderWorkingHours_staffUserId_fkey"
    FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProviderLeaveDay
CREATE TABLE "ProviderLeaveDay" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId"    UUID NOT NULL,
    "staffUserId" UUID NOT NULL,
    "date"        DATE NOT NULL,
    "reason"      TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderLeaveDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderLeaveDay_centerId_staffUserId_date_key" ON "ProviderLeaveDay"("centerId", "staffUserId", "date");
CREATE INDEX "ProviderLeaveDay_centerId_staffUserId_date_idx" ON "ProviderLeaveDay"("centerId", "staffUserId", "date");
CREATE INDEX "ProviderLeaveDay_centerId_idx" ON "ProviderLeaveDay"("centerId");

ALTER TABLE "ProviderLeaveDay"
    ADD CONSTRAINT "ProviderLeaveDay_centerId_fkey"
    FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderLeaveDay"
    ADD CONSTRAINT "ProviderLeaveDay_staffUserId_fkey"
    FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
