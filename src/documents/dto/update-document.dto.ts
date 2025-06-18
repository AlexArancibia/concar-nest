import { PartialType } from "@nestjs/mapped-types"
import { CreateDocumentDto } from "./create-document.dto"
import { IsOptional, IsString } from "class-validator"
import { IsNumber } from "class-validator"

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @IsOptional()
  @IsString()
  updatedById?: string
}

export class UpdateDocumentStatusDto {
  @IsString()
  updatedById: string
}

export class ConciliateDocumentDto {
  @IsString()
  conciliationId: string

  @IsNumber() // Cambiar de @IsDecimal() a @IsNumber()
  conciliatedAmount: number

  @IsString()
  reconciledById: string
}
