ALTER TABLE "Appointment"
  ADD COLUMN "customServiceName" VARCHAR(160),
  ADD COLUMN "customServiceDuration" INTEGER,
  ADD COLUMN "customServicePrice" DECIMAL(10, 2),
  ADD COLUMN "customServiceCurrency" VARCHAR(10),
  ADD COLUMN "customServiceSaved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Invoice"
  ADD COLUMN "customServiceName" VARCHAR(160),
  ALTER COLUMN "serviceId" DROP NOT NULL;
