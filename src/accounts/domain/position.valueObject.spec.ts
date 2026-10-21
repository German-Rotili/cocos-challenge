import { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { Money } from '../../shared/domain/money.valueObject';
import { Position } from './position.valueObject';

const PAMP_ID = 2;

const quote = (
  close: number | null,
  previousClose: number | null = close,
  id = PAMP_ID,
) =>
  InstrumentQuote.create({
    id,
    ticker: 'PAMP',
    name: 'Pampa Holding S.A.',
    type: 'ACCIONES',
    close,
    previousClose,
    asOf: null,
  });

const empty = () => Position.empty(PAMP_ID);

describe('Position', () => {
  it('starts closed, with no cost', () => {
    const position = empty();

    expect(position.isOpen).toBe(false);
    expect(position.quantity).toBe(0);
    expect(position.costBasis).toEqual(Money.ZERO);
    expect(position.averageCost).toBe(0);
  });

  it('adds shares and their cost on a buy', () => {
    const position = empty().bought(10, Money.of(900));

    expect(position).toMatchObject({
      quantity: 10,
      costBasis: Money.of(9_000),
    });
    expect(position.averageCost).toBe(900);
  });

  it('weights the average cost across buys at different prices', () => {
    const position = empty()
      .bought(10, Money.of(900))
      .bought(30, Money.of(1_100));

    expect(position.quantity).toBe(40);
    expect(position.averageCost).toBe(1_050);
  });

  it('keeps the average cost on a partial sell', () => {
    const position = empty()
      .bought(10, Money.of(900))
      .bought(10, Money.of(1_100))
      .sold(5);

    expect(position).toMatchObject({
      quantity: 15,
      costBasis: Money.of(15_000),
    });
    expect(position.averageCost).toBe(1_000);
  });

  it('closes, with no cost left, when every share is sold', () => {
    const position = empty().bought(3, Money.of(333.33)).sold(3);

    expect(position.isOpen).toBe(false);
    expect(position.costBasis).toEqual(Money.ZERO); // no residue from removing the average
  });

  it('gives sold shares their share of the cost, to the cent', () => {
    // 3 shares for 1,000 in all: the one sold takes 333.33, the 2 left keep the rest
    const position = empty()
      .bought(1, Money.of(400))
      .bought(2, Money.of(300))
      .sold(1);

    expect(position.costBasis).toEqual(Money.of(666.67));
  });

  it('refuses to sell more shares than it holds', () => {
    expect(() => empty().bought(5, Money.of(900)).sold(6)).toThrow();
  });

  it('is immutable', () => {
    const before = empty().bought(10, Money.of(900));
    before.bought(5, Money.of(1_000));

    expect(before.quantity).toBe(10);
    expect(Object.isFrozen(before)).toBe(true);
  });
});

describe('Position#valuedAt', () => {
  it('prices the shares at the last close', () => {
    const valuation = empty()
      .bought(10, Money.of(900))
      .valuedAt(quote(1_000, 950));

    expect(valuation).toMatchObject({
      instrumentId: PAMP_ID,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      quantity: 10,
      averageCost: 900,
      marketValue: Money.of(10_000),
    });
  });

  it('measures the total return against the average cost', () => {
    const position = empty()
      .bought(10, Money.of(900))
      .bought(10, Money.of(1_100))
      .sold(5); // 15 at avg 1,000

    expect(position.valuedAt(quote(1_200)).totalReturn).toBeCloseTo(0.2);
  });

  it('reports a loss as a negative return', () => {
    expect(
      empty().bought(10, Money.of(1_000)).valuedAt(quote(800)).totalReturn,
    ).toBeCloseTo(-0.2);
  });

  it("passes on the instrument's daily return", () => {
    expect(
      empty().bought(1, Money.of(900)).valuedAt(quote(1_000, 800)).dailyReturn,
    ).toBeCloseTo(0.25);
  });

  it('has no market value or return when the instrument has no price', () => {
    const valuation = empty().bought(10, Money.of(900)).valuedAt(quote(null));

    expect(valuation.marketValue).toBeNull();
    expect(valuation.totalReturn).toBeNull();
    expect(valuation.dailyReturn).toBeNull();
  });

  it('has no total return when the shares cost nothing', () => {
    expect(
      empty().bought(10, Money.of(0)).valuedAt(quote(900)).totalReturn,
    ).toBeNull();
  });

  it('refuses a quote for another instrument', () => {
    expect(() =>
      empty()
        .bought(1, Money.of(900))
        .valuedAt(quote(900, 900, 99)),
    ).toThrow();
  });
});
