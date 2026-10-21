import request, { Response } from 'supertest';
import { KnownInstrument, world } from './world';

const http = () => request(world.app.getHttpServer());

let seq = 0;

export interface OrderRequest {
  userId: number;
  instrumentId: number;
  side: 'BUY' | 'SELL' | 'CASH_IN' | 'CASH_OUT';
  type: 'MARKET' | 'LIMIT';
  size?: number;
  budget?: number;
  price?: number;
}

export interface InstrumentRequest {
  ticker: string;
  name: string;
  type: string;
}

export interface MarketDataRequest {
  close: number;
  previousClose: number;
  open?: number;
  high?: number;
  low?: number;
}

/** Needs ENABLE_REFERENCE_DATA_ENDPOINTS=true in .env.test, or the route is a 404. */
export async function createInstrument(body: InstrumentRequest): Promise<number> {
  const res = await http().post('/instruments').send(body).expect(201);
  return res.body.id;
}

/** Needs ENABLE_REFERENCE_DATA_ENDPOINTS=true in .env.test, or the route is a 404. */
export async function addMarketData(instrumentId: number, body: MarketDataRequest): Promise<void> {
  await http().post(`/instruments/${instrumentId}/marketdata`).send(body).expect(201);
}

export async function createUser(): Promise<number> {
  seq += 1;
  const tag = `${Date.now().toString(36)}${seq}`;
  const res = await http()
    .post('/users')
    .send({ email: `user-${tag}@test.local`, accountNumber: `T${tag}` })
    .expect(201);
  return res.body.id;
}

export async function findInstrument(ticker: string): Promise<KnownInstrument> {
  const res = await http().get('/instruments').query({ q: ticker }).expect(200);
  const match = res.body.find((i: { ticker: string }) => i.ticker === ticker);
  if (!match) throw new Error(`Search for "${ticker}" returned no exact ticker match`);
  return { id: match.id, close: Number(match.close) };
}

export function sendOrder(body: OrderRequest): Promise<Response> {
  return http().post('/orders').send(body);
}

export async function sendOrderExpecting(body: OrderRequest, expectedStatus: string): Promise<number> {
  const res = await sendOrder(body);
  if (res.status !== 201 || res.body.status !== expectedStatus) {
    throw new Error(
      `Setup order ${JSON.stringify(body)} answered ${res.status} ${JSON.stringify(res.body)}, ` +
        `expected 201 with status ${expectedStatus}`,
    );
  }
  return res.body.id;
}

export async function cashIn(userId: number, amount: number): Promise<void> {
  const ars = await findInstrument('ARS');
  await sendOrderExpecting(
    { userId, instrumentId: ars.id, side: 'CASH_IN', type: 'MARKET', size: amount },
    'FILLED',
  );
}

export function cancelOrder(orderId: number): Promise<Response> {
  return http().patch(`/orders/${orderId}/cancel`);
}

export async function getOrder(orderId: number): Promise<Record<string, unknown>> {
  const res = await http().get(`/orders/${orderId}`).expect(200);
  return res.body;
}

export async function userOrders(userId: number): Promise<Array<{ side: string }>> {
  const res = await http().get(`/users/${userId}/orders`).expect(200);
  return res.body;
}

export function portfolio(userId: number): Promise<Response> {
  return http().get(`/users/${userId}/portfolio`);
}

export async function availableCash(userId: number): Promise<number> {
  const res = await http().get(`/users/${userId}/portfolio`).expect(200);
  return res.body.availableCash;
}