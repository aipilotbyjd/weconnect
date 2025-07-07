import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { LoggerService, LogCategory } from '../infrastructure/logging/logger.service';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || exception.message;
      code = exception.constructor.name;
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      code = 'QUERY_FAILED';
      
      // Handle specific database errors
      if (exception.message.includes('duplicate key')) {
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
      } else if (exception.message.includes('foreign key')) {
        message = 'Referenced resource not found';
        code = 'INVALID_REFERENCE';
      }
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
      code = 'ENTITY_NOT_FOUND';
    } else if (exception instanceof Error) {
      // Handle custom application errors
      if (exception.message.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
      } else if (exception.message.includes('access denied') || exception.message.includes('unauthorized')) {
        status = HttpStatus.FORBIDDEN;
        code = 'ACCESS_DENIED';
      }
      message = exception.message;
    }

    // Log error for monitoring
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        category: LogCategory.API,
        metadata: {
          statusCode: status,
          path: request.url,
          method: request.method,
          code,
          userAgent: request.get('User-Agent'),
          ip: request.ip,
        },
      },
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json(errorResponse);
  }
}
