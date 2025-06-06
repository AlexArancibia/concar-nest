import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator"
import { UserRole, AuthProvider } from "@prisma/client"
import { IsEnum } from "class-validator"

export class CreateAuthDto {
  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.EDITOR

  @IsOptional()
  @IsEnum(AuthProvider)
  authProvider?: AuthProvider = AuthProvider.EMAIL
  @IsOptional()
  @IsString()
  storeId?: string;
}
