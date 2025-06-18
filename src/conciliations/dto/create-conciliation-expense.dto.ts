import { IsString, IsDecimal, IsOptional, IsDateString, IsBoolean } from "class-validator"
import { Transform } from "class-transformer"
import { ExpenseType } from "@prisma/client"

export class CreateConciliationExpenseDto {
  @IsString()
  conciliationId: string

  @IsString()
  description: string

  @IsDecimal()
  @Transform(({ value }) => Number.parseFloat(value))
  amount: number

  @IsString()
  expenseType: ExpenseType

  @IsOptional()
  @IsString()
  accountId?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isTaxDeductible?: boolean = true

  @IsOptional()
  @IsString()
  supportingDocument?: string

  @IsDateString()
  expenseDate: string
}
