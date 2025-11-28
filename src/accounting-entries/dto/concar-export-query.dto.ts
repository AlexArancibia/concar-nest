import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum, IsArray, ArrayMinSize, IsIn, IsOptional } from "class-validator"
import { Type, Transform } from "class-transformer"
import { ConciliationType } from "@prisma/client"

export class ConcarExportQueryDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  startDay?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  endDay?: number

  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((id) => id.trim())
    }
    return Array.isArray(value) ? value : [value]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bankAccountIds!: string[]

  @IsEnum(ConciliationType)
  conciliationType!: ConciliationType

  @Transform(({ value }) => String(value))
  @IsString()
  @IsNotEmpty()
  @IsIn(["15", "11"])
  documentType!: "15" | "11" // 15 = RH, 11 = FACTURAS
}

