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
import { CompaniesService } from "./companies.service"
import { CreateCompanyDto } from "./dto/create-company.dto"
import { UpdateCompanyDto } from "./dto/update-company.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@UseGuards(AuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async fetchCompanies(@Query() pagination: PaginationDto) {
    return this.companiesService.fetchCompanies(pagination);
  }

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.createCompany(createCompanyDto)
  }

  @Get(':id')
  async getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id)
  }

  @Patch(":id")
  async updateCompany(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.updateCompany(id, updateCompanyDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompany(@Param('id') id: string) {
    await this.companiesService.deleteCompany(id)
  }

  @Get('ruc/:ruc')
  async getCompanyByRuc(@Param('ruc') ruc: string) {
    return this.companiesService.getCompanyByRuc(ruc)
  }
}
