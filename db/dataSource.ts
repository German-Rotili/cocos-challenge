import 'reflect-metadata';
import '../src/shared/config/loadEnv'; // the database APP_ENV points at: APP_ENV=dev npm run migration:run
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/database.config';
import { Instrument, MarketData, Order, User } from '../src/database/entities';
import { InstrumentQuoteView } from '../src/database/views/instrumentQuote.view';

export default new DataSource({
  ...buildDataSourceOptions(process.env.DATABASE_URL),
  entities: [User, Instrument, MarketData, Order, InstrumentQuoteView],
  migrations: ['db/migrations/*.ts'],
});
