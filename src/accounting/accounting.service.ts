import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateAccountingAccountDto } from "./dto/create-accounting-account.dto"
import { UpdateAccountingAccountDto } from "./dto/update-accounting-account.dto"
import { CreateCostCenterDto } from "./dto/create-cost-center.dto"
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { AccountingAccount, CostCenter } from "@prisma/client"

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // ACCOUNTING ACCOUNTS METHODS
  // ============================================================================

  async fetchAccountingAccounts(
    companyId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<AccountingAccount>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = { companyId }

    const [accounts, total] = await Promise.all([
      this.prisma.accountingAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { accountCode: "asc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          parentAccount: {
            select: { id: true, accountCode: true, accountName: true },
          },
          childAccounts: {
            select: { id: true, accountCode: true, accountName: true, level: true },
            orderBy: { accountCode: "asc" },
          },
          _count: {
            select: {
              childAccounts: true,
              documentAccountLinks: true,
              documentLineAccountLinks: true,
              conciliationExpenses: true,
            },
          },
        },
      }),
      this.prisma.accountingAccount.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: accounts,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createAccountingAccount(createAccountingAccountDto: CreateAccountingAccountDto): Promise<AccountingAccount> {
    const { companyId, parentAccountId, ...accountData } = createAccountingAccountDto

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    // Check if account code already exists for this company
    const existingAccount = await this.prisma.accountingAccount.findUnique({
      where: {
        companyId_accountCode: {
          companyId,
          accountCode: accountData.accountCode,
        },
      },
    })

    if (existingAccount) {
      throw new ConflictException(`Account with code ${accountData.accountCode} already exists for this company`)
    }

    // Verify parent account exists and calculate level
    let level = 1
    if (parentAccountId) {
      const parentAccount = await this.prisma.accountingAccount.findFirst({
        where: {
          id: parentAccountId,
          companyId,
        },
      })

      if (!parentAccount) {
        throw new NotFoundException(`Parent account with ID ${parentAccountId} not found for this company`)
      }

      level = parentAccount.level + 1
    }

    const account = await this.prisma.accountingAccount.create({
      data: {
        ...accountData,
        companyId,
        parentAccountId,
        level,
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        parentAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        childAccounts: {
          select: { id: true, accountCode: true, accountName: true, level: true },
        },
      },
    })

    return account
  }

  async getAccountingAccountById(id: string): Promise<AccountingAccount> {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        parentAccount: {
          select: { id: true, accountCode: true, accountName: true, level: true },
        },
        childAccounts: {
          select: { id: true, accountCode: true, accountName: true, level: true },
          orderBy: { accountCode: "asc" },
        },
        _count: {
          select: {
            childAccounts: true,
            documentAccountLinks: true,
            documentLineAccountLinks: true,
            conciliationExpenses: true,
          },
        },
      },
    })

    if (!account) {
      throw new NotFoundException(`Accounting account with ID ${id} not found`)
    }

    return account
  }

  async updateAccountingAccount(
    id: string,
    updateAccountingAccountDto: UpdateAccountingAccountDto,
  ): Promise<AccountingAccount> {
    const existingAccount = await this.prisma.accountingAccount.findUnique({
      where: { id },
    })

    if (!existingAccount) {
      throw new NotFoundException(`Accounting account with ID ${id} not found`)
    }

    // Check for account code conflicts if being updated
    if (
      updateAccountingAccountDto.accountCode &&
      updateAccountingAccountDto.accountCode !== existingAccount.accountCode
    ) {
      const conflictingAccount = await this.prisma.accountingAccount.findUnique({
        where: {
          companyId_accountCode: {
            companyId: existingAccount.companyId,
            accountCode: updateAccountingAccountDto.accountCode,
          },
        },
      })

      if (conflictingAccount) {
        throw new ConflictException(
          `Account with code ${updateAccountingAccountDto.accountCode} already exists for this company`,
        )
      }
    }

    // Handle parent account change and level recalculation
    let level = existingAccount.level
    if (updateAccountingAccountDto.parentAccountId !== undefined) {
      if (updateAccountingAccountDto.parentAccountId) {
        // Prevent circular references
        if (updateAccountingAccountDto.parentAccountId === id) {
          throw new BadRequestException("Account cannot be its own parent")
        }

        const parentAccount = await this.prisma.accountingAccount.findFirst({
          where: {
            id: updateAccountingAccountDto.parentAccountId,
            companyId: existingAccount.companyId,
          },
        })

        if (!parentAccount) {
          throw new NotFoundException(`Parent account with ID ${updateAccountingAccountDto.parentAccountId} not found`)
        }

        level = parentAccount.level + 1
      } else {
        level = 1 // Root level
      }
    }

    const account = await this.prisma.accountingAccount.update({
      where: { id },
      data: {
        ...updateAccountingAccountDto,
        level,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        parentAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        childAccounts: {
          select: { id: true, accountCode: true, accountName: true, level: true },
        },
      },
    })

    return account
  }

  async deleteAccountingAccount(id: string): Promise<void> {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            childAccounts: true,
            documentAccountLinks: true,
            documentLineAccountLinks: true,
            conciliationExpenses: true,
          },
        },
      },
    })

    if (!account) {
      throw new NotFoundException(`Accounting account with ID ${id} not found`)
    }

    // Check if account has child accounts or is being used
    const hasRelatedRecords =
      account._count.childAccounts > 0 ||
      account._count.documentAccountLinks > 0 ||
      account._count.documentLineAccountLinks > 0 ||
      account._count.conciliationExpenses > 0

    if (hasRelatedRecords) {
      throw new BadRequestException(
        "Cannot delete account with child accounts or existing transactions. Consider deactivating instead.",
      )
    }

    await this.prisma.accountingAccount.delete({
      where: { id },
    })
  }

  async getAccountingAccountHierarchy(companyId: string): Promise<AccountingAccount[]> {
    return this.prisma.accountingAccount.findMany({
      where: { companyId, isActive: true },
      orderBy: { accountCode: "asc" },
      include: {
        childAccounts: {
          where: { isActive: true },
          orderBy: { accountCode: "asc" },
          include: {
            childAccounts: {
              where: { isActive: true },
              orderBy: { accountCode: "asc" },
            },
          },
        },
      },
    })
  }

  async searchAccountingAccounts(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<AccountingAccount>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.AccountingAccountWhereInput = {
      companyId,
      OR: [
        { accountCode: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { accountName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { accountType: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    }

    const [accounts, total] = await Promise.all([
      this.prisma.accountingAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { accountCode: "asc" },
        include: {
          parentAccount: {
            select: { id: true, accountCode: true, accountName: true },
          },
        },
      }),
      this.prisma.accountingAccount.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: accounts,
      total,
      page,
      limit,
      totalPages,
    }
  }

  // ============================================================================
  // COST CENTERS METHODS
  // ============================================================================

  async fetchCostCenters(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<CostCenter>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = { companyId }

    const [costCenters, total] = await Promise.all([
      this.prisma.costCenter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          parentCostCenter: {
            select: { id: true, code: true, name: true },
          },
          childCostCenters: {
            select: { id: true, code: true, name: true, level: true },
            orderBy: { code: "asc" },
          },
          _count: {
            select: {
              childCostCenters: true,
              documentCostCenterLinks: true,
              documentLineCostCenterLinks: true,
            },
          },
        },
      }),
      this.prisma.costCenter.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: costCenters,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createCostCenter(createCostCenterDto: CreateCostCenterDto): Promise<CostCenter> {
    const { companyId, parentCostCenterId, ...costCenterData } = createCostCenterDto

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    // Check if cost center code already exists for this company
    const existingCostCenter = await this.prisma.costCenter.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: costCenterData.code,
        },
      },
    })

    if (existingCostCenter) {
      throw new ConflictException(`Cost center with code ${costCenterData.code} already exists for this company`)
    }

    // Verify parent cost center exists and calculate level
    let level = 1
    if (parentCostCenterId) {
      const parentCostCenter = await this.prisma.costCenter.findFirst({
        where: {
          id: parentCostCenterId,
          companyId,
        },
      })

      if (!parentCostCenter) {
        throw new NotFoundException(`Parent cost center with ID ${parentCostCenterId} not found for this company`)
      }

      level = parentCostCenter.level + 1
    }

    const costCenter = await this.prisma.costCenter.create({
      data: {
        ...costCenterData,
        companyId,
        parentCostCenterId,
        level,
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        parentCostCenter: {
          select: { id: true, code: true, name: true },
        },
        childCostCenters: {
          select: { id: true, code: true, name: true, level: true },
        },
      },
    })

    return costCenter
  }

  async getCostCenterById(id: string): Promise<CostCenter> {
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        parentCostCenter: {
          select: { id: true, code: true, name: true, level: true },
        },
        childCostCenters: {
          select: { id: true, code: true, name: true, level: true },
          orderBy: { code: "asc" },
        },
        _count: {
          select: {
            childCostCenters: true,
            documentCostCenterLinks: true,
            documentLineCostCenterLinks: true,
          },
        },
      },
    })

    if (!costCenter) {
      throw new NotFoundException(`Cost center with ID ${id} not found`)
    }

    return costCenter
  }

  async updateCostCenter(id: string, updateCostCenterDto: UpdateCostCenterDto): Promise<CostCenter> {
    const existingCostCenter = await this.prisma.costCenter.findUnique({
      where: { id },
    })

    if (!existingCostCenter) {
      throw new NotFoundException(`Cost center with ID ${id} not found`)
    }

    // Check for code conflicts if being updated
    if (updateCostCenterDto.code && updateCostCenterDto.code !== existingCostCenter.code) {
      const conflictingCostCenter = await this.prisma.costCenter.findUnique({
        where: {
          companyId_code: {
            companyId: existingCostCenter.companyId,
            code: updateCostCenterDto.code,
          },
        },
      })

      if (conflictingCostCenter) {
        throw new ConflictException(`Cost center with code ${updateCostCenterDto.code} already exists for this company`)
      }
    }

    // Handle parent cost center change and level recalculation
    let level = existingCostCenter.level
    if (updateCostCenterDto.parentCostCenterId !== undefined) {
      if (updateCostCenterDto.parentCostCenterId) {
        // Prevent circular references
        if (updateCostCenterDto.parentCostCenterId === id) {
          throw new BadRequestException("Cost center cannot be its own parent")
        }

        const parentCostCenter = await this.prisma.costCenter.findFirst({
          where: {
            id: updateCostCenterDto.parentCostCenterId,
            companyId: existingCostCenter.companyId,
          },
        })

        if (!parentCostCenter) {
          throw new NotFoundException(`Parent cost center with ID ${updateCostCenterDto.parentCostCenterId} not found`)
        }

        level = parentCostCenter.level + 1
      } else {
        level = 1 // Root level
      }
    }

    const costCenter = await this.prisma.costCenter.update({
      where: { id },
      data: {
        ...updateCostCenterDto,
        level,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        parentCostCenter: {
          select: { id: true, code: true, name: true },
        },
        childCostCenters: {
          select: { id: true, code: true, name: true, level: true },
        },
      },
    })

    return costCenter
  }

  async deleteCostCenter(id: string): Promise<void> {
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            childCostCenters: true,
            documentCostCenterLinks: true,
            documentLineCostCenterLinks: true,
          },
        },
      },
    })

    if (!costCenter) {
      throw new NotFoundException(`Cost center with ID ${id} not found`)
    }

    // Check if cost center has child cost centers or is being used
    const hasRelatedRecords =
      costCenter._count.childCostCenters > 0 ||
      costCenter._count.documentCostCenterLinks > 0 ||
      costCenter._count.documentLineCostCenterLinks > 0

    if (hasRelatedRecords) {
      throw new BadRequestException(
        "Cannot delete cost center with child cost centers or existing transactions. Consider deactivating instead.",
      )
    }

    await this.prisma.costCenter.delete({
      where: { id },
    })
  }

  async getCostCenterHierarchy(companyId: string): Promise<CostCenter[]> {
    return this.prisma.costCenter.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: "asc" },
      include: {
        childCostCenters: {
          where: { isActive: true },
          orderBy: { code: "asc" },
          include: {
            childCostCenters: {
              where: { isActive: true },
              orderBy: { code: "asc" },
            },
          },
        },
      },
    })
  }

  async searchCostCenters(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<CostCenter>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.CostCenterWhereInput = {
      companyId,
      OR: [
        { code: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    }

    const [costCenters, total] = await Promise.all([
      this.prisma.costCenter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
        include: {
          parentCostCenter: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.costCenter.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: costCenters,
      total,
      page,
      limit,
      totalPages,
    }
  }
}
