import { Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateSunatRheDto } from "./dto/create-sunat-rhe.dto"
import { UpdateSunatRheDto } from "./dto/update-sunat-rhe.dto"
import { CreateSunatInvoiceDto } from "./dto/create-sunat-invoice.dto"
import { UpdateSunatInvoiceDto } from "./dto/update-sunat-invoice.dto"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { SunatRhe, SunatInvoice } from "@prisma/client"

@Injectable()
export class SunatService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // SUNAT RHE METHODS
  // ============================================================================

  async fetchSunatRhe(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<SunatRhe>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = { companyId }

    const [rheRecords, total] = await Promise.all([
      this.prisma.sunatRhe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: "desc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          currencyRef: {
            select: { code: true, name: true, symbol: true },
          },
        },
      }),
      this.prisma.sunatRhe.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: rheRecords,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createSunatRhe(createSunatRheDto: CreateSunatRheDto): Promise<SunatRhe> {
    const { companyId, userId, currency, ...rheData } = createSunatRheDto

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    // Verify currency exists
    const currencyExists = await this.prisma.currency.findUnique({
      where: { code: currency },
    })

    if (!currencyExists) {
      throw new NotFoundException(`Currency with code ${currency} not found`)
    }

    // Convert amounts to Prisma.Decimal
    const grossIncome = new Prisma.Decimal(rheData.grossIncome)
    const incomeTax = new Prisma.Decimal(rheData.incomeTax)
    const netIncome = new Prisma.Decimal(rheData.netIncome)
    const netPendingAmount = rheData.netPendingAmount ? new Prisma.Decimal(rheData.netPendingAmount) : undefined

    const rheRecord = await this.prisma.sunatRhe.create({
      data: {
        issueDate: rheData.issueDate,
        documentType: rheData.documentType,
        documentNumber: rheData.documentNumber,
        status: rheData.status,
        issuerDocumentType: rheData.issuerDocumentType,
        issuerRuc: rheData.issuerRuc,
        issuerName: rheData.issuerName,
        rentType: rheData.rentType,
        isFree: rheData.isFree,
        description: rheData.description,
        observation: rheData.observation,
        currency,
        grossIncome,
        incomeTax,
        netIncome,
        netPendingAmount,
        sourceFile: rheData.sourceFile,
        companyId,
        userId,
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })

    return rheRecord
  }

  async getSunatRheById(id: string): Promise<SunatRhe> {
    const rheRecord = await this.prisma.sunatRhe.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })

    if (!rheRecord) {
      throw new NotFoundException(`SUNAT RHE record with ID ${id} not found`)
    }

    return rheRecord
  }

  async updateSunatRhe(id: string, updateSunatRheDto: UpdateSunatRheDto): Promise<SunatRhe> {
    const existingRecord = await this.prisma.sunatRhe.findUnique({
      where: { id },
    })

    if (!existingRecord) {
      throw new NotFoundException(`SUNAT RHE record with ID ${id} not found`)
    }

    // Convert decimal fields if provided
    const updateData: any = { ...updateSunatRheDto }

    if (updateSunatRheDto.grossIncome !== undefined) {
      updateData.grossIncome = new Prisma.Decimal(updateSunatRheDto.grossIncome)
    }

    if (updateSunatRheDto.incomeTax !== undefined) {
      updateData.incomeTax = new Prisma.Decimal(updateSunatRheDto.incomeTax)
    }

    if (updateSunatRheDto.netIncome !== undefined) {
      updateData.netIncome = new Prisma.Decimal(updateSunatRheDto.netIncome)
    }

    if (updateSunatRheDto.netPendingAmount !== undefined) {
      updateData.netPendingAmount = new Prisma.Decimal(updateSunatRheDto.netPendingAmount)
    }

    const rheRecord = await this.prisma.sunatRhe.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })

    return rheRecord
  }

  async deleteSunatRhe(id: string): Promise<void> {
    const rheRecord = await this.prisma.sunatRhe.findUnique({
      where: { id },
    })

    if (!rheRecord) {
      throw new NotFoundException(`SUNAT RHE record with ID ${id} not found`)
    }

    await this.prisma.sunatRhe.delete({
      where: { id },
    })
  }

  async getSunatRheByPeriod(companyId: string, startDate: Date, endDate: Date): Promise<SunatRhe[]> {
    return this.prisma.sunatRhe.findMany({
      where: {
        companyId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { issueDate: "desc" },
      include: {
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })
  }

  async searchSunatRhe(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<SunatRhe>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.SunatRheWhereInput = {
      companyId,
      OR: [
        { documentNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { issuerRuc: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { issuerName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    }

    const [rheRecords, total] = await Promise.all([
      this.prisma.sunatRhe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: "desc" },
        include: {
          currencyRef: {
            select: { code: true, name: true, symbol: true },
          },
        },
      }),
      this.prisma.sunatRhe.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: rheRecords,
      total,
      page,
      limit,
      totalPages,
    }
  }

  // ============================================================================
  // SUNAT INVOICE METHODS
  // ============================================================================

  async fetchSunatInvoices(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<SunatInvoice>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where = { companyId }

    const [invoices, total] = await Promise.all([
      this.prisma.sunatInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: "desc" },
        include: {
          company: {
            select: { id: true, name: true, ruc: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          currencyRef: {
            select: { code: true, name: true, symbol: true },
          },
        },
      }),
      this.prisma.sunatInvoice.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: invoices,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async createSunatInvoice(createSunatInvoiceDto: CreateSunatInvoiceDto): Promise<SunatInvoice> {
    const { companyId, userId, currency, ...invoiceData } = createSunatInvoiceDto

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    // Verify currency exists
    const currencyExists = await this.prisma.currency.findUnique({
      where: { code: currency },
    })

    if (!currencyExists) {
      throw new NotFoundException(`Currency with code ${currency} not found`)
    }

    // Convert amounts to Prisma.Decimal
    const taxableBase = new Prisma.Decimal(invoiceData.taxableBase)
    const igv = new Prisma.Decimal(invoiceData.igv)
    const total = new Prisma.Decimal(invoiceData.total)
    const taxableBaseNg = invoiceData.taxableBaseNg ? new Prisma.Decimal(invoiceData.taxableBaseNg) : undefined
    const igvNg = invoiceData.igvNg ? new Prisma.Decimal(invoiceData.igvNg) : undefined
    const taxableBaseDng = invoiceData.taxableBaseDng ? new Prisma.Decimal(invoiceData.taxableBaseDng) : undefined
    const igvDng = invoiceData.igvDng ? new Prisma.Decimal(invoiceData.igvDng) : undefined
    const valueNgAcquisition = invoiceData.valueNgAcquisition
      ? new Prisma.Decimal(invoiceData.valueNgAcquisition)
      : undefined
    const isc = invoiceData.isc ? new Prisma.Decimal(invoiceData.isc) : undefined
    const icbper = invoiceData.icbper ? new Prisma.Decimal(invoiceData.icbper) : undefined
    const otherCharges = invoiceData.otherCharges ? new Prisma.Decimal(invoiceData.otherCharges) : undefined
    const exchangeRate = invoiceData.exchangeRate ? new Prisma.Decimal(invoiceData.exchangeRate) : undefined
    const participationPercent = invoiceData.participationPercent
      ? new Prisma.Decimal(invoiceData.participationPercent)
      : undefined

    const invoice = await this.prisma.sunatInvoice.create({
      data: {
        period: invoiceData.period,
        carSunat: invoiceData.carSunat,
        ruc: invoiceData.ruc,
        name: invoiceData.name,
        issueDate: invoiceData.issueDate,
        expirationDate: invoiceData.expirationDate,
        documentType: invoiceData.documentType,
        series: invoiceData.series,
        year: invoiceData.year,
        documentNumber: invoiceData.documentNumber,
        identityDocumentType: invoiceData.identityDocumentType,
        identityDocumentNumber: invoiceData.identityDocumentNumber,
        customerName: invoiceData.customerName,
        taxableBase,
        igv,
        taxableBaseNg,
        igvNg,
        taxableBaseDng,
        igvDng,
        valueNgAcquisition,
        isc,
        icbper,
        otherCharges,
        total,
        currency,
        exchangeRate,
        modifiedIssueDate: invoiceData.modifiedIssueDate,
        modifiedDocType: invoiceData.modifiedDocType,
        modifiedDocSeries: invoiceData.modifiedDocSeries,
        modifiedDocNumber: invoiceData.modifiedDocNumber,
        damCode: invoiceData.damCode,
        goodsServicesClass: invoiceData.goodsServicesClass,
        projectOperatorId: invoiceData.projectOperatorId,
        participationPercent,
        imb: invoiceData.imb,
        carOrigin: invoiceData.carOrigin,
        detraction: invoiceData.detraction,
        noteType: invoiceData.noteType,
        invoiceStatus: invoiceData.invoiceStatus,
        incal: invoiceData.incal,
        sourceFile: invoiceData.sourceFile,
        companyId,
        userId,
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })

    return invoice
  }

  async getSunatInvoiceById(id: string): Promise<SunatInvoice> {
    const invoice = await this.prisma.sunatInvoice.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })

    if (!invoice) {
      throw new NotFoundException(`SUNAT Invoice with ID ${id} not found`)
    }

    return invoice
  }

  async updateSunatInvoice(id: string, updateSunatInvoiceDto: UpdateSunatInvoiceDto): Promise<SunatInvoice> {
    const existingInvoice = await this.prisma.sunatInvoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      throw new NotFoundException(`SUNAT Invoice with ID ${id} not found`)
    }

    // Convert decimal fields if provided
    const updateData: any = { ...updateSunatInvoiceDto }

    if (updateSunatInvoiceDto.taxableBase !== undefined) {
      updateData.taxableBase = new Prisma.Decimal(updateSunatInvoiceDto.taxableBase)
    }

    if (updateSunatInvoiceDto.igv !== undefined) {
      updateData.igv = new Prisma.Decimal(updateSunatInvoiceDto.igv)
    }

    if (updateSunatInvoiceDto.total !== undefined) {
      updateData.total = new Prisma.Decimal(updateSunatInvoiceDto.total)
    }

    if (updateSunatInvoiceDto.taxableBaseNg !== undefined) {
      updateData.taxableBaseNg = new Prisma.Decimal(updateSunatInvoiceDto.taxableBaseNg)
    }

    if (updateSunatInvoiceDto.igvNg !== undefined) {
      updateData.igvNg = new Prisma.Decimal(updateSunatInvoiceDto.igvNg)
    }

    if (updateSunatInvoiceDto.taxableBaseDng !== undefined) {
      updateData.taxableBaseDng = new Prisma.Decimal(updateSunatInvoiceDto.taxableBaseDng)
    }

    if (updateSunatInvoiceDto.igvDng !== undefined) {
      updateData.igvDng = new Prisma.Decimal(updateSunatInvoiceDto.igvDng)
    }

    if (updateSunatInvoiceDto.valueNgAcquisition !== undefined) {
      updateData.valueNgAcquisition = new Prisma.Decimal(updateSunatInvoiceDto.valueNgAcquisition)
    }

    if (updateSunatInvoiceDto.isc !== undefined) {
      updateData.isc = new Prisma.Decimal(updateSunatInvoiceDto.isc)
    }

    if (updateSunatInvoiceDto.icbper !== undefined) {
      updateData.icbper = new Prisma.Decimal(updateSunatInvoiceDto.icbper)
    }

    if (updateSunatInvoiceDto.otherCharges !== undefined) {
      updateData.otherCharges = new Prisma.Decimal(updateSunatInvoiceDto.otherCharges)
    }

    if (updateSunatInvoiceDto.exchangeRate !== undefined) {
      updateData.exchangeRate = new Prisma.Decimal(updateSunatInvoiceDto.exchangeRate)
    }

    if (updateSunatInvoiceDto.participationPercent !== undefined) {
      updateData.participationPercent = new Prisma.Decimal(updateSunatInvoiceDto.participationPercent)
    }

    const invoice = await this.prisma.sunatInvoice.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: { id: true, name: true, ruc: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })

    return invoice
  }

  async deleteSunatInvoice(id: string): Promise<void> {
    const invoice = await this.prisma.sunatInvoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      throw new NotFoundException(`SUNAT Invoice with ID ${id} not found`)
    }

    await this.prisma.sunatInvoice.delete({
      where: { id },
    })
  }

  async getSunatInvoicesByPeriod(companyId: string, period: string): Promise<SunatInvoice[]> {
    return this.prisma.sunatInvoice.findMany({
      where: {
        companyId,
        period,
      },
      orderBy: { issueDate: "desc" },
      include: {
        currencyRef: {
          select: { code: true, name: true, symbol: true },
        },
      },
    })
  }

  async searchSunatInvoices(
    companyId: string,
    searchTerm: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<SunatInvoice>> {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.SunatInvoiceWhereInput = {
      companyId,
      OR: [
        { ruc: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { documentNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { identityDocumentNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { customerName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        { series: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
      ],
    }

    const [invoices, total] = await Promise.all([
      this.prisma.sunatInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: "desc" },
        include: {
          currencyRef: {
            select: { code: true, name: true, symbol: true },
          },
        },
      }),
      this.prisma.sunatInvoice.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: invoices,
      total,
      page,
      limit,
      totalPages,
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getSunatStats(companyId: string) {
    const [rheStats, invoiceStats] = await Promise.all([
      this.prisma.sunatRhe.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { status: true },
        _sum: { netIncome: true },
      }),
      this.prisma.sunatInvoice.groupBy({
        by: ["period"],
        where: { companyId },
        _count: { period: true },
        _sum: { total: true },
      }),
    ])

    return {
      rhe: {
        byStatus: rheStats.reduce(
          (acc, stat) => {
            acc[stat.status] = {
              count: stat._count.status,
              totalIncome: stat._sum.netIncome?.toNumber() || 0,
            }
            return acc
          },
          {} as Record<string, { count: number; totalIncome: number }>,
        ),
      },
      invoices: {
        byPeriod: invoiceStats.reduce(
          (acc, stat) => {
            acc[stat.period] = {
              count: stat._count.period,
              totalAmount: stat._sum.total?.toNumber() || 0,
            }
            return acc
          },
          {} as Record<string, { count: number; totalAmount: number }>,
        ),
      },
    }
  }

  async importSunatRheFromFile(
    companyId: string,
    userId: string,
    rheRecords: any[],
    fileName: string,
  ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    let imported = 0
    let duplicates = 0
    const errors: string[] = []

    for (const [index, rheData] of rheRecords.entries()) {
      try {
        // Check for duplicate based on issuer RUC, document number and issue date
        const existingRecord = await this.prisma.sunatRhe.findFirst({
          where: {
            companyId,
            issuerRuc: rheData.issuerRuc,
            documentNumber: rheData.documentNumber,
            issueDate: rheData.issueDate,
          },
        })

        if (existingRecord) {
          duplicates++
          continue
        }

        // Create RHE record with all fields
        await this.prisma.sunatRhe.create({
          data: {
            issueDate: rheData.issueDate,
            documentType: rheData.documentType,
            documentNumber: rheData.documentNumber,
            status: rheData.status,
            issuerDocumentType: rheData.issuerDocumentType,
            issuerRuc: rheData.issuerRuc,
            issuerName: rheData.issuerName,
            rentType: rheData.rentType,
            isFree: rheData.isFree,
            description: rheData.description,
            observation: rheData.observation,
            currency: rheData.currency,
            grossIncome: new Prisma.Decimal(rheData.grossIncome),
            incomeTax: new Prisma.Decimal(rheData.incomeTax),
            netIncome: new Prisma.Decimal(rheData.netIncome),
            netPendingAmount: rheData.netPendingAmount ? new Prisma.Decimal(rheData.netPendingAmount) : undefined,
            companyId,
            userId,
            sourceFile: fileName,
          },
        })

        imported++
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`)
      }
    }

    return { imported, duplicates, errors }
  }

  async importSunatInvoicesFromFile(
    companyId: string,
    userId: string,
    invoiceRecords: any[],
    fileName: string,
  ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    let imported = 0
    let duplicates = 0
    const errors: string[] = []

    for (const [index, invoiceData] of invoiceRecords.entries()) {
      try {
        // Check for duplicate based on ruc, series, document number and period
        const existingInvoice = await this.prisma.sunatInvoice.findFirst({
          where: {
            companyId,
            ruc: invoiceData.ruc,
            series: invoiceData.series,
            documentNumber: invoiceData.documentNumber,
            period: invoiceData.period,
          },
        })

        if (existingInvoice) {
          duplicates++
          continue
        }

        // Create invoice record with all fields
        await this.prisma.sunatInvoice.create({
          data: {
            period: invoiceData.period,
            carSunat: invoiceData.carSunat,
            ruc: invoiceData.ruc,
            name: invoiceData.name,
            issueDate: invoiceData.issueDate,
            expirationDate: invoiceData.expirationDate,
            documentType: invoiceData.documentType,
            series: invoiceData.series,
            year: invoiceData.year,
            documentNumber: invoiceData.documentNumber,
            identityDocumentType: invoiceData.identityDocumentType,
            identityDocumentNumber: invoiceData.identityDocumentNumber,
            customerName: invoiceData.customerName,
            taxableBase: new Prisma.Decimal(invoiceData.taxableBase),
            igv: new Prisma.Decimal(invoiceData.igv),
            taxableBaseNg: invoiceData.taxableBaseNg ? new Prisma.Decimal(invoiceData.taxableBaseNg) : undefined,
            igvNg: invoiceData.igvNg ? new Prisma.Decimal(invoiceData.igvNg) : undefined,
            taxableBaseDng: invoiceData.taxableBaseDng ? new Prisma.Decimal(invoiceData.taxableBaseDng) : undefined,
            igvDng: invoiceData.igvDng ? new Prisma.Decimal(invoiceData.igvDng) : undefined,
            valueNgAcquisition: invoiceData.valueNgAcquisition
              ? new Prisma.Decimal(invoiceData.valueNgAcquisition)
              : undefined,
            isc: invoiceData.isc ? new Prisma.Decimal(invoiceData.isc) : undefined,
            icbper: invoiceData.icbper ? new Prisma.Decimal(invoiceData.icbper) : undefined,
            otherCharges: invoiceData.otherCharges ? new Prisma.Decimal(invoiceData.otherCharges) : undefined,
            total: new Prisma.Decimal(invoiceData.total),
            currency: invoiceData.currency,
            exchangeRate: invoiceData.exchangeRate ? new Prisma.Decimal(invoiceData.exchangeRate) : undefined,
            modifiedIssueDate: invoiceData.modifiedIssueDate,
            modifiedDocType: invoiceData.modifiedDocType,
            modifiedDocSeries: invoiceData.modifiedDocSeries,
            modifiedDocNumber: invoiceData.modifiedDocNumber,
            damCode: invoiceData.damCode,
            goodsServicesClass: invoiceData.goodsServicesClass,
            projectOperatorId: invoiceData.projectOperatorId,
            participationPercent: invoiceData.participationPercent
              ? new Prisma.Decimal(invoiceData.participationPercent)
              : undefined,
            imb: invoiceData.imb,
            carOrigin: invoiceData.carOrigin,
            detraction: invoiceData.detraction,
            noteType: invoiceData.noteType,
            invoiceStatus: invoiceData.invoiceStatus,
            incal: invoiceData.incal,
            companyId,
            userId,
            sourceFile: fileName,
          },
        })

        imported++
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`)
      }
    }

    return { imported, duplicates, errors }
  }
}
