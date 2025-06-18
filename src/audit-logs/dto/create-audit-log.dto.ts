import { IsString, IsEnum, IsOptional, IsObject } from "class-validator"
import { AuditAction } from "@prisma/client"

export class CreateAuditLogDto {
  @IsString()
  userId: string

  @IsEnum(AuditAction)
  action: AuditAction

  @IsString()
  entity: string

  @IsOptional()
  @IsString()
  entityId?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsObject()
  oldValues?: any

  @IsOptional()
  @IsObject()
  newValues?: any

  @IsOptional()
  @IsString()
  ipAddress?: string

  @IsOptional()
  @IsString()
  userAgent?: string

  @IsString()
  companyId: string
}
