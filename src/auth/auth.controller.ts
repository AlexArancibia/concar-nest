import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateUserDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { PublicKeyGuard } from './guards/public.guard';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { User } from '@prisma/client';

interface LoginResponse {
  access_token: string;
  userInfo: Partial<User>;
  company: any; // Adjust this type based on your company data structure
}

interface UserResponse extends Partial<User> {}


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(PublicKeyGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateAuthDto): Promise<ApiResponse<LoginResponse>> {
    const data = await this.authService.create(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'User registered successfully',
      data,
    };
  }

  @UseGuards(PublicKeyGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginAuthDto): Promise<ApiResponse<LoginResponse>> {
    const data = await this.authService.login(loginUserDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data,
    };
  }

  @UseGuards(AuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<UserResponse[]>> {
    const users = await this.authService.findAll();
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<ApiResponse<UserResponse>> {
    const user = await this.authService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponse<UserResponse>> {
    const user = await this.authService.update(id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Or HttpStatus.NO_CONTENT if no body is returned, but we return a message
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.authService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User deleted successfully',
      data: null,
    };
  }
}