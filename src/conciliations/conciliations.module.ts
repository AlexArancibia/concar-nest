import { Module } from "@nestjs/common"
import { ConciliationsService } from "./conciliations.service"
import { ConciliationsController } from "./conciliations.controller"
import { PrismaModule } from "../prisma/prisma.module"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [ConciliationsController],
  providers: [ConciliationsService],
  exports: [ConciliationsService],
})
export class ConciliationsModule {}
