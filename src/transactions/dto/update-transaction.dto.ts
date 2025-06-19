import { IsString, IsDateString, IsEnum, IsNumber, IsOptional } from "class-validator"
import { Transform, Type } from "class-transformer"
import { TransactionType, TransactionStatus } from "@prisma/client"

export class UpdateTransactionDto {
  @IsDateString()
  @IsOptional()
  transactionDate?: string

  @IsDateString()
  @IsOptional()
  valueDate?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  @Type(() => Number)
  @IsOptional()
  amount?: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  @Type(() => Number)
  @IsOptional()
  balance?: number

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

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus

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
