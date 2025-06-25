import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto, ConciliateDocumentDto } from "./dto/update-document.dto";
import { DocumentQueryDto } from "./dto/document-filters.dto";
import { DocumentResponseDto, DocumentSummaryResponseDto } from "./dto/document-response.dto";
import {
  DocumentStatus,
  Prisma as PrismaType,
  Document,
  Supplier,
  DocumentLine,
  DocumentLineAccountLink,
  Account,
  DocumentLineCostCenterLink,
  CostCenter,
  DocumentPaymentTerm,
  DocumentAccountLink,
  DocumentCostCenterLink,
  DocumentXmlData,
  DocumentDigitalSignature,
  DocumentDetraction
} from "@prisma/client";

// Define a more specific type for the document with all its relations
type FullDocumentLine = DocumentLine & {
  accountLinks: (DocumentLineAccountLink & { account: Pick<Account, 'id' | 'accountCode' | 'accountName'> })[];
  costCenterLinks: (DocumentLineCostCenterLink & { costCenter: Pick<CostCenter, 'id' | 'code' | 'name'> })[];
};

type FullDocument = Document & {
  supplier: Pick<Supplier, 'id' | 'businessName' | 'documentNumber' | 'documentType'> | null;
  lines: FullDocumentLine[];
  paymentTerms: DocumentPaymentTerm[];
  accountLinks: (DocumentAccountLink & { account: Pick<Account, 'id' | 'accountCode' | 'accountName'> })[];
  costCenterLinks: (DocumentCostCenterLink & { costCenter: Pick<CostCenter, 'id' | 'code' | 'name'> })[];
  xmlData: DocumentXmlData | null;
  digitalSignature: DocumentDigitalSignature | null;
  detraction: DocumentDetraction | null;
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<DocumentResponseDto> {
    this.logger.log(`Attempting to create document: ${createDocumentDto.series}-${createDocumentDto.number} for company ${createDocumentDto.companyId}`);

    const {
      lines,
      paymentTerms,
      accountLinks,
      costCenterLinks,
      xmlData,
      digitalSignature,
      detraction,
      ...documentData
    } = createDocumentDto;

    const fullNumber = `${documentData.series}-${documentData.number}`;

    try {
      const existingDocument = await this.prisma.document.findUnique({
        where: {
          companyId_fullNumber: {
            companyId: documentData.companyId,
            fullNumber: fullNumber,
          },
        },
      });

      if (existingDocument) {
        this.logger.warn(`Document ${fullNumber} already exists for company ${documentData.companyId}`);
        throw new ConflictException(`Document ${fullNumber} already exists`);
      }

      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: documentData.supplierId,
          companyId: documentData.companyId,
        },
      });

      if (!supplier) {
        this.logger.warn(`Supplier not found or does not belong to company ${documentData.companyId}: ${documentData.supplierId}`);
        throw new NotFoundException("Supplier not found or does not belong to company");
      }

      const netPayableAmount = new Prisma.Decimal(documentData.total).minus(
        new Prisma.Decimal(documentData.retentionAmount || 0),
      );
      const pendingAmount = netPayableAmount.minus(new Prisma.Decimal(0));

      this.logger.log(`Calculated amounts for ${fullNumber} - Net payable: ${netPayableAmount}, Pending: ${pendingAmount}`);

      return await this.prisma.$transaction(async (tx) => {
        this.logger.log(`Creating document ${fullNumber} in transaction...`);
        const document = await tx.document.create({
          data: {
            ...documentData,
            fullNumber,
            netPayableAmount,
            pendingAmount,
            updatedById: documentData.createdById, // Ensure this is set
          },
        });
        this.logger.log(`Document ${fullNumber} created with ID: ${document.id}`);

        if (lines && lines.length > 0) {
          this.logger.log(`Creating ${lines.length} document lines for ${document.id}...`);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const { accountLinks: lineAccountLinks, costCenterLinks: lineCostCenterLinks, ...lineData } = line;
            const createdLine = await tx.documentLine.create({
              data: { ...lineData, documentId: document.id, lineNumber: i + 1 },
            });
            if (lineAccountLinks && lineAccountLinks.length > 0) {
              await tx.documentLineAccountLink.createMany({
                data: lineAccountLinks.map((link) => ({ ...link, documentLineId: createdLine.id })),
              });
            }
            if (lineCostCenterLinks && lineCostCenterLinks.length > 0) {
              await tx.documentLineCostCenterLink.createMany({
                data: lineCostCenterLinks.map((link) => ({ ...link, documentLineId: createdLine.id })),
              });
            }
          }
        }

        if (paymentTerms && paymentTerms.length > 0) {
          await tx.documentPaymentTerm.createMany({
            data: paymentTerms.map((term, index) => ({
              ...term,
              documentId: document.id,
              termNumber: index + 1,
              dueDate: new Date(term.dueDate),
            })),
          });
        }
        // ... (similar createMany for accountLinks, costCenterLinks, xmlData, digitalSignature, detraction if they exist) ...
        if (accountLinks && accountLinks.length > 0) {
             await tx.documentAccountLink.createMany({
                data: accountLinks.map(link => ({ ...link, documentId: document.id }))
            });
        }
        if (costCenterLinks && costCenterLinks.length > 0) {
            await tx.documentCostCenterLink.createMany({
                data: costCenterLinks.map(link => ({ ...link, documentId: document.id }))
            });
        }
        if (xmlData) {
            await tx.documentXmlData.create({
                data: { ...xmlData, documentId: document.id, sunatProcessDate: xmlData.sunatProcessDate ? new Date(xmlData.sunatProcessDate) : null }
            });
        }
        if (digitalSignature) {
            await tx.documentDigitalSignature.create({
                data: { ...digitalSignature, documentId: document.id, signatureDate: digitalSignature.signatureDate ? new Date(digitalSignature.signatureDate) : null }
            });
        }
        if (detraction) {
            const detractionAmount = detraction.amount || 0;
            await tx.documentDetraction.create({
                data: { ...detraction, documentId: document.id, amount: detractionAmount, pendingAmount: detractionAmount, paymentDate: detraction.paymentDate ? new Date(detraction.paymentDate) : null }
            });
        }


        this.logger.log(`Transaction for document ${document.id} completed. Fetching complete document.`);
        const completeDocument = await tx.document.findUnique({
          where: { id: document.id },
          include: this.getDocumentIncludes(),
        });

        if (!completeDocument) {
          this.logger.error(`Failed to fetch created document with ID: ${document.id} post-transaction.`);
          // This should ideally not happen if the create was successful within the transaction.
          throw new InternalServerErrorException(`Critical error: Created document ${document.id} not found immediately after creation.`);
        }
        return this.mapToResponseDto(completeDocument);
      });
    } catch (error) {
      this.logger.error(`Error during document creation (${fullNumber}): ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Example: unique constraint violation
        if (error.code === 'P2002') {
          throw new ConflictException(`A document with similar unique properties (e.g., full number for company) already exists.`);
        }
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException("An unexpected error occurred while creating the document.");
    }
  }

  async fetchDocuments(companyId: string, filters: DocumentFiltersDto) {
    this.logger.log(`Fetching documents for company ${companyId} with filters: ${JSON.stringify(filters)}`);
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
    } = filters;

    const skip = (page - 1) * limit;
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
    };

    try {
      const [documents, total] = await this.prisma.$transaction([
        this.prisma.document.findMany({
          where,
          include: this.getDocumentIncludes(),
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        this.prisma.document.count({ where }),
      ]);
      this.logger.log(`Found ${total} documents for company ${companyId}`);
      return {
        data: documents.map((doc) => this.mapToResponseDto(doc)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
        this.logger.error(`Error fetching documents for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch documents.");
    }
  }

  async getDocumentById(id: string): Promise<DocumentResponseDto> {
    this.logger.log(`Fetching document by ID: ${id}`);
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: this.getDocumentIncludes(),
    });

    if (!document) {
      this.logger.warn(`Document not found with ID: ${id}`);
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    this.logger.log(`Document found: ${document.fullNumber}`);
    return this.mapToResponseDto(document);
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentResponseDto> {
    this.logger.log(`Attempting to update document: ${id}`);
    const existingDocument = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      this.logger.warn(`Document not found for update: ${id}`);
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existingDocument.status === DocumentStatus.PAID || existingDocument.status === DocumentStatus.CANCELLED) {
      this.logger.warn(`Attempt to update paid/cancelled document: ${id}`);
      throw new BadRequestException("Cannot update paid or cancelled documents");
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
    } = updateDocumentDto;

    let netPayableAmount = existingDocument.netPayableAmount;
    let pendingAmount = existingDocument.pendingAmount;

    if (documentData.total !== undefined) {
      netPayableAmount = new Prisma.Decimal(documentData.total).minus(
        new Prisma.Decimal(documentData.retentionAmount || existingDocument.retentionAmount.toNumber()),
      );
      pendingAmount = netPayableAmount.minus(existingDocument.conciliatedAmount);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.log(`Updating document ${id} in transaction...`);
        await tx.document.update({
          where: { id },
          data: {
            ...documentData,
            netPayableAmount,
            pendingAmount,
            updatedAt: new Date(), // Ensure updatedAt is always set
          },
        });

        // ... (Logic for updating lines, paymentTerms, etc. as in original, with logging)
        if (lines) {
            await tx.documentLineAccountLink.deleteMany({ where: { documentLine: { documentId: id } } });
            await tx.documentLineCostCenterLink.deleteMany({ where: { documentLine: { documentId: id } } });
            await tx.documentLine.deleteMany({ where: { documentId: id } });
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const { accountLinks: lineAccountLinks, costCenterLinks: lineCostCenterLinks, ...lineData } = line;
                const createdLine = await tx.documentLine.create({
                    data: { ...lineData, documentId: id, lineNumber: i + 1 }
                });
                if (lineAccountLinks && lineAccountLinks.length > 0) {
                    await tx.documentLineAccountLink.createMany({
                        data: lineAccountLinks.map(link => ({ ...link, documentLineId: createdLine.id }))
                    });
                }
                if (lineCostCenterLinks && lineCostCenterLinks.length > 0) {
                     await tx.documentLineCostCenterLink.createMany({
                        data: lineCostCenterLinks.map(link => ({ ...link, documentLineId: createdLine.id }))
                    });
                }
            }
        }
        if (paymentTerms) {
            await tx.documentPaymentTerm.deleteMany({ where: { documentId: id } });
            await tx.documentPaymentTerm.createMany({
                data: paymentTerms.map((term, index) => ({ ...term, documentId: id, termNumber: index + 1, dueDate: new Date(term.dueDate) }))
            });
        }
        if (accountLinks !== undefined) {
            await tx.documentAccountLink.deleteMany({ where: { documentId: id } });
            if (accountLinks.length > 0) {
                await tx.documentAccountLink.createMany({
                    data: accountLinks.map(link => ({ ...link, documentId: id }))
                });
            }
        }
        if (costCenterLinks !== undefined) {
            await tx.documentCostCenterLink.deleteMany({ where: { documentId: id } });
            if (costCenterLinks.length > 0) {
                await tx.documentCostCenterLink.createMany({
                    data: costCenterLinks.map(link => ({ ...link, documentId: id }))
                });
            }
        }
        if (xmlData) {
            await tx.documentXmlData.upsert({
                where: { documentId: id },
                update: { ...xmlData, sunatProcessDate: xmlData.sunatProcessDate ? new Date(xmlData.sunatProcessDate) : null, updatedAt: new Date() },
                create: { ...xmlData, documentId: id, sunatProcessDate: xmlData.sunatProcessDate ? new Date(xmlData.sunatProcessDate) : null }
            });
        }
        if (digitalSignature) {
             await tx.documentDigitalSignature.upsert({
                where: { documentId: id },
                update: { ...digitalSignature, signatureDate: digitalSignature.signatureDate ? new Date(digitalSignature.signatureDate) : null, updatedAt: new Date() },
                create: { ...digitalSignature, documentId: id, signatureDate: digitalSignature.signatureDate ? new Date(digitalSignature.signatureDate) : null }
            });
        }
        if (detraction) {
            const detractionAmount = detraction.amount || 0;
            const existingDetraction = await tx.documentDetraction.findUnique({ where: { documentId: id } });
            await tx.documentDetraction.upsert({
                where: { documentId: id },
                update: { ...detraction, amount: detractionAmount, pendingAmount: new Prisma.Decimal(detractionAmount).minus(existingDetraction?.conciliatedAmount || 0), paymentDate: detraction.paymentDate ? new Date(detraction.paymentDate) : null, updatedAt: new Date() },
                create: { ...detraction, documentId: id, amount: detractionAmount, pendingAmount: detractionAmount, paymentDate: detraction.paymentDate ? new Date(detraction.paymentDate) : null }
            });
        }

        this.logger.log(`Transaction for document update ${id} completed. Fetching complete document.`);
        const updatedDocument = await tx.document.findUnique({
          where: { id },
          include: this.getDocumentIncludes(),
        });
        if (!updatedDocument) {
            this.logger.error(`Failed to fetch updated document with ID: ${id} post-transaction.`);
            throw new InternalServerErrorException(`Critical error: Updated document ${id} not found immediately after update.`);
        }
        this.logger.log(`Document ${id} updated successfully.`);
        return this.mapToResponseDto(updatedDocument);
      });
    } catch (error) {
      this.logger.error(`Error updating document ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
         throw new NotFoundException(`Document with ID ${id} not found during update transaction.`);
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException("An unexpected error occurred while updating the document.");
    }
  }

  async deleteDocument(id: string): Promise<void> {
    this.logger.log(`Attempting to delete document: ${id}`);
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      this.logger.warn(`Document not found for deletion: ${id}`);
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.status === DocumentStatus.PAID || document.conciliatedAmount.greaterThan(0)) {
      this.logger.warn(`Attempt to delete paid or conciliated document: ${id}`);
      throw new BadRequestException("Cannot delete paid or conciliated documents");
    }

    try {
      await this.prisma.document.delete({
        where: { id },
      });
      this.logger.log(`Document ${id} deleted successfully.`);
    } catch (error) {
      this.logger.error(`Error deleting document ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        // Should be caught by the findUnique check above, but as a safeguard.
        throw new NotFoundException(`Document with ID ${id} not found for deletion.`);
      }
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') { // Foreign key constraint
        throw new ConflictException(`Cannot delete document ${id} due to existing related records.`);
      }
      throw new InternalServerErrorException("An unexpected error occurred while deleting the document.");
    }
  }

  async getDocumentsByStatus(companyId: string, status: DocumentStatus) {
    this.logger.log(`Fetching documents for company ${companyId} by status: ${status}`);
    try {
        const documents = await this.prisma.document.findMany({
          where: { companyId, status },
          include: this.getDocumentIncludes(),
          orderBy: { issueDate: "desc" },
        });
        this.logger.log(`Found ${documents.length} documents with status ${status} for company ${companyId}`);
        return documents.map((doc) => this.mapToResponseDto(doc));
    } catch (error) {
        this.logger.error(`Error fetching documents by status for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch documents by status.");
    }
  }

  async getDocumentsBySupplier(companyId: string, supplierId: string, filters: DocumentFiltersDto) {
    this.logger.log(`Fetching documents for company ${companyId} by supplier ${supplierId}`);
    return this.fetchDocuments(companyId, { ...filters, supplierId });
  }

  async getDocumentsByDateRange(companyId: string, startDate: string, endDate: string) {
    this.logger.log(`Fetching documents for company ${companyId} by date range: ${startDate} - ${endDate}`);
    try {
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
        });
        this.logger.log(`Found ${documents.length} documents in date range for company ${companyId}`);
        return documents.map((doc) => this.mapToResponseDto(doc));
    } catch (error) {
        this.logger.error(`Error fetching documents by date range for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch documents by date range.");
    }
  }

  async updateDocumentStatus(id: string, status: DocumentStatus, updatedById: string): Promise<DocumentResponseDto> {
    this.logger.log(`Updating status of document ${id} to ${status} by user ${updatedById}`);
    // Ensure document exists before attempting update
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
        this.logger.warn(`Document not found for status update: ${id}`);
        throw new NotFoundException(`Document with ID ${id} not found.`);
    }

    try {
        const updatedDocument = await this.prisma.document.update({
          where: { id },
          data: { status, updatedById, updatedAt: new Date() },
          include: this.getDocumentIncludes(),
        });
        this.logger.log(`Document ${id} status updated to ${status}`);
        return this.mapToResponseDto(updatedDocument);
    } catch (error) {
        this.logger.error(`Error updating status for document ${id}: ${error.message}`, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
             throw new NotFoundException(`Document with ID ${id} not found during status update.`);
        }
        throw new InternalServerErrorException("Failed to update document status.");
    }
  }

  async conciliateDocument(id: string, conciliateDto: ConciliateDocumentDto): Promise<DocumentResponseDto> {
    this.logger.log(`Conciliating document ${id} with amount ${conciliateDto.conciliatedAmount}`);
    const document = await this.prisma.document.findUnique({ where: { id } });

    if (!document) {
      this.logger.warn(`Document not found for conciliation: ${id}`);
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const newConciliatedAmount = document.conciliatedAmount.plus(new Prisma.Decimal(conciliateDto.conciliatedAmount));
    const newPendingAmount = document.netPayableAmount.minus(newConciliatedAmount);

    if (newConciliatedAmount.greaterThan(document.netPayableAmount)) {
      this.logger.warn(`Conciliation amount for document ${id} exceeds net payable amount.`);
      throw new BadRequestException("Conciliated amount cannot exceed net payable amount");
    }

    try {
        const updatedDocument = await this.prisma.document.update({
          where: { id },
          data: {
            conciliatedAmount: newConciliatedAmount,
            pendingAmount: newPendingAmount,
            status: newPendingAmount.isLessThanOrEqualTo(0) ? DocumentStatus.PAID : document.status,
            updatedAt: new Date(),
          },
          include: this.getDocumentIncludes(),
        });
        this.logger.log(`Document ${id} conciliated. New pending amount: ${newPendingAmount}`);
        return this.mapToResponseDto(updatedDocument);
    } catch (error) {
        this.logger.error(`Error conciliating document ${id}: ${error.message}`, error.stack);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
             throw new NotFoundException(`Document with ID ${id} not found during conciliation update.`);
        }
        throw new InternalServerErrorException("Failed to conciliate document.");
    }
  }

  async getDocumentSummary(companyId: string): Promise<DocumentSummaryResponseDto> {
    this.logger.log(`Fetching document summary for company ${companyId}`);
    try {
        const [totalDocuments, statusCounts, monthlyTotals, currencySummary, supplierSummary] = await this.prisma.$transaction([
          this.prisma.document.count({ where: { companyId } }),
          this.prisma.document.groupBy({
            by: ["status"],
            where: { companyId },
            _count: { status: true },
            _sum: { total: true },
          }),
          this.prisma.document.groupBy({
            by: ["issueDate"],
            where: { companyId, issueDate: { gte: new Date(new Date().getFullYear(), 0, 1) } },
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
        ]);

        const supplierIds = supplierSummary.map((s) => s.supplierId);
        const suppliers = supplierIds.length > 0 ? await this.prisma.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, businessName: true },
        }) : [];
        const supplierMap = new Map(suppliers.map((s) => [s.id, s.businessName]));

        this.logger.log(`Document summary retrieved for company ${companyId}`);
        return {
          totalDocuments,
          statusCounts: statusCounts.map((sc) => ({
            status: sc.status,
            _count: sc._count,
            _sum: { total: sc._sum.total ? sc._sum.total.toNumber() : null },
          })),
          monthlyTotals: monthlyTotals.map((mt) => ({
            month: mt.issueDate.toISOString().substring(0, 7),
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
        };
    } catch (error) {
        this.logger.error(`Error fetching document summary for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch document summary.");
    }
  }

  async getDocumentsWithPendingDetractions(companyId: string) {
    this.logger.log(`Fetching documents with pending detractions for company ${companyId}`);
    try {
        const documents = await this.prisma.document.findMany({
          where: {
            companyId,
            detraction: { hasDetraction: true, isConciliated: false },
          },
          include: {
            supplier: { select: { id: true, businessName: true, documentNumber: true } },
            detraction: true,
          },
          orderBy: { issueDate: "desc" },
        });
        this.logger.log(`Found ${documents.length} documents with pending detractions for company ${companyId}`);
        return documents.map((doc) => this.mapToResponseDto(doc));
    } catch (error) {
        this.logger.error(`Error fetching documents with pending detractions for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch documents with pending detractions.");
    }
  }

  async getDocumentsWithXmlData(companyId: string) {
    this.logger.log(`Fetching documents with XML data for company ${companyId}`);
     try {
        const documents = await this.prisma.document.findMany({
          where: { companyId, xmlData: { isNot: null } },
          include: {
            supplier: { select: { id: true, businessName: true, documentNumber: true } },
            xmlData: true,
          },
          orderBy: { createdAt: "desc" },
        });
        this.logger.log(`Found ${documents.length} documents with XML data for company ${companyId}`);
        return documents.map((doc) => this.mapToResponseDto(doc));
    } catch (error) {
        this.logger.error(`Error fetching documents with XML data for company ${companyId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException("Failed to fetch documents with XML data.");
    }
  }

  private getDocumentIncludes() {
    return {
      supplier: {
        select: {
          id: true,
          businessName: true,
          documentNumber: true,
          documentType: true,
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
    };
  }

  private mapToResponseDto(document: FullDocument): DocumentResponseDto {
    // This mapping logic remains the same.
    // Ensure all properties are correctly typed if 'any' is used.
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
      exchangeRate: document.exchangeRate, // Assuming this is already number or needs to be
      subtotal: document.subtotal.toNumber(),
      igv: document.igv.toNumber(),
      otherTaxes: document.otherTaxes?.toNumber() || 0, // Assuming otherTaxes can be null
      total: document.total.toNumber(),
      hasRetention: document.hasRetention,
      retentionAmount: document.retentionAmount.toNumber(),
      retentionPercentage: document.retentionPercentage, // Assuming this is already number
      netPayableAmount: document.netPayableAmount.toNumber(),
      conciliatedAmount: document.conciliatedAmount.toNumber(),
      pendingAmount: document.pendingAmount.toNumber(),
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
      lines: document.lines.map(line => ({
        ...line,
        quantity: line.quantity.toNumber(),
        unitPrice: line.unitPrice.toNumber(),
        unitPriceWithTax: line.unitPriceWithTax.toNumber(),
        lineTotal: line.lineTotal.toNumber(),
        igvAmount: line.igvAmount.toNumber(),
        referencePrice: line.referencePrice?.toNumber(),
        allowanceAmount: line.allowanceAmount?.toNumber() || 0,
        chargeAmount: line.chargeAmount?.toNumber() || 0,
        taxableAmount: line.taxableAmount.toNumber(),
        exemptAmount: line.exemptAmount.toNumber(),
        inaffectedAmount: line.inaffectedAmount.toNumber(),
        accountLinks: line.accountLinks.map(al => ({
          ...al,
          amount: al.amount.toNumber(),
          // account is already selected with correct fields
        })),
        costCenterLinks: line.costCenterLinks.map(ccl => ({
          ...ccl,
          amount: ccl.amount.toNumber(),
          // costCenter is already selected with correct fields
        })),
      })),
      paymentTerms: document.paymentTerms.map(pt => ({
        ...pt,
        amount: pt.amount.toNumber(),
      })),
      accountLinks: document.accountLinks.map(al => ({
        ...al,
        amount: al.amount.toNumber(),
        // account is already selected with correct fields
      })),
      costCenterLinks: document.costCenterLinks.map(ccl => ({
        ...ccl,
        amount: ccl.amount.toNumber(),
        // costCenter is already selected with correct fields
      })),
      xmlData: document.xmlData, // Assuming DTO matches Prisma or is handled
      digitalSignature: document.digitalSignature, // Assuming DTO matches Prisma or is handled
      detraction: document.detraction ? {
        ...document.detraction,
        amount: document.detraction.amount.toNumber(),
        percentage: document.detraction.percentage, // Assuming this is number
        conciliatedAmount: document.detraction.conciliatedAmount.toNumber(),
        pendingAmount: document.detraction.pendingAmount.toNumber(),
      } : null,
    };
  }
}
