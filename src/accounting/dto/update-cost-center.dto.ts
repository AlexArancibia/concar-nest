import { IsString, IsOptional, IsBoolean } from "class-validator"

export class UpdateCostCenterDto {
  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  parentCostCenterId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
