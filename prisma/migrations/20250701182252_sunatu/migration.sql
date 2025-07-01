/*
  Warnings:

  - A unique constraint covering the columns `[ruc,documentType,series,documentNumber]` on the table `sunat_invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentType,documentNumber,issuerRuc,issueDate]` on the table `sunat_rhe` will be added. If there are existing duplicate values, this will fail.

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

-- CreateIndex
CREATE UNIQUE INDEX "sunat_invoices_ruc_documentType_series_documentNumber_key" ON "sunat_invoices"("ruc", "documentType", "series", "documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sunat_rhe_documentType_documentNumber_issuerRuc_issueDate_key" ON "sunat_rhe"("documentType", "documentNumber", "issuerRuc", "issueDate");
