import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateBankDto } from "./dto/create-bank.dto"
import { UpdateBankDto } from "./dto/update-bank.dto"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { Bank } from "@prisma/client"

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  async fetchBanks(paginationDto: PaginationDto): Promise<PaginatedResponse<Bank>> {
    const { page = 1, limit = 10 } = paginationDto
    const skip = (page - 1) * limit

    const [banks, total] = await Promise.all([
      this.prisma.bank.findMany({
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              bankAccounts: true,
              supplierBankAccounts: true,
            },
          },
        },
      }),
      this.prisma.bank.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: banks,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createBank(createBankDto: CreateBankDto): Promise<Bank> {
    try {
      return await this.prisma.bank.create({
        data: {
          ...createBankDto,
          country: createBankDto.country || "PE",
        },
      })
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException("Bank code already exists")
      }
      throw error
    }
  }

  async getBankById(id: string): Promise<Bank> {
    const bank = await this.prisma.bank.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bankAccounts: true,
            supplierBankAccounts: true,
          },
        },
      },
    })

    if (!bank) {
      throw new NotFoundException(`Bank with ID ${id} not found`)
    }

    return bank
  }

  async getBankByCode(code: string): Promise<Bank> {
    const bank = await this.prisma.bank.findUnique({
      where: { code },
    })

    if (!bank) {
      throw new NotFoundException(`Bank with code ${code} not found`)
    }

    return bank
  }

  async updateBank(id: string, updateBankDto: UpdateBankDto): Promise<Bank> {
    await this.getBankById(id) // Verify bank exists

    try {
      return await this.prisma.bank.update({
        where: { id },
        data: updateBankDto,
      })
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException("Bank code already exists")
      }
      throw error
    }
  }

  async deleteBank(id: string): Promise<void> {
    const bank = await this.getBankById(id)

    // Check if bank has associated accounts
    const accountCount = await this.prisma.bankAccount.count({
      where: { bankId: id },
    })

    if (accountCount > 0) {
      throw new ConflictException("Cannot delete bank with associated bank accounts")
    }

    const supplierAccountCount = await this.prisma.supplierBankAccount.count({
      where: { bankId: id },
    })

    if (supplierAccountCount > 0) {
      throw new ConflictException("Cannot delete bank with associated supplier bank accounts")
    }

    await this.prisma.bank.delete({
      where: { id },
    })
  }

  async toggleBankStatus(id: string): Promise<Bank> {
    const bank = await this.getBankById(id)

    return await this.prisma.bank.update({
      where: { id },
      data: { isActive: !bank.isActive },
    })
  }

  async getActiveBanks(): Promise<Bank[]> {
    return await this.prisma.bank.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
  }

  async searchBanks(searchTerm: string, pagination: PaginationDto): Promise<PaginatedResponse<Bank>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" as const } },
        { code: { contains: searchTerm, mode: "insensitive" as const } },
      ],
    }

    const [banks, total] = await Promise.all([
      this.prisma.bank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              bankAccounts: true,
              supplierBankAccounts: true,
            },
          },
        },
      }),
      this.prisma.bank.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: banks,
      total,
      page,
      limit,
      totalPages,
    }
  }
}
