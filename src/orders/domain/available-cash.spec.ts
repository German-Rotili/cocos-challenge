import { availableCash } from './available-cash';

describe('availableCash', () => {
  it('adds cash in and subtracts cash out', () => {
    expect(availableCash([{ id: 1, userId: 1, instrumentId: 1, side: 'CASH_IN', size: 1000, price: 1, type: 'MARKET', status: 'FILLED', datetime: new Date() }, { id: 2, userId: 1, instrumentId: 1, side: 'CASH_OUT', size: 300, price: 1, type: 'MARKET', status: 'FILLED', datetime: new Date() }])).toBe(700);
  });

  it('subtracts filled buys', () => {
    expect(availableCash([
      { id: 1, userId: 1, instrumentId: 1, side: 'CASH_IN', size: 10000, price: 1, type: 'MARKET', status: 'FILLED', datetime: new Date() },
      { id: 2, userId: 1, instrumentId: 1, side: 'BUY', size: 10, price: 900, type: 'MARKET', status: 'FILLED', datetime: new Date() },
    ])).toBe(10000 - 9000);
  });

  it('reserves cash for NEW limit buys', () => {
    expect(availableCash([
      { id: 1, userId: 1, instrumentId: 1, side: 'CASH_IN', size: 10000, price: 1, type: 'MARKET', status: 'FILLED', datetime: new Date() },
      { id: 2, userId: 1, instrumentId: 1, side: 'BUY', size: 5, price: 1000, type: 'LIMIT', status: 'NEW', datetime: new Date() },
    ])).toBe(5000);
  });

  it('ignores rejected and cancelled orders', () => {
    expect(availableCash([
      { id: 1, userId: 1, instrumentId: 1, side: 'CASH_IN', size: 1000, price: 1, type: 'MARKET', status: 'FILLED', datetime: new Date() },
      { id: 2, userId: 1, instrumentId: 1, side: 'BUY', size: 99, price: 99, type: 'MARKET', status: 'REJECTED', datetime: new Date() },
      { id: 3, userId: 1, instrumentId: 1, side: 'BUY', size: 1, price: 500, type: 'MARKET', status: 'CANCELLED', datetime: new Date() },
    ])).toBe(1000);
  });

  it('ignores the price for CASH_IN and CASH_OUT orders', () => {
    expect(availableCash([
      { id: 1, userId: 1, instrumentId: 1, side: 'CASH_IN', size: 1000, price: 9999, type: 'MARKET', status: 'FILLED', datetime: new Date() },
      { id: 2, userId: 1, instrumentId: 1, side: 'CASH_OUT', size: 500, price: 0.01, type: 'MARKET', status: 'FILLED', datetime: new Date() },
    ])).toBe(500);
  });
});