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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { SunatService } from "./sunat.service";
import { CreateSunatRheDto } from "./dto/create-sunat-rhe.dto";
import { UpdateSunatRheDto } from "./dto/update-sunat-rhe.dto";
import { CreateSunatInvoiceDto } from "./dto/create-sunat-invoice.dto";
import { UpdateSunatInvoiceDto } from "./dto/update-sunat-invoice.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { SunatRhe, SunatInvoice } from "@prisma/client"; // Assuming these types

// Define more specific types if available
type SunatImportResult = any; // Replace with actual type from service
type SunatStatsResult = any; // Replace with actual type from service

@UseGuards(AuthGuard)
@Controller("sunat")
export class SunatController {
  constructor(private readonly sunatService: SunatService) {}

  // ============================================================================
  // SUNAT RHE ENDPOINTS
  // ============================================================================

  @Get("rhe/company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchSunatRhe(
    @Param("companyId") companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<SunatRhe>>> {
    const data = await this.sunatService.fetchSunatRhe(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT RHE records fetched successfully",
      data,
    };
  }

  @Post("rhe")
  @HttpCode(HttpStatus.CREATED)
  async createSunatRhe(@Body() createSunatRheDto: CreateSunatRheDto): Promise<ApiResponse<SunatRhe>> {
    const data = await this.sunatService.createSunatRhe(createSunatRheDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "SUNAT RHE record created successfully",
      data,
    };
  }

  @Get("rhe/:id")
  @HttpCode(HttpStatus.OK)
  async getSunatRheById(@Param("id") id: string): Promise<ApiResponse<SunatRhe | null>> {
    const data = await this.sunatService.getSunatRheById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "SUNAT RHE record not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT RHE record retrieved successfully",
      data,
    };
  }

  @Patch("rhe/:id")
  @HttpCode(HttpStatus.OK)
  async updateSunatRhe(
    @Param("id") id: string,
    @Body() updateSunatRheDto: UpdateSunatRheDto,
  ): Promise<ApiResponse<SunatRhe>> {
    const data = await this.sunatService.updateSunatRhe(id, updateSunatRheDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT RHE record updated successfully",
      data,
    };
  }

  @Delete("rhe/:id")
  @HttpCode(HttpStatus.OK)
  async deleteSunatRhe(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.sunatService.deleteSunatRhe(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT RHE record deleted successfully",
      data: null,
    };
  }

  @Get("rhe/company/:companyId/period")
  @HttpCode(HttpStatus.OK)
  async getSunatRheByPeriod(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ): Promise<ApiResponse<SunatRhe[]>> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const data = await this.sunatService.getSunatRheByPeriod(companyId, start, end);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT RHE records for period retrieved successfully",
      data,
    };
  }

  @Get("rhe/company/:companyId/search")
  @HttpCode(HttpStatus.OK)
  async searchSunatRhe(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<SunatRhe>>> {
    const data = await this.sunatService.searchSunatRhe(companyId, searchTerm, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT RHE records searched successfully",
      data,
    };
  }

  @Post("rhe/import")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async importSunatRheFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("companyId") companyId: string,
    @Body("userId") userId: string,
  ): Promise<ApiResponse<SunatImportResult>> {
    // Assuming file parsing happens in the service or a dedicated parser
    const rheRecords = []; // This should be populated by actual file parsing logic
    const fileName = file.originalname;
    const data = await this.sunatService.importSunatRheFromFile(companyId, userId, rheRecords, fileName);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "SUNAT RHE records imported successfully",
      data,
    };
  }

  // ============================================================================
  // SUNAT INVOICES ENDPOINTS
  // ============================================================================

  @Get("invoices/company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchSunatInvoices(
    @Param("companyId") companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<SunatInvoice>>> {
    const data = await this.sunatService.fetchSunatInvoices(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT invoices fetched successfully",
      data,
    };
  }

  @Post("invoices")
  @HttpCode(HttpStatus.CREATED)
  async createSunatInvoice(@Body() createSunatInvoiceDto: CreateSunatInvoiceDto): Promise<ApiResponse<SunatInvoice>> {
    const data = await this.sunatService.createSunatInvoice(createSunatInvoiceDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "SUNAT invoice created successfully",
      data,
    };
  }

  @Get("invoices/:id")
  @HttpCode(HttpStatus.OK)
  async getSunatInvoiceById(@Param("id") id: string): Promise<ApiResponse<SunatInvoice | null>> {
    const data = await this.sunatService.getSunatInvoiceById(id);
     if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "SUNAT invoice not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT invoice retrieved successfully",
      data,
    };
  }

  @Patch("invoices/:id")
  @HttpCode(HttpStatus.OK)
  async updateSunatInvoice(
    @Param("id") id: string,
    @Body() updateSunatInvoiceDto: UpdateSunatInvoiceDto,
  ): Promise<ApiResponse<SunatInvoice>> {
    const data = await this.sunatService.updateSunatInvoice(id, updateSunatInvoiceDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT invoice updated successfully",
      data,
    };
  }

  @Delete("invoices/:id")
  @HttpCode(HttpStatus.OK)
  async deleteSunatInvoice(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.sunatService.deleteSunatInvoice(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT invoice deleted successfully",
      data: null,
    };
  }

  @Get("invoices/company/:companyId/period/:period")
  @HttpCode(HttpStatus.OK)
  async getSunatInvoicesByPeriod(
    @Param("companyId") companyId: string,
    @Param("period") period: string,
  ): Promise<ApiResponse<SunatInvoice[]>> {
    const data = await this.sunatService.getSunatInvoicesByPeriod(companyId, period);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT invoices for period retrieved successfully",
      data,
    };
  }

  @Get("invoices/company/:companyId/search")
  @HttpCode(HttpStatus.OK)
  async searchSunatInvoices(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<SunatInvoice>>> {
    const data = await this.sunatService.searchSunatInvoices(companyId, searchTerm, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT invoices searched successfully",
      data,
    };
  }

  @Post("invoices/import")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async importSunatInvoicesFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("companyId") companyId: string,
    @Body("userId") userId: string,
  ): Promise<ApiResponse<SunatImportResult>> {
    // Assuming file parsing happens in the service or a dedicated parser
    const invoiceRecords = []; // This should be populated by actual file parsing logic
    const fileName = file.originalname;
    const data = await this.sunatService.importSunatInvoicesFromFile(companyId, userId, invoiceRecords, fileName);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "SUNAT invoices imported successfully",
      data,
    };
  }

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  @Get("company/:companyId/stats")
  @HttpCode(HttpStatus.OK)
  async getSunatStats(@Param("companyId") companyId: string): Promise<ApiResponse<SunatStatsResult>> {
    const data = await this.sunatService.getSunatStats(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "SUNAT statistics retrieved successfully",
      data,
    };
  }
}
