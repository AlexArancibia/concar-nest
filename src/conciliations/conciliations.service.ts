import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { type Conciliation, type ConciliationItem, ConciliationStatus, ConciliationItemStatus } from "@prisma/client"

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

  async createConciliation(conciliationDto: any): Promise<Conciliation> {
    const conciliationData = {
      ...conciliationDto,
      periodStart: new Date(conciliationDto.periodStart),
      periodEnd: new Date(conciliationDto.periodEnd),
    }

    return this.prisma.conciliation.create({
      data: conciliationData,
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

  async updateConciliation(id: string, updates: any): Promise<Conciliation> {
    const existingConciliation = await this.prisma.conciliation.findUnique({
      where: { id },
    })

    if (!existingConciliation) {
      throw new NotFoundException(`Conciliation with ID ${id} not found`)
    }

    const updateData = { ...updates }
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
  async createConciliationItem(item: any): Promise<ConciliationItem> {
    const itemData = {
      ...item,
      conciliatedAt: item.conciliatedAt ? new Date(item.conciliatedAt) : null,
    }

    return this.prisma.conciliationItem.create({
      data: itemData,
      include: {
        transaction: true,
        document: true,
      },
    })
  }

  async updateConciliationItem(id: string, updates: any): Promise<ConciliationItem> {
    const existingItem = await this.prisma.conciliationItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      throw new NotFoundException(`Conciliation item with ID ${id} not found`)
    }

    const updateData = { ...updates }
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

  // Automatic conciliation methods
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
        const amountMatch = Math.abs(Number(doc.netPayableAmount) - Number(transaction.amount)) < 0.01
        const supplierMatch = doc.supplierId === transaction.supplierId
        return amountMatch || supplierMatch
      })

      if (matchingDocuments.length === 1) {
        const document = matchingDocuments[0]
        await this.createConciliationItem({
          conciliationId,
          itemType: "DOCUMENT_TRANSACTION",
          transactionId: transaction.id,
          documentId: document.id,
          transactionAmount: Number(transaction.amount),
          documentAmount: Number(document.netPayableAmount),
          conciliatedAmount: Math.min(Number(transaction.amount), Number(document.netPayableAmount)),
          status: ConciliationItemStatus.MATCHED,
          systemNotes: "Automatically matched by amount and supplier",
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
