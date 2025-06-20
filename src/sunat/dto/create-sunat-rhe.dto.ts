import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsBoolean } from "class-validator"
import { Type } from "class-transformer"

export class CreateSunatRheDto {
  @IsDateString()
  issueDate: string

  @IsString()
  @IsNotEmpty()
  documentType: string // Tipo Doc. Emitido

  @IsString()
  @IsNotEmpty()
  documentNumber: string // Nro. Doc. Emitido

  @IsString()
  @IsNotEmpty()
  status: string // Estado Doc. Emitido

  @IsString()
  @IsNotEmpty()
  issuerDocumentType: string // Tipo de Doc. Emisor

  @IsString()
  @IsNotEmpty()
  issuerRuc: string // Nro. Doc. Emisor

  @IsString()
  @IsNotEmpty()
  issuerName: string // Razón Social del Emisor

  @IsString()
  @IsNotEmpty()
  rentType: string // Tipo de Renta

  @IsBoolean()
  isFree: boolean // Gratuito (sí/no)

  @IsOptional()
  @IsString()
  description?: string // Descripción

  @IsOptional()
  @IsString()
  observation?: string // Observación

  @IsString()
  @IsNotEmpty()
  currency: string // Moneda de Operación

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  grossIncome: number // Renta Bruta

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  incomeTax: number // Impuesto a la Renta

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  netIncome: number // Renta Neta

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  netPendingAmount?: number // Monto Neto Pendiente de Pago

  @IsString()
  @IsNotEmpty()
  sourceFile: string

  @IsString()
  @IsNotEmpty()
  companyId: string

  @IsString()
  @IsNotEmpty()
  userId: string
}
