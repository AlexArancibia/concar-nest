import { PartialType } from "@nestjs/mapped-types"
import { CreateConciliationDto } from "./create-conciliation.dto"
import { IsOptional, IsDateString, IsEnum, IsNumber, IsArray, IsString } from "class-validator"
import { ConciliationStatus } from "@prisma/client"

export class UpdateConciliationDto extends PartialType(CreateConciliationDto) {
  @IsOptional()
  @IsNumber()
  totalDocuments?: number

  @IsOptional()
  @IsNumber()
  conciliatedItems?: number

  @IsOptional()
  @IsNumber()
  pendingItems?: number

  @IsOptional()
  @IsNumber()
  bankBalance?: number

  @IsOptional()
  @IsNumber()
  bookBalance?: number

  @IsOptional()
  @IsNumber()
  difference?: number

  @IsOptional()
  @IsNumber()
  toleranceAmount?: number

  @IsOptional()
  @IsEnum(ConciliationStatus)
  status?: ConciliationStatus

  // @IsOptional()
  // @IsArray()
  // @IsString({ each: true })
  //   detractionIds?: string[];

  @IsOptional()
  @IsDateString()
  completedAt?: string
}