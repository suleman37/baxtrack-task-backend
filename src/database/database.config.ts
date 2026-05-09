import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
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

export function getDatabaseOptions(): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'postgres',
    host: getRequiredEnv('DB_HOST'),
    port: Number(getRequiredEnv('DB_PORT')),
    username: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    database: getRequiredEnv('DB_NAME'),
    autoLoadEntities: true,
    synchronize: true,
  };
}
