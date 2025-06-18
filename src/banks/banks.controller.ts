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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { BanksService } from "./banks.service"
import { CreateBankDto } from "./dto/create-bank.dto"
import { UpdateBankDto } from "./dto/update-bank.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@ApiTags("Banks")
@UseGuards(AuthGuard)
@Controller("banks")
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get()
  @ApiOperation({ summary: "Get all banks with pagination" })
  @ApiResponse({ status: 200, description: "Banks retrieved successfully" })
  async fetchBanks(@Query() pagination: PaginationDto) {
    return this.banksService.fetchBanks(pagination);
  }

  @Post()
  @ApiOperation({ summary: "Create a new bank" })
  @ApiResponse({ status: 201, description: "Bank created successfully" })
  @ApiResponse({ status: 409, description: "Bank code already exists" })
  async createBank(@Body() createBankDto: CreateBankDto) {
    return this.banksService.createBank(createBankDto)
  }

  @Get("active")
  @ApiOperation({ summary: "Get all active banks" })
  @ApiResponse({ status: 200, description: "Active banks retrieved successfully" })
  async getActiveBanks() {
    return this.banksService.getActiveBanks()
  }

  @Get("search")
  @ApiOperation({ summary: "Search banks by name or code" })
  @ApiQuery({ name: "q", description: "Search term", required: true })
  @ApiResponse({ status: 200, description: "Banks found successfully" })
  async searchBanks(@Query("q") searchTerm: string, @Query() pagination: PaginationDto) {
    return this.banksService.searchBanks(searchTerm, pagination)
  }

  @Get("code/:code")
  @ApiOperation({ summary: "Get bank by code" })
  @ApiParam({ name: "code", description: "Bank code" })
  @ApiResponse({ status: 200, description: "Bank retrieved successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  async getBankByCode(@Param("code") code: string) {
    return this.banksService.getBankByCode(code)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get bank by ID" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank retrieved successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  async getBankById(@Param("id") id: string) {
    return this.banksService.getBankById(id)
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update bank" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank updated successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  @ApiResponse({ status: 409, description: "Bank code already exists" })
  async updateBank(@Param("id") id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.banksService.updateBank(id, updateBankDto)
  }

  @Patch(":id/toggle-status")
  @ApiOperation({ summary: "Toggle bank active status" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank status updated successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  async toggleBankStatus(@Param("id") id: string) {
    return this.banksService.toggleBankStatus(id)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete bank" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 204, description: "Bank deleted successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  @ApiResponse({ status: 409, description: "Cannot delete bank with associated accounts" })
  async deleteBank(@Param("id") id: string) {
    await this.banksService.deleteBank(id)
  }
}
