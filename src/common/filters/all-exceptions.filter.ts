import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message || exception.message
        : 'Internal server error';

    const errorDetails =
      exception instanceof HttpException ? (exception.getResponse() as any)?.error || null : null;

    // Log the detailed error
    this.logger.error(
      `HTTP Status: ${httpStatus} Error Message: ${JSON.stringify(errorMessage)} Path: ${httpAdapter.getRequestUrl(request)}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
      'ExceptionFilter',
    );

    // Include more request details for debugging if needed (be careful with sensitive data)
    this.logger.debug(`Request: ${JSON.stringify({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body, // Be cautious logging request bodies, they might contain sensitive info
      user: (request as any).user, // If user context is available
    })}`, 'ExceptionFilterRequestDetails');


    const responseBody: ApiResponse<null> = {
      statusCode: httpStatus,
      success: false,
      message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      error: {
        message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
        details: errorDetails || (exception instanceof Error && process.env.NODE_ENV !== 'production' ? exception.stack : undefined),
      },
      data: null, // Ensure data is null for error responses
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
