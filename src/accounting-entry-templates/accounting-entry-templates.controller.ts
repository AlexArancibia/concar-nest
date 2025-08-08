import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { AccountingEntryTemplatesService } from "./accounting-entry-templates.service"
import { CreateAccountingEntryTemplateDto } from "./dto/create-accounting-entry-template.dto"
import { UpdateAccountingEntryTemplateDto } from "./dto/update-accounting-entry-template.dto"

@UseGuards(AuthGuard)
@Controller("accounting-entry-templates")
export class AccountingEntryTemplatesController {
  constructor(private readonly service: AccountingEntryTemplatesService) {}

  @Get("company/:companyId")
  async list(@Param("companyId") companyId: string) {
    return this.service.list(companyId)
  }

  @Post("company/:companyId")
  async create(@Param("companyId") companyId: string, @Body() dto: CreateAccountingEntryTemplateDto) {
    return this.service.create(companyId, dto)
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.service.getById(id)
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAccountingEntryTemplateDto) {
    return this.service.update(id, dto)
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.service.remove(id)
  }
}

