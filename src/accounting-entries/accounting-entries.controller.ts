import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { AccountingEntriesService } from "src/accounting-entries/accounting-entries.service"
import { CreateAccountingEntryDto } from "src/accounting-entries/dto/create-accounting-entry.dto"
import { UpdateAccountingEntryDto } from "src/accounting-entries/dto/update-accounting-entry.dto"
import { PaginationDto } from "src/common/dto/pagination.dto"
import { ConcarExportQueryDto } from "src/accounting-entries/dto/concar-export-query.dto"

@UseGuards(AuthGuard)
@Controller("accounting-entries")
export class AccountingEntriesController {
  constructor(private readonly service: AccountingEntriesService) {}

  @Get("company/:companyId")
  async fetchEntries(@Param("companyId") companyId: string, @Query() pagination: PaginationDto) {
    return this.service.fetchEntries(companyId, pagination)
  }

  @Get("concar-export")
  async exportConcarFormat(@Query() query: ConcarExportQueryDto) {
    return this.service.exportConcarFormat(query)
  }

  @Post()
  async createEntry(@Body() dto: CreateAccountingEntryDto) {
    return this.service.createEntry(dto)
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.service.getById(id)
  }

  @Patch(":id")
  async updateEntry(@Param("id") id: string, @Body() dto: UpdateAccountingEntryDto) {
    return this.service.updateEntry(id, dto)
  }
}

