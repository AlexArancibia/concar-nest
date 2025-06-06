import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsBoolean } from "class-validator"
import { TransactionType } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class CreateTransactionDto {
  @IsString()
  companyId: string

  @IsString()
  bankAccountId: string

  @IsDateString()
  transactionDate: string

  @IsOptional()
  @IsDateString()
  valueDate?: string

  @IsString()
  description: string

  @IsEnum(TransactionType)
  transactionType: TransactionType

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  amount: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  balance: number

  @IsOptional()
  @IsString()
  branch?: string

  @IsString()
  operationNumber: string

  @IsOptional()
  @IsString()
  operationTime?: string

  @IsOptional()
  @IsString()
  operatorUser?: string

  @IsOptional()
  @IsString()
  utc?: string

  @IsOptional()
  @IsString()
  reference?: string

  @IsOptional()
  @IsString()
  channel?: string

  @IsOptional()
  @IsString()
  fileName?: string

  @IsOptional()
  @IsBoolean()
  isITF?: boolean = false

  @IsOptional()
  @IsBoolean()
  isDetraction?: boolean = false

  @IsOptional()
  @IsBoolean()
  isBankFee?: boolean = false

  @IsOptional()
  @IsBoolean()
  isTransfer?: boolean = false

  @IsOptional()
  @IsString()
  supplierId?: string
}
