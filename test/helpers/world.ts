import { INestApplication } from '@nestjs/common';
import request from 'supertest';

class World {
  app!: INestApplication;
  currentUserId?: number;
  lastResponse?: request.Response;
  reset() {
    this.currentUserId = undefined;
    this.lastResponse = undefined;
  }
  get http() {
    return request(this.app.getHttpServer());
  }
}
export const world = new World();