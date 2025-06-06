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
  @IsEnum(ConciliationStatus)
  status?: ConciliationStatus = ConciliationStatus.PENDING

  @IsString()
  createdById: string
}
