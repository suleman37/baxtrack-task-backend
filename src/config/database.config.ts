import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Pool } from 'pg';
import type { DataSourceOptions } from 'typeorm';

try {
  process.loadEnvFile?.();
} catch (error) {
  console.warn('Unable to load .env file automatically.', error);
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

function getDatabaseSslConfig() {
  return {
    rejectUnauthorized: false,
  };
}

function getDatabaseConnectionString(): string {
  const connectionString = getRequiredEnv('DATABASE_URL');

  try {
    const normalizedUrl = new URL(connectionString);
    normalizedUrl.searchParams.delete('sslmode');
    normalizedUrl.searchParams.delete('uselibpqcompat');
    return normalizedUrl.toString();
  } catch {
    return connectionString;
  }
}

export const databaseConnectionProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: () => {
    return new Pool({
      connectionString: getDatabaseConnectionString(),
      ssl: getDatabaseSslConfig(),
    });
  },
};

export function getDatabaseOptions(): TypeOrmModuleOptions & DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL;

  if (typeof databaseUrl === 'string' && databaseUrl.length > 0) {
    return {
      type: 'postgres',
      url: getDatabaseConnectionString(),
      ssl: getDatabaseSslConfig(),
      autoLoadEntities: true,
      synchronize: false,
    };
  }

  return {
    type: 'postgres',
    host: getRequiredEnv('DB_HOST'),
    port: Number(getRequiredEnv('DB_PORT')),
    username: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    database: getRequiredEnv('DB_NAME'),
    autoLoadEntities: true,
    synchronize: false,
  };
}
