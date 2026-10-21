import { InstrumentQuote } from '../../instruments/domain/instrumentQuote.valueObject';
import { Account } from './account.aggregate';
import { InvalidOrderError, OrderNotCancellableError, OrderNotFoundError } from './errors';
import { Order, OrderProps } from './order.domainEntity';
import { TradeInput } from './orderTicket.valueObject';

const NOW = new Date('2026-01-01T12:00:00Z');
const USER = 1;

const quote = (id: number, ticker: string, type: string, close: number | null) =>
  InstrumentQuote.create({ id, ticker, name: ticker, type, close, previousClose: null, asOf: null });

const PAMP = quote(2, 'PAMP', 'ACCIONES', 900);
const GGAL = quote(3, 'GGAL', 'ACCIONES', 1_500);
const ARS = quote(66, 'ARS', 'MONEDA', null);

let nextId = 1;
const order = (overrides: Partial<OrderProps>): Order =>
  Order.restore({
    id: nextId++,
    userId: USER,
    instrumentId: PAMP.id,
    side: 'BUY',
    size: 1,
    price: 1,
    type: 'MARKET',
    status: 'FILLED',
    datetime: NOW,
    ...overrides,
  });

const deposit = (amount: number) =>
  order({ side: 'CASH_IN', instrumentId: ARS.id, size: amount, price: 1 });

const holding = (size: number, instrument = PAMP) =>
  order({ side: 'BUY', instrumentId: instrument.id, size, price: 0 }); // price 0: no cash effect

const accountWith = (...orders: Order[]) => Account.restore(USER, orders);

const buy = (size: number): TradeInput => ({ side: 'BUY', type: 'MARKET', size });
const limitBuy = (size: number, price: number): TradeInput => ({ side: 'BUY', type: 'LIMIT', size, price });
const sell = (size: number): TradeInput => ({ side: 'SELL', type: 'MARKET', size });

describe('Account balances', () => {
  it('starts empty', () => {
    const account = accountWith();

    expect(account.availableCash).toBe(0);
    expect(account.sellableShares(PAMP.id)).toBe(0);
  });

  it('counts shares per instrument', () => {
    const account = accountWith(holding(10, PAMP), holding(4, GGAL));

    expect(account.sellableShares(PAMP.id)).toBe(10);
    expect(account.sellableShares(GGAL.id)).toBe(4);
  });

  it('refuses orders from another user', () => {
    expect(() => Account.restore(USER, [order({ userId: 2 })])).toThrow();
  });
});

describe('Account#placeTrade', () => {
  it('fills a MARKET buy the user can afford, and debits it', () => {
    const account = accountWith(deposit(100_000));

    const placed = account.placeTrade(buy(10), PAMP, NOW);

    expect(placed).toMatchObject({
      userId: USER, instrumentId: PAMP.id, status: 'FILLED', size: 10, price: 900, datetime: NOW,
    });
    expect(account.availableCash).toBe(91_000);
  });

  it('fills a buy that costs exactly the available cash', () => {
    expect(accountWith(deposit(9_000)).placeTrade(buy(10), PAMP, NOW).status).toBe('FILLED');
  });

  it('rejects a buy that costs more than the available cash, and debits nothing', () => {
    const account = accountWith(deposit(8_999));

    expect(account.placeTrade(buy(10), PAMP, NOW).status).toBe('REJECTED');
    expect(account.availableCash).toBe(8_999);
  });

  it('rejects a buy of zero shares (amount to spend too small for one share)', () => {
    const input: TradeInput = { side: 'BUY', type: 'MARKET', budget: 500 };

    expect(accountWith(deposit(100_000)).placeTrade(input, PAMP, NOW).status).toBe('REJECTED');
  });

  it('keeps a LIMIT buy as NEW and reserves its cost', () => {
    const account = accountWith(deposit(100_000));

    expect(account.placeTrade(limitBuy(10, 850), PAMP, NOW).status).toBe('NEW');
    expect(account.availableCash).toBe(91_500);
  });

  it('counts earlier reservations when deciding later orders', () => {
    const account = accountWith(deposit(10_000));

    expect(account.placeTrade(limitBuy(10, 900), PAMP, NOW).status).toBe('NEW');
    expect(account.placeTrade(limitBuy(2, 900), PAMP, NOW).status).toBe('REJECTED');
  });

  it('fills a sell within the held shares, regardless of cash', () => {
    const account = accountWith(holding(10));

    expect(account.placeTrade(sell(10), PAMP, NOW).status).toBe('FILLED');
    expect(account.availableCash).toBe(9_000);
    expect(account.sellableShares(PAMP.id)).toBe(0);
  });

  it('rejects a sell of more shares than are held', () => {
    expect(accountWith(holding(10)).placeTrade(sell(20), PAMP, NOW).status).toBe('REJECTED');
  });

  it('does not let shares of another instrument cover a sell', () => {
    expect(accountWith(holding(10, GGAL)).placeTrade(sell(1), PAMP, NOW).status).toBe('REJECTED');
  });

  it('counts shares already offered in NEW sells as not sellable', () => {
    const account = accountWith(
      holding(10),
      order({ side: 'SELL', type: 'LIMIT', status: 'NEW', size: 8 }),
    );

    expect(account.placeTrade(sell(3), PAMP, NOW).status).toBe('REJECTED');
  });

  it('records nothing when the input is invalid', () => {
    const account = accountWith(deposit(100_000));

    expect(() => account.placeTrade({ side: 'BUY', type: 'MARKET', size: 1.5 }, PAMP, NOW)).toThrow(
      InvalidOrderError,
    );
    expect(account.availableCash).toBe(100_000);
  });
});

