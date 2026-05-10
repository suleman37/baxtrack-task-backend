import {
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import {
  getAccessActorOrThrow,
  resolveCreatorForWrite,
} from '../common/auth/access-context.util';
import type {
  CreateUserPayload,
  UserDetailsResponse,
  UserResponse,
} from '../types/users/user.types';
import type { AuthenticatedRequest } from '../types/http/authenticated-request.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest): Promise<UserDetailsResponse[]> {
    return this.usersService.findAll(getAccessActorOrThrow(request));
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
