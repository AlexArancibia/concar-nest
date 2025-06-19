import { IsString, IsNotEmpty, IsDateString, IsEnum, IsNumber, IsOptional, IsUUID } from "class-validator"
import { Transform, Type } from "class-transformer"
import { TransactionType, TransactionStatus } from "@prisma/client"

export class CreateTransactionDto {
  @IsNotEmpty()
  companyId: string

  @IsNotEmpty()
  bankAccountId: string

  @IsDateString()
  @IsNotEmpty()
  transactionDate: string

  @IsDateString()
  @IsOptional()
  valueDate?: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  @Type(() => Number)
  amount: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  @Type(() => Number)
  balance: number

  @IsString()
  @IsOptional()
  branch?: string

  @IsString()
  @IsOptional()
  operationNumber?: string

  @IsString()
  @IsOptional()
  operationTime?: string

  @IsString()
  @IsOptional()
  operatorUser?: string

  @IsString()
  @IsOptional()
  utc?: string

  @IsString()
  @IsOptional()
  reference?: string

  @IsString()
  @IsOptional()
  channel?: string

  @IsString()
  @IsOptional()
  fileName?: string

  @IsDateString()
  @IsOptional()
  importedAt?: string

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus = TransactionStatus.PENDING

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  @Type(() => Number)
  @IsOptional()
  conciliatedAmount?: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  @Type(() => Number)
  @IsOptional()
  pendingAmount?: number
}
