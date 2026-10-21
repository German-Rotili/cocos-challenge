import { DomainError } from './domainError';

class SomethingWentSidewaysError extends DomainError {
  readonly category = 'CONFLICT';
}

describe('DomainError', () => {
  const error = new SomethingWentSidewaysError('details');

  it('is a real Error, so stack traces and instanceof keep working', () => {
    expect(error instanceof Error).toBe(true);
    expect(error instanceof DomainError).toBe(true);
    expect(error instanceof SomethingWentSidewaysError).toBe(true);
  });

  it('is named after the concrete class', () => {
    expect(error.name).toBe('SomethingWentSidewaysError');
  });

  it('keeps its message and category', () => {
    expect(error).toMatchObject({ message: 'details', category: 'CONFLICT' });
  });
});
