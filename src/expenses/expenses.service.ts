import { Injectable, NotFoundException, Logger, InternalServerErrorException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { Expense, ExpenseStatus, Prisma } from "@prisma/client"; // Added Prisma for error types
import { CreateExpenseDto } from "./dto/create-expense.dto"; // Assuming this DTO exists
import { UpdateExpenseDto } from "./dto/update-expense.dto"; // Assuming this DTO exists

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async fetchExpenses(companyId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Expense>> {
    this.logger.log(`Fetching expenses for company ${companyId} with pagination: ${JSON.stringify(pagination)}`);
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    try {
      const [expenses, total] = await this.prisma.$transaction([
        this.prisma.expense.findMany({
          where: { companyId },
          include: {
            bankAccount: true,
            supplier: true,
            document: true,
            importedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { transactionDate: "desc" },
          skip,
          take: limit,
        }),
        this.prisma.expense.count({ where: { companyId } }),
      ]);

      this.logger.log(`Found ${total} expenses for company ${companyId}`);
      return {
        data: expenses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error fetching expenses for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to fetch expenses.");
    }
  }

  async createExpense(expenseDto: CreateExpenseDto): Promise<Expense> { // Changed 'any' to CreateExpenseDto
    this.logger.log(`Creating expense for company ${expenseDto.companyId}`);
    const expenseData = {
      ...expenseDto,
      transactionDate: new Date(expenseDto.transactionDate), // Ensure date conversion
      valueDate: expenseDto.valueDate ? new Date(expenseDto.valueDate) : null,
      documentDate: expenseDto.documentDate ? new Date(expenseDto.documentDate) : null,
      issueDate: expenseDto.issueDate ? new Date(expenseDto.issueDate) : null,
      dueDate: expenseDto.dueDate ? new Date(expenseDto.dueDate) : null,
      status: expenseDto.status || ExpenseStatus.IMPORTED,
      // Ensure other fields like rowHash, importedAt are handled correctly if part of DTO or set by default
    };

    try {
      const createdExpense = await this.prisma.expense.create({
        data: expenseData,
        include: {
          bankAccount: true,
          supplier: true,
          document: true,
          importedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
      this.logger.log(`Expense created with ID: ${createdExpense.id}`);
      return createdExpense;
    } catch (error) {
      this.logger.error(`Error creating expense: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint violation
          throw new ConflictException("Expense with this data (e.g., rowHash) may already exist.");
        }
        // Add more specific Prisma error handling if needed
      }
      throw new InternalServerErrorException("Failed to create expense.");
    }
  }

  async updateExpense(id: string, updates: UpdateExpenseDto): Promise<Expense> { // Changed 'any' to UpdateExpenseDto
    this.logger.log(`Updating expense with ID: ${id}`);
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      this.logger.warn(`Expense not found for update: ${id}`);
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    const updateData = { ...updates };
    // Date conversions (if strings are passed, which should ideally be Date objects from DTO)
    for (const key of ['transactionDate', 'valueDate', 'documentDate', 'issueDate', 'dueDate', 'processedAt', 'reconciledAt']) {
      if (updateData[key] && typeof updateData[key] === 'string') {
        updateData[key] = new Date(updateData[key]);
      }
    }

    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(), // Always set updatedAt
        },
        include: {
          bankAccount: true,
          supplier: true,
          document: true,
          importedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
      this.logger.log(`Expense with ID ${id} updated successfully.`);
      return updatedExpense;
    } catch (error) {
      this.logger.error(`Error updating expense ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Expense with ID ${id} not found during update.`);
      }
      throw new InternalServerErrorException("Failed to update expense.");
    }
  }

  async deleteExpense(id: string): Promise<void> {
    this.logger.log(`Attempting to delete expense with ID: ${id}`);
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      this.logger.warn(`Expense not found for deletion: ${id}`);
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    try {
      await this.prisma.expense.delete({
        where: { id },
      });
      this.logger.log(`Expense with ID ${id} deleted successfully.`);
    } catch (error) {
      this.logger.error(`Error deleting expense ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Expense with ID ${id} not found during deletion.`);
      }
      // Consider P2003 for foreign key constraints if applicable
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(`Cannot delete expense ${id} due to existing related records.`);
      }
      throw new InternalServerErrorException("Failed to delete expense.");
    }
  }

  async getExpenseById(id: string): Promise<Expense | null> { // Return null if not found, controller handles 404
    this.logger.log(`Fetching expense by ID: ${id}`);
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        supplier: true,
        document: true,
        importedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reconciledBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!expense) {
        this.logger.warn(`Expense with ID ${id} not found.`);
        return null; // Controller will typically convert this to a 404 response
    }
    return expense;
  }

  async getExpensesByStatus(companyId: string, status: ExpenseStatus): Promise<Expense[]> {
    this.logger.log(`Fetching expenses for company ${companyId} by status: ${status}`);
    try {
      return await this.prisma.expense.findMany({
        where: { companyId, status },
        include: {
          bankAccount: true,
          supplier: true,
          document: true,
        },
        orderBy: { transactionDate: "desc" },
      });
    } catch (error) {
      this.logger.error(`Error fetching expenses by status for company ${companyId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to fetch expenses by status.");
    }
  }

  async reconcileExpense(id: string, documentId: string, reconciledById: string): Promise<Expense> {
    this.logger.log(`Reconciling expense ID: ${id} with document ID: ${documentId} by user: ${reconciledById}`);
    // Check if expense exists
    const expense = await this.prisma.expense.findUnique({ where: {id}});
    if (!expense) {
        this.logger.warn(`Expense not found for reconciliation: ${id}`);
        throw new NotFoundException(`Expense with ID ${id} not found.`);
    }
    // Optionally, check if document exists
    // const doc = await this.prisma.document.findUnique({ where: {id: documentId}});
    // if (!doc) {
    //     this.logger.warn(`Document not found for reconciliation: ${documentId}`);
    //     throw new NotFoundException(`Document with ID ${documentId} not found.`);
    // }
    try {
      const reconciledExpense = await this.prisma.expense.update({
        where: { id },
        data: {
          documentId,
          status: ExpenseStatus.PROCESSED, // Or RECONCILED, depending on your status flow
          reconciledAt: new Date(),
          reconciledById,
          updatedAt: new Date(),
        },
        include: {
          bankAccount: true,
          supplier: true,
          document: true,
        },
      });
      this.logger.log(`Expense ${id} reconciled successfully.`);
      return reconciledExpense;
    } catch (error) {
        this.logger.error(`Error reconciling expense ${id}: ${error.message}`, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
             throw new NotFoundException(`Expense with ID ${id} not found during reconciliation.`);
        }
        throw new InternalServerErrorException("Failed to reconcile expense.");
    }
  }
}
