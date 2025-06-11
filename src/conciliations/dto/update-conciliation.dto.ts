import { PartialType } from "@nestjs/mapped-types"
import { CreateConciliationItemDto } from "./create-conciliation-item.dto"
import { IsOptional, IsDateString, IsString, IsNumber } from "class-validator"
import { Type } from "class-transformer"

export class UpdateConciliationItemDto extends PartialType(CreateConciliationItemDto) {
  @IsOptional()
  @IsDateString()
  conciliatedAt?: string
}

// NUEVO: DTO para conciliaciones múltiples
export class CreateMultipleConciliationDto {
  @IsString()
  companyId: string

  @IsString()
  bankAccountId: string

  @IsString({ each: true })
  transactionIds: string[]

  @IsString({ each: true })
  documentIds: string[]

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  toleranceAmount?: number = 30

  @IsOptional()
  @IsString()
  notes?: string

  @IsString()
  createdById: string
}