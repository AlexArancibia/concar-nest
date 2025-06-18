-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ACCOUNTANT', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GITHUB', 'GOOGLE', 'MICROSOFT', 'EMAIL');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'GOVERNMENT', 'FOREIGN');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_APPROVAL');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT', 'PURCHASE_ORDER', 'CONTRACT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT', 'TRANSFER', 'FEE', 'INTEREST');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSED', 'RECONCILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConciliationType" AS ENUM ('DOCUMENTS', 'DETRACTIONS');

-- CreateEnum
CREATE TYPE "ConciliationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConciliationItemType" AS ENUM ('DOCUMENT', 'TRANSACTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ConciliationItemStatus" AS ENUM ('PENDING', 'MATCHED', 'PARTIAL', 'UNMATCHED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('OPERATIONAL', 'ADMINISTRATIVE', 'FINANCIAL', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('IMPORTED', 'PROCESSED', 'RECONCILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT 'us_' || substr(gen_random_uuid()::text, 1, 13),
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "authProviderId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "phone" TEXT,
    "bio" TEXT,
    "preferences" JSONB,
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL DEFAULT 'sess_' || substr(gen_random_uuid()::text, 1, 13),
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL DEFAULT 'cmp_' || substr(gen_random_uuid()::text, 1, 13),
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
CREATE TABLE "accounting_accounts" (
    "id" TEXT NOT NULL DEFAULT 'aa_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "parentAccountId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL DEFAULT 'cc_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentCostCenterId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL DEFAULT 'ec_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "discipline" TEXT,
    "location" TEXT,
    "generalCategory" TEXT,
    "type" TEXT,
    "account" TEXT,
    "subAccount" TEXT,
    "accountingAccount" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_schemes" (
    "id" TEXT NOT NULL DEFAULT 'ts_' || substr(gen_random_uuid()::text, 1, 13),
    "taxSchemeId" TEXT NOT NULL,
    "taxSchemeName" TEXT NOT NULL,
    "taxCategoryId" TEXT,
    "taxTypeCode" TEXT,
    "taxPercentage" DECIMAL(5,4),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL DEFAULT 'spp_' || substr(gen_random_uuid()::text, 1, 13),
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
CREATE TABLE "supplier_bank_accounts" (
    "id" TEXT NOT NULL DEFAULT 'sba_' || substr(gen_random_uuid()::text, 1, 13),
    "supplierId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" "BankAccountType" NOT NULL,
    "currency" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL DEFAULT 'doc_' || substr(gen_random_uuid()::text, 1, 13),
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
    "currency" TEXT NOT NULL,
    "exchangeRate" DECIMAL(10,6) NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "igv" DECIMAL(15,2) NOT NULL,
    "otherTaxes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "hasRetention" BOOLEAN NOT NULL DEFAULT false,
    "retentionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "retentionPercentage" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "netPayableAmount" DECIMAL(15,2) NOT NULL,
    "conciliatedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" TEXT,
    "description" TEXT,
    "observations" TEXT,
    "tags" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "orderReference" TEXT,
    "contractNumber" TEXT,
    "additionalNotes" TEXT,
    "documentNotes" TEXT,
    "operationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_xml_data" (
    "id" TEXT NOT NULL DEFAULT 'xml_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
    "xmlFileName" TEXT,
    "xmlContent" TEXT,
    "xmlHash" TEXT,
    "xmlUblVersion" TEXT,
    "xmlCustomizationId" TEXT,
    "documentTypeDescription" TEXT,
    "sunatResponseCode" TEXT,
    "cdrStatus" TEXT,
    "sunatProcessDate" TIMESTAMP(3),
    "pdfFile" TEXT,
    "qrCode" TEXT,
    "xmlAdditionalData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_xml_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_digital_signatures" (
    "id" TEXT NOT NULL DEFAULT 'dds_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_payment_terms" (
    "id" TEXT NOT NULL DEFAULT 'dpt_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_detractions" (
    "id" TEXT NOT NULL DEFAULT 'ddtr_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
    "hasDetraction" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "code" TEXT,
    "percentage" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "serviceCode" TEXT,
    "account" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentReference" TEXT,
    "isConciliated" BOOLEAN NOT NULL DEFAULT false,
    "conciliatedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "conciliationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_detractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_lines" (
    "id" TEXT NOT NULL DEFAULT 'dline_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "productCode" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,6) NOT NULL,
    "unitCode" TEXT,
    "unitPrice" DECIMAL(15,6) NOT NULL,
    "unitPriceWithTax" DECIMAL(15,6) NOT NULL,
    "lineTotal" DECIMAL(15,2) NOT NULL,
    "igvAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxExemptionCode" TEXT,
    "taxExemptionReason" TEXT,
    "taxSchemeId" TEXT,
    "priceTypeCode" TEXT,
    "referencePrice" DECIMAL(15,6),
    "itemClassificationCode" TEXT,
    "freeOfChargeIndicator" BOOLEAN NOT NULL DEFAULT false,
    "allowanceAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "allowanceIndicator" BOOLEAN NOT NULL DEFAULT false,
    "chargeAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "chargeIndicator" BOOLEAN NOT NULL DEFAULT false,
    "orderLineReference" TEXT,
    "lineNotes" TEXT,
    "taxableAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "exemptAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "inaffectedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "xmlLineData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_account_links" (
    "id" TEXT NOT NULL DEFAULT 'dal_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "percentage" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_account_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_line_account_links" (
    "id" TEXT NOT NULL DEFAULT 'dlal_' || substr(gen_random_uuid()::text, 1, 13),
    "documentLineId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "percentage" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_line_account_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_cost_center_links" (
    "id" TEXT NOT NULL DEFAULT 'dcc_' || substr(gen_random_uuid()::text, 1, 13),
    "documentId" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "percentage" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_cost_center_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_line_cost_center_links" (
    "id" TEXT NOT NULL DEFAULT 'dlcc_' || substr(gen_random_uuid()::text, 1, 13),
    "documentLineId" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "percentage" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_line_cost_center_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL DEFAULT 'bkacc_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" "BankAccountType" NOT NULL,
    "currency" TEXT NOT NULL,
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
    "id" TEXT NOT NULL DEFAULT 'tran_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "branch" TEXT,
    "operationNumber" TEXT,
    "operationTime" TEXT,
    "operatorUser" TEXT,
    "utc" TEXT,
    "reference" TEXT,
    "channel" TEXT,
    "fileName" TEXT,
    "importedAt" TIMESTAMP(3),
    "isITF" BOOLEAN NOT NULL DEFAULT false,
    "isDetraction" BOOLEAN NOT NULL DEFAULT false,
    "isBankFee" BOOLEAN NOT NULL DEFAULT false,
    "isTransfer" BOOLEAN NOT NULL DEFAULT false,
    "supplierId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
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
    "transactionId" TEXT,
    "type" "ConciliationType" NOT NULL DEFAULT 'DOCUMENTS',
    "reference" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "conciliatedItems" INTEGER NOT NULL DEFAULT 0,
    "pendingItems" INTEGER NOT NULL DEFAULT 0,
    "bankBalance" DECIMAL(15,2) NOT NULL,
    "bookBalance" DECIMAL(15,2) NOT NULL,
    "difference" DECIMAL(15,2) NOT NULL,
    "toleranceAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "ConciliationStatus" NOT NULL DEFAULT 'PENDING',
    "additionalExpensesTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2),
    "paymentDate" TIMESTAMP(3),
    "paymentAmount" DECIMAL(15,2),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "conciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliation_items" (
    "id" TEXT NOT NULL DEFAULT 'citem_' || substr(gen_random_uuid()::text, 1, 13),
    "conciliationId" TEXT NOT NULL,
    "itemType" "ConciliationItemType" NOT NULL,
    "documentId" TEXT,
    "documentAmount" DECIMAL(15,2) NOT NULL,
    "conciliatedAmount" DECIMAL(15,2) NOT NULL,
    "difference" DECIMAL(15,2) NOT NULL,
    "distributionPercentage" DECIMAL(5,4) NOT NULL DEFAULT 100,
    "detractionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "retentionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "ConciliationItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "systemNotes" TEXT,
    "conciliatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliation_expenses" (
    "id" TEXT NOT NULL DEFAULT 'cexp_' || substr(gen_random_uuid()::text, 1, 13),
    "conciliationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "accountId" TEXT,
    "notes" TEXT,
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT true,
    "supportingDocument" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conciliation_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL DEFAULT 'exp_' || substr(gen_random_uuid()::text, 1, 13),
    "companyId" TEXT NOT NULL,
    "lineNumber" INTEGER,
    "bankAccountId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "operationDesc" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2),
    "branch" TEXT,
    "operationNumber" TEXT,
    "operationTime" TEXT,
    "user" TEXT,
    "utc" TEXT,
    "reference2" TEXT,
    "documentType" TEXT,
    "fiscalFolio" TEXT,
    "concept" TEXT,
    "totalAmount" DECIMAL(15,2),
    "subtotal" DECIMAL(15,2),
    "igv" DECIMAL(15,2),
    "isr" DECIMAL(15,2),
    "accountingMonth" TEXT,
    "comments" TEXT,
    "documentDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "isMassive" BOOLEAN NOT NULL DEFAULT false,
    "expenseType" "ExpenseType" NOT NULL,
    "currency" TEXT NOT NULL,
    "supplierId" TEXT,
    "documentId" TEXT,
    "expenseCategoryId" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'IMPORTED',
    "originalFileName" TEXT,
    "rowHash" TEXT,
    "importedAt" TIMESTAMP(3),
    "importedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL DEFAULT 'bank_' || substr(gen_random_uuid()::text, 1, 13),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "sunat_rhe" (
    "id" TEXT NOT NULL DEFAULT 'srhe_' || substr(gen_random_uuid()::text, 1, 13),
    "issueDate" TIMESTAMP(3) NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issuerRuc" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL,
    "grossIncome" DECIMAL(15,2) NOT NULL,
    "incomeTax" DECIMAL(15,2) NOT NULL,
    "netIncome" DECIMAL(15,2) NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sunat_rhe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sunat_invoices" (
    "id" TEXT NOT NULL DEFAULT 'sinv_' || substr(gen_random_uuid()::text, 1, 13),
    "issuerRuc" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "documentType" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "customerRuc" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "taxableBase" DECIMAL(15,2) NOT NULL,
    "igv" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sunat_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT 'audl_' || substr(gen_random_uuid()::text, 1, 13),
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "companies_ruc_key" ON "companies"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_companyId_accountCode_key" ON "accounting_accounts"("companyId", "accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_companyId_code_key" ON "cost_centers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_schemes_taxSchemeId_key" ON "tax_schemes"("taxSchemeId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_documentNumber_key" ON "suppliers"("companyId", "documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "documents_companyId_fullNumber_key" ON "documents"("companyId", "fullNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_xml_data_documentId_key" ON "document_xml_data"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_digital_signatures_documentId_key" ON "document_digital_signatures"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_detractions_documentId_key" ON "document_detractions"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_companyId_bankId_accountNumber_key" ON "bank_accounts"("companyId", "bankId", "accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionHash_key" ON "transactions"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_parentCostCenterId_fkey" FOREIGN KEY ("parentCostCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bank_accounts" ADD CONSTRAINT "supplier_bank_accounts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bank_accounts" ADD CONSTRAINT "supplier_bank_accounts_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bank_accounts" ADD CONSTRAINT "supplier_bank_accounts_currency_fkey" FOREIGN KEY ("currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_currency_fkey" FOREIGN KEY ("currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_xml_data" ADD CONSTRAINT "document_xml_data_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_digital_signatures" ADD CONSTRAINT "document_digital_signatures_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_payment_terms" ADD CONSTRAINT "document_payment_terms_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_detractions" ADD CONSTRAINT "document_detractions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_detractions" ADD CONSTRAINT "document_detractions_conciliationId_fkey" FOREIGN KEY ("conciliationId") REFERENCES "conciliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_lines" ADD CONSTRAINT "document_lines_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_lines" ADD CONSTRAINT "document_lines_taxSchemeId_fkey" FOREIGN KEY ("taxSchemeId") REFERENCES "tax_schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_account_links" ADD CONSTRAINT "document_account_links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_account_links" ADD CONSTRAINT "document_account_links_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_line_account_links" ADD CONSTRAINT "document_line_account_links_documentLineId_fkey" FOREIGN KEY ("documentLineId") REFERENCES "document_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_line_account_links" ADD CONSTRAINT "document_line_account_links_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_cost_center_links" ADD CONSTRAINT "document_cost_center_links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_cost_center_links" ADD CONSTRAINT "document_cost_center_links_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_line_cost_center_links" ADD CONSTRAINT "document_line_cost_center_links_documentLineId_fkey" FOREIGN KEY ("documentLineId") REFERENCES "document_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_line_cost_center_links" ADD CONSTRAINT "document_line_cost_center_links_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_currency_fkey" FOREIGN KEY ("currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliations" ADD CONSTRAINT "conciliations_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliation_items" ADD CONSTRAINT "conciliation_items_conciliationId_fkey" FOREIGN KEY ("conciliationId") REFERENCES "conciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliation_items" ADD CONSTRAINT "conciliation_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliation_expenses" ADD CONSTRAINT "conciliation_expenses_conciliationId_fkey" FOREIGN KEY ("conciliationId") REFERENCES "conciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliation_expenses" ADD CONSTRAINT "conciliation_expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_currency_fkey" FOREIGN KEY ("currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sunat_rhe" ADD CONSTRAINT "sunat_rhe_currency_fkey" FOREIGN KEY ("currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sunat_rhe" ADD CONSTRAINT "sunat_rhe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sunat_rhe" ADD CONSTRAINT "sunat_rhe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sunat_invoices" ADD CONSTRAINT "sunat_invoices_currency_fkey" FOREIGN KEY ("currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sunat_invoices" ADD CONSTRAINT "sunat_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sunat_invoices" ADD CONSTRAINT "sunat_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
