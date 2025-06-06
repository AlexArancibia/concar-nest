import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateConciliationItemDto } from "./create-conciliation-item.dto"
import { IsOptional, IsDateString } from "class-validator"

export class UpdateConciliationItemDto extends PartialType(
  OmitType(CreateConciliationItemDto, ["conciliationId"] as const),
) {
  @IsOptional()
  @IsDateString()
  conciliatedAt?: string
}
