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
  Req,
} from "@nestjs/common"
import { Request } from "express"
import { FileInterceptor } from "@nestjs/platform-express"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { TransactionsService } from "./transactions.service"
import { CreateTransactionDto } from "./dto/create-transaction.dto"
import { UpdateTransactionDto } from "./dto/update-transaction.dto"
import { PaginationDto } from "../common/dto/pagination.dto"
import { TransactionStatus } from "@prisma/client"
import { TransactionQueryDto } from "./dto/transaction-query.dto"

@UseGuards(AuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get("company/:companyId")
  async fetchTransactions(@Param("companyId") companyId: string, @Query() transactionQueryDto: TransactionQueryDto) {
    return this.transactionsService.fetchTransactions(companyId, transactionQueryDto)
  }

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Req() req: Request) {
    const user = (req as any)["user"]
    const userId = user?.sub || user?.id || "system"
    return this.transactionsService.createTransaction(createTransactionDto, userId)
  }

  @Post("import")
  @UseInterceptors(FileInterceptor("file"))
  async importTransactions(
    @UploadedFile() file: Express.Multer.File,
    @Body("companyId") companyId: string,
    @Body("bankAccountId") bankAccountId: string,
  ) {
    // Aquí implementarías el parser del archivo Excel/CSV dd
    const transactions = [] // Parsear el archivo
    const fileName = file.originalname

    return this.transactionsService.importTransactionsFromFile(companyId, bankAccountId, transactions, fileName)
  }

  @Get(":id")
  async getTransactionById(@Param("id") id: string) {
    return this.transactionsService.getTransactionById(id)
  }

  @Patch(":id")
  async updateTransaction(@Param("id") id: string, @Body() updateTransactionDto: UpdateTransactionDto, @Req() req: Request) {
    const user = (req as any)["user"]
    const userId = user?.sub || user?.id || "system"
    return this.transactionsService.updateTransaction(id, updateTransactionDto, userId)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any)["user"]
    const userId = user?.sub || user?.id || "system"
    await this.transactionsService.deleteTransaction(id, userId)
  }

  @Get("bank-account/:bankAccountId")
  async getTransactionsByBankAccount(@Param("bankAccountId") bankAccountId: string) {
    return this.transactionsService.getTransactionsByBankAccount(bankAccountId)
  }

  @Get("company/:companyId/status/:status")
  async getTransactionsByStatus(@Param("companyId") companyId: string, @Param("status") status: TransactionStatus) {
    return this.transactionsService.getTransactionsByStatus(companyId, status)
  }

  @Get("company/:companyId/date-range")
  async getTransactionsByDateRange(
    @Param("companyId") companyId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.transactionsService.getTransactionsByDateRange(companyId, new Date(startDate), new Date(endDate))
  }
}