describe('Account#transfer', () => {
  it('always accepts a cash in', () => {
    const account = accountWith();

    expect(account.transfer({ side: 'CASH_IN', size: 500 }, ARS, NOW).status).toBe('FILLED');
    expect(account.availableCash).toBe(500);
  });

  it('rejects a cash out larger than the available cash', () => {
    const account = accountWith(deposit(500));

    expect(account.transfer({ side: 'CASH_OUT', size: 501 }, ARS, NOW).status).toBe('REJECTED');
    expect(account.availableCash).toBe(500);
  });
});

describe('Account#cancel', () => {
  it('cancels a NEW order and releases its reservation', () => {
    const limit = order({ side: 'BUY', type: 'LIMIT', status: 'NEW', size: 10, price: 900 });
    const account = accountWith(deposit(10_000), limit);

    expect(account.cancel(limit.id!)).toMatchObject({ id: limit.id, status: 'CANCELLED' });
    expect(account.availableCash).toBe(10_000);
  });

  it('refuses to cancel a FILLED order', () => {
    const filled = order({ status: 'FILLED' });

    expect(() => accountWith(filled).cancel(filled.id!)).toThrow(OrderNotCancellableError);
  });

  it("refuses an order that isn't in this account", () => {
    expect(() => accountWith().cancel(999)).toThrow(OrderNotFoundError);
  });
});

const QUOTES = new Map([PAMP, GGAL].map((q) => [q.id, q]));
const minutesLater = (n: number) => new Date(NOW.getTime() + n * 60_000);

const filledBuy = (size: number, price: number, extra: Partial<OrderProps> = {}) =>
  order({ side: 'BUY', size, price, ...extra });
const filledSell = (size: number, price: number, extra: Partial<OrderProps> = {}) =>
  order({ side: 'SELL', size, price, ...extra });

describe('Account#settledCash', () => {
  it('counts FILLED orders but not what NEW buys reserve', () => {
    const account = accountWith(
      deposit(100_000),
      filledBuy(10, 900),
      filledBuy(10, 800, { type: 'LIMIT', status: 'NEW' }),
    );

    expect(account.settledCash).toBe(91_000);
    expect(account.availableCash).toBe(83_000);
  });
});

