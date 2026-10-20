import { IsIn, IsInt, IsNumber, IsPositive, ValidateIf } from 'class-validator';
import type { OrderSide, OrderType } from '../domain/order.domainEntity';

const SIDES: OrderSide[] = ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'];
const TYPES: OrderType[] = ['MARKET', 'LIMIT'];

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