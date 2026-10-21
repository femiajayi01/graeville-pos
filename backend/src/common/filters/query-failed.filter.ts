import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Turns database constraint errors into clean HTTP responses instead of 500s.
 * 23505 = unique_violation, 23503 = foreign_key_violation (Postgres error codes).
 */
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  catch(
    exception: QueryFailedError & {
      driverError?: { code?: string; detail?: string };
    },
    host: ArgumentsHost,
  ) {
    const response = host.switchToHttp().getResponse<Response>();
    const code = exception.driverError?.code;
    const detail = exception.driverError?.detail ?? '';

    if (code === '23505') {
      const field = /Key \(([^)]+)\)/.exec(detail)?.[1] ?? 'value';
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: `A record with this ${field} already exists`,
        error: 'Conflict',
      });
    }
    if (code === '23503') {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message:
          'This record is referenced by other records and cannot be changed',
        error: 'Conflict',
      });
    }

    this.logger.error(exception.message, exception.stack);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
