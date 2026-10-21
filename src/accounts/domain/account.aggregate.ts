import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { OrderNotFoundError } from './errors';
import { Order, OrderTerms } from './order.domainEntity';
import {
  OrderTicket,
  TradeInput,
  TransferInput,
} from './orderTicket.valueObject';
import { Position } from './position.valueObject';

export interface Holdings {
  userId: number;
  availableCash: number;
  settledCash: number;
  positions: Position[];
}

export class Account {
  private readonly orders: Order[];

  private constructor(
    readonly userId: number,
    orders: Order[],
  ) {
    this.orders = [...orders];
  }

  static restore(userId: number, orders: Order[]): Account {
    const foreign = orders.find((o) => o.userId !== userId);
    if (foreign) {
      throw new Error(
        `Order ${foreign.id} belongs to user ${foreign.userId}, not ${userId}`,
      );
    }
    return new Account(userId, orders);
  }

  get availableCash(): number {
    return this.orders.reduce((cash, o) => cash + o.cashEffect(), 0);
  }

  get settledCash(): number {
    return this.filled().reduce((cash, o) => cash + o.cashEffect(), 0);
  }

  sellableShares(instrumentId: number): number {
    return this.orders
      .filter((o) => o.instrumentId === instrumentId)
      .reduce((shares, o) => shares + o.sharesEffect(), 0);
  }

  positions(): Position[] {
    const byInstrument = new Map<number, Position>();
    const trades = this.filled()
      .filter((o) => o.isTrade)
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

    for (const trade of trades) {
      const position =
        byInstrument.get(trade.instrumentId) ??
        Position.empty(trade.instrumentId);
      byInstrument.set(
        trade.instrumentId,
        trade.side === 'BUY'
          ? position.bought(trade.size, trade.price)
          : position.sold(trade.size),
      );
    }
    return [...byInstrument.values()].filter((p) => p.isOpen);
  }

  holdings(): Holdings {
    return {
      userId: this.userId,
      availableCash: this.availableCash,
      settledCash: this.settledCash,
      positions: this.positions(),
    };
  }

  placeTrade(input: TradeInput, quote: InstrumentQuote, now: Date): Order {
    return this.submit(OrderTicket.trade(input, quote), now);
  }

  transfer(input: TransferInput, cash: InstrumentQuote, now: Date): Order {
    return this.submit(OrderTicket.transfer(input, cash), now);
  }

  cancel(orderId: number): Order {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) {
      throw new OrderNotFoundError(
        `Order ${orderId} not found for user ${this.userId}`,
      );
    }
    const cancelled = this.orders[index].cancel();
    this.orders[index] = cancelled;
    return cancelled;
  }

  private submit(ticket: OrderTicket, now: Date): Order {
    const terms: OrderTerms = {
      userId: this.userId,
      instrumentId: ticket.instrumentId,
      side: ticket.side,
      type: ticket.type,
      size: ticket.size,
      price: ticket.price,
      datetime: now,
    };
    const order = this.canAfford(ticket)
      ? Order.accepted(terms)
      : Order.rejected(terms);
    this.orders.push(order);
    return order;
  }

  private filled(): Order[] {
    return this.orders.filter((o) => o.status === 'FILLED');
  }

  private canAfford(ticket: OrderTicket): boolean {
    switch (ticket.side) {
      case 'CASH_IN':
        return true;
      case 'CASH_OUT':
        return ticket.size <= this.availableCash;
      case 'BUY':
        return ticket.size >= 1 && ticket.cost <= this.availableCash;
      case 'SELL':
        return (
          ticket.size >= 1 &&
          ticket.size <= this.sellableShares(ticket.instrumentId)
        );
    }
  }
}
