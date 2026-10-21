import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { Money } from '../../shared/domain/money.valueObject';
import type { Holdings } from './account.aggregate';
import type { PositionValuation } from './position.valueObject';

export class Portfolio {
  private constructor(
    readonly userId: number,
    readonly totalValue: Money,
    readonly availableCash: Money,
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
    const positionsValue = Money.sum(
      positions.map((p) => p.marketValue ?? Money.ZERO),
    );

    return new Portfolio(
      holdings.userId,
      holdings.settledCash.plus(positionsValue),
      holdings.availableCash,
      positions,
    );
  }
}
