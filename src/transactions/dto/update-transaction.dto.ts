import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateTransactionDto } from "./create-transaction.dto"
import { IsOptional, IsEnum, IsNumber } from "class-validator"
import { TransactionStatus } from "@prisma/client"
import { Type, Transform } from "class-transformer"

export class UpdateTransactionDto extends PartialType(OmitType(CreateTransactionDto, ["companyId"] as const)) {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  conciliatedAmount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === "string" ? Number.parseFloat(value) : value))
  pendingAmount?: number
}
