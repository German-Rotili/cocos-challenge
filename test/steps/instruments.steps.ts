import * as path from 'path';
import { autoBindSteps, DefineStepFunction, loadFeature } from 'jest-cucumber';
import * as api from '../helpers/api';
import { useTestApp } from '../helpers/app';
import { world } from '../helpers/world';
import { commonSteps, StepDefinitions } from './common';

const feature = loadFeature(
  path.join(__dirname, '../features/instruments.feature'),
);

useTestApp();

type SearchColumn =
  'ticker' | 'name' | 'close' | 'previousClose' | 'dailyReturn';

const TEXT_COLUMNS: SearchColumn[] = ['ticker', 'name'];

function searchBody(): Array<Record<SearchColumn, unknown>> {
  expect(world.response?.status).toBe(200);
  return world.response!.body.items;
}

// ---------- When ----------

const someoneSearchesWithoutFilters = (step: DefineStepFunction) =>
  step(
    /^someone searches instruments without filters(?: with limit (\d+) and offset (\d+))?$/,
    async (limit?: string, offset?: string) => {
      world.response = await api.searchInstruments({ limit, offset });
    },
  );

const someoneSearches = (step: DefineStepFunction) =>
  step(
    /^someone searches instruments by (ticker|name) "([^"]*)"(?: and (ticker|name) "([^"]*)")?$/,
    async (
      field: string,
      value: string,
      other?: string,
      otherValue?: string,
    ) => {
      world.response = await api.searchInstruments({
        [field]: value,
        ...(other ? { [other]: otherValue } : {}),
      });
    },
  );

// ---------- Then ----------

const searchReturnsNothing = (step: DefineStepFunction) =>
  step('the search returns no instruments', () => {
    expect(searchBody()).toEqual([]);
  });

/** Compares only the columns the table lists; a blank numeric cell means null. */
const searchReturns = (step: DefineStepFunction) =>
  step(
    'the search returns:',
    (table: Array<Partial<Record<SearchColumn, string>>>) => {
      const columns = Object.keys(table[0]) as SearchColumn[];
      const pick = (row: Record<SearchColumn, unknown>) =>
        Object.fromEntries(columns.map((c) => [c, row[c]]));
      const expected = table.map((row) =>
        Object.fromEntries(
          columns.map((c) => {
            const cell = row[c]!.trim();
            if (TEXT_COLUMNS.includes(c)) return [c, cell];
            return [c, cell === '' ? null : Number(cell)];
          }),
        ),
      );
      expect(searchBody().map(pick)).toEqual(expected); // order matters: by ticker
    },
  );

const searchFoundInTotal = (step: DefineStepFunction) =>
  step(/^the search found (\d+) instruments in total$/, (total: string) => {
    expect(world.response!.body.total).toBe(Number(total));
  });

// ---------- Binding ----------

const instrumentsSteps: StepDefinitions = ({ when, then }) => {
  someoneSearchesWithoutFilters(when);
  someoneSearches(when);
  searchReturnsNothing(then);
  searchReturns(then);
  searchFoundInTotal(then);
};

autoBindSteps([feature], [commonSteps, instrumentsSteps]);
