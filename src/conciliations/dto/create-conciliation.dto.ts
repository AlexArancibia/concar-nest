import { IsString, IsDateString, IsNumber, IsOptional, IsEnum } from "class-validator"
import { ConciliationStatus } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class CreateConciliationDto {
  @IsString()
  companyId: string

  @IsString()
  bankAccountId: string

  @IsDateString()
  periodStart: string

  @IsDateString()
  periodEnd: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalTransactions?: number = 0

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalDocuments?: number = 0

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  conciliatedItems?: number = 0

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pendingItems?: number = 0

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  bankBalance: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  bookBalance: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  difference: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  toleranceAmount?: number = 0

  @IsOptional()
  @IsEnum(ConciliationStatus)
  status?: ConciliationStatus = ConciliationStatus.PENDING

  @IsString()
  createdById: string
}