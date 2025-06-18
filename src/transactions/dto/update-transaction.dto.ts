import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from "class-validator"
import { Type } from "class-transformer"
import { TransactionType, TransactionStatus } from "@prisma/client"

export class UpdateTransactionDto {
  @IsOptional()
  @IsDateString()
  transactionDate?: Date

  @IsOptional()
  @IsDateString()
  valueDate?: Date

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  amount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  balance?: number

  @IsOptional()
  @IsString()
  branch?: string

  @IsOptional()
  @IsString()
  operationNumber?: string

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
  @IsDateString()
  importedAt?: Date

  @IsOptional()
  @IsBoolean()
  isITF?: boolean

  @IsOptional()
  @IsBoolean()
  isDetraction?: boolean

  @IsOptional()
  @IsBoolean()
  isBankFee?: boolean

  @IsOptional()
  @IsBoolean()
  isTransfer?: boolean

  @IsOptional()
  @IsString()
  supplierId?: string

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  conciliatedAmount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  pendingAmount?: number
}
