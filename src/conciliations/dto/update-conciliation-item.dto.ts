import { PartialType } from "@nestjs/mapped-types"
import { CreateConciliationDto } from "./create-conciliation.dto"
import { IsOptional, IsDateString } from "class-validator"

export class UpdateConciliationDto extends PartialType(CreateConciliationDto) {
  @IsOptional()
  @IsDateString()
  completedAt?: string
}