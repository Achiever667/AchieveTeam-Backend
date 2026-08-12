import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../types/api-response.type';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let data: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exObj = exceptionResponse as any;

        // Handle class-validator validation errors
        if (exObj.message && Array.isArray(exObj.message)) {
          message = 'Validation failed';
          data = exObj.message.map((msg: any) => {
            if (typeof msg === 'string') return msg;
            if (typeof msg === 'object' && msg.constraints) {
              return {
                field: msg.property,
                errors: Object.values(msg.constraints),
              };
            }
            return msg;
          });
        } else if (exObj.message) {
          message = exObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log errors appropriately
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(`${request.method} ${request.url} - ${message}`);
    }

    const errorResponse: ApiResponse = {
      status: false,
      code: status,
      message,
      data,
    };

    response.status(status).json(errorResponse);
  }
}

