import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional } from "class-validator"
import { Type } from "class-transformer"

export class CreateSunatInvoiceDto {
  @IsString()
  @IsNotEmpty()
  period: string // Periodo

  @IsString()
  @IsNotEmpty()
  carSunat: string // CAR SUNAT

  @IsString()
  @IsNotEmpty()
  ruc: string // RUC del emisor

  @IsString()
  @IsNotEmpty()
  name: string // Razón Social

  @IsDateString()
  issueDate: Date // Fecha de emisión

  @IsOptional()
  @IsDateString()
  expirationDate?: Date // Fecha de vencimiento/pago

  @IsString()
  @IsNotEmpty()
  documentType: string // Tipo CP/Doc.

  @IsString()
  @IsNotEmpty()
  series: string // Serie del CDP

  @IsOptional()
  @IsString()
  year?: string // Año (si aplica)

  @IsString()
  @IsNotEmpty()
  documentNumber: string // Nro CP o Doc.

  @IsOptional()
  @IsString()
  identityDocumentType?: string // Tipo Doc Identidad

  @IsOptional()
  @IsString()
  identityDocumentNumber?: string // Nro Doc Identidad

  @IsOptional()
  @IsString()
  customerName?: string // Apellidos Nombres/ Razón Social del cliente

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  taxableBase: number // BI Gravado DG

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  igv: number // IGV / IPM DG

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  taxableBaseNg?: number // BI Gravado DGNG

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  igvNg?: number // IGV / IPM DGNG

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  taxableBaseDng?: number // BI Gravado DNG

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  igvDng?: number // IGV / IPM DNG

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  valueNgAcquisition?: number // Valor Adq. NG

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  isc?: number // ISC

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  icbper?: number // ICBPER

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  otherCharges?: number // Otros Trib/Cargos

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  total: number // Total CP

  @IsString()
  @IsNotEmpty()
  currency: string // Moneda

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Type(() => Number)
  exchangeRate?: number // Tipo de Cambio

  @IsOptional()
  @IsDateString()
  modifiedIssueDate?: Date // Fecha Emisión Doc Modificado

  @IsOptional()
  @IsString()
  modifiedDocType?: string // Tipo CP Modificado

  @IsOptional()
  @IsString()
  modifiedDocSeries?: string // Serie CP Modificado

  @IsOptional()
  @IsString()
  modifiedDocNumber?: string // Nro CP Modificado

  @IsOptional()
  @IsString()
  damCode?: string // COD. DAM o DSI

  @IsOptional()
  @IsString()
  goodsServicesClass?: string // Clasificación Bss y Sss

  @IsOptional()
  @IsString()
  projectOperatorId?: string // ID Proyecto Operadores

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  participationPercent?: number // Porcentaje de participación

  @IsOptional()
  @IsString()
  imb?: string // IMB

  @IsOptional()
  @IsString()
  carOrigin?: string // CAR Orig / Ind E o I

  @IsOptional()
  @IsString()
  detraction?: string // Detracción

  @IsOptional()
  @IsString()
  noteType?: string // Tipo de Nota

  @IsOptional()
  @IsString()
  invoiceStatus?: string // Estado del comprobante

  @IsOptional()
  @IsString()
  incal?: string // Incal (¿anulado?)

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
