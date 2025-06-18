import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { DocumentsService } from "./documents.service"
import { CreateDocumentDto } from "./dto/create-document.dto"
import { UpdateDocumentDto, UpdateDocumentStatusDto, ConciliateDocumentDto } from "./dto/update-document.dto"
import { DocumentQueryDto } from "./dto/document-query.dto"
import { DocumentStatus } from "@prisma/client"

@UseGuards(AuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("company/:companyId")
  async fetchDocuments(@Param('companyId') companyId: string, @Query() query: DocumentQueryDto) {
    return this.documentsService.fetchDocuments(companyId, query)
  }

  @Post()
  async createDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.createDocument(createDocumentDto)
  }

  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id)
  }

  @Patch(":id")
  async updateDocument(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.updateDocument(id, updateDocumentDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string) {
    await this.documentsService.deleteDocument(id)
  }

  @Get("company/:companyId/status/:status")
  async getDocumentsByStatus(@Param('companyId') companyId: string, @Param('status') status: DocumentStatus) {
    return this.documentsService.getDocumentsByStatus(companyId, status)
  }

  @Get("company/:companyId/supplier/:supplierId")
  async getDocumentsBySupplier(
    @Param('companyId') companyId: string,
    @Param('supplierId') supplierId: string,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentsService.getDocumentsBySupplier(companyId, supplierId, query)
  }

  @Get("company/:companyId/date-range")
  async getDocumentsByDateRange(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.documentsService.getDocumentsByDateRange(companyId, startDate, endDate)
  }

  @Patch(":id/status")
  async updateDocumentStatus(
    @Param('id') id: string,
    @Query('status') status: DocumentStatus,
    @Body() body: UpdateDocumentStatusDto,
  ) {
    return this.documentsService.updateDocumentStatus(id, status, body.updatedById)
  }

  @Patch(":id/conciliate")
  async conciliateDocument(@Param('id') id: string, @Body() conciliateDto: ConciliateDocumentDto) {
    return this.documentsService.conciliateDocument(id, conciliateDto)
  }

  @Get("company/:companyId/summary")
  async getDocumentSummary(@Param('companyId') companyId: string) {
    return this.documentsService.getDocumentSummary(companyId)
  }

  @Get("company/:companyId/pending-detractions")
  async getDocumentsWithPendingDetractions(@Param('companyId') companyId: string) {
    return this.documentsService.getDocumentsWithPendingDetractions(companyId)
  }

  @Get("company/:companyId/with-xml")
  async getDocumentsWithXmlData(@Param('companyId') companyId: string) {
    return this.documentsService.getDocumentsWithXmlData(companyId)
  }

  // XML Data specific endpoints
  @Get(":id/xml")
  async getDocumentXmlData(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.xmlData
  }

  // Digital Signature specific endpoints
  @Get(":id/signature")
  async getDocumentDigitalSignature(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.digitalSignature
  }

  // Detraction specific endpoints
  @Get(":id/detraction")
  async getDocumentDetraction(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.detraction
  }

  // Account and Cost Center Links
  @Get(":id/account-links")
  async getDocumentAccountLinks(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.accountLinks
  }

  @Get(":id/cost-center-links")
  async getDocumentCostCenterLinks(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.costCenterLinks
  }

  // Lines specific endpoints
  @Get(":id/lines")
  async getDocumentLines(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.lines
  }

  @Get(":id/payment-terms")
  async getDocumentPaymentTerms(@Param('id') id: string) {
    const document = await this.documentsService.getDocumentById(id)
    return document.paymentTerms
  }

  // Bulk operations
  @Patch("bulk/status")
  async bulkUpdateStatus(
    @Body() body: { 
      documentIds: string[], 
      status: DocumentStatus, 
      updatedById: string 
    }
  ) {
    const results = await Promise.all(
      body.documentIds.map(id => 
        this.documentsService.updateDocumentStatus(id, body.status, body.updatedById)
      )
    )
    return results
  }

  @Delete("bulk")
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkDeleteDocuments(@Body() body: { documentIds: string[] }) {
    await Promise.all(
      body.documentIds.map(id => this.documentsService.deleteDocument(id))
    )
  }
}
