import { IsString, IsEnum, IsDateString, IsDecimal, IsOptional, IsArray, ValidateNested, IsInt, IsNumber } from "class-validator"
import { Type, Transform } from "class-transformer"
import { ConciliationType, ConciliationStatus } from "@prisma/client"
import { CreateConciliationExpenseDto } from "./create-conciliation-expense.dto"


export class CreateConciliationDto {
  @IsString()
  companyId: string

  @IsString()
  bankAccountId: string

  @IsOptional()
  @IsString()
  transactionId?: string

  @IsOptional()
  @IsEnum(ConciliationType)
  type?: ConciliationType = ConciliationType.DOCUMENTS

  @IsOptional()
  @IsString()
  reference?: string

  @IsDateString()
  periodStart: string

  @IsDateString()
  periodEnd: string

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value, 10))
  totalDocuments?: number = 0

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value, 10))
  conciliatedItems?: number = 0

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value, 10))
  pendingItems?: number = 0

  @IsNumber()
  bankBalance: number

  @IsNumber()
  bookBalance: number

  @IsNumber()
  difference: number

  @IsOptional()
  @IsNumber()
  toleranceAmount?: number = 0

  @IsOptional()
  @IsEnum(ConciliationStatus)
  status?: ConciliationStatus = ConciliationStatus.PENDING

  @IsOptional()
  @IsNumber()
  additionalExpensesTotal?: number = 0

  @IsOptional()
  @IsNumber()
  totalAmount?: number

  @IsOptional()
  @IsDateString()
  paymentDate?: string

  @IsOptional()
  @IsNumber()
  paymentAmount?: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsString()
  createdById: string

  @IsOptional()
  @IsString()
  approvedById?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConciliationExpenseDto)
  expenses?: CreateConciliationExpenseDto[]
}



