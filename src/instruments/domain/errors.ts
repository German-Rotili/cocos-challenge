import { DomainError } from '../../shared/domain/domainError';

export class InstrumentNotFoundError extends DomainError {
  readonly category = 'NOT_FOUND';
}
