import { DocumentType, DocumentStatus } from "@prisma/client"

export class DocumentResponseDto {
  id: string
  companyId: string
  documentType: DocumentType
  series: string
  number: string
  fullNumber: string
  supplierId: string
  issueDate: Date
  dueDate?: Date
  receptionDate?: Date
  currency: string
  exchangeRate?: number
  subtotal: number
  igv: number
  otherTaxes?: number
  total: number
  hasRetention: boolean
  retentionAmount?: number
  hasDetraction: boolean
  detractionAmount?: number
  detractionCode?: string
  status: DocumentStatus
  sunatStatus?: string
  validationDate?: Date
  xmlFile?: string
  pdfFile?: string
  originalFile?: string
  description?: string
  observations?: string
  tags: string[]
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}
