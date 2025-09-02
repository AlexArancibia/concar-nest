import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateTransactionDto } from "./dto/create-transaction.dto"
import { UpdateTransactionDto } from "./dto/update-transaction.dto"
import { TransactionQueryDto } from "./dto/transaction-query.dto"
import { Transaction, TransactionStatus, TransactionType, Prisma } from "@prisma/client"
import { createHash } from "crypto"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

 async fetchTransactions(
  companyId: string,
  transactionQueryDto: TransactionQueryDto
): Promise<PaginatedResponse<Transaction>> {
  const {
    page = 1,
    limit = 10,
    status,
    type,
    dateFrom,
    dateTo,
    search,
    bankAccountId,
    minAmount,
    maxAmount,
    reference,
    operationNumber,
    channel
  } = transactionQueryDto;

  const skip = (page - 1) * limit;
  const where: Prisma.TransactionWhereInput = { companyId };

  // Filtros directos
  if (status) where.status = status;
  if (type) where.transactionType = type;
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (reference) where.reference = { contains: reference, mode: 'insensitive' };
  if (operationNumber) where.operationNumber = operationNumber;
  if (channel) where.channel = channel;

  // Filtros de rango
  if (dateFrom || dateTo) {
    where.transactionDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) })
    };
  }

  if (minAmount || maxAmount) {
    where.amount = {
      ...(minAmount && { gte: new Prisma.Decimal(minAmount) }),
      ...(maxAmount && { lte: new Prisma.Decimal(maxAmount) })
    };
  }

  // Búsqueda textual global
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { operationNumber: { contains: search, mode: 'insensitive' } },
      { branch: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [transactions, total] = await Promise.all([
    this.prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        conciliations:true,
        bankAccount: {
          include: {
            bank: {
              select: {
                name: true,
                code: true,
              }
            },
            currencyRef: {
              select: {
                code: true,
                symbol: true,
              }
            }
          }
        }
      },
      orderBy: [
        { transactionDate: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    this.prisma.transaction.count({ where })
  ]);

  return {
    data: transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

  async createTransaction(createTransactionDto: CreateTransactionDto, userIdForAudit?: string): Promise<Transaction> {
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

    const transaction = await this.prisma.transaction.create({
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

    // Crear audit log
    try {
      await this.auditLogsService.createAuditLog({
        userId: userIdForAudit || "system",
        action: "CREATE",
        entity: "Transaction",
        entityId: transaction.id,
        description: `Transacción creada | ${transaction.transactionType} | ${description} | Fecha: ${new Date(transaction.transactionDate).toLocaleDateString()} | Monto: ${amount}`,
        companyId,
      })
    } catch (error) {
      console.error("Error creating audit log for transaction:", error)
    }

    return transaction
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

  async updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto, userIdForAudit?: string): Promise<Transaction> {
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

    const updatedTransaction = await this.prisma.transaction.update({
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

    // Crear audit log
    try {
      await this.auditLogsService.createAuditLog({
        userId: userIdForAudit || "system",
        action: "UPDATE",
        entity: "Transaction",
        entityId: existingTransaction.id,
        description: `Transacción actualizada | ${existingTransaction.description} (${existingTransaction.transactionType})`,
        oldValues: existingTransaction,
        newValues: updatedTransaction,
        companyId: existingTransaction.companyId,
      })
    } catch (error) {
      console.error("Error creating audit log for transaction update:", error)
    }

    return updatedTransaction
  }

  async deleteTransaction(id: string, userIdForAudit?: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        conciliations: true,
      },
    })

    if (!transaction) {
      throw new NotFoundException("Transaction not found")
    }

    // Verificar si tiene conciliaciones asociadas
    if (transaction.conciliations && transaction.conciliations.length > 0) {
      console.log(`Transaction ${id} has ${transaction.conciliations.length} associated conciliations. Deleting them first.`)
      
      // Eliminar en cascada todas las conciliaciones asociadas
      for (const conciliation of transaction.conciliations) {
        try {
          // Eliminar asientos contables asociados
          await this.prisma.accountingEntry.deleteMany({
            where: { conciliationId: conciliation.id }
          })

          // Eliminar items de conciliación
          await this.prisma.conciliationItem.deleteMany({
            where: { conciliationId: conciliation.id }
          })

          // Eliminar gastos de conciliación
          await this.prisma.conciliationExpense.deleteMany({
            where: { conciliationId: conciliation.id }
          })

          // Eliminar detracciones de conciliación (si existen)
          await this.prisma.documentDetraction.updateMany({
            where: { conciliationId: conciliation.id },
            data: { conciliationId: null }
          })

          // Finalmente, eliminar la conciliación
          await this.prisma.conciliation.delete({
            where: { id: conciliation.id },
          })

          console.log(`Conciliation ${conciliation.id} deleted successfully`)
        } catch (error) {
          console.error(`Error deleting conciliation ${conciliation.id}:`, error)
          throw new BadRequestException(`Error deleting associated conciliation: ${error.message}`)
        }
      }
    }

    // Crear audit log antes de eliminar
    try {
      await this.auditLogsService.createAuditLog({
        userId: userIdForAudit || "system",
        action: "DELETE",
        entity: "Transaction",
        entityId: transaction.id,
        description: `Transacción eliminada | ${transaction.transactionType} | ${transaction.description} | Fecha: ${new Date(transaction.transactionDate).toLocaleDateString()} | Monto: ${transaction.amount}`,
        oldValues: transaction,
        companyId: transaction.companyId,
      })
    } catch (error) {
      console.error("Error creating audit log for transaction deletion:", error)
    }

    // Ahora eliminar la transacción
    await this.prisma.transaction.delete({
      where: { id },
    })

    console.log(`Transaction ${id} deleted successfully with cascade deletion`)
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
