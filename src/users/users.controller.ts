import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
  CreateUserPayload,
  UserDetailsResponse,
  UserResponse,
} from './user.types';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
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
