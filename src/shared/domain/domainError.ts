/**
 * What kind of failure a domain error is, independent of any transport.
 * Each adapter (HTTP, a queue consumer, a CLI) decides how to express it.
 *
 * - INVALID:   the input breaks a domain rule; nothing was changed
 * - NOT_FOUND: something the operation needs doesn't exist
 * - CONFLICT:  the input is fine, but the current state doesn't allow the operation
 */
export type DomainErrorCategory = 'INVALID' | 'NOT_FOUND' | 'CONFLICT';

export abstract class DomainError extends Error {
  abstract readonly category: DomainErrorCategory;

  constructor(message: string) {
    super(message);
    this.name = new.target.name; // the concrete class, e.g. "OrderNotCancellableError"
  }
}