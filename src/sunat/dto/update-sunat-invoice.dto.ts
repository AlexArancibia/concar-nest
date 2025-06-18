import { IsString, IsOptional, IsDateString, IsNumber } from "class-validator"
import { Type } from "class-transformer"

export class UpdateSunatInvoiceDto {
  @IsOptional()
  @IsString()
  period?: string

  @IsOptional()
  @IsString()
  carSunat?: string

  @IsOptional()
  @IsString()
  ruc?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsDateString()
  issueDate?: Date

  @IsOptional()
  @IsDateString()
  expirationDate?: Date

  @IsOptional()
  @IsString()
  documentType?: string

  @IsOptional()
  @IsString()
  series?: string

  @IsOptional()
  @IsString()
  year?: string

  @IsOptional()
  @IsString()
  documentNumber?: string

  @IsOptional()
  @IsString()
  identityDocumentType?: string

  @IsOptional()
  @IsString()
  identityDocumentNumber?: string

  @IsOptional()
  @IsString()
  customerName?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  taxableBase?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  igv?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  taxableBaseNg?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  igvNg?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  taxableBaseDng?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  igvDng?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  valueNgAcquisition?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  isc?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  icbper?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  otherCharges?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  total?: number

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Type(() => Number)
  exchangeRate?: number

  @IsOptional()
  @IsDateString()
  modifiedIssueDate?: Date

  @IsOptional()
  @IsString()
  modifiedDocType?: string

  @IsOptional()
  @IsString()
  modifiedDocSeries?: string

  @IsOptional()
  @IsString()
  modifiedDocNumber?: string

  @IsOptional()
  @IsString()
  damCode?: string

  @IsOptional()
  @IsString()
  goodsServicesClass?: string

  @IsOptional()
  @IsString()
  projectOperatorId?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  participationPercent?: number

  @IsOptional()
  @IsString()
  imb?: string

  @IsOptional()
  @IsString()
  carOrigin?: string

  @IsOptional()
  @IsString()
  detraction?: string

  @IsOptional()
  @IsString()
  noteType?: string

  @IsOptional()
  @IsString()
  invoiceStatus?: string

  @IsOptional()
  @IsString()
  incal?: string

  @IsOptional()
  @IsString()
  sourceFile?: string
}
