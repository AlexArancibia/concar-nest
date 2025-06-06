import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { Company } from "@prisma/client"

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async fetchCompanies(pagination?: PaginationDto): Promise<PaginatedResponse<Company>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.company.count(),
    ])

    return {
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createCompany(company: any): Promise<Company> {
    return this.prisma.company.create({
      data: company,
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    })
  }

  async updateCompany(id: string, updates: any): Promise<Company> {
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
    })

    if (!existingCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`)
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    })
  }

  async deleteCompany(id: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`)
    }

    await this.prisma.company.delete({
      where: { id },
    })
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        suppliers: {
          take: 10,
          orderBy: { businessName: "asc" },
        },
        bankAccounts: true,
        documents: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return company || undefined
  }

  async getCompanyByRuc(ruc: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { ruc },
    })
  }
}
