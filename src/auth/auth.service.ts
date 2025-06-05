import { Injectable, ConflictException, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateUserDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async create(createUserDto: CreateAuthDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
  
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  
    try {
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role,
          phone: createUserDto.phone,
          authProvider: createUserDto.authProvider || 'EMAIL',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
  
      // Eliminar la contraseña del resultado
      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error creating user: ' + error.message);
    }
  }

  async login(loginUserDto: LoginAuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginUserDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordMatch = await bcrypt.compare(loginUserDto.password, user.password);

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Actualizar lastLogin
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
        },
      });

      const { password, ...userWithoutPassword } = user;
      
      // Crear payload para el token
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      
      const access_token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '5d',
      });
      
      return { access_token, userInfo: userWithoutPassword };
    } catch(error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during login: ' + error.message);
    }
  }

  async findAll() {
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
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
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
        createdAt: true,
        updatedAt: true,
        preferences: true,
        authProvider: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Manejar cambio de contraseña
    if (updateUserDto.newPassword && updateUserDto.password) {
      // Verificar contraseña actual
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { password: true },
      });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      const isPasswordMatch = await bcrypt.compare(updateUserDto.password, user.password);
      
      if (!isPasswordMatch) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      
      // Actualizar a la nueva contraseña
      updateUserDto.password = await bcrypt.hash(updateUserDto.newPassword, 10);
      delete updateUserDto.newPassword;
    } else if (updateUserDto.password) {
      // Si solo se proporciona password (sin verificación)
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Siempre actualizar updatedAt
    updateUserDto['updatedAt'] = new Date();

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
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
          createdAt: true,
          updatedAt: true,
          preferences: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }
  
  async verifyEmail(id: string) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          emailVerified: new Date(),
        },
      });
      
      return { message: 'Email verified successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }
}