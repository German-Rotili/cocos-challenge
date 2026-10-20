import { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { InvalidOrderError } from './errors';
import { OrderTicket } from './orderTicket.valueObject';

const quote = (overrides: { id?: number; type?: string; close?: number | null } = {}) =>
  InstrumentQuote.create({
    id: overrides.id ?? 2,
    ticker: 'PAMP',
    name: 'Pampa Holding S.A.',
    type: overrides.type ?? 'ACCIONES',
    close: overrides.close === undefined ? 900 : overrides.close,
    previousClose: null,
    asOf: null,
  });
const ARS = quote({ id: 66, type: 'MONEDA', close: null });

describe('OrderTicket.trade', () => {
  it('prices a MARKET order at the last price, on the quoted instrument', () => {
    const ticket = OrderTicket.trade({ side: 'BUY', type: 'MARKET', size: 10 }, quote());

    expect(ticket).toMatchObject({ instrumentId: 2, side: 'BUY', type: 'MARKET', size: 10, price: 900 });
    expect(ticket.cost).toBe(9_000);
  });

  it('prices a LIMIT order at its own price, not the last price', () => {
    const ticket = OrderTicket.trade({ side: 'BUY', type: 'LIMIT', size: 10, price: 850 }, quote());

    expect(ticket.price).toBe(850);
  });

  it('buys the max whole shares for an amount', () => {
    const ticket = OrderTicket.trade({ side: 'BUY', type: 'MARKET', amount: 10_000 }, quote());

    expect(ticket.size).toBe(11);
  });

  it('sizes a LIMIT amount at the limit price', () => {
    const ticket = OrderTicket.trade(
      { side: 'BUY', type: 'LIMIT', amount: 10_000, price: 1_000 },
      quote(),
    );

    expect(ticket.size).toBe(10);
  });

  it('resolves an amount too small for one share to size 0, leaving the decision to Account', () => {
    const ticket = OrderTicket.trade({ side: 'BUY', type: 'MARKET', amount: 500 }, quote());

    expect(ticket.size).toBe(0);
  });

  it('refuses an instrument with no market price', () => {
    expect(() =>
      OrderTicket.trade({ side: 'BUY', type: 'MARKET', size: 1 }, quote({ close: null })),
    ).toThrow(InvalidOrderError);
  });

  it('refuses trading the cash instrument', () => {
    expect(() => OrderTicket.trade({ side: 'BUY', type: 'MARKET', size: 1 }, ARS)).toThrow(
      InvalidOrderError,
    );
  });

  it.each([0, -1])('refuses a LIMIT price of %p', (price) => {
    expect(() =>
      OrderTicket.trade({ side: 'BUY', type: 'LIMIT', size: 1, price }, quote()),
    ).toThrow(InvalidOrderError);
  });

  it.each([0, -5, 1.5])('refuses a size of %p', (size) => {
    expect(() => OrderTicket.trade({ side: 'BUY', type: 'MARKET', size }, quote())).toThrow(
      InvalidOrderError,
    );
  });

  it.each([0, -100])('refuses an amount of %p', (amount) => {
    expect(() => OrderTicket.trade({ side: 'BUY', type: 'MARKET', amount }, quote())).toThrow(
      InvalidOrderError,
    );
  });
});

describe('OrderTicket.transfer', () => {
  it('moves the amount as size, at price 1, on the cash instrument', () => {
    const ticket = OrderTicket.transfer({ side: 'CASH_IN', amount: 5_000 }, ARS);

    expect(ticket).toMatchObject({ instrumentId: 66, type: 'MARKET', size: 5_000, price: 1 });
  });

  it('refuses a non-cash instrument', () => {
    expect(() => OrderTicket.transfer({ side: 'CASH_IN', amount: 1 }, quote())).toThrow(
      InvalidOrderError,
    );
  });

  it.each([0, -1])('refuses an amount of %p', (amount) => {
    expect(() => OrderTicket.transfer({ side: 'CASH_IN', amount }, ARS)).toThrow(
      InvalidOrderError,
    );
  });
});