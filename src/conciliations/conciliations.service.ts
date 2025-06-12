import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common"
import  { PrismaService } from "../prisma/prisma.service"
import  { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import {
   Conciliation,
   ConciliationItem,
  ConciliationStatus,
  ConciliationItemStatus,
  ConciliationItemType,
} from "@prisma/client"
import  { CreateConciliationDto } from "./dto/create-conciliation.dto"
import  { UpdateConciliationDto } from "./dto/update-conciliation.dto"
import  { CreateConciliationItemDto } from "./dto/create-conciliation-item.dto"
import  { UpdateConciliationItemDto } from "./dto/update-conciliation-item.dto"

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
          transaction: true, // Incluir la transacción única
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            take: 5,
            include: {
              document: {
                select: {
                  id: true,
                  fullNumber: true,
                  supplierId: true,
                  issueDate: true,
                  dueDate: true,
                  currency: true,
                  total: true,
                  pendingAmount: true,
                  conciliatedAmount: true,
                  description: true,
                  status: true,
                  supplier: {
                    select: {
                      id: true,
                      businessName: true,
                      documentNumber: true,
                      documentType: true,
                    },
                  },
                },
              },
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
    // Verificar que la transacción existe
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: conciliationDto.transactionId },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${conciliationDto.transactionId} not found`)
    }

    // Verificar que la transacción no esté ya conciliada
    const existingConciliation = await this.prisma.conciliation.findUnique({
      where: { transactionId: conciliationDto.transactionId },
    })

    if (existingConciliation) {
      throw new ConflictException(
        `Transaction with ID ${conciliationDto.transactionId} is already associated with another conciliation`,
      )
    }

    return this.prisma.conciliation.create({
      data: {
        companyId: conciliationDto.companyId,
        bankAccountId: conciliationDto.bankAccountId,
        transactionId: conciliationDto.transactionId, // Nueva relación directa
        periodStart: new Date(conciliationDto.periodStart),
        periodEnd: new Date(conciliationDto.periodEnd),
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
        transaction: true, // Incluir la transacción
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
        transaction: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  async deleteConciliation(id: string): Promise<void> {
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!conciliation) {
      throw new NotFoundException(`Conciliation with ID ${id} not found`)
    }

    // Eliminar todos los items primero
    await this.prisma.conciliationItem.deleteMany({
      where: { conciliationId: id },
    })

    // Luego eliminar la conciliación
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
        transaction: {
          // Incluir la transacción única
          include: {
            supplier: true,
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: {
            document: {
              select: {
                id: true,
                fullNumber: true,
                supplierId: true,
                issueDate: true,
                dueDate: true,
                currency: true,
                total: true,
                pendingAmount: true,
                conciliatedAmount: true,
                description: true,
                status: true,
                supplier: {
                  select: {
                    id: true,
                    businessName: true,
                    documentNumber: true,
                    documentType: true,
                  },
                },
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
    // Verificar que la conciliación existe
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id: item.conciliationId },
    })

    if (!conciliation) {
      throw new NotFoundException(`Conciliation with ID ${item.conciliationId} not found`)
    }

    // Verificar que el documento existe
    const document = await this.prisma.document.findUnique({
      where: { id: item.documentId },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID ${item.documentId} not found`)
    }

    const conciliationItem = await this.prisma.conciliationItem.create({
      data: {
        conciliationId: item.conciliationId,
        itemType: item.itemType,
        documentId: item.documentId, // Solo documento, la transacción está en la conciliación
        documentAmount: item.documentAmount,
        conciliatedAmount: item.conciliatedAmount,
        difference: item.difference || 0,
        distributionPercentage: item.distributionPercentage || null,
        detractionAmount: item.detractionAmount || null,
        retentionAmount: item.retentionAmount || null,
        status: item.status || ConciliationItemStatus.PENDING,
        notes: item.notes || null,
        systemNotes: item.systemNotes || null,
        conciliatedBy: item.conciliatedBy,
      },
      include: {
        document: {
          select: {
            id: true,
            fullNumber: true,
            supplierId: true,
            issueDate: true,
            dueDate: true,
            currency: true,
            total: true,
            pendingAmount: true,
            conciliatedAmount: true,
            description: true,
            status: true,
            supplier: {
              select: {
                id: true,
                businessName: true,
                documentNumber: true,
                documentType: true,
              },
            },
          },
        },
      },
    })

    // Actualizar contadores de la conciliación
    await this.updateConciliationCounters(item.conciliationId)

    return conciliationItem
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

    const updatedItem = await this.prisma.conciliationItem.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        document: {
          select: {
            id: true,
            fullNumber: true,
            supplierId: true,
            issueDate: true,
            dueDate: true,
            currency: true,
            total: true,
            pendingAmount: true,
            conciliatedAmount: true,
            description: true,
            status: true,
            supplier: {
              select: {
                id: true,
                businessName: true,
                documentNumber: true,
                documentType: true,
              },
            },
          },
        },
      },
    })

    // Actualizar contadores de la conciliación
    await this.updateConciliationCounters(existingItem.conciliationId)

    return updatedItem
  }

  async deleteConciliationItem(id: string): Promise<void> {
    const item = await this.prisma.conciliationItem.findUnique({
      where: { id },
    })

    if (!item) {
      throw new NotFoundException(`Conciliation item with ID ${id} not found`)
    }

    const conciliationId = item.conciliationId

    await this.prisma.conciliationItem.delete({
      where: { id },
    })

    // Actualizar contadores de la conciliación
    await this.updateConciliationCounters(conciliationId)
  }

  async getConciliationItemById(id: string): Promise<ConciliationItem | undefined> {
    const item = await this.prisma.conciliationItem.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            fullNumber: true,
            supplierId: true,
            issueDate: true,
            dueDate: true,
            currency: true,
            total: true,
            pendingAmount: true,
            conciliatedAmount: true,
            description: true,
            status: true,
            supplier: {
              select: {
                id: true,
                businessName: true,
                documentNumber: true,
                documentType: true,
              },
            },
          },
        },
      },
    })

    return item || undefined
  }

  async getConciliationItemsByConciliation(conciliationId: string): Promise<ConciliationItem[]> {
    return this.prisma.conciliationItem.findMany({
      where: { conciliationId },
      include: {
        document: {
          select: {
            id: true,
            fullNumber: true,
            supplierId: true,
            issueDate: true,
            dueDate: true,
            currency: true,
            total: true,
            pendingAmount: true,
            conciliatedAmount: true,
            description: true,
            status: true,
            supplier: {
              select: {
                id: true,
                businessName: true,
                documentNumber: true,
                documentType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  // Método privado para actualizar contadores
  private async updateConciliationCounters(conciliationId: string): Promise<void> {
    const items = await this.prisma.conciliationItem.findMany({
      where: { conciliationId },
    })

    const totalDocuments = items.length
    const conciliatedItems = items.filter(
      (item) => item.status === ConciliationItemStatus.MATCHED || item.status === ConciliationItemStatus.PARTIAL_MATCH,
    ).length
    const pendingItems = totalDocuments - conciliatedItems

    await this.prisma.conciliation.update({
      where: { id: conciliationId },
      data: {
        totalDocuments,
        conciliatedItems,
        pendingItems,
      },
    })
  }

  // Método para completar conciliación
  async completeConciliation(id: string): Promise<Conciliation> {
    const conciliation = await this.getConciliationById(id)
    if (!conciliation) {
      throw new NotFoundException(`Conciliation with ID ${id} not found`)
    }

    // Verificar si todos los items están conciliados
    const items = await this.prisma.conciliationItem.findMany({
      where: { conciliationId: id },
    })

    const allConciliated = items.every(
      (item) => item.status === ConciliationItemStatus.MATCHED || item.status === ConciliationItemStatus.PARTIAL_MATCH,
    )

    if (!allConciliated) {
      throw new BadRequestException("Cannot complete conciliation because there are pending items")
    }

    // Actualizar la transacción como conciliada
    if (conciliation.transactionId) {
      await this.prisma.transaction.update({
        where: { id: conciliation.transactionId },
        data: {
          status: "CONCILIATED",
          conciliatedAmount: items.reduce((sum, item) => sum + Number(item.conciliatedAmount), 0),
          pendingAmount: 0,
        },
      })
    }

    // Actualizar los documentos
    for (const item of items) {
      const document = await this.prisma.document.findUnique({
        where: { id: item.documentId },
      })

      if (document) {
        const newConciliatedAmount = Number(document.conciliatedAmount || 0) + Number(item.conciliatedAmount)
        const newPendingAmount = Math.max(0, Number(document.total) - newConciliatedAmount)
        const newStatus = newPendingAmount <= 0.01 ? "CONCILIATED" : "PARTIALLY_CONCILIATED"

        await this.prisma.document.update({
          where: { id: document.id },
          data: {
            conciliatedAmount: newConciliatedAmount,
            pendingAmount: newPendingAmount,
            status: newStatus,
          },
        })
      }
    }

    // Completar la conciliación
    return this.updateConciliation(id, {
      status: ConciliationStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    })
  }

  // Método mejorado para conciliación automática
  async performAutomaticConciliation(conciliationId: string): Promise<{
    matched: number
    partialMatches: number
    unmatched: number
  }> {
    const conciliation = await this.getConciliationById(conciliationId)
    if (!conciliation) {
      throw new NotFoundException(`Conciliation with ID ${conciliationId} not found`)
    }

    // Obtener documentos disponibles para el período
    const documents = await this.prisma.document.findMany({
      where: {
        companyId: conciliation.companyId,
        issueDate: {
          gte: conciliation.periodStart,
          lte: conciliation.periodEnd,
        },
        status: {
          in: ["VALIDATED", "PENDING"],
        },
        pendingAmount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        fullNumber: true,
        supplierId: true,
        issueDate: true,
        dueDate: true,
        currency: true,
        total: true,
        pendingAmount: true,
        conciliatedAmount: true,
        description: true,
        status: true,
      },
    })

    let matched = 0
    let partialMatches = 0
    let unmatched = 0

    // Fetch the transaction separately
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: conciliation.transactionId },
      include: { supplier: true },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${conciliation.transactionId} not found`)
    }

    const transactionAmount = Math.abs(Number(transaction.amount || 0))
    const tolerance = Number(conciliation.toleranceAmount) || 0.01

    // Algoritmo de coincidencia simple - puede mejorarse
    for (const document of documents) {
      const documentAmount = Number(document.pendingAmount || document.total)
      const amountDifference = Math.abs(documentAmount - transactionAmount)

      if (amountDifference <= tolerance) {
        // Coincidencia exacta
        await this.createConciliationItem({
          conciliationId,
          itemType: ConciliationItemType.DOCUMENT_TRANSACTION,
          documentId: document.id,
          documentAmount,
          conciliatedAmount: Math.min(transactionAmount, documentAmount),
          difference: amountDifference,
          status: ConciliationItemStatus.MATCHED,
          systemNotes: "Automatically matched by amount",
          conciliatedBy: conciliation.createdById,
          notes: null,
        })
        matched++
      } else if (document.supplierId === transaction.supplierId) {
        // Coincidencia por proveedor pero diferente monto
        await this.createConciliationItem({
          conciliationId,
          itemType: ConciliationItemType.DOCUMENT_TRANSACTION,
          documentId: document.id,
          documentAmount,
          conciliatedAmount: Math.min(transactionAmount, documentAmount),
          difference: amountDifference,
          status: ConciliationItemStatus.PARTIAL_MATCH,
          systemNotes: "Matched by supplier but different amount",
          conciliatedBy: conciliation.createdById,
          notes: null,
        })
        partialMatches++
      } else {
        unmatched++
      }
    }

    // Actualizar estadísticas de conciliación
    await this.updateConciliation(conciliationId, {
      totalDocuments: documents.length,
      conciliatedItems: matched,
      pendingItems: partialMatches + unmatched,
      status: matched > 0 ? ConciliationStatus.IN_PROGRESS : ConciliationStatus.PENDING,
    })

    return { matched, partialMatches, unmatched }
  }

  // Método para validar conciliación
  async validateConciliation(
    transactionId: string,
    documentIds: string[],
    tolerance = 30,
  ): Promise<{
    isValid: boolean
    transactionAmount: number
    totalDocuments: number
    difference: number
    withinTolerance: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    const [transaction, documents] = await Promise.all([
      this.prisma.transaction.findUnique({
        where: { id: transactionId },
      }),
      this.prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: {
          id: true,
          fullNumber: true,
          total: true,
          pendingAmount: true,
        },
      }),
    ])

    if (!transaction) {
      errors.push("Transaction not found")
    }

    if (documents.length !== documentIds.length) {
      errors.push("Some documents not found")
    }

    const transactionAmount = transaction ? Math.abs(Number(transaction.amount)) : 0
    const totalDocuments = documents.reduce((sum, d) => sum + Number(d.pendingAmount || d.total), 0)
    const difference = Math.abs(transactionAmount - totalDocuments)
    const withinTolerance = difference <= tolerance

    if (!withinTolerance) {
      errors.push(`Difference ${difference.toFixed(2)} exceeds tolerance ${tolerance}`)
    }

    return {
      isValid: errors.length === 0 && !!transaction && documents.length > 0,
      transactionAmount,
      totalDocuments,
      difference,
      withinTolerance,
      errors,
    }
  }
}
