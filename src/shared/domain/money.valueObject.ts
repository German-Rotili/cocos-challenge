import { DomainError } from './domainError';

export class InvalidMoneyError extends DomainError {
  readonly category = 'INVALID';
}

const CENTS_PER_PESO = 100;

export class Money {
  static readonly ZERO = new Money(0);

  private constructor(readonly cents: number) {
    Object.freeze(this);
  }

  /** From pesos with at most 2 decimals, e.g. 925.85. Anything finer is refused, not rounded. */
  static of(pesos: number): Money {
    if (!Number.isFinite(pesos) || Number(pesos.toFixed(2)) !== pesos) {
      throw new InvalidMoneyError(
        `${pesos} is not an amount of pesos with at most 2 decimals`,
      );
    }
    return Money.fromCents(Math.round(pesos * CENTS_PER_PESO));
  }

  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents)) {
      throw new InvalidMoneyError(`${cents} is not a whole number of cents`);
    }
    return cents === 0 ? Money.ZERO : new Money(cents);
  }

  static sum(amounts: Iterable<Money>): Money {
    let total = Money.ZERO;
    for (const amount of amounts) total = total.plus(amount);
    return total;
  }

  plus(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  minus(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  negated(): Money {
    return Money.fromCents(-this.cents);
  }

  times(quantity: number): Money {
    if (!Number.isInteger(quantity)) {
      throw new Error(
        `Money can only be multiplied by a whole number, got ${quantity}`,
      );
    }
    return Money.fromCents(this.cents * quantity);
  }

  share(part: number, whole: number): Money {
    return Money.fromCents(Math.round((this.cents * part) / whole));
  }

  wholeUnitsAt(price: Money): number {
    if (!price.isPositive()) {
      throw new Error(`Price must be positive, got ${price.toNumber()}`);
    }
    return Math.floor(this.cents / price.cents);
  }

  ratioTo(other: Money): number {
    return this.cents / other.cents;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isAtMost(other: Money): boolean {
    return this.cents <= other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  /** Pesos as a plain number, for the edges (persistence, HTTP). */
  toNumber(): number {
    return this.cents / CENTS_PER_PESO;
  }
}
