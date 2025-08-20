import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, Res } from "@nestjs/common"
import { Response } from "express"
import  { SuppliersService } from "./suppliers.service"
import  { CreateSupplierDto } from "./dto/create-supplier.dto"
import  { UpdateSupplierDto } from "./dto/update-supplier.dto"
import  { PaginationDto } from "../common/dto/pagination.dto"

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get("company/:companyId")
  async fetchSuppliers(@Param('companyId') companyId: string, @Query() pagination: PaginationDto) {
    console.log('🔍 Controller received:', { companyId, pagination })
    return this.suppliersService.fetchSuppliers(companyId, pagination)
  }

  @Post()
  async createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(createSupplierDto);
  }

  @Get(':id')
  async getSupplierById(@Param('id') id: string) {
    return this.suppliersService.getSupplierById(id);
  }

  @Patch(":id")
  async updateSupplier(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.updateSupplier(id, updateSupplierDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupplier(@Param('id') id: string) {
    await this.suppliersService.deleteSupplier(id);
  }

  @Get("company/:companyId/document/:documentNumber")
  async getSupplierByDocument(@Param('companyId') companyId: string, @Param('documentNumber') documentNumber: string) {
    return this.suppliersService.getSupplierByDocument(companyId, documentNumber)
  }

  @Get("company/:companyId/export")
  async exportSuppliers(
    @Param('companyId') companyId: string,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Query() filters: any,
    @Res() res: Response
  ) {
    const result = await this.suppliersService.exportSuppliers(companyId, format, filters)
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      res.send(result.data)
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      res.send(result.data)
    }
  }
}
