import { Module } from "@nestjs/common"
 
import { PrismaModule } from "../prisma/prisma.module"
import { TaxSchemesController } from "./tax-scheme.controller"
import { TaxSchemesService } from "./tax-scheme.service"

@Module({
  imports: [PrismaModule],
  controllers: [TaxSchemesController],
  providers: [TaxSchemesService],
  exports: [TaxSchemesService],
})
export class TaxSchemesModule {}
