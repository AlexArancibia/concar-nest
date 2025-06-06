import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { DocumentsService } from "./documents.service"
import { CreateDocumentDto } from "./dto/create-document.dto"
import { UpdateDocumentDto } from "./dto/update-document.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@UseGuards(AuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("company/:companyId")
  async fetchDocuments(@Param('companyId') companyId: string, @Query() pagination: PaginationDto) {
    return this.documentsService.fetchDocuments(companyId, pagination)
  }

  @Post()
  async createDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.createDocument(createDocumentDto);
  }

  @Post("upload-xml")
  @UseInterceptors(FileInterceptor("xmlFile"))
  async uploadXmlDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('companyId') companyId: string,
    @Body('createdById') createdById: string,
  ) {
    const xmlContent = file.buffer.toString("utf-8")
    return this.documentsService.processXmlDocument(xmlContent, companyId, createdById)
  }

  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }

  @Patch(":id")
  async updateDocument(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.updateDocument(id, updateDocumentDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string) {
    await this.documentsService.deleteDocument(id);
  }

  @Get('supplier/:supplierId')
  async getDocumentsBySupplier(@Param('supplierId') supplierId: string) {
    return this.documentsService.getDocumentsBySupplier(supplierId);
  }

  @Get("company/:companyId/date-range")
  async getDocumentsByDateRange(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.documentsService.getDocumentsByDateRange(companyId, new Date(startDate), new Date(endDate))
  }

  @Post(':id/validate-sunat')
  @HttpCode(HttpStatus.OK)
  async validateWithSunat(@Param('id') id: string) {
    await this.documentsService.validateWithSunat(id)
    return { message: 'Document validation initiated' }
  }

  @Post(':id/generate-cdr')
  async generateCdr(@Param('id') id: string) {
    const cdrPath = await this.documentsService.generateCdr(id)
    return { cdrPath }
  }
}
