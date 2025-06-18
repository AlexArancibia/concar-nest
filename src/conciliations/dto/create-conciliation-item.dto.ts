import { IsString, IsEnum, IsDecimal, IsOptional } from "class-validator"
import { Transform } from "class-transformer"
import { ConciliationItemType, ConciliationItemStatus } from "@prisma/client"

export class CreateConciliationItemDto {
  @IsString()
  conciliationId: string

  @IsEnum(ConciliationItemType)
  itemType: ConciliationItemType

  @IsOptional()
  @IsString()
  documentId?: string

  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  documentAmount: number

  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  conciliatedAmount: number

  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  difference: number

  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  distributionPercentage?: number = 100

  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  detractionAmount?: number = 0

  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  retentionAmount?: number = 0

  @IsOptional()
  @IsEnum(ConciliationItemStatus)
  status?: ConciliationItemStatus = ConciliationItemStatus.PENDING

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  systemNotes?: string

  @IsOptional()
  @IsString()
  conciliatedBy?: string
}
