import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from "@nestjs/common"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { CreateTaxSchemeDto } from "./dto/create-tax-scheme.dto"
import { UpdateTaxSchemeDto } from "./dto/update-tax-scheme.dto"
import { TaxSchemesService } from "./tax-scheme.service";

@UseGuards(AuthGuard)
@Controller("tax-schemes")
export class TaxSchemesController {
  constructor(private readonly taxSchemesService: TaxSchemesService) {}

  @Post()
  async create(@Body() createTaxSchemeDto: CreateTaxSchemeDto) {
    return this.taxSchemesService.create(createTaxSchemeDto);
  }

  @Get()
  async findAll() {
    return this.taxSchemesService.findAll()
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.taxSchemesService.findOne(id)
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateTaxSchemeDto: UpdateTaxSchemeDto) {
    return this.taxSchemesService.update(id, updateTaxSchemeDto)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    await this.taxSchemesService.remove(id)
  }
}
