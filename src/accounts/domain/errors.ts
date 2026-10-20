import { DomainError } from '../../shared/domain/domainError';

export class InvalidOrderError extends DomainError {
  readonly category = 'INVALID';
}

export class OrderNotCancellableError extends DomainError {
  readonly category = 'CONFLICT';
}

export class OrderNotFoundError extends DomainError {
  readonly category = 'NOT_FOUND';
}

export class UserNotFoundError extends DomainError {
  readonly category = 'NOT_FOUND';
}
