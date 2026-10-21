import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Order as OrderEntity } from '../database/entities/order.entity';
import { User as UserEntity } from '../database/entities/user.entity';
import type { InstrumentQuote } from '../instruments/domain/instrumentQuote.valueObject';
import { InstrumentsService } from '../instruments/instruments.service';
import { Account, Portfolio } from './domain/account.aggregate';
import { OrderNotFoundError, UserNotFoundError } from './domain/errors';
import { Order } from './domain/order.domainEntity';
import type { TradeInput, TransferInput } from './domain/orderTicket.valueObject';
import { CreateUserDto } from './dto/createUser.dto';
import { toDomainOrder, toOrderRow } from './persistence/orderMapper';

@Injectable()
export class AccountsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly instruments: InstrumentsService,
  ) {}

  createUser(dto: CreateUserDto): Promise<UserEntity> {
    const repository = this.dataSource.getRepository(UserEntity);
    return repository.save(repository.create(dto));
  }

  /** BUY or SELL. Returns the saved order: FILLED, NEW or REJECTED. */
  placeTrade(userId: number, instrumentId: number, input: TradeInput): Promise<Order> {
    return this.submit(userId, instrumentId, (account, quote, now) =>
      account.placeTrade(input, quote, now),
    );
  }

  /** CASH_IN or CASH_OUT, on the cash instrument. Returns the saved order: FILLED or REJECTED. */
  transfer(userId: number, instrumentId: number, input: TransferInput): Promise<Order> {
    return this.submit(userId, instrumentId, (account, quote, now) =>
      account.transfer(input, quote, now),
    );
  }

  cancelOrder(orderId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const row = await manager.findOneBy(OrderEntity, { id: orderId });
      if (!row) throw new OrderNotFoundError(`Order ${orderId} not found`);

      const account = await this.loadAccount(manager, row.userId, { lock: true });
      return this.save(manager, account.cancel(orderId));
    });
  }

  async findOrder(orderId: number): Promise<Order> {
    const row = await this.dataSource.getRepository(OrderEntity).findOneBy({ id: orderId });
    if (!row) throw new OrderNotFoundError(`Order ${orderId} not found`);
    return toDomainOrder(row);
  }

  async listOrders(userId: number): Promise<Order[]> {
    await this.ensureUser(this.dataSource.manager, userId);
    return (await this.findUserOrders(this.dataSource.manager, userId)).map(toDomainOrder);
  }

  portfolio(userId: number): Promise<Portfolio> {
    return this.dataSource.transaction('REPEATABLE READ', async (manager: EntityManager) => {
      const account = await this.loadAccount(manager, userId, { lock: false });
      const ids = account.positions().map((p) => p.instrumentId);
      return account.portfolio(await this.instruments.findQuotes(ids, manager));
    });
  }

  /**
   * Builds the aggregate from all of the user's orders, as the spec asks.
   * Rejected and cancelled orders have no effect on balances but are loaded
   * so the aggregate can answer for any of its orders (e.g. refuse to cancel them).
   */
  private async loadAccount(
    manager: EntityManager,
    userId: number,
    { lock }: { lock: boolean },
  ): Promise<Account> {
    await this.ensureUser(manager, userId, lock);
    const rows = await this.findUserOrders(manager, userId);
    return Account.restore(userId, rows.map(toDomainOrder));
  }

  /**
   * Shared flow for anything that adds an order: lock and load the account,
   * read the price inside the same transaction, let the aggregate decide, save.
   */
  private submit(
    userId: number,
    instrumentId: number,
    decide: (account: Account, quote: InstrumentQuote, now: Date) => Order,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const account = await this.loadAccount(manager, userId, { lock: true });
      const quote = await this.instruments.findQuote(instrumentId, manager);
      return this.save(manager, decide(account, quote, new Date()));
    });
  }

  private async ensureUser(manager: EntityManager, userId: number, lock = false): Promise<void> {
    const user = await manager.findOne(UserEntity, {
      where: { id: userId },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!user) throw new UserNotFoundError(`User ${userId} not found`);
  }

  private findUserOrders(manager: EntityManager, userId: number): Promise<OrderEntity[]> {
    return manager.find(OrderEntity, { where: { userId }, order: { datetime: 'ASC', id: 'ASC' } });
  }

  private async save(manager: EntityManager, order: Order): Promise<Order> {
    const saved = await manager.save(OrderEntity, toOrderRow(order));
    return toDomainOrder(saved as OrderEntity);
  }
}