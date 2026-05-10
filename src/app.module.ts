import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { getDatabaseOptions } from './config/database.config';
import { CustomersModule } from './customers/customers.module';
import { CustomersController } from './customers/customers.controller';
import { LoginModule } from './login/login.module';
import { LogsModule } from './logs/logs.module';
import { LogsController } from './logs/logs.controller';
import { AuthMiddleware } from './middleware/auth.middleware';
import { User } from './users/user.entity';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseOptions(),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UsersModule,
    CustomersModule,
    LoginModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        AuthController,
        UsersController,
        CustomersController,
        LogsController,
      );
  }
}
