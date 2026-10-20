import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', unique: true })
  email!: string;
  @Column({ type: 'varchar', unique: true })
  accountNumber!: string;
}
