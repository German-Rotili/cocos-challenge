import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Instrument } from './instrument.entity';
import { User } from './user.entity';
import { decimalTransformer } from '../../shared/persistence/transformers';
export type OrderSide = 'BUY' | 'SELL' | 'CASH_IN' | 'CASH_OUT';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus = 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';

@Entity('orders')
@Index(['userId', 'datetime', 'id'])
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'int' })
  userId!: number;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
  @Column({ type: 'int' })
  instrumentId!: number;
  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentId' })
  instrument!: Instrument;
  @Column({ type: 'varchar', length: 10 })
  side!: OrderSide;
  @Column({ type: 'varchar', length: 10 })
  type!: OrderType;
  @Column({ type: 'varchar', length: 20 })
  status!: OrderStatus;
  @Column({ type: 'int' })
  size!: number;
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  price!: number | null;
  @Column({ type: 'timestamp' })
  datetime!: Date;
}
