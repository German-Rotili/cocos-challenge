import { Order } from './types';

export const availableCash = (orders: Order[]): number => {
  let cash = 0;

  for (const order of orders) {
    if (order.status === 'FILLED') {
      switch (order.side) {
        case 'CASH_IN':
          cash += order.size;
          break;
        case 'CASH_OUT':
          cash -= order.size;
          break;
        case 'BUY':
          cash -= order.size * order.price;
          break;
      }
    }
    if (order.status === 'NEW' && order.side === 'BUY') {
      // reserve cash
      cash -= order.size * order.price;
    }
  }

  return cash;
};
