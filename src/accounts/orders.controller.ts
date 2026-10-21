import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import type { TradeSide } from './domain/order.domainEntity';
import type { TradeInput } from './domain/orderTicket.valueObject';
import { OrderResponse, SendOrderDto, toOrderResponse } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly accounts: AccountsService) {}

  /**
   * One endpoint for every kind of order, as the spec models transfers as orders.
   * 201 for every saved order, including REJECTED ones: a rejection is a result, not an error.
   */
  @Post()
  async send(@Body() dto: SendOrderDto): Promise<OrderResponse> {
    if (dto.size !== undefined && dto.budget !== undefined) {
      throw new BadRequestException('Send either size or budget, not both');
    }
    const { userId, instrumentId, side } = dto;

    if (side === 'CASH_IN' || side === 'CASH_OUT') {
      if (dto.size === undefined) {
        throw new BadRequestException(
          'Transfers are sent with size: the number of pesos',
        );
      }
      return toOrderResponse(
        await this.accounts.transfer(userId, instrumentId, {
          side,
          size: dto.size,
        }),
      );
    }

    const order = await this.accounts.placeTrade(
      userId,
      instrumentId,
      toTradeInput(dto, side),
    );

    return toOrderResponse(order);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderResponse> {
    return toOrderResponse(await this.accounts.findOrder(id));
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number): Promise<OrderResponse> {
    return toOrderResponse(await this.accounts.cancelOrder(id));
  }
}

/** A MARKET order drops any price it was sent; the last close is used instead. */
function toTradeInput(dto: SendOrderDto, side: TradeSide): TradeInput {
  if (dto.type === 'LIMIT') {
    const price = dto.price as number;
    return dto.size !== undefined
      ? { side, type: 'LIMIT', price, size: dto.size }
      : { side, type: 'LIMIT', price, budget: dto.budget as number };
  }
  return dto.size !== undefined
    ? { side, type: 'MARKET', size: dto.size }
    : { side, type: 'MARKET', budget: dto.budget as number };
}
