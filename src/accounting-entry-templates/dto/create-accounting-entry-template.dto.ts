import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { MovementType, AccountingEntryFilter, AccountingEntryCurrency, ApplicationType } from "@prisma/client"

class AccountingEntryTemplateLineInputDto {
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

export class CreateAccountingEntryTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateNumber!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEnum(AccountingEntryFilter)
  filter!: AccountingEntryFilter

  @IsEnum(AccountingEntryCurrency)
  currency!: AccountingEntryCurrency

  @IsString()
  @IsNotEmpty()
  transactionType!: string

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingEntryTemplateLineInputDto)
  lines!: AccountingEntryTemplateLineInputDto[]
} 