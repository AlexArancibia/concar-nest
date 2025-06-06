import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from "class-validator"
import { BankAccountType } from "@prisma/client"
import { Transform, Type } from "class-transformer"

export class CreateBankAccountDto {
  @IsString()
  companyId: string

  @IsString()
  bankName: string

  @IsOptional()
  @IsString()
  bankCode?: string

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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  initialBalance?: number = 0

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  currentBalance?: number = 0
}
