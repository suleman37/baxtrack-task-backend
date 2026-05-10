import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { getAppConfig } from './config/app.config';
import { AppModule } from './app.module';

async function main() {
  const config = getAppConfig();
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  app.enableCors({
    origin: config.corsOrigin,
  });
  const port = config.port;
  if (dataSource.isInitialized) {
    console.log('DB connected successfully');
  }
  await app.listen(port);
  console.log(`Server running on Port ${port}`);
}

main();
