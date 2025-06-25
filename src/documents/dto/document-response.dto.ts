import { DocumentType, DocumentStatus } from "@prisma/client"

// Removed DocumentLineAccountLinkResponseDto

export class DocumentLineCostCenterLinkResponseDto {
  id: string
  costCenterId: string
  percentage: number
  amount: number
  createdAt: Date
  costCenter?: {
    id: string
    code: string
    name: string
  }
}

export class DocumentLineResponseDto {
  id: string
  lineNumber: number
  productCode?: string
  description: string
  quantity: number
  unitCode?: string
  unitPrice: number
  unitPriceWithTax: number
  lineTotal: number
  igvAmount: number
  taxExemptionCode?: string
  taxExemptionReason?: string
  taxSchemeId?: string
  priceTypeCode?: string
  referencePrice?: number
  itemClassificationCode?: string
  freeOfChargeIndicator: boolean
  allowanceAmount: number
  allowanceIndicator: boolean
  chargeAmount: number
  chargeIndicator: boolean
  orderLineReference?: string
  lineNotes?: string
  taxableAmount: number
  exemptAmount: number
  inaffectedAmount: number
  xmlLineData?: string
  createdAt: Date
  updatedAt: Date
  // accountLinks?: DocumentLineAccountLinkResponseDto[] // Removed
  costCenterLinks?: DocumentLineCostCenterLinkResponseDto[]
}

export class DocumentPaymentTermResponseDto {
  id: string
  termNumber: number
  amount: number
  dueDate: Date
  description?: string
  createdAt: Date
  updatedAt: Date
}

// Removed DocumentAccountLinkResponseDto

export class DocumentCostCenterLinkResponseDto {
  id: string
  costCenterId: string
  percentage: number
  amount: number
  createdAt: Date
  costCenter?: {
    id: string
    code: string
    name: string
  }
}

export class DocumentXmlDataResponseDto {
  id: string
  xmlFileName?: string
  xmlContent?: string
  xmlHash?: string
  xmlUblVersion?: string
  xmlCustomizationId?: string
  documentTypeDescription?: string
  sunatResponseCode?: string
  cdrStatus?: string
  sunatProcessDate?: Date
  pdfFile?: string
  qrCode?: string
  xmlAdditionalData?: string
  createdAt: Date
  updatedAt: Date
}

export class DocumentDigitalSignatureResponseDto {
  id: string
  digitalSignatureId?: string
  digitalSignatureUri?: string
  certificateIssuer?: string
  certificateSubject?: string
  signatureDate?: Date
  signatureValue?: string
  certificateData?: string
  canonicalizationMethod?: string
  signatureMethod?: string
  digestMethod?: string
  digestValue?: string
  createdAt: Date
  updatedAt: Date
}

export class DocumentDetractionResponseDto {
  id: string
  hasDetraction: boolean
  amount: number
  code?: string
  percentage: number
  serviceCode?: string
  account?: string
  paymentDate?: Date
  paymentReference?: string
  isConciliated: boolean
  conciliatedAmount: number
  pendingAmount: number
  conciliationId?: string
  createdAt: Date
  updatedAt: Date
}

export class DocumentResponseDto {
  id: string
  companyId: string
  documentType: DocumentType
  series: string
  number: string
  fullNumber: string
  supplierId: string
  issueDate: Date
  issueTime?: string
  dueDate?: Date
  receptionDate?: Date
  currency: string
  exchangeRate: number
  subtotal: number
  igv: number
  otherTaxes: number
  total: number
  hasRetention: boolean
  retentionAmount: number
  retentionPercentage: number
  netPayableAmount: number
  conciliatedAmount: number
  pendingAmount: number
  paymentMethod?: string
  description?: string
  observations?: string
  tags?: string
  status: DocumentStatus
  orderReference?: string
  contractNumber?: string
  additionalNotes?: string
  documentNotes?: string
  operationNotes?: string
  createdAt: Date
  updatedAt: Date
  createdById: string
  updatedById: string

  // Relations
  supplier?: {
    id: string
    businessName: string
    documentNumber: string
    documentType: string
  }

  lines?: DocumentLineResponseDto[]
  paymentTerms?: DocumentPaymentTermResponseDto[]
  // accountLinks?: DocumentAccountLinkResponseDto[] // Removed
  costCenterLinks?: DocumentCostCenterLinkResponseDto[]
  xmlData?: DocumentXmlDataResponseDto
  digitalSignature?: DocumentDigitalSignatureResponseDto
  detraction?: DocumentDetractionResponseDto
}

export class DocumentSummaryResponseDto {
  totalDocuments: number
  statusCounts: Array<{
    status: DocumentStatus
    _count: { status: number }
    _sum: { total: number | null }
  }>
  monthlyTotals: Array<{
    month: string
    totalAmount: number
    documentCount: number
  }>
  currencySummary: Array<{
    currency: string
    totalAmount: number
    documentCount: number
  }>
  supplierSummary: Array<{
    supplierId: string
    supplierName: string
    totalAmount: number
    documentCount: number
  }>
}
