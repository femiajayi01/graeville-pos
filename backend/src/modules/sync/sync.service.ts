import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppConfig } from '../../config/configuration';
import { SYNC_KEY_HEADER } from './guards/sync-api-key.guard';
import {
  SYNC_ENTITIES,
  SYNC_HANDLERS,
  SyncEntityName,
  SyncRecord,
} from './sync.handlers';

const BATCH_SIZE = 200;

export interface SyncRunResult {
  entity: SyncEntityName;
  direction: 'push' | 'pull';
  count: number;
  errors: { key?: string; message: string }[];
}

/**
 * Replicates data between a shop install ("local") and the online server.
 *
 *   local  ── push ──▶  POST {remote}/sync/inbound/:entity        (remote upserts, replies with accepted keys)
 *   local  ◀── pull ──  POST {remote}/sync/outbound/:entity       (remote returns its unsynced records)
 *                       POST {remote}/sync/outbound/:entity/ack   (local confirms, remote marks them synced)
 *
 * Laravel equivalent: ProductController@postSyncData / receiveSyncData, the Send*Online / Receive*Online
 * console commands, and the api/v1 get*Data / send*ToLocal routes.
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private running = false;
  private lastRun: { at: Date; results: SyncRunResult[] } | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private get settings(): AppConfig['sync'] {
    return this.config.getOrThrow<AppConfig['sync']>('sync');
  }

  assertEntity(entity: string): SyncEntityName {
    if (!(SYNC_ENTITIES as readonly string[]).includes(entity)) {
      throw new BadRequestException(
        `Unknown sync entity "${entity}". Use one of: ${SYNC_ENTITIES.join(', ')}`,
      );
    }
    return entity as SyncEntityName;
  }

  async status() {
    const pending = await Promise.all(
      SYNC_ENTITIES.map(async (entity) => {
        const table = this.dataSource.getMetadata(
          this.tableFor(entity),
        ).tableName;
        const [{ count }]: { count: number }[] = await this.dataSource.query(
          `SELECT COUNT(*)::int AS count FROM "${table}" WHERE synced = false`,
        );
        return { entity, pending: count };
      }),
    );
    return {
      remoteConfigured: Boolean(
        this.settings.remoteUrl && this.settings.apiKey,
      ),
      remoteUrl: this.settings.remoteUrl || null,
      cronEnabled: this.settings.cronEnabled,
      running: this.running,
      lastRun: this.lastRun,
      pending,
    };
  }

  // ───────────── server side (called by other installs) ─────────────

  async receive(entity: SyncEntityName, records: SyncRecord[]) {
    const handler = SYNC_HANDLERS[entity];
    const accepted: string[] = [];
    const errors: { key?: string; message: string }[] = [];
    for (const record of records) {
      try {
        // One transaction per record so a bad row doesn't roll back the whole batch.
        accepted.push(
          await this.dataSource.transaction((m) => handler.upsert(m, record)),
        );
      } catch (error) {
        errors.push({
          key: String(record?.[handler.key] ?? ''),
          message: (error as Error).message,
        });
      }
    }
    return { accepted, errors };
  }

  async outbound(entity: SyncEntityName) {
    return {
      records: await SYNC_HANDLERS[entity].loadUnsynced(
        this.dataSource.manager,
        BATCH_SIZE,
      ),
    };
  }

  async acknowledge(entity: SyncEntityName, keys: string[]) {
    await SYNC_HANDLERS[entity].markSynced(this.dataSource.manager, keys);
    return { acknowledged: keys.length };
  }

  // ───────────── client side (this install talks to the remote) ─────────────

  async push(entity: SyncEntityName): Promise<SyncRunResult> {
    const handler = SYNC_HANDLERS[entity];
    const result: SyncRunResult = {
      entity,
      direction: 'push',
      count: 0,
      errors: [],
    };

    // Loop in batches until nothing is left (or the remote stops accepting records).
    for (let round = 0; round < 1000; round++) {
      const records = await handler.loadUnsynced(
        this.dataSource.manager,
        BATCH_SIZE,
      );
      if (!records.length) break;

      const response = await this.callRemote<{
        accepted: string[];
        errors: SyncRunResult['errors'];
      }>(`/sync/inbound/${entity}`, { records });
      await handler.markSynced(this.dataSource.manager, response.accepted);
      result.count += response.accepted.length;
      result.errors.push(...response.errors);
      if (response.accepted.length === 0) break;
    }
    return result;
  }

  async pull(entity: SyncEntityName): Promise<SyncRunResult> {
    const result: SyncRunResult = {
      entity,
      direction: 'pull',
      count: 0,
      errors: [],
    };
    for (let round = 0; round < 1000; round++) {
      const { records } = await this.callRemote<{ records: SyncRecord[] }>(
        `/sync/outbound/${entity}`,
        {},
      );
      if (!records.length) break;

      const { accepted, errors } = await this.receive(entity, records);
      result.errors.push(...errors);
      if (!accepted.length) break;
      await this.callRemote(`/sync/outbound/${entity}/ack`, { keys: accepted });
      result.count += accepted.length;
    }
    return result;
  }

  /** Push everything, then pull everything (what the Laravel scheduler did every minute). */
  async runAll(): Promise<SyncRunResult[]> {
    if (this.running)
      throw new ServiceUnavailableException('A sync is already running');
    this.running = true;
    const results: SyncRunResult[] = [];
    try {
      for (const entity of SYNC_ENTITIES) results.push(await this.push(entity));
      for (const entity of SYNC_ENTITIES) results.push(await this.pull(entity));
      this.lastRun = { at: new Date(), results };
      return results;
    } finally {
      this.running = false;
    }
  }

  private async callRemote<T>(path: string, body: unknown): Promise<T> {
    const { remoteUrl, apiKey } = this.settings;
    if (!remoteUrl || !apiKey) {
      throw new ServiceUnavailableException(
        'Online sync is not configured (set SYNC_REMOTE_URL and SYNC_API_KEY)',
      );
    }
    let response: Response;
    try {
      response = await fetch(`${remoteUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [SYNC_KEY_HEADER]: apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      this.logger.warn(
        `Sync request to ${path} failed: ${(error as Error).message}`,
      );
      throw new BadGatewayException(
        'Cannot reach the online server. Check the internet connection.',
      );
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new BadGatewayException(
        `Online server responded ${response.status}: ${text.slice(0, 200)}`,
      );
    }
    return (await response.json()) as T;
  }

  private tableFor(entity: SyncEntityName) {
    return {
      users: 'User',
      brands: 'Brand',
      categories: 'Category',
      customers: 'Customer',
      products: 'Product',
      orders: 'Order',
    }[entity];
  }
}
