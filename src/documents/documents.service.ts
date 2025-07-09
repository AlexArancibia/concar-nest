import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateDocumentDto } from "./dto/create-document.dto"
import { UpdateDocumentDto, ConciliateDocumentDto } from "./dto/update-document.dto"
import { DocumentQueryDto } from "./dto/document-query.dto"
import { DocumentResponseDto, DocumentSummaryResponseDto } from "./dto/document-response.dto"
import { DocumentStatus, Prisma as PrismaType } from "@prisma/client"

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<DocumentResponseDto> {
    this.logger.log(`Creating document: ${createDocumentDto.series}-${createDocumentDto.number}`)

    const {
      lines,
      paymentTerms,
      accountLinks,
      costCenterLinks,
      xmlData,
      digitalSignature,
      detraction,
      ...documentData
    } = createDocumentDto

    // Generate full 33
    const fullNumber = `${documentData.series}-${documentData.number}`
    this.logger.log(`Generated full number: ${fullNumber}`)

    try {
      // Check if document already exists
      const existingDocument = await this.prisma.document.findUnique({
        where: {
          companyId_fullNumber: {
            companyId: documentData.companyId,
            fullNumber: fullNumber,
          },
        },
      })

      if (existingDocument) {
        throw new BadRequestException(`Document ${fullNumber} already exists`)
      }

      // Verify supplier exists and belongs to company
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: documentData.supplierId,
          companyId: documentData.companyId,
        },
      })

      if (!supplier) {
        throw new NotFoundException("Supplier not found or does not belong to company")
      }

      // Calculate net payable amount
     const netPayableAmount = new Prisma.Decimal(documentData.total)
          .minus(new Prisma.Decimal(documentData.retentionAmount || 0));

        // Initially no conciliated amount, but subtract detraction
        let detractionAmount = new Prisma.Decimal(0);
        if (detraction) {
          detractionAmount = new Prisma.Decimal(detraction.amount || 0);
        }

        const pendingAmount = netPayableAmount.minus(detractionAmount);

      this.logger.log(`Calculated amounts - Net payable: ${netPayableAmount}, Pending: ${pendingAmount}`)

      return await this.prisma.$transaction(async (tx) => {
        // Create document
        this.logger.log("Creating document in transaction...")
        const document = await tx.document.create({
          data: {
            ...documentData,
            fullNumber,
            netPayableAmount,
            pendingAmount,
            updatedById: documentData.createdById,
          },
        })

        this.logger.log(`Document created with ID: ${document.id}`)

        // Create lines with their account and cost center links
        if (lines && lines.length > 0) {
          this.logger.log(`Creating ${lines.length} document lines...`)
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const { accountLinks: lineAccountLinks, costCenterLinks: lineCostCenterLinks, ...lineData } = line

            const createdLine = await tx.documentLine.create({
              data: {
                ...lineData,
                documentId: document.id,
                lineNumber: i + 1,
              },
            })

            this.logger.log(`Created line ${i + 1} with ID: ${createdLine.id}`)

            // Create line account links
            if (lineAccountLinks && lineAccountLinks.length > 0) {
              await tx.documentLineAccountLink.createMany({
                data: lineAccountLinks.map((link) => ({
                  ...link,
                  documentLineId: createdLine.id,
                })),
              })
              this.logger.log(`Created ${lineAccountLinks.length} account links for line ${i + 1}`)
            }

            // Create line cost center links
            if (lineCostCenterLinks && lineCostCenterLinks.length > 0) {
              await tx.documentLineCostCenterLink.createMany({
                data: lineCostCenterLinks.map((link) => ({
                  ...link,
                  documentLineId: createdLine.id,
                })),
              })
              this.logger.log(`Created ${lineCostCenterLinks.length} cost center links for line ${i + 1}`)
            }
          }
        }

        // Create payment terms
        if (paymentTerms && paymentTerms.length > 0) {
          this.logger.log(`Creating ${paymentTerms.length} payment terms...`)
          await tx.documentPaymentTerm.createMany({
            data: paymentTerms.map((term, index) => ({
              ...term,
              documentId: document.id,
              termNumber: index + 1,
              dueDate: new Date(term.dueDate),
            })),
          })
        }

        // Create document account links
        if (accountLinks && accountLinks.length > 0) {
          this.logger.log(`Creating ${accountLinks.length} document account links...`)
          await tx.documentAccountLink.createMany({
            data: accountLinks.map((link) => ({
              ...link,
              documentId: document.id,
            })),
          })
        }

        // Create document cost center links
        if (costCenterLinks && costCenterLinks.length > 0) {
          this.logger.log(`Creating ${costCenterLinks.length} document cost center links...`)
          await tx.documentCostCenterLink.createMany({
            data: costCenterLinks.map((link) => ({
              ...link,
              documentId: document.id,
            })),
          })
        }

        // Create XML data
        if (xmlData) {
          this.logger.log("Creating XML data...")
          await tx.documentXmlData.create({
            data: {
              ...xmlData,
              documentId: document.id,
              sunatProcessDate: xmlData.sunatProcessDate ? new Date(xmlData.sunatProcessDate) : null,
            },
          })
        }

        // Create digital signature
        if (digitalSignature) {
          this.logger.log("Creating digital signature...")
          await tx.documentDigitalSignature.create({
            data: {
              ...digitalSignature,
              documentId: document.id,
              signatureDate: digitalSignature.signatureDate ? new Date(digitalSignature.signatureDate) : null,
            },
          })
        }

        // Create detraction
        if (detraction) {
          this.logger.log("Creating detraction...")
          const detractionAmount = detraction.amount || 0
          await tx.documentDetraction.create({
            data: {
              ...detraction,
              documentId: document.id,
              amount: detractionAmount,
              paymentDate: detraction.paymentDate ? new Date(detraction.paymentDate) : null,
            },
          })
        }

        this.logger.log(`Transaction completed. Fetching complete document with ID: ${document.id}`)

        // Return complete document - usar tx en lugar de this.prisma
        const completeDocument = await tx.document.findUnique({
          where: { id: document.id },
          include: this.getDocumentIncludes(),
        })

        if (!completeDocument) {
          this.logger.error(`Failed to fetch created document with ID: ${document.id}`)
          throw new NotFoundException(`Created document not found: ${document.id}`)
        }

        this.logger.log(`Successfully created and fetched document: ${completeDocument.fullNumber}`)
        return this.mapToResponseDto(completeDocument)
      })
    } catch (error) {
      this.logger.error(`Error creating document: ${error.message}`, error.stack)
      throw error
    }
  }

  async fetchDocuments(companyId: string, query: DocumentQueryDto) {
    const {
      page = 1,
      limit = 10,
      supplierId,
      documentType,
      status,
      issueDateFrom,
      issueDateTo,
      dueDateFrom,
      dueDateTo,
      currency,
      minAmount,
      maxAmount,
      search,
      tags,
      hasRetention,
      hasDetraction,
      hasXmlData,
      hasDigitalSignature,
      accountId,
      costCenterId,
    } = query

    const skip = (page - 1) * limit
    const where: PrismaType.DocumentWhereInput = {
      companyId,
      ...(supplierId && { supplierId }),
      ...(documentType && { documentType }),
      ...(status && { status }),
      ...(currency && { currency }),
      ...(minAmount && { total: { gte: minAmount } }),
      ...(maxAmount && { total: { lte: maxAmount } }),
      ...(tags && { tags: { contains: tags, mode: "insensitive" } }),
      ...(hasRetention !== undefined && { hasRetention }),
      ...(hasDetraction !== undefined && {
        detraction: hasDetraction ? { isNot: null } : { is: null },
      }),
      ...(hasXmlData !== undefined && {
        xmlData: hasXmlData ? { isNot: null } : { is: null },
      }),
      ...(hasDigitalSignature !== undefined && {
        digitalSignature: hasDigitalSignature ? { isNot: null } : { is: null },
      }),
      ...(accountId && {
        OR: [{ accountLinks: { some: { accountId } } }, { lines: { some: { accountLinks: { some: { accountId } } } } }],
      }),
      ...(costCenterId && {
        OR: [
          { costCenterLinks: { some: { costCenterId } } },
          { lines: { some: { costCenterLinks: { some: { costCenterId } } } } },
        ],
      }),
      ...((issueDateFrom || issueDateTo) && {
        issueDate: {
          ...(issueDateFrom && { gte: new Date(issueDateFrom) }),
          ...(issueDateTo && { lte: new Date(issueDateTo) }),
        },
      }),
      ...((dueDateFrom || dueDateTo) && {
        dueDate: {
          ...(dueDateFrom && { gte: new Date(dueDateFrom) }),
          ...(dueDateTo && { lte: new Date(dueDateTo) }),
        },
      }),
      ...(search && {
        OR: [
          { fullNumber: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { supplier: { businessName: { contains: search, mode: "insensitive" } } },
          { lines: { some: { description: { contains: search, mode: "insensitive" } } } },
        ],
      }),
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: this.getDocumentIncludes(),
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ])

    return {
      data: documents.map((doc) => this.mapToResponseDto(doc)),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),

    }
  }

  async getDocumentById(id: string): Promise<DocumentResponseDto> {
    this.logger.log(`Fetching document by ID: ${id}`)

    const document = await this.prisma.document.findUnique({
      where: { id },
      include: this.getDocumentIncludes(),
    })

    if (!document) {
      this.logger.error(`Document not found with ID: ${id}`)
      throw new NotFoundException("Document not found")
    }

    this.logger.log(`Found document: ${document.fullNumber}`)
    return this.mapToResponseDto(document)
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentResponseDto> {
    const existingDocument = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      throw new NotFoundException("Document not found")
    }

    // Check if document can be updated based on status
    if (existingDocument.status === DocumentStatus.PAID || existingDocument.status === DocumentStatus.CANCELLED) {
      throw new BadRequestException("Cannot update paid or cancelled documents")
    }

    const {
      lines,
      paymentTerms,
      accountLinks,
      costCenterLinks,
      xmlData,
      digitalSignature,
      detraction,
      ...documentData
    } = updateDocumentDto

    // Recalculate amounts if total changed
    let netPayableAmount = existingDocument.netPayableAmount
    let pendingAmount = existingDocument.pendingAmount

    if (documentData.total !== undefined) {
      netPayableAmount = new Prisma.Decimal(documentData.total)
      pendingAmount = netPayableAmount.minus(existingDocument.conciliatedAmount)
    }

    return this.prisma.$transaction(async (tx) => {
      // Update document
      await tx.document.update({
        where: { id },
        data: {
          ...documentData,
          netPayableAmount,
          pendingAmount,
          updatedAt: new Date(),
        },
      })

      // Update lines if provided
      if (lines) {
        // Delete existing lines and their links
        await tx.documentLineAccountLink.deleteMany({
          where: { documentLine: { documentId: id } },
        })
        await tx.documentLineCostCenterLink.deleteMany({
          where: { documentLine: { documentId: id } },
        })
        await tx.documentLine.deleteMany({
          where: { documentId: id },
        })

        // Create new lines
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const { accountLinks: lineAccountLinks, costCenterLinks: lineCostCenterLinks, ...lineData } = line

          const createdLine = await tx.documentLine.create({
            data: {
              ...lineData,
              documentId: id,
              lineNumber: i + 1,
            },
          })

          // Create line account links
          if (lineAccountLinks && lineAccountLinks.length > 0) {
            await tx.documentLineAccountLink.createMany({
              data: lineAccountLinks.map((link) => ({
                ...link,
                documentLineId: createdLine.id,
              })),
            })
          }

          // Create line cost center links
          if (lineCostCenterLinks && lineCostCenterLinks.length > 0) {
            await tx.documentLineCostCenterLink.createMany({
              data: lineCostCenterLinks.map((link) => ({
                ...link,
                documentLineId: createdLine.id,
              })),
            })
          }
        }
      }

      // Update payment terms if provided
      if (paymentTerms) {
        await tx.documentPaymentTerm.deleteMany({
          where: { documentId: id },
        })

        await tx.documentPaymentTerm.createMany({
          data: paymentTerms.map((term, index) => ({
            ...term,
            documentId: id,
            termNumber: index + 1,
            dueDate: new Date(term.dueDate),
          })),
        })
      }

      // Update account links if provided
      if (accountLinks !== undefined) {
        await tx.documentAccountLink.deleteMany({
          where: { documentId: id },
        })

        if (accountLinks.length > 0) {
          await tx.documentAccountLink.createMany({
            data: accountLinks.map((link) => ({
              ...link,
              documentId: id,
            })),
          })
        }
      }

      // Update cost center links if provided
      if (costCenterLinks !== undefined) {
        await tx.documentCostCenterLink.deleteMany({
          where: { documentId: id },
        })

        if (costCenterLinks.length > 0) {
          await tx.documentCostCenterLink.createMany({
            data: costCenterLinks.map((link) => ({
              ...link,
              documentId: id,
            })),
          })
        }
      }

      // Update XML data if provided
      if (xmlData) {
        await tx.documentXmlData.upsert({
          where: { documentId: id },
          update: {
            ...xmlData,
            sunatProcessDate: xmlData.sunatProcessDate ? new Date(xmlData.sunatProcessDate) : null,
            updatedAt: new Date(),
          },
          create: {
            ...xmlData,
            documentId: id,
            sunatProcessDate: xmlData.sunatProcessDate ? new Date(xmlData.sunatProcessDate) : null,
          },
        })
      }

      // Update digital signature if provided
      if (digitalSignature) {
        await tx.documentDigitalSignature.upsert({
          where: { documentId: id },
          update: {
            ...digitalSignature,
            signatureDate: digitalSignature.signatureDate ? new Date(digitalSignature.signatureDate) : null,
            updatedAt: new Date(),
          },
          create: {
            ...digitalSignature,
            documentId: id,
            signatureDate: digitalSignature.signatureDate ? new Date(digitalSignature.signatureDate) : null,
          },
        })
      }

      // Update detraction if provided
      if (detraction) {
        const detractionAmount = detraction.amount || 0
        await tx.documentDetraction.upsert({
          where: { documentId: id },
          update: {
            ...detraction,
            amount: detractionAmount,
            paymentDate: detraction.paymentDate ? new Date(detraction.paymentDate) : null,
            updatedAt: new Date(),
          },
          create: {
            ...detraction,
            documentId: id,
            amount: detractionAmount,
            paymentDate: detraction.paymentDate ? new Date(detraction.paymentDate) : null,
          },
        })
      }

      // Fetch the updated document with all relations using the transaction
      const updatedDocument = await tx.document.findUnique({
        where: { id },
        include: this.getDocumentIncludes(),
      })

      if (!updatedDocument) {
        throw new NotFoundException(`Updated document not found: ${id}`)
      }

      return this.mapToResponseDto(updatedDocument)
    })
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new NotFoundException("Document not found")
    }

    // Check if document can be deleted
    if (document.status === DocumentStatus.PAID || document.conciliatedAmount.greaterThan(0)) {
      throw new BadRequestException("Cannot delete paid or conciliated documents")
    }

    await this.prisma.document.delete({
      where: { id },
    })
  }

  async getDocumentsByStatus(companyId: string, status: DocumentStatus) {
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        status,
      },
      include: this.getDocumentIncludes(),
      orderBy: { issueDate: "desc" },
    })

    return documents.map((doc) => this.mapToResponseDto(doc))
  }

  async getDocumentsBySupplier(companyId: string, supplierId: string, query: DocumentQueryDto) {
    return this.fetchDocuments(companyId, { ...query, supplierId })
  }

  async getDocumentsByDateRange(companyId: string, startDate: string, endDate: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        issueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: this.getDocumentIncludes(),
      orderBy: { issueDate: "desc" },
    })

    return documents.map((doc) => this.mapToResponseDto(doc))
  }

  async updateDocumentStatus(id: string, status: DocumentStatus, updatedById: string): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new NotFoundException("Document not found")
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        status,
        updatedById,
        updatedAt: new Date(),
      },
      include: this.getDocumentIncludes(),
    })

    return this.mapToResponseDto(updatedDocument)
  }

  async conciliateDocument(id: string, conciliateDto: ConciliateDocumentDto): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new NotFoundException("Document not found")
    }

    const newConciliatedAmount = document.conciliatedAmount.plus(new Prisma.Decimal(conciliateDto.conciliatedAmount))
    const newPendingAmount = document.netPayableAmount.minus(newConciliatedAmount)

    if (newConciliatedAmount.greaterThan(document.netPayableAmount)) {
      throw new BadRequestException("Conciliated amount cannot exceed net payable amount")
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        conciliatedAmount: newConciliatedAmount,
        pendingAmount: newPendingAmount,
        status: newPendingAmount.lessThanOrEqualTo(0) ? DocumentStatus.PAID : document.status,
        updatedAt: new Date(),
      },
      include: this.getDocumentIncludes(),
    })

    return this.mapToResponseDto(updatedDocument)
  }

  async getDocumentSummary(companyId: string): Promise<DocumentSummaryResponseDto> {
    const [totalDocuments, statusCounts, monthlyTotals, currencySummary, supplierSummary] = await Promise.all([
      this.prisma.document.count({
        where: { companyId },
      }),
      this.prisma.document.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { status: true },
        _sum: { total: true },
      }),
      this.prisma.document.groupBy({
        by: ["issueDate"],
        where: {
          companyId,
          issueDate: {
            gte: new Date(new Date().getFullYear(), 0, 1), // Current year
          },
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.document.groupBy({
        by: ["currency"],
        where: { companyId },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.document.groupBy({
        by: ["supplierId"],
        where: { companyId },
        _sum: { total: true },
        _count: { id: true },
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),
    ])

    // Get supplier names for supplier summary
    const supplierIds = supplierSummary.map((s) => s.supplierId)
    const suppliers = await this.prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, businessName: true },
    })

    const supplierMap = new Map(suppliers.map((s) => [s.id, s.businessName]))

    return {
      totalDocuments,
      statusCounts: statusCounts.map((sc) => ({
        status: sc.status,
        _count: sc._count,
        _sum: { total: sc._sum.total ? sc._sum.total.toNumber() : null },
      })),
      monthlyTotals: monthlyTotals.map((mt) => ({
        month: mt.issueDate.toISOString().substring(0, 7), // YYYY-MM format
        totalAmount: mt._sum.total ? mt._sum.total.toNumber() : 0,
        documentCount: mt._count.id,
      })),
      currencySummary: currencySummary.map((cs) => ({
        currency: cs.currency,
        totalAmount: cs._sum.total ? cs._sum.total.toNumber() : 0,
        documentCount: cs._count.id,
      })),
      supplierSummary: supplierSummary.map((ss) => ({
        supplierId: ss.supplierId,
        supplierName: supplierMap.get(ss.supplierId) || "Unknown",
        totalAmount: ss._sum.total ? ss._sum.total.toNumber() : 0,
        documentCount: ss._count.id,
      })),
    }
  }

  async getDocumentsWithPendingDetractions(companyId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        detraction: {
          hasDetraction: true,
          isConciliated: false,
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
        detraction: true,
      },
      orderBy: { issueDate: "desc" },
    })

    return documents.map((doc) => this.mapToResponseDto(doc))
  }

  async getDocumentsWithXmlData(companyId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        xmlData: { isNot: null },
      },
      include: {
        supplier: {
          select: {
            id: true,
            businessName: true,
            documentNumber: true,
          },
        },
        xmlData: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return documents.map((doc) => this.mapToResponseDto(doc))
  }

  private getDocumentIncludes() {
    return {
      supplier: {
      
        select: {
          id: true,
          businessName: true,
          documentNumber: true,
          documentType: true,
          supplierBankAccounts:{
            select:{
              id:true,
              bankId:true,
              accountNumber:true,
              accountType:true,
              currency:true,
              bank:{
                select:{
                  name:true,
                  code:true
                }
              }
            }
          }
        
        },
        
      },
      lines: {
        include: {
          accountLinks: {
            include: {
              account: {
                select: {
                  id: true,
                  accountCode: true,
                  accountName: true,
                },
              },
            },
          },
          costCenterLinks: {
            include: {
              costCenter: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      paymentTerms: true,
      accountLinks: {
        include: {
          account: {
            select: {
              id: true,
              accountCode: true,
              accountName: true,
            },
          },
        },
      },
      costCenterLinks: {
        include: {
          costCenter: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      xmlData: true,
      digitalSignature: true,
      detraction: true,
    }
  }

  private mapToResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      companyId: document.companyId,
      documentType: document.documentType,
      series: document.series,
      number: document.number,
      fullNumber: document.fullNumber,
      supplierId: document.supplierId,
      issueDate: document.issueDate,
      issueTime: document.issueTime,
      dueDate: document.dueDate,
      receptionDate: document.receptionDate,
      currency: document.currency,
      exchangeRate: document.exchangeRate,
      subtotal: document.subtotal,
      igv: document.igv,
      otherTaxes: document.otherTaxes,
      total: document.total,
      hasRetention: document.hasRetention,
      retentionAmount: document.retentionAmount,
      retentionPercentage: document.retentionPercentage,
      netPayableAmount: document.netPayableAmount,
      conciliatedAmount: document.conciliatedAmount,
      pendingAmount: document.pendingAmount,
      paymentMethod: document.paymentMethod,
      description: document.description,
      observations: document.observations,
      tags: document.tags,
      status: document.status,
      orderReference: document.orderReference,
      contractNumber: document.contractNumber,
      additionalNotes: document.additionalNotes,
      documentNotes: document.documentNotes,
      operationNotes: document.operationNotes,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      createdById: document.createdById,
      updatedById: document.updatedById,
      supplier: document.supplier,
      lines: document.lines,
      paymentTerms: document.paymentTerms,
      accountLinks: document.accountLinks,
      costCenterLinks: document.costCenterLinks,
      xmlData: document.xmlData,
      digitalSignature: document.digitalSignature,
      detraction: document.detraction,
    }
  }
}
