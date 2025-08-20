import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from "class-validator"
import { BankAccountType } from "@prisma/client"
import { Transform, Type } from "class-transformer"

export class CreateBankAccountDto {
  @IsString()
  companyId: string

  @IsString()
  bankId: string

  @IsString()
  accountNumber: string

  @IsEnum(BankAccountType)
  accountType: BankAccountType

  @IsOptional()
  @IsString()
  currency?: string = "PEN"

  @IsOptional()
  @IsString()
  alias?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true

  @IsOptional()
  @IsString()
  accountingAccountId?: string

  @IsOptional()
  @IsString()
  annexCode?: string
}
