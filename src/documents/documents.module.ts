import { Module } from "@nestjs/common"
import { DocumentsService } from "./documents.service"
import { DocumentsController } from "./documents.controller"
import { XmlParserService } from "./services/xml-parser.service"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, XmlParserService],
  exports: [DocumentsService, XmlParserService],
})
export class DocumentsModule {}
