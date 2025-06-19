import { Module } from "@nestjs/common"
import { SunatService } from "./sunat.service"
import { PrismaModule } from "../prisma/prisma.module"
import { SunatController } from "./sunat.controller"

@Module({
  imports: [PrismaModule],
  controllers: [SunatController],
  providers: [SunatService],
  exports: [SunatService],
})
export class SunatModule {}
