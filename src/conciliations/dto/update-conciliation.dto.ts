import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateConciliationDto } from "./create-conciliation.dto"
import { IsOptional, IsDateString, IsNumber } from "class-validator"
import { Type } from "class-transformer"

export class UpdateConciliationDto extends PartialType(
  OmitType(CreateConciliationDto, ["companyId", "createdById"] as const),
) {
  @IsOptional()
  @IsDateString()
  completedAt?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalTransactions?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalDocuments?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  conciliatedItems?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pendingItems?: number
}
