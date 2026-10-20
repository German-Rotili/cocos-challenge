import { Order as OrderEntity } from '../../database/entities/order.entity';
import { Order } from '../domain/order.domainEntity';

export function toDomainOrder(row: OrderEntity): Order {
  return Order.restore({
    id: row.id,
    instrumentId: row.instrumentId,
    userId: row.userId,
    side: row.side,
    size: row.size,
    price: row.price,
    type: row.type,
    status: row.status,
    datetime: row.datetime,
  });
}

export function toOrderRow(order: Order): Partial<OrderEntity> {
  return order.toProps();
}
