import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { Supplier } from "@prisma/client";

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get("company/:companyId")
  @HttpCode(HttpStatus.OK)
  async fetchSuppliers(
    @Param('companyId') companyId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    const data = await this.suppliersService.fetchSuppliers(companyId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Suppliers fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSupplier(@Body() createSupplierDto: CreateSupplierDto): Promise<ApiResponse<Supplier>> {
    const data = await this.suppliersService.createSupplier(createSupplierDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Supplier created successfully",
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSupplierById(@Param('id') id: string): Promise<ApiResponse<Supplier | null>> {
    const data = await this.suppliersService.getSupplierById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Supplier not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Supplier retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateSupplier(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<ApiResponse<Supplier>> {
    const data = await this.suppliersService.updateSupplier(id, updateSupplierDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Supplier updated successfully",
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSupplier(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.suppliersService.deleteSupplier(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Supplier deleted successfully",
      data: null,
    };
  }

  @Get("company/:companyId/document/:documentNumber")
  @HttpCode(HttpStatus.OK)
  async getSupplierByDocument(
    @Param('companyId') companyId: string,
    @Param('documentNumber') documentNumber: string,
  ): Promise<ApiResponse<Supplier | null>> {
    const data = await this.suppliersService.getSupplierByDocument(companyId, documentNumber);
     if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Supplier not found by document number",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Supplier retrieved successfully by document number",
      data,
    };
  }
}
