-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'MANAGER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'MICROSOFT', 'GITHUB');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('PERSONA_NATURAL', 'PERSONA_JURIDICA', 'EXTRANJERO');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VALIDATION');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FACTURA', 'BOLETA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'RECIBO_HONORARIOS', 'LIQUIDACION', 'OTROS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'CONCILIATED', 'PARTIALLY_CONCILIATED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CORRIENTE', 'AHORROS', 'PLAZO_FIJO', 'CTS', 'DETRACCIONES', 'OTROS');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('IMPORTED', 'PENDING', 'CONCILIATED', 'PARTIALLY_CONCILIATED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "ConciliationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ConciliationItemType" AS ENUM ('DOCUMENT_TRANSACTION', 'DOCUMENT_ONLY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ConciliationItemStatus" AS ENUM ('MATCHED', 'PARTIAL_MATCH', 'UNMATCHED', 'PENDING', 'DISPUTED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('IMPORTED', 'PROCESSED', 'CONCILIATED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('BANK_TRANSACTION', 'ITF', 'DETRACTION', 'PAYMENT', 'SERVICE', 'RENT', 'UTILITIES', 'BANK_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'CONCILIATE', 'APPROVE', 'REJECT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT 'user_' || substr(gen_random_uuid()::text, 1, 13),
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "authProviderId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "phone" TEXT,
    "bio" TEXT,
    "preferences" JSONB,
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL DEFAULT 'comp_' || substr(gen_random_uuid()::text, 1, 13),
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "ruc" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL DEFAULT 'supp_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "tradeName" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "supplierType" "SupplierType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "district" TEXT,
    "province" TEXT,
    "department" TEXT,
    "country" TEXT DEFAULT 'PE',
    "bankAccounts" JSONB,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditLimit" DECIMAL(15,2),
    "paymentTerms" INTEGER,
    "taxCategory" TEXT,
    "isRetentionAgent" BOOLEAN NOT NULL DEFAULT false,
    "retentionRate" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "fullNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "issueTime" TEXT,
    "dueDate" TIMESTAMP(3),
    "receptionDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "exchangeRate" DECIMAL(10,6),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "igv" DECIMAL(12,2) NOT NULL,
    "otherTaxes" DECIMAL(12,2),
    "total" DECIMAL(12,2) NOT NULL,
    "customerDocumentType" TEXT,
    "customerDocumentNumber" TEXT,
    "customerName" TEXT,
    "customerAddress" TEXT,
    "customerUbigeo" TEXT,
    "customerDistrict" TEXT,
    "customerProvince" TEXT,
    "customerDepartment" TEXT,
    "hasRetention" BOOLEAN NOT NULL DEFAULT false,
    "retentionAmount" DECIMAL(12,2),
    "retentionPercentage" DECIMAL(5,2),
    "hasDetraction" BOOLEAN NOT NULL DEFAULT false,
    "detractionAmount" DECIMAL(12,2),
    "detractionCode" TEXT,
    "detractionPercentage" DECIMAL(5,2),
    "detractionServiceCode" TEXT,
    "detractionAccount" TEXT,
    "paymentMethod" TEXT,
    "creditAmount" DECIMAL(12,2),
    "creditDueDate" TIMESTAMP(3),
    "installmentAmount" DECIMAL(12,2),
    "installmentDueDate" TIMESTAMP(3),
    "paymentTermsJson" TEXT,
    "netPayableAmount" DECIMAL(12,2) NOT NULL,
    "conciliatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "observations" TEXT,
    "tags" TEXT[],
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "xmlFileName" TEXT,
    "xmlContent" TEXT,
    "xmlHash" TEXT,
    "xmlUblVersion" TEXT,
    "xmlCustomizationId" TEXT,
    "documentTypeDescription" TEXT,
    "sunatResponseCode" TEXT,
    "cdrStatus" TEXT,
    "sunatProcessDate" TIMESTAMP(3),
    "digitalSignatureId" TEXT,
    "digitalSignatureUri" TEXT,
    "certificateIssuer" TEXT,
    "certificateSubject" TEXT,
    "signatureDate" TIMESTAMP(3),
    "signatureValue" TEXT,
    "certificateData" TEXT,
    "canonicalizationMethod" TEXT,
    "signatureMethod" TEXT,
    "digestMethod" TEXT,
    "digestValue" TEXT,
    "pdfFile" TEXT,
    "qrCode" TEXT,
    "orderReference" TEXT,
    "contractNumber" TEXT,
    "additionalNotes" TEXT[],
    "xmlAdditionalData" TEXT,
    "documentNotes" TEXT[],
    "operationNotes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_lines" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "productCode" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitCode" TEXT NOT NULL DEFAULT 'NIU',
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "unitPriceWithTax" DECIMAL(12,4),
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "igvAmount" DECIMAL(12,2),
    "taxExemptionCode" TEXT,
    "taxExemptionReason" TEXT,
    "taxPercentage" DECIMAL(5,2),
    "taxCategoryId" TEXT,
    "taxSchemeId" TEXT,
    "taxSchemeName" TEXT,
    "taxTypeCode" TEXT,
    "priceTypeCode" TEXT,
    "referencePrice" DECIMAL(12,4),
    "itemClassificationCode" TEXT,
    "freeOfChargeIndicator" BOOLEAN NOT NULL DEFAULT false,
    "allowanceAmount" DECIMAL(12,2),
    "allowanceIndicator" BOOLEAN NOT NULL DEFAULT false,
    "chargeAmount" DECIMAL(12,2),
    "chargeIndicator" BOOLEAN NOT NULL DEFAULT false,
    "orderLineReference" TEXT,
    "lineNotes" TEXT[],
    "taxableAmount" DECIMAL(12,2),
    "exemptAmount" DECIMAL(12,2),
    "inaffectedAmount" DECIMAL(12,2),
    "xmlLineData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL DEFAULT 'bank_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountType" "BankAccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "alias" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "initialBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL DEFAULT 'txn_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "branch" TEXT,
    "operationNumber" TEXT NOT NULL,
    "operationTime" TEXT,
    "operatorUser" TEXT,
    "utc" TEXT,
    "reference" TEXT,
    "channel" TEXT,
    "fileName" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isITF" BOOLEAN NOT NULL DEFAULT false,
    "isDetraction" BOOLEAN NOT NULL DEFAULT false,
    "isBankFee" BOOLEAN NOT NULL DEFAULT false,
    "isTransfer" BOOLEAN NOT NULL DEFAULT false,
    "supplierId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'IMPORTED',
    "conciliatedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(15,2) NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliations" (
    "id" TEXT NOT NULL DEFAULT 'conc_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "conciliatedItems" INTEGER NOT NULL DEFAULT 0,
    "pendingItems" INTEGER NOT NULL DEFAULT 0,
    "bankBalance" DECIMAL(15,2) NOT NULL,
    "bookBalance" DECIMAL(15,2) NOT NULL,
    "difference" DECIMAL(15,2) NOT NULL,
    "toleranceAmount" DECIMAL(10,2) DEFAULT 0,
    "status" "ConciliationStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "conciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliation_items" (
    "id" TEXT NOT NULL DEFAULT 'conc_item_' || substr(gen_random_uuid()::text, 1, 13),
    "conciliationId" TEXT NOT NULL,
    "itemType" "ConciliationItemType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentAmount" DECIMAL(15,2) NOT NULL,
    "conciliatedAmount" DECIMAL(15,2) NOT NULL,
    "difference" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "distributionPercentage" DECIMAL(5,4),
    "detractionAmount" DECIMAL(15,2),
    "retentionAmount" DECIMAL(15,2),
    "status" "ConciliationItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "systemNotes" TEXT,
    "conciliatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL DEFAULT 'exp_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "operationDesc" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "branch" TEXT,
    "operationNumber" TEXT NOT NULL,
    "operationTime" TEXT,
    "user" TEXT,
    "utc" TEXT,
    "reference2" TEXT,
    "documentType" TEXT,
    "fiscalFolio" TEXT,
    "supplierName" TEXT,
    "concept" TEXT,
    "totalAmount" DECIMAL(15,2),
    "subtotal" DECIMAL(15,2),
    "igv" DECIMAL(15,2),
    "isr" DECIMAL(15,2),
    "discipline" TEXT,
    "location" TEXT,
    "generalCategory" TEXT,
    "type" TEXT,
    "account" TEXT,
    "subAccount" TEXT,
    "accountingMonth" TEXT,
    "accountingAccount" TEXT,
    "comments" TEXT,
    "supplierRuc" TEXT,
    "documentDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "isMassive" BOOLEAN NOT NULL DEFAULT false,
    "expenseType" "ExpenseType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "supplierId" TEXT,
    "documentId" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'IMPORTED',
    "originalFileName" TEXT,
    "rowHash" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT 'audit_' || substr(gen_random_uuid()::text, 1, 13),
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "companies_ruc_key" ON "companies"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_documentNumber_key" ON "suppliers"("companyId", "documentNumber");

-- CreateIndex
CREATE INDEX "documents_companyId_status_idx" ON "documents"("companyId", "status");

-- CreateIndex
CREATE INDEX "documents_companyId_issueDate_idx" ON "documents"("companyId", "issueDate");

-- CreateIndex
CREATE INDEX "documents_supplierId_idx" ON "documents"("supplierId");

-- CreateIndex
CREATE INDEX "documents_xmlHash_idx" ON "documents"("xmlHash");

-- CreateIndex
CREATE INDEX "documents_customerDocumentNumber_idx" ON "documents"("customerDocumentNumber");

-- CreateIndex
CREATE INDEX "documents_paymentMethod_idx" ON "documents"("paymentMethod");

-- CreateIndex
CREATE INDEX "documents_hasDetraction_idx" ON "documents"("hasDetraction");

-- CreateIndex
CREATE UNIQUE INDEX "documents_companyId_series_number_key" ON "documents"("companyId", "series", "number");

-- CreateIndex
CREATE INDEX "document_lines_documentId_lineNumber_idx" ON "document_lines"("documentId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_companyId_accountNumber_key" ON "bank_accounts"("companyId", "accountNumber");

-- CreateIndex
CREATE INDEX "transactions_companyId_bankAccountId_idx" ON "transactions"("companyId", "bankAccountId");

-- CreateIndex
CREATE INDEX "transactions_companyId_transactionDate_idx" ON "transactions"("companyId", "transactionDate");

-- CreateIndex
CREATE INDEX "transactions_companyId_status_idx" ON "transactions"("companyId", "status");

-- CreateIndex
CREATE INDEX "transactions_bankAccountId_transactionDate_idx" ON "transactions"("bankAccountId", "transactionDate");

-- CreateIndex
CREATE INDEX "transactions_supplierId_idx" ON "transactions"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bankAccountId_operationNumber_transactionDate__key" ON "transactions"("bankAccountId", "operationNumber", "transactionDate", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionHash_key" ON "transactions"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "conciliations_transactionId_key" ON "conciliations"("transactionId");

-- CreateIndex
CREATE INDEX "conciliations_companyId_bankAccountId_idx" ON "conciliations"("companyId", "bankAccountId");

-- CreateIndex
CREATE INDEX "conciliations_companyId_periodStart_periodEnd_idx" ON "conciliations"("companyId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "conciliations_transactionId_idx" ON "conciliations"("transactionId");

-- CreateIndex
CREATE INDEX "conciliation_items_conciliationId_idx" ON "conciliation_items"("conciliationId");

-- CreateIndex
CREATE INDEX "conciliation_items_documentId_idx" ON "conciliation_items"("documentId");

-- CreateIndex
CREATE INDEX "expenses_companyId_status_idx" ON "expenses"("companyId", "status");

-- CreateIndex
CREATE INDEX "expenses_companyId_transactionDate_idx" ON "expenses"("companyId", "transactionDate");

-- CreateIndex
CREATE INDEX "expenses_companyId_expenseType_idx" ON "expenses"("companyId", "expenseType");

-- CreateIndex
CREATE INDEX "expenses_bankAccountId_transactionDate_idx" ON "expenses"("bankAccountId", "transactionDate");

-- CreateIndex
CREATE INDEX "expenses_supplierId_idx" ON "expenses"("supplierId");

-- CreateIndex
CREATE INDEX "expenses_documentId_idx" ON "expenses"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_bankAccountId_operationNumber_transactionDate_amou_key" ON "expenses"("bankAccountId", "operationNumber", "transactionDate", "amount");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_lines" ADD CONSTRAINT "document_lines_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliation_items" ADD CONSTRAINT "conciliation_items_conciliationId_fkey" FOREIGN KEY ("conciliationId") REFERENCES "conciliations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliation_items" ADD CONSTRAINT "conciliation_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
