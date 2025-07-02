import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateConciliationDto } from "./dto/create-conciliation.dto"
import { UpdateConciliationDto } from "./dto/update-conciliation.dto"
import { CreateConciliationItemDto } from "./dto/create-conciliation-item.dto"
import { UpdateConciliationItemDto } from "./dto/update-conciliation-item.dto"
import { CreateConciliationExpenseDto } from "./dto/create-conciliation-expense.dto"
import { UpdateConciliationExpenseDto } from "./dto/update-conciliation-expense.dto"
import { ConciliationFiltersDto } from "./dto/conciliation-filters.dto"
import { ConciliationStatus, ConciliationItemStatus, ConciliationType } from "@prisma/client"
import { ConciliationQueryDto } from "./dto/conciliation-query.dto"

@Injectable()
export class ConciliationsService {
  constructor(private prisma: PrismaService) {}

  // Conciliation CRUD operations
async fetchConciliations(companyId: string, conciliationQueryDto: ConciliationQueryDto) {
  const {
    page = 1,
    limit = 10,
    status,
    type,
    dateFrom,
    dateTo,
    periodFrom,
    periodTo,
    search,
    bankAccountId,
    minDifference,
    maxDifference,
    minBankBalance,
    maxBankBalance,
    createdById,
    approvedById,
    hasTransaction,
  } = conciliationQueryDto;

  const skip = (page - 1) * limit;

  const where: any = {
    companyId,
  };

  // Status filter
  if (status) {
    where.status = status;
  }

  // Type filter
  if (type) {
    where.type = type;
  }

  // Date range filter (createdAt)
  if (dateFrom && dateTo) {
    where.createdAt = {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    };
  } else if (dateFrom) {
    where.createdAt = {
      gte: new Date(dateFrom),
    };
  } else if (dateTo) {
    where.createdAt = {
      lte: new Date(dateTo),
    };
  }

  // Period range filter (periodStart and periodEnd)
  if (periodFrom && periodTo) {
    where.OR = [
      {
        periodStart: {
          lte: new Date(periodTo),
        },
        periodEnd: {
          gte: new Date(periodFrom),
        },
      },
      {
        periodStart: {
          gte: new Date(periodFrom),
          lte: new Date(periodTo),
        },
      },
      {
        periodEnd: {
          gte: new Date(periodFrom),
          lte: new Date(periodTo),
        },
      },
    ];
  } else if (periodFrom) {
    where.periodStart = {
      gte: new Date(periodFrom),
    };
  } else if (periodTo) {
    where.periodEnd = {
      lte: new Date(periodTo),
    };
  }

  // Search filter
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  // Bank account filter
  if (bankAccountId) {
    where.bankAccountId = bankAccountId;
  }

  // Difference range filter
  if (minDifference && maxDifference) {
    where.difference = {
      gte: parseFloat(minDifference),
      lte: parseFloat(maxDifference),
    };
  } else if (minDifference) {
    where.difference = {
      gte: parseFloat(minDifference),
    };
  } else if (maxDifference) {
    where.difference = {
      lte: parseFloat(maxDifference),
    };
  }

  // Bank balance range filter
  if (minBankBalance && maxBankBalance) {
    where.bankBalance = {
      gte: parseFloat(minBankBalance),
      lte: parseFloat(maxBankBalance),
    };
  } else if (minBankBalance) {
    where.bankBalance = {
      gte: parseFloat(minBankBalance),
    };
  } else if (maxBankBalance) {
    where.bankBalance = {
      lte: parseFloat(maxBankBalance),
    };
  }

  // Created by filter
  if (createdById) {
    where.createdById = createdById;
  }

  // Approved by filter
  if (approvedById) {
    where.approvedById = approvedById;
  }

  // Has transaction filter
  if (hasTransaction !== undefined) {
    if (hasTransaction) {
      where.transactionId = { not: null };
    } else {
      where.transactionId = null;
    }
  }

  const [conciliations, total] = await Promise.all([
    this.prisma.conciliation.findMany({
      where,
      skip,
      take: limit,
      include: {
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            bank: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            transactionDate: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
            expenses: true,
          },
        },
        // Nueva sección para incluir información de detracciones
        documentDetractions: {
          select: {
            id: true,
            amount: true,
            code: true,
            document: {
              select: {
                id: true,
                fullNumber: true,
                issueDate: true,
                total: true,
                currency: true,
                supplier: {
                  select: {
                    id: true,
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    this.prisma.conciliation.count({ where }),
  ]);

  // Enriquecer los datos de las conciliaciones con información resumida
  const enrichedConciliations = conciliations.map(conciliation => {
    // Calcular el total de detracciones
    const detractionTotal = conciliation.documentDetractions.reduce(
      (sum, detraction) => sum + detraction.amount.toNumber(),
      0
    );

    // Obtener IDs de documentos asociados a detracciones
    const documentIds = conciliation.documentDetractions.map(
      d => d.document.id
    );

    return {
      ...conciliation,
      detractionTotal,
      documentIds,
    };
  });

  return {
    data: enrichedConciliations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
  async createConciliation(createConciliationDto: CreateConciliationDto) {
    const { expenses, detractionIds, ...conciliationData } = createConciliationDto;

    // Verify bank account exists and belongs to company
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: conciliationData.bankAccountId,
        companyId: conciliationData.companyId,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException("Bank account not found or doesn't belong to company");
    }

    // Verify transaction exists if provided
    if (conciliationData.transactionId) {
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          id: conciliationData.transactionId,
          companyId: conciliationData.companyId,
        },
      });

      if (!transaction) {
        throw new NotFoundException("Transaction not found or doesn't belong to company");
      }
    }

    // For DETRACTIONS type, reset conciliation items counts as they don't apply
    if (conciliationData.type === ConciliationType.DETRACTIONS) {
      conciliationData.totalDocuments = 0;
      conciliationData.conciliatedItems = 0;
      conciliationData.pendingItems = 0;
    }

    // Verify detractions exist if provided
    if (detractionIds && detractionIds.length > 0) {
      const detractionsCount = await this.prisma.documentDetraction.count({
        where: {
          id: { in: detractionIds },
        },
      });

      if (detractionsCount !== detractionIds.length) {
        throw new NotFoundException("One or more detractions not found or don't belong to company");
      }
    }

    return this.prisma.conciliation.create({
      data: {
        ...conciliationData,
        periodStart: new Date(conciliationData.periodStart),
        periodEnd: new Date(conciliationData.periodEnd),
        paymentDate: conciliationData.paymentDate ? new Date(conciliationData.paymentDate) : null,
        expenses: expenses
          ? {
              create: expenses.map((expense) => ({
                ...expense,
                expenseDate: new Date(expense.expenseDate),
              })),
            }
          : undefined,
        documentDetractions: detractionIds && detractionIds.length > 0
          ? {
              connect: detractionIds.map(id => ({ id })),
            }
          : undefined,
      },
      include: {
        bankAccount: {
          include: {
            bank: true,
          },
        },
        transaction: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        expenses: true,
        documentDetractions: true,
      },
    });
  }

  async getConciliationById(id: string) {
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id },
      include: {
        bankAccount: {
          include: {
            bank: true,
          },
        },
        transaction: true,
        items: {
          include: {
            document: {
              select: {
                id: true,
                fullNumber: true,
                documentType: true,
                issueDate: true,
                total: true,
                supplier: {
                  select: {
                    businessName: true,
                    documentNumber: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        expenses: {
          include: {
            account: {
              select: {
                accountCode: true,
                accountName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!conciliation) {
      throw new NotFoundException("Conciliation not found")
    }

    return conciliation
  }

  async updateConciliation(id: string, updateConciliationDto: UpdateConciliationDto) {
    const existingConciliation = await this.prisma.conciliation.findUnique({
      where: { id },
    })

    if (!existingConciliation) {
      throw new NotFoundException("Conciliation not found")
    }

    // Prepare update data excluding problematic fields
    const updateData: any = {}

    const allowedFields = [
      "reference",
      "periodStart",
      "periodEnd",
      "totalDocuments",
      "conciliatedItems",
      "pendingItems",
      "bankBalance",
      "bookBalance",
      "difference",
      "toleranceAmount",
      "status",
      "additionalExpensesTotal",
      "totalAmount",
      "paymentDate",
      "paymentAmount",
      "notes",
      "approvedById",
      "completedAt",
    ]

    allowedFields.forEach((field) => {
      if (updateConciliationDto[field] !== undefined) {
        if (field === "periodStart" || field === "periodEnd" || field === "paymentDate" || field === "completedAt") {
          updateData[field] = updateConciliationDto[field] ? new Date(updateConciliationDto[field]) : null
        } else {
          updateData[field] = updateConciliationDto[field]
        }
      }
    })

    updateData.updatedAt = new Date()

    return this.prisma.conciliation.update({
      where: { id },
      data: updateData,
      include: {
        bankAccount: {
          include: {
            bank: true,
          },
        },
        transaction: true,
        items: true,
        expenses: true,
      },
    })
  }

  async deleteConciliation(id: string) {
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id },
    })

    if (!conciliation) {
      throw new NotFoundException("Conciliation not found")
    }

    if (conciliation.status === ConciliationStatus.COMPLETED) {
      throw new BadRequestException("Cannot delete completed conciliation")
    }

    await this.prisma.conciliation.delete({
      where: { id },
    })
  }

  // Conciliation completion and automation
  async completeConciliation(id: string) {
    const conciliation = await this.getConciliationById(id)

    if (conciliation.status === ConciliationStatus.COMPLETED) {
      throw new BadRequestException("Conciliation is already completed")
    }

    // Validate that all items are properly conciliated
    const pendingItems = conciliation.items.filter(
      (item) => item.status === ConciliationItemStatus.PENDING || item.status === ConciliationItemStatus.PARTIAL,
    )

    if (pendingItems.length > 0) {
      throw new BadRequestException(`Cannot complete conciliation with ${pendingItems.length} pending items`)
    }

    // Calculate totals
    const totalConciliatedAmount = conciliation.items.reduce((sum, item) => sum + Number(item.conciliatedAmount), 0)
    const totalExpenses = conciliation.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    return this.prisma.conciliation.update({
      where: { id },
      data: {
        status: ConciliationStatus.COMPLETED,
        completedAt: new Date(),
        totalAmount: totalConciliatedAmount,
        additionalExpensesTotal: totalExpenses,
        conciliatedItems: conciliation.items.length,
        pendingItems: 0,
      },
      include: {
        bankAccount: true,
        transaction: true,
        items: true,
        expenses: true,
      },
    })
  }

  async performAutomaticConciliation(id: string) {
    const conciliation = await this.getConciliationById(id)

    if (conciliation.status === ConciliationStatus.COMPLETED) {
      throw new BadRequestException("Cannot perform automatic conciliation on completed conciliation")
    }

    // Get pending documents in the date range
    const pendingDocuments = await this.prisma.document.findMany({
      where: {
        companyId: conciliation.companyId,
        issueDate: {
          gte: conciliation.periodStart,
          lte: conciliation.periodEnd,
        },
        status: "PENDING",
        conciliationItems: {
          none: {},
        },
      },
      include: {
        supplier: true,
      },
    })

    // Simple automatic matching logic
    const tolerance = Number(conciliation.toleranceAmount) || 30
    const transactionAmount = conciliation.transaction ? Number(conciliation.transaction.amount) : 0
    const matchedDocuments = []

    if (transactionAmount > 0) {
      // Try to find exact matches first
      const exactMatch = pendingDocuments.find((doc) => Math.abs(Number(doc.total) - transactionAmount) <= tolerance)

      if (exactMatch) {
        matchedDocuments.push({
          document: exactMatch,
          conciliatedAmount: Number(exactMatch.total),
          difference: transactionAmount - Number(exactMatch.total),
        })
      } else {
        // Try to find combination of documents that match
        const combinations = this.findDocumentCombinations(pendingDocuments, transactionAmount, tolerance)
        if (combinations.length > 0) {
          matchedDocuments.push(...combinations[0])
        }
      }
    }

    // Create conciliation items for matched documents
    const createdItems = []
    for (const match of matchedDocuments) {
      const item = await this.createConciliationItem({
        conciliationId: id,
        itemType: "DOCUMENT",
        documentId: match.document.id,
        documentAmount: Number(match.document.total),
        conciliatedAmount: match.conciliatedAmount,
        difference: match.difference,
        status:
          Math.abs(match.difference) <= tolerance ? ConciliationItemStatus.MATCHED : ConciliationItemStatus.PARTIAL,
        systemNotes: "Automatically matched by system",
      })
      createdItems.push(item)
    }

    // Update conciliation status
    await this.prisma.conciliation.update({
      where: { id },
      data: {
        status: createdItems.length > 0 ? ConciliationStatus.IN_PROGRESS : ConciliationStatus.PENDING,
        conciliatedItems: createdItems.length,
        pendingItems: Math.max(0, conciliation.totalDocuments - createdItems.length),
      },
    })

    return {
      matchedDocuments: createdItems.length,
      totalAmount: matchedDocuments.reduce((sum, match) => sum + match.conciliatedAmount, 0),
      items: createdItems,
    }
  }

  async validateConciliation(transactionId: string, documentIds: string[], tolerance = 30) {
    // Get transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      throw new NotFoundException("Transaction not found")
    }

    // Get documents
    const documents = await this.prisma.document.findMany({
      where: {
        id: { in: documentIds },
        companyId: transaction.companyId,
      },
      include: {
        supplier: {
          select: {
            businessName: true,
            documentNumber: true,
          },
        },
      },
    })

    if (documents.length !== documentIds.length) {
      throw new BadRequestException("Some documents were not found or don't belong to the same company")
    }

    // Calculate totals
    const transactionAmount = Number(transaction.amount)
    const documentsTotal = documents.reduce((sum, doc) => sum + Number(doc.total), 0)
    const difference = transactionAmount - documentsTotal
    const isWithinTolerance = Math.abs(difference) <= tolerance

    return {
      transaction: {
        id: transaction.id,
        amount: transactionAmount,
        description: transaction.description,
        date: transaction.transactionDate,
      },
      documents: documents.map((doc) => ({
        id: doc.id,
        fullNumber: doc.fullNumber,
        amount: Number(doc.total),
        supplier: doc.supplier?.businessName,
        issueDate: doc.issueDate,
      })),
      summary: {
        transactionAmount,
        documentsTotal,
        difference,
        tolerance,
        isWithinTolerance,
        canConciliate: isWithinTolerance,
      },
    }
  }

  // ConciliationItem CRUD operations
  async createConciliationItem(createConciliationItemDto: CreateConciliationItemDto) {
    // Verify conciliation exists
    const conciliation = await this.prisma.conciliation.findUnique({
      where: { id: createConciliationItemDto.conciliationId },
    })

    if (!conciliation) {
      throw new NotFoundException("Conciliation not found")
    }

    // Verify document exists if provided
    if (createConciliationItemDto.documentId) {
      const document = await this.prisma.document.findFirst({
        where: {
          id: createConciliationItemDto.documentId,
          companyId: conciliation.companyId,
        },
      })

      if (!document) {
        throw new NotFoundException("Document not found or doesn't belong to the same company")
      }
    }

    return this.prisma.conciliationItem.create({
      data: createConciliationItemDto,
      include: {
        document: {
          select: {
            id: true,
            fullNumber: true,
            documentType: true,
            total: true,
            supplier: {
              select: {
                businessName: true,
              },
            },
          },
        },
        conciliation: {
          select: {
            id: true,
            reference: true,
            status: true,
          },
        },
      },
    })
  }

  async getConciliationItemById(id: string) {
    const item = await this.prisma.conciliationItem.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            supplier: true,
          },
        },
        conciliation: {
          include: {
            bankAccount: true,
            transaction: true,
          },
        },
      },
    })

    if (!item) {
      throw new NotFoundException("Conciliation item not found")
    }

    return item
  }

  async updateConciliationItem(id: string, updateConciliationItemDto: UpdateConciliationItemDto) {
    const existingItem = await this.prisma.conciliationItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      throw new NotFoundException("Conciliation item not found")
    }

    return this.prisma.conciliationItem.update({
      where: { id },
      data: {
        ...updateConciliationItemDto,
        updatedAt: new Date(),
      },
      include: {
        document: true,
        conciliation: true,
      },
    })
  }

  async deleteConciliationItem(id: string) {
    const item = await this.prisma.conciliationItem.findUnique({
      where: { id },
      include: {
        conciliation: true,
      },
    })

    if (!item) {
      throw new NotFoundException("Conciliation item not found")
    }

    if (item.conciliation.status === ConciliationStatus.COMPLETED) {
      throw new BadRequestException("Cannot delete item from completed conciliation")
    }

    await this.prisma.conciliationItem.delete({
      where: { id },
    })
  }

  async getConciliationItemsByConciliation(conciliationId: string) {
    return this.prisma.conciliationItem.findMany({
      where: { conciliationId },
      include: {
        document: {
          include: {
            supplier: {
              select: {
                businessName: true,
                documentNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  // ConciliationExpense CRUD operations
  async createConciliationExpense(createExpenseDto: CreateConciliationExpenseDto) {
  // Verificar que conciliationId esté presente
  if (!createExpenseDto.conciliationId) {
    throw new BadRequestException("conciliationId is required")
  }

  // Verify conciliation exists
  const conciliation = await this.prisma.conciliation.findUnique({
    where: { id: createExpenseDto.conciliationId },
  })

  if (!conciliation) {
    throw new NotFoundException("Conciliation not found")
  }

  return this.prisma.conciliationExpense.create({
    data: {
      ...createExpenseDto,
      conciliationId: createExpenseDto.conciliationId, // Asegurar que no sea undefined
      expenseDate: new Date(createExpenseDto.expenseDate),
    },
    include: {
      conciliation: {
        select: {
          id: true,
          reference: true,
          status: true,
        },
      },
      account: {
        select: {
          accountCode: true,
          accountName: true,
        },
      },
    },
  })
}

  async getConciliationExpenseById(id: string) {
    const expense = await this.prisma.conciliationExpense.findUnique({
      where: { id },
      include: {
        conciliation: true,
        account: true,
      },  
    })

    if (!expense) {
      throw new NotFoundException("Conciliation expense not found")
    }

    return expense
  }

  async updateConciliationExpense(id: string, updateExpenseDto: UpdateConciliationExpenseDto) {
    const existingExpense = await this.prisma.conciliationExpense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      throw new NotFoundException("Conciliation expense not found")
    }

    const updateData: any = { ...updateExpenseDto }
    if (updateExpenseDto.expenseDate) {
      updateData.expenseDate = new Date(updateExpenseDto.expenseDate)
    }

    return this.prisma.conciliationExpense.update({
      where: { id },
      data: updateData,
      include: {
        conciliation: true,
        account: true,
      },
    })
  }

  async deleteConciliationExpense(id: string) {
    const expense = await this.prisma.conciliationExpense.findUnique({
      where: { id },
      include: {
        conciliation: true,
      },
    })

    if (!expense) {
      throw new NotFoundException("Conciliation expense not found")
    }

    if (expense.conciliation.status === ConciliationStatus.COMPLETED) {
      throw new BadRequestException("Cannot delete expense from completed conciliation")
    }

    await this.prisma.conciliationExpense.delete({
      where: { id },
    })
  }

  async getConciliationExpensesByConciliation(conciliationId: string) {
    return this.prisma.conciliationExpense.findMany({
      where: { conciliationId },
      include: {
        account: {
          select: {
            accountCode: true,
            accountName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  // Advanced filtering
  async fetchConciliationsAdvanced(companyId: string, filters: ConciliationFiltersDto) {
    const { page = 1, limit = 10, type, status, bankAccountId, startDate, endDate, createdById, search } = filters
    const skip = (page - 1) * limit

    const where: any = { companyId }

    if (type) where.type = type
    if (status) where.status = status
    if (bankAccountId) where.bankAccountId = bankAccountId
    if (createdById) where.createdById = createdById

    if (startDate && endDate) {
      where.periodStart = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { bankAccount: { accountNumber: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [conciliations, total] = await Promise.all([
      this.prisma.conciliation.findMany({
        where,
        skip,
        take: limit,
        include: {
          bankAccount: {
            include: {
              bank: true,
            },
          },
          transaction: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              items: true,
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.conciliation.count({ where }),
    ])

    return {
      data: conciliations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Statistics and reporting
  async getConciliationStatistics(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [total, completed, inProgress, pending] = await Promise.all([
      this.prisma.conciliation.count({ where }),
      this.prisma.conciliation.count({ where: { ...where, status: ConciliationStatus.COMPLETED } }),
      this.prisma.conciliation.count({ where: { ...where, status: ConciliationStatus.IN_PROGRESS } }),
      this.prisma.conciliation.count({ where: { ...where, status: ConciliationStatus.PENDING } }),
    ])

    const totalAmount = await this.prisma.conciliation.aggregate({
      where: { ...where, status: ConciliationStatus.COMPLETED },
      _sum: {
        totalAmount: true,
      },
    })

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      totalConciliatedAmount: totalAmount._sum.totalAmount || 0,
    }
  }

  // Bulk operations
  async bulkCompleteConciliations(conciliationIds: string[]) {
    const results = []
    for (const id of conciliationIds) {
      try {
        const result = await this.completeConciliation(id)
        results.push({ id, success: true, data: result })
      } catch (error) {
        results.push({ id, success: false, error: error.message })
      }
    }
    return results
  }

  async bulkAutoConciliate(conciliationIds: string[]) {
    const results = []
    for (const id of conciliationIds) {
      try {
        const result = await this.performAutomaticConciliation(id)
        results.push({ id, success: true, data: result })
      } catch (error) {
        results.push({ id, success: false, error: error.message })
      }
    }
    return results
  }

  // Export functionality
  async exportConciliations(companyId: string, format: "csv" | "excel", filters: ConciliationFiltersDto) {
    const conciliations = await this.fetchConciliationsAdvanced(companyId, { ...filters, limit: 10000 })

    // This would typically generate actual CSV/Excel files
    // For now, return the data structure
    return {
      format,
      data: conciliations.data,
      filename: `conciliations_${new Date().toISOString().split("T")[0]}.${format}`,
      totalRecords: conciliations.total,
    }
  }

  // Pending documents for conciliation
  async getPendingDocumentsForConciliation(
    companyId: string,
    startDate?: string,
    endDate?: string,
    bankAccountId?: string,
  ) {
    const where: any = {
      companyId,
      status: "PENDING",
      conciliationItems: {
        none: {},
      },
    }

    if (startDate && endDate) {
      where.issueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    return this.prisma.document.findMany({
      where,
      include: {
        supplier: {
          select: {
            businessName: true,
            documentNumber: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    })
  }

  // Unmatched transactions
  async getUnmatchedTransactions(companyId: string, startDate?: string, endDate?: string, bankAccountId?: string) {
    const where: any = {
      companyId,
      conciliations: {
        none: {},
      },
    }

    if (bankAccountId) {
      where.bankAccountId = bankAccountId
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        bankAccount: {
          select: {
            accountNumber: true,
            alias: true,
            bank: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: "desc" },
    })
  }

  // Helper methods
  private findDocumentCombinations(documents: any[], targetAmount: number, tolerance: number) {
    const combinations = []

    // Try pairs of documents
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const total = Number(documents[i].total) + Number(documents[j].total)
        const difference = targetAmount - total

        if (Math.abs(difference) <= tolerance) {
          combinations.push([
            {
              document: documents[i],
              conciliatedAmount: Number(documents[i].total),
              difference: 0,
            },
            {
              document: documents[j],
              conciliatedAmount: Number(documents[j].total),
              difference: difference,
            },
          ])
        }
      }
    }

    return combinations
  }
}
