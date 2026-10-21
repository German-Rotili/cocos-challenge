import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Mirrors db/init/database.sql. */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 255 })
  email!: string;
  @Column({ type: 'varchar', length: 20 })
  accountNumber!: string;
}
