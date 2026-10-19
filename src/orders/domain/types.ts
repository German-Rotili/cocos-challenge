export type OrderSide = 'BUY' | 'SELL' | 'CASH_IN' | 'CASH_OUT';
export type OrderStatus = 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';
export type OrderType = 'MARKET' | 'LIMIT';

export interface Order {
    id: number;
    instrumentId: number;
    userId: number;
    side: OrderSide;
    size: number;
    price: number;
    type: OrderType;
    status: OrderStatus;
    datetime: Date;
}