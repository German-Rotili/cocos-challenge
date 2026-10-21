import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainErrorCategory, DomainError } from '../domain/domainError';

export const STATUS_BY_CATEGORY: Record<DomainErrorCategory, HttpStatus> = {
  INVALID: HttpStatus.UNPROCESSABLE_ENTITY,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
};

export interface DomainErrorBody {
  statusCode: number;
  error: string;
  message: string;
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const statusCode = STATUS_BY_CATEGORY[exception.category];
    const body: DomainErrorBody = {
      statusCode,
      error: exception.name,
      message: exception.message,
    };
    host.switchToHttp().getResponse<Response>().status(statusCode).json(body);
  }
}
