import * as path from 'path';
import { autoBindSteps, DefineStepFunction, loadFeature } from 'jest-cucumber';
import * as api from '../helpers/api';
import { useTestApp } from '../helpers/app';
import { world } from '../helpers/world';
import { commonSteps, currentUser, StepDefinitions } from './common';

const feature = loadFeature(
  path.join(__dirname, '../features/userOrders.feature'),
);

useTestApp();

function pageBody(): {
  items: Array<{ side: string; size: number }>;
  total: number;
} {
  expect(world.response?.status).toBe(200);
  return world.response!.body;
}

// ---------- When ----------

const userListsOrders = (step: DefineStepFunction) =>
  step(
    /^the user lists their orders with limit "([^"]*)" and offset "([^"]*)"$/,
    async (limit: string, offset: string) => {
      world.response = await api.listUserOrders(currentUser(), {
        limit,
        offset,
      });
    },
  );

const someoneListsOrdersOf = (step: DefineStepFunction) =>
  step(/^someone lists the orders of user (\d+)$/, async (userId: string) => {
    world.response = await api.listUserOrders(Number(userId));
  });

// ---------- Then ----------

const pageHoldsOrders = (step: DefineStepFunction) =>
  step(
    'the page holds the orders:',
    (table: Array<Record<'side' | 'size', string>>) => {
      expect(
        pageBody().items.map(({ side, size }) => ({ side, size })),
      ).toEqual(table.map(({ side, size }) => ({ side, size: Number(size) })));
    },
  );

const pageHoldsNoOrders = (step: DefineStepFunction) =>
  step('the page holds no orders', () => {
    expect(pageBody().items).toEqual([]);
  });

const pageReportsTotal = (step: DefineStepFunction) =>
  step(/^the page reports (\d+) orders in total$/, (total: string) => {
    expect(pageBody().total).toBe(Number(total));
  });

// ---------- Binding ----------

const userOrdersSteps: StepDefinitions = ({ when, then }) => {
  userListsOrders(when);
  someoneListsOrdersOf(when);
  pageHoldsOrders(then);
  pageHoldsNoOrders(then);
  pageReportsTotal(then);
};

autoBindSteps([feature], [commonSteps, userOrdersSteps]);
