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
import { ConciliationsService } from "./conciliations.service"
import { CreateConciliationDto } from "./dto/create-conciliation.dto"
import { UpdateConciliationDto } from "./dto/update-conciliation.dto"
import { CreateConciliationItemDto } from "./dto/create-conciliation-item.dto"
import { UpdateConciliationItemDto } from "./dto/update-conciliation-item.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@UseGuards(AuthGuard)
@Controller("conciliations")
export class ConciliationsController {
  constructor(private readonly conciliationsService: ConciliationsService) {}

  @Get("company/:companyId")
  async fetchConciliations(@Param("companyId") companyId: string, @Query() pagination: PaginationDto) {
    return this.conciliationsService.fetchConciliations(companyId, pagination)
  }

  @Post()
  async createConciliation(@Body() createConciliationDto: CreateConciliationDto) {
    return this.conciliationsService.createConciliation(createConciliationDto)
  }

  @Get(":id")
  async getConciliationById(@Param("id") id: string) {
    return this.conciliationsService.getConciliationById(id)
  }

  @Patch(":id")
  async updateConciliation(@Param("id") id: string, @Body() updateConciliationDto: UpdateConciliationDto) {
    return this.conciliationsService.updateConciliation(id, updateConciliationDto)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConciliation(@Param("id") id: string) {
    await this.conciliationsService.deleteConciliation(id)
  }

  // ConciliationItem endpoints
  @Post("items")
  async createConciliationItem(@Body() createConciliationItemDto: CreateConciliationItemDto) {
    return this.conciliationsService.createConciliationItem(createConciliationItemDto)
  }

  @Get("items/:id")
  async getConciliationItemById(@Param("id") id: string) {
    return this.conciliationsService.getConciliationItemById(id)
  }

  @Patch("items/:id")
  async updateConciliationItem(@Param("id") id: string, @Body() updateConciliationItemDto: UpdateConciliationItemDto) {
    return this.conciliationsService.updateConciliationItem(id, updateConciliationItemDto)
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConciliationItem(@Param("id") id: string) {
    await this.conciliationsService.deleteConciliationItem(id)
  }

  @Get(":conciliationId/items")
  async getConciliationItemsByConciliation(@Param("conciliationId") conciliationId: string) {
    return this.conciliationsService.getConciliationItemsByConciliation(conciliationId)
  }

  @Post(":id/auto-conciliate")
  async performAutomaticConciliation(@Param("id") id: string) {
    return this.conciliationsService.performAutomaticConciliation(id)
  }
}
