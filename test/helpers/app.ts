import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { world } from './world';
import { migrateDatabase, resetDatabase } from './db';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = configureApp(
    moduleRef.createNestApplication({ logger: ['error', 'warn'] }),
  );
  await app.init();
  return app;
}

export function useTestApp(): void {
  const reset = () => resetDatabase(world.app.get(DataSource));

  beforeAll(async () => {
    await migrateDatabase();
    world.app = await createTestApp();
  });
  beforeEach(async () => {
    world.reset();
    await reset();
  });
  afterAll(async () => {
    if (world.app) {
      await reset();
      await world.app.close();
    }
  });
}
