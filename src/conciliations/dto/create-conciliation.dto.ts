import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, IsUUID } from "class-validator"
import { ConciliationStatus } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class CreateConciliationDto {
  @IsString()
  companyId: string;

  @IsString()
  bankAccountId: string;

  @IsString()
  transactionId: string; // Nueva propiedad - una sola transacción

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsNumber()
  @IsOptional()
  totalDocuments: number = 0;

  @IsNumber()
  @IsOptional()
  conciliatedItems: number = 0;

  @IsNumber()
  @IsOptional()
  pendingItems: number = 0;

  @IsNumber()
  bankBalance: number;

  @IsNumber()
  bookBalance: number;

  @IsNumber()
  difference: number;

  @IsNumber()
  @IsOptional()
  toleranceAmount: number = 0.01;

  @IsEnum(ConciliationStatus)
  @IsOptional()
  status: ConciliationStatus = ConciliationStatus.PENDING;

  @IsString()
  createdById: string;
}