import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from "class-validator"
import { Type } from "class-transformer"
import { TransactionType, TransactionStatus } from "@prisma/client"

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  companyId: string

  @IsString()
  @IsNotEmpty()
  bankAccountId: string

  @IsDateString()
  transactionDate: Date

  @IsOptional()
  @IsDateString()
  valueDate?: Date

  @IsString()
  @IsNotEmpty()
  description: string

  @IsEnum(TransactionType)
  transactionType: TransactionType

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  amount: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  balance: number

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

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus = TransactionStatus.PENDING

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  conciliatedAmount?: number = 0

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  pendingAmount: number
}
