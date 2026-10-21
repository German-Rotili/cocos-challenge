import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/database.config';
import { Instrument, MarketData, Order, User } from '../src/database/entities';
import { InstrumentQuoteView } from '../src/database/views/instrumentQuote.view';

config({ quiet: true });

export default new DataSource({
  ...buildDataSourceOptions(process.env.DATABASE_URL),
  entities: [User, Instrument, MarketData, Order, InstrumentQuoteView],
  migrations: ['db/migrations/*.ts'],
});