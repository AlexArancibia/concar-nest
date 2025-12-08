export interface ConcarExportRowDto {
  // Columna A
  campo: string

  // Columna B
  subDiario: string

  // Columna C
  numeroComprobante: string

  // Columna D
  fechaComprobante: string // dd/mm/yyyy

  // Columna E
  codigoMoneda: string // "MN" o código de moneda

  // Columna F
  glosaPrincipal: string

  // Columna G
  tipoCambio: string // Vacío por ahora

  // Columna H
  tipoConversion: string // "V"

  // Columna I
  flagConversionMoneda: string // "S"

  // Columna J
  fechaTipoCambio: string // Vacío por ahora

  // Columna K
  cuentaContable: string

  // Columna L
  codigoAnexo: string

  // Columna M
  centroCosto: string // Vacío por ahora

  // Columna N
  debeHaber: "D" | "H"

  // Columna O
  importeOriginal: string // Formato "1,400.00"

  // Columna P
  importeDolares: string // Vacío por ahora

  // Columna Q
  importeSoles: string // Vacío por ahora

  // Columna R
  tipoDocumento: string // "RH" o "FACTURA"

  // Columna S
  numeroDocumento: string

  // Columna T
  fechaDocumento: string // dd/mm/yyyy

  // Columna U
  fechaVencimiento: string // dd/mm/yyyy o vacío

  // Columna V
  codigoArea: string // Vacío por ahora

  // Columna W
  glosaDetalle: string

  // Columna X
  codigoAnexoAuxiliar: string // Vacío por ahora

  // Columna Y
  medioPago: string // Vacío por ahora

  // Columna Z
  tipoDocumentoReferencia: string // Vacío por ahora

  // Columna AA
  numeroDocumentoReferencia: string // Vacío por ahora

  // Columna AB
  fechaDocumentoReferencia: string // Vacío por ahora

  // Columna AC
  nroRegRegistradorTipoDocRef: string // Vacío por ahora

  // Columna AD
  baseImponibleDocumentoReferencia: string // Vacío por ahora
}

export interface ConcarExportResponseDto {
  data: ConcarExportRowDto[]
  summary: {
    totalRecords: number
    totalEntries: number
    period: string // "MM/YYYY"
    subDiario: string
  }
}


