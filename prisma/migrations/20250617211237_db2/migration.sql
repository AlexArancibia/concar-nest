/*
  Warnings:

  - You are about to drop the column `customerRuc` on the `sunat_invoices` table. All the data in the column will be lost.
  - You are about to drop the column `issuerName` on the `sunat_invoices` table. All the data in the column will be lost.
  - You are about to drop the column `issuerRuc` on the `sunat_invoices` table. All the data in the column will be lost.
  - Added the required column `carSunat` to the `sunat_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `sunat_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruc` to the `sunat_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isFree` to the `sunat_rhe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuerDocumentType` to the `sunat_rhe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentType` to the `sunat_rhe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounting_accounts" ALTER COLUMN "id" SET DEFAULT 'aa_' || substr(gen_random_uuid()::text, 1, 13);

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
ALTER TABLE "sunat_invoices" DROP COLUMN "customerRuc",
DROP COLUMN "issuerName",
DROP COLUMN "issuerRuc",
ADD COLUMN     "carOrigin" TEXT,
ADD COLUMN     "carSunat" TEXT NOT NULL,
ADD COLUMN     "damCode" TEXT,
ADD COLUMN     "detraction" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(10,4),
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "goodsServicesClass" TEXT,
ADD COLUMN     "icbper" DECIMAL(15,2),
ADD COLUMN     "identityDocumentNumber" TEXT,
ADD COLUMN     "identityDocumentType" TEXT,
ADD COLUMN     "igvDng" DECIMAL(15,2),
ADD COLUMN     "igvNg" DECIMAL(15,2),
ADD COLUMN     "imb" TEXT,
ADD COLUMN     "incal" TEXT,
ADD COLUMN     "invoiceStatus" TEXT,
ADD COLUMN     "isc" DECIMAL(15,2),
ADD COLUMN     "modifiedDocNumber" TEXT,
ADD COLUMN     "modifiedDocSeries" TEXT,
ADD COLUMN     "modifiedDocType" TEXT,
ADD COLUMN     "modifiedIssueDate" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "noteType" TEXT,
ADD COLUMN     "otherCharges" DECIMAL(15,2),
ADD COLUMN     "participationPercent" DECIMAL(5,2),
ADD COLUMN     "projectOperatorId" TEXT,
ADD COLUMN     "ruc" TEXT NOT NULL,
ADD COLUMN     "taxableBaseDng" DECIMAL(15,2),
ADD COLUMN     "taxableBaseNg" DECIMAL(15,2),
ADD COLUMN     "valueNgAcquisition" DECIMAL(15,2),
ADD COLUMN     "year" TEXT,
ALTER COLUMN "id" SET DEFAULT 'sinv_' || substr(gen_random_uuid()::text, 1, 13),
ALTER COLUMN "customerName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sunat_rhe" ADD COLUMN     "isFree" BOOLEAN NOT NULL,
ADD COLUMN     "issuerDocumentType" TEXT NOT NULL,
ADD COLUMN     "netPendingAmount" DECIMAL(15,2),
ADD COLUMN     "observation" TEXT,
ADD COLUMN     "rentType" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT 'srhe_' || substr(gen_random_uuid()::text, 1, 13);

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
