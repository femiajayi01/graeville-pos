import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  Terminal,
  TERMINAL_HEADER,
} from '../../common/decorators/terminal.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreatePackingDto } from './dto/create-packing.dto';
import { PackingsService } from './packings.service';

@ApiTags('Parked sales')
@ApiBearerAuth()
@ApiHeader({
  name: TERMINAL_HEADER,
  required: false,
  description: 'Till identifier',
})
@Controller('packings')
export class PackingsController {
  constructor(private readonly packingsService: PackingsService) {}

  @Get()
  findAll(@Terminal() terminal: string) {
    return this.packingsService.findForTerminal(terminal);
  }

  @Get('count')
  async count(@Terminal() terminal: string) {
    return { count: await this.packingsService.countForTerminal(terminal) };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packingsService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreatePackingDto,
    @CurrentUser() user: AuthUser,
    @Terminal() terminal: string,
  ) {
    return this.packingsService.create(dto, user, terminal);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.packingsService.remove(id);
  }
}
