import { IsString, IsOptional, IsBoolean, IsEmail, IsUrl } from "class-validator"

export class CreateCompanyDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  tradeName?: string

  @IsString()
  ruc: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsUrl()
  website?: string

  @IsOptional()
  @IsUrl()
  logo?: string

  @IsOptional()
  settings?: any

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true
}
