import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  Terminal,
  TERMINAL_HEADER,
} from '../../common/decorators/terminal.decorator';
import { MANAGER_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CloseDayQueryDto } from './dto/close-day-query.dto';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiHeader({ name: TERMINAL_HEADER, required: false })
  dashboard(@CurrentUser() user: AuthUser, @Terminal() terminal: string) {
    return this.reportsService.dashboard(user, terminal);
  }

  @Get('close-day')
  closeDay(@Query() query: CloseDayQueryDto, @CurrentUser() user: AuthUser) {
    return this.reportsService.closeDay(query, user);
  }

  @Get('sales')
  @Roles(...MANAGER_ROLES)
  sales(@Query() query: SalesReportQueryDto) {
    return this.reportsService.sales(query);
  }

  @Get('out-of-stock')
  @Roles(...MANAGER_ROLES)
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Include products with stock <= threshold',
  })
  outOfStock(
    @Query('threshold', new DefaultValuePipe(0), ParseIntPipe)
    threshold: number,
  ) {
    return this.reportsService.outOfStock(threshold);
  }
}
