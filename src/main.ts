import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getAppConfig } from './config/app.config';
import { AppModule } from './app.module';

async function main() {
  const config = getAppConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: config.corsOrigin,
  });
  const port = config.port;
  await app.listen(port);
  console.log(`Server running on Port ${port}`);
}

main();
