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
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { Transaction, TransactionStatus } from "@prisma/client";
import { TransactionFiltersDto } from "./dto/transaction-filters.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { PaginatedResponse } from "src/common/dto/pagination.dto";

type TransactionImportResult = any; // Define a more specific type if available from service

@UseGuards(AuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get("company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchTransactions(
    @Param("companyId") companyId: string,
    @Query() filters: TransactionFiltersDto,
  ): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    const data = await this.transactionsService.fetchTransactions(companyId, filters);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transactions fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<ApiResponse<Transaction>> {
    const data = await this.transactionsService.createTransaction(createTransactionDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Transaction created successfully",
      data,
    };
  }

  @Post("import")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async importTransactions(
    @UploadedFile() file: Express.Multer.File,
    @Body("companyId") companyId: string,
    @Body("bankAccountId") bankAccountId: string,
  ): Promise<ApiResponse<TransactionImportResult>> {
    // Assuming file parsing logic is handled by the service or a dedicated parser.
    // For now, passing an empty array as placeholder for parsed transactions.
    const transactions = []; // Placeholder - replace with actual parsing
    const fileName = file.originalname;
    const data = await this.transactionsService.importTransactionsFromFile(
      companyId,
      bankAccountId,
      transactions,
      fileName,
    );
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Transactions imported successfully",
      data,
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getTransactionById(@Param("id") id: string): Promise<ApiResponse<Transaction | null>> {
    const data = await this.transactionsService.getTransactionById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Transaction not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transaction retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateTransaction(
    @Param("id") id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<ApiResponse<Transaction>> {
    const data = await this.transactionsService.updateTransaction(id, updateTransactionDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transaction updated successfully",
      data,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteTransaction(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.transactionsService.deleteTransaction(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transaction deleted successfully",
      data: null,
    };
  }

  @Get("bank-account/:bankAccountId")
  @HttpCode(HttpStatus.OK)
  async getTransactionsByBankAccount(
    @Param("bankAccountId") bankAccountId: string,
  ): Promise<ApiResponse<Transaction[]>> {
    const data = await this.transactionsService.getTransactionsByBankAccount(bankAccountId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transactions for bank account retrieved successfully",
      data,
    };
  }

  @Get("company/:companyId/status/:status")
  @HttpCode(HttpStatus.OK)
  async getTransactionsByStatus(
    @Param("companyId") companyId: string,
    @Param("status") status: TransactionStatus,
  ): Promise<ApiResponse<Transaction[]>> {
    const data = await this.transactionsService.getTransactionsByStatus(companyId, status);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transactions by status retrieved successfully",
      data,
    };
  }

  @Get("company/:companyId/date-range")
  @HttpCode(HttpStatus.OK)
  async getTransactionsByDateRange(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ): Promise<ApiResponse<Transaction[]>> {
    const data = await this.transactionsService.getTransactionsByDateRange(
      companyId,
      new Date(startDate),
      new Date(endDate),
    );
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Transactions by date range retrieved successfully",
      data,
    };
  }
}
