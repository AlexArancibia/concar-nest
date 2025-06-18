import { Module } from "@nestjs/common"
import { SunatService } from "./sunat.service"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  providers: [SunatService],
  exports: [SunatService],
})
export class SunatModule {}
