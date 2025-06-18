import { PartialType } from "@nestjs/mapped-types"
import { CreateTaxSchemeDto } from "./create-tax-scheme.dto"

export class UpdateTaxSchemeDto extends PartialType(CreateTaxSchemeDto) {}
