import { IsOptional, IsString, IsEnum, IsDateString, IsNumberString, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ConciliationStatus, ConciliationType } from '@prisma/client'; // Assuming ConciliationStatus exists

export class ConciliationQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ConciliationStatus)
  status?: ConciliationStatus;

  @IsOptional()
  @IsEnum(ConciliationType)
  type?: ConciliationType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsDateString()
  periodFrom?: string;

  @IsOptional()
  @IsDateString()
  periodTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsNumberString()
  minDifference?: string;

  @IsOptional()
  @IsNumberString()
  maxDifference?: string;

  @IsOptional()
  @IsNumberString()
  minBankBalance?: string;

  @IsOptional()
  @IsNumberString()
  maxBankBalance?: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsString()
  approvedById?: string;

  @IsOptional()
  @IsBoolean()
  hasTransaction?: boolean;
}