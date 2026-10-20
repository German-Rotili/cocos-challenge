import { DataSourceOptions } from 'typeorm';
import { Instrument, MarketData, Order, User } from './entities';

export function buildDataSourceOptions(url: string | undefined): DataSourceOptions {
  if (!url) {
    throw new Error('Missing database URL (DATABASE_URL / TEST_DATABASE_URL)');
  }
  return {
    type: 'postgres',
    url,
    synchronize: false,
    logging: false,
  };
}
