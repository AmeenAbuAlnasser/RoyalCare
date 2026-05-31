-- CreateTable
CREATE TABLE "SubscriptionInvoiceNumberCounter" (
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionInvoiceNumberCounter_pkey" PRIMARY KEY ("year")
);

