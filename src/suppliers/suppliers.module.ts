import { Module } from "@nestjs/common"
import { SuppliersService } from "./suppliers.service"
import { SuppliersController } from "./suppliers.controller"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
