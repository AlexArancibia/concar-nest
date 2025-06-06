import { IsString, IsEnum, IsNumber, IsOptional } from "class-validator"
import { ConciliationItemType, ConciliationItemStatus } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class CreateConciliationItemDto {
  @IsString()
  conciliationId: string

  @IsEnum(ConciliationItemType)
  itemType: ConciliationItemType

  @IsOptional()
  @IsString()
  transactionId?: string

  @IsOptional()
  @IsString()
  documentId?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  transactionAmount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  documentAmount?: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  conciliatedAmount: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  difference?: number = 0

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  detractionAmount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  retentionAmount?: number

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
