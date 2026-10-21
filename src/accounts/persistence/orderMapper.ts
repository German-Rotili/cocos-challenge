import { Order as OrderEntity } from '../../database/entities/order.entity';
import { Money } from '../../shared/domain/money.valueObject';
import { Order } from '../domain/order.domainEntity';

export function toDomainOrder(row: OrderEntity): Order {
  if (row.price == null) throw new Error(`Order ${row.id} has no price`);
  return Order.restore({
    id: row.id,
    instrumentId: row.instrumentId,
    userId: row.userId,
    side: row.side,
    size: row.size,
    price: Money.of(row.price),
    type: row.type,
    status: row.status,
    datetime: row.datetime,
  });
}

export function toOrderRow(order: Order): Partial<OrderEntity> {
  return { ...order.toProps(), price: order.price.toNumber() };
}
