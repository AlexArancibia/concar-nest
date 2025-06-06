import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto"
import { AuditLog } from "@prisma/client"

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async fetchAuditLogs(pagination?: PaginationDto): Promise<PaginatedResponse<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ])

    return {
      data: auditLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createAuditLog(auditLog: any): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: auditLog,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  async getAuditLogById(id: string): Promise<AuditLog | undefined> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return auditLog || undefined
  }

  async getAuditLogsByUser(userId: string, pagination?: PaginationDto): Promise<PaginatedResponse<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { userId } }),
    ])

    return {
      data: auditLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getAuditLogsByEntity(
    entity: string,
    entityId: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {}
    const skip = (page - 1) * limit

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entity, entityId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { entity, entityId } }),
    ])

    return {
      data: auditLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
