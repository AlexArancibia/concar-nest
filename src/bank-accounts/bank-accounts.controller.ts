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
import { BankAccountsService } from "./bank-accounts.service"
import { CreateBankAccountDto } from "./dto/create-bank-account.dto"
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@UseGuards(AuthGuard)
@Controller("bank-accounts")
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get("company/:companyId")
  async fetchBankAccounts(@Param('companyId') companyId: string, @Query() pagination: PaginationDto) {
    return this.bankAccountsService.fetchBankAccounts(companyId, pagination)
  }

  @Post()
  async createBankAccount(@Body() createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountsService.createBankAccount(createBankAccountDto)
  }

  @Get(':id')
  async getBankAccountById(@Param('id') id: string) {
    return this.bankAccountsService.getBankAccountById(id)
  }

  @Patch(":id")
  async updateBankAccount(@Param('id') id: string, @Body() updateBankAccountDto: UpdateBankAccountDto) {
    return this.bankAccountsService.updateBankAccount(id, updateBankAccountDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBankAccount(@Param('id') id: string) {
    await this.bankAccountsService.deleteBankAccount(id)
  }

  @Get("company/:companyId/active")
  async getBankAccountsByCompany(@Param('companyId') companyId: string) {
    return this.bankAccountsService.getBankAccountsByCompany(companyId)
  }
}
