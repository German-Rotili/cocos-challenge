import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { OrderResponse, toOrderResponse } from './dto/order.dto';
import { PortfolioResponse, toPortfolioResponse } from './dto/portfolio.dto';
import { CreateUserDto, toUserResponse, UserResponse } from './dto/user.dto';

/** A user and their account are one-to-one, so account resources hang off /users/:id. */
@Controller('users')
export class UsersController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return toUserResponse(await this.accounts.createUser(dto));
  }

  @Get(':id/orders')
  async orders(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OrderResponse[]> {
    return (await this.accounts.listOrders(id)).map(toOrderResponse);
  }

  @Get(':id/portfolio')
  async portfolio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PortfolioResponse> {
    return toPortfolioResponse(await this.accounts.portfolio(id));
  }
}
