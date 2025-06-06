import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateDocumentDto } from "./create-document.dto"
import { IsOptional, IsString } from "class-validator"

export class UpdateDocumentDto extends PartialType(OmitType(CreateDocumentDto, ["createdById"] as const)) {
  @IsOptional()
  @IsString()
  updatedById?: string
}
