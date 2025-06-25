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
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { ConciliationsService } from "./conciliations.service";
import { CreateConciliationDto } from "./dto/create-conciliation.dto";
import { UpdateConciliationDto } from "./dto/update-conciliation.dto";
import { CreateConciliationItemDto } from "./dto/create-conciliation-item.dto";
import { UpdateConciliationItemDto } from "./dto/update-conciliation-item.dto";
import { CreateConciliationExpenseDto } from "./dto/create-conciliation-expense.dto";
import { UpdateConciliationExpenseDto } from "./dto/update-conciliation-expense.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ConciliationFiltersDto } from "./dto/conciliation-filters.dto";
import { ValidateConciliationDto } from "./dto/validate-conciliation.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { Conciliation, ConciliationItem, ConciliationExpense } from "@prisma/client"; // Assuming these types exist
import { AutomaticConciliationResultDto } from "./dto/automatic-conciliation-result.dto";
import { ValidateConciliationResultDto } from "./dto/validate-conciliation-result.dto";

// Define more specific types if available from DTOs or service responses
type ConciliationDetails = Conciliation & { items: ConciliationItem[], expenses: ConciliationExpense[] }; // Example
type ValidationResult = ValidateConciliationResultDto;
type AutoConciliationResult = AutomaticConciliationResultDto;
type StatisticsResult = any; // Replace with actual type
type ExportResult = any; // Replace with actual type, could be a file stream or URL
type PendingDocumentResult = any; // Replace with actual type
type UnmatchedTransactionResult = any; // Replace with actual type


@UseGuards(AuthGuard)
@Controller("conciliations")
export class ConciliationsController {
  constructor(private readonly conciliationsService: ConciliationsService) {}

