import { Module } from "@nestjs/common"
import { AccountingService } from "./accounting.service"
import { PrismaModule } from "../prisma/prisma.module"
import { AccountingController } from "./accounting.controller"

@Module({
  imports: [PrismaModule],
  controllers:[AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
