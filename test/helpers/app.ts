import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { world } from './world';
import { resetDatabase } from './db';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export function useTestApp(): void {
  const reset = () => resetDatabase(world.app.get(DataSource));

  beforeAll(async () => {
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
