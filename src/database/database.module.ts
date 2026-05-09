import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getDatabaseOptions } from './database.config';
import './patch-pg-client-query';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseOptions(),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Database configuration is missing.');
        }

        const dataSource = new DataSource(options);
        await dataSource.initialize();
        console.log('DB Connected successfully');
        return dataSource;
      },
    }),
  ],
})
export class DatabaseModule {}
