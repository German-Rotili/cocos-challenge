import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', unique: true })
  ticker!: string;
  @Column({ type: 'varchar' })
  name!: string;
  /** 'ACCION' | 'MONEDA' | ... */
  @Column({ type: 'varchar' })
  type!: string;
}