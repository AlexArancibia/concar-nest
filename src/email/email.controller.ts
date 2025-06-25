import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { PublicKeyGuard } from 'src/auth/guards/public.guard';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

class SendEmailDto {
  to: string;
  subject: string;
  html: string;
  from?: {
    name?: string;
    address?: string;
  };
}

class FormSubmissionDto {
  [key: string]: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PublicKeyGuard)
  async sendEmail(@Body() emailDto: SendEmailDto): Promise<ApiResponse<null>> {
    await this.emailService.sendEmail(emailDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Email sent successfully',
      data: null,
    };
  }

  @UseGuards(PublicKeyGuard)
  @Post('submit-form')
  @HttpCode(HttpStatus.OK)
  async handleFormSubmission(@Body() formData: FormSubmissionDto): Promise<ApiResponse<null>> {
    await this.emailService.sendFormSubmissionNotification(formData);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Form submission received and notification sent',
      data: null,
    };
  }
}
