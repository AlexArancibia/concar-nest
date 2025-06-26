import { IsOptional, IsString, IsEnum, IsDateString, IsDecimal, IsNumberString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TransactionStatus, TransactionType } from '@prisma/client';

export class TransactionQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsNumberString()
  minAmount?: string;

  @IsOptional()
  @IsNumberString()
  maxAmount?: string;

  // Campos adicionales que podrían ser útiles
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  operationNumber?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}