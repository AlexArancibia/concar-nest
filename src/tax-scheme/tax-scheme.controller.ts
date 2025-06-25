import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { CreateTaxSchemeDto } from "./dto/create-tax-scheme.dto";
import { UpdateTaxSchemeDto } from "./dto/update-tax-scheme.dto";
import { TaxSchemesService } from "./tax-scheme.service";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { TaxScheme } from "@prisma/client";
import { TaxSchemeResponseDto } from "./dto/tax-scheme-response.dto";

@UseGuards(AuthGuard)
@Controller("tax-schemes")
export class TaxSchemesController {
  constructor(private readonly taxSchemesService: TaxSchemesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaxSchemeDto: CreateTaxSchemeDto): Promise<ApiResponse<TaxSchemeResponseDto>> {
    const data = await this.taxSchemesService.create(createTaxSchemeDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Tax scheme created successfully",
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<TaxSchemeResponseDto[]>> {
    const data = await this.taxSchemesService.findAll();
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Tax schemes retrieved successfully",
      data,
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async findOne(@Param("id") id: string): Promise<ApiResponse<TaxSchemeResponseDto | null>> {
    const data = await this.taxSchemesService.findOne(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Tax scheme not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Tax scheme retrieved successfully",
      data,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async update(
    @Param("id") id: string,
    @Body() updateTaxSchemeDto: UpdateTaxSchemeDto,
  ): Promise<ApiResponse<TaxSchemeResponseDto>> {
    const data = await this.taxSchemesService.update(id, updateTaxSchemeDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Tax scheme updated successfully",
      data,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.taxSchemesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Tax scheme deleted successfully",
      data: null,
    };
  }
}
