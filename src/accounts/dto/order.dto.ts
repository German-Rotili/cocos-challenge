import { IsIn, IsInt, IsNumber, IsPositive, ValidateIf } from 'class-validator';
import type {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../domain/order.domainEntity';

const SIDES: OrderSide[] = ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'];
const TYPES: OrderType[] = ['MARKET', 'LIMIT'];

// ---------- Request ----------

export class SendOrderDto {
  @IsInt()
  @IsPositive()
  userId!: number;

  @IsInt()
  @IsPositive()
  instrumentId!: number;

  @IsIn(SIDES)
  side!: OrderSide;

  @IsIn(TYPES)
  type!: OrderType;

  @ValidateIf((dto: SendOrderDto) => dto.budget === undefined)
  @IsInt()
  @IsPositive()
  size?: number;

  @ValidateIf((dto: SendOrderDto) => dto.size === undefined)
  @IsNumber()
  @IsPositive()
  budget?: number;

  @ValidateIf((dto: SendOrderDto) => dto.type === 'LIMIT')
  @IsNumber()
  @IsPositive()
  price?: number;
}

// ---------- Response ----------

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
