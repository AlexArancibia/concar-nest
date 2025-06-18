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
import { AccountingService } from "./accounting.service"
import { CreateAccountingAccountDto } from "./dto/create-accounting-account.dto"
import { UpdateAccountingAccountDto } from "./dto/update-accounting-account.dto"
import { CreateCostCenterDto } from "./dto/create-cost-center.dto"
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@UseGuards(AuthGuard)
@Controller("accounting")
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ============================================================================
  // ACCOUNTING ACCOUNTS ENDPOINTS
  // ============================================================================

  @Get("accounts/company/:companyId")
  async fetchAccountingAccounts(@Param("companyId") companyId: string, @Query() pagination: PaginationDto) {
    return this.accountingService.fetchAccountingAccounts(companyId, pagination)
  }

  @Post("accounts")
  async createAccountingAccount(@Body() createAccountingAccountDto: CreateAccountingAccountDto) {
    return this.accountingService.createAccountingAccount(createAccountingAccountDto)
  }

  @Get("accounts/:id")
  async getAccountingAccountById(@Param("id") id: string) {
    return this.accountingService.getAccountingAccountById(id)
  }

  @Patch("accounts/:id")
  async updateAccountingAccount(
    @Param("id") id: string,
    @Body() updateAccountingAccountDto: UpdateAccountingAccountDto,
  ) {
    return this.accountingService.updateAccountingAccount(id, updateAccountingAccountDto)
  }

  @Delete("accounts/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccountingAccount(@Param("id") id: string) {
    await this.accountingService.deleteAccountingAccount(id)
  }

  @Get("accounts/company/:companyId/hierarchy")
  async getAccountingAccountHierarchy(@Param("companyId") companyId: string) {
    return this.accountingService.getAccountingAccountHierarchy(companyId)
  }

  @Get("accounts/company/:companyId/search")
  async searchAccountingAccounts(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.accountingService.searchAccountingAccounts(companyId, searchTerm, pagination)
  }

  // ============================================================================
  // COST CENTERS ENDPOINTS
  // ============================================================================

  @Get("cost-centers/company/:companyId")
  async fetchCostCenters(@Param("companyId") companyId: string, @Query() pagination: PaginationDto) {
    return this.accountingService.fetchCostCenters(companyId, pagination)
  }

  @Post("cost-centers")
  async createCostCenter(@Body() createCostCenterDto: CreateCostCenterDto) {
    return this.accountingService.createCostCenter(createCostCenterDto)
  }

  @Get("cost-centers/:id")
  async getCostCenterById(@Param("id") id: string) {
    return this.accountingService.getCostCenterById(id)
  }

  @Patch("cost-centers/:id")
  async updateCostCenter(@Param("id") id: string, @Body() updateCostCenterDto: UpdateCostCenterDto) {
    return this.accountingService.updateCostCenter(id, updateCostCenterDto)
  }

  @Delete("cost-centers/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCostCenter(@Param("id") id: string) {
    await this.accountingService.deleteCostCenter(id)
  }

  @Get("cost-centers/company/:companyId/hierarchy")
  async getCostCenterHierarchy(@Param("companyId") companyId: string) {
    return this.accountingService.getCostCenterHierarchy(companyId)
  }

  @Get("cost-centers/company/:companyId/search")
  async searchCostCenters(
    @Param("companyId") companyId: string,
    @Query("searchTerm") searchTerm: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.accountingService.searchCostCenters(companyId, searchTerm, pagination)
  }
}
