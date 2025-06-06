import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from "class-validator"
import { Type, Transform } from "class-transformer"
import { DocumentType, DocumentStatus } from "@prisma/client"

export class CreateDocumentLineDto {
  @IsOptional()
  @IsString()
  productCode?: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @Transform(({ value }) => Number.parseFloat(value))
  quantity: number

  @IsOptional()
  @IsString()
  unitCode?: string = "NIU"

  @IsNotEmpty()
  @Transform(({ value }) => Number.parseFloat(value))
  unitPrice: number

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  unitPriceWithTax?: number

  @IsNotEmpty()
  @Transform(({ value }) => Number.parseFloat(value))
  lineTotal: number

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  igvAmount?: number

  @IsOptional()
  @IsString()
  taxExemptionCode?: string

  @IsOptional()
  @IsString()
  taxExemptionReason?: string

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  taxPercentage?: number

  @IsOptional()
  @IsString()
  taxCategoryId?: string

  @IsOptional()
  @IsString()
  taxSchemeId?: string

  @IsOptional()
  @IsString()
  taxSchemeName?: string

  @IsOptional()
  @IsString()
  taxTypeCode?: string

  @IsOptional()
  @IsString()
  priceTypeCode?: string

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  referencePrice?: number

  @IsOptional()
  @IsString()
  itemClassificationCode?: string

  @IsOptional()
  @IsBoolean()
  freeOfChargeIndicator?: boolean = false

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  allowanceAmount?: number

  @IsOptional()
  @IsBoolean()
  allowanceIndicator?: boolean = false

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  chargeAmount?: number

  @IsOptional()
  @IsBoolean()
  chargeIndicator?: boolean = false

  @IsOptional()
  @IsString()
  orderLineReference?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lineNotes?: string[]

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  taxableAmount?: number

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  exemptAmount?: number

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  inaffectedAmount?: number

  @IsOptional()
  @IsString()
  xmlLineData?: string
}

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  companyId: string

  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType

  @IsNotEmpty()
  @IsString()
  series: string

  @IsNotEmpty()
  @IsString()
  number: string

  @IsNotEmpty()
  @IsString()
  supplierId: string

  @IsNotEmpty()
  @IsDateString()
  issueDate: string

  @IsOptional()
  @IsString()
  issueTime?: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsDateString()
  receptionDate?: string

  @IsOptional()
  @IsString()
  currency?: string = "PEN"

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  exchangeRate?: number

  @IsNotEmpty()
  @Transform(({ value }) => Number.parseFloat(value))
  subtotal: number

  @IsNotEmpty()
  @Transform(({ value }) => Number.parseFloat(value))
  igv: number

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  otherTaxes?: number

  @IsNotEmpty()
  @Transform(({ value }) => Number.parseFloat(value))
  total: number

  // Customer information
  @IsOptional()
  @IsString()
  customerDocumentType?: string

  @IsOptional()
  @IsString()
  customerDocumentNumber?: string

  @IsOptional()
  @IsString()
  customerName?: string

  @IsOptional()
  @IsString()
  customerAddress?: string

  @IsOptional()
  @IsString()
  customerUbigeo?: string

  @IsOptional()
  @IsString()
  customerDistrict?: string

  @IsOptional()
  @IsString()
  customerProvince?: string

  @IsOptional()
  @IsString()
  customerDepartment?: string

  // Retention information
  @IsOptional()
  @IsBoolean()
  hasRetention?: boolean = false

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  retentionAmount?: number

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  retentionPercentage?: number

  // Detraction information
  @IsOptional()
  @IsBoolean()
  hasDetraction?: boolean = false

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  detractionAmount?: number

  @IsOptional()
  @IsString()
  detractionCode?: string

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  detractionPercentage?: number

  @IsOptional()
  @IsString()
  detractionServiceCode?: string

  @IsOptional()
  @IsString()
  detractionAccount?: string

  // Payment information
  @IsOptional()
  @IsString()
  paymentMethod?: string

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  creditAmount?: number

  @IsOptional()
  @IsDateString()
  creditDueDate?: string

  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  installmentAmount?: number

  @IsOptional()
  @IsDateString()
  installmentDueDate?: string

  @IsOptional()
  @IsString()
  paymentTermsJson?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  observations?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus = DocumentStatus.PENDING

  // XML information
  @IsOptional()
  @IsString()
  xmlFileName?: string

  @IsOptional()
  @IsString()
  xmlContent?: string

  @IsOptional()
  @IsString()
  xmlHash?: string

  @IsOptional()
  @IsString()
  xmlUblVersion?: string

  @IsOptional()
  @IsString()
  xmlCustomizationId?: string

  @IsOptional()
  @IsString()
  documentTypeDescription?: string

  // Digital signature information
  @IsOptional()
  @IsString()
  digitalSignatureId?: string

  @IsOptional()
  @IsString()
  digitalSignatureUri?: string

  @IsOptional()
  @IsString()
  certificateIssuer?: string

  @IsOptional()
  @IsString()
  certificateSubject?: string

  @IsOptional()
  @IsDateString()
  signatureDate?: string

  @IsOptional()
  @IsString()
  signatureValue?: string

  @IsOptional()
  @IsString()
  certificateData?: string

  @IsOptional()
  @IsString()
  canonicalizationMethod?: string

  @IsOptional()
  @IsString()
  signatureMethod?: string

  @IsOptional()
  @IsString()
  digestMethod?: string

  @IsOptional()
  @IsString()
  digestValue?: string

  // Additional files
  @IsOptional()
  @IsString()
  pdfFile?: string

  @IsOptional()
  @IsString()
  qrCode?: string

  // Additional information
  @IsOptional()
  @IsString()
  orderReference?: string

  @IsOptional()
  @IsString()
  contractNumber?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalNotes?: string[]

  @IsOptional()
  @IsString()
  xmlAdditionalData?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentNotes?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operationNotes?: string[]

  @IsNotEmpty()
  @IsString()
  createdById: string

  // Document lines
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentLineDto)
  lines?: CreateDocumentLineDto[]
}
