import { DataSource } from 'typeorm';
import migrationsDataSource from '../../db/dataSource';

export async function migrateDatabase(): Promise<void> {
  await migrationsDataSource.initialize();
  try {
    await migrationsDataSource.runMigrations({ transaction: 'each' });
  } finally {
    await migrationsDataSource.destroy();
  }
}

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE orders, marketdata, instruments, users RESTART IDENTITY CASCADE');
}
