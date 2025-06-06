import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateExpenseDto } from "./create-expense.dto"
import { IsOptional, IsEnum, IsString, IsDateString } from "class-validator"
import { ExpenseStatus } from "@prisma/client"

export class UpdateExpenseDto extends PartialType(OmitType(CreateExpenseDto, ["companyId", "importedById"] as const)) {
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus

  @IsOptional()
  @IsString()
  processedById?: string

  @IsOptional()
  @IsDateString()
  processedAt?: string

  @IsOptional()
  @IsString()
  reconciledById?: string

  @IsOptional()
  @IsDateString()
  reconciledAt?: string
}
