import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

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
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: getRequiredEnv('DB_HOST'),
        port: Number(getRequiredEnv('DB_PORT')),
        username: getRequiredEnv('DB_USER'),
        password: getRequiredEnv('DB_PASSWORD'),
        database: getRequiredEnv('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Database configuration is missing.');
        }

        const dataSource = new DataSource(options as DataSourceOptions);
        await dataSource.initialize();
        console.log('DB Connected successfully');
        return dataSource;
      },
    }),
  ],
})
export class DatabaseModule {}
