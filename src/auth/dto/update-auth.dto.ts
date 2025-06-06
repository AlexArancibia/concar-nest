import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from "class-validator"
import { UserRole, AuthProvider } from "./create-auth.dto"

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  image?: string

  @IsOptional()
  @IsString()
  bio?: string

  @IsOptional()
  @IsEnum(AuthProvider)
  authProvider?: AuthProvider

  @IsOptional()
  @IsString()
  companyId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  preferences?: any
}
