import { Module } from "@nestjs/common"
import { ConcarController } from "./concar.controller"
import { ConcarService } from "./concar.service"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [ConcarController],
  providers: [ConcarService],
  exports: [ConcarService]
})
export class ConcarModule {}
