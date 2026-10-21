import { IsEmail, IsString, Length } from 'class-validator';
import type { User as UserEntity } from '../../database/entities/user.entity';

// ---------- Request ----------

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 20)
  accountNumber!: string;
}

// ---------- Response ----------

export class UserResponse {
  id!: number;
  email!: string;
  accountNumber!: string;
}

export function toUserResponse(row: UserEntity): UserResponse {
  return { id: row.id, email: row.email, accountNumber: row.accountNumber };
}
