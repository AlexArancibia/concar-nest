import { IsOptional, IsEnum, IsDateString, IsString, IsNumber, IsBoolean } from "class-validator"
import { DocumentType, DocumentStatus } from "@prisma/client"
import { PaginationDto } from "../../common/dto/pagination.dto"

export class DocumentQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  companyId?: string

  @IsOptional()
  @IsString()
  supplierId?: string

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus

  @IsOptional()
  @IsDateString()
  issueDateFrom?: string

  @IsOptional()
  @IsDateString()
  issueDateTo?: string

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string

  @IsOptional()
  @IsDateString()
  dueDateTo?: string

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsNumber()
  minAmount?: number

  @IsOptional()
  @IsNumber()
  maxAmount?: number

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  tags?: string

  @IsOptional()
  @IsBoolean()
  hasRetention?: boolean

  @IsOptional()
  @IsBoolean()
  hasDetraction?: boolean

  @IsOptional()
  @IsBoolean()
  hasXmlData?: boolean

  @IsOptional()
  @IsBoolean()
  hasDigitalSignature?: boolean

  @IsOptional()
  @IsString()
  accountId?: string

  @IsOptional()
  @IsString()
  costCenterId?: string

  // ID de transacción para ordenar por probabilidad de coincidencia
  @IsOptional()
  @IsString()
  transactionId?: string
}
