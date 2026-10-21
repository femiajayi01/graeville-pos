import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Records that are replicated to/from the online store.
 * Replaces the Laravel `sync` string column ("on"/"off") with a boolean:
 * `synced = false` means "changed locally, not yet pushed".
 */
export abstract class SyncableEntity extends BaseEntity {
  @Index()
  @Column({ type: 'boolean', default: false })
  synced: boolean;
}
