import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { PaginatedResponse } from "../common/dto/pagination.dto";
import { Transaction, TransactionStatus, Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { TransactionFiltersDto } from "./dto/transaction-filters.dto";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchTransactions(companyId: string, filters: TransactionFiltersDto): Promise<PaginatedResponse<Transaction>> {
    const {
      page = 1,
      limit = 10,
      status,
      transactionType,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
      bankAccountId,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      companyId,
      ...(status && { status }),
      ...(transactionType && { transactionType }),
      ...(bankAccountId && { bankAccountId }),
      ...((dateFrom || dateTo) && {
        transactionDate: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
      ...((minAmount !== undefined || maxAmount !== undefined) && {
        amount: {
          ...(minAmount !== undefined && { gte: minAmount }),
          ...(maxAmount !== undefined && { lte: maxAmount }),
        },
      }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
          { operationNumber: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          bankAccount: {
            include: {
              bank: true,
              currencyRef: true,
            },
          },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({
        where,
      }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { companyId, bankAccountId, transactionDate, description, transactionType, amount, balance, ...otherFields } =
      createTransactionDto

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })
    if (!company) {
      throw new NotFoundException("Company not found")
    }

    // Verify bank account exists and belongs to company
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        companyId,
      },
    })
    if (!bankAccount) {
      throw new NotFoundException("Bank account not found or does not belong to company")
    }

    // Generate transaction hash for uniqueness
    const hashData = {
      bankAccountId,
      transactionDate: new Date(transactionDate),
      description,
      amount,
      balance,
      operationNumber: otherFields.operationNumber,
      operationTime: otherFields.operationTime,
      utc: otherFields.utc,
    }

    console.log("🔍 DEBUG - Hash Data:", JSON.stringify(hashData, null, 2))

    const transactionHash = this.generateTransactionHash(hashData)

    console.log("🔑 DEBUG - Generated Hash:", transactionHash)

    // Check for duplicate transaction
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { transactionHash },
    })

    if (existingTransaction) {
      console.log("❌ DEBUG - Duplicate transaction found:", {
        existingId: existingTransaction.id,
        existingDate: existingTransaction.transactionDate,
        existingDescription: existingTransaction.description,
        existingAmount: existingTransaction.amount,
        existingBalance: existingTransaction.balance,
        existingOperationNumber: existingTransaction.operationNumber,
        newHash: transactionHash,
      })
      throw new BadRequestException(`Transaction already exists with hash: ${transactionHash}`)
    }

    console.log("✅ DEBUG - Creating new transaction with hash:", transactionHash)

    return this.prisma.transaction.create({
      data: {
        companyId,
        bankAccountId,
        transactionDate: new Date(transactionDate),
        valueDate: otherFields.valueDate ? new Date(otherFields.valueDate) : undefined,
        description,
        transactionType,
        amount,
        balance,
        transactionHash,
        importedAt: otherFields.importedAt ? new Date(otherFields.importedAt) : undefined,
        ...otherFields,
      },
      include: {
        bankAccount: {
          include: {
            bank: true,
            currencyRef: true,
          },
        },
      },
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

    for (const [index, transactionData] of transactions.entries()) {
      try {
        const hashData = {
          bankAccountId,
          transactionDate: transactionData.transactionDate,
          description: transactionData.description,
          amount: transactionData.amount,
          balance: transactionData.balance,
          operationNumber: transactionData.operationNumber,
          operationTime: transactionData.operationTime,
          utc: transactionData.utc,
        }

        const transactionHash = this.generateTransactionHash(hashData)

        console.log(`🔍 DEBUG - Row ${index + 1} Hash Data:`, JSON.stringify(hashData, null, 2))
        console.log(`🔑 DEBUG - Row ${index + 1} Generated Hash:`, transactionHash)

        // Check for duplicate
        const existing = await this.prisma.transaction.findUnique({
          where: { transactionHash },
        })

        if (existing) {
          console.log(`❌ DEBUG - Row ${index + 1} Duplicate found:`, existing.id)
          duplicates++
          continue
        }

        await this.prisma.transaction.create({
          data: {
            companyId,
            bankAccountId,
            transactionHash,
            fileName,
            importedAt: new Date(),
            ...transactionData,
          },
        })

        console.log(`✅ DEBUG - Row ${index + 1} Created successfully`)
        imported++
      } catch (error) {
        console.error(`❌ DEBUG - Row ${index + 1} Error:`, error.message)
        errors.push(`Row ${index + 1}: ${error.message}`)
      }
    }

    return { imported, duplicates, errors }
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        bankAccount: {
          include: {
            bank: true,
            currencyRef: true,
          },
        },
        company: true,
      },
    })

    if (!transaction) {
      throw new NotFoundException("Transaction not found")
    }

    return transaction
  }

  async updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      throw new NotFoundException("Transaction not found")
    }

    // Prepare update data with proper date conversion
    const updateData: any = { ...updateTransactionDto }

    // Convert date strings to Date objects for Prisma
    if (updateTransactionDto.transactionDate) {
      updateData.transactionDate = new Date(updateTransactionDto.transactionDate)
    }
    if (updateTransactionDto.valueDate) {
      updateData.valueDate = new Date(updateTransactionDto.valueDate)
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        bankAccount: {
          include: {
            bank: true,
            currencyRef: true,
          },
        },
      },
    })
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      throw new NotFoundException("Transaction not found")
    }

    await this.prisma.transaction.delete({
      where: { id },
    })
  }

  async getTransactionsByBankAccount(bankAccountId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { bankAccountId },
      orderBy: { transactionDate: "desc" },
    })
  }

  async getTransactionsByStatus(companyId: string, status: TransactionStatus): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        companyId,
        status,
      },
      include: {
        bankAccount: {
          include: {
            bank: true,
          },
        },
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
        bankAccount: {
          include: {
            bank: true,
          },
        },
      },
      orderBy: { transactionDate: "desc" },
    })
  }

  private generateTransactionHash(data: {
    bankAccountId: string
    transactionDate: Date
    description: string
    amount: number
    balance: number
    operationNumber?: string
    operationTime?: string
    utc?: string
  }): string {
    const hashString = `${data.bankAccountId}-${data.transactionDate.toISOString()}-${data.description}-${data.amount}-${data.balance}-${data.operationNumber || ""}-${data.operationTime || ""}-${data.utc || ""}`

    console.log("🔧 DEBUG - Hash String:", hashString)

    const hash = createHash("sha256").update(hashString).digest("hex")
    return hash
  }
}
