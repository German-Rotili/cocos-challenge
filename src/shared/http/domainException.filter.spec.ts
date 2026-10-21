import { ArgumentsHost } from '@nestjs/common';
import {
  InvalidOrderError,
  OrderNotCancellableError,
  OrderNotFoundError,
} from '../../accounts/domain/errors';
import { DomainError } from '../domain/domainError';
import {
  DomainErrorBody,
  DomainExceptionFilter,
} from './domainException.filter';

/** Captures what the filter writes to the response. */
function respond(error: DomainError): {
  status?: number;
  body?: DomainErrorBody;
} {
  const sent: { status?: number; body?: DomainErrorBody } = {};
  const response = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: DomainErrorBody) {
      sent.body = body;
      return this;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  new DomainExceptionFilter().catch(error, host);
  return sent;
}

describe('DomainExceptionFilter', () => {
  it.each([
    [new InvalidOrderError('x'), 422],
    [new OrderNotFoundError('x'), 404],
    [new OrderNotCancellableError('x'), 409],
  ] as const)('maps %p to %p', (error, status) => {
    expect(respond(error).status).toBe(status);
  });

  it('answers with the status, the error name and the message', () => {
    const { body } = respond(new OrderNotCancellableError('Order 7 is FILLED'));

    expect(body).toMatchObject({
      statusCode: 409,
      error: 'OrderNotCancellableError',
      message: 'Order 7 is FILLED',
    });
  });
});
