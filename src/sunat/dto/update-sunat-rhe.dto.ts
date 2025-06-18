import { IsString, IsOptional, IsDateString, IsNumber, IsBoolean } from "class-validator"
import { Type } from "class-transformer"

export class UpdateSunatRheDto {
  @IsOptional()
  @IsDateString()
  issueDate?: Date

  @IsOptional()
  @IsString()
  documentType?: string

  @IsOptional()
  @IsString()
  documentNumber?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  issuerDocumentType?: string

  @IsOptional()
  @IsString()
  issuerRuc?: string

  @IsOptional()
  @IsString()
  issuerName?: string

  @IsOptional()
  @IsString()
  rentType?: string

  @IsOptional()
  @IsBoolean()
  isFree?: boolean

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  observation?: string

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  grossIncome?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  incomeTax?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  netIncome?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  netPendingAmount?: number

  @IsOptional()
  @IsString()
  column1?: string

  @IsOptional()
  @IsString()
  sourceFile?: string
}
