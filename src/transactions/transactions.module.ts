import { Module } from "@nestjs/common"
import { TransactionsService } from "./transactions.service"
import { TransactionsController } from "./transactions.controller"
import { PrismaModule } from "../prisma/prisma.module"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
