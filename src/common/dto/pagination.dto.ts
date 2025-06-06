import { IsOptional, IsPositive, Min } from "class-validator"
import { Type, Transform } from "class-transformer"

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsPositive()
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => Number.parseInt(value, 10))
  @Min(1)
  limit?: number = 10
}

export class PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
