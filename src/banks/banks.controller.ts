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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { BanksService } from "./banks.service";
import { CreateBankDto } from "./dto/create-bank.dto";
import { UpdateBankDto } from "./dto/update-bank.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { Bank } from "@prisma/client";
import { ApiResponse as AppApiResponse } from "src/common/interfaces/api-response.interface";

@ApiTags("Banks")
@UseGuards(AuthGuard)
@Controller("banks")
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all banks with pagination" })
  @ApiResponse({ status: 200, description: "Banks retrieved successfully" })
  async fetchBanks(@Query() pagination: PaginationDto): Promise<AppApiResponse<PaginatedResponse<Bank>>> {
    const data = await this.banksService.fetchBanks(pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Banks retrieved successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new bank" })
  @ApiResponse({ status: 201, description: "Bank created successfully" })
  @ApiResponse({ status: 409, description: "Bank code already exists" })
  async createBank(@Body() createBankDto: CreateBankDto): Promise<AppApiResponse<Bank>> {
    const data = await this.banksService.createBank(createBankDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Bank created successfully",
      data,
    };
  }

  @Get("active")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all active banks" })
  @ApiResponse({ status: 200, description: "Active banks retrieved successfully" })
  async getActiveBanks(): Promise<AppApiResponse<Bank[]>> {
    const data = await this.banksService.getActiveBanks();
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Active banks retrieved successfully",
      data,
    };
  }

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search banks by name or code" })
  @ApiQuery({ name: "q", description: "Search term", required: true })
  @ApiResponse({ status: 200, description: "Banks found successfully" })
  async searchBanks(
    @Query("q") searchTerm: string,
    @Query() pagination: PaginationDto,
  ): Promise<AppApiResponse<PaginatedResponse<Bank>>> {
    const data = await this.banksService.searchBanks(searchTerm, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Banks searched successfully",
      data,
    };
  }

  @Get("code/:code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get bank by code" })
  @ApiParam({ name: "code", description: "Bank code" })
  @ApiResponse({ status: 200, description: "Bank retrieved successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  async getBankByCode(@Param("code") code: string): Promise<AppApiResponse<Bank | null>> {
    const data = await this.banksService.getBankByCode(code);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Bank not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank retrieved successfully by code",
      data,
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get bank by ID" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank retrieved successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  async getBankById(@Param("id") id: string): Promise<AppApiResponse<Bank | null>> {
    const data = await this.banksService.getBankById(id);
     if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Bank not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank retrieved successfully by ID",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update bank" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank updated successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  @ApiResponse({ status: 409, description: "Bank code already exists" })
  async updateBank(@Param("id") id: string, @Body() updateBankDto: UpdateBankDto): Promise<AppApiResponse<Bank>> {
    const data = await this.banksService.updateBank(id, updateBankDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank updated successfully",
      data,
    };
  }

  @Patch(":id/toggle-status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Toggle bank active status" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank status updated successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  async toggleBankStatus(@Param("id") id: string): Promise<AppApiResponse<Bank>> {
    const data = await this.banksService.toggleBankStatus(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank status toggled successfully",
      data,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete bank" })
  @ApiParam({ name: "id", description: "Bank ID" })
  @ApiResponse({ status: 200, description: "Bank deleted successfully" })
  @ApiResponse({ status: 404, description: "Bank not found" })
  @ApiResponse({ status: 409, description: "Cannot delete bank with associated accounts" })
  async deleteBank(@Param("id") id: string): Promise<AppApiResponse<null>> {
    await this.banksService.deleteBank(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank deleted successfully",
      data: null,
    };
  }
}
