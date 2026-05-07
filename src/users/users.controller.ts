import { Body, Controller, Post } from '@nestjs/common';
import type { CreateUserPayload, UserResponse } from './user.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() user: CreateUserPayload): Promise<UserResponse> {
    return this.usersService.create(user);
  }
}
