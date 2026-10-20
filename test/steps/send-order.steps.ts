import * as path from 'path';
import { autoBindSteps, DefineStepFunction, loadFeature } from 'jest-cucumber';
import { useTestApp } from '../helpers/app';
import { world } from '../helpers/world';
import * as api from '../helpers/api';

const feature = loadFeature(path.join(__dirname, 'send-order.feature'));

// Boots the app and rebuilds an empty schema before each scenario (see helpers/app.ts).
useTestApp();

// ---------- Given ----------

type MarketTableRow = Record<
  'ticker' | 'name' | 'type' | 'close' | 'previousClose',
  string
>;

const optionalNumber = (cell: string): number | undefined =>
  cell.trim() === '' ? undefined : Number(cell);

const marketHasInstruments = (step: DefineStepFunction) =>
  step(
    'the market has the following instruments:',
    async (table: MarketTableRow[]) => {
      for (const row of table) {
        const id = await api.createInstrument({
          ticker: row.ticker,
          name: row.name,
          type: row.type,
        });
        const close = optionalNumber(row.close);
        if (close !== undefined) {
          await api.addMarketData(id, {
            close,
            previousClose: optionalNumber(row.previousClose) ?? close,
          });
        }
        world.instruments.set(row.ticker, { id, close: close ?? NaN });
      }
    },
  );

const userWithCash = (step: DefineStepFunction) =>
  step(/^a user with (\d+) ARS available$/, async (amount: string) => {
    world.userId = await api.createUser();
    await api.cashIn(world.userId, Number(amount));
  });

const userWithShares = (step: DefineStepFunction) =>
  step(
    /^a user with (\d+) shares of "(\w+)"$/,
    async (qty: string, ticker: string) => {
      const size = Number(qty);
      const { id, close } = instrument(ticker);
      world.userId = await api.createUser();
      await api.cashIn(world.userId, size * close);
      await api.placeOrder(
        {
          userId: world.userId,
          instrumentId: id,
          side: 'BUY',
          type: 'MARKET',
          size,
        },
        'FILLED',
      );
    },
  );

const userHasNewLimitOrder = (step: DefineStepFunction) =>
  step(
    /^the user has a NEW LIMIT (BUY|SELL) for (\d+) shares of "(\w+)" at price (\d+)$/,
    async (side, size: string, ticker: string, price: string) => {
      world.orderId = await api.placeOrder(
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
      world.orderId = await api.placeOrder(
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

// ---------- When ----------

const userSendsOrder = (step: DefineStepFunction) =>
  step(
    /^the user sends a (MARKET|LIMIT) (BUY|SELL) for (\d+) (shares|ARS) of "(\w+)"(?: at price (\d+)| without a price)?$/,
    async (
      type,
      side,
      qty: string,
      unit: string,
      ticker: string,
      price?: string,
    ) => {
      world.response = await api.sendOrder({
        userId: currentUser(),
        instrumentId: instrument(ticker).id,
        type,
        side,
        ...(unit === 'shares'
          ? { size: Number(qty) }
          : { amount: Number(qty) }),
        ...(price ? { price: Number(price) } : {}),
      });
      world.orderId = world.response.body?.id;
    },
  );

const userCancelsOrder = (step: DefineStepFunction) =>
  step('the user cancels the order', async () => {
    world.response = await api.cancelOrder(world.orderId!);
  });

// ---------- Then ----------

const orderIs = (step: DefineStepFunction) =>
  step(
    /^the order is (?:saved as |still )?(NEW|FILLED|REJECTED|CANCELLED)(?: with (price|size) (\d+))?$/,
    async (status: string, field?: 'price' | 'size', value?: string) => {
      expect(world.orderId).toBeDefined();
      const order = await api.getOrder(world.orderId!); // read back: proves it was persisted
      expect(order.status).toBe(status);
      if (field) expect(Number(order[field])).toBe(Number(value));
    },
  );

const availableCashIs = (step: DefineStepFunction) =>
  step(/^the user's available cash is (\d+)$/, async (amount: string) => {
    expect(await api.availableCash(currentUser())).toBe(Number(amount));
  });

const requestFailsWith = (step: DefineStepFunction) =>
  step(/^the request fails with status (\d+)$/, (status: string) => {
    expect(world.response?.status).toBe(Number(status));
  });

const noOrderPersisted = (step: DefineStepFunction) =>
  step('no order is persisted', async () => {
    const trading = (await api.userOrders(currentUser())).filter((o) =>
      ['BUY', 'SELL'].includes(o.side),
    );
    expect(trading).toHaveLength(0);
  });

autoBindSteps(
  [feature],
  [
    ({ given, when, then }) => {
      marketHasInstruments(given);
      userWithCash(given);
      userWithShares(given);
      userHasNewLimitOrder(given);
      userHasFilledMarketOrder(given);
      userSendsOrder(when);
      userCancelsOrder(when);
      orderIs(then);
      availableCashIs(then);
      requestFailsWith(then);
      noOrderPersisted(then);
    },
  ],
);
