-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT 'audit_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "bank_accounts" ALTER COLUMN "id" SET DEFAULT 'bank_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "id" SET DEFAULT 'comp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "conciliation_items" ALTER COLUMN "id" SET DEFAULT 'conc_item_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "conciliations" ALTER COLUMN "id" SET DEFAULT 'conc_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "document_lines" ADD COLUMN     "allowanceAmount" DECIMAL(12,2),
ADD COLUMN     "allowanceIndicator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "chargeAmount" DECIMAL(12,2),
ADD COLUMN     "chargeIndicator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "exemptAmount" DECIMAL(12,2),
ADD COLUMN     "freeOfChargeIndicator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inaffectedAmount" DECIMAL(12,2),
ADD COLUMN     "itemClassificationCode" TEXT,
ADD COLUMN     "lineNotes" TEXT[],
ADD COLUMN     "orderLineReference" TEXT,
ADD COLUMN     "priceTypeCode" TEXT,
ADD COLUMN     "referencePrice" DECIMAL(12,4),
ADD COLUMN     "taxCategoryId" TEXT,
ADD COLUMN     "taxExemptionReason" TEXT,
ADD COLUMN     "taxSchemeId" TEXT,
ADD COLUMN     "taxSchemeName" TEXT,
ADD COLUMN     "taxTypeCode" TEXT,
ADD COLUMN     "taxableAmount" DECIMAL(12,2),
ADD COLUMN     "unitPriceWithTax" DECIMAL(12,4),
ADD COLUMN     "xmlLineData" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "additionalNotes" TEXT[],
ADD COLUMN     "canonicalizationMethod" TEXT,
ADD COLUMN     "certificateData" TEXT,
ADD COLUMN     "certificateIssuer" TEXT,
ADD COLUMN     "certificateSubject" TEXT,
ADD COLUMN     "contractNumber" TEXT,
ADD COLUMN     "creditAmount" DECIMAL(12,2),
ADD COLUMN     "creditDueDate" TIMESTAMP(3),
ADD COLUMN     "customerAddress" TEXT,
ADD COLUMN     "customerDepartment" TEXT,
ADD COLUMN     "customerDistrict" TEXT,
ADD COLUMN     "customerDocumentNumber" TEXT,
ADD COLUMN     "customerDocumentType" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerProvince" TEXT,
ADD COLUMN     "customerUbigeo" TEXT,
ADD COLUMN     "detractionAccount" TEXT,
ADD COLUMN     "detractionServiceCode" TEXT,
ADD COLUMN     "digestMethod" TEXT,
ADD COLUMN     "digestValue" TEXT,
ADD COLUMN     "digitalSignatureId" TEXT,
ADD COLUMN     "digitalSignatureUri" TEXT,
ADD COLUMN     "documentNotes" TEXT[],
ADD COLUMN     "documentTypeDescription" TEXT,
ADD COLUMN     "installmentAmount" DECIMAL(12,2),
ADD COLUMN     "installmentDueDate" TIMESTAMP(3),
ADD COLUMN     "issueTime" TEXT,
ADD COLUMN     "operationNotes" TEXT[],
ADD COLUMN     "orderReference" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentTermsJson" TEXT,
ADD COLUMN     "signatureDate" TIMESTAMP(3),
ADD COLUMN     "signatureMethod" TEXT,
ADD COLUMN     "signatureValue" TEXT,
ADD COLUMN     "xmlAdditionalData" TEXT,
ADD COLUMN     "xmlCustomizationId" TEXT,
ADD COLUMN     "xmlUblVersion" TEXT;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "id" SET DEFAULT 'exp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT 'supp_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT 'txn_' || substr(gen_random_uuid()::text, 1, 13);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT 'user_' || substr(gen_random_uuid()::text, 1, 13);

-- CreateIndex
CREATE INDEX "document_lines_documentId_lineNumber_idx" ON "document_lines"("documentId", "lineNumber");

-- CreateIndex
CREATE INDEX "documents_customerDocumentNumber_idx" ON "documents"("customerDocumentNumber");

-- CreateIndex
CREATE INDEX "documents_paymentMethod_idx" ON "documents"("paymentMethod");

-- CreateIndex
CREATE INDEX "documents_hasDetraction_idx" ON "documents"("hasDetraction");
