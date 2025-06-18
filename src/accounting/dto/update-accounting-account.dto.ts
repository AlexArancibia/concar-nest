import { IsString, IsOptional, IsBoolean } from "class-validator"

export class UpdateAccountingAccountDto {
  @IsOptional()
  @IsString()
  accountCode?: string

  @IsOptional()
  @IsString()
  accountName?: string

  @IsOptional()
  @IsString()
  accountType?: string

  @IsOptional()
  @IsString()
  parentAccountId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  description?: string
}
