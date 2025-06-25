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
import { CompaniesService } from "./companies.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { Company } from "@prisma/client";

@UseGuards(AuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async fetchCompanies(@Query() pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Company>>> {
    const data = await this.companiesService.fetchCompanies(pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Companies fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<ApiResponse<Company>> {
    const data = await this.companiesService.createCompany(createCompanyDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Company created successfully",
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCompanyById(@Param('id') id: string): Promise<ApiResponse<Company | null>> {
    const data = await this.companiesService.getCompanyById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Company not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Company retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<ApiResponse<Company>> {
    const data = await this.companiesService.updateCompany(id, updateCompanyDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Company updated successfully",
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCompany(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.companiesService.deleteCompany(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Company deleted successfully",
      data: null,
    };
  }

  @Get('ruc/:ruc')
  @HttpCode(HttpStatus.OK)
  async getCompanyByRuc(@Param('ruc') ruc: string): Promise<ApiResponse<Company | null>> {
    const data = await this.companiesService.getCompanyByRuc(ruc);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Company not found by RUC",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Company retrieved successfully by RUC",
      data,
    };
  }
}
