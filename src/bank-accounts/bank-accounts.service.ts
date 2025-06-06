import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { BankAccount } from "@prisma/client"

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async fetchBankAccounts(companyId: string, pagination?: PaginationDto): Promise<PaginatedResponse<BankAccount>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [bankAccounts, total] = await Promise.all([
      this.prisma.bankAccount.findMany({
        where: { companyId },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
        },
        orderBy: { bankName: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.bankAccount.count({ where: { companyId } }),
    ])

    return {
      data: bankAccounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createBankAccount(bankAccount: any): Promise<BankAccount> {
    return this.prisma.bankAccount.create({
      data: bankAccount,
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
      },
    })
  }

  async updateBankAccount(id: string, updates: any): Promise<BankAccount> {
    const existingBankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
    })

    if (!existingBankAccount) {
      throw new NotFoundException(`Bank account with ID ${id} not found`)
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
      },
    })
  }

  async deleteBankAccount(id: string): Promise<void> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
    })

    if (!bankAccount) {
      throw new NotFoundException(`Bank account with ID ${id} not found`)
    }

    await this.prisma.bankAccount.delete({
      where: { id },
    })
  }

  async getBankAccountById(id: string): Promise<BankAccount | undefined> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        transactions: {
          take: 10,
          orderBy: { transactionDate: "desc" },
        },
        expenses: {
          take: 10,
          orderBy: { transactionDate: "desc" },
        },
      },
    })

    return bankAccount || undefined
  }

  async getBankAccountsByCompany(companyId: string): Promise<BankAccount[]> {
    return this.prisma.bankAccount.findMany({
      where: { companyId, isActive: true },
      orderBy: { bankName: "asc" },
    })
  }
}
