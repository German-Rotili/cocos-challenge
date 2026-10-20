import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order as OrderEntity } from '../database/entities/order.entity';
import { User as UserEntity } from '../database/entities/user.entity';
import { InstrumentsModule } from '../instruments/instruments.module';
import { AccountsService } from './accounts.service';
import { OrdersController } from './orders.controller';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, OrderEntity]), InstrumentsModule],
  controllers: [OrdersController, UsersController],
  providers: [AccountsService],
})
export class AccountsModule {}
