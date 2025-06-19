import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator"

export class CreateTaxSchemeDto {
  @IsString()
  taxSchemeId: string

  @IsString()
  taxSchemeName: string

  @IsOptional()
  @IsString()
  taxCategoryId?: string

  @IsOptional()
  @IsString()
  taxTypeCode?: string

  @IsOptional()
  @IsNumber()
  taxPercentage?: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
