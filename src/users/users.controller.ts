import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  type AccessActor,
  resolveCreatorForWrite,
} from '../auth/access-context.util';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationScopeGuard } from '../auth/organization-scope.guard';
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
  organizationScope?: number;
};

@Controller('users')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest): Promise<UserDetailsResponse[]> {
    return this.usersService.findAll(this.toAccessActor(request));
  }

  @Post()
  create(
    @Body() user: CreateUserPayload,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.create(
      user,
      resolveCreatorForWrite(this.toAccessActor(request)),
    );
  }

  private toAccessActor(request: AuthenticatedRequest): AccessActor {
    const u = request.user;
    if (!u) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return {
      id: u.id,
      organizationId: u.organizationId,
      role: u.role,
      organizationScope: request.organizationScope,
    };
  }
}
