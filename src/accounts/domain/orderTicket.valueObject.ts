import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { InvalidOrderError } from './errors';
import type { OrderSide, OrderType, TradeSide, TransferSide } from './order.domainEntity';

type Quantity = { size: number; amount?: never } | { amount: number; size?: never };
type Pricing =
  | { type: Extract<OrderType, 'MARKET'>; price?: never }
  | { type: Extract<OrderType, 'LIMIT'>; price: number };

export type TradeInput = { side: TradeSide } & Quantity & Pricing;
export type TransferInput = { side: TransferSide; amount: number };

export class OrderTicket {
  private constructor(
    readonly instrumentId: number,
    readonly side: OrderSide,
    readonly type: OrderType,
    readonly size: number,
    readonly price: number,
  ) {
    Object.freeze(this);
  }

  static trade(input: TradeInput, quote: InstrumentQuote): OrderTicket {
    if (quote.isCash) {
      throw new InvalidOrderError('Cash is moved with CASH_IN/CASH_OUT, not traded');
    }
    const price = OrderTicket.priceFor(input, quote);
    const size = OrderTicket.sizeFor(input, price);
    return new OrderTicket(quote.id, input.side, input.type, size, price);
  }

  static transfer(input: TransferInput, cash: InstrumentQuote): OrderTicket {
    if (!cash.isCash) {
      throw new InvalidOrderError('Transfers must use the cash instrument');
    }
    if (!(input.amount > 0)) {
      throw new InvalidOrderError(`Transfer amount must be positive, got ${input.amount}`);
    }
    return new OrderTicket(cash.id, input.side, 'MARKET', input.amount, 1);
  }

  get cost(): number {
    return this.size * this.price;
  }

  private static priceFor(input: TradeInput, quote: InstrumentQuote): number {
    if (input.type === 'LIMIT') {
      if (!(input.price > 0)) {
        throw new InvalidOrderError(`LIMIT orders need a positive price, got ${input.price}`);
      }
      return input.price;
    }
    const last = quote.lastPrice();
    if (last == null || !(last > 0)) {
      throw new InvalidOrderError(`Instrument ${quote.ticker} has no market price`);
    }
    return last;
  }

  private static sizeFor(input: TradeInput, price: number): number {
    if (input.size !== undefined) {
      if (!Number.isInteger(input.size) || input.size <= 0) {
        throw new InvalidOrderError(`Size must be a positive whole number, got ${input.size}`);
      }
      return input.size;
    }
    if (!(input.amount > 0)) {
      throw new InvalidOrderError(`Amount must be positive, got ${input.amount}`);
    }
    return Math.floor(input.amount / price); // no fractional shares; may be 0
  }
}