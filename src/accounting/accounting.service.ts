import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAccountingAccountDto } from "./dto/create-accounting-account.dto";
import { UpdateAccountingAccountDto } from "./dto/update-accounting-account.dto";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { AccountingAccount, CostCenter } from "@prisma/client";

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // ACCOUNTING ACCOUNTS METHODS
  // ============================================================================

  async fetchAccountingAccounts(
    companyId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<AccountingAccount>> {
    this.logger.log(`Fetching accounting accounts for company ${companyId} with pagination: ${JSON.stringify(pagination)}`);
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const where = { companyId };

    try {
      const [accounts, total] = await this.prisma.$transaction([
        this.prisma.accountingAccount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { accountCode: "asc" },
          include: {
            company: { select: { id: true, name: true, ruc: true } },
            parentAccount: { select: { id: true, accountCode: true, accountName: true } },
            childAccounts: { select: { id: true, accountCode: true, accountName: true, level: true }, orderBy: { accountCode: "asc" } },
            _count: { select: { childAccounts: true, documentAccountLinks: true, documentLineAccountLinks: true, conciliationExpenses: true } },
          },
        }),
        this.prisma.accountingAccount.count({ where }),
      ]);
      this.logger.log(`Found ${total} accounting accounts for company ${companyId}`);
      return { data: accounts, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      this.logger.error(`Error fetching accounting accounts for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to fetch accounting accounts.");
    }
  }

  async createAccountingAccount(createAccountingAccountDto: CreateAccountingAccountDto): Promise<AccountingAccount> {
    const { companyId, parentAccountId, ...accountData } = createAccountingAccountDto;
    this.logger.log(`Creating accounting account ${accountData.accountCode} for company ${companyId}`);

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      this.logger.warn(`Company not found: ${companyId}`);
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const existingAccount = await this.prisma.accountingAccount.findUnique({
      where: { companyId_accountCode: { companyId, accountCode: accountData.accountCode } },
    });
    if (existingAccount) {
      this.logger.warn(`Accounting account code ${accountData.accountCode} already exists for company ${companyId}`);
      throw new ConflictException(`Account with code ${accountData.accountCode} already exists for this company`);
    }

    let level = 1;
    if (parentAccountId) {
      const parentAccount = await this.prisma.accountingAccount.findFirst({ where: { id: parentAccountId, companyId } });
      if (!parentAccount) {
        this.logger.warn(`Parent accounting account not found: ${parentAccountId} for company ${companyId}`);
        throw new NotFoundException(`Parent account with ID ${parentAccountId} not found for this company`);
      }
      level = parentAccount.level + 1;
    }

    try {
      const account = await this.prisma.accountingAccount.create({
        data: { ...accountData, companyId, parentAccountId, level },
        include: {
          company: { select: { id: true, name: true, ruc: true } },
          parentAccount: { select: { id: true, accountCode: true, accountName: true } },
          childAccounts: { select: { id: true, accountCode: true, accountName: true, level: true } },
        },
      });
      this.logger.log(`Accounting account ${account.accountCode} created successfully with ID ${account.id}`);
      return account;
    } catch (error) {
      this.logger.error(`Error creating accounting account ${accountData.accountCode} for company ${companyId}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException("A database conflict occurred. This account code might already exist.");
      }
      throw new InternalServerErrorException("Failed to create accounting account.");
    }
  }

  async getAccountingAccountById(id: string): Promise<AccountingAccount> {
    this.logger.log(`Fetching accounting account by ID: ${id}`);
    const account = await this.prisma.accountingAccount.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, ruc: true } },
        parentAccount: { select: { id: true, accountCode: true, accountName: true, level: true } },
        childAccounts: { select: { id: true, accountCode: true, accountName: true, level: true }, orderBy: { accountCode: "asc" } },
        _count: { select: { childAccounts: true, documentAccountLinks: true, documentLineAccountLinks: true, conciliationExpenses: true } },
      },
    });
    if (!account) {
      this.logger.warn(`Accounting account not found: ${id}`);
      throw new NotFoundException(`Accounting account with ID ${id} not found`);
    }
    return account;
  }

  async updateAccountingAccount(
    id: string,
    updateAccountingAccountDto: UpdateAccountingAccountDto,
  ): Promise<AccountingAccount> {
    this.logger.log(`Updating accounting account: ${id}`);
    const existingAccount = await this.prisma.accountingAccount.findUnique({ where: { id } });
    if (!existingAccount) {
      this.logger.warn(`Accounting account not found for update: ${id}`);
      throw new NotFoundException(`Accounting account with ID ${id} not found`);
    }

    if (updateAccountingAccountDto.accountCode && updateAccountingAccountDto.accountCode !== existingAccount.accountCode) {
      const conflictingAccount = await this.prisma.accountingAccount.findUnique({
        where: { companyId_accountCode: { companyId: existingAccount.companyId, accountCode: updateAccountingAccountDto.accountCode } },
      });
      if (conflictingAccount) {
        this.logger.warn(`Conflict: Account code ${updateAccountingAccountDto.accountCode} already exists for company ${existingAccount.companyId}`);
        throw new ConflictException(`Account with code ${updateAccountingAccountDto.accountCode} already exists for this company`);
      }
    }

    let level = existingAccount.level;
    if (updateAccountingAccountDto.parentAccountId !== undefined) {
      if (updateAccountingAccountDto.parentAccountId) {
        if (updateAccountingAccountDto.parentAccountId === id) {
          throw new BadRequestException("Account cannot be its own parent");
        }
        const parentAccount = await this.prisma.accountingAccount.findFirst({
          where: { id: updateAccountingAccountDto.parentAccountId, companyId: existingAccount.companyId },
        });
        if (!parentAccount) {
          throw new NotFoundException(`Parent account with ID ${updateAccountingAccountDto.parentAccountId} not found`);
        }
        level = parentAccount.level + 1;
      } else {
        level = 1;
      }
    }

    try {
      const account = await this.prisma.accountingAccount.update({
        where: { id },
        data: { ...updateAccountingAccountDto, level, updatedAt: new Date() },
        include: {
          company: { select: { id: true, name: true, ruc: true } },
          parentAccount: { select: { id: true, accountCode: true, accountName: true } },
          childAccounts: { select: { id: true, accountCode: true, accountName: true, level: true } },
        },
      });
      this.logger.log(`Accounting account ${id} updated successfully.`);
      return account;
    } catch (error) {
      this.logger.error(`Error updating accounting account ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Accounting account with ID ${id} not found during update.`);
      }
      throw new InternalServerErrorException("Failed to update accounting account.");
    }
  }

  async deleteAccountingAccount(id: string): Promise<void> {
    this.logger.log(`Attempting to delete accounting account: ${id}`);
    const account = await this.prisma.accountingAccount.findUnique({
      where: { id },
      include: { _count: { select: { childAccounts: true, documentAccountLinks: true, documentLineAccountLinks: true, conciliationExpenses: true } } },
    });
    if (!account) {
      this.logger.warn(`Accounting account not found for deletion: ${id}`);
      throw new NotFoundException(`Accounting account with ID ${id} not found`);
    }

    const hasRelatedRecords =
      account._count.childAccounts > 0 ||
      account._count.documentAccountLinks > 0 ||
      account._count.documentLineAccountLinks > 0 ||
      account._count.conciliationExpenses > 0;
    if (hasRelatedRecords) {
      this.logger.warn(`Attempt to delete accounting account ${id} with related records.`);
      throw new BadRequestException("Cannot delete account with child accounts or existing transactions. Consider deactivating instead.");
    }

    try {
      await this.prisma.accountingAccount.delete({ where: { id } });
      this.logger.log(`Accounting account ${id} deleted successfully.`);
    } catch (error) {
      this.logger.error(`Error deleting accounting account ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Accounting account with ID ${id} not found during deletion.`);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(`Cannot delete account ${id} due to existing related records (foreign key constraint).`);
      }
      throw new InternalServerErrorException("Failed to delete accounting account.");
    }
  }

  async getAccountingAccountHierarchy(companyId: string): Promise<AccountingAccount[]> {
    this.logger.log(`Fetching accounting account hierarchy for company ${companyId}`);
    try {
      return await this.prisma.accountingAccount.findMany({
        where: { companyId, isActive: true },
        orderBy: { accountCode: "asc" },
        include: {
          childAccounts: {
            where: { isActive: true },
            orderBy: { accountCode: "asc" },
            include: { childAccounts: { where: { isActive: true }, orderBy: { accountCode: "asc" } } },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching accounting account hierarchy for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to fetch accounting account hierarchy.");
    }
  }

  async searchAccountingAccounts(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<AccountingAccount>> {
    this.logger.log(`Searching accounting accounts for company ${companyId} with term "${searchTerm}"`);
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const where: Prisma.AccountingAccountWhereInput = {
      companyId,
      OR: [
        { accountCode: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { accountName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { accountType: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    };

    try {
      const [accounts, total] = await this.prisma.$transaction([
        this.prisma.accountingAccount.findMany({
          where, skip, take: limit, orderBy: { accountCode: "asc" },
          include: { parentAccount: { select: { id: true, accountCode: true, accountName: true } } },
        }),
        this.prisma.accountingAccount.count({ where }),
      ]);
      this.logger.log(`Found ${total} accounting accounts matching search term "${searchTerm}" for company ${companyId}`);
      return { data: accounts, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      this.logger.error(`Error searching accounting accounts for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to search accounting accounts.");
    }
  }

  // ============================================================================
  // COST CENTERS METHODS
  // ============================================================================

  async fetchCostCenters(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<CostCenter>> {
    this.logger.log(`Fetching cost centers for company ${companyId} with pagination: ${JSON.stringify(pagination)}`);
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const where = { companyId };

    try {
      const [costCenters, total] = await this.prisma.$transaction([
        this.prisma.costCenter.findMany({
          where, skip, take: limit, orderBy: { code: "asc" },
          include: {
            company: { select: { id: true, name: true, ruc: true } },
            parentCostCenter: { select: { id: true, code: true, name: true } },
            childCostCenters: { select: { id: true, code: true, name: true, level: true }, orderBy: { code: "asc" } },
            _count: { select: { childCostCenters: true, documentCostCenterLinks: true, documentLineCostCenterLinks: true } },
          },
        }),
        this.prisma.costCenter.count({ where }),
      ]);
      this.logger.log(`Found ${total} cost centers for company ${companyId}`);
      return { data: costCenters, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      this.logger.error(`Error fetching cost centers for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to fetch cost centers.");
    }
  }

  async createCostCenter(createCostCenterDto: CreateCostCenterDto): Promise<CostCenter> {
    const { companyId, parentCostCenterId, ...costCenterData } = createCostCenterDto;
    this.logger.log(`Creating cost center ${costCenterData.code} for company ${companyId}`);

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      this.logger.warn(`Company not found: ${companyId}`);
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const existingCostCenter = await this.prisma.costCenter.findUnique({
      where: { companyId_code: { companyId, code: costCenterData.code } },
    });
    if (existingCostCenter) {
      this.logger.warn(`Cost center code ${costCenterData.code} already exists for company ${companyId}`);
      throw new ConflictException(`Cost center with code ${costCenterData.code} already exists for this company`);
    }

    let level = 1;
    if (parentCostCenterId) {
      const parentCostCenter = await this.prisma.costCenter.findFirst({ where: { id: parentCostCenterId, companyId } });
      if (!parentCostCenter) {
        this.logger.warn(`Parent cost center not found: ${parentCostCenterId} for company ${companyId}`);
        throw new NotFoundException(`Parent cost center with ID ${parentCostCenterId} not found for this company`);
      }
      level = parentCostCenter.level + 1;
    }

    try {
      const costCenter = await this.prisma.costCenter.create({
        data: { ...costCenterData, companyId, parentCostCenterId, level },
        include: {
          company: { select: { id: true, name: true, ruc: true } },
          parentCostCenter: { select: { id: true, code: true, name: true } },
          childCostCenters: { select: { id: true, code: true, name: true, level: true } },
        },
      });
      this.logger.log(`Cost center ${costCenter.code} created successfully with ID ${costCenter.id}`);
      return costCenter;
    } catch (error) {
      this.logger.error(`Error creating cost center ${costCenterData.code} for company ${companyId}: ${error.message}`, error.stack);
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException("A database conflict occurred. This cost center code might already exist.");
      }
      throw new InternalServerErrorException("Failed to create cost center.");
    }
  }

  async getCostCenterById(id: string): Promise<CostCenter> {
    this.logger.log(`Fetching cost center by ID: ${id}`);
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, ruc: true } },
        parentCostCenter: { select: { id: true, code: true, name: true, level: true } },
        childCostCenters: { select: { id: true, code: true, name: true, level: true }, orderBy: { code: "asc" } },
        _count: { select: { childCostCenters: true, documentCostCenterLinks: true, documentLineCostCenterLinks: true } },
      },
    });
    if (!costCenter) {
      this.logger.warn(`Cost center not found: ${id}`);
      throw new NotFoundException(`Cost center with ID ${id} not found`);
    }
    return costCenter;
  }

  async updateCostCenter(id: string, updateCostCenterDto: UpdateCostCenterDto): Promise<CostCenter> {
    this.logger.log(`Updating cost center: ${id}`);
    const existingCostCenter = await this.prisma.costCenter.findUnique({ where: { id } });
    if (!existingCostCenter) {
      this.logger.warn(`Cost center not found for update: ${id}`);
      throw new NotFoundException(`Cost center with ID ${id} not found`);
    }

    if (updateCostCenterDto.code && updateCostCenterDto.code !== existingCostCenter.code) {
      const conflictingCostCenter = await this.prisma.costCenter.findUnique({
        where: { companyId_code: { companyId: existingCostCenter.companyId, code: updateCostCenterDto.code } },
      });
      if (conflictingCostCenter) {
        this.logger.warn(`Conflict: Cost center code ${updateCostCenterDto.code} already exists for company ${existingCostCenter.companyId}`);
        throw new ConflictException(`Cost center with code ${updateCostCenterDto.code} already exists for this company`);
      }
    }

    let level = existingCostCenter.level;
    if (updateCostCenterDto.parentCostCenterId !== undefined) {
      if (updateCostCenterDto.parentCostCenterId) {
        if (updateCostCenterDto.parentCostCenterId === id) {
          throw new BadRequestException("Cost center cannot be its own parent");
        }
        const parentCostCenter = await this.prisma.costCenter.findFirst({
          where: { id: updateCostCenterDto.parentCostCenterId, companyId: existingCostCenter.companyId },
        });
        if (!parentCostCenter) {
          throw new NotFoundException(`Parent cost center with ID ${updateCostCenterDto.parentCostCenterId} not found`);
        }
        level = parentCostCenter.level + 1;
      } else {
        level = 1;
      }
    }

    try {
      const costCenter = await this.prisma.costCenter.update({
        where: { id },
        data: { ...updateCostCenterDto, level, updatedAt: new Date() },
        include: {
          company: { select: { id: true, name: true, ruc: true } },
          parentCostCenter: { select: { id: true, code: true, name: true } },
          childCostCenters: { select: { id: true, code: true, name: true, level: true } },
        },
      });
      this.logger.log(`Cost center ${id} updated successfully.`);
      return costCenter;
    } catch (error) {
      this.logger.error(`Error updating cost center ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Cost center with ID ${id} not found during update.`);
      }
      throw new InternalServerErrorException("Failed to update cost center.");
    }
  }

  async deleteCostCenter(id: string): Promise<void> {
    this.logger.log(`Attempting to delete cost center: ${id}`);
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id },
      include: { _count: { select: { childCostCenters: true, documentCostCenterLinks: true, documentLineCostCenterLinks: true } } },
    });
    if (!costCenter) {
      this.logger.warn(`Cost center not found for deletion: ${id}`);
      throw new NotFoundException(`Cost center with ID ${id} not found`);
    }

    const hasRelatedRecords =
      costCenter._count.childCostCenters > 0 ||
      costCenter._count.documentCostCenterLinks > 0 ||
      costCenter._count.documentLineCostCenterLinks > 0;
    if (hasRelatedRecords) {
      this.logger.warn(`Attempt to delete cost center ${id} with related records.`);
      throw new BadRequestException("Cannot delete cost center with child cost centers or existing transactions. Consider deactivating instead.");
    }

    try {
      await this.prisma.costCenter.delete({ where: { id } });
      this.logger.log(`Cost center ${id} deleted successfully.`);
    } catch (error) {
      this.logger.error(`Error deleting cost center ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Cost center with ID ${id} not found during deletion.`);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
         throw new ConflictException(`Cannot delete cost center ${id} due to existing related records (foreign key constraint).`);
      }
      throw new InternalServerErrorException("Failed to delete cost center.");
    }
  }

  async getCostCenterHierarchy(companyId: string): Promise<CostCenter[]> {
    this.logger.log(`Fetching cost center hierarchy for company ${companyId}`);
    try {
      return await this.prisma.costCenter.findMany({
        where: { companyId, isActive: true },
        orderBy: { code: "asc" },
        include: {
          childCostCenters: {
            where: { isActive: true },
            orderBy: { code: "asc" },
            include: { childCostCenters: { where: { isActive: true }, orderBy: { code: "asc" } } },
          },
        },
      });
    } catch (error) {
        this.logger.error(`Error fetching cost center hierarchy for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch cost center hierarchy.");
    }
  }

  async searchCostCenters(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<CostCenter>> {
    this.logger.log(`Searching cost centers for company ${companyId} with term "${searchTerm}"`);
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const where: Prisma.CostCenterWhereInput = {
      companyId,
      OR: [
        { code: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    };

    try {
      const [costCenters, total] = await this.prisma.$transaction([
        this.prisma.costCenter.findMany({
          where, skip, take: limit, orderBy: { code: "asc" },
          include: { parentCostCenter: { select: { id: true, code: true, name: true } } },
        }),
        this.prisma.costCenter.count({ where }),
      ]);
      this.logger.log(`Found ${total} cost centers matching search term "${searchTerm}" for company ${companyId}`);
      return { data: costCenters, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      this.logger.error(`Error searching cost centers for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to search cost centers.");
    }
  }
}
