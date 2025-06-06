import { IsString, IsEnum, IsDateString, IsDecimal, IsOptional, IsBoolean, IsInt } from "class-validator"
import { ExpenseType, ExpenseStatus } from "@prisma/client"

export class CreateExpenseDto {
  @IsString()
  companyId: string

  @IsInt()
  lineNumber: number

  @IsString()
  bankAccountId: string

  @IsDateString()
  transactionDate: string

  @IsOptional()
  @IsDateString()
  valueDate?: string

  @IsString()
  operationDesc: string

  @IsDecimal()
  amount: number

  @IsDecimal()
  balance: number

  @IsOptional()
  @IsString()
  branch?: string

  @IsString()
  operationNumber: string

  @IsOptional()
  @IsString()
  operationTime?: string

  @IsOptional()
  @IsString()
  user?: string

  @IsOptional()
  @IsString()
  utc?: string

  @IsOptional()
  @IsString()
  reference2?: string

  @IsOptional()
  @IsString()
  documentType?: string

  @IsOptional()
  @IsString()
  fiscalFolio?: string

  @IsOptional()
  @IsString()
  supplierName?: string

  @IsOptional()
  @IsString()
  concept?: string

  @IsOptional()
  @IsDecimal()
  totalAmount?: number

  @IsOptional()
  @IsDecimal()
  subtotal?: number

  @IsOptional()
  @IsDecimal()
  igv?: number

  @IsOptional()
  @IsDecimal()
  isr?: number

  @IsOptional()
  @IsString()
  discipline?: string

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @IsString()
  generalCategory?: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  account?: string

  @IsOptional()
  @IsString()
  subAccount?: string

  @IsOptional()
  @IsString()
  accountingMonth?: string

  @IsOptional()
  @IsString()
  accountingAccount?: string

  @IsOptional()
  @IsString()
  comments?: string

  @IsOptional()
  @IsString()
  supplierRuc?: string

  @IsOptional()
  @IsDateString()
  documentDate?: string

  @IsOptional()
  @IsDateString()
  issueDate?: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsBoolean()
  isMassive?: boolean = false

  @IsEnum(ExpenseType)
  expenseType: ExpenseType

  @IsOptional()
  @IsString()
  currency?: string = "PEN"

  @IsOptional()
  @IsString()
  supplierId?: string

  @IsOptional()
  @IsString()
  documentId?: string

  @IsOptional()
  @IsString()
  importBatchId?: string

  @IsOptional()
  @IsString()
  originalFileName?: string

  @IsString()
  importedById: string

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus

  @IsOptional()
  @IsString()
  rowHash?: string

  @IsOptional()
  @IsDateString()
  importedAt?: string

  @IsOptional()
  @IsDateString()
  processedAt?: string

  @IsOptional()
  @IsString()
  processedById?: string

  @IsOptional()
  @IsDateString()
  reconciledAt?: string

  @IsOptional()
  @IsString()
  reconciledById?: string
}
