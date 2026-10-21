import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import type { Holdings } from './account.aggregate';
import type { PositionValuation } from './position.valueObject';

export class Portfolio {
  private constructor(
    readonly userId: number,
    readonly totalValue: number,
    readonly availableCash: number,
    readonly positions: readonly PositionValuation[],
  ) {
    Object.freeze(this);
  }

  static value(
    holdings: Holdings,
    quotes: ReadonlyMap<number, InstrumentQuote>,
  ): Portfolio {
    const positions = holdings.positions.map((position) => {
      const quote = quotes.get(position.instrumentId);
      if (!quote)
        throw new Error(`No quote for instrument ${position.instrumentId}`);
      return position.valuedAt(quote);
    });
    const positionsValue = positions.reduce(
      (sum, p) => sum + (p.marketValue ?? 0),
      0,
    );

    return new Portfolio(
      holdings.userId,
      holdings.settledCash + positionsValue,
      holdings.availableCash,
      positions,
    );
  }
}
