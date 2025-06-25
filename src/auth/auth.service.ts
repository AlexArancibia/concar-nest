import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateUserDto } from "./dto/update-auth.dto";
import { LoginAuthDto } from "./dto/login-auth.dto";
import * as bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";
import { AuthProvider, UserRole, Prisma } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateAuthDto) {
    this.logger.log(`Attempting to create new user: ${createUserDto.email}`);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      this.logger.warn(`Email already exists: ${createUserDto.email}`);
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    this.logger.log("Password hashed successfully");

    try {
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role || UserRole.ACCOUNTANT,
          phone: createUserDto.phone,
          image: createUserDto.image,
          bio: createUserDto.bio,
          authProvider: createUserDto.authProvider || AuthProvider.EMAIL,
          companyId: createUserDto.companyId,
          isActive: true,
        },
        include: {
          company: true,
        },
      });

      const { password, company, ...userWithoutPasswordAndCompany } = user;
      this.logger.log(`User created successfully: ${user.id}`);

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const access_token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: "5d",
      });
      this.logger.log(`Access token generated for new user: ${user.id}`);

      return {
        access_token,
        userInfo: userWithoutPasswordAndCompany,
        company: company || null,
      };
    } catch (error) {
      this.logger.error(`Error creating user: ${createUserDto.email}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors, e.g., unique constraint violation if not caught by findUnique
        throw new ConflictException("Could not create user due to a database conflict.");
      }
      throw new InternalServerErrorException("An unexpected error occurred while creating the user.");
    }
  }

  async login(loginUserDto: LoginAuthDto) {
    this.logger.log(`Login attempt for: ${loginUserDto.email}`);
    const user = await this.prisma.user.findUnique({
      where: { email: loginUserDto.email },
      include: {
        company: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginUserDto.email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed: Account inactive - ${loginUserDto.email}`);
      throw new UnauthorizedException("Account is inactive");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logger.warn(`Login failed: Account locked - ${loginUserDto.email}`);
      throw new UnauthorizedException("Account is temporarily locked");
    }

    const isPasswordMatch = await bcrypt.compare(loginUserDto.password, user.password);

    if (!isPasswordMatch) {
      this.logger.warn(`Login failed: Invalid password - ${loginUserDto.email}`);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: user.failedLoginAttempts + 1,
          lockedUntil: user.failedLoginAttempts >= 4 ? new Date(Date.now() + 30 * 60 * 1000) : null,
        },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    this.logger.log(`Login successful for: ${user.email}`);

    const { password, company, ...userWithoutPasswordAndCompany } = user;
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: "5d",
    });
    this.logger.log(`Access token generated for: ${user.email}`);

    return {
      access_token,
      userInfo: userWithoutPasswordAndCompany,
      company: company || null,
    };
  }

  async findAll() {
    this.logger.log("Fetching all users");
    try {
      return await this.prisma.user.findMany({
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
      });
    } catch (error) {
      this.logger.error("Error fetching all users", error.stack);
      throw new InternalServerErrorException("Failed to retrieve users.");
    }
  }

  async findOne(id: string) {
    this.logger.log(`Fetching user with ID: ${id}`);
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
    });

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    this.logger.log(`User found: ${user.email}`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Attempting to update user: ${id}`);
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true, email: true },
    });

    if (!existingUser) {
      this.logger.warn(`User not found for update: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.newPassword && updateUserDto.password) {
      this.logger.log(`Changing password for user: ${id}`);
      const isPasswordMatch = await bcrypt.compare(updateUserDto.password, existingUser.password);
      if (!isPasswordMatch) {
        this.logger.warn(`Current password incorrect for user: ${id}`);
        throw new UnauthorizedException("Current password is incorrect");
      }
      updateUserDto.password = await bcrypt.hash(updateUserDto.newPassword, 10);
      delete updateUserDto.newPassword; // Remove newPassword from DTO after hashing
      this.logger.log("Password updated successfully");
    } else if (updateUserDto.password && !updateUserDto.newPassword) {
      // If only password is provided, it implies setting a new password without current one (e.g. admin reset)
      // This logic might need adjustment based on actual requirements for password updates.
      // For now, let's assume it's an admin-like direct password update.
      this.logger.log(`Password being reset for user: ${id}`);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }


    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        this.logger.warn(`Email already exists: ${updateUserDto.email}`);
        throw new ConflictException("Email already exists");
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { ...updateUserDto, updatedAt: new Date() }, // Ensure updatedAt is always set
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
      });
      this.logger.log(`User updated successfully: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating user: ${id}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`User with ID ${id} not found for update.`);
      }
      throw new InternalServerErrorException("An unexpected error occurred while updating the user.");
    }
  }

  async remove(id: string) {
    this.logger.log(`Attempting to remove user: ${id}`);
    // First, check if user exists to throw NotFoundException if applicable
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true }, // Select minimal fields
    });

    if (!user) {
      this.logger.warn(`User not found for deletion: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });
      this.logger.log(`User deleted successfully: ${user.email}`);
      return { message: "User deleted successfully" };
    } catch (error) {
      this.logger.error(`Error deleting user: ${id}`, error.stack);
      // P2025 is "Record to delete does not exist", but we already checked.
      // Other Prisma errors could occur, e.g., foreign key constraints.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2003') { // Foreign key constraint failed
          throw new ConflictException(`Cannot delete user with ID ${id} due to existing related records.`);
        }
      }
      throw new InternalServerErrorException("An unexpected error occurred while deleting the user.");
    }
  }

  async verifyEmail(id: string) {
    this.logger.log(`Verifying email for user: ${id}`);
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
      });
      this.logger.log(`Email verified successfully for: ${updatedUser.email}`);
      return { message: "Email verified successfully" };
    } catch (error) {
      this.logger.error(`Error verifying email for user: ${id}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`User with ID ${id} not found for email verification.`);
      }
      throw new InternalServerErrorException("An unexpected error occurred while verifying the email.");
    }
  }

  async getUserCompanies(userId: string) {
    this.logger.log(`Fetching companies for user: ${userId}`);
    // TODO: Implement proper logic when user-company relation is defined
    return { companies: [] };
  }

  async selectCompany(userId: string, companyId: string) {
    this.logger.log(`Selecting company for user: ${userId}, company: ${companyId}`);
    try {
      // First, ensure the user exists
      const userExists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }
      // Optionally, ensure the company exists
      const companyExists = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
      if (!companyExists) {
        throw new NotFoundException(`Company with ID ${companyId} not found.`);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          companyId: companyId,
          updatedAt: new Date(),
        },
        select: { // Select minimal fields, or what's needed by the client
          id: true,
          companyId: true,
        },
      });
      this.logger.log("Company selected successfully");
      return { message: "Company selected successfully" };
    } catch (error) {
      this.logger.error(`Error selecting company for user: ${userId}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        // This might be redundant if we check existence first, but good as a fallback.
        throw new NotFoundException(`User or Company not found during company selection.`);
      }
       if (error instanceof NotFoundException) { // Re-throw if it's our explicit NotFoundException
        throw error;
      }
      throw new InternalServerErrorException("An unexpected error occurred while selecting the company.");
    }
  }
}
