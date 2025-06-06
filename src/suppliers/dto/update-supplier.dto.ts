import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateSupplierDto } from "./create-supplier.dto"

export class UpdateSupplierDto extends PartialType(OmitType(CreateSupplierDto, ["companyId"] as const)) {}
