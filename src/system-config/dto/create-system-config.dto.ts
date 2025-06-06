import { IsString, IsOptional, IsObject } from "class-validator"

export class CreateSystemConfigDto {
  @IsString()
  key: string

  @IsObject()
  value: any

  @IsOptional()
  @IsString()
  description?: string
}
