import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfig } from '../../config/configuration';
import { SyncService } from './sync.service';

/** Runs a full push + pull every minute when SYNC_CRON_ENABLED=true (Laravel: Console\Kernel::schedule). */
@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handle() {
    const { cronEnabled, remoteUrl, apiKey } =
      this.config.getOrThrow<AppConfig['sync']>('sync');
    if (!cronEnabled || !remoteUrl || !apiKey) return;
    if ((await this.syncService.status()).running) return;
    try {
      const results = await this.syncService.runAll();
      const moved = results
        .filter((r) => r.count > 0)
        .map((r) => `${r.direction} ${r.entity}: ${r.count}`);
      if (moved.length) this.logger.log(`Sync complete — ${moved.join(', ')}`);
    } catch (error) {
      this.logger.warn(`Scheduled sync skipped: ${(error as Error).message}`);
    }
  }
}
