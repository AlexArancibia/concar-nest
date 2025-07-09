import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateSupplierDto } from "./dto/create-supplier.dto"
import { UpdateSupplierDto } from "./dto/update-supplier.dto"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { Supplier, SupplierStatus, SupplierType } from "@prisma/client"

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchSuppliers(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      companyId,
    }

    // Execute queries in parallel
    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          supplierBankAccounts: {
            where: { isActive: true },
            include: {
              bank: { select: { name: true, code: true } },
              currencyRef: { select: { code: true, name: true, symbol: true } },
            },
          },
          _count: {
            select: {
              documents: true,
              expenses: true,
            },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createSupplier(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const { companyId, documentNumber, supplierBankAccounts, ...supplierData } = createSupplierDto

    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    // Check if supplier with same document number already exists for this company
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: {
        companyId_documentNumber: {
          companyId,
          documentNumber,
        },
      },
    })

    if (existingSupplier) {
      throw new ConflictException(`Supplier with document number ${documentNumber} already exists for this company`)
    }

    // Create supplier with bank accounts if provided
    const supplier = await this.prisma.supplier.create({
      data: {
        ...supplierData,
        companyId,
        documentNumber,
        ...(supplierBankAccounts && {
          supplierBankAccounts: {
            create: supplierBankAccounts.map((account) => ({
              bankId: account.bankId,
              accountNumber: account.accountNumber,
              accountType: account.accountType,
              currency: account.currency,
              isDefault: account.isDefault || false,
            })),
          },
        }),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        supplierBankAccounts: {
          include: {
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
      },
    })

    return supplier
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        supplierBankAccounts: {
          where: { isActive: true },
          include: {
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
        documents: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            documentType: true,
            fullNumber: true,
            total: true,
            currency: true,
            status: true,
            issueDate: true,
          },
        },
        _count: {
          select: {
            documents: true,
            expenses: true,
          },
        },
      },
    })

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }

    return supplier
  }

  async updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
  const { supplierBankAccounts, ...supplierData } = updateSupplierDto;

  // Check if supplier exists
  const existingSupplier = await this.prisma.supplier.findUnique({
    where: { id },
    include: {
      supplierBankAccounts: true,
    },
  });

  if (!existingSupplier) {
    throw new NotFoundException(`Supplier with ID ${id} not found`);
  }

  // If document number is being updated, check for conflicts
  if (supplierData.documentNumber && supplierData.documentNumber !== existingSupplier.documentNumber) {
    const conflictingSupplier = await this.prisma.supplier.findUnique({
      where: {
        companyId_documentNumber: {
          companyId: existingSupplier.companyId,
          documentNumber: supplierData.documentNumber,
        },
      },
    });

    if (conflictingSupplier) {
      throw new ConflictException(
        `Supplier with document number ${supplierData.documentNumber} already exists for this company`,
      );
    }
  }

  // Start transaction for atomic operations
  const supplier = await this.prisma.$transaction(async (prisma) => {
    // Update supplier basic data
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...supplierData,
        updatedAt: new Date(),
      },
    });

    // Handle bank accounts if they are provided
    if (supplierBankAccounts) {
      // First, delete all existing bank accounts (or you can implement a more sophisticated sync)
      await prisma.supplierBankAccount.deleteMany({
        where: { supplierId: id },
      });

      // Then create the new ones
      for (const account of supplierBankAccounts) {
        await prisma.supplierBankAccount.create({
          data: {
            ...account,
            supplierId: id,
          },
        });
      }
    }

    // Return the updated supplier with all relations
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        supplierBankAccounts: {
          include: {
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
      },
    });
  });

  return supplier;
}

  async deleteSupplier(id: string): Promise<void> {
    // Check if supplier exists
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true,
            expenses: true,
          },
        },
      },
    })

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }

    // Check if supplier has related records
    const hasRelatedRecords =
      supplier._count.documents > 0  || supplier._count.expenses > 0

    if (hasRelatedRecords) {
      throw new BadRequestException(
        "Cannot delete supplier with existing documents, transactions, or expenses. Consider deactivating instead.",
      )
    }

    // Delete supplier and related bank accounts (cascade will handle this)
    await this.prisma.supplier.delete({
      where: { id },
    })
  }

  async getSupplierByDocument(companyId: string, documentNumber: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: {
        companyId_documentNumber: {
          companyId,
          documentNumber,
        },
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        supplierBankAccounts: {
          where: { isActive: true },
          include: {
            bank: { select: { name: true, code: true } },
            currencyRef: { select: { code: true, name: true, symbol: true } },
          },
        },
      },
    })

    if (!supplier) {
      throw new NotFoundException(`Supplier with document number ${documentNumber} not found for company ${companyId}`)
    }

    return supplier
  }

  // Additional utility methods
  async getSuppliersByStatus(companyId: string, status: SupplierStatus): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      where: {
        companyId,
        status,
      },
      orderBy: { businessName: "asc" },
    })
  }

  async updateSupplierStatus(id: string, status: SupplierStatus): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    })

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })
  }

  async getSupplierStats(companyId: string) {
    const stats = await this.prisma.supplier.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { status: true },
    })

    const totalSuppliers = await this.prisma.supplier.count({
      where: { companyId },
    })

    return {
      total: totalSuppliers,
      byStatus: stats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.status
          return acc
        },
        {} as Record<SupplierStatus, number>,
      ),
    }
  }

  async searchSuppliers(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.SupplierWhereInput = {
      companyId,
      OR: [
        { businessName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { tradeName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { documentNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          supplierBankAccounts: {
            where: { isActive: true },
            include: {
              bank: { select: { name: true, code: true } },
              currencyRef: { select: { code: true, name: true, symbol: true } },
            },
          },
          _count: {
            select: {
              documents: true,
              expenses: true,
            },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async getSuppliersByStatusPaginated(
    companyId: string,
    status: SupplierStatus,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = {
      companyId,
      status,
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { businessName: "asc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          supplierBankAccounts: {
            where: { isActive: true },
            include: {
              bank: { select: { name: true, code: true } },
              currencyRef: { select: { code: true, name: true, symbol: true } },
            },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async getSuppliersByTypePaginated(
    companyId: string,
    supplierType: SupplierType,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = {
      companyId,
      supplierType,
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { businessName: "asc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          supplierBankAccounts: {
            where: { isActive: true },
            include: {
              bank: { select: { name: true, code: true } },
              currencyRef: { select: { code: true, name: true, symbol: true } },
            },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages,
    }
  }
}
