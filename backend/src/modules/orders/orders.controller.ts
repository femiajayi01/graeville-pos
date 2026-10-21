import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  Terminal,
  TERMINAL_HEADER,
} from '../../common/decorators/terminal.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MANAGER_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CheckoutDto } from './dto/checkout.dto';
import { EmailReceiptDto } from './dto/email-receipt.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders (sales)')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiHeader({
    name: TERMINAL_HEADER,
    required: false,
    description: 'Till identifier',
  })
  checkout(
    @Body() dto: CheckoutDto,
    @CurrentUser() user: AuthUser,
    @Terminal() terminal: string,
  ) {
    return this.ordersService.checkout(dto, user, terminal);
  }

  @Get()
  @Roles(...MANAGER_ROLES)
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('mine/today')
  findMineToday(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.findMineToday(user, query);
  }

  @Get('mine/recent')
  findMineRecent(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.findMineRecent(user, query);
  }

  @Get('number/:orderNumber')
  findByNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/return')
  @Roles(...MANAGER_ROLES)
  @HttpCode(200)
  returnOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.returnOrder(id, user);
  }

  @Post(':id/email-receipt')
  @HttpCode(200)
  emailReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EmailReceiptDto,
  ) {
    return this.ordersService.emailReceipt(id, dto.email);
  }
}
