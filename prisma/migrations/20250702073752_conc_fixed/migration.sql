/*
  Warnings:

  - You are about to drop the column `detractionAmount` on the `conciliation_items` table. All the data in the column will be lost.
  - You are about to drop the column `retentionAmount` on the `conciliation_items` table. All the data in the column will be lost.
  - You are about to drop the column `conciliatedAmount` on the `document_detractions` table. All the data in the column will be lost.
  - You are about to drop the column `pendingAmount` on the `document_detractions` table. All the data in the column will be lost.

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
ALTER TABLE "conciliation_items" DROP COLUMN "detractionAmount",
DROP COLUMN "retentionAmount",
ALTER COLUMN "id" SET DEFAULT 'citem_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "conciliations" ALTER COLUMN "id" SET DEFAULT 'conc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "cost_centers" ALTER COLUMN "id" SET DEFAULT 'cc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_account_links" ALTER COLUMN "id" SET DEFAULT 'dal_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_cost_center_links" ALTER COLUMN "id" SET DEFAULT 'dcc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_detractions" DROP COLUMN "conciliatedAmount",
DROP COLUMN "pendingAmount",
ALTER COLUMN "id" SET DEFAULT 'ddtr_' || substr(gen_random_uuid()::text, 1, 13);

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
