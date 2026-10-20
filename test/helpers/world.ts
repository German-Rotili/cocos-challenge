import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';

export interface KnownInstrument {
  id: number;
  close: number; // NaN for instruments without a price, such as ARS
}

class World {
  app!: INestApplication;
  userId?: number;
  orderId?: number;
  response?: Response;
  instruments = new Map<string, KnownInstrument>();

  reset(): void {
    this.userId = undefined;
    this.orderId = undefined;
    this.response = undefined;
    this.instruments.clear();
  }
}

export const world = new World();
