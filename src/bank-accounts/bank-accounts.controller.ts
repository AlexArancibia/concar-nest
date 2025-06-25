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
import { BankAccountsService } from "./bank-accounts.service";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto";
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { BankAccount } from "@prisma/client";

@UseGuards(AuthGuard)
@Controller("bank-accounts")
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get("company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchBankAccounts(
    @Param('companyId') companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<BankAccount>>> {
    const data = await this.bankAccountsService.fetchBankAccounts(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank accounts fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBankAccount(@Body() createBankAccountDto: CreateBankAccountDto): Promise<ApiResponse<BankAccount>> {
    const data = await this.bankAccountsService.createBankAccount(createBankAccountDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Bank account created successfully",
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getBankAccountById(@Param('id') id: string): Promise<ApiResponse<BankAccount | null>> {
    const data = await this.bankAccountsService.getBankAccountById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Bank account not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank account retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateBankAccount(
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ): Promise<ApiResponse<BankAccount>> {
    const data = await this.bankAccountsService.updateBankAccount(id, updateBankAccountDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank account updated successfully",
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteBankAccount(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.bankAccountsService.deleteBankAccount(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Bank account deleted successfully",
      data: null,
    };
  }

  @Get("company/:companyId/active")
  @HttpCode(HttpStatus.OK)
  async getBankAccountsByCompany(@Param('companyId') companyId: string): Promise<ApiResponse<BankAccount[]>> {
    const data = await this.bankAccountsService.getBankAccountsByCompany(companyId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Active bank accounts for company retrieved successfully",
      data,
    };
  }
}
