import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsModule } from '../logs/logs.module';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), LogsModule],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
