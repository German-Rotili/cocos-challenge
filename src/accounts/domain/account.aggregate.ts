import type { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { OrderNotFoundError } from './errors';
import { Order, OrderTerms } from './order.domainEntity';
import { OrderTicket, TradeInput, TransferInput } from './orderTicket.valueObject';

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
      throw new Error(`Order ${foreign.id} belongs to user ${foreign.userId}, not ${userId}`);
    }
    return new Account(userId, orders);
  }

  get availableCash(): number {
    return this.orders.reduce((cash, o) => cash + o.cashEffect(), 0);
  }

  sellableShares(instrumentId: number): number {
    return this.orders
      .filter((o) => o.instrumentId === instrumentId)
      .reduce((shares, o) => shares + o.sharesEffect(), 0);
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
      throw new OrderNotFoundError(`Order ${orderId} not found for user ${this.userId}`);
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
    const order = this.canAfford(ticket) ? Order.accepted(terms) : Order.rejected(terms);
    this.orders.push(order);
    return order;
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
        return ticket.size >= 1 && ticket.size <= this.sellableShares(ticket.instrumentId);
    }
  }
}