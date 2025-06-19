import { IsString, IsEnum, IsDateString, IsDecimal, IsOptional, IsArray, ValidateNested, IsInt, IsNumber } from "class-validator"
import { Type, Transform } from "class-transformer"
import { ConciliationType, ConciliationStatus } from "@prisma/client"

export class CreateConciliationExpenseDto {
  @IsString()
  description: string

  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  amount: number

  @IsEnum(["OPERATIONAL", "ADMINISTRATIVE", "FINANCIAL", "TAX", "OTHER"])
  expenseType: "OPERATIONAL" | "ADMINISTRATIVE" | "FINANCIAL" | "TAX" | "OTHER"

  @IsOptional()
  @IsString()
  accountId?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  isTaxDeductible?: boolean = true

  @IsOptional()
  @IsString()
  supportingDocument?: string

  @IsDateString()
  expenseDate: string
}

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
