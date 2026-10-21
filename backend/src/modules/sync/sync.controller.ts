import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MANAGER_ROLES } from '../../common/enums/role.enum';
import { SyncAckDto, SyncBatchDto } from './dto/sync-batch.dto';
import { SYNC_KEY_HEADER, SyncApiKeyGuard } from './guards/sync-api-key.guard';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // ── Admin actions on this install (Laravel: /sync page) ──

  @Get('status')
  @ApiBearerAuth()
  status() {
    return this.syncService.status();
  }

  @Post('run')
  @ApiBearerAuth()
  @Roles(...MANAGER_ROLES)
  @HttpCode(200)
  runAll() {
    return this.syncService.runAll();
  }

  @Post('push/:entity')
  @ApiBearerAuth()
  @HttpCode(200)
  push(@Param('entity') entity: string) {
    return this.syncService.push(this.syncService.assertEntity(entity));
  }

  @Post('pull/:entity')
  @ApiBearerAuth()
  @HttpCode(200)
  pull(@Param('entity') entity: string) {
    return this.syncService.pull(this.syncService.assertEntity(entity));
  }

  // ── Server-to-server endpoints (called by other installs with X-Sync-Key) ──

  @Public()
  @UseGuards(SyncApiKeyGuard)
  @ApiHeader({ name: SYNC_KEY_HEADER, required: true })
  @Post('inbound/:entity')
  @HttpCode(200)
  inbound(@Param('entity') entity: string, @Body() dto: SyncBatchDto) {
    return this.syncService.receive(
      this.syncService.assertEntity(entity),
      dto.records,
    );
  }

  @Public()
  @UseGuards(SyncApiKeyGuard)
  @ApiHeader({ name: SYNC_KEY_HEADER, required: true })
  @Post('outbound/:entity')
  @HttpCode(200)
  outbound(@Param('entity') entity: string) {
    return this.syncService.outbound(this.syncService.assertEntity(entity));
  }

  @Public()
  @UseGuards(SyncApiKeyGuard)
  @ApiHeader({ name: SYNC_KEY_HEADER, required: true })
  @Post('outbound/:entity/ack')
  @HttpCode(200)
  acknowledge(@Param('entity') entity: string, @Body() dto: SyncAckDto) {
    return this.syncService.acknowledge(
      this.syncService.assertEntity(entity),
      dto.keys,
    );
  }
}
