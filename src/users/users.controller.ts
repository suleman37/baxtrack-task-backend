import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UserRole } from '../enums/user-role.enum';
import type {
  CreateUserPayload,
  UserDetailsResponse,
  UserResponse,
} from './user.types';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    organizationId?: number | null;
    role?: UserRole | null;
  };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest): Promise<UserDetailsResponse[]> {
    return this.usersService.findAll(request.user?.id);
  }

  @Post()
  create(
    @Body() user: CreateUserPayload,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.create(user, request.user);
  }
}
