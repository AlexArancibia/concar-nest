import { IsString, IsEnum, IsNumber, IsOptional, IsUUID } from "class-validator"
import { ConciliationItemType, ConciliationItemStatus } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class CreateConciliationItemDto {
  @IsString()
  conciliationId: string;

  @IsEnum(ConciliationItemType)
  itemType: ConciliationItemType;

  @IsString()
  documentId: string;

  @IsNumber()
  documentAmount: number;

  @IsNumber()
  conciliatedAmount: number;

  @IsNumber()
  @IsOptional()
  difference: number = 0;

  @IsNumber()
  @IsOptional()
  distributionPercentage?: number;

  @IsNumber()
  @IsOptional()
  detractionAmount?: number;

  @IsNumber()
  @IsOptional()
  retentionAmount?: number;

  @IsEnum(ConciliationItemStatus)
  @IsOptional()
  status: ConciliationItemStatus = ConciliationItemStatus.PENDING;

  @IsString()
  @IsOptional()
  notes: string = '';

  @IsString()
  @IsOptional()
  systemNotes?: string;

  @IsString()
  conciliatedBy: string;
}