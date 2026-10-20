import { DataSource } from 'typeorm';

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.synchronize(true);
}
