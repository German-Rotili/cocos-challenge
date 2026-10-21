import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';

export interface PositionValuation {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  marketValue: number | null;
  totalReturn: number | null;
  dailyReturn: number | null;
}

export class Position {
  private constructor(
    readonly instrumentId: number,
    readonly quantity: number,
    readonly costBasis: number,
  ) {
    Object.freeze(this);
  }

  static empty(instrumentId: number): Position {
    return new Position(instrumentId, 0, 0);
  }

  get isOpen(): boolean {
    return this.quantity > 0;
  }

  get averageCost(): number {
    return this.isOpen ? this.costBasis / this.quantity : 0;
  }

  bought(size: number, price: number): Position {
    return new Position(this.instrumentId, this.quantity + size, this.costBasis + size * price);
  }

  sold(size: number): Position {
    if (size > this.quantity) {
      throw new Error(
        `Cannot sell ${size} of instrument ${this.instrumentId}: only ${this.quantity} held`,
      );
    }
    const remaining = this.quantity - size;
    const costBasis = remaining === 0 ? 0 : this.costBasis - this.averageCost * size;
    return new Position(this.instrumentId, remaining, costBasis);
  }

  valuedAt(quote: InstrumentQuote): PositionValuation {
    if (quote.id !== this.instrumentId) {
      throw new Error(`Quote ${quote.id} does not price instrument ${this.instrumentId}`);
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
        marketValue == null || this.costBasis <= 0
          ? null
          : (marketValue - this.costBasis) / this.costBasis,
      dailyReturn: quote.dailyReturn(),
    };
  }
}
