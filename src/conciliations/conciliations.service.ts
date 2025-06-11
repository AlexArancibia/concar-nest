import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import   { PrismaService } from "../prisma/prisma.service"
import   { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import {
    Conciliation,
   ConciliationItem,
  ConciliationStatus,
  ConciliationItemStatus,
  ConciliationItemType,
} from "@prisma/client"

// DTOs interfaces (para evitar errores de importación)
interface CreateConciliationDto {
  companyId: string
  bankAccountId: string
  periodStart: string
  periodEnd: string
  totalTransactions?: number
  totalDocuments?: number
  conciliatedItems?: number
  pendingItems?: number
  bankBalance: number
  bookBalance: number
  difference: number
  toleranceAmount?: number
  status?: ConciliationStatus
  createdById: string
}

interface CreateConciliationItemDto {
  conciliationId: string
  itemType: ConciliationItemType
  transactionId?: string
  documentId?: string
  transactionAmount?: number
  documentAmount?: number
  conciliatedAmount: number
  difference?: number
  distributionPercentage?: number
  detractionAmount?: number
  retentionAmount?: number
  status?: ConciliationItemStatus
  notes?: string
  systemNotes?: string
  conciliatedBy?: string
}

interface UpdateConciliationDto {
  companyId?: string
  bankAccountId?: string
  periodStart?: string
  periodEnd?: string
  totalTransactions?: number
  totalDocuments?: number
  conciliatedItems?: number
  pendingItems?: number
  bankBalance?: number
  bookBalance?: number
  difference?: number
  toleranceAmount?: number
  status?: ConciliationStatus
  completedAt?: string
}

interface UpdateConciliationItemDto {
  conciliationId?: string
  itemType?: ConciliationItemType
  transactionId?: string
  documentId?: string
  transactionAmount?: number
  documentAmount?: number
  conciliatedAmount?: number
  difference?: number
  distributionPercentage?: number
  detractionAmount?: number
  retentionAmount?: number
  status?: ConciliationItemStatus
  notes?: string
  systemNotes?: string
  conciliatedBy?: string
  conciliatedAt?: string
}

interface CreateMultipleConciliationDto {
  companyId: string
  bankAccountId: string
  transactionIds: string[]
  documentIds: string[]
  toleranceAmount?: number
  notes?: string
  createdById: string
}

@Injectable()
export class ConciliationsService {
  constructor(private prisma: PrismaService) {}

  async fetchConciliations(companyId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Conciliation>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [conciliations, total] = await Promise.all([
      this.prisma.conciliation.findMany({
        where: { companyId },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          bankAccount: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            take: 5,
            include: {
              transaction: true,
              document: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.conciliation.count({ where: { companyId } }),
    ])

    return {
      data: conciliations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createConciliation(conciliationDto: CreateConciliationDto): Promise<Conciliation> {
    return this.prisma.conciliation.create({
      data: {
        companyId: conciliationDto.companyId,
        bankAccountId: conciliationDto.bankAccountId,
        periodStart: new Date(conciliationDto.periodStart),
        periodEnd: new Date(conciliationDto.periodEnd),
        totalTransactions: conciliationDto.totalTransactions || 0,
        totalDocuments: conciliationDto.totalDocuments || 0,
        conciliatedItems: conciliationDto.conciliatedItems || 0,
        pendingItems: conciliationDto.pendingItems || 0,
        bankBalance: conciliationDto.bankBalance,
        bookBalance: conciliationDto.bookBalance,
        difference: conciliationDto.difference,
        toleranceAmount: conciliationDto.toleranceAmount || 0,
        status: conciliationDto.status || ConciliationStatus.PENDING,
        createdById: conciliationDto.createdById,
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bankAccount: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  async updateConciliation(id: string, updates: UpdateConciliationDto): Promise<Conciliation> {
    const existingConciliation = await this.prisma.conciliation.findUnique({
      where: { id },
    })

    if (!existingConciliation) {
      throw new NotFoundException(`Conciliation with ID ${id} not found`)
    }

    const updateData: any = { ...updates }

    // Convertir strings a Date cuando sea necesario
    if (updateData.periodStart && typeof updateData.periodStart === "string") {
      updateData.periodStart = new Date(updateData.periodStart)
    }
    if (updateData.periodEnd && typeof updateData.periodEnd === "string") {
      updateData.periodEnd = new Date(updateData.periodEnd)
    }
    if (updateData.completedAt && typeof updateData.completedAt === "string") {
      updateData.completedAt = new Date(updateData.completedAt)
    }

    return this.prisma.conciliation.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bankAccount: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  async deleteConciliation(id: string): Promise<void> {
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id },
    })

    if (!conciliation) {
      throw new NotFoundException(`Conciliation with ID ${id} not found`)
    }

    await this.prisma.conciliation.delete({
      where: { id },
    })
  }

  async getConciliationById(id: string): Promise<Conciliation | undefined> {
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bankAccount: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: {
            transaction: {
              include: {
                supplier: true,
              },
            },
            document: {
              include: {
                supplier: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return conciliation || undefined
  }

  // ConciliationItem methods
  async createConciliationItem(item: CreateConciliationItemDto): Promise<ConciliationItem> {
    return this.prisma.conciliationItem.create({
      data: {
        conciliationId: item.conciliationId,
        itemType: item.itemType,
        transactionId: item.transactionId || null,
        documentId: item.documentId || null,
        transactionAmount: item.transactionAmount || null,
        documentAmount: item.documentAmount || null,
        conciliatedAmount: item.conciliatedAmount,
        difference: item.difference || 0,
        distributionPercentage: item.distributionPercentage || null,
        detractionAmount: item.detractionAmount || null,
        retentionAmount: item.retentionAmount || null,
        status: item.status || ConciliationItemStatus.PENDING,
        notes: item.notes || null,
        systemNotes: item.systemNotes || null,
        conciliatedBy: item.conciliatedBy || null,
        conciliatedAt: item.conciliatedBy ? new Date() : null, // Si hay conciliatedBy, se asume que está conciliado
      },
      include: {
        transaction: true,
        document: true,
      },
    })
  }

  async updateConciliationItem(id: string, updates: UpdateConciliationItemDto): Promise<ConciliationItem> {
    const existingItem = await this.prisma.conciliationItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      throw new NotFoundException(`Conciliation item with ID ${id} not found`)
    }

    const updateData: any = { ...updates }

    // Convertir string a Date cuando sea necesario
    if (updateData.conciliatedAt && typeof updateData.conciliatedAt === "string") {
      updateData.conciliatedAt = new Date(updateData.conciliatedAt)
    }

    return this.prisma.conciliationItem.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        transaction: true,
        document: true,
      },
    })
  }

  async deleteConciliationItem(id: string): Promise<void> {
    const item = await this.prisma.conciliationItem.findUnique({
      where: { id },
    })

    if (!item) {
      throw new NotFoundException(`Conciliation item with ID ${id} not found`)
    }

    await this.prisma.conciliationItem.delete({
      where: { id },
    })
  }

  async getConciliationItemById(id: string): Promise<ConciliationItem | undefined> {
    const item = await this.prisma.conciliationItem.findUnique({
      where: { id },
      include: {
        transaction: true,
        document: true,
      },
    })

    return item || undefined
  }

  async getConciliationItemsByConciliation(conciliationId: string): Promise<ConciliationItem[]> {
    return this.prisma.conciliationItem.findMany({
      where: { conciliationId },
      include: {
        transaction: {
          include: {
            supplier: true,
          },
        },
        document: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  // NUEVO: Método para conciliaciones múltiples
  async createMultipleConciliation(dto: CreateMultipleConciliationDto): Promise<Conciliation> {
    // 1. Validar que las transacciones existan y sean de la misma cuenta
    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: dto.transactionIds },
        companyId: dto.companyId,
        bankAccountId: dto.bankAccountId,
        status: { not: "CONCILIATED" },
      },
    })

    if (transactions.length !== dto.transactionIds.length) {
      throw new BadRequestException("Some transactions not found or already conciliated")
    }

    // 2. Validar que los documentos existan
    const documents = await this.prisma.document.findMany({
      where: {
        id: { in: dto.documentIds },
        companyId: dto.companyId,
        status: { not: "CONCILIATED" },
      },
    })

    if (documents.length !== dto.documentIds.length) {
      throw new BadRequestException("Some documents not found or already conciliated")
    }

    // 3. Calcular totales y validar tolerancia
    const totalTransactionAmount = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    const totalDocumentAmount = documents.reduce((sum, d) => sum + Number(d.pendingAmount || d.total), 0)
    const difference = Math.abs(totalTransactionAmount - totalDocumentAmount)

    if (difference > (dto.toleranceAmount || 30)) {
      throw new BadRequestException(
        `Difference ${difference.toFixed(2)} exceeds tolerance ${dto.toleranceAmount || 30}`,
      )
    }

    // 4. Determinar período
    const transactionDates = transactions.map((t) => t.transactionDate)
    const periodStart = new Date(Math.min(...transactionDates.map((d) => d.getTime())))
    const periodEnd = new Date(Math.max(...transactionDates.map((d) => d.getTime())))

    // 5. Crear conciliación
    const conciliation = await this.createConciliation({
      companyId: dto.companyId,
      bankAccountId: dto.bankAccountId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalTransactions: transactions.length,
      totalDocuments: documents.length,
      bankBalance: totalTransactionAmount,
      bookBalance: totalDocumentAmount,
      difference,
      toleranceAmount: dto.toleranceAmount || 30,
      status: ConciliationStatus.IN_PROGRESS,
      createdById: dto.createdById,
    })

    // 6. Crear items con distribución proporcional
    const conciliationItems = []

    for (const transaction of transactions) {
      const transactionAmount = Math.abs(Number(transaction.amount))
      const transactionProportion = transactionAmount / totalTransactionAmount

      for (const document of documents) {
        const documentAmount = Number(document.pendingAmount || document.total)
        const proportionalAmount = documentAmount * transactionProportion

        const item = await this.createConciliationItem({
          conciliationId: conciliation.id,
          itemType: ConciliationItemType.DOCUMENT_TRANSACTION,
          transactionId: transaction.id,
          documentId: document.id,
          transactionAmount,
          documentAmount,
          conciliatedAmount: proportionalAmount,
          difference: 0,
          distributionPercentage: transactionProportion,
          detractionAmount: document.detractionAmount ? Number(document.detractionAmount) : undefined,
          retentionAmount: document.retentionAmount ? Number(document.retentionAmount) : undefined,
          status:
            difference <= (dto.toleranceAmount || 30)
              ? ConciliationItemStatus.MATCHED
              : ConciliationItemStatus.PARTIAL_MATCH,
          notes: dto.notes,
          systemNotes: `Distributed ${(transactionProportion * 100).toFixed(2)}% of transaction amount`,
          conciliatedBy: dto.createdById,
        })

        conciliationItems.push(item)
      }
    }

    // 7. Actualizar estados de transacciones y documentos
    await Promise.all([
      // Actualizar transacciones
      ...transactions.map((transaction) =>
        this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "CONCILIATED",
            conciliatedAmount: Math.abs(Number(transaction.amount)),
            pendingAmount: 0,
          },
        }),
      ),
      // Actualizar documentos
      ...documents.map((document) => {
        const documentAmount = Number(document.pendingAmount || document.total)
        const newConciliatedAmount = Number(document.conciliatedAmount || 0) + documentAmount
        const newPendingAmount = Number(document.total) - newConciliatedAmount

        return this.prisma.document.update({
          where: { id: document.id },
          data: {
            conciliatedAmount: newConciliatedAmount,
            pendingAmount: newPendingAmount,
            status: newPendingAmount <= 0.01 ? "CONCILIATED" : "PARTIALLY_CONCILIATED",
          },
        })
      }),
    ])

    // 8. Finalizar conciliación
    return this.updateConciliation(conciliation.id, {
      conciliatedItems: conciliationItems.length,
      pendingItems: 0,
      status: ConciliationStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    })
  }

  // NUEVO: Validar conciliación múltiple
  async validateMultipleConciliation(
    transactionIds: string[],
    documentIds: string[],
    tolerance = 30,
  ): Promise<{
    isValid: boolean
    totalTransactions: number
    totalDocuments: number
    difference: number
    withinTolerance: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    const [transactions, documents] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { id: { in: transactionIds } },
      }),
      this.prisma.document.findMany({
        where: { id: { in: documentIds } },
      }),
    ])

    if (transactions.length !== transactionIds.length) {
      errors.push("Some transactions not found")
    }

    if (documents.length !== documentIds.length) {
      errors.push("Some documents not found")
    }

    const totalTransactions = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    const totalDocuments = documents.reduce((sum, d) => sum + Number(d.pendingAmount || d.total), 0)
    const difference = Math.abs(totalTransactions - totalDocuments)
    const withinTolerance = difference <= tolerance

    if (!withinTolerance) {
      errors.push(`Difference ${difference.toFixed(2)} exceeds tolerance ${tolerance}`)
    }

    return {
      isValid: errors.length === 0 && transactions.length > 0 && documents.length > 0,
      totalTransactions,
      totalDocuments,
      difference,
      withinTolerance,
      errors,
    }
  }

  // Método existente mejorado
  async performAutomaticConciliation(conciliationId: string): Promise<{
    matched: number
    partialMatches: number
    unmatched: number
  }> {
    const conciliation = await this.getConciliationById(conciliationId)
    if (!conciliation) {
      throw new NotFoundException(`Conciliation with ID ${conciliationId} not found`)
    }

    // Get transactions and documents for the period
    const [transactions, documents] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          companyId: conciliation.companyId,
          bankAccountId: conciliation.bankAccountId,
          transactionDate: {
            gte: conciliation.periodStart,
            lte: conciliation.periodEnd,
          },
          status: "PENDING",
        },
      }),
      this.prisma.document.findMany({
        where: {
          companyId: conciliation.companyId,
          issueDate: {
            gte: conciliation.periodStart,
            lte: conciliation.periodEnd,
          },
          status: {
            in: ["VALIDATED", "PENDING"],
          },
        },
      }),
    ])

    let matched = 0
    let partialMatches = 0
    let unmatched = 0

    // Simple matching algorithm - can be enhanced
    for (const transaction of transactions) {
      const matchingDocuments = documents.filter((doc) => {
        const amountMatch =
          Math.abs(Number(doc.netPayableAmount || doc.total) - Math.abs(Number(transaction.amount))) <
          (Number(conciliation.toleranceAmount) || 0.01)
        const supplierMatch = doc.supplierId === transaction.supplierId
        return amountMatch || supplierMatch
      })

      if (matchingDocuments.length === 1) {
        const document = matchingDocuments[0]
        await this.createConciliationItem({
          conciliationId,
          itemType: ConciliationItemType.DOCUMENT_TRANSACTION,
          transactionId: transaction.id,
          documentId: document.id,
          transactionAmount: Math.abs(Number(transaction.amount)),
          documentAmount: Number(document.netPayableAmount || document.total),
          conciliatedAmount: Math.min(
            Math.abs(Number(transaction.amount)),
            Number(document.netPayableAmount || document.total),
          ),
          status: ConciliationItemStatus.MATCHED,
          systemNotes: "Automatically matched by amount and supplier",
          conciliatedBy: conciliation.createdById,
        })
        matched++
      } else if (matchingDocuments.length > 1) {
        // Partial match - multiple possibilities
        partialMatches++
      } else {
        unmatched++
      }
    }

    // Update conciliation statistics
    await this.updateConciliation(conciliationId, {
      totalTransactions: transactions.length,
      totalDocuments: documents.length,
      conciliatedItems: matched,
      pendingItems: partialMatches + unmatched,
      status: matched > 0 ? ConciliationStatus.IN_PROGRESS : ConciliationStatus.PENDING,
    })

    return { matched, partialMatches, unmatched }
  }
}
