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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { SunatService } from "./sunat.service"
import { PrismaService } from "../prisma/prisma.service"
import { CreateSunatRheDto } from "./dto/create-sunat-rhe.dto"
import { UpdateSunatRheDto } from "./dto/update-sunat-rhe.dto"
import { CreateSunatInvoiceDto } from "./dto/create-sunat-invoice.dto"
import { UpdateSunatInvoiceDto } from "./dto/update-sunat-invoice.dto"
import { PaginationDto } from "../common/dto/pagination.dto"
import { SunatValidationDto, SunatValidationResponseDto } from "./dto/sunat-validation.dto"

@UseGuards(AuthGuard)
@Controller("sunat")
export class SunatController {
  constructor(
    private readonly sunatService: SunatService,
    private readonly prisma: PrismaService
  ) {}

  // ============================================================================
  // SUNAT RHE ENDPOINTS
  // ============================================================================

  @Get("rhe/company/:companyId")
  async fetchSunatRhe(
    @Param("companyId") companyId: string, 
    @Query() pagination: PaginationDto
  ) {
    if (pagination.search) {
      return this.sunatService.searchSunatRhe(companyId, pagination.search, pagination)
    }
    return this.sunatService.fetchSunatRhe(companyId, pagination)
  }

  @Post("rhe")
  async createSunatRhe(@Body() createSunatRheDto: CreateSunatRheDto) {
    return this.sunatService.createSunatRhe(createSunatRheDto)
  }

  @Get("rhe/:id")
  async getSunatRheById(@Param("id") id: string) {
    return this.sunatService.getSunatRheById(id)
  }

  @Patch("rhe/:id")
  async updateSunatRhe(@Param("id") id: string, @Body() updateSunatRheDto: UpdateSunatRheDto) {
    return this.sunatService.updateSunatRhe(id, updateSunatRheDto)
  }

  @Delete("rhe/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSunatRhe(@Param("id") id: string) {
    await this.sunatService.deleteSunatRhe(id)
  }

  @Get("rhe/company/:companyId/period")
  async getSunatRheByPeriod(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return this.sunatService.getSunatRheByPeriod(companyId, start, end)
  }

  @Get("rhe/company/:companyId/search")
  async searchSunatRhe(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.sunatService.searchSunatRhe(companyId, searchTerm, pagination)
  }

  @Post("rhe/import")
  @UseInterceptors(FileInterceptor("file"))
  async importSunatRheFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("companyId") companyId: string,
    @Body("userId") userId: string,
  ) {
    // Here you would parse the file and extract the RHE records
    // This is a simplified example - you'd need to implement proper file parsing
    const rheRecords = [] // Parse file content here
    const fileName = file.originalname

    return this.sunatService.importSunatRheFromFile(companyId, userId, rheRecords, fileName)
  }

  // ============================================================================
  // SUNAT INVOICES ENDPOINTS
  // ============================================================================

  @Get("invoices/company/:companyId")
  async fetchSunatInvoices(
    @Param("companyId") companyId: string, 
    @Query() pagination: PaginationDto
  ) {
    if (pagination.search) {
      return this.sunatService.searchSunatInvoices(companyId, pagination.search, pagination)
    }
    return this.sunatService.fetchSunatInvoices(companyId, pagination)
  }

  @Post("invoices")
  async createSunatInvoice(@Body() createSunatInvoiceDto: CreateSunatInvoiceDto) {
    return this.sunatService.createSunatInvoice(createSunatInvoiceDto)
  }

  @Get("invoices/:id")
  async getSunatInvoiceById(@Param("id") id: string) {
    return this.sunatService.getSunatInvoiceById(id)
  }

  @Patch("invoices/:id")
  async updateSunatInvoice(@Param("id") id: string, @Body() updateSunatInvoiceDto: UpdateSunatInvoiceDto) {
    return this.sunatService.updateSunatInvoice(id, updateSunatInvoiceDto)
  }

  @Delete("invoices/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSunatInvoice(@Param("id") id: string) {
    await this.sunatService.deleteSunatInvoice(id)
  }

  @Get("invoices/company/:companyId/period/:period")
  async getSunatInvoicesByPeriod(@Param("companyId") companyId: string, @Param("period") period: string) {
    return this.sunatService.getSunatInvoicesByPeriod(companyId, period)
  }

  @Get("invoices/company/:companyId/search")
  async searchSunatInvoices(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.sunatService.searchSunatInvoices(companyId, searchTerm, pagination)
  }

  @Post("invoices/import")
  @UseInterceptors(FileInterceptor("file"))
  async importSunatInvoicesFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("companyId") companyId: string,
    @Body("userId") userId: string,
  ) {
    // Here you would parse the file and extract the invoice records
    // This is a simplified example - you'd need to implement proper file parsing
    const invoiceRecords = [] // Parse file content here
    const fileName = file.originalname

    return this.sunatService.importSunatInvoicesFromFile(companyId, userId, invoiceRecords, fileName)
  }

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  @Get("company/:companyId/stats")
  async getSunatStats(@Param("companyId") companyId: string) {
    return this.sunatService.getSunatStats(companyId)
  }

  @Post("validate")
  async validateDocumentsAgainstSunat(
    @Body() validationDto: SunatValidationDto
  ): Promise<SunatValidationResponseDto> {
    const { companyId, startDate, endDate } = validationDto
    
    // Obtener TODOS los documentos de la empresa en el rango de fechas (sin límite)
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        issueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      select: {
        id: true,
        fullNumber: true,
        supplier: {
          select: {
            businessName: true
          }
        }
      },
      // Sin paginación - traer todos los documentos
      take: undefined,
      skip: undefined
    })

    const documentNumbers = documents.map(doc => doc.fullNumber)
    
    console.log(`Validando ${documents.length} documentos de la empresa ${companyId} entre ${startDate} y ${endDate}`)
    
    const validationResults = await this.sunatService.validateDocumentsAgainstSunat(
      companyId,
      startDate,
      endDate,
      documentNumbers
    )

    // Mapear resultados con información de documentos
    const mappedResults = validationResults.results.map(result => {
      const document = documents.find(doc => doc.fullNumber === result.documentNumber)
      return {
        documentId: document?.id || "",
        documentNumber: result.documentNumber,
        supplierName: document?.supplier?.businessName || "Sin proveedor",
        found: result.found,
        sunatSource: result.sunatSource,
        sunatData: result.sunatData,
        error: result.error
      }
    })

    return {
      results: mappedResults,
      summary: validationResults.summary
    }
  }
}