describe('Account#positions', () => {
  it('has none for a new account', () => {
    expect(accountWith().positions()).toEqual([]);
  });

  it('builds one position per instrument from FILLED trades', () => {
    const account = accountWith(
      deposit(100_000),
      filledBuy(10, 900),
      filledBuy(4, 1_400, { instrumentId: GGAL.id }),
    );

    expect(account.positions().map((p) => [p.instrumentId, p.quantity])).toEqual([
      [PAMP.id, 10],
      [GGAL.id, 4],
    ]);
  });

  it('leaves cash transfers out', () => {
    expect(accountWith(deposit(1_000)).positions()).toEqual([]);
  });

  it('ignores NEW, REJECTED and CANCELLED trades', () => {
    const account = accountWith(
      deposit(100_000),
      filledBuy(10, 900),
      filledBuy(5, 900, { type: 'LIMIT', status: 'NEW' }),
      filledBuy(50, 900, { status: 'REJECTED' }),
      filledBuy(7, 900, { type: 'LIMIT', status: 'CANCELLED' }),
      filledSell(3, 900, { type: 'LIMIT', status: 'NEW' }),
    );

    expect(account.positions()).toEqual([
      expect.objectContaining({ quantity: 10, costBasis: 9_000 }),
    ]);
  });

  it('drops a position once every share is sold', () => {
    expect(accountWith(filledBuy(10, 900), filledSell(10, 1_000)).positions()).toEqual([]);
  });

  it('folds trades by datetime, whatever order they were loaded in', () => {
    const account = accountWith(
      filledSell(5, 1_200, { datetime: minutesLater(2) }),
      filledBuy(10, 900, { datetime: minutesLater(1) }),
    );

    expect(account.positions()).toEqual([
      expect.objectContaining({ quantity: 5, costBasis: 4_500 }),
    ]);
  });
});

describe('Account#portfolio', () => {
  it('is all zeros for a new account', () => {
    expect(accountWith().portfolio(QUOTES)).toEqual({
      userId: USER,
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('values cash plus positions at the last close', () => {
    const account = accountWith(deposit(100_000), filledBuy(10, 800)); // 92,000 cash + 10 × 900

    const portfolio = account.portfolio(QUOTES);

    expect(portfolio.availableCash).toBe(92_000);
    expect(portfolio.totalValue).toBe(101_000);
    expect(portfolio.positions).toEqual([
      expect.objectContaining({ ticker: 'PAMP', quantity: 10, averageCost: 800, marketValue: 9_000 }),
    ]);
    expect(portfolio.positions[0].totalReturn).toBeCloseTo(0.125);
  });

  it('measures the return on the shares left after a partial sell', () => {
    const account = accountWith(
      deposit(100_000),
      filledBuy(10, 800, { datetime: minutesLater(1) }),
      filledBuy(10, 1_000, { datetime: minutesLater(2) }),
      filledSell(5, 1_200, { datetime: minutesLater(3) }),
    );

    const [pamp] = account.portfolio(QUOTES).positions; // 15 at avg 900, close 900

    expect(pamp).toMatchObject({ quantity: 15, averageCost: 900, marketValue: 13_500 });
    expect(pamp.totalReturn).toBeCloseTo(0);
  });

  it("counts a sell's proceeds as cash", () => {
    // 10,000 − 9,000 + 13,000
    const account = accountWith(deposit(10_000), filledBuy(10, 900), filledSell(10, 1_300));

    expect(account.portfolio(QUOTES)).toMatchObject({ totalValue: 14_000, availableCash: 14_000 });
  });

  it('reserves cash for an open limit buy without lowering the total value', () => {
    const account = accountWith(
      deposit(100_000),
      filledBuy(10, 800, { type: 'LIMIT', status: 'NEW' }),
    );

    expect(account.portfolio(QUOTES)).toMatchObject({
      availableCash: 92_000,
      totalValue: 100_000,
      positions: [],
    });
  });

  it('leaves an unpriced position out of the total value', () => {
    const unpriced = new Map([[PAMP.id, quote(PAMP.id, 'PAMP', 'ACCIONES', null)]]);
    const account = accountWith(deposit(10_000), filledBuy(10, 900));

    const portfolio = account.portfolio(unpriced);

    expect(portfolio.totalValue).toBe(1_000);
    expect(portfolio.positions).toEqual([
      expect.objectContaining({ quantity: 10, marketValue: null }),
    ]);
  });

  it('fails loudly when a held instrument has no quote', () => {
    expect(() => accountWith(filledBuy(10, 900)).portfolio(new Map())).toThrow();
  });
});
