import { IsString, IsEnum, IsDecimal, IsOptional, IsNumber } from "class-validator"
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

  @IsNumber()
  documentAmount: number

  @IsNumber()
  conciliatedAmount: number

  @IsNumber()
  difference: number

  @IsOptional()
  @IsNumber()
  distributionPercentage?: number = 100

  @IsOptional()
  @IsNumber()
  detractionAmount?: number = 0

  @IsOptional()
  @IsNumber()
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
