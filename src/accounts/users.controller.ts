import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { mapPage, PaginationQueryDto } from '../shared/http/pagination.dto';
import { AccountsService } from './accounts.service';
import { OrderPage, toOrderResponse } from './dto/order.dto';
import { PortfolioResponse, toPortfolioResponse } from './dto/portfolio.dto';
import { CreateUserDto, toUserResponse, UserResponse } from './dto/user.dto';

/** A user and their account are one-to-one, so account resources hang off /users/:id. */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return toUserResponse(await this.accounts.createUser(dto));
  }

  /** Oldest first. */
  @Get(':id/orders')
  async orders(
    @Param('id', ParseIntPipe) id: number,
    @Query() page: PaginationQueryDto,
  ): Promise<OrderPage> {
    return mapPage(await this.accounts.listOrders(id, page), toOrderResponse);
  }

  @Get(':id/portfolio')
  async portfolio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PortfolioResponse> {
    return toPortfolioResponse(await this.accounts.portfolio(id));
  }
}
