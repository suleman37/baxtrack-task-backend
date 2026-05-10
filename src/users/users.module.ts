import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogsModule } from '../logs/logs.module';
import { OrganizationScopeGuard } from '../auth/organization-scope.guard';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), LogsModule],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard, OrganizationScopeGuard],
})
export class UsersModule {}
