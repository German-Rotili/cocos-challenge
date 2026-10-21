import * as path from 'path';
import { autoBindSteps, DefineStepFunction, loadFeature } from 'jest-cucumber';
import * as api from '../helpers/api';
import { useTestApp } from '../helpers/app';
import { world } from '../helpers/world';
import {
  commonSteps,
  currentUser,
  instrument,
  StepDefinitions,
} from './common';

const feature = loadFeature(
  path.join(__dirname, '../features/sendOrder.feature'),
);

useTestApp();

// ---------- When ----------

const userSendsOrder = (step: DefineStepFunction) =>
  step(
    /^the user sends a (MARKET|LIMIT) (BUY|SELL) for (\d+(?:\.\d+)?) (shares|ARS) of "(\w+)"(?: at price (\d+(?:\.\d+)?)| without a price)?$/,
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
          : { budget: Number(qty) }),
        ...(price ? { price: Number(price) } : {}),
      });
      world.orderId = world.response.body?.id;
    },
  );

const userCancelsOrder = (step: DefineStepFunction) =>
  step('the user cancels the order', async () => {
    world.response = await api.cancelOrder(world.orderId!);
  });

const userSendsSizeAndBudget = (step: DefineStepFunction) =>
  step(
    /^the user sends a (MARKET|LIMIT) (BUY|SELL) of "(\w+)" with both a size of (\d+) and an amount of (\d+)$/,
    async (type, side, ticker: string, size: string, budget: string) => {
      world.response = await api.sendOrder({
        userId: currentUser(),
        instrumentId: instrument(ticker).id,
        type,
        side,
        size: Number(size),
        budget: Number(budget),
      });
    },
  );

const userDepositsBudget = (step: DefineStepFunction) =>
  step(
    /^the user deposits (\d+) ARS sent as a budget$/,
    async (amount: string) => {
      world.response = await api.sendOrder({
        userId: currentUser(),
        instrumentId: instrument('ARS').id,
        side: 'CASH_IN',
        type: 'MARKET',
        budget: Number(amount),
      });
    },
  );

// ---------- Then ----------

const orderIs = (step: DefineStepFunction) =>
  step(
    /^the order is (?:saved as |still )?(NEW|FILLED|REJECTED|CANCELLED)(?: with (price|size) (\d+(?:\.\d+)?))?$/,
    async (status: string, field?: 'price' | 'size', value?: string) => {
      expect(world.orderId).toBeDefined();
      const order = await api.getOrder(world.orderId!); // read back: proves it was persisted
      expect(order.status).toBe(status);
      if (field) expect(Number(order[field])).toBe(Number(value));
    },
  );

const noOrderPersisted = (step: DefineStepFunction) =>
  step('no order is persisted', async () => {
    const trading = (await api.userOrders(currentUser())).filter((o) =>
      ['BUY', 'SELL'].includes(o.side),
    );
    expect(trading).toHaveLength(0);
  });

// ---------- Binding ----------

const sendOrderSteps: StepDefinitions = ({ when, then }) => {
  userSendsOrder(when);
  userCancelsOrder(when);
  userSendsSizeAndBudget(when);
  userDepositsBudget(when);
  orderIs(then);
  noOrderPersisted(then);
};

autoBindSteps([feature], [commonSteps, sendOrderSteps]);