  // Conciliation endpoints
  @Get("company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchConciliations(
    @Param("companyId") companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<Conciliation>>> {
    if (!companyId) {
      throw new BadRequestException("Company ID is required");
    }
    const data = await this.conciliationsService.fetchConciliations(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliations fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConciliation(@Body() createConciliationDto: CreateConciliationDto): Promise<ApiResponse<Conciliation>> {
    const data = await this.conciliationsService.createConciliation(createConciliationDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Conciliation created successfully",
      data,
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getConciliationById(@Param("id") id: string): Promise<ApiResponse<ConciliationDetails | null>> {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required");
    }
    const data = await this.conciliationsService.getConciliationById(id);
    if (!data) {
       return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Conciliation not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateConciliation(
    @Param("id") id: string,
    @Body() updateConciliationDto: UpdateConciliationDto,
  ): Promise<ApiResponse<Conciliation>> {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required");
    }
    const data = await this.conciliationsService.updateConciliation(id, updateConciliationDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation updated successfully",
      data,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteConciliation(@Param("id") id: string): Promise<ApiResponse<null>> {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required");
    }
    await this.conciliationsService.deleteConciliation(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation deleted successfully",
      data: null,
    };
  }

  // Conciliation completion and automation endpoints
  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  async completeConciliation(@Param("id") id: string): Promise<ApiResponse<Conciliation>> {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required");
    }
    const data = await this.conciliationsService.completeConciliation(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation completed successfully",
      data,
    };
  }

  @Post(":id/auto-conciliate")
  @HttpCode(HttpStatus.OK)
  async performAutomaticConciliation(@Param("id") id: string): Promise<ApiResponse<AutoConciliationResult>> {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required");
    }
    const data = await this.conciliationsService.performAutomaticConciliation(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Automatic conciliation performed successfully",
      data,
    };
  }

  @Post("validate")
  @HttpCode(HttpStatus.OK)
  async validateConciliation(@Body() validateDto: ValidateConciliationDto): Promise<ApiResponse<ValidationResult>> {
    const { transactionId, documentIds, tolerance = 30 } = validateDto;

    if (!transactionId) {
      throw new BadRequestException("Transaction ID is required");
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw new BadRequestException("Document IDs array is required and cannot be empty");
    }

    const data = await this.conciliationsService.validateConciliation(transactionId, documentIds, tolerance);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation validated successfully",
      data,
    };
  }

  // ConciliationItem endpoints
  @Post("items")
  @HttpCode(HttpStatus.CREATED)
  async createConciliationItem(
    @Body() createConciliationItemDto: CreateConciliationItemDto,
  ): Promise<ApiResponse<ConciliationItem>> {
    const data = await this.conciliationsService.createConciliationItem(createConciliationItemDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Conciliation item created successfully",
      data,
    };
  }

  @Get("items/:id")
  @HttpCode(HttpStatus.OK)
  async getConciliationItemById(@Param("id") id: string): Promise<ApiResponse<ConciliationItem | null>> {
    if (!id) {
      throw new BadRequestException("Conciliation item ID is required");
    }
    const data = await this.conciliationsService.getConciliationItemById(id);
    if (!data) {
       return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Conciliation item not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation item retrieved successfully",
      data,
    };
  }

  @Patch("items/:id")
  @HttpCode(HttpStatus.OK)
  async updateConciliationItem(
    @Param("id") id: string,
    @Body() updateConciliationItemDto: UpdateConciliationItemDto,
  ): Promise<ApiResponse<ConciliationItem>> {
    if (!id) {
      throw new BadRequestException("Conciliation item ID is required");
    }
    const data = await this.conciliationsService.updateConciliationItem(id, updateConciliationItemDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation item updated successfully",
      data,
    };
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.OK)
  async deleteConciliationItem(@Param("id") id: string): Promise<ApiResponse<null>> {
    if (!id) {
      throw new BadRequestException("Conciliation item ID is required");
    }
    await this.conciliationsService.deleteConciliationItem(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation item deleted successfully",
      data: null,
    };
  }

  @Get(":conciliationId/items")
  @HttpCode(HttpStatus.OK)
  async getConciliationItemsByConciliation(
    @Param("conciliationId") conciliationId: string,
  ): Promise<ApiResponse<ConciliationItem[]>> {
    if (!conciliationId) {
      throw new BadRequestException("Conciliation ID is required");
    }
    const data = await this.conciliationsService.getConciliationItemsByConciliation(conciliationId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation items retrieved successfully",
      data,
    };
  }

  // NEW ENDPOINTS - ConciliationExpense management
  @Post("expenses")
  @HttpCode(HttpStatus.CREATED)
  async createConciliationExpense(
    @Body() createExpenseDto: CreateConciliationExpenseDto,
  ): Promise<ApiResponse<ConciliationExpense>> {
    const data = await this.conciliationsService.createConciliationExpense(createExpenseDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Conciliation expense created successfully",
      data,
    };
  }

  @Get("expenses/:id")
  @HttpCode(HttpStatus.OK)
  async getConciliationExpenseById(@Param("id") id: string): Promise<ApiResponse<ConciliationExpense | null>> {
    if (!id) {
      throw new BadRequestException("Expense ID is required");
    }
    const data = await this.conciliationsService.getConciliationExpenseById(id);
     if (!data) {
       return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Conciliation expense not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation expense retrieved successfully",
      data,
    };
  }

  @Patch("expenses/:id")
  @HttpCode(HttpStatus.OK)
  async updateConciliationExpense(
    @Param("id") id: string,
    @Body() updateExpenseDto: UpdateConciliationExpenseDto,
  ): Promise<ApiResponse<ConciliationExpense>> {
    if (!id) {
      throw new BadRequestException("Expense ID is required");
    }
    const data = await this.conciliationsService.updateConciliationExpense(id, updateExpenseDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation expense updated successfully",
      data,
    };
  }

  @Delete("expenses/:id")
  @HttpCode(HttpStatus.OK)
  async deleteConciliationExpense(@Param("id") id: string): Promise<ApiResponse<null>> {
    if (!id) {
      throw new BadRequestException("Expense ID is required");
    }
    await this.conciliationsService.deleteConciliationExpense(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation expense deleted successfully",
      data: null,
    };
  }

  @Get(":conciliationId/expenses")
  @HttpCode(HttpStatus.OK)
  async getConciliationExpensesByConciliation(
    @Param("conciliationId") conciliationId: string,
  ): Promise<ApiResponse<ConciliationExpense[]>> {
    if (!conciliationId) {
      throw new BadRequestException("Conciliation ID is required");
    }
    const data = await this.conciliationsService.getConciliationExpensesByConciliation(conciliationId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation expenses retrieved successfully",
      data,
    };
  }

  // NEW ENDPOINTS - Advanced filtering and search
  @Get("company/:companyId/advanced")
  @HttpCode(HttpStatus.OK)
  async fetchConciliationsAdvanced(
    @Param("companyId") companyId: string,
    @Query() filters: ConciliationFiltersDto,
  ): Promise<ApiResponse<PaginatedResponse<Conciliation>>> {
    if (!companyId) {
      throw new BadRequestException("Company ID is required");
    }
    const data = await this.conciliationsService.fetchConciliationsAdvanced(companyId, filters);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Advanced conciliations search successful",
      data,
    };
  }

  // NEW ENDPOINTS - Statistics and reporting
  @Get("company/:companyId/statistics")
  @HttpCode(HttpStatus.OK)
  async getConciliationStatistics(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<ApiResponse<StatisticsResult>> {
    if (!companyId) {
      throw new BadRequestException("Company ID is required");
    }
    const data = await this.conciliationsService.getConciliationStatistics(companyId, startDate, endDate);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliation statistics retrieved successfully",
      data,
    };
  }

  // NEW ENDPOINTS - Bulk operations
  @Post("bulk/complete")
  @HttpCode(HttpStatus.OK)
  async bulkCompleteConciliations(@Body() body: { conciliationIds: string[] }): Promise<ApiResponse<Conciliation[]>> {
    const { conciliationIds } = body;
    if (!conciliationIds || !Array.isArray(conciliationIds) || conciliationIds.length === 0) {
      throw new BadRequestException("Conciliation IDs array is required and cannot be empty");
    }
    const data = await this.conciliationsService.bulkCompleteConciliations(conciliationIds);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bulk conciliation completion successful",
      data,
    };
  }

  @Post("bulk/auto-conciliate")
  @HttpCode(HttpStatus.OK)
  async bulkAutoConciliate(@Body() body: { conciliationIds: string[] }): Promise<ApiResponse<Conciliation[]>> {
    const { conciliationIds } = body;
    if (!conciliationIds || !Array.isArray(conciliationIds) || conciliationIds.length === 0) {
      throw new BadRequestException("Conciliation IDs array is required and cannot be empty");
    }
    const data = await this.conciliationsService.bulkAutoConciliate(conciliationIds);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bulk auto-conciliation successful",
      data,
    };
  }

