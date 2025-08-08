-- CreateEnum
CREATE TYPE "AccountingEntryFilter" AS ENUM ('INVOICES', 'PAYROLL', 'BOTH');

-- CreateEnum
CREATE TYPE "AccountingEntryCurrency" AS ENUM ('ALL', 'PEN', 'USD');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE', 'TRANSACTION_AMOUNT');

-- CreateEnum
CREATE TYPE "CalculationBase" AS ENUM ('SUBTOTAL', 'IGV', 'TOTAL', 'RENT', 'TAX', 'OTHER');

-- AlterTable
ALTER TABLE "accounting_accounts" ALTER COLUMN "id" SET DEFAULT 'aa_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT 'audl_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "accountingAccountId" TEXT,
ADD COLUMN     "annexCode" TEXT,
ALTER COLUMN "id" SET DEFAULT 'bkacc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "banks" ALTER COLUMN "id" SET DEFAULT 'bank_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "id" SET DEFAULT 'cmp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "conciliation_expenses" ALTER COLUMN "id" SET DEFAULT 'cexp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "conciliation_items" ALTER COLUMN "id" SET DEFAULT 'citem_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "conciliations" ALTER COLUMN "id" SET DEFAULT 'conc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "cost_centers" ALTER COLUMN "id" SET DEFAULT 'cc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_account_links" ALTER COLUMN "id" SET DEFAULT 'dal_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_cost_center_links" ALTER COLUMN "id" SET DEFAULT 'dcc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_detractions" ALTER COLUMN "id" SET DEFAULT 'ddtr_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_digital_signatures" ALTER COLUMN "id" SET DEFAULT 'dds_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_line_account_links" ALTER COLUMN "id" SET DEFAULT 'dlal_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_line_cost_center_links" ALTER COLUMN "id" SET DEFAULT 'dlcc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_lines" ALTER COLUMN "id" SET DEFAULT 'dline_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_payment_terms" ALTER COLUMN "id" SET DEFAULT 'dpt_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_xml_data" ALTER COLUMN "id" SET DEFAULT 'xml_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "id" SET DEFAULT 'doc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "expense_categories" ALTER COLUMN "id" SET DEFAULT 'ec_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "id" SET DEFAULT 'exp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT 'sess_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "sunat_invoices" ALTER COLUMN "id" SET DEFAULT 'sinv_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "sunat_rhe" ALTER COLUMN "id" SET DEFAULT 'srhe_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "supplier_bank_accounts" ALTER COLUMN "id" SET DEFAULT 'sba_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT 'spp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "tax_schemes" ALTER COLUMN "id" SET DEFAULT 'ts_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT 'tran_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT 'us_' || substr(gen_random_uuid()::text, 1, 13);

-- CreateTable
CREATE TABLE "accounting_entry_templates" (
    "id" TEXT NOT NULL DEFAULT 'aet_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filter" "AccountingEntryFilter" NOT NULL,
    "currency" "AccountingEntryCurrency" NOT NULL,
    "transactionType" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entry_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entry_details" (
    "id" TEXT NOT NULL DEFAULT 'aed_' || substr(gen_random_uuid()::text, 1, 13),
    "templateId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "applicationType" "ApplicationType" NOT NULL,
    "calculationBase" "CalculationBase",
    "value" DECIMAL(14,2),
    "executionOrder" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entry_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL DEFAULT 'ae_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "templateId" TEXT,
    "entryNumber" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "totalDebit" DECIMAL(15,2) NOT NULL,
    "totalCredit" DECIMAL(15,2) NOT NULL,
    "isBalanced" BOOLEAN NOT NULL DEFAULT false,
    "documentId" TEXT,
    "transactionId" TEXT,
    "expenseId" TEXT,
    "conciliationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entry_lines" (
    "id" TEXT NOT NULL DEFAULT 'ael_' || substr(gen_random_uuid()::text, 1, 13),
    "entryId" TEXT NOT NULL,
    "detailId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT,
    "movementType" "MovementType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "auxiliaryCode" TEXT,
    "costCenterCode" TEXT,
    "documentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entries_companyId_entryNumber_key" ON "accounting_entries"("companyId", "entryNumber");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_accountingAccountId_fkey" FOREIGN KEY ("accountingAccountId") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry_templates" ADD CONSTRAINT "accounting_entry_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "accounting_entry_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "accounting_entry_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_conciliationId_fkey" FOREIGN KEY ("conciliationId") REFERENCES "conciliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry_lines" ADD CONSTRAINT "accounting_entry_lines_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "accounting_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry_lines" ADD CONSTRAINT "accounting_entry_lines_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "accounting_entry_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
