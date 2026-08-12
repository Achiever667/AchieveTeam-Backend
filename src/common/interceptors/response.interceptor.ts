import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types/api-response.type';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If data already has a message property (from controller), use it
        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          return {
            status: true,
            code: statusCode,
            message: data.message,
            data: data.data,
          };
        }

        // Otherwise, use a default message based on HTTP method
        const request = context.switchToHttp().getRequest();
        let message = 'Request successful';

        if (request.method === 'POST') {
          message = 'Resource created successfully';
        } else if (request.method === 'PATCH' || request.method === 'PUT') {
          message = 'Resource updated successfully';
        } else if (request.method === 'DELETE') {
          message = 'Resource deleted successfully';
        }

        return {
          status: true,
          code: statusCode,
          message,
          data: data || null,
        };
      }),
    );
  }
}
