import { Module } from "@nestjs/common"
import { PrismaModule } from "src/prisma/prisma.module"
import { AccountingEntriesService } from "src/accounting-entries/accounting-entries.service"
import { AccountingEntriesController } from "src/accounting-entries/accounting-entries.controller"

@Module({
  imports: [PrismaModule],
  controllers: [AccountingEntriesController],
  providers: [AccountingEntriesService],
  exports: [AccountingEntriesService],
})
export class AccountingEntriesModule {}

