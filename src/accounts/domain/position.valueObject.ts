import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { Money } from '../../shared/domain/money.valueObject';

export interface PositionValuation {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number; // pesos per share; may have more than 2 decimals
  marketValue: Money | null;
  totalReturn: number | null;
  dailyReturn: number | null;
}

export class Position {
  private constructor(
    readonly instrumentId: number,
    readonly quantity: number,
    readonly costBasis: Money,
  ) {
    Object.freeze(this);
  }

  static empty(instrumentId: number): Position {
    return new Position(instrumentId, 0, Money.ZERO);
  }

  get isOpen(): boolean {
    return this.quantity > 0;
  }

  get averageCost(): number {
    return this.isOpen ? this.costBasis.toNumber() / this.quantity : 0;
  }

  bought(size: number, price: Money): Position {
    return new Position(
      this.instrumentId,
      this.quantity + size,
      this.costBasis.plus(price.times(size)),
    );
  }

  sold(size: number): Position {
    if (size > this.quantity) {
      throw new Error(
        `Cannot sell ${size} of instrument ${this.instrumentId}: only ${this.quantity} held`,
      );
    }
    const remaining = this.quantity - size;
    // the sold shares take their share of the cost, to the cent; the rest stays
    const costBasis =
      remaining === 0
        ? Money.ZERO
        : this.costBasis.minus(this.costBasis.share(size, this.quantity));
    return new Position(this.instrumentId, remaining, costBasis);
  }

  valuedAt(quote: InstrumentQuote): PositionValuation {
    if (quote.id !== this.instrumentId) {
      throw new Error(
        `Quote ${quote.id} does not price instrument ${this.instrumentId}`,
      );
    }
    const marketValue = quote.marketValue(this.quantity);
    return {
      instrumentId: this.instrumentId,
      ticker: quote.ticker,
      name: quote.name,
      quantity: this.quantity,
      averageCost: this.averageCost,
      marketValue,
      totalReturn:
        marketValue == null || !this.costBasis.isPositive()
          ? null
          : marketValue.minus(this.costBasis).ratioTo(this.costBasis),
      dailyReturn: quote.dailyReturn(),
    };
  }
}
