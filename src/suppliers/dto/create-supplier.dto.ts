import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsEmail, IsInt } from "class-validator"
import { SupplierType, SupplierStatus } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class CreateSupplierDto {
  @IsString()
  companyId: string

  @IsString()
  businessName: string

  @IsOptional()
  @IsString()
  tradeName?: string

  @IsString()
  documentType: string

  @IsString()
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
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  creditLimit?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseInt(value, 10) : value))
  paymentTerms?: number

  @IsOptional()
  @IsString()
  taxCategory?: string

  @IsOptional()
  @IsBoolean()
  isRetentionAgent?: boolean = false

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  retentionRate?: number

  @IsOptional()
  bankAccounts?: any
}
