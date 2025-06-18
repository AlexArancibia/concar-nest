import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator"

export class CreateAccountingAccountDto {
  @IsString()
  @IsNotEmpty()
  companyId: string

  @IsString()
  @IsNotEmpty()
  accountCode: string

  @IsString()
  @IsNotEmpty()
  accountName: string

  @IsString()
  @IsNotEmpty()
  accountType: string

  @IsOptional()
  @IsString()
  parentAccountId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true

  @IsOptional()
  @IsString()
  description?: string
}
