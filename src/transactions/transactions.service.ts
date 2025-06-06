import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { Transaction, TransactionStatus } from "@prisma/client"
import { createHash } from "crypto"

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async fetchTransactions(companyId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Transaction>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { companyId },
        include: {
          bankAccount: true,
          supplier: true,
          conciliationItems: {
            include: {
              document: true,
            },
          },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { companyId } }),
    ])

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createTransaction(transactionDto: any): Promise<Transaction> {
    const transactionData = {
      ...transactionDto,
      transactionDate: new Date(transactionDto.transactionDate),
      valueDate: transactionDto.valueDate ? new Date(transactionDto.valueDate) : null,
      pendingAmount: transactionDto.amount, // Inicialmente todo el monto está pendiente
    }

    // Generar hash único para evitar duplicados
    transactionData.transactionHash = this.generateTransactionHash(
      transactionData.bankAccountId,
      transactionData.transactionDate,
      transactionData.amount,
      transactionData.operationNumber,
    )

    return this.prisma.transaction.create({
      data: transactionData,
      include: {
        bankAccount: true,
        supplier: true,
      },
    })
  }

  async updateTransaction(id: string, updates: any): Promise<Transaction> {
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`)
    }

    const updateData = { ...updates }
    if (updateData.transactionDate && typeof updateData.transactionDate === "string") {
      updateData.transactionDate = new Date(updateData.transactionDate)
    }
    if (updateData.valueDate && typeof updateData.valueDate === "string") {
      updateData.valueDate = new Date(updateData.valueDate)
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        bankAccount: true,
        supplier: true,
      },
    })
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`)
    }

    await this.prisma.transaction.delete({
      where: { id },
    })
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        supplier: true,
        conciliationItems: {
          include: {
            document: true,
            conciliation: true,
          },
        },
      },
    })

    return transaction || undefined
  }

  async getTransactionsByBankAccount(bankAccountId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { bankAccountId },
      include: {
        supplier: true,
      },
      orderBy: { transactionDate: "desc" },
    })
  }

  async getTransactionsByStatus(companyId: string, status: TransactionStatus): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { companyId, status },
      include: {
        bankAccount: true,
        supplier: true,
      },
      orderBy: { transactionDate: "desc" },
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
      include: {
        bankAccount: true,
        supplier: true,
      },
      orderBy: { transactionDate: "desc" },
    })
  }

  async importTransactionsFromFile(
    companyId: string,
    bankAccountId: string,
    transactions: any[],
    fileName: string,
  ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    let imported = 0
    let duplicates = 0
    const errors: string[] = []

    for (const txnData of transactions) {
      try {
        const transactionHash = this.generateTransactionHash(
          bankAccountId,
          new Date(txnData.transactionDate),
          txnData.amount,
          txnData.operationNumber,
        )

        // Verificar si ya existe
        const existing = await this.prisma.transaction.findUnique({
          where: { transactionHash },
        })

        if (existing) {
          duplicates++
          continue
        }

        // Clasificar automáticamente la transacción
        const classifiedData = this.classifyTransaction(txnData)

        await this.createTransaction({
          companyId,
          bankAccountId,
          fileName,
          ...classifiedData,
        })

        imported++
      } catch (error) {
        errors.push(`Error importing transaction ${txnData.operationNumber}: ${error.message}`)
      }
    }

    return { imported, duplicates, errors }
  }

  private generateTransactionHash(
    bankAccountId: string,
    transactionDate: Date,
    amount: number,
    operationNumber: string,
  ): string {
    const data = `${bankAccountId}-${transactionDate.toISOString()}-${amount}-${operationNumber}`
    return createHash("sha256").update(data).digest("hex")
  }

  private classifyTransaction(txnData: any): any {
    const description = txnData.description?.toLowerCase() || ""
    const amount = Number(txnData.amount)

    // Clasificación automática basada en patrones
    let isITF = false
    let isDetraction = false
    let isBankFee = false
    let isTransfer = false

    if (description.includes("itf") || description.includes("impuesto")) {
      isITF = true
    } else if (description.includes("detraccion") || description.includes("detracc")) {
      isDetraction = true
    } else if (description.includes("comision") || description.includes("mantenimiento")) {
      isBankFee = true
    } else if (description.includes("transferencia") || description.includes("transf")) {
      isTransfer = true
    }

    return {
      ...txnData,
      amount: Math.abs(amount), // Siempre positivo
      pendingAmount: Math.abs(amount),
      isITF,
      isDetraction,
      isBankFee,
      isTransfer,
    }
  }
}
