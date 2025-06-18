import { Injectable, NotFoundException } from "@nestjs/common"
import   { PrismaService } from "../prisma/prisma.service"
import   { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import {   Expense, ExpenseStatus } from "@prisma/client"

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async fetchExpenses(companyId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Expense>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where: { companyId },
        include: {
          bankAccount: true,
          supplier: true,
          document: true,
          importedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where: { companyId } }),
    ])

    return {
      data: expenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createExpense(expenseDto: any): Promise<Expense> {
    const expenseData = {
      ...expenseDto,
      transactionDate:
        typeof expenseDto.transactionDate === "string"
          ? new Date(expenseDto.transactionDate)
          : expenseDto.transactionDate,
      valueDate: expenseDto.valueDate
        ? typeof expenseDto.valueDate === "string"
          ? new Date(expenseDto.valueDate)
          : expenseDto.valueDate
        : null,
      documentDate: expenseDto.documentDate
        ? typeof expenseDto.documentDate === "string"
          ? new Date(expenseDto.documentDate)
          : expenseDto.documentDate
        : null,
      issueDate: expenseDto.issueDate
        ? typeof expenseDto.issueDate === "string"
          ? new Date(expenseDto.issueDate)
          : expenseDto.issueDate
        : null,
      dueDate: expenseDto.dueDate
        ? typeof expenseDto.dueDate === "string"
          ? new Date(expenseDto.dueDate)
          : expenseDto.dueDate
        : null,
      status: expenseDto.status || ExpenseStatus.IMPORTED,
      rowHash: expenseDto.rowHash || null,
      importedAt: expenseDto.importedAt || new Date(),
      processedAt: expenseDto.processedAt || null,
      processedById: expenseDto.processedById || null,
      reconciledAt: expenseDto.reconciledAt || null,
      reconciledById: expenseDto.reconciledById || null,
    }

    return this.prisma.expense.create({
      data: expenseData,
      include: {
        bankAccount: true,
        supplier: true,
        document: true,
        importedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  async updateExpense(id: string, updates: any): Promise<Expense> {
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found`)
    }

    // Convert string dates to Date objects
    const updateData = { ...updates }
    if (updateData.transactionDate && typeof updateData.transactionDate === "string") {
      updateData.transactionDate = new Date(updateData.transactionDate)
    }
    if (updateData.valueDate && typeof updateData.valueDate === "string") {
      updateData.valueDate = new Date(updateData.valueDate)
    }
    if (updateData.documentDate && typeof updateData.documentDate === "string") {
      updateData.documentDate = new Date(updateData.documentDate)
    }
    if (updateData.issueDate && typeof updateData.issueDate === "string") {
      updateData.issueDate = new Date(updateData.issueDate)
    }
    if (updateData.dueDate && typeof updateData.dueDate === "string") {
      updateData.dueDate = new Date(updateData.dueDate)
    }
    if (updateData.processedAt && typeof updateData.processedAt === "string") {
      updateData.processedAt = new Date(updateData.processedAt)
    }
    if (updateData.reconciledAt && typeof updateData.reconciledAt === "string") {
      updateData.reconciledAt = new Date(updateData.reconciledAt)
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        bankAccount: true,
        supplier: true,
        document: true,
        importedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  async deleteExpense(id: string): Promise<void> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`)
    }

    await this.prisma.expense.delete({
      where: { id },
    })
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        supplier: true,
        document: true,
        importedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reconciledBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return expense || undefined
  }

  async getExpensesByStatus(companyId: string, status: ExpenseStatus): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: { companyId, status },
      include: {
        bankAccount: true,
        supplier: true,
        document: true,
      },
      orderBy: { transactionDate: "desc" },
    })
  }

  async reconcileExpense(id: string, documentId: string, reconciledById: string): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data: {
        documentId,
        status: ExpenseStatus.PROCESSED,
        reconciledAt: new Date(),
        reconciledById,
        updatedAt: new Date(),
      },
      include: {
        bankAccount: true,
        supplier: true,
        document: true,
      },
    })
  }
}
