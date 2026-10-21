import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';
import { buildTypeOrmOptions } from '../config/typeorm.config';

/**
 * DataSource used by the TypeORM CLI (migrations) and the seeder.
 * Reads the same .env file as the application.
 */
loadEnv();

export default new DataSource(buildTypeOrmOptions(configuration().database));
