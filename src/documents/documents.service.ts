import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common"
import  { PrismaService } from "../prisma/prisma.service" // Adjust path as needed
import  { CreateDocumentDto } from "./dto/create-document.dto"
import  { UpdateDocumentDto } from "./dto/update-document.dto"
import  { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { DocumentStatus, DocumentType, Prisma } from "@prisma/client"
import * as crypto from "crypto"

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchDocuments(companyId: string, pagination: PaginationDto): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = pagination

    const skip = (page - 1) * limit
    const take = limit

    const where: Prisma.DocumentWhereInput = {
      companyId,
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: {
            select: {
              id: true,
              businessName: true,
              documentNumber: true,
              documentType: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lines: true,
        },
      }),
      this.prisma.document.count({ where }),
    ])

    return {
      data: documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createDocument(createDocumentDto: CreateDocumentDto) {
    const { lines, ...documentData } = createDocumentDto

    // Generate full number
    const fullNumber = `${documentData.series}-${documentData.number}`

    // Check for duplicates
    const existingDocument = await this.prisma.document.findUnique({
      where: {
        companyId_series_number: {
          companyId: documentData.companyId,
          series: documentData.series,
          number: documentData.number,
        },
      },
    })

    if (existingDocument) {
      throw new ConflictException(`Document ${fullNumber} already exists`)
    }

    // Calculate amounts
    const netPayableAmount = this.calculateNetPayableAmount(
      documentData.total,
      documentData.retentionAmount || 0,
      documentData.detractionAmount || 0,
    )

    const pendingAmount = netPayableAmount

    // Generate XML hash if XML content is provided
    let xmlHash: string | undefined
    if (documentData.xmlContent) {
      xmlHash = crypto.createHash("sha256").update(documentData.xmlContent).digest("hex")
    }

    try {
      const document = await this.prisma.document.create({
        data: {
          ...documentData,
          fullNumber,
          netPayableAmount,
          pendingAmount,
          xmlHash,
          issueDate: new Date(documentData.issueDate),
          dueDate: documentData.dueDate ? new Date(documentData.dueDate) : null,
          receptionDate: documentData.receptionDate ? new Date(documentData.receptionDate) : null,
          creditDueDate: documentData.creditDueDate ? new Date(documentData.creditDueDate) : null,
          installmentDueDate: documentData.installmentDueDate ? new Date(documentData.installmentDueDate) : null,
          signatureDate: documentData.signatureDate ? new Date(documentData.signatureDate) : null,
          lines: lines
            ? {
                create: lines.map((line, index) => ({
                  ...line,
                  lineNumber: index + 1,
                })),
              }
            : undefined,
        },
        include: {
          supplier: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lines: true,
        },
      })

      return document
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Document with this series and number already exists")
        }
      }
      throw error
    }
  }

  async processXmlDocument(xmlContent: string, companyId: string, createdById: string) {
    // This is a simplified XML processing - you would implement actual XML parsing here
    try {
      // Generate XML hash
      const xmlHash = crypto.createHash("sha256").update(xmlContent).digest("hex")

      // Check if XML already exists
      const existingDocument = await this.prisma.document.findFirst({
        where: { xmlHash },
      })

      if (existingDocument) {
        throw new ConflictException("XML document already processed")
      }

      // Parse XML content (simplified - implement actual XML parsing)
      const parsedData = this.parseXmlContent(xmlContent)

      // Create document from parsed XML
      // Ensure all required fields are present
      const createDocumentDto: CreateDocumentDto = {
        companyId,
        createdById,
        xmlContent,
        xmlHash,
        status: DocumentStatus.PENDING,
        // Required fields from CreateDocumentDto
        documentType: parsedData.documentType || DocumentType.FACTURA,
        series: parsedData.series || "F001",
        number: parsedData.number || "00000001",
        supplierId: parsedData.supplierId || "", // This would need to be resolved from XML data
        issueDate: parsedData.issueDate || new Date().toISOString(),
        subtotal: parsedData.subtotal || 0,
        igv: parsedData.igv || 0,
        total: parsedData.total || 0,
        // Optional fields
        ...parsedData,
      }

      return await this.createDocument(createDocumentDto)
    } catch (error) {
      throw new BadRequestException(`Failed to process XML: ${error.message}`)
    }
  }

  async getDocumentById(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lines: {
          orderBy: { lineNumber: "asc" },
        },
        conciliationItems: {
          include: {
            transaction: true,
          },
        },
      },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }

    return document
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    const { lines, ...documentData } = updateDocumentDto

    // Check if document exists
    const existingDocument = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }

    // Update full number if series or number changed
    let fullNumber: string | undefined
    if (documentData.series || documentData.number) {
      const series = documentData.series || existingDocument.series
      const number = documentData.number || existingDocument.number
      fullNumber = `${series}-${number}`
    }

    // Recalculate amounts if relevant fields changed
    let netPayableAmount: number | undefined
    let pendingAmount: number | undefined

    if (
      documentData.total !== undefined ||
      documentData.retentionAmount !== undefined ||
      documentData.detractionAmount !== undefined
    ) {
      const total = documentData.total ?? existingDocument.total.toNumber()
      const retentionAmount = documentData.retentionAmount ?? existingDocument.retentionAmount?.toNumber() ?? 0
      const detractionAmount = documentData.detractionAmount ?? existingDocument.detractionAmount?.toNumber() ?? 0

      netPayableAmount = this.calculateNetPayableAmount(total, retentionAmount, detractionAmount)
      pendingAmount = netPayableAmount - existingDocument.conciliatedAmount.toNumber()
    }

    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: {
          ...documentData,
          ...(fullNumber && { fullNumber }),
          ...(netPayableAmount !== undefined && { netPayableAmount }),
          ...(pendingAmount !== undefined && { pendingAmount }),
          issueDate: documentData.issueDate ? new Date(documentData.issueDate) : undefined,
          dueDate: documentData.dueDate ? new Date(documentData.dueDate) : undefined,
          receptionDate: documentData.receptionDate ? new Date(documentData.receptionDate) : undefined,
          creditDueDate: documentData.creditDueDate ? new Date(documentData.creditDueDate) : undefined,
          installmentDueDate: documentData.installmentDueDate ? new Date(documentData.installmentDueDate) : undefined,
          signatureDate: documentData.signatureDate ? new Date(documentData.signatureDate) : undefined,
          updatedAt: new Date(),
        },
        include: {
          supplier: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lines: {
            orderBy: { lineNumber: "asc" },
          },
        },
      })

      return document
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Document with this series and number already exists")
        }
      }
      throw error
    }
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }

    // Check if document is conciliated
    if (document.status === DocumentStatus.CONCILIATED) {
      throw new BadRequestException("Cannot delete a conciliated document")
    }

    await this.prisma.document.delete({
      where: { id },
    })
  }

  async getDocumentsBySupplier(supplierId: string) {
    return await this.prisma.document.findMany({
      where: { supplierId },
      include: {
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    })
  }

  async getDocumentsByDateRange(companyId: string, startDate: Date, endDate: Date) {
    return await this.prisma.document.findMany({
      where: {
        companyId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    })
  }

  async validateWithSunat(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }

    // Implement SUNAT validation logic here
    // This would typically involve calling SUNAT web services

    // For now, just update the status
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.VALIDATED,
        sunatProcessDate: new Date(),
        sunatResponseCode: "0", // Success code
      },
    })
  }

  async generateCdr(id: string): Promise<string> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }

    // Implement CDR generation logic here
    // This would typically involve generating a CDR XML file

    const cdrPath = `/cdr/${document.fullNumber}.xml`

    // Update document with CDR status
    await this.prisma.document.update({
      where: { id },
      data: {
        cdrStatus: "GENERATED",
      },
    })

    return cdrPath
  }

  private calculateNetPayableAmount(total: number, retentionAmount: number, detractionAmount: number): number {
    return total - retentionAmount - detractionAmount
  }

  private parseXmlContent(xmlContent: string): Partial<CreateDocumentDto> {
    // This is a simplified XML parser - implement actual XML parsing logic
    // You would use libraries like xml2js or fast-xml-parser

    // For now, return a basic structure with all required fields
    return {
      documentType: DocumentType.FACTURA,
      series: "F001",
      number: "00000001",
      supplierId: "", // This would be resolved from XML data
      issueDate: new Date().toISOString(),
      subtotal: 100,
      igv: 18,
      total: 118,
      currency: "PEN",
      xmlUblVersion: "2.1",
      xmlCustomizationId: "2.0",
    }
  }
}
