/**
 * Typed application configuration.
 * Every value comes from environment variables (see .env.example) so nothing
 * environment-specific is hard-coded in the source.
 */
export interface AppConfig {
  /** Product name (Swagger title, e-mail sender name fallback). */
  appName: string;
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  timezone: string;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    logging: boolean;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    defaultUserPassword: string;
  };
  /**
   * Initial store details. They are copied into the store_settings table the first time
   * the API runs; after that, edit them in the app (Administration → Store settings).
   */
  store: {
    name: string;
    address: string;
    phone: string;
    email: string;
    receiptFooter: string;
    currency: string;
  };
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };
  sync: {
    remoteUrl: string;
    apiKey: string;
    cronEnabled: boolean;
  };
}

const bool = (value: string | undefined, fallback = false): boolean =>
  value === undefined || value === ''
    ? fallback
    : ['true', '1', 'yes'].includes(value.toLowerCase());

export default (): AppConfig => ({
  appName: process.env.APP_NAME ?? 'Graeville POS',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  timezone: process.env.APP_TIMEZONE ?? 'Africa/Lagos',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'graeville_pos',
    logging: bool(process.env.DB_LOGGING),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
    defaultUserPassword: process.env.DEFAULT_USER_PASSWORD ?? 'ChangeMe123',
  },
  store: {
    name: process.env.STORE_NAME ?? 'Mecca Beauty',
    address: process.env.STORE_ADDRESS ?? '',
    phone: process.env.STORE_PHONE ?? '',
    email: process.env.STORE_EMAIL ?? '',
    receiptFooter: process.env.STORE_RECEIPT_FOOTER ?? '',
    currency: process.env.STORE_CURRENCY ?? 'NGN',
  },
  mail: {
    host: process.env.MAIL_HOST ?? '',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: bool(process.env.MAIL_SECURE),
    user: process.env.MAIL_USER ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'no-reply@localhost',
  },
  sync: {
    remoteUrl: (process.env.SYNC_REMOTE_URL ?? '').replace(/\/+$/, ''),
    apiKey: process.env.SYNC_API_KEY ?? '',
    cronEnabled: bool(process.env.SYNC_CRON_ENABLED),
  },
});
