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
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { Expense, ExpenseStatus } from "@prisma/client";
import { ApiResponse } from "src/common/interfaces/api-response.interface";

@UseGuards(AuthGuard)
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get("company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchExpenses(
    @Query() pagination: PaginationDto,
    @Param('companyId') companyId: string,
  ): Promise<ApiResponse<PaginatedResponse<Expense>>> {
    const data = await this.expensesService.fetchExpenses(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Expenses fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExpense(@Body() createExpenseDto: CreateExpenseDto): Promise<ApiResponse<Expense>> {
    const data = await this.expensesService.createExpense(createExpenseDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Expense created successfully",
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getExpenseById(@Param('id') id: string): Promise<ApiResponse<Expense | null>> {
    const data = await this.expensesService.getExpenseById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Expense not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Expense retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateExpense(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ApiResponse<Expense>> {
    const data = await this.expensesService.updateExpense(id, updateExpenseDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Expense updated successfully",
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteExpense(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.expensesService.deleteExpense(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Expense deleted successfully",
      data: null,
    };
  }

  @Get("company/:companyId/status/:status")
  @HttpCode(HttpStatus.OK)
  async getExpensesByStatus(
    @Param('companyId') companyId: string,
    @Param('status') status: ExpenseStatus,
  ): Promise<ApiResponse<Expense[]>> {
    const data = await this.expensesService.getExpensesByStatus(companyId, status);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Expenses retrieved successfully by status",
      data,
    };
  }

  @Patch(":id/reconcile")
  @HttpCode(HttpStatus.OK)
  async reconcileExpense(
    @Param('id') id: string,
    @Body() body: { documentId: string; reconciledById: string },
  ): Promise<ApiResponse<Expense>> {
    const data = await this.expensesService.reconcileExpense(id, body.documentId, body.reconciledById);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Expense reconciled successfully",
      data,
    };
  }
}
