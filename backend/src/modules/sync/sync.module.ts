import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncScheduler } from './sync.scheduler';
import { SyncService } from './sync.service';
import { SyncApiKeyGuard } from './guards/sync-api-key.guard';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SyncScheduler, SyncApiKeyGuard],
})
export class SyncModule {}
