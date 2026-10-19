import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Instrument } from './instrument.entity';
import { decimalTransformer } from './transformers';
@Entity('marketdata')
@Index(['instrumentId', 'datetime'])
export class MarketData {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'int' })
  instrumentId!: number;
  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentId' })
  instrument!: Instrument;
  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: decimalTransformer })
  high!: number;
  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: decimalTransformer })
  low!: number;
  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: decimalTransformer })
  open!: number;
  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: decimalTransformer })
  close!: number;
  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: decimalTransformer })
  previousClose!: number;
  @Column({ type: 'timestamp' })
  datetime!: Date;
}