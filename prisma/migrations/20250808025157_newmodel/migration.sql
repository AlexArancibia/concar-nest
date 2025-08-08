/*
  Warnings:

  - You are about to drop the column `description` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `entryDate` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `entryNumber` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `expenseId` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `isBalanced` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `totalCredit` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `totalDebit` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `accounting_entries` table. All the data in the column will be lost.
  - You are about to drop the column `accountName` on the `accounting_entry_lines` table. All the data in the column will be lost.
  - You are about to drop the column `costCenterCode` on the `accounting_entry_lines` table. All the data in the column will be lost.
  - You are about to drop the column `detailId` on the `accounting_entry_lines` table. All the data in the column will be lost.
  - You are about to drop the `accounting_entry_details` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `conciliationId` on table `accounting_entries` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `templateNumber` to the `accounting_entry_templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accounting_entries" DROP CONSTRAINT "accounting_entries_conciliationId_fkey";

-- DropForeignKey
ALTER TABLE "accounting_entries" DROP CONSTRAINT "accounting_entries_documentId_fkey";

-- DropForeignKey
ALTER TABLE "accounting_entries" DROP CONSTRAINT "accounting_entries_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "accounting_entries" DROP CONSTRAINT "accounting_entries_templateId_fkey";

-- DropForeignKey
ALTER TABLE "accounting_entries" DROP CONSTRAINT "accounting_entries_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "accounting_entry_details" DROP CONSTRAINT "accounting_entry_details_templateId_fkey";

-- DropForeignKey
ALTER TABLE "accounting_entry_lines" DROP CONSTRAINT "accounting_entry_lines_detailId_fkey";

-- DropIndex
DROP INDEX "accounting_entries_companyId_entryNumber_key";

-- AlterTable
ALTER TABLE "accounting_accounts" ALTER COLUMN "id" SET DEFAULT 'aa_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "accounting_entries" DROP COLUMN "description",
DROP COLUMN "documentId",
DROP COLUMN "entryDate",
DROP COLUMN "entryNumber",
DROP COLUMN "expenseId",
DROP COLUMN "isBalanced",
DROP COLUMN "templateId",
DROP COLUMN "totalCredit",
DROP COLUMN "totalDebit",
DROP COLUMN "transactionId",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "id" SET DEFAULT 'ae_' || substr(gen_random_uuid()::text, 1, 13),
ALTER COLUMN "conciliationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "accounting_entry_lines" DROP COLUMN "accountName",
DROP COLUMN "costCenterCode",
DROP COLUMN "detailId",
ALTER COLUMN "id" SET DEFAULT 'ael_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "accounting_entry_templates" ADD COLUMN     "document" TEXT,
ADD COLUMN     "templateNumber" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT 'aet_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT 'audl_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "bank_accounts" ALTER COLUMN "id" SET DEFAULT 'bkacc_' || substr(gen_random_uuid()::text, 1, 13);

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

-- DropTable
DROP TABLE "accounting_entry_details";

-- CreateTable
CREATE TABLE "accounting_entry_template_lines" (
    "id" TEXT NOT NULL DEFAULT 'aetl_' || substr(gen_random_uuid()::text, 1, 13),
    "templateId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "applicationType" "ApplicationType" NOT NULL,
    "calculationBase" "CalculationBase",
    "value" DECIMAL(14,2),
    "executionOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entry_template_lines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "accounting_entry_template_lines" ADD CONSTRAINT "accounting_entry_template_lines_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "accounting_entry_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_conciliationId_fkey" FOREIGN KEY ("conciliationId") REFERENCES "conciliations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
