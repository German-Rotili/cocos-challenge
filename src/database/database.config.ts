import { DataSourceOptions } from 'typeorm';
import { Instrument, MarketData, Order, User } from './entities';
export const databaseEntities = [User, Instrument, MarketData, Order];
export function buildDataSourceOptions(
  url: string | undefined,
): DataSourceOptions {
  if (!url) {
    throw new Error(
      'Falta la URL de la base de datos (DATABASE_URL / TEST_DATABASE_URL)',
    );
  }
  return {
    type: 'postgres',
    url,
    entities: databaseEntities,
    // El esquema lo define database.sql / migraciones, no TypeORM.
    synchronize: false,
    logging: false,
  };
}
