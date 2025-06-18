import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import  { PrismaService } from "../prisma/prisma.service"
import  { CreateTransactionDto } from "./dto/create-transaction.dto"
import  { UpdateTransactionDto } from "./dto/update-transaction.dto"
import  { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import  { Transaction, TransactionStatus, TransactionType } from "@prisma/client"
import { createHash } from "crypto"

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchTransactions(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<Transaction>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = {
      companyId,
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: "desc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          bankAccount: {
            select: {
              id: true,
              accountNumber: true,
              alias: true,
              bank: { select: { name: true, code: true } },
              currencyRef: { select: { code: true, name: true, symbol: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              businessName: true,
              documentNumber: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { companyId, bankAccountId, supplierId, ...transactionData } = createTransactionDto

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    // Verify bank account exists and belongs to company
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        companyId,
      },
    })

    if (!bankAccount) {
      throw new NotFoundException(`Bank account with ID ${bankAccountId} not found for company ${companyId}`)
    }

    // Verify supplier exists if provided
    if (supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
        },
      })

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${supplierId} not found for company ${companyId}`)
      }
    }

    // Generate transaction hash for uniqueness
    const transactionHash = this.generateTransactionHash({
      bankAccountId,
      transactionDate: transactionData.transactionDate,
      amount: transactionData.amount,
      description: transactionData.description,
      operationNumber: transactionData.operationNumber,
    })

    // Check for duplicate transaction
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { transactionHash },
    })

    if (existingTransaction) {
      throw new ConflictException("Transaction with same details already exists")
    }

    // Convert numbers to Prisma.Decimal
    const amount = new Prisma.Decimal(transactionData.amount)
    const balance = new Prisma.Decimal(transactionData.balance)
    const conciliatedAmount = new Prisma.Decimal(transactionData.conciliatedAmount || 0)
    const pendingAmount = new Prisma.Decimal(transactionData.pendingAmount)

    const transaction = await this.prisma.transaction.create({
      data: {
        ...transactionData,
        amount,
        balance,
        conciliatedAmount,
        pendingAmount,
        companyId,
        bankAccountId,
        supplierId,
        transactionHash,
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
    })

    // Update bank account balance
    await this.updateBankAccountBalance(bankAccountId, amount, transactionData.transactionType)

    return transaction
  }

  async importTransactionsFromFile(
    companyId: string,
    bankAccountId: string,
    transactions: any[],
    fileName: string,
  ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    // Verify company and bank account
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        companyId,
      },
    })

    if (!bankAccount) {
      throw new NotFoundException(`Bank account with ID ${bankAccountId} not found for company ${companyId}`)
    }

    let imported = 0
    let duplicates = 0
    const errors: string[] = []

    for (const [index, transactionData] of transactions.entries()) {
      try {
        // Generate transaction hash
        const transactionHash = this.generateTransactionHash({
          bankAccountId,
          transactionDate: transactionData.transactionDate,
          amount: transactionData.amount,
          description: transactionData.description,
          operationNumber: transactionData.operationNumber,
        })

        // Check for duplicate
        const existingTransaction = await this.prisma.transaction.findUnique({
          where: { transactionHash },
        })

        if (existingTransaction) {
          duplicates++
          continue
        }

        // Convert to Prisma.Decimal
        const amount = new Prisma.Decimal(transactionData.amount)
        const balance = new Prisma.Decimal(transactionData.balance)
        const conciliatedAmount = new Prisma.Decimal(0)
        const pendingAmount = amount // Initially, pending amount equals total amount

        // Create transaction
        await this.prisma.transaction.create({
          data: {
            ...transactionData,
            amount,
            balance,
            pendingAmount,
            conciliatedAmount,
            companyId,
            bankAccountId,
            transactionHash,
            fileName,
            importedAt: new Date(),
            status: TransactionStatus.PENDING,
          },
        })

        imported++
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`)
      }
    }

    return { imported, duplicates, errors }
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
        conciliations: {
          select: {
            id: true,
            reference: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`)
    }

    return transaction
  }

  async updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`)
    }

    // Convert update data to Prisma.Decimal where needed
    const updateData: any = { ...updateTransactionDto }

    if (updateTransactionDto.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(updateTransactionDto.amount)
    }

    if (updateTransactionDto.balance !== undefined) {
      updateData.balance = new Prisma.Decimal(updateTransactionDto.balance)
    }

    if (updateTransactionDto.conciliatedAmount !== undefined) {
      updateData.conciliatedAmount = new Prisma.Decimal(updateTransactionDto.conciliatedAmount)
    }

    // Calculate pending amount if amount or conciliatedAmount is being updated
    if (updateTransactionDto.amount !== undefined || updateTransactionDto.conciliatedAmount !== undefined) {
      const newAmount =
        updateTransactionDto.amount !== undefined
          ? new Prisma.Decimal(updateTransactionDto.amount)
          : existingTransaction.amount

      const newConciliatedAmount =
        updateTransactionDto.conciliatedAmount !== undefined
          ? new Prisma.Decimal(updateTransactionDto.conciliatedAmount)
          : existingTransaction.conciliatedAmount

      updateData.pendingAmount = newAmount.sub(newConciliatedAmount)
    } else if (updateTransactionDto.pendingAmount !== undefined) {
      updateData.pendingAmount = new Prisma.Decimal(updateTransactionDto.pendingAmount)
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
    })

    return transaction
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conciliations: true,
          },
        },
      },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`)
    }

    // Check if transaction has conciliations
    if (transaction._count.conciliations > 0) {
      throw new BadRequestException("Cannot delete transaction with existing conciliations")
    }

    // Reverse bank account balance update
    await this.updateBankAccountBalance(
      transaction.bankAccountId,
      transaction.amount.neg(),
      transaction.transactionType,
    )

    await this.prisma.transaction.delete({
      where: { id },
    })
  }

  async getTransactionsByBankAccount(bankAccountId: string): Promise<Transaction[]> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    })

    if (!bankAccount) {
      throw new NotFoundException(`Bank account with ID ${bankAccountId} not found`)
    }

    return this.prisma.transaction.findMany({
      where: { bankAccountId },
      orderBy: { transactionDate: "desc" },
      include: {
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
    })
  }

  async getTransactionsByStatus(companyId: string, status: TransactionStatus): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        companyId,
        status,
      },
      orderBy: { transactionDate: "desc" },
      include: {
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            bank: { select: { name: true, code: true } },
          },
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
    })
  }

  async getTransactionsByDateRange(companyId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { transactionDate: "desc" },
      include: {
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            bank: { select: { name: true, code: true } },
          },
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
    })
  }

  // Additional utility methods
  async getTransactionStats(companyId: string) {
    const stats = await this.prisma.transaction.groupBy({
      by: ["status", "transactionType"],
      where: { companyId },
      _count: { status: true },
      _sum: { amount: true },
    })

    const totalTransactions = await this.prisma.transaction.count({
      where: { companyId },
    })

    return {
      total: totalTransactions,
      byStatus: stats.reduce(
        (acc, stat) => {
          const key = `${stat.status}_${stat.transactionType}`
          acc[key] = {
            count: stat._count.status,
            amount: stat._sum.amount?.toNumber() || 0, // Convert Decimal to number
          }
          return acc
        },
        {} as Record<string, { count: number; amount: number }>,
      ),
    }
  }

  async searchTransactions(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Transaction>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.TransactionWhereInput = {
      companyId,
      OR: [
        { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { operationNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { reference: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { supplier: { businessName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } } },
        { supplier: { documentNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } }} ,
      ],
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: "desc" },
        include: {
          bankAccount: {
            select: {
              id: true,
              accountNumber: true,
              alias: true,
              bank: { select: { name: true, code: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              businessName: true,
              documentNumber: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`)
    }

    return this.prisma.transaction.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })
  }

  // Private helper methods
  private generateTransactionHash(data: {
    bankAccountId: string
    transactionDate: Date
    amount: number
    description: string
    operationNumber?: string
  }): string {
    const hashString = `${data.bankAccountId}-${data.transactionDate.toISOString()}-${data.amount}-${data.description}-${data.operationNumber || ""}`
    return createHash("sha256").update(hashString).digest("hex")
  }

  private async updateBankAccountBalance(
    bankAccountId: string,
    amount: Prisma.Decimal,
    transactionType: TransactionType,
  ): Promise<void> {
    const balanceChange = transactionType === "CREDIT" ? amount : amount.neg()

    await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        currentBalance: {
          increment: balanceChange,
        },
      },
    })
  }
}
