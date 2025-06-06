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
import { ExpensesService } from "./expenses.service"
import { CreateExpenseDto } from "./dto/create-expense.dto"
import { UpdateExpenseDto } from "./dto/update-expense.dto"
import { PaginationDto } from "../common/dto/pagination.dto"
import { ExpenseStatus } from "@prisma/client"

@UseGuards(AuthGuard)
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get("company/:companyId")
  async fetchExpenses(@Query() pagination: PaginationDto, @Query('companyId') companyId: string) {
    return this.expensesService.fetchExpenses(companyId, pagination)
  }

  @Post()
  async createExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.createExpense(createExpenseDto);
  }

  @Get(':id')
  async getExpenseById(@Param('id') id: string) {
    return this.expensesService.getExpenseById(id);
  }

  @Patch(":id")
  async updateExpense(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.updateExpense(id, updateExpenseDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExpense(@Param('id') id: string) {
    await this.expensesService.deleteExpense(id);
  }

  @Get("company/:companyId/status/:status")
  async getExpensesByStatus(@Query('companyId') companyId: string, @Query('status') status: ExpenseStatus) {
    return this.expensesService.getExpensesByStatus(companyId, status)
  }

  @Patch(":id/reconcile")
  async reconcileExpense(@Param('id') id: string, @Body() body: { documentId: string; reconciledById: string }) {
    return this.expensesService.reconcileExpense(id, body.documentId, body.reconciledById)
  }
}
