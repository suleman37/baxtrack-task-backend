import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function main() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Server running on Port ${port}`);
}

main();
