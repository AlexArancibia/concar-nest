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
import { AccountingService } from "./accounting.service";
import { CreateAccountingAccountDto } from "./dto/create-accounting-account.dto";
import { UpdateAccountingAccountDto } from "./dto/update-accounting-account.dto";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { AccountingAccount, CostCenter } from "@prisma/client";

@UseGuards(AuthGuard)
@Controller("accounting")
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ============================================================================
  // ACCOUNTING ACCOUNTS ENDPOINTS
  // ============================================================================

  @Get("accounts/company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchAccountingAccounts(
    @Param("companyId") companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<AccountingAccount>>> {
    const data = await this.accountingService.fetchAccountingAccounts(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Accounting accounts fetched successfully",
      data,
    };
  }

  @Post("accounts")
  @HttpCode(HttpStatus.CREATED)
  async createAccountingAccount(
    @Body() createAccountingAccountDto: CreateAccountingAccountDto,
  ): Promise<ApiResponse<AccountingAccount>> {
    const data = await this.accountingService.createAccountingAccount(createAccountingAccountDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Accounting account created successfully",
      data,
    };
  }

  @Get("accounts/:id")
  @HttpCode(HttpStatus.OK)
  async getAccountingAccountById(@Param("id") id: string): Promise<ApiResponse<AccountingAccount | null>> {
    const data = await this.accountingService.getAccountingAccountById(id);
     if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Accounting account not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Accounting account retrieved successfully",
      data,
    };
  }

  @Patch("accounts/:id")
  @HttpCode(HttpStatus.OK)
  async updateAccountingAccount(
    @Param("id") id: string,
    @Body() updateAccountingAccountDto: UpdateAccountingAccountDto,
  ): Promise<ApiResponse<AccountingAccount>> {
    const data = await this.accountingService.updateAccountingAccount(id, updateAccountingAccountDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Accounting account updated successfully",
      data,
    };
  }

  @Delete("accounts/:id")
  @HttpCode(HttpStatus.OK)
  async deleteAccountingAccount(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.accountingService.deleteAccountingAccount(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Accounting account deleted successfully",
      data: null,
    };
  }

  @Get("accounts/company/:companyId/hierarchy")
  @HttpCode(HttpStatus.OK)
  async getAccountingAccountHierarchy(@Param("companyId") companyId: string): Promise<ApiResponse<any>> { // Adjust 'any' to specific hierarchy DTO if available
    const data = await this.accountingService.getAccountingAccountHierarchy(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Accounting account hierarchy retrieved successfully",
      data,
    };
  }

  @Get("accounts/company/:companyId/search")
  @HttpCode(HttpStatus.OK)
  async searchAccountingAccounts(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<AccountingAccount>>> {
    const data = await this.accountingService.searchAccountingAccounts(companyId, searchTerm, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Accounting accounts searched successfully",
      data,
    };
  }

  // ============================================================================
  // COST CENTERS ENDPOINTS
  // ============================================================================

  @Get("cost-centers/company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchCostCenters(
    @Param("companyId") companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<CostCenter>>> {
    const data = await this.accountingService.fetchCostCenters(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Cost centers fetched successfully",
      data,
    };
  }

  @Post("cost-centers")
  @HttpCode(HttpStatus.CREATED)
  async createCostCenter(@Body() createCostCenterDto: CreateCostCenterDto): Promise<ApiResponse<CostCenter>> {
    const data = await this.accountingService.createCostCenter(createCostCenterDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Cost center created successfully",
      data,
    };
  }

  @Get("cost-centers/:id")
  @HttpCode(HttpStatus.OK)
  async getCostCenterById(@Param("id") id: string): Promise<ApiResponse<CostCenter | null>> {
    const data = await this.accountingService.getCostCenterById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Cost center not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Cost center retrieved successfully",
      data,
    };
  }

  @Patch("cost-centers/:id")
  @HttpCode(HttpStatus.OK)
  async updateCostCenter(
    @Param("id") id: string,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
  ): Promise<ApiResponse<CostCenter>> {
    const data = await this.accountingService.updateCostCenter(id, updateCostCenterDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Cost center updated successfully",
      data,
    };
  }

  @Delete("cost-centers/:id")
  @HttpCode(HttpStatus.OK)
  async deleteCostCenter(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.accountingService.deleteCostCenter(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Cost center deleted successfully",
      data: null,
    };
  }

  @Get("cost-centers/company/:companyId/hierarchy")
  @HttpCode(HttpStatus.OK)
  async getCostCenterHierarchy(@Param("companyId") companyId: string): Promise<ApiResponse<any>> { // Adjust 'any' to specific hierarchy DTO
    const data = await this.accountingService.getCostCenterHierarchy(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Cost center hierarchy retrieved successfully",
      data,
    };
  }

  @Get("cost-centers/company/:companyId/search")
  @HttpCode(HttpStatus.OK)
  async searchCostCenters(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<CostCenter>>> {
    const data = await this.accountingService.searchCostCenters(companyId, searchTerm, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Cost centers searched successfully",
      data,
    };
  }
}
