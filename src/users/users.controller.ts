import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  getAccessActorOrThrow,
  resolveCreatorForWrite,
} from '../common/auth/access-context.util';
import { parsePaginationQuery } from '../common/utils/pagination.util';
import type {
  CreateUserPayload,
  PaginatedUsersResponse,
  UserResponse,
} from '../types/users/user.types';
import type { AuthenticatedRequest } from '../types/http/authenticated-request.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<PaginatedUsersResponse> {
    return this.usersService.findAll(
      getAccessActorOrThrow(request),
      parsePaginationQuery(page, limit),
    );
  }

  @Post()
  create(
    @Body() user: CreateUserPayload,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.create(
      user,
      resolveCreatorForWrite(getAccessActorOrThrow(request)),
    );
  }
}
