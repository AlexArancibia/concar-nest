import { Module } from "@nestjs/common"
import { ConciliationsService } from "./conciliations.service"
import { ConciliationsController } from "./conciliations.controller"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [ConciliationsController],
  providers: [ConciliationsService],
  exports: [ConciliationsService],
})
export class ConciliationsModule {}
