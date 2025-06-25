import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { AuditLogsService } from "./audit-logs.service";
import { CreateAuditLogDto } from "./dto/create-audit-log.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { ApiResponse } from "src/common/interfaces/api-response.interface";
import { AuditLog } from "@prisma/client";

@UseGuards(AuthGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async fetchAuditLogs(@Query() pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    const data = await this.auditLogsService.fetchAuditLogs(pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Audit logs fetched successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAuditLog(@Body() createAuditLogDto: CreateAuditLogDto): Promise<ApiResponse<AuditLog>> {
    const data = await this.auditLogsService.createAuditLog(createAuditLogDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Audit log created successfully",
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getAuditLogById(@Param('id') id: string): Promise<ApiResponse<AuditLog | null>> {
    const data = await this.auditLogsService.getAuditLogById(id);
    if (!data) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        success: false,
        message: "Audit log not found",
        data: null,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Audit log retrieved successfully",
      data,
    };
  }

  @Get("user/:userId")
  @HttpCode(HttpStatus.OK)
  async getAuditLogsByUser(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    const data = await this.auditLogsService.getAuditLogsByUser(userId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Audit logs for user retrieved successfully",
      data,
    };
  }

  @Get("entity/:entity/:entityId")
  @HttpCode(HttpStatus.OK)
  async getAuditLogsByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    const data = await this.auditLogsService.getAuditLogsByEntity(entity, entityId, pagination);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Audit logs for entity retrieved successfully",
      data,
    };
  }
}
