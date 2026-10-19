import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../../src/database/database.config';
import { Instrument, MarketData, Order, User } from '../../src/database/entities';

export interface SeedInput {
  users?: { id: number; cashArs: number }[];
  instruments?: {
    ticker: string;
    name: string;
    type: string;
    close: number;
    previousClose: number;
  }[];
}

const ARS_TICKER = 'ARS';
let dataSource: DataSource | undefined;

export async function getTestDataSource(): Promise<DataSource> {
  if (!dataSource?.isInitialized) {
    const url = process.env.TEST_DATABASE_URL;

    if (!url || !/test/i.test(url)) {
      throw new Error(`TEST_DATABASE_URL inválida o no apunta a una base de test: ${url}`);
    }
    dataSource = new DataSource(buildDataSourceOptions(url));
    await dataSource.initialize();
  }
  return dataSource;
}

export async function closeTestDataSource(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  dataSource = undefined;
}

/** Trunca todas las tablas y reinicia las secuencias. */
export async function resetDatabase(): Promise<void> {
  const ds = await getTestDataSource();
  await ds.query(
    'TRUNCATE TABLE "orders", "marketdata", "instruments", "users" RESTART IDENTITY CASCADE',
  );
}

/**
 * Inserta datos semilla en una transacción.
 * - Cada usuario recibe una orden CASH_IN FILLED por su saldo inicial (ARS como MONEDA).
 * - Cada instrumento recibe dos filas de marketdata: el día anterior y hoy (close).
 */
export async function seedBaseData(input: SeedInput): Promise<void> {
  const ds = await getTestDataSource();
  await ds.transaction(async (em) => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const allInstruments = [
      ...(input.instruments ?? []),
    ];
    const needsCash = (input.users ?? []).some((u) => u.cashArs > 0);
    let arsId: number | undefined;

    if (needsCash) {
      let ars = await em.findOne(Instrument, { where: { ticker: ARS_TICKER } });

      if (!ars) {
        ars = await em.save(Instrument, em.create(Instrument, {
          ticker: ARS_TICKER,
          name: 'Peso Argentino',
          type: 'MONEDA',
        }));
      }
      arsId = ars.id;
    }

    for (const user of input.users ?? []) {
      await em.save(User, em.create(User, {
        id: user.id,
        email: `user${user.id}@test.local`,
        accountNumber: `ACC${user.id}`,
      }));

      if (user.cashArs > 0 && arsId !== undefined) {
        await em.save(Order, em.create(Order, {
          userId: user.id,
          instrumentId: arsId,
          side: 'CASH_IN',
          type: 'MARKET',
          status: 'FILLED',
          size: user.cashArs,
          price: 1,
          datetime: now,
        }));
      }
    }

    for (const data of allInstruments) {
      let instrument = await em.findOne(Instrument, { where: { ticker: data.ticker } });
      
      if (!instrument) {
        instrument = await em.save(Instrument, em.create(Instrument, {
          ticker: data.ticker,
          name: data.name,
          type: data.type,
        }));
      }

      await em.save(MarketData, [
        em.create(MarketData, {
          instrumentId: instrument.id,
          open: data.previousClose,
          high: data.previousClose,
          low: data.previousClose,
          close: data.previousClose,
          previousClose: data.previousClose,
          datetime: yesterday,
        }),
        em.create(MarketData, {
          instrumentId: instrument.id,
          open: data.close,
          high: data.close,
          low: data.close,
          close: data.close,
          previousClose: data.previousClose,
          datetime: now,
        }),
      ]);
    }
  });
}