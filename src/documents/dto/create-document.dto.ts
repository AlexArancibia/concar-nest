import {
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from "class-validator"
import { Type } from "class-transformer"
import { DocumentType, DocumentStatus } from "@prisma/client"

export class CreateDocumentLineDto {
  @IsString()
  description: string

  @IsNumber()
  quantity: number

  @IsOptional()
  @IsString()
  productCode?: string

  @IsOptional()
  @IsString()
  unitCode?: string

  @IsNumber()
  unitPrice: number

  @IsNumber()
  unitPriceWithTax: number

  @IsNumber()
  lineTotal: number

  @IsOptional()
  @IsNumber()
  igvAmount?: number

  @IsOptional()
  @IsString()
  taxExemptionCode?: string

  @IsOptional()
  @IsString()
  taxExemptionReason?: string

  @IsOptional()
  @IsString()
  taxSchemeId?: string

  @IsOptional()
  @IsString()
  priceTypeCode?: string

  @IsOptional()
  @IsNumber()
  referencePrice?: number

  @IsOptional()
  @IsString()
  itemClassificationCode?: string

  @IsOptional()
  @IsBoolean()
  freeOfChargeIndicator?: boolean

  @IsOptional()
  @IsNumber()
  allowanceAmount?: number

  @IsOptional()
  @IsBoolean()
  allowanceIndicator?: boolean

  @IsOptional()
  @IsNumber()
  chargeAmount?: number

  @IsOptional()
  @IsBoolean()
  chargeIndicator?: boolean

  @IsOptional()
  @IsString()
  orderLineReference?: string

  @IsOptional()
  @IsString()
  lineNotes?: string

  @IsOptional()
  @IsNumber()
  taxableAmount?: number

  @IsOptional()
  @IsNumber()
  exemptAmount?: number

  @IsOptional()
  @IsNumber()
  inaffectedAmount?: number

  @IsOptional()
  @IsString()
  xmlLineData?: string

  // Account and Cost Center Links
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentLineAccountLinkDto)
  accountLinks?: CreateDocumentLineAccountLinkDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentLineCostCenterLinkDto)
  costCenterLinks?: CreateDocumentLineCostCenterLinkDto[]
}

export class CreateDocumentLineAccountLinkDto {
  @IsString()
  accountId: string

  @IsNumber()
  percentage: number

  @IsNumber()
  amount: number
}

export class CreateDocumentLineCostCenterLinkDto {
  @IsString()
  costCenterId: string

  @IsNumber()
  percentage: number

  @IsNumber()
  amount: number
}

export class CreateDocumentPaymentTermDto {
  @IsNumber()
  amount: number

  @IsDateString()
  dueDate: string

  @IsOptional()
  @IsString()
  description?: string
}

export class CreateDocumentAccountLinkDto {
  @IsString()
  accountId: string

  @IsNumber()
  percentage: number

  @IsNumber()
  amount: number
}

export class CreateDocumentCostCenterLinkDto {
  @IsString()
  costCenterId: string

  @IsNumber()
  percentage: number

  @IsNumber()
  amount: number
}

export class CreateDocumentXmlDataDto {
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

  @IsOptional()
  @IsString()
  sunatResponseCode?: string

  @IsOptional()
  @IsString()
  cdrStatus?: string

  @IsOptional()
  @IsDateString()
  sunatProcessDate?: string

  @IsOptional()
  @IsString()
  pdfFile?: string

  @IsOptional()
  @IsString()
  qrCode?: string

  @IsOptional()
  @IsString()
  xmlAdditionalData?: string
}

export class CreateDocumentDigitalSignatureDto {
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
}

export class CreateDocumentDetractionDto {
  @IsBoolean()
  hasDetraction: boolean

  @IsOptional()
  @IsNumber()
  amount?: number

  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsNumber()
  percentage?: number

  @IsOptional()
  @IsString()
  serviceCode?: string

  @IsOptional()
  @IsString()
  account?: string

  @IsOptional()
  @IsDateString()
  paymentDate?: string

  @IsOptional()
  @IsString()
  paymentReference?: string
}

export class CreateDocumentDto {
  @IsString()
  companyId: string

  @IsEnum(DocumentType)
  documentType: DocumentType

  @IsString()
  series: string

  @IsString()
  number: string

  @IsString()
  supplierId: string

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

  @IsString()
  currency: string

  @IsOptional()
  @IsNumber()
  exchangeRate?: number

  @IsNumber()
  subtotal: number

  @IsNumber()
  igv: number

  @IsOptional()
  @IsNumber()
  otherTaxes?: number

  @IsNumber()
  total: number

  @IsOptional()
  @IsBoolean()
  hasRetention?: boolean

  @IsOptional()
  @IsNumber()
  retentionAmount?: number

  @IsOptional()
  @IsNumber()
  retentionPercentage?: number

  @IsOptional()
  @IsString()
  paymentMethod?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  observations?: string

  @IsOptional()
  @IsString()
  tags?: string

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus

  @IsOptional()
  @IsString()
  orderReference?: string

  @IsOptional()
  @IsString()
  contractNumber?: string

  @IsOptional()
  @IsString()
  additionalNotes?: string

  @IsOptional()
  @IsString()
  documentNotes?: string

  @IsOptional()
  @IsString()
  operationNotes?: string

  @IsString()
  createdById: string

  // Related entities
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentLineDto)
  lines?: CreateDocumentLineDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentPaymentTermDto)
  paymentTerms?: CreateDocumentPaymentTermDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentAccountLinkDto)
  accountLinks?: CreateDocumentAccountLinkDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentCostCenterLinkDto)
  costCenterLinks?: CreateDocumentCostCenterLinkDto[]

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDocumentXmlDataDto)
  xmlData?: CreateDocumentXmlDataDto

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDocumentDigitalSignatureDto)
  digitalSignature?: CreateDocumentDigitalSignatureDto

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDocumentDetractionDto)
  detraction?: CreateDocumentDetractionDto
}
