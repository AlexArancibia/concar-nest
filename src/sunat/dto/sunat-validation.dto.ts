import { IsString, IsDateString, IsOptional } from "class-validator"

export class SunatValidationDto {
  @IsString()
  companyId: string

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsOptional()
  @IsString()
  documentNumber?: string
}

export class SunatValidationResultDto {
  documentId: string
  documentNumber: string
  supplierName: string
  found: boolean
  sunatSource?: "invoice" | "rhe"
  sunatData?: any
  error?: string
}

export class SunatValidationResponseDto {
  results: SunatValidationResultDto[]
  summary: {
    total: number
    found: number
    notFound: number
    errors: number
  }
}
