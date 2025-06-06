import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common"
import  { PrismaService } from "../prisma/prisma.service"
import  { JwtService } from "@nestjs/jwt"
import  { CreateAuthDto } from "./dto/create-auth.dto"
import  { UpdateUserDto } from "./dto/update-auth.dto"
import  { LoginAuthDto } from "./dto/login-auth.dto"
import * as bcrypt from "bcryptjs"
import  { ConfigService } from "@nestjs/config"

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateAuthDto) {
    console.log("🔐 Creating new user:", createUserDto.email)

    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    })

    if (existingUser) {
      console.log("❌ Email already exists:", createUserDto.email)
      throw new ConflictException("Email already exists")
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    console.log("🔒 Password hashed successfully")

    try {
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role || "VIEWER",
          phone: createUserDto.phone,
          image: createUserDto.image,
          bio: createUserDto.bio,
          authProvider: createUserDto.authProvider || "EMAIL",
          companyId: createUserDto.companyId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          company: true, // Include company data
        },
      })

      // Remove password from response
      const { password, company, ...userWithoutPasswordAndCompany } = user

      console.log("✅ User created successfully:", user.id)

      // Generar token para auto-login después del registro
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      }

      const access_token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: "5d",
      })

      console.log("🔑 Access token generated for new user")

      return {
        access_token,
        userInfo: userWithoutPasswordAndCompany,
        company: company || null, // Return single company
      }
    } catch (error) {
      console.error("❌ Error creating user:", error)
      throw new InternalServerErrorException("Error creating user: " + error.message)
    }
  }

  async login(loginUserDto: LoginAuthDto) {
    console.log("🔐 Login attempt for:", loginUserDto.email)

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginUserDto.email },
        include: {
          company: true, // Include company data
        },
      })

      if (!user) {
        console.log("❌ User not found:", loginUserDto.email)
        throw new UnauthorizedException("Invalid credentials")
      }

      if (!user.isActive) {
        console.log("❌ User account is inactive:", loginUserDto.email)
        throw new UnauthorizedException("Account is inactive")
      }

      // Verificar si la cuenta está bloqueada
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        console.log("❌ Account is locked:", loginUserDto.email)
        throw new UnauthorizedException("Account is temporarily locked")
      }

      const isPasswordMatch = await bcrypt.compare(loginUserDto.password, user.password)

      if (!isPasswordMatch) {
        console.log("❌ Invalid password for:", loginUserDto.email)

        // Incrementar intentos fallidos
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: user.failedLoginAttempts + 1,
            // Bloquear cuenta después de 5 intentos fallidos por 30 minutos
            lockedUntil: user.failedLoginAttempts >= 4 ? new Date(Date.now() + 30 * 60 * 1000) : null,
          },
        })

        throw new UnauthorizedException("Invalid credentials")
      }

      // Resetear intentos fallidos y actualizar lastLogin
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        },
      })

      console.log("✅ Login successful for:", user.email)

      // Extraer password y company del objeto user
      const { password, company, ...userWithoutPasswordAndCompany } = user

      // Crear payload para el token
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      }

      const access_token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: "5d",
      })

      console.log("🔑 Access token generated for:", user.email)

      return {
        access_token,
        userInfo: userWithoutPasswordAndCompany,
        company: company || null, // Return single company, not array
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      console.error("❌ Error during login:", error)
      throw new InternalServerErrorException("Error during login: " + error.message)
    }
  }

  async findAll() {
    console.log("📋 Fetching all users")

    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        emailVerified: true,
        lastLogin: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  async findOne(id: string) {
    console.log("👤 Fetching user:", id)

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        emailVerified: true,
        lastLogin: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        authProvider: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    })

    if (!user) {
      console.log("❌ User not found:", id)
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    console.log("✅ User found:", user.email)
    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    console.log("📝 Updating user:", id)

    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true, email: true },
    })

    if (!existingUser) {
      console.log("❌ User not found for update:", id)
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    // Manejar cambio de contraseña
    if (updateUserDto.newPassword && updateUserDto.password) {
      console.log("🔐 Changing password for user:", id)

      const isPasswordMatch = await bcrypt.compare(updateUserDto.password, existingUser.password)

      if (!isPasswordMatch) {
        console.log("❌ Current password is incorrect for user:", id)
        throw new UnauthorizedException("Current password is incorrect")
      }

      // Actualizar a la nueva contraseña
      updateUserDto.password = await bcrypt.hash(updateUserDto.newPassword, 10)
      delete updateUserDto.newPassword
      console.log("✅ Password updated successfully")
    } else if (updateUserDto.password) {
      // Si solo se proporciona password (sin verificación)
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10)
      console.log("🔐 Password hashed for update")
    }

    // Verificar email único si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      })

      if (emailExists) {
        console.log("❌ Email already exists:", updateUserDto.email)
        throw new ConflictException("Email already exists")
      }
    }

    // Siempre actualizar updatedAt
    const updateData = {
      ...updateUserDto,
      updatedAt: new Date(),
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          image: true,
          phone: true,
          bio: true,
          emailVerified: true,
          lastLogin: true,
          isActive: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          preferences: true,
        },
      })

      console.log("✅ User updated successfully:", updatedUser.email)
      return updatedUser
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`User with ID ${id} not found`)
      }
      console.error("❌ Error updating user:", error)
      throw new InternalServerErrorException("Error updating user: " + error.message)
    }
  }

  async remove(id: string) {
    console.log("🗑️ Removing user:", id)

    try {
      // Verificar que el usuario existe antes de eliminar
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true },
      })

      if (!user) {
        console.log("❌ User not found for deletion:", id)
        throw new NotFoundException(`User with ID ${id} not found`)
      }

      await this.prisma.user.delete({
        where: { id },
      })

      console.log("✅ User deleted successfully:", user.email)
      return { message: "User deleted successfully" }
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`User with ID ${id} not found`)
      }
      console.error("❌ Error deleting user:", error)
      throw new InternalServerErrorException("Error deleting user: " + error.message)
    }
  }

  async verifyEmail(id: string) {
    console.log("📧 Verifying email for user:", id)

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
        },
      })

      console.log("✅ Email verified successfully for:", updatedUser.email)
      return { message: "Email verified successfully" }
    } catch (error) {
      if (error.code === "P2025") {
        console.log("❌ User not found for email verification:", id)
        throw new NotFoundException(`User with ID ${id} not found`)
      }
      console.error("❌ Error verifying email:", error)
      throw new InternalServerErrorException("Error verifying email: " + error.message)
    }
  }

  // Método adicional para obtener empresas del usuario (para implementar después)
  async getUserCompanies(userId: string) {
    console.log("🏢 Fetching companies for user:", userId)

    // TODO: Implementar cuando se tenga la relación usuario-empresa
    // Por ahora retorna array vacío
    return { companies: [] }
  }

  // Método para cambiar empresa seleccionada
  async selectCompany(userId: string, companyId: string) {
    console.log("🏢 Selecting company for user:", userId, "company:", companyId)

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          companyId: companyId,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          companyId: true,
        },
      })

      console.log("✅ Company selected successfully")
      return { message: "Company selected successfully" }
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`User with ID ${userId} not found`)
      }
      console.error("❌ Error selecting company:", error)
      throw new InternalServerErrorException("Error selecting company: " + error.message)
    }
  }
}
