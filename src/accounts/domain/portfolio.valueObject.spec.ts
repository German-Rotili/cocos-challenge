import { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import type { Holdings } from './account.aggregate';
import { Portfolio } from './portfolio.valueObject';
import { Position } from './position.valueObject';

const USER = 1;
const PAMP_ID = 2;
const GGAL_ID = 3;

const quote = (id: number, ticker: string, close: number | null) =>
  InstrumentQuote.create({
    id,
    ticker,
    name: ticker,
    type: 'ACCIONES',
    close,
    previousClose: close,
    asOf: null,
  });

const QUOTES = new Map([
  [PAMP_ID, quote(PAMP_ID, 'PAMP', 900)],
  [GGAL_ID, quote(GGAL_ID, 'GGAL', 1_500)],
]);

const holdings = (overrides: Partial<Holdings> = {}): Holdings => ({
  userId: USER,
  availableCash: 0,
  settledCash: 0,
  positions: [],
  ...overrides,
});

const pamp = (quantity: number, price: number) =>
  Position.empty(PAMP_ID).bought(quantity, price);

describe('Portfolio.value', () => {
  it('is all zeros for empty holdings', () => {
    expect(Portfolio.value(holdings(), QUOTES)).toMatchObject({
      userId: USER,
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('values settled cash plus positions at the last close', () => {
    const portfolio = Portfolio.value(
      holdings({
        availableCash: 92_000,
        settledCash: 92_000,
        positions: [pamp(10, 800)], // 10 × 900
      }),
      QUOTES,
    );

    expect(portfolio.availableCash).toBe(92_000);
    expect(portfolio.totalValue).toBe(101_000);
    expect(portfolio.positions).toEqual([
      expect.objectContaining({
        ticker: 'PAMP',
        quantity: 10,
        averageCost: 800,
        marketValue: 9_000,
      }),
    ]);
    expect(portfolio.positions[0].totalReturn).toBeCloseTo(0.125);
  });

  it('values each position at its own quote', () => {
    const portfolio = Portfolio.value(
      holdings({
        positions: [pamp(10, 900), Position.empty(GGAL_ID).bought(2, 1_500)],
      }),
      QUOTES,
    );

    expect(portfolio.positions.map((p) => p.marketValue)).toEqual([
      9_000, 3_000,
    ]);
    expect(portfolio.totalValue).toBe(12_000);
  });

  it('counts reserved cash in the total value, not in the available cash', () => {
    const portfolio = Portfolio.value(
      holdings({ availableCash: 92_000, settledCash: 100_000 }),
      QUOTES,
    );

    expect(portfolio).toMatchObject({
      availableCash: 92_000,
      totalValue: 100_000,
    });
  });

  it('leaves an unpriced position out of the total value', () => {
    const unpriced = new Map([[PAMP_ID, quote(PAMP_ID, 'PAMP', null)]]);

    const portfolio = Portfolio.value(
      holdings({ settledCash: 1_000, positions: [pamp(10, 900)] }),
      unpriced,
    );

    expect(portfolio.totalValue).toBe(1_000);
    expect(portfolio.positions).toEqual([
      expect.objectContaining({ quantity: 10, marketValue: null }),
    ]);
  });

  it('fails loudly when a held instrument has no quote', () => {
    expect(() =>
      Portfolio.value(holdings({ positions: [pamp(10, 900)] }), new Map()),
    ).toThrow();
  });

  it('is immutable', () => {
    expect(Object.isFrozen(Portfolio.value(holdings(), QUOTES))).toBe(true);
  });
});
