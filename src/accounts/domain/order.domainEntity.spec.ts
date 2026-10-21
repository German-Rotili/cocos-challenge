import { Money } from '../../shared/domain/money.valueObject';
import { OrderNotCancellableError } from './errors';
import { Order, OrderProps, OrderTerms } from './order.domainEntity';

const NOW = new Date('2026-01-01T12:00:00Z');

const terms = (overrides: Partial<OrderTerms> = {}): OrderTerms => ({
  userId: 7,
  instrumentId: 2,
  side: 'BUY',
  type: 'MARKET',
  size: 10,
  price: Money.of(900),
  datetime: NOW,
  ...overrides,
});

const existing = (overrides: Partial<OrderProps> = {}): Order =>
  Order.restore({
    id: 1,
    userId: 1,
    instrumentId: 2,
    side: 'BUY',
    size: 1,
    price: Money.of(1),
    type: 'MARKET',
    status: 'FILLED',
    datetime: NOW,
    ...overrides,
  });

describe('Order.accepted', () => {
  it('fills a MARKET order immediately, keeping its terms', () => {
    expect(Order.accepted(terms())).toMatchObject({
      ...terms(),
      status: 'FILLED',
    });
  });

  it('leaves a LIMIT order as NEW', () => {
    expect(
      Order.accepted(terms({ type: 'LIMIT', price: Money.of(850) })).status,
    ).toBe('NEW');
  });

  it('has no id until persisted', () => {
    expect(Order.accepted(terms()).id).toBeUndefined();
  });
});

describe('Order.rejected', () => {
  it('records the terms as REJECTED', () => {
    expect(
      Order.rejected(terms({ type: 'LIMIT', price: Money.of(850) })),
    ).toMatchObject({
      status: 'REJECTED',
      price: Money.of(850),
    });
  });
});

describe('Order#cancel', () => {
  it('returns a CANCELLED copy and leaves the original unchanged', () => {
    const order = existing({ type: 'LIMIT', status: 'NEW' });

    expect(order.cancel()).toMatchObject({ id: 1, status: 'CANCELLED' });
    expect(order.status).toBe('NEW');
  });

  it.each(['FILLED', 'REJECTED', 'CANCELLED'] as const)(
    'refuses a %s order',
    (status) => {
      expect(() => existing({ status }).cancel()).toThrow(
        OrderNotCancellableError,
      );
    },
  );
});

describe('Order effects', () => {
  it.each([
    ['CASH_IN', 'FILLED', 1_000, 1, 1_000],
    ['CASH_OUT', 'FILLED', 300, 1, -300],
    ['CASH_IN', 'FILLED', 1_000, 9_999, 1_000], // price ignored for transfers
    ['BUY', 'FILLED', 10, 900, -9_000],
    ['SELL', 'FILLED', 2, 950, 1_900],
    ['BUY', 'NEW', 5, 1_000, -5_000], // reserved
    ['SELL', 'NEW', 5, 1_000, 0],
    ['BUY', 'REJECTED', 99, 99, 0],
    ['BUY', 'CANCELLED', 1, 500, 0],
  ] as const)(
    '%s %s of size %p at %p has cash effect %p',
    (side, status, size, price, effect) => {
      expect(
        existing({ side, status, size, price: Money.of(price) })
          .cashEffect()
          .toNumber(),
      ).toBe(effect);
    },
  );

  it.each([
    ['BUY', 'FILLED', 10],
    ['SELL', 'FILLED', -10],
    ['SELL', 'NEW', -10], // reserved
    ['BUY', 'NEW', 0], // not owned until filled
    ['SELL', 'CANCELLED', 0],
    ['CASH_IN', 'FILLED', 0],
  ] as const)(
    '%s %s of 10 shares has shares effect %p',
    (side, status, effect) => {
      expect(existing({ side, status, size: 10 }).sharesEffect()).toBe(effect);
    },
  );
});

it('is frozen', () => {
  expect(Object.isFrozen(existing())).toBe(true);
});
