import { IsString, IsArray, IsOptional, IsNumber, Min } from "class-validator"

export class ValidateConciliationDto {
  @IsString()
  transactionId: string

  @IsArray()
  @IsString({ each: true })
  documentIds: string[]

  @IsOptional()
  @IsNumber()
  @Min(0)
  tolerance?: number = 30
}
