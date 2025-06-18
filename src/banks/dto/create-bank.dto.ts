import { IsString, IsOptional, IsBoolean, MaxLength } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateBankDto {
  @ApiProperty({
    description: "Bank name",
    example: "Banco de Crédito del Perú",
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: "Bank code",
    example: "BCP",
    maxLength: 10,
  })
  @IsString()
  @MaxLength(10)
  code: string

  @ApiPropertyOptional({
    description: "Country code",
    example: "PE",
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string

  @ApiPropertyOptional({
    description: "Bank status",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
