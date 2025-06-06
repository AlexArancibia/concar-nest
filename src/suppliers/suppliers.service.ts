import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { Supplier } from "@prisma/client"

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async fetchSuppliers(companyId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { companyId },
        orderBy: { businessName: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where: { companyId } }),
    ])

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createSupplier(supplier: any): Promise<Supplier> {
    const supplierData = {
      ...supplier,
      bankAccounts: supplier.bankAccounts || null,
    }

    return this.prisma.supplier.create({
      data: supplierData,
    })
  }

  async updateSupplier(id: string, updates: any): Promise<Supplier> {
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    })

    if (!existingSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    })

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }

    await this.prisma.supplier.delete({
      where: { id },
    })
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        expenses: {
          orderBy: { transactionDate: "desc" },
          take: 10,
        },
      },
    })

    return supplier || undefined
  }

  async getSupplierByDocument(companyId: string, documentNumber: string): Promise<Supplier | null> {
    return this.prisma.supplier.findFirst({
      where: {
        companyId,
        documentNumber,
      },
    })
  }
}
