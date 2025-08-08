import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { MovementType } from "@prisma/client"

class AccountingEntryLineInputDto {
  @IsOptional()
  lineNumber?: number

  @IsString()
  accountCode!: string

  @IsEnum(MovementType)
  movementType!: MovementType

  @IsNotEmpty()
  amount!: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  auxiliaryCode?: string

  

  @IsOptional()
  @IsString()
  documentRef?: string

}

export class CreateAccountingEntryDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string

  

  @IsString()
  @IsNotEmpty()
  conciliationId!: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  metadata?: any

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingEntryLineInputDto)
  lines!: AccountingEntryLineInputDto[]
}

