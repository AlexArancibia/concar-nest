import { PartialType } from "@nestjs/mapped-types"
import { CreateTaxSchemeDto } from "./create-tax-scheme.dto"
import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator"

export class UpdateTaxSchemeDto extends PartialType(CreateTaxSchemeDto) {
  @IsOptional()
  @IsString()
  taxSchemeId?: string

  @IsOptional()
  @IsString()
  taxSchemeName?: string

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