  // NEW ENDPOINTS - Export functionality
  @Get("company/:companyId/export")
  @HttpCode(HttpStatus.OK)
  async exportConciliations(
    @Param("companyId") companyId: string,
    @Query("format") format: "csv" | "excel" = "excel",
    @Query() filters: ConciliationFiltersDto,
  ): Promise<ApiResponse<ExportResult>> { // Note: Actual file download might need response object manipulation
    if (!companyId) {
      throw new BadRequestException("Company ID is required");
    }
    const data = await this.conciliationsService.exportConciliations(companyId, format, filters);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Conciliations exported successfully",
      data, // This might be a URL or file content depending on implementation
    };
  }

  // NEW ENDPOINTS - Pending documents for conciliation
  @Get("company/:companyId/pending-documents")
  @HttpCode(HttpStatus.OK)
  async getPendingDocumentsForConciliation(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("bankAccountId") bankAccountId?: string,
  ): Promise<ApiResponse<PendingDocumentResult>> {
    if (!companyId) {
      throw new BadRequestException("Company ID is required");
    }
    const data = await this.conciliationsService.getPendingDocumentsForConciliation(
      companyId,
      startDate,
      endDate,
      bankAccountId,
    );
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Pending documents for conciliation retrieved successfully",
      data,
    };
  }

  // NEW ENDPOINTS - Unmatched transactions
  @Get("company/:companyId/unmatched-transactions")
  @HttpCode(HttpStatus.OK)
  async getUnmatchedTransactions(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("bankAccountId") bankAccountId?: string,
  ): Promise<ApiResponse<UnmatchedTransactionResult>> {
    if (!companyId) {
      throw new BadRequestException("Company ID is required");
    }
    const data = await this.conciliationsService.getUnmatchedTransactions(
      companyId,
      startDate,
      endDate,
      bankAccountId,
    );
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Unmatched transactions retrieved successfully",
      data,
    };
  }
}
