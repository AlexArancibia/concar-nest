import { IsOptional, IsEnum, IsDateString, IsString } from "class-validator"
import { ConciliationType, ConciliationStatus } from "@prisma/client"
import { PaginationDto } from "../../common/dto/pagination.dto"

export class ConciliationFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ConciliationType)
  type?: ConciliationType

  @IsOptional()
  @IsEnum(ConciliationStatus)
  status?: ConciliationStatus

  @IsOptional()
  @IsString()
  bankAccountId?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  createdById?: string

  @IsOptional()
  @IsString()
  search?: string
}
