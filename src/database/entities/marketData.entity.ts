import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Instrument } from './instrument.entity';
import { decimalTransformer } from '../../shared/persistence/transformers';

const price = {
  type: 'numeric',
  precision: 10,
  scale: 2,
  transformer: decimalTransformer,
} as const;

@Entity('marketdata')
@Index(['instrumentId', 'datetime', 'id'])
export class MarketData {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'int' })
  instrumentId!: number;
  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentId' })
  instrument!: Instrument;
  @Column({ ...price, nullable: true })
  high!: number | null;
  @Column({ ...price, nullable: true })
  low!: number | null;
  @Column({ ...price, nullable: true })
  open!: number | null;
  @Column(price)
  close!: number;
  @Column(price)
  previousClose!: number;
  @Column({ type: 'timestamp' })
  datetime!: Date;
}
