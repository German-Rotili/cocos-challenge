import type {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from './domain/order.domainEntity';

export interface OrderResponse {
  id: number;
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number;
  status: OrderStatus;
  datetime: string;
}

export function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id as number,
    userId: order.userId,
    instrumentId: order.instrumentId,
    side: order.side,
    type: order.type,
    size: order.size,
    price: order.price,
    status: order.status,
    datetime: order.datetime.toISOString(),
  };
}
