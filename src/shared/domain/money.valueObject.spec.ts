import { InvalidMoneyError, Money } from './money.valueObject';

describe('Money', () => {
  it('holds pesos as whole cents', () => {
    expect(Money.of(925.85).cents).toBe(92_585);
    expect(Money.of(1000).cents).toBe(100_000);
    expect(Money.of(-0.5).cents).toBe(-50);
  });

  it('refuses more than 2 decimals instead of rounding', () => {
    expect(() => Money.of(850.555)).toThrow(InvalidMoneyError);
    expect(() => Money.of(Number.NaN)).toThrow(InvalidMoneyError);
    expect(() => Money.of(Infinity)).toThrow(InvalidMoneyError);
  });

  it('only takes whole cents', () => {
    expect(() => Money.fromCents(0.5)).toThrow(InvalidMoneyError);
  });

  it('subtracts exactly where floats do not', () => {
    // as floats: 1000 − 3 × 333.33 = 0.009999999999990905
    expect(Money.of(1000).minus(Money.of(333.33).times(3)).toNumber()).toBe(
      0.01,
    );
  });

  it('adds exactly where floats do not', () => {
    // as floats: 0.1 + 0.2 = 0.30000000000000004
    expect(Money.of(0.1).plus(Money.of(0.2)).equals(Money.of(0.3))).toBe(true);
  });

  it('sums a list, zero when empty', () => {
    expect(Money.sum([Money.of(1.1), Money.of(2.2)]).toNumber()).toBe(3.3);
    expect(Money.sum([])).toBe(Money.ZERO);
  });

  it('negates', () => {
    expect(Money.of(12.34).negated().toNumber()).toBe(-12.34);
  });

  it('multiplies by whole quantities only', () => {
    expect(Money.of(0.07).times(3).toNumber()).toBe(0.21);
    expect(() => Money.of(1).times(1.5)).toThrow();
  });

  it('counts the whole units a budget pays for', () => {
    // as floats: 0.21 / 0.07 = 2.9999999999999996
    expect(Money.of(0.21).wholeUnitsAt(Money.of(0.07))).toBe(3);
    expect(Money.of(0.2).wholeUnitsAt(Money.of(0.07))).toBe(2);
    expect(() => Money.of(1).wholeUnitsAt(Money.ZERO)).toThrow();
  });

  it('takes a share to the nearest cent', () => {
    expect(Money.of(1000).share(1, 3).toNumber()).toBe(333.33);
    expect(Money.of(1000).share(2, 3).toNumber()).toBe(666.67);
  });

  it('compares', () => {
    expect(Money.of(0.01).isAtMost(Money.of(0.01))).toBe(true);
    expect(Money.of(0.02).isAtMost(Money.of(0.01))).toBe(false);
    expect(Money.of(0.01).isPositive()).toBe(true);
    expect(Money.ZERO.isPositive()).toBe(false);
  });

  it('measures a ratio', () => {
    expect(Money.of(10).ratioTo(Money.of(40))).toBe(0.25);
  });

  it('is immutable', () => {
    expect(Object.isFrozen(Money.of(1))).toBe(true);
  });
});
