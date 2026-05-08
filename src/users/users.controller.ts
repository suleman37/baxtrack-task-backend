import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import type {
  CreateUserPayload,
  UserDetailsResponse,
  UserResponse,
} from './user.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<UserDetailsResponse[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDetailsResponse> {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() user: CreateUserPayload): Promise<UserResponse> {
    return this.usersService.create(user);
  }
}
