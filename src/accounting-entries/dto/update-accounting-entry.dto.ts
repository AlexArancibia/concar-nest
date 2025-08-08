import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { MovementType } from "@prisma/client"

class AccountingEntryLineUpdateDto {
  @IsOptional()
  lineNumber?: number

  @IsString()
  accountCode!: string

  @IsEnum(MovementType)
  movementType!: MovementType

  @IsOptional()
  amount?: number

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

export class UpdateAccountingEntryDto {
  

  @IsOptional()
  @IsString()
  conciliationId?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  notes?: string
  
  @IsOptional()
  metadata?: any

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingEntryLineUpdateDto)
  lines?: AccountingEntryLineUpdateDto[]
}

