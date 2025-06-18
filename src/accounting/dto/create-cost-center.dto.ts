import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator"

export class CreateCostCenterDto {
  @IsString()
  @IsNotEmpty()
  companyId: string

  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  parentCostCenterId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true
}
