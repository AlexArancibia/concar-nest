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
  BadRequestException,
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

  // Conciliation endpoints
  @Get("company/:companyId")
  async fetchConciliations(@Param("companyId") companyId: string, @Query() pagination: PaginationDto) {
    if (!companyId) {
      throw new BadRequestException("Company ID is required")
    }
    return this.conciliationsService.fetchConciliations(companyId, pagination)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConciliation(@Body() createConciliationDto: CreateConciliationDto) {
    return this.conciliationsService.createConciliation(createConciliationDto)
  }

  @Get(":id")
  async getConciliationById(@Param("id") id: string) {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required")
    }
    const conciliation = await this.conciliationsService.getConciliationById(id)
    if (!conciliation) {
      throw new BadRequestException("Conciliation not found")
    }
    return conciliation
  }

  @Patch(":id")
  async updateConciliation(@Param("id") id: string, @Body() updateConciliationDto: UpdateConciliationDto) {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required")
    }
    return this.conciliationsService.updateConciliation(id, updateConciliationDto)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConciliation(@Param("id") id: string) {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required")
    }
    await this.conciliationsService.deleteConciliation(id)
  }

  // Conciliation completion and automation endpoints
  @Post(":id/complete")
  async completeConciliation(@Param("id") id: string) {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required")
    }
    return this.conciliationsService.completeConciliation(id)
  }

  @Post(":id/auto-conciliate")
  async performAutomaticConciliation(@Param("id") id: string) {
    if (!id) {
      throw new BadRequestException("Conciliation ID is required")
    }
    return this.conciliationsService.performAutomaticConciliation(id)
  }

  @Post("validate")
  async validateConciliation(
    @Body()
    validateDto: {
      transactionId: string
      documentIds: string[]
      tolerance?: number
    },
  ) {
    const { transactionId, documentIds, tolerance = 30 } = validateDto

    if (!transactionId) {
      throw new BadRequestException("Transaction ID is required")
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw new BadRequestException("Document IDs array is required and cannot be empty")
    }

    return this.conciliationsService.validateConciliation(transactionId, documentIds, tolerance)
  }

  // ConciliationItem endpoints
  @Post("items")
  @HttpCode(HttpStatus.CREATED)
  async createConciliationItem(@Body() createConciliationItemDto: CreateConciliationItemDto) {
    return this.conciliationsService.createConciliationItem(createConciliationItemDto)
  }

  @Get("items/:id")
  async getConciliationItemById(@Param("id") id: string) {
    if (!id) {
      throw new BadRequestException("Conciliation item ID is required")
    }
    const item = await this.conciliationsService.getConciliationItemById(id)
    if (!item) {
      throw new BadRequestException("Conciliation item not found")
    }
    return item
  }

  @Patch("items/:id")
  async updateConciliationItem(@Param("id") id: string, @Body() updateConciliationItemDto: UpdateConciliationItemDto) {
    if (!id) {
      throw new BadRequestException("Conciliation item ID is required")
    }
    return this.conciliationsService.updateConciliationItem(id, updateConciliationItemDto)
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConciliationItem(@Param("id") id: string) {
    if (!id) {
      throw new BadRequestException("Conciliation item ID is required")
    }
    await this.conciliationsService.deleteConciliationItem(id)
  }

  @Get(":conciliationId/items")
  async getConciliationItemsByConciliation(@Param("conciliationId") conciliationId: string) {
    if (!conciliationId) {
      throw new BadRequestException("Conciliation ID is required")
    }
    return this.conciliationsService.getConciliationItemsByConciliation(conciliationId)
  }
}
