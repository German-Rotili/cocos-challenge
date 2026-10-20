import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';

class World {
  app!: INestApplication;
  userId?: number;
  orderId?: number;
  response?: Response;
  instruments = new Map<string, { id: number; close: number }>();

  reset(): void {
    this.userId = undefined;
    this.orderId = undefined;
    this.response = undefined;
    this.instruments.clear();
  }
}

export const world = new World();
