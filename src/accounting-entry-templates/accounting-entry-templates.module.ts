import { Module } from "@nestjs/common"
import { PrismaModule } from "src/prisma/prisma.module"
import { AccountingEntryTemplatesService } from "./accounting-entry-templates.service"
import { AccountingEntryTemplatesController } from "./accounting-entry-templates.controller"

@Module({
  imports: [PrismaModule],
  controllers: [AccountingEntryTemplatesController],
  providers: [AccountingEntryTemplatesService],
})
export class AccountingEntryTemplatesModule {}

