import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateUserDto } from './dto/createUser.dto';
import { OrderResponse, toOrderResponse } from './orderResponse';
import { PortfolioResponse, toPortfolioResponse } from './portfolioResponse';

export interface UserResponse {
  id: number;
  email: string;
  accountNumber: string;
}

/** A user and their account are one-to-one, so account resources hang off /users/:id. */
@Controller('users')
export class UsersController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    const user = await this.accounts.createUser(dto);
    return { id: user.id, email: user.email, accountNumber: user.accountNumber };
  }

  @Get(':id/orders')
  async orders(@Param('id', ParseIntPipe) id: number): Promise<OrderResponse[]> {
    return (await this.accounts.listOrders(id)).map(toOrderResponse);
  }

  @Get(':id/portfolio')
  async portfolio(@Param('id', ParseIntPipe) id: number): Promise<PortfolioResponse> {
    return toPortfolioResponse(await this.accounts.portfolio(id));
  }
}
