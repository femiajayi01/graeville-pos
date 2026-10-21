import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { AppConfig } from './configuration';

/**
 * Shared TypeORM options used by both the Nest app (TypeOrmModule) and the
 * TypeORM CLI (src/database/data-source.ts), so migrations and the app never drift.
 *
 * `synchronize` is deliberately off: the schema is owned by migrations.
 */
export const buildTypeOrmOptions = (
  db: AppConfig['database'],
): DataSourceOptions => ({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.name,
  logging: db.logging,
  synchronize: false,
  entities: [join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  migrationsTableName: 'migrations',
});
