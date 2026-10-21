import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from './common/decorators/public.decorator';
import { SettingsService } from './modules/settings/settings.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly settings: SettingsService,
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get('health')
  async health() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', time: new Date().toISOString() };
  }

  /** Product + store details shown on the login page, header and receipts. */
  @Public()
  @Get('store-info')
  storeInfo() {
    return this.settings.getPublicInfo();
  }
}
