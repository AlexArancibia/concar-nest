import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { AuditLogsService } from "./audit-logs.service"
import { CreateAuditLogDto } from "./dto/create-audit-log.dto"
import { PaginationDto } from "../common/dto/pagination.dto"

@UseGuards(AuthGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async fetchAuditLogs(@Query() pagination: PaginationDto) {
    return this.auditLogsService.fetchAuditLogs(pagination)
  }

  @Post()
  async createAuditLog(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.createAuditLog(createAuditLogDto)
  }

  @Get(':id')
  async getAuditLogById(@Param('id') id: string) {
    return this.auditLogsService.getAuditLogById(id)
  }

  @Get("user/:userId")
  async getAuditLogsByUser(@Param('userId') userId: string, @Query() pagination: PaginationDto) {
    return this.auditLogsService.getAuditLogsByUser(userId, pagination)
  }

  @Get("entity/:entity/:entityId")
  async getAuditLogsByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditLogsService.getAuditLogsByEntity(entity, entityId, pagination)
  }
}
