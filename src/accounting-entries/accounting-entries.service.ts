import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma, MovementType, DocumentType } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateAccountingEntryDto } from "./dto/create-accounting-entry.dto"
import { UpdateAccountingEntryDto } from "./dto/update-accounting-entry.dto"
import { PaginatedResponse, PaginationDto } from "../common/dto/pagination.dto"
import { ConcarExportQueryDto } from "./dto/concar-export-query.dto"
import { ConcarExportResponseDto, ConcarExportRowDto } from "./dto/concar-export-response.dto"

@Injectable()
export class AccountingEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchEntries(companyId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.AccountingEntryWhereInput = { companyId }

    const [data, total] = await Promise.all([
      this.prisma.accountingEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lines: true,
          conciliation: { select: { id: true, reference: true } },
        },
      }),
      this.prisma.accountingEntry.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) } satisfies PaginatedResponse<any>
  }

  async createEntry(dto: CreateAccountingEntryDto) {
    // Validate lines
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException("Entry must contain at least one line")
    }

    return this.prisma.accountingEntry.create({
      data: {
        companyId: dto.companyId,
        conciliationId: dto.conciliationId,
        status: dto.status ?? "DRAFT",
        notes: dto.notes,
        metadata: (dto as any).metadata ?? undefined,
        lines: {
          create: dto.lines.map((l, idx) => ({
            companyId: dto.companyId,
            lineNumber: l.lineNumber ?? idx + 1,
            accountCode: l.accountCode,
            movementType: l.movementType,
            amount: new Prisma.Decimal(l.amount),
            description: l.description,
            auxiliaryCode: l.auxiliaryCode,
            documentRef: l.documentRef,
          })),
        },
      } as any,
      include: { lines: true },
    })
  }

  async getById(id: string) {
    const entry = await this.prisma.accountingEntry.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!entry) throw new NotFoundException("Accounting entry not found")
    return entry
  }

  async updateEntry(id: string, dto: UpdateAccountingEntryDto) {
    const existing = await this.prisma.accountingEntry.findUnique({ where: { id }, include: { lines: true } })
    if (!existing) throw new NotFoundException("Accounting entry not found")

    // Lines replacement if provided
    let linesOp: Prisma.AccountingEntryLineUncheckedUpdateManyWithoutEntryNestedInput | undefined

    if (dto.lines) {
      // Simplest approach: replace all lines
      linesOp = {
        deleteMany: { entryId: id },
        create: dto.lines.map((l, idx) => ({
          companyId: existing.companyId,
          lineNumber: l.lineNumber ?? idx + 1,
          accountCode: l.accountCode,
          movementType: l.movementType,
          amount: new Prisma.Decimal(l.amount),
          description: l.description,
          auxiliaryCode: l.auxiliaryCode,
          documentRef: l.documentRef,
        })),
      }
    }

    return this.prisma.accountingEntry.update({
      where: { id },
      data: {
        conciliationId: dto.conciliationId ?? existing.conciliationId,
        status: dto.status ?? existing.status,
        notes: dto.notes ?? existing.notes,
        metadata: (dto as any).metadata ?? existing.metadata,
        ...(linesOp ? { lines: linesOp } : {}),
      },
      include: { lines: true },
    })
  }

  /**
   * Helper: Formatea fecha a dd/mm/yyyy
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  /**
   * Helper: Formatea número con separador de miles (coma) y decimales (punto)
   * Formato: 1,234.56 (formato estadounidense común en sistemas contables peruanos)
   */
  private formatNumber(amount: Prisma.Decimal | number | null | undefined): string {
    if (amount === null || amount === undefined) return ""
    const num = typeof amount === "number" ? amount : Number(amount)
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  /**
   * Helper: Obtiene código de moneda (PEN -> MN, resto tal cual)
   */
  private getCurrencyCode(currency: string): string {
    return currency === "PEN" ? "MN" : currency
  }

  /**
   * Helper: Mapea DocumentType a código CONCAR
   */
  private getDocumentTypeCode(documentType: "15" | "11", docType?: DocumentType): string {
    if (documentType === "15") {
      return "RH"
    }
    // documentType === "11"
    if (docType === DocumentType.INVOICE) {
      return "FACTURA"
    }
    return "RH" // Por defecto
  }

  /**
   * Helper: Concatena valores con "; " si hay múltiples
   */
  private concatenateValues(values: (string | null | undefined)[], separator: string = "; "): string {
    const filtered = values.filter((v) => v !== null && v !== undefined && v !== "") as string[]
    return filtered.join(separator)
  }

  /**
   * Helper: Calcula la fecha más repetida (moda) de los documentos
   * Si hay empate, retorna la fecha más antigua
   */
  private getMostFrequentDocumentDate(documents: any[]): Date | null {
    if (documents.length === 0) return null
    
    const dates = documents
      .map(doc => doc.issueDate)
      .filter((date): date is Date => date !== null && date !== undefined)
    
    if (dates.length === 0) return null
    
    // Contar frecuencia de cada fecha (normalizada a día completo, sin hora)
    const dateCounts = new Map<string, { date: Date; count: number }>()
    
    for (const date of dates) {
      // Normalizar a inicio del día para comparar solo por fecha
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dateKey = normalizedDate.toISOString().split('T')[0]
      
      const existing = dateCounts.get(dateKey)
      if (existing) {
        existing.count++
      } else {
        dateCounts.set(dateKey, { date: normalizedDate, count: 1 })
      }
    }
    
    // Encontrar la fecha con mayor frecuencia (si hay empate, usar la más antigua)
    let maxCount = 0
    let mostFrequentDate: Date | null = null
    
    for (const [, { date, count }] of dateCounts) {
      if (count > maxCount) {
        maxCount = count
        mostFrequentDate = date
      } else if (count === maxCount && mostFrequentDate && date.getTime() < mostFrequentDate.getTime()) {
        mostFrequentDate = date
      }
    }
    
    return mostFrequentDate
  }

  async exportConcarFormat(query: ConcarExportQueryDto): Promise<ConcarExportResponseDto> {
    const { companyId, year, month, startDay, endDay, bankAccountIds, conciliationType, documentType } = query

    // Construir filtro de fechas solo si se proporcionan todos los parámetros
    let dateFilter: { gte: Date; lte: Date } | undefined
    if (year !== undefined && month !== undefined && startDay !== undefined && endDay !== undefined) {
      const startDate = new Date(year, month - 1, startDay, 0, 0, 0, 0)
      const endDate = new Date(year, month - 1, endDay, 23, 59, 59, 999)

      // Validar que las fechas sean válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException("Invalid date range")
      }

      if (startDate > endDate) {
        throw new BadRequestException("Start date must be before end date")
      }

      dateFilter = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Mapear documentType a DocumentType enum
    const documentTypeFilter: DocumentType = documentType === "15" ? DocumentType.RECEIPT : DocumentType.INVOICE

    // Construir el where clause
    const whereClause: any = {
      companyId,
      entry: {
        conciliation: {
          bankAccountId: {
            in: bankAccountIds,
          },
          type: conciliationType,
          items: {
            some: {
              document: {
                documentType: documentTypeFilter,
                // Agregar filtro de fecha aquí si existe (filtra por fecha de emisión del documento)
                ...(dateFilter ? { issueDate: dateFilter } : {}),
              },
            },
          },
        },
      },
    }

    // Obtener todas las AccountingEntryLine que cumplan con los filtros
    const lines = await this.prisma.accountingEntryLine.findMany({
      where: whereClause,
      include: {
        entry: {
          include: {
            conciliation: {
              include: {
                bankAccount: true,
                items: {
                  include: {
                    document: {
                      include: {
                        supplier: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          entry: {
            createdAt: "asc",
          },
        },
        {
          lineNumber: "asc",
        },
      ],
    })

    if (lines.length === 0) {
      const period = month && year ? `${String(month).padStart(2, "0")}/${year}` : "Todos"
      return {
        data: [],
        summary: {
          totalRecords: 0,
          totalEntries: 0,
          period,
          subDiario: documentType,
        },
      }
    }

    // Helper: Obtener documentos del tipo filtrado de una conciliación
    const getFilteredDocuments = (items: any[]) => {
      return items
        .filter((item) => item.document && item.document.documentType === documentTypeFilter)
        .map((item) => item.document!)
    }

    // PASO 1: Agrupar líneas por AccountingEntry y ordenar por lineNumber dentro de cada entry
    const entriesGrouped = new Map<string, typeof lines>()
    for (const line of lines) {
      const entryLines = entriesGrouped.get(line.entryId) || []
      entryLines.push(line)
      entriesGrouped.set(line.entryId, entryLines)
    }

    // Ordenar líneas por lineNumber dentro de cada entry
    for (const entryLines of entriesGrouped.values()) {
      entryLines.sort((a, b) => a.lineNumber - b.lineNumber)
    }

    // PASO 2: Calcular fecha moda para cada AccountingEntry
    type EntryWithDate = {
      entryId: string
      lines: typeof lines
      documentDate: Date
      month: number
    }

    const entriesWithDates: EntryWithDate[] = []
    
    for (const [entryId, entryLines] of entriesGrouped) {
      const firstLine = entryLines[0]
      const documents = getFilteredDocuments(firstLine.entry.conciliation.items)
      
      // Calcular fecha moda (más repetida), o usar createdAt si no hay documentos
      const mostFrequentDate = this.getMostFrequentDocumentDate(documents)
      const documentDate = mostFrequentDate || firstLine.entry.createdAt
      const entryMonth = month ?? documentDate.getMonth() + 1
      
      entriesWithDates.push({
        entryId,
        lines: entryLines,
        documentDate,
        month: entryMonth,
      })
    }

    // PASO 3: Ordenar entries por fecha de documento (manteniendo agrupados)
    entriesWithDates.sort((a, b) => {
      const dateDiff = a.documentDate.getTime() - b.documentDate.getTime()
      return dateDiff !== 0 ? dateDiff : a.entryId.localeCompare(b.entryId)
    })

    // PASO 4: Agrupar por mes y asignar correlativos
    const entriesByMonth = new Map<string, EntryWithDate[]>()
    for (const entryData of entriesWithDates) {
      const monthKey = `${entryData.month}`
      const monthEntries = entriesByMonth.get(monthKey) || []
      monthEntries.push(entryData)
      entriesByMonth.set(monthKey, monthEntries)
    }

    // Asignar correlativos dentro de cada mes (manteniendo el orden por fecha)
    const entriesMap = new Map<string, { entryId: string; lines: typeof lines; correlative: number; month: number }>()
    for (const [monthKey, monthEntries] of entriesByMonth) {
      monthEntries.forEach((entryData, index) => {
        entriesMap.set(entryData.entryId, {
          entryId: entryData.entryId,
          lines: entryData.lines,
          correlative: index + 1,
          month: Number.parseInt(monthKey),
        })
      })
    }

    // PASO 5: Generar filas de datos en el orden correcto (ordenado por fecha de documento)
    const data: ConcarExportRowDto[] = []

    // Iterar sobre entries ordenados por fecha (mantiene agrupados los débitos y haberes)
    for (const entryData of entriesWithDates) {
      const entryMapData = entriesMap.get(entryData.entryId)!
      // Todas las líneas del mismo AccountingEntry tienen el mismo correlativo
      const correlative = String(entryMapData.correlative).padStart(4, "0")
      const entryMonthFormatted = String(entryMapData.month).padStart(2, "0")
      const numeroComprobante = `${entryMonthFormatted}${correlative}`

      for (const line of entryMapData.lines) {
        const entry = line.entry
        const conciliation = entry.conciliation
        const bankAccount = conciliation.bankAccount

        // Obtener documentos del tipo filtrado (mostrar TODOS, el filtro de Prisma ya aseguró que al menos uno cumple)
        const documents = getFilteredDocuments(conciliation.items)

        // Columna E: Moneda
        const currencyCode = this.getCurrencyCode(bankAccount.currency)

        // Columna F: Glosa Principal (concatenar descripciones de documentos)
        const glosaPrincipal = this.concatenateValues(
          documents.map((doc) => doc.description || "").filter((d) => d),
          "; ",
        ) || ""

        // Columna R: Tipo de Documento
        const tipoDocumento = this.getDocumentTypeCode(documentType, documents[0]?.documentType)

        // Columna S: Número de Documento (concatenar fullNumber)
        const numeroDocumento = this.concatenateValues(documents.map((doc) => doc.fullNumber), "; ")

        // Columna T: Fecha de Documento (concatenar issueDate)
        const fechaDocumento = this.concatenateValues(
          documents.map((doc) => (doc.issueDate ? this.formatDate(doc.issueDate) : "")),
          "; ",
        )

        // Columna U: Fecha de Vencimiento (concatenar dueDate)
        const fechaVencimiento = this.concatenateValues(
          documents.map((doc) => (doc.dueDate ? this.formatDate(doc.dueDate) : "")),
          "; ",
        )

        // Columna A: Campo
        const campo = `${documentType}-${numeroComprobante}`

        // Columna N: Debe/Haber
        const debeHaber = line.movementType === MovementType.DEBIT ? "D" : "H"

        // Columna L: Código de Anexo
        // Si es D (Débito): "0000"
        // Si es H (Haber): RUC del proveedor desde Document.supplier.documentNumber
        let codigoAnexo = "0000"
        if (debeHaber === "H") {
          // Obtener RUC del proveedor desde los documentos
          const supplierRucs = documents
            .filter((doc) => doc.supplier)
            .map((doc) => doc.supplier.documentNumber)
            .filter((ruc) => ruc && ruc.trim() !== "") // Filtrar valores nulos/vacíos
          
          if (supplierRucs.length > 0) {
            // Si hay múltiples proveedores, concatenar con "; "
            codigoAnexo = supplierRucs.length === 1 
              ? supplierRucs[0] 
              : supplierRucs.join("; ")
          }
        }

        // Columna D: Fecha del comprobante (concatenar todas las fechas de emisión de documentos)
        const fechaComprobante = documents.length > 0
          ? this.concatenateValues(
              documents.map((doc) => (doc.issueDate ? this.formatDate(doc.issueDate) : "")),
              "; ",
            )
          : this.formatDate(line.createdAt) // Fallback si no hay documentos

        const row: ConcarExportRowDto = {
          campo,
          subDiario: documentType,
          numeroComprobante,
          fechaComprobante,
          codigoMoneda: currencyCode,
          glosaPrincipal,
          tipoCambio: "",
          tipoConversion: "V",
          flagConversionMoneda: "S",
          fechaTipoCambio: "",
          cuentaContable: line.accountCode,
          codigoAnexo: codigoAnexo,
          centroCosto: "",
          debeHaber,
          importeOriginal: this.formatNumber(line.amount),
          importeDolares: "",
          importeSoles: "",
          tipoDocumento,
          numeroDocumento,
          fechaDocumento,
          fechaVencimiento,
          codigoArea: "",
          glosaDetalle: glosaPrincipal, // Igual que F
          codigoAnexoAuxiliar: "",
          medioPago: "",
          tipoDocumentoReferencia: "",
          numeroDocumentoReferencia: "",
          fechaDocumentoReferencia: "",
          nroRegRegistradorTipoDocRef: "",
          baseImponibleDocumentoReferencia: "",
        }

        data.push(row)
      }
    }

    // Generar periodo para el summary
    const period = month && year ? `${String(month).padStart(2, "0")}/${year}` : "Todos"

    return {
      data,
      summary: {
        totalRecords: data.length,
        totalEntries: entriesMap.size,
        period,
        subDiario: documentType,
      },
    }
  }
}

