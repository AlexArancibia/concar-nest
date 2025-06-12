import { PartialType } from "@nestjs/mapped-types"
import { CreateConciliationItemDto } from "./create-conciliation-item.dto"
import { IsOptional, IsDateString, IsEnum, IsNumber, IsString } from "class-validator"
import { ConciliationItemStatus } from "@prisma/client"

export class UpdateConciliationItemDto extends PartialType(CreateConciliationItemDto) {
  @IsOptional()
  @IsNumber()
  documentAmount?: number

  @IsOptional()
  @IsNumber()
  conciliatedAmount?: number

  @IsOptional()
  @IsNumber()
  difference?: number

  @IsOptional()
  @IsNumber()
  distributionPercentage?: number

  @IsOptional()
  @IsNumber()
  detractionAmount?: number

  @IsOptional()
  @IsNumber()
  retentionAmount?: number

  @IsOptional()
  @IsEnum(ConciliationItemStatus)
  status?: ConciliationItemStatus

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  systemNotes?: string

  @IsOptional()
  @IsString()
  conciliatedBy?: string

  @IsOptional()
  @IsDateString()
  conciliatedAt?: string
}