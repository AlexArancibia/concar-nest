import { IsString, IsNumber, IsOptional, IsBoolean } from "class-validator"

export class CreateTaxSchemeDto {
  @IsString()
  companyId: string

  @IsString()
  code: string

  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  rate: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsString()
  createdById: string
}
