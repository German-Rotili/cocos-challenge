import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { Money } from '../../shared/domain/money.valueObject';
import { InvalidOrderError } from './errors';
import type {
  OrderSide,
  OrderType,
  TradeSide,
  TransferSide,
} from './order.domainEntity';

/**
 * A trade states its quantity either as `size` (shares) or as `budget`: a budget
 * in pesos that the ticket turns into the most whole shares it buys.
 */
type Quantity =
  { size: number; budget?: never } | { budget: number; size?: never };
type Pricing =
  | { type: Extract<OrderType, 'MARKET'>; price?: never }
  | { type: Extract<OrderType, 'LIMIT'>; price: number };

export type TradeInput = { side: TradeSide } & Quantity & Pricing;
/** A transfer moves `size` units of the cash instrument: one unit is one peso. */
export type TransferInput = { side: TransferSide; size: number };

/**
 * Value object.
 *
 * The terms of an order before it is submitted: what the user wants to do,
 * made precise. The price is fixed, and `size` is always units of the instrument:
 * whole shares for a trade, pesos for a transfer. `budget` never gets past here.
 *
 * It says nothing about whether the account can afford it; that's Account's job,
 * and Account is the only code that creates tickets.
 */
export class OrderTicket {
  private constructor(
    readonly instrumentId: number,
    readonly side: OrderSide,
    readonly type: OrderType,
    readonly size: number,
    readonly price: Money,
  ) {
    Object.freeze(this);
  }

  static trade(input: TradeInput, quote: InstrumentQuote): OrderTicket {
    if (quote.isCash) {
      throw new InvalidOrderError(
        'Cash is moved with CASH_IN/CASH_OUT, not traded',
      );
    }
    const price = OrderTicket.priceFor(input, quote);
    const size = OrderTicket.sizeFor(input, price);
    return new OrderTicket(quote.id, input.side, input.type, size, price);
  }

  static transfer(input: TransferInput, cash: InstrumentQuote): OrderTicket {
    if (!cash.isCash) {
      throw new InvalidOrderError('Transfers must use the cash instrument');
    }
    if (!Number.isInteger(input.size) || input.size <= 0) {
      throw new InvalidOrderError(
        `Transfer size must be a positive whole number of pesos, got ${input.size}`,
      );
    }
    return new OrderTicket(
      cash.id,
      input.side,
      'MARKET',
      input.size,
      Money.of(1),
    );
  }

  /** Pesos this ticket would commit if accepted. */
  get cost(): Money {
    return this.price.times(this.size);
  }

  private static priceFor(input: TradeInput, quote: InstrumentQuote): Money {
    if (input.type === 'LIMIT') {
      if (!(input.price > 0)) {
        throw new InvalidOrderError(
          `LIMIT orders need a positive price, got ${input.price}`,
        );
      }
      return Money.of(input.price);
    }
    const last = quote.lastPrice();
    if (last == null || !last.isPositive()) {
      throw new InvalidOrderError(
        `Instrument ${quote.ticker} has no market price`,
      );
    }
    return last;
  }

  private static sizeFor(input: TradeInput, price: Money): number {
    if (input.size !== undefined) {
      if (!Number.isInteger(input.size) || input.size <= 0) {
        throw new InvalidOrderError(
          `Size must be a positive whole number, got ${input.size}`,
        );
      }
      return input.size;
    }
    if (!(input.budget > 0)) {
      throw new InvalidOrderError(
        `budget must be positive, got ${input.budget}`,
      );
    }
    return Money.of(input.budget).wholeUnitsAt(price); // no fractional shares; may be 0
  }
}
