import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { BankAccount } from "@prisma/client"
import { CreateBankAccountDto } from "./dto/create-bank-account.dto"

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
        orderBy: { accountNumber: "asc" },
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

  async createBankAccount(createBankAccountDto: CreateBankAccountDto): Promise<BankAccount> {
    const {
      companyId,
      bankId,
      currency = "PEN",
      initialBalance = 0,
      currentBalance = 0,
      ...rest
    } = createBankAccountDto

    return this.prisma.bankAccount.create({
      data: {
        ...rest,
        initialBalance,
        currentBalance,
        company: {
          connect: { id: companyId },
        },
        bank: {
          connect: { id: bankId },
        },
        currencyRef: {
          connect: { code: currency },
        },
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bank: {
          select: { id: true, name: true, code: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })
  }

  async updateBankAccount(id: string, updateBankAccountDto: any): Promise<BankAccount> {
    const existingBankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
    })

    if (!existingBankAccount) {
      throw new NotFoundException(`Bank account with ID ${id} not found`)
    }

    const { companyId, bankId, currency, ...rest } = updateBankAccountDto

    const updateData: any = {
      ...rest,
      updatedAt: new Date(),
    }

    // Handle relations only if they are provided
    if (companyId) {
      updateData.company = { connect: { id: companyId } }
    }
    if (bankId) {
      updateData.bank = { connect: { id: bankId } }
    }
    if (currency) {
      updateData.currencyRef = { connect: { code: currency } }
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        bank: {
          select: { id: true, name: true, code: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
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
      orderBy: { accountNumber: "asc" },
    })
  }
}
