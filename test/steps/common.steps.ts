import { autoBindSteps, DefineStepFunction } from 'jest-cucumber';
import * as api from '../helpers/api';
import { KnownInstrument, world } from '../helpers/world';

export type StepDefinitions = Parameters<typeof autoBindSteps>[1][number];

export function instrument(ticker: string): KnownInstrument {
  const known = world.instruments.get(ticker);
  if (!known) throw new Error(`No step looked up instrument "${ticker}"`);
  return known;
}

export function currentUser(): number {
  if (world.userId === undefined) throw new Error('No step created a user');
  return world.userId;
}

// ---------- Given ----------

type MarketTableRow = Record<'ticker' | 'name' | 'type' | 'close' | 'previousClose', string>;

const optionalNumber = (cell: string): number | undefined =>
  cell.trim() === '' ? undefined : Number(cell);

const marketHasInstruments = (step: DefineStepFunction) =>
  step('the market has the following instruments:', async (table: MarketTableRow[]) => {
    for (const row of table) {
      const id = await api.createInstrument({ ticker: row.ticker, name: row.name, type: row.type });
      const close = optionalNumber(row.close);
      if (close !== undefined) {
        await api.addMarketData(id, {
          close,
          previousClose: optionalNumber(row.previousClose) ?? close,
        });
      }
      world.instruments.set(row.ticker, { id, close: close ?? NaN });
    }
  });

const userWithCash = (step: DefineStepFunction) =>
  step(/^a user with (\d+) ARS available$/, async (amount: string) => {
    world.userId = await api.createUser();
    await api.cashIn(world.userId, Number(amount));
  });

const userWithShares = (step: DefineStepFunction) =>
  step(/^a user with (\d+) shares of "(\w+)"$/, async (qty: string, ticker: string) => {
    const size = Number(qty);
    const { id, close } = instrument(ticker);
    world.userId = await api.createUser();
    await api.cashIn(world.userId, size * close);
    await api.sendOrderExpecting(
      { userId: world.userId, instrumentId: id, side: 'BUY', type: 'MARKET', size },
      'FILLED',
    );
  });

const userHasNewLimitOrder = (step: DefineStepFunction) =>
  step(
    /^the user has a NEW LIMIT (BUY|SELL) for (\d+) shares of "(\w+)" at price (\d+)$/,
    async (side, size: string, ticker: string, price: string) => {
      world.orderId = await api.sendOrderExpecting(
        {
          userId: currentUser(),
          instrumentId: instrument(ticker).id,
          side,
          type: 'LIMIT',
          size: Number(size),
          price: Number(price),
        },
        'NEW',
      );
    },
  );

const userHasFilledMarketOrder = (step: DefineStepFunction) =>
  step(
    /^the user has a FILLED MARKET (BUY|SELL) for (\d+) shares of "(\w+)"$/,
    async (side, size: string, ticker: string) => {
      world.orderId = await api.sendOrderExpecting(
        {
          userId: currentUser(),
          instrumentId: instrument(ticker).id,
          side,
          type: 'MARKET',
          size: Number(size),
        },
        'FILLED',
      );
    },
  );

// ---------- Then ----------

const availableCashIs = (step: DefineStepFunction) =>
  step(/^the user's available cash is (\d+)$/, async (amount: string) => {
    expect(await api.availableCash(currentUser())).toBe(Number(amount));
  });

const requestFailsWith = (step: DefineStepFunction) =>
  step(/^the request fails with status (\d+)$/, (status: string) => {
    expect(world.response?.status).toBe(Number(status));
  });

// ---------- Binding ----------

export const commonSteps: StepDefinitions = ({ given, then }) => {
  marketHasInstruments(given);
  userWithCash(given);
  userWithShares(given);
  userHasNewLimitOrder(given);
  userHasFilledMarketOrder(given);
  availableCashIs(then);
  requestFailsWith(then);
};