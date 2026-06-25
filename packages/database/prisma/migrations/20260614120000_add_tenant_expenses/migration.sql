-- Add tenant expense management.

CREATE TYPE "ExpenseStatus" AS ENUM ('PAID', 'PENDING', 'RECURRING', 'CANCELLED');

CREATE TABLE "ExpenseCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#0B2D5C',
    "icon" VARCHAR(60) NOT NULL DEFAULT 'receipt',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseRecurrence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId" UUID NOT NULL,
    "categoryId" UUID,
    "branchId" UUID,
    "createdByUserId" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'ILS',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "vendorName" VARCHAR(180),
    "invoiceNumber" VARCHAR(120),
    "notes" TEXT,
    "tags" JSONB,
    "dayOfMonth" INTEGER NOT NULL,
    "nextGenerationDate" TIMESTAMP(3) NOT NULL,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseRecurrence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Expense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "centerId" UUID NOT NULL,
    "categoryId" UUID,
    "branchId" UUID,
    "createdByUserId" UUID NOT NULL,
    "recurrenceId" UUID,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'ILS',
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "receiptUrl" VARCHAR(600),
    "invoiceNumber" VARCHAR(120),
    "vendorName" VARCHAR(180),
    "notes" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseCategory_centerId_name_key" ON "ExpenseCategory"("centerId", "name");
CREATE INDEX "ExpenseCategory_centerId_idx" ON "ExpenseCategory"("centerId");
CREATE INDEX "ExpenseCategory_centerId_isActive_sortOrder_idx" ON "ExpenseCategory"("centerId", "isActive", "sortOrder");

CREATE INDEX "ExpenseRecurrence_centerId_idx" ON "ExpenseRecurrence"("centerId");
CREATE INDEX "ExpenseRecurrence_centerId_isPaused_nextGenerationDate_idx" ON "ExpenseRecurrence"("centerId", "isPaused", "nextGenerationDate");
CREATE INDEX "ExpenseRecurrence_categoryId_idx" ON "ExpenseRecurrence"("categoryId");
CREATE INDEX "ExpenseRecurrence_branchId_idx" ON "ExpenseRecurrence"("branchId");
CREATE INDEX "ExpenseRecurrence_createdByUserId_idx" ON "ExpenseRecurrence"("createdByUserId");

CREATE INDEX "Expense_centerId_idx" ON "Expense"("centerId");
CREATE INDEX "Expense_centerId_status_idx" ON "Expense"("centerId", "status");
CREATE INDEX "Expense_centerId_expenseDate_idx" ON "Expense"("centerId", "expenseDate");
CREATE INDEX "Expense_centerId_categoryId_idx" ON "Expense"("centerId", "categoryId");
CREATE INDEX "Expense_centerId_branchId_idx" ON "Expense"("centerId", "branchId");
CREATE INDEX "Expense_centerId_recurrenceId_idx" ON "Expense"("centerId", "recurrenceId");
CREATE INDEX "Expense_createdByUserId_idx" ON "Expense"("createdByUserId");

ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExpenseRecurrence" ADD CONSTRAINT "ExpenseRecurrence_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseRecurrence" ADD CONSTRAINT "ExpenseRecurrence_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseRecurrence" ADD CONSTRAINT "ExpenseRecurrence_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "CenterBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseRecurrence" ADD CONSTRAINT "ExpenseRecurrence_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "CenterBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "ExpenseRecurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
