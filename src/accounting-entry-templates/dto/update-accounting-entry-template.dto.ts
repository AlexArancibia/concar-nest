import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { MovementType, AccountingEntryFilter, AccountingEntryCurrency, ApplicationType } from "@prisma/client"

class AccountingEntryTemplateLineUpdateDto {
  @IsString()
  @IsNotEmpty()
  accountCode!: string

  @IsEnum(MovementType)
  movementType!: MovementType

  @IsEnum(ApplicationType)
  applicationType!: ApplicationType

  @IsOptional()
  @IsString()
  calculationBase?: string

  @IsOptional()
  @IsNumber()
  value?: number

  @IsOptional()
  @IsNumber()
  executionOrder?: number
}

export class UpdateAccountingEntryTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  templateNumber?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string

  @IsOptional()
  @IsEnum(AccountingEntryFilter)
  filter?: AccountingEntryFilter

  @IsOptional()
  @IsEnum(AccountingEntryCurrency)
  currency?: AccountingEntryCurrency

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  transactionType?: string

  @IsOptional()
  @IsString()
  document?: string

  @IsOptional()
  condition?: any

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingEntryTemplateLineUpdateDto)
  lines?: AccountingEntryTemplateLineUpdateDto[]
} 