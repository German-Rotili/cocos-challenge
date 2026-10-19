import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export function useTestApp(resetDatabase: () => Promise<void>) {
  const { world } = require('./world');
  beforeAll(async () => {
    world.app = await createTestApp();
  });
  beforeEach(async () => {
    world.reset();
    await resetDatabase();
  });
  afterAll(async () => {
    await world.app?.close();
  });
}