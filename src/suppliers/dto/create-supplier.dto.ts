import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDecimal,
  IsInt,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
} from "class-validator"
import { Type, Transform } from "class-transformer"
import { SupplierType, SupplierStatus, BankAccountType } from "@prisma/client"

class CreateSupplierBankAccountDto {
  @IsString()
  @IsNotEmpty()
  bankId: string

  @IsString()
  @IsNotEmpty()
  accountNumber: string

  @IsEnum(BankAccountType)
  accountType: BankAccountType

  @IsString()
  @IsNotEmpty()
  currency: string

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  companyId: string

  @IsString()
  @IsNotEmpty()
  businessName: string

  @IsOptional()
  @IsString()
  tradeName?: string

  @IsString()
  @IsNotEmpty()
  documentType: string

  @IsString()
  @IsNotEmpty()
  documentNumber: string

  @IsEnum(SupplierType)
  supplierType: SupplierType

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  district?: string

  @IsOptional()
  @IsString()
  province?: string

  @IsOptional()
  @IsString()
  department?: string

  @IsOptional()
  @IsString()
  country?: string = "PE"

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus = SupplierStatus.ACTIVE

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  creditLimit?: number


  @IsOptional()
  @IsInt()
  paymentTerms?: number

  @IsOptional()
  @IsString()
  taxCategory?: string

  @IsOptional()
  @IsBoolean()
  isRetentionAgent?: boolean = false

  @IsOptional()
  @IsDecimal({ decimal_digits: "4" })
  @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
  retentionRate?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierBankAccountDto)
  supplierBankAccounts?: CreateSupplierBankAccountDto[]
}
