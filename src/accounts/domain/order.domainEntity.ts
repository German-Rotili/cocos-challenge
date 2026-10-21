import { Money } from '../../shared/domain/money.valueObject';
import { OrderNotCancellableError } from './errors';

export type TradeSide = 'BUY' | 'SELL';
export type TransferSide = 'CASH_IN' | 'CASH_OUT';
export type OrderSide = TradeSide | TransferSide;
export type OrderStatus = 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';
export type OrderType = 'MARKET' | 'LIMIT';

export interface OrderProps {
  id?: number; // undefined until persisted
  instrumentId: number;
  userId: number;
  side: OrderSide;
  size: number;
  price: Money; // per share; transfers carry 1 and move `size` pesos
  type: OrderType;
  status: OrderStatus;
  datetime: Date;
}

export type OrderTerms = Omit<OrderProps, 'id' | 'status'>;

export class Order {
  readonly id?: number;
  readonly instrumentId: number;
  readonly userId: number;
  readonly side: OrderSide;
  readonly size: number;
  readonly price: Money;
  readonly type: OrderType;
  readonly status: OrderStatus;
  readonly datetime: Date;

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.instrumentId = props.instrumentId;
    this.userId = props.userId;
    this.side = props.side;
    this.size = props.size;
    this.price = props.price;
    this.type = props.type;
    this.status = props.status;
    this.datetime = props.datetime;
    Object.freeze(this);
  }

  static restore(props: OrderProps): Order {
    return new Order(props);
  }

  static accepted(terms: OrderTerms): Order {
    return new Order({
      ...terms,
      status: terms.type === 'MARKET' ? 'FILLED' : 'NEW',
    });
  }

  static rejected(terms: OrderTerms): Order {
    return new Order({ ...terms, status: 'REJECTED' });
  }

  cancel(): Order {
    if (this.status !== 'NEW') {
      throw new OrderNotCancellableError(
        `Only NEW orders can be cancelled; order ${this.id} is ${this.status}`,
      );
    }
    return new Order({ ...this.toProps(), status: 'CANCELLED' });
  }

  get isTrade(): boolean {
    return this.side === 'BUY' || this.side === 'SELL';
  }

  /** The pesos this order moves: a transfer's size, or a trade's size × price. */
  get amount(): Money {
    return this.isTrade ? this.price.times(this.size) : Money.of(this.size);
  }

  cashEffect(): Money {
    if (this.status === 'FILLED') {
      switch (this.side) {
        case 'CASH_IN':
        case 'SELL':
          return this.amount;
        case 'CASH_OUT':
        case 'BUY':
          return this.amount.negated();
      }
    }
    if (this.status === 'NEW' && this.side === 'BUY')
      return this.amount.negated(); // reserved
    return Money.ZERO;
  }

  sharesEffect(): number {
    if (!this.isTrade) return 0;
    if (this.status === 'FILLED')
      return this.side === 'BUY' ? this.size : -this.size;
    if (this.status === 'NEW' && this.side === 'SELL') return -this.size; // reserved
    return 0;
  }

  toProps(): OrderProps {
    return {
      id: this.id,
      instrumentId: this.instrumentId,
      userId: this.userId,
      side: this.side,
      size: this.size,
      price: this.price,
      type: this.type,
      status: this.status,
      datetime: this.datetime,
    };
  }
}
