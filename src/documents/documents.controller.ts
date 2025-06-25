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
} from "@nestjs/common";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto, UpdateDocumentStatusDto, ConciliateDocumentDto } from "./dto/update-document.dto";
import { DocumentFiltersDto } from "./dto/document-filters.dto";
import { DocumentStatus } from "@prisma/client";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { DocumentResponseDto, DocumentSummaryResponseDto } from "./dto/document-response.dto";

type PaginatedDocumentsResponse = {
  data: DocumentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@UseGuards(AuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchDocuments(
    @Param('companyId') companyId: string,
    @Query() filters: DocumentFiltersDto,
  ): Promise<ApiResponse<PaginatedDocumentsResponse>> {
    const data = await this.documentsService.fetchDocuments(companyId, filters);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Documents fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(@Body() createDocumentDto: CreateDocumentDto): Promise<ApiResponse<DocumentResponseDto>> {
    const data = await this.documentsService.createDocument(createDocumentDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Document created successfully",
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDocumentById(@Param('id') id: string): Promise<ApiResponse<DocumentResponseDto>> {
    const data = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    const data = await this.documentsService.updateDocument(id, updateDocumentDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document updated successfully",
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.documentsService.deleteDocument(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document deleted successfully",
      data: null,
    };
  }

  @Get("company/:companyId/status/:status")
  @HttpCode(HttpStatus.OK)
  async getDocumentsByStatus(
    @Param('companyId') companyId: string,
    @Param('status') status: DocumentStatus,
  ): Promise<ApiResponse<DocumentResponseDto[]>> {
    const data = await this.documentsService.getDocumentsByStatus(companyId, status);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Documents retrieved successfully by status",
      data,
    };
  }

  @Get("company/:companyId/supplier/:supplierId")
  @HttpCode(HttpStatus.OK)
  async getDocumentsBySupplier(
    @Param('companyId') companyId: string,
    @Param('supplierId') supplierId: string,
    @Query() filters: DocumentFiltersDto,
  ): Promise<ApiResponse<PaginatedDocumentsResponse>> {
    const data = await this.documentsService.getDocumentsBySupplier(companyId, supplierId, filters);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Documents retrieved successfully by supplier",
      data,
    };
  }

  @Get("company/:companyId/date-range")
  @HttpCode(HttpStatus.OK)
  async getDocumentsByDateRange(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ApiResponse<DocumentResponseDto[]>> {
    const data = await this.documentsService.getDocumentsByDateRange(companyId, startDate, endDate);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Documents retrieved successfully by date range",
      data,
    };
  }

  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  async updateDocumentStatus(
    @Param('id') id: string,
    @Query('status') status: DocumentStatus,
    @Body() body: UpdateDocumentStatusDto,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    const data = await this.documentsService.updateDocumentStatus(id, status, body.updatedById);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document status updated successfully",
      data,
    };
  }

  @Patch(":id/conciliate")
  @HttpCode(HttpStatus.OK)
  async conciliateDocument(
    @Param('id') id: string,
    @Body() conciliateDto: ConciliateDocumentDto,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    const data = await this.documentsService.conciliateDocument(id, conciliateDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document conciliated successfully",
      data,
    };
  }

  @Get("company/:companyId/summary")
  @HttpCode(HttpStatus.OK)
  async getDocumentSummary(@Param('companyId') companyId: string): Promise<ApiResponse<DocumentSummaryResponseDto>> {
    const data = await this.documentsService.getDocumentSummary(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document summary retrieved successfully",
      data,
    };
  }

  @Get("company/:companyId/pending-detractions")
  @HttpCode(HttpStatus.OK)
  async getDocumentsWithPendingDetractions(@Param('companyId') companyId: string): Promise<ApiResponse<DocumentResponseDto[]>> {
    const data = await this.documentsService.getDocumentsWithPendingDetractions(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Documents with pending detractions retrieved successfully",
      data,
    };
  }

  @Get("company/:companyId/with-xml")
  @HttpCode(HttpStatus.OK)
  async getDocumentsWithXmlData(@Param('companyId') companyId: string): Promise<ApiResponse<DocumentResponseDto[]>> {
    const data = await this.documentsService.getDocumentsWithXmlData(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Documents with XML data retrieved successfully",
      data,
    };
  }

  // XML Data specific endpoints
  @Get(":id/xml")
  @HttpCode(HttpStatus.OK)
  async getDocumentXmlData(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document XML data retrieved successfully",
      data: document.xmlData,
    };
  }

  // Digital Signature specific endpoints
  @Get(":id/signature")
  @HttpCode(HttpStatus.OK)
  async getDocumentDigitalSignature(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document digital signature retrieved successfully",
      data: document.digitalSignature,
    };
  }

  // Detraction specific endpoints
  @Get(":id/detraction")
  @HttpCode(HttpStatus.OK)
  async getDocumentDetraction(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document detraction data retrieved successfully",
      data: document.detraction,
    };
  }

  // Account and Cost Center Links
  @Get(":id/account-links")
  @HttpCode(HttpStatus.OK)
  async getDocumentAccountLinks(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document account links retrieved successfully",
      data: document.accountLinks,
    };
  }

  @Get(":id/cost-center-links")
  @HttpCode(HttpStatus.OK)
  async getDocumentCostCenterLinks(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document cost center links retrieved successfully",
      data: document.costCenterLinks,
    };
  }

  // Lines specific endpoints
  @Get(":id/lines")
  @HttpCode(HttpStatus.OK)
  async getDocumentLines(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document lines retrieved successfully",
      data: document.lines,
    };
  }

  @Get(":id/payment-terms")
  @HttpCode(HttpStatus.OK)
  async getDocumentPaymentTerms(@Param('id') id: string): Promise<ApiResponse<any>> {
    const document = await this.documentsService.getDocumentById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Document payment terms retrieved successfully",
      data: document.paymentTerms,
    };
  }

  // Bulk operations
  @Patch("bulk/status")
  @HttpCode(HttpStatus.OK)
  async bulkUpdateStatus(
    @Body() body: {
      documentIds: string[],
      status: DocumentStatus,
      updatedById: string
    }
  ): Promise<ApiResponse<DocumentResponseDto[]>> {
    const results = await Promise.all(
      body.documentIds.map(id =>
        this.documentsService.updateDocumentStatus(id, body.status, body.updatedById)
      )
    );
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bulk document status update successful",
      data: results,
    };
  }

  @Delete("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkDeleteDocuments(@Body() body: { documentIds: string[] }): Promise<ApiResponse<null>> {
    await Promise.all(
      body.documentIds.map(id => this.documentsService.deleteDocument(id))
    );
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bulk document deletion successful",
      data: null,
    };
  }
}
