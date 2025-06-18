import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from "class-validator"

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EDITOR = "EDITOR",
  ACCOUNTANT = "ACCOUNTANT",
  VIEWER = "VIEWER"
}
 
export enum AuthProvider {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
  MICROSOFT = "MICROSOFT",
  GITHUB = "GITHUB"
}

export class CreateAuthDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.VIEWER

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
  authProvider?: AuthProvider = AuthProvider.EMAIL

  @IsOptional()
  @IsString()
  companyId?: string
}
