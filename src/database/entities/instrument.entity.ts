import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Mirrors db/init/database.sql. */
@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 10 })
  ticker!: string;
  @Column({ type: 'varchar', length: 255 })
  name!: string;
  /** 'ACCIONES' | 'MONEDA' | ... */
  @Column({ type: 'varchar', length: 10 })
  type!: string;
}
