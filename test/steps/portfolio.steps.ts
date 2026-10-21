import * as path from 'path';
import { autoBindSteps, DefineStepFunction, loadFeature } from 'jest-cucumber';
import * as api from '../helpers/api';
import { useTestApp } from '../helpers/app';
import { world } from '../helpers/world';
import { commonSteps, currentUser, instrument, StepDefinitions } from './common.steps';

const feature = loadFeature(path.join(__dirname, '../features/portfolio.feature'));

// Boots the app and rebuilds an empty schema before each scenario (see helpers/app.ts).
useTestApp();

const UNKNOWN_USER_ID = 999_999;

interface PositionBody {
  ticker: string;
  quantity: number;
  marketValue: number;
  totalReturn: number;
  dailyReturn: number | null;
}

function portfolioBody(): { totalValue: number; positions: PositionBody[] } {
  expect(world.response?.status).toBe(200);
  return world.response!.body;
}

// ---------- Given ----------

const lastCloseMoves = (step: DefineStepFunction) =>
  step(/^the last close of "(\w+)" moves to (\d+)$/, async (ticker: string, close: string) => {
    const known = instrument(ticker);
    const next = Number(close);
    await api.addMarketData(known.id, { close: next, previousClose: known.close });
    world.instruments.set(ticker, { ...known, close: next });
  });

// ---------- When ----------

const userChecksPortfolio = (step: DefineStepFunction) =>
  step('the user checks their portfolio', async () => {
    world.response = await api.portfolio(currentUser());
  });

const someoneChecksUnknownPortfolio = (step: DefineStepFunction) =>
  step("someone checks the portfolio of a user that doesn't exist", async () => {
    world.response = await api.portfolio(UNKNOWN_USER_ID);
  });

// ---------- Then ----------

const totalValueIs = (step: DefineStepFunction) =>
  step(/^the account's total value is (\d+)$/, (value: string) => {
    expect(portfolioBody().totalValue).toBe(Number(value));
  });

const noPositions = (step: DefineStepFunction) =>
  step('the portfolio has no positions', () => {
    expect(portfolioBody().positions).toEqual([]);
  });

type PositionRow = Record<'ticker' | 'quantity' | 'marketValue' | 'totalReturn', string>;

const positionsAre = (step: DefineStepFunction) =>
  step('the portfolio has the following positions:', (table: PositionRow[]) => {
    const actual = portfolioBody().positions.map(({ ticker, quantity, marketValue, totalReturn }) => ({
      ticker,
      quantity,
      marketValue,
      totalReturn,
    }));
    const expected = table.map((row) => ({
      ticker: row.ticker,
      quantity: Number(row.quantity),
      marketValue: Number(row.marketValue),
      totalReturn: Number(row.totalReturn),
    }));
    expect(actual).toEqual(expected); // order matters: positions are listed by ticker
  });

const dailyReturnIs = (step: DefineStepFunction) =>
  step(/^the "(\w+)" position's daily return is (-?\d+(?:\.\d+)?)$/, (ticker: string, value: string) => {
    const position = portfolioBody().positions.find((p) => p.ticker === ticker);
    expect(position).toBeDefined();
    expect(position!.dailyReturn).toBe(Number(value));
  });

// ---------- Binding ----------

const portfolioSteps: StepDefinitions = ({ given, when, then }) => {
  lastCloseMoves(given);
  userChecksPortfolio(when);
  someoneChecksUnknownPortfolio(when);
  totalValueIs(then);
  noPositions(then);
  positionsAre(then);
  dailyReturnIs(then);
};

autoBindSteps([feature], [commonSteps, portfolioSteps]);