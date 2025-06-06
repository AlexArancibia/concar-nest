import { IsString, IsEnum, IsOptional, IsObject, IsIP } from "class-validator"
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

  @IsString()
  description: string

  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>

  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>

  @IsOptional()
  @IsIP()
  ipAddress?: string

  @IsOptional()
  @IsString()
  userAgent?: string
}
