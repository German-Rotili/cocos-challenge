import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsPositive, ValidateIf } from 'class-validator';
import { PageOf } from '../../shared/http/pagination.dto';
import type {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../domain/order.domainEntity';

const SIDES: OrderSide[] = ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'];
const TYPES: OrderType[] = ['MARKET', 'LIMIT'];
const STATUSES: OrderStatus[] = ['NEW', 'FILLED', 'REJECTED', 'CANCELLED'];

// ---------- Request ----------

export class SendOrderDto {
  @IsInt()
  @IsPositive()
  userId!: number;

  /** Transfers use the ARS instrument. */
  @IsInt()
  @IsPositive()
  instrumentId!: number;

  @ApiProperty({ enum: SIDES })
  @IsIn(SIDES)
  side!: OrderSide;

  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type!: OrderType;

  @ApiPropertyOptional({
    description:
      'Whole shares, or pesos for a transfer. Send size or budget, not both.',
  })
  @ValidateIf((dto: SendOrderDto) => dto.budget === undefined)
  @IsInt()
  @IsPositive()
  size?: number;

  @ApiPropertyOptional({
    minimum: 0.01,
    description: 'Pesos to spend: buys the most whole shares it covers.',
  })
  @ValidateIf((dto: SendOrderDto) => dto.size === undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budget?: number;

  @ApiPropertyOptional({
    minimum: 0.01,
    description: 'Required for LIMIT orders; ignored for MARKET orders.',
  })
  @ValidateIf((dto: SendOrderDto) => dto.type === 'LIMIT')
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;
}

// ---------- Response ----------

export class OrderResponse {
  id!: number;
  userId!: number;
  instrumentId!: number;

  @ApiProperty({ enum: SIDES })
  side!: OrderSide;

  @ApiProperty({ enum: TYPES })
  type!: OrderType;

  size!: number;
  price!: number;

  @ApiProperty({ enum: STATUSES })
  status!: OrderStatus;

  @ApiProperty({ format: 'date-time' })
  datetime!: string;
}

export class OrderPage extends PageOf(OrderResponse) {}

export function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id as number,
    userId: order.userId,
    instrumentId: order.instrumentId,
    side: order.side,
    type: order.type,
    size: order.size,
    price: order.price.toNumber(),
    status: order.status,
    datetime: order.datetime.toISOString(),
  };
}
